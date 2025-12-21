import { Platform } from 'react-native';
import { TIMEOUTS } from '../../../config/constants';
import { LLMConfig } from '../../types';
import {
    ChatMessage,
    ILLMClient,
    LLMError,
    LLMErrorCode,
    LLMRequest,
    LLMResponse,
    LLMStreamChunk,
} from '../types';

/**
 * Creates an AbortSignal that times out after the specified duration.
 * This is a polyfill for AbortSignal.timeout which may not be available on all platforms.
 */
function createTimeoutSignal(ms: number): AbortSignal {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
}

/**
 * Check if we're running on web (where ReadableStream is fully supported)
 */
const isWeb = Platform.OS === 'web';

/**
 * Abstract base class for LLM providers
 */
export abstract class BaseLLMProvider implements ILLMClient {
    protected abstract buildHeaders(config: LLMConfig): Record<string, string>;

    protected abstract buildRequestBody(
        messages: ChatMessage[],
        model: string,
        stream: boolean,
        temperature?: number,
        maxTokens?: number,
        thinkingEnabled?: boolean
    ): Record<string, unknown>;

    protected abstract getCompletionsEndpoint(config: LLMConfig): string;

    protected abstract parseResponse(data: unknown): LLMResponse;

    protected abstract parseStreamChunk(chunk: string): LLMStreamChunk | null;

    protected abstract parseModels(data: unknown): string[];

    protected abstract getModelsEndpoint(config: LLMConfig): string;

    protected getProviderName(): string {
        return 'unknown';
    }

    async sendMessage(request: LLMRequest): Promise<LLMResponse> {
        const { llmConfig, messages, model, stream = false, temperature, maxTokens, signal, thinkingEnabled } = request;
        const actualModel = model || llmConfig.defaultModel;

        try {
            const response = await fetch(this.getCompletionsEndpoint(llmConfig), {
                method: 'POST',
                headers: this.buildHeaders(llmConfig),
                body: JSON.stringify(
                    this.buildRequestBody(messages, actualModel, stream, temperature, maxTokens, thinkingEnabled)
                ),
                signal: signal || createTimeoutSignal(TIMEOUTS.LLM_REQUEST),
            });

            if (!response.ok) {
                throw await this.handleErrorResponse(response);
            }

            const data = await response.json();
            return this.parseResponse(data);
        } catch (error) {
            if (error instanceof LLMError) throw error;
            throw this.wrapError(error);
        }
    }

    async *sendMessageStream(
        request: LLMRequest
    ): AsyncGenerator<LLMStreamChunk, void, unknown> {
        const { llmConfig, messages, model, temperature, maxTokens, signal, thinkingEnabled } = request;
        const actualModel = model || llmConfig.defaultModel;

        // Use XMLHttpRequest for React Native as it supports streaming via onprogress
        if (!isWeb) {
            yield* this.sendMessageStreamNative(request);
            return;
        }

        // Web: Use fetch with ReadableStream
        try {
            const response = await fetch(this.getCompletionsEndpoint(llmConfig), {
                method: 'POST',
                headers: this.buildHeaders(llmConfig),
                body: JSON.stringify(
                    this.buildRequestBody(messages, actualModel, true, temperature, maxTokens, thinkingEnabled)
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
                    llmConfig.provider as any
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
                        if (chunk.done) return;
                    }
                }
            }
        } catch (error) {
            if (error instanceof LLMError) throw error;
            throw this.wrapError(error);
        }
    }

