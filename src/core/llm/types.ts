import { LLMConfig, LLMProvider } from '../types';

/**
 * Message format for LLM requests
 */
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

/**
 * Request parameters for LLM completion
 */
export interface LLMRequest {
    llmConfig: LLMConfig;
    messages: ChatMessage[];
    model?: string;
    stream?: boolean;
    temperature?: number;
    maxTokens?: number;
    signal?: AbortSignal;
    thinkingEnabled?: boolean;

    // @deprecated Use onToken callback instead - kept for migration
    conversationId?: string;

    /**
     * Callback invoked with accumulated content on each token.
     * Used by stores to update UI during streaming.
     */
    onToken?: (content: string) => void;

    /**
     * Callback invoked with accumulated thinking content.
     * Used for models that support reasoning/thinking output.
     */
    onThinking?: (content: string) => void;
}

/**
 * Generated image in response
 */
export interface LLMResponseImage {
    url: string;
    b64_json?: string;
    revisedPrompt?: string;
}

/**
 * Non-streaming response from LLM
 */
export interface LLMResponse {
    content: string;
    model: string;
    images?: LLMResponseImage[];
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    thinking?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Streaming chunk from LLM
 */
export interface LLMStreamChunk {
    content: string;
    done: boolean;
    usage?: LLMResponse['usage'];
    thinking?: string;
}

/**
 * LLM Error codes
 */
export enum LLMErrorCode {
    NETWORK_ERROR = 'NETWORK_ERROR',
    AUTH_ERROR = 'AUTH_ERROR',
    RATE_LIMIT = 'RATE_LIMIT',
    INVALID_REQUEST = 'INVALID_REQUEST',
    MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
    CONTEXT_LENGTH_EXCEEDED = 'CONTEXT_LENGTH_EXCEEDED',
    SERVER_ERROR = 'SERVER_ERROR',
    TIMEOUT = 'TIMEOUT',
    CANCELLED = 'CANCELLED',
    PROVIDER_NOT_SUPPORTED = 'PROVIDER_NOT_SUPPORTED',
    UNKNOWN = 'UNKNOWN',
}

/**
 * Custom error type for LLM errors
 */
export class LLMError extends Error {
    constructor(
        message: string,
        public readonly code: LLMErrorCode,
        public readonly provider: LLMProvider,
        public readonly cause?: Error
    ) {
        super(message);
        this.name = 'LLMError';
    }
}

/**
 * LLM Provider Interface
 * 
 * All providers must implement:
 * - sendMessageStream(): Main entry point, yields LLMStreamChunk
 * - interrupt(): Stops active generation (abort HTTP or stop native model)
 * - fetchModels(): Returns available models
 * - testConnection(): Tests provider connectivity
 */
export interface ILLMProvider {
    /**
     * Stream message completion.
     * Yields LLMStreamChunk for each token.
     */
    sendMessageStream(
        request: LLMRequest
    ): AsyncGenerator<LLMStreamChunk, void, unknown>;

    /**
     * Interrupt active generation.
     * Remote: abort HTTP request
     * Local: stop native model via llmModule.interrupt()
     */
    interrupt(): void;

    fetchModels(llmConfig: LLMConfig): Promise<string[]>;
    testConnection(llmConfig: LLMConfig): Promise<boolean>;
}

/**
 * Legacy aliases for backward compatibility
 */
export type IRemoteProvider = ILLMProvider;
export type ILLMClient = ILLMProvider;
