import { LLMConfig } from '../../types';
import {
    ILLMProvider,
    LLMError,
    LLMErrorCode,
    LLMRequest,
    LLMStreamChunk
} from '../types';

/**
 * Abstract base class for LLM providers
 * 
 * Design principles:
 * - Remote providers implement streamCompletion() which yields chunks
 * - BaseProvider.sendMessageStream() orchestrates and calls onToken/onThinking
 * - Each provider implements its own interrupt() 
 * - isStreaming from conversationStore controls interrupt (providers check it)
 * 
 * For ExecuTorch (local provider):
 * - Does NOT extend BaseLLMProvider
 * - Implements ILLMProvider directly with its own sendMessageStream
 * - Uses setTokenCallback for streaming, checks isStreaming, calls llmModule.interrupt()
 */
export abstract class BaseLLMProvider implements ILLMProvider {
    /**
     * Provider-specific streaming implementation.
     * Each remote provider handles its own API calls and yields LLMStreamChunk.
     * Implementations MUST check for abort conditions and throw/return appropriately.
     */
    protected abstract streamCompletion(
        request: LLMRequest
    ): AsyncGenerator<LLMStreamChunk, void, unknown>;

    /**
     * Fetch available models from the provider.
     */
    public abstract fetchModels(llmConfig: LLMConfig): Promise<string[]>;

    /**
     * Test connection to the provider.
     */
    public abstract testConnection(llmConfig: LLMConfig): Promise<boolean>;

    /**
     * Interrupt active generation.
     * Remote providers should abort their HTTP request.
     * Default implementation does nothing - override in subclasses.
     */
    public abstract interrupt(): void;

    /**
     * Get the provider name for logging.
     */
    protected getProviderName(): string {
        return 'unknown';
    }

    /**
     * Main streaming method called by conversation orchestrator.
     * Delegates to streamCompletion() and calls onToken/onThinking callbacks.
     */
    async *sendMessageStream(
        request: LLMRequest
    ): AsyncGenerator<LLMStreamChunk, void, unknown> {
        const { onToken, onThinking } = request;

        console.log(`[${this.getProviderName()}] Starting sendMessageStream`, {
            messageCount: request.messages.length,
            thinkingEnabled: request.thinkingEnabled,
        });

        let fullContent = '';
        let thinkingContent = '';

        try {
            // Delegate to provider-specific streaming
            const stream = this.streamCompletion(request);

            for await (const chunk of stream) {
                // Accumulate content
                fullContent += chunk.content;
                if (chunk.thinking) {
                    thinkingContent += chunk.thinking;
                }

                // Call callbacks for UI updates
                if (onToken) {
                    onToken(fullContent);
                }
                if (onThinking && thinkingContent) {
                    onThinking(thinkingContent);
                }

                yield chunk;

                if (chunk.done) {
                    console.log(`[${this.getProviderName()}] Stream complete`, {
                        contentLength: fullContent.length,
                    });
                    return;
                }
            }
        } catch (error) {
            console.error(`[${this.getProviderName()}] Error:`, error);
            if (error instanceof LLMError) throw error;
            throw this.wrapError(error);
        }
    }

    /**
     * Handle HTTP error responses.
     */
    protected async handleErrorResponse(response: Response): Promise<LLMError> {
        let errorMessage = `HTTP ${response.status}`;
        try {
            const data = await response.json();
            errorMessage = data.error?.message || data.message || errorMessage;
        } catch {
            // Use default
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

    /**
     * Wrap errors in LLMError.
     */
    protected wrapError(error: unknown): LLMError {
        // Check for abort/cancel errors (different in browser vs React Native)
        if (error instanceof DOMException && error.name === 'AbortError') {
            console.log(`[${this.getProviderName()}] Request aborted (DOMException)`);
            return new LLMError(
                'Request cancelled',
                LLMErrorCode.CANCELLED,
                this.getProviderName() as any
            );
        }
        // React Native may throw a regular Error with name 'AbortError'
        if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'))) {
            console.log(`[${this.getProviderName()}] Request aborted (Error)`);
            return new LLMError(
                'Request cancelled',
                LLMErrorCode.CANCELLED,
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

/**
 * Creates an AbortSignal that times out after the specified duration.
 */
export function createTimeoutSignal(ms: number): AbortSignal {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
}
