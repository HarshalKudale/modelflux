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
    metadata?: Record<string, unknown>;
}

/**
 * Streaming chunk from LLM
 */
export interface LLMStreamChunk {
    content: string;
    done: boolean;
    usage?: LLMResponse['usage'];
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
 * Main LLM Client Interface
 */
export interface ILLMClient {
    sendMessage(request: LLMRequest): Promise<LLMResponse>;
    sendMessageStream(
        request: LLMRequest
    ): AsyncGenerator<LLMStreamChunk, void, unknown>;
    fetchModels(llmConfig: LLMConfig): Promise<string[]>;
    testConnection(llmConfig: LLMConfig): Promise<boolean>;
}
