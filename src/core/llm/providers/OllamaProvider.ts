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
    // AbortController for cancelling active requests
    private currentController: AbortController | null = null;

    protected getProviderName(): string {
        return 'ollama';
    }

    /**
     * Interrupt active generation by aborting the HTTP request.
     */
    public interrupt(): void {
        console.log('[OllamaProvider] Interrupting...');
        if (this.currentController) {
            console.log('[OllamaProvider] Interrupted');
            this.currentController.abort();
            this.currentController = null;
        }
    }

    private buildHeaders(config: LLMConfig): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (config.headers) {
            Object.assign(headers, config.headers);
        }
        return headers;
    }

    private buildRequestBody(
        messages: ChatMessage[],
        model: string,
        stream: boolean,
        temperature?: number
    ): Record<string, unknown> {
        const body: Record<string, unknown> = {
            model,
            messages: messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
            stream,
        };
        // Thinking is always enabled
        body.think = true;
        if (temperature !== undefined) {
            body.options = { temperature };
        }
        return body;
    }

    private getCompletionsEndpoint(config: LLMConfig): string {
        return `${config.baseUrl}/api/chat`;
    }

    private getModelsEndpoint(config: LLMConfig): string {
        return `${config.baseUrl}/api/tags`;
    }

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
     */
    protected async *streamCompletion(
        request: LLMRequest
    ): AsyncGenerator<LLMStreamChunk, void, unknown> {
        const { llmConfig, messages, model, temperature } = request;
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
                    this.buildRequestBody(messages, actualModel, true, temperature)
                ),
                signal: this.currentController.signal,
            });

            if (!response.ok) {
                throw await this.handleErrorResponse(response);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new LLMError('No response body', LLMErrorCode.UNKNOWN, 'ollama');
            }

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                let done: boolean;
                let value: Uint8Array | undefined;

                try {
                    const result = await reader.read();
                    done = result.done;
                    value = result.value;
                } catch (error) {
                    // AbortError - yield final chunk with what we have and return
                    console.log('[OllamaProvider] Stream aborted, returning gracefully');
                    if (buffer.trim()) {
                        const finalChunk = this.parseStreamChunk(buffer);
                        if (finalChunk) {
                            yield { ...finalChunk, done: true };
                        }
                    }
                    return;
                }

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
            return (data.models || [])
                .map((m: any) => m.name || m.model)
                .filter(Boolean)
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

export const ollamaProvider = new OllamaProvider();
