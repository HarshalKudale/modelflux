import { fetch } from 'expo/fetch';
import { TIMEOUTS } from '../../../config/constants';
import { LLMConfig } from '../../types';
import { ChatMessage, LLMError, LLMErrorCode, LLMRequest, LLMStreamChunk } from '../types';
import { BaseLLMProvider, createTimeoutSignal } from './BaseProvider';

/**
 * OpenAI Provider
 * 
 * Handles API calls to OpenAI and OpenAI-compatible APIs using expo/fetch.
 * Supports streaming via Server-Sent Events (SSE).
 */
export class OpenAIProvider extends BaseLLMProvider {
    // AbortController for cancelling active requests
    private currentController: AbortController | null = null;

    protected getProviderName(): string {
        return 'openai';
    }

    /**
     * Interrupt active generation by aborting the HTTP request.
     */
    public interrupt(): void {
        console.log('[OpenAIProvider] Interrupting...');
        if (this.currentController) {
            this.currentController.abort();
            this.currentController = null;
        }
    }

    private buildHeaders(config: LLMConfig): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (config.apiKey) {
            headers['Authorization'] = `Bearer ${config.apiKey}`;
        }
        if (config.headers) {
            Object.assign(headers, config.headers);
        }
        return headers;
    }

    private buildRequestBody(
        messages: ChatMessage[],
        model: string,
        stream: boolean,
        temperature?: number,
        maxTokens?: number
    ): Record<string, unknown> {
        const body: Record<string, unknown> = {
            model,
            messages,
            stream,
        };
        if (temperature !== undefined) {
            body.temperature = temperature;
        }
        if (maxTokens !== undefined) {
            body.max_tokens = maxTokens;
        }
        return body;
    }

    private getCompletionsEndpoint(config: LLMConfig): string {
        return `${config.baseUrl}/chat/completions`;
    }

    private getModelsEndpoint(config: LLMConfig): string {
        return `${config.baseUrl}/models`;
    }

    private parseStreamChunk(chunk: string): LLMStreamChunk | null {
        const trimmed = chunk.trim();
        if (!trimmed || !trimmed.startsWith('data:')) return null;

        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') {
            return { content: '', done: true };
        }

        try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            const finishReason = parsed.choices?.[0]?.finish_reason;

            return {
                content: delta,
                done: finishReason === 'stop',
                usage: parsed.usage
                    ? {
                        promptTokens: parsed.usage.prompt_tokens,
                        completionTokens: parsed.usage.completion_tokens,
                        totalTokens: parsed.usage.total_tokens,
                    }
                    : undefined,
            };
        } catch {
            return null;
        }
    }

    /**
     * Stream completion from OpenAI API.
     */
    protected async *streamCompletion(
        request: LLMRequest
    ): AsyncGenerator<LLMStreamChunk, void, unknown> {
        const { llmConfig, messages, model, temperature, maxTokens } = request;
        const actualModel = model || llmConfig.defaultModel;

        console.log(`[${this.getProviderName()}] Starting streamCompletion`, {
            model: actualModel,
            messageCount: messages.length,
        });

        // Create AbortController for this request
        this.currentController = new AbortController();

        try {
            const response = await fetch(this.getCompletionsEndpoint(llmConfig), {
                method: 'POST',
                headers: this.buildHeaders(llmConfig),
                body: JSON.stringify(
                    this.buildRequestBody(messages, actualModel, true, temperature, maxTokens)
                ),
                signal: this.currentController.signal,
            });

            if (!response.ok) {
                throw await this.handleErrorResponse(response);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new LLMError('No response body', LLMErrorCode.UNKNOWN, 'openai');
            }

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const chunk = this.parseStreamChunk(line);
                    if (chunk) {
                        yield chunk;
                        if (chunk.done) {
                            return;
                        }
                    }
                }
            }
        } finally {
            this.currentController = null;
        }
    }

    async fetchModels(llmConfig: LLMConfig): Promise<string[]> {
        console.log(`[${this.getProviderName()}] Fetching models`);

        try {
            const response = await fetch(this.getModelsEndpoint(llmConfig), {
                method: 'GET',
                headers: this.buildHeaders(llmConfig),
                signal: createTimeoutSignal(TIMEOUTS.MODEL_FETCH),
            });

            if (!response.ok) {
                throw await this.handleErrorResponse(response);
            }

            const data = await response.json();
            return (data.data || [])
                .filter((m: any) => m.id && !m.id.includes('embedding'))
                .map((m: any) => m.id)
                .sort();
        } catch (error) {
            if (error instanceof LLMError) throw error;
            throw this.wrapError(error);
        }
    }

    async testConnection(llmConfig: LLMConfig): Promise<boolean> {
        try {
            const response = await fetch(this.getModelsEndpoint(llmConfig), {
                method: 'GET',
                headers: this.buildHeaders(llmConfig),
                signal: createTimeoutSignal(TIMEOUTS.CONNECTION_TEST),
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}

export const openAIProvider = new OpenAIProvider();