    /**
     * Native streaming implementation using XMLHttpRequest
     * React Native's XMLHttpRequest fires onprogress events as data arrives
     */
    private async *sendMessageStreamNative(
        request: LLMRequest
    ): AsyncGenerator<LLMStreamChunk, void, unknown> {
        const { llmConfig, messages, model, temperature, maxTokens, signal, thinkingEnabled } = request;
        const actualModel = model || llmConfig.defaultModel;

        // Create a queue for chunks
        const chunkQueue: LLMStreamChunk[] = [];
        let resolveNext: ((value: LLMStreamChunk | null) => void) | null = null;
        let isDone = false;
        let error: Error | null = null;

        const xhr = new XMLHttpRequest();

        // Handle abort signal
        if (signal) {
            signal.addEventListener('abort', () => {
                xhr.abort();
            });
        }

        const headers = this.buildHeaders(llmConfig);
        const body = JSON.stringify(
            this.buildRequestBody(messages, actualModel, true, temperature, maxTokens, thinkingEnabled)
        );

        let lastProcessedIndex = 0;

        xhr.open('POST', this.getCompletionsEndpoint(llmConfig), true);

        // Set headers
        for (const [key, value] of Object.entries(headers)) {
            xhr.setRequestHeader(key, value);
        }

        xhr.onprogress = () => {
            // Get new data since last process
            const newData = xhr.responseText.substring(lastProcessedIndex);
            lastProcessedIndex = xhr.responseText.length;

            // Process lines
            const lines = newData.split('\n');
            for (const line of lines) {
                if (line.trim()) {
                    const chunk = this.parseStreamChunk(line);
                    if (chunk) {
                        if (resolveNext) {
                            resolveNext(chunk);
                            resolveNext = null;
                        } else {
                            chunkQueue.push(chunk);
                        }
                    }
                }
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                isDone = true;
                if (resolveNext) {
                    resolveNext(null);
                    resolveNext = null;
                }
            } else {
                error = new LLMError(
                    `HTTP ${xhr.status}: ${xhr.statusText}`,
                    xhr.status === 401 ? LLMErrorCode.AUTH_ERROR : LLMErrorCode.UNKNOWN,
                    this.getProviderName() as any
                );
                if (resolveNext) {
                    resolveNext(null);
                    resolveNext = null;
                }
            }
        };

        xhr.onerror = () => {
            error = new LLMError(
                'Network error',
                LLMErrorCode.NETWORK_ERROR,
                this.getProviderName() as any
            );
            if (resolveNext) {
                resolveNext(null);
                resolveNext = null;
            }
        };

        xhr.ontimeout = () => {
            error = new LLMError(
                'Request timed out',
                LLMErrorCode.TIMEOUT,
                this.getProviderName() as any
            );
            if (resolveNext) {
                resolveNext(null);
                resolveNext = null;
            }
        };

        xhr.onabort = () => {
            error = new LLMError(
                'Request cancelled',
                LLMErrorCode.CANCELLED,
                this.getProviderName() as any
            );
            if (resolveNext) {
                resolveNext(null);
                resolveNext = null;
            }
        };

        xhr.timeout = TIMEOUTS.LLM_REQUEST;
        xhr.send(body);

        // Yield chunks as they arrive
        while (true) {
            if (error) throw error;

            if (chunkQueue.length > 0) {
                const chunk = chunkQueue.shift()!;
                yield chunk;
                if (chunk.done) return;
            } else if (isDone) {
                return;
            } else {
                // Wait for next chunk
                const chunk = await new Promise<LLMStreamChunk | null>((resolve) => {
                    resolveNext = resolve;
                });

                if (error) throw error;
                if (chunk === null) {
                    if (isDone) return;
                    continue;
                }

                yield chunk;
                if (chunk.done) return;
            }
        }
    }

    async fetchModels(llmConfig: LLMConfig): Promise<string[]> {
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
            return this.parseModels(data);
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
        } catch (error) {
            console.log('Test connection error:', error);
            return false;
        }
    }

    protected async handleErrorResponse(response: Response): Promise<LLMError> {
        let errorMessage = `HTTP ${response.status}`;
        try {
            const data = await response.json();
            errorMessage = data.error?.message || data.message || errorMessage;
        } catch {
            // Use default message
        }

        let code = LLMErrorCode.UNKNOWN;
        if (response.status === 401 || response.status === 403) {
            code = LLMErrorCode.AUTH_ERROR;
        } else if (response.status === 429) {
            code = LLMErrorCode.RATE_LIMIT;
        } else if (response.status === 400) {
            code = LLMErrorCode.INVALID_REQUEST;
        } else if (response.status === 404) {
            code = LLMErrorCode.MODEL_NOT_FOUND;
        } else if (response.status >= 500) {
            code = LLMErrorCode.SERVER_ERROR;
        }

        return new LLMError(errorMessage, code, this.getProviderName() as any);
    }

    protected wrapError(error: unknown): LLMError {
        if (error instanceof DOMException && error.name === 'AbortError') {
            return new LLMError(
                'Request cancelled',
                LLMErrorCode.CANCELLED,
                this.getProviderName() as any
            );
        }
        if (error instanceof DOMException && error.name === 'TimeoutError') {
            return new LLMError(
                'Request timed out',
                LLMErrorCode.TIMEOUT,
                this.getProviderName() as any
            );
        }
        if (error instanceof TypeError) {
            return new LLMError(
                'Network error',
                LLMErrorCode.NETWORK_ERROR,
                this.getProviderName() as any,
                error
            );
        }
        return new LLMError(
            error instanceof Error ? error.message : 'Unknown error',
            LLMErrorCode.UNKNOWN,
            this.getProviderName() as any,
            error instanceof Error ? error : undefined
        );
    }
}
