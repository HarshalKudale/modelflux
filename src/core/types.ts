// Data Models for LLM Hub

/**
 * UUID v4 generator for cross-platform compatibility
 */
export const generateId = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

/**
 * Supported LLM provider types
 * - openai: Official OpenAI API with fixed URL
 * - openai-spec: OpenAI-compatible API with custom URL (for LM Studio, etc.)
 * - ollama: Ollama local server
 */
export type LLMProvider = 'openai' | 'openai-spec' | 'ollama';

/**
 * Configuration for an LLM provider instance.
 */
export interface LLMConfig {
    id: string;
    name: string;
    provider: LLMProvider;
    baseUrl: string;
    apiKey?: string;
    defaultModel: string;
    headers?: Record<string, string>;
    isLocal: boolean;
    isEnabled: boolean;
    createdAt: number;
    updatedAt: number;
}

/**
 * Conversation container
 */
export interface Conversation {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    activeLLMId: string;
    activeModel: string;
}

/**
 * Content type for messages
 */
export type MessageContentType = 'text' | 'mixed';

/**
 * Image content within a message
 */
export interface MessageImage {
    id: string;
    url: string;
    alt?: string;
    width?: number;
    height?: number;
    revisedPrompt?: string;
}

/**
 * Token usage statistics
 */
export interface TokenUsage {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
}

/**
 * Single message in a conversation
 */
export interface Message {
    id: string;
    conversationId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    contentType: MessageContentType;
    images?: MessageImage[];
    timestamp: number;
    llmIdUsed: string;
    modelUsed: string;
    usage?: TokenUsage;
}

/**
 * Theme options
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * App settings
 */
export interface AppSettings {
    theme: ThemeMode;
    streamingEnabled: boolean;
    defaultLLMId: string | null;
    sidebarCollapsed: boolean;
    lastAppVersion: string;
    language: string;
}

/**
 * Export format
 */
export interface ExportedData {
    version: string;
    exportedAt: number;
    conversations: Array<{
        conversation: Conversation;
        messages: Message[];
    }>;
    llmConfigs: Array<Omit<LLMConfig, 'apiKey'>>;
}

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: AppSettings = {
    theme: 'system',
    streamingEnabled: true,
    defaultLLMId: null,
    sidebarCollapsed: false,
    lastAppVersion: '1.0.0',
    language: 'en',
};
