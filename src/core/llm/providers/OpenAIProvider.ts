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
    protected getProviderName(): string {
        return 'openai';
    }

    /**
     * Build request headers for OpenAI API.
     */
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

    /**
     * Build request body for OpenAI chat completions API.
     */
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

        // Note: OpenAI o1 models have implicit reasoning/thinking
        // For other models, reasoning is not directly supported via API

        if (temperature !== undefined) {
            body.temperature = temperature;
        }
        if (maxTokens !== undefined) {
            body.max_tokens = maxTokens;
        }

        return body;
    }

    /**
     * Get the chat completions endpoint URL.
     */
    private getCompletionsEndpoint(config: LLMConfig): string {
        return `${config.baseUrl}/chat/completions`;
    }

    /**
     * Get the models endpoint URL.
     */
    private getModelsEndpoint(config: LLMConfig): string {
        return `${config.baseUrl}/models`;
    }

    /**
     * Parse a streaming chunk from OpenAI SSE format.
     */
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
     * Handles the full API call and yields parsed chunks.
     */
    protected async *streamCompletion(
        request: LLMRequest
    ): AsyncGenerator<LLMStreamChunk, void, unknown> {
        const { llmConfig, messages, model, temperature, maxTokens, signal } = request;
        const actualModel = model || llmConfig.defaultModel;

        console.log(`[${this.getProviderName()}] Starting streamCompletion`, {
            model: actualModel,
            messageCount: messages.length,
        });

        const response = await fetch(this.getCompletionsEndpoint(llmConfig), {
            method: 'POST',
            headers: this.buildHeaders(llmConfig),
            body: JSON.stringify(
                this.buildRequestBody(messages, actualModel, true, temperature, maxTokens)
            ),
            signal: signal || createTimeoutSignal(TIMEOUTS.LLM_REQUEST),
        });

        if (!response.ok) {
            throw await this.handleErrorResponse(response);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new LLMError(
                'No response body',
                LLMErrorCode.UNKNOWN,
                'openai'
            );
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
    }

    /**
     * Fetch available models from OpenAI.
     */
    async fetchModels(llmConfig: LLMConfig): Promise<string[]> {
        console.log(`[${this.getProviderName()}] Fetching models from`, this.getModelsEndpoint(llmConfig));

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
            console.log(`[${this.getProviderName()}] Models fetched`);

            return (data.data || [])
                .filter((m: any) => m.id && !m.id.includes('embedding'))
                .map((m: any) => m.id)
                .sort();
        } catch (error) {
            console.error(`[${this.getProviderName()}] fetchModels error:`, error);
            if (error instanceof LLMError) throw error;
            throw this.wrapError(error);
        }
    }

    /**
     * Test connection to OpenAI API.
     */
    async testConnection(llmConfig: LLMConfig): Promise<boolean> {
        console.log(`[${this.getProviderName()}] Testing connection to`, this.getModelsEndpoint(llmConfig));

        try {
            const response = await fetch(this.getModelsEndpoint(llmConfig), {
                method: 'GET',
                headers: this.buildHeaders(llmConfig),
                signal: createTimeoutSignal(TIMEOUTS.CONNECTION_TEST),
            });
            console.log(`[${this.getProviderName()}] Connection test result:`, response.ok);
            return response.ok;
        } catch (error) {
            console.log(`[${this.getProviderName()}] Test connection error:`, error);
            return false;
        }
    }
}

export const openAIProvider = new OpenAIProvider();
