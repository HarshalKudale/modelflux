import { useConversationStore } from '../../../state/conversationStore';
import { LLMConfig } from '../../types';
import {
    ILLMClient,
    LLMError,
    LLMErrorCode,
    LLMRequest,
    LLMStreamChunk
} from '../types';

/**
 * Abstract base class for LLM providers
 * 
 * Each provider implements its own API calling logic via streamCompletion().
 * The base class handles:
 * - Orchestrating the streaming flow
 * - Updating conversationStore's currentMessage for live UI updates
 * - Common error wrapping utilities
 */
export abstract class BaseLLMProvider implements ILLMClient {
    /**
     * Provider-specific streaming implementation.
     * Each provider handles its own API calls using expo/fetch and yields LLMStreamChunk.
     */
    protected abstract streamCompletion(
        request: LLMRequest
    ): AsyncGenerator<LLMStreamChunk, void, unknown>;

    /**
     * Fetch available models from the provider.
     * Each provider implements its own API call.
     */
    public abstract fetchModels(llmConfig: LLMConfig): Promise<string[]>;

    /**
     * Test connection to the provider.
     * Each provider implements its own API call.
     */
    public abstract testConnection(llmConfig: LLMConfig): Promise<boolean>;

    /**
     * Get the provider name for logging and error messages.
     */
    protected getProviderName(): string {
        return 'unknown';
    }

    /**
     * Main streaming method called by conversationStore.
     * Orchestrates the streaming flow and updates the UI via conversationStore.
     */
    async *sendMessageStream(
        request: LLMRequest
    ): AsyncGenerator<LLMStreamChunk, void, unknown> {
        const { conversationId } = request;

        console.log(`[${this.getProviderName()}] Starting sendMessageStream`, {
            messageCount: request.messages.length,
            thinkingEnabled: request.thinkingEnabled,
            conversationId
        });

        let fullContent = '';
        let thinkingContent = '';

        try {
            // Delegate to provider-specific streaming implementation
            const stream = this.streamCompletion(request);

            for await (const chunk of stream) {
                // Accumulate content for conversationStore update
                fullContent += chunk.content;
                if (chunk.thinking) {
                    thinkingContent += chunk.thinking;
                }

                // Update conversationStore's currentMessage for live streaming UI
                if (conversationId) {
                    useConversationStore.getState().updateCurrentMessage(conversationId, fullContent);
                    if (thinkingContent) {
                        useConversationStore.getState().updateCurrentThinkingMessage(conversationId, thinkingContent);
                    }
                }

                yield chunk;

                if (chunk.done) {
                    console.log(`[${this.getProviderName()}] Stream complete`);
                    return;
                }
            }
        } catch (error) {
            console.error(`[${this.getProviderName()}] Error in sendMessageStream:`, error);
            if (error instanceof LLMError) throw error;
            throw this.wrapError(error);
        }
    }

    /**
     * Handle HTTP error responses and convert to LLMError.
     */
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

    /**
     * Wrap unknown errors in LLMError with appropriate error codes.
     */
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

/**
 * Creates an AbortSignal that times out after the specified duration.
 * This is a polyfill for AbortSignal.timeout which may not be available on all platforms.
 */
export function createTimeoutSignal(ms: number): AbortSignal {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
}
