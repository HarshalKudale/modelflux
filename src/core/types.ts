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
 * LLM Provider keys - enum for type-safe provider references
 * Use this enum instead of hardcoding provider strings
 */
export enum LLMProviderKey {
    OpenAI = 'openai',
    OpenAISpec = 'openai-spec',
    Anthropic = 'anthropic',
    Ollama = 'ollama',
    Executorch = 'executorch',
    LlamaCpp = 'llama-cpp',
}

/**
 * Supported LLM provider types (derived from enum for compatibility)
 * - openai: Official OpenAI API with fixed URL
 * - openai-spec: OpenAI-compatible API with custom URL (for LM Studio, etc.)
 * - anthropic: Anthropic Claude API
 * - ollama: Ollama local server
 * - executorch: Local on-device AI with Meta ExecuTorch (.pte models)
 * - llama-cpp: Local on-device AI with llama.cpp (.gguf models)
 */
export type LLMProvider = `${LLMProviderKey}`;

/**
 * Provider category for distinguishing local vs remote providers
 * - local: On-device providers (Executorch, Llama.cpp) - fixed, one instance per type
 * - remote: Cloud/server providers (OpenAI, Ollama, etc.) - user-managed, multiple allowed
 */
export type LLMProviderCategory = 'local' | 'remote';

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
 * Llama.cpp generation configuration
 * Settings used when generating text with llama.cpp models (GGUF)
 */
export interface LlamaCppConfig {
    /** Context window size in tokens (default: 2048) */
    nCtx?: number;
    /** Controls randomness (0.0-2.0, default: 0.8) */
    temperature?: number;
    /** Top-P sampling threshold (0.0-1.0, default: 0.95) */
    topP?: number;
    /** Repetition penalty (default: 1.1, 1.0 = no penalty) */
    repeatPenalty?: number;
    /** Max tokens to generate (default: 2048) */
    nPredict?: number;
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

    // Provider-specific generation configs
    executorchConfig?: ExecutorChGenerationConfig;
    llamaCppConfig?: LlamaCppConfig;

    /**
     * Common generation settings for remote providers (AI SDK CallSettings compatible)
     * Used by OpenAI, Anthropic, Ollama etc.
     */
    providerSettings?: {
        temperature?: number;
        topP?: number;
        maxOutputTokens?: number;
        presencePenalty?: number;
        frequencyPenalty?: number;
        topK?: number;
    };

    supportsStreaming: boolean;
    isLocal: boolean;
    isEnabled: boolean;
    createdAt: number;
    updatedAt: number;
}

/**
 * Conversation container
 * 
 * Design notes:
 * - personaId is immutable after creation (systemPrompt is compiled at creation)
 * - attachedSourceIds accumulates as new sources are used in messages
 * - provider/model can be changed mid-conversation
 */
export interface Conversation {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;

    // Provider configuration
    providerId: string;              // LLMConfig id
    modelId: string;                 // Model identifier
    providerType: LLMProvider;       // Provider type for quick lookup

    // Persona (immutable after creation)
    personaId?: string;
    personaPrompt?: string;          // Persona-specific system prompt (empty if no persona)
    contextPrompt?: string;          // RAG context instruction (set when sources first attached)

    // RAG sources (accumulates with each message)
    attachedSourceIds?: number[];    // Source IDs used in this conversation

    // @deprecated Use personaPrompt instead - kept for migration compatibility
    systemPrompt?: string;

    // Features
    thinkingEnabled?: boolean;

    // @deprecated Use providerId instead - kept for migration compatibility
    activeLLMId?: string;
    // @deprecated Use modelId instead - kept for migration compatibility  
    activeModel?: string;
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
 * 
 * Design notes:
 * - context is stored separately from content (immutable after creation)
 * - contextIds tracks which sources were used for RAG
 * - interrupted marks messages that were stopped mid-generation
 */
export interface Message {
    id: string;
    conversationId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    contentType: MessageContentType;
    images?: MessageImage[];
    timestamp: number;

    // Model tracking (for assistant messages)
    modelId: string;                 // Model used for this message

    // Token usage
    usage?: TokenUsage;

    // Thinking/reasoning content
    thinkingContent?: string;

    // RAG context (stored separately from content, immutable)
    context?: string;                // RAG context as formatted string
    contextIds?: number[];           // Source IDs used for context

    // Generation state
    interrupted?: boolean;           // Was generation interrupted?

    // @deprecated Use modelId instead - kept for migration compatibility
    llmIdUsed?: string;
    // @deprecated Use modelId instead - kept for migration compatibility
    modelUsed?: string;
    // @deprecated Use contextIds instead - kept for migration compatibility
    sourceIds?: number[];
    // @deprecated Use context instead - kept for migration compatibility
    contextMap?: Record<number, string>;
}

/**
 * Persona for customizing LLM behavior
 * Based on Character Card V2 specification (simplified subset)
 * @see https://github.com/malfoyslastname/character-card-spec-v2
 */
export interface Persona {
    // Identity
    id: string;
    name: string;

