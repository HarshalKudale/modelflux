import { fetch } from 'expo/fetch';
import { TIMEOUTS } from '../../../config/constants';
import { LLMConfig } from '../../types';
import { ChatMessage, LLMError, LLMErrorCode, LLMRequest, LLMStreamChunk } from '../types';
import { BaseLLMProvider, createTimeoutSignal } from './BaseProvider';

/**
 * Ollama Provider
 * 
 * Handles API calls to Ollama server using expo/fetch for streaming support.
 * Uses the Ollama chat API at /api/chat for completions.
 */
export class OllamaProvider extends BaseLLMProvider {
    protected getProviderName(): string {
        return 'ollama';
    }

    /**
     * Build request headers for Ollama API.
     */
    private buildHeaders(config: LLMConfig): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (config.headers) {
            Object.assign(headers, config.headers);
        }

        return headers;
    }

    /**
     * Build request body for Ollama chat API.
     */
    private buildRequestBody(
        messages: ChatMessage[],
        model: string,
        stream: boolean,
        temperature?: number,
        thinkingEnabled?: boolean
    ): Record<string, unknown> {
        const body: Record<string, unknown> = {
            model,
            messages: messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
            stream,
        };

        body.think = thinkingEnabled;

        if (temperature !== undefined) {
            body.options = { temperature };
        }

        return body;
    }

    /**
     * Get the chat completions endpoint URL.
     */
    private getCompletionsEndpoint(config: LLMConfig): string {
        return `${config.baseUrl}/api/chat`;
    }

    /**
     * Get the models endpoint URL.
     */
    private getModelsEndpoint(config: LLMConfig): string {
        return `${config.baseUrl}/api/tags`;
    }

    /**
     * Parse a streaming chunk from Ollama.
     * Ollama sends newline-delimited JSON objects.
     */
    private parseStreamChunk(chunk: string): LLMStreamChunk | null {
        const trimmed = chunk.trim();
        if (!trimmed) return null;

        try {
            const parsed = JSON.parse(trimmed);

            return {
                content: parsed.message?.content || '',
                thinking: parsed.message?.thinking || undefined,
                done: parsed.done === true,
                usage: parsed.done && parsed.eval_count
                    ? {
                        promptTokens: parsed.prompt_eval_count || 0,
                        completionTokens: parsed.eval_count || 0,
                        totalTokens: (parsed.prompt_eval_count || 0) + (parsed.eval_count || 0),
                    }
                    : undefined,
            };
        } catch {
            return null;
        }
    }

    /**
     * Stream completion from Ollama API.
     * Handles the full API call and yields parsed chunks.
     */
    protected async *streamCompletion(
        request: LLMRequest
    ): AsyncGenerator<LLMStreamChunk, void, unknown> {
        const { llmConfig, messages, model, temperature, signal, thinkingEnabled } = request;
        const actualModel = model || llmConfig.defaultModel;

        console.log(`[${this.getProviderName()}] Starting streamCompletion`, {
            model: actualModel,
            messageCount: messages.length,
            thinkingEnabled,
        });

        const response = await fetch(this.getCompletionsEndpoint(llmConfig), {
            method: 'POST',
            headers: this.buildHeaders(llmConfig),
            body: JSON.stringify(
                this.buildRequestBody(messages, actualModel, true, temperature, thinkingEnabled)
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
                'ollama'
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
     * Fetch available models from Ollama.
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

            return (data.models || [])
                .map((m: any) => m.name || m.model)
                .filter(Boolean)
                .sort();
        } catch (error) {
            console.error(`[${this.getProviderName()}] fetchModels error:`, error);
            if (error instanceof LLMError) throw error;
            throw this.wrapError(error);
        }
    }

    /**
     * Test connection to Ollama server.
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

export const ollamaProvider = new OllamaProvider();
