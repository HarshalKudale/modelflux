import { LLMConfig, LLMProvider, LocalModelFormat } from '../core/types';

/**
 * Provider display info type
 */
export interface ProviderDisplayInfo {
    displayName: string;
    description: string;
    icon: string;
    color: string;
    urlEditable: boolean;
    apiKeyRequired: boolean;
    isLocal: boolean;
    supportedFormats?: LocalModelFormat[];
    supportsStreaming: boolean;
}

/**
 * Default provider configurations.
 * Users can use these as templates.
 */
export const PROVIDER_PRESETS: Record<LLMProvider, Partial<LLMConfig>> = {
    openai: {
        name: 'OpenAI',
        provider: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        defaultModel: 'gpt-4o',
        supportsStreaming: true,
        isLocal: false,
        isEnabled: true,
    },

    'openai-spec': {
        name: 'OpenAI Compatible',
        provider: 'openai-spec',
        baseUrl: '',
        defaultModel: '',
        supportsStreaming: true,
        isLocal: false,
        isEnabled: true,
    },

    ollama: {
        name: 'Ollama (Local)',
        provider: 'ollama',
        baseUrl: 'http://localhost:11434',
        defaultModel: '',
        supportsStreaming: true,
        isLocal: false,
        isEnabled: true,
    },

    executorch: {
        name: 'ExecuTorch (Local)',
        provider: 'executorch',
        baseUrl: '',
        defaultModel: '',
        supportsStreaming: false,
        isLocal: true,
        isEnabled: true,
    },

    'llama-rn': {
        name: 'llama.rn (Local)',
        provider: 'llama-rn',
        baseUrl: '',
        defaultModel: '',
        supportsStreaming: true,
        isLocal: true,
        isEnabled: true,
    },
};

/**
 * Popular models for each provider (fallback when API fetch fails)
 */
export const POPULAR_MODELS: Record<LLMProvider, string[]> = {
    openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    'openai-spec': [],
    ollama: [],
    executorch: [],
    'llama-rn': [],
};

/**
 * Provider display info
 */
export const PROVIDER_INFO: Record<LLMProvider, ProviderDisplayInfo> = {
    openai: {
        displayName: 'OpenAI',
        description: 'Official OpenAI API (GPT-4, etc.)',
        icon: 'logo-openai',
        color: '#10a37f',
        urlEditable: false,
        apiKeyRequired: true,
        isLocal: false,
        supportsStreaming: true,
    },
    'openai-spec': {
        displayName: 'OpenAI Compatible',
        description: 'OpenAI-compatible API (LM Studio, etc.)',
        icon: 'server',
        color: '#8b5cf6',
        urlEditable: true,
        apiKeyRequired: false,
        isLocal: false,
        supportsStreaming: true,
    },
    ollama: {
        displayName: 'Ollama',
        description: 'Local Ollama server',
        icon: 'hardware-chip',
        color: '#6366f1',
        urlEditable: true,
        apiKeyRequired: false,
        isLocal: false,
        supportsStreaming: true,
    },
    executorch: {
        displayName: 'ExecuTorch',
        description: 'On-device AI with Meta ExecuTorch (.pte models)',
        icon: 'phone-portrait',
        color: '#0668E1',
        urlEditable: false,
        apiKeyRequired: false,
        isLocal: true,
        supportedFormats: ['pte'],
        supportsStreaming: false,
    },
    'llama-rn': {
        displayName: 'llama.rn',
        description: 'Run GGUF models locally with llama.rn',
        icon: 'hardware-chip',
        color: '#FF6B35',
        urlEditable: false,
        apiKeyRequired: false,
        isLocal: true,
        supportedFormats: ['gguf'],
        supportsStreaming: true,
    },
};

