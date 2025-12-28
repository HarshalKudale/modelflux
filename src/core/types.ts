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
 * - executorch: Local on-device AI with Meta ExecuTorch (.pte models)
 * - llama-rn: Local on-device AI with llama.rn (.gguf models)
 */
export type LLMProvider = 'openai' | 'openai-spec' | 'ollama' | 'executorch' | 'llama-rn';

/**
 * Supported local model file formats
 */
export type LocalModelFormat = 'pte' | 'gguf';

/**
 * Status of a local model
 */
export type LocalModelStatus = 'ready' | 'loading' | 'error';

/**
 * ExecuTorch generation configuration
 * Settings used when generating text with ExecuTorch models
 */
export interface ExecutorChGenerationConfig {
    /** Soft upper limit on the number of tokens in each token batch */
    outputTokenBatchSize?: number;
    /** Upper limit on the time interval between consecutive token batches (ms) */
    batchTimeInterval?: number;
    /** Scales output logits by inverse of temperature. Controls randomness/creativity (0.0-2.0) */
    temperature?: number;
    /** Top-P sampling: only samples from smallest set of tokens whose cumulative probability exceeds topp (0.0-1.0) */
    topp?: number;
}

/**
 * Local model configuration for on-device providers
 */
export interface LocalModel {
    id: string;
    name: string;
    filePath: string;
    fileSize: number;
    format: LocalModelFormat;
    status: LocalModelStatus;
    errorMessage?: string;
    addedAt: number;
}

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
    localModels?: LocalModel[];
    executorchConfig?: ExecutorChGenerationConfig;
    supportsStreaming: boolean;
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
    personaId?: string;
    thinkingEnabled?: boolean;
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
    thinkingContent?: string;
}

/**
 * Persona for customizing LLM behavior
 */
export interface Persona {
    id: string;
    name: string;
    description?: string;
    systemPrompt: string;
    age?: string;
    location?: string;
    job?: string;
    createdAt: number;
    updatedAt: number;
}

/**
 * MCP Transport type
 */
export type MCPTransport = 'http' | 'stdio';

/**
 * MCP Server configuration
 */
export interface MCPServer {
    id: string;
    name: string;
    transport: MCPTransport;
    endpoint?: string;        // For HTTP transport
    command?: string;         // For STDIO transport
    args?: string[];          // For STDIO transport
    envVars: Record<string, string>;
    isEnabled: boolean;
    createdAt: number;
    updatedAt: number;
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
    defaultPersonaId: string | null;
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
    personas?: Persona[];
}

/**
 * Tag for categorizing models
 */
export type ModelTag = 'executorch' | 'llama-rn' | 'custom';

/**
 * Download status for models
 */
export type ModelDownloadStatus = 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled';

/**
 * Downloaded model with storage details
 */
export interface DownloadedModel {
    id: string;                      // Unique identifier
    modelId: string;                 // Reference to source model (e.g., ExecutorchModel id)
    name: string;
    description: string;
    tags: ModelTag[];                // Tags like ['executorch']
    localPath: string;               // Local file system path to model folder
    modelFilePath: string;           // Path to .pte file
    tokenizerFilePath: string;       // Path to tokenizer file
    tokenizerConfigFilePath: string; // Path to tokenizer config
    sizeEstimate: string;            // Human readable size
    downloadedSize: number;          // Actual bytes downloaded
    status: ModelDownloadStatus;
    progress: number;                // 0-100
    downloadedAt: number;            // Timestamp
    errorMessage?: string;
}

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: AppSettings = {
    theme: 'system',
    streamingEnabled: true,
    defaultLLMId: null,
    defaultPersonaId: null,
    sidebarCollapsed: false,
    lastAppVersion: '1.0.0',
    language: 'en',
};