    // Character Card V2 fields (simplified)
    description: string;              // Character description/background
    personality: string;              // Personality traits
    scenario: string;                 // Roleplay scenario/setting

    // Prompt fields
    system_prompt: string;            // Base system prompt template
    post_history_instructions: string; // Instructions placed after chat history (jailbreak/UJB)

    // Metadata
    creator_notes: string;            // Notes for users (NOT used in prompts)

    // Pre-compiled prompt (LLMHub extension - generated at save time)
    compiledSystemPrompt: string;

    // Timestamps
    createdAt: number;
    updatedAt: number;

    // @deprecated Legacy fields - kept for migration
    systemPrompt?: string;            // Use system_prompt instead
    age?: string;
    location?: string;
    job?: string;
}



/**
 * Theme options
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * RAG Provider types
 * - executorch: Local on-device embeddings with ExecutorTorch
 * - llama-cpp: Local on-device embeddings with llama.rn
 * - openai: OpenAI embeddings API (future)
 * - ollama: Ollama local embeddings (future)
 */
export type RAGProviderType = 'executorch' | 'llama-cpp' | 'openai' | 'ollama';

/**
 * RAG Provider (includes 'none' for disabled state)
 */
export type RAGProvider = RAGProviderType | 'none';

/**
 * RAG Runtime status
 * - idle: Not initialized
 * - initializing: Loading embeddings/vector store
 * - ready: Ready to process queries
 * - stale: Provider changed, sources need reprocessing
 * - error: Initialization failed
 */
export type RAGRuntimeStatus = 'idle' | 'initializing' | 'ready' | 'stale' | 'error';

/**
 * RAG Settings for retrieval-augmented generation
 */
export interface RAGSettings {
    defaultConfigId: string | null;  // ID of the default RAG config to use
    isEnabled: boolean;              // Whether RAG is enabled globally
    provider: RAGProvider;           // Selected RAG provider
    modelId: string | null;          // Selected embedding model ID
}

/**
 * Default RAG settings
 */
export const DEFAULT_RAG_SETTINGS: RAGSettings = {
    defaultConfigId: null,
    isEnabled: false,
    provider: 'none',
    modelId: null,
};

/**
 * RAG Config - configuration for a RAG provider (similar to LLMConfig)
 */
export interface RAGConfig {
    id: string;
    name: string;
    provider: RAGProvider;
    modelId: string;                 // Reference to downloaded model ID
    modelName?: string;              // Model display name (for UI)
    modelPath?: string;              // Full path to model file
    tokenizerPath?: string;          // Full path to tokenizer file
    isDefault: boolean;              // Whether this is the default RAG config
    createdAt: number;
    updatedAt: number;
}

/**
 * Source document for RAG
 */
export interface Source {
    id: number;
    name: string;
    uri: string;
    fileSize: number;
    mimeType: string;
    addedAt: number;
    isProcessing?: boolean;
}

/**
 * App settings
 */
export interface AppSettings {
    theme: ThemeMode;
    defaultLLMId: string | null;
    defaultPersonaId: string | null;
    sidebarCollapsed: boolean;
    lastAppVersion: string;
    language: string;
    ragSettings: RAGSettings;
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
export type ModelTag = 'executorch' | 'llama-cpp' | 'custom' | 'Thinking' | 'Function Calling' | 'Quantized' | 'Embedding' | 'LLM';

/**
 * Download status for models
 */
export type ModelDownloadStatus = 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled';

/**
 * Model provider for downloaded models
 */
export type DownloadedModelProvider = 'executorch' | 'llama-cpp';

/**
 * Model type for downloaded models
 */
export type DownloadedModelType = 'llm' | 'embedding' | 'image-gen' | 'tts' | 'stt';

/**
 * Downloaded model with storage details
 */
export interface DownloadedModel {
    id: string;                      // Unique identifier
    modelId: string;                 // Reference to source model (e.g., ExecutorchModel id)
    name: string;
    description: string;
    provider: DownloadedModelProvider; // Provider: executorch or llama-cpp
    type: DownloadedModelType;         // Type: llm, embedding, image-gen, tts, stt
    tags: ModelTag[];                // Additional tags like ['Quantized', 'Thinking']
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
    defaultLLMId: null,
    defaultPersonaId: null,
    sidebarCollapsed: false,
    lastAppVersion: '1.0.0',
    language: 'en',
    ragSettings: DEFAULT_RAG_SETTINGS,
};
