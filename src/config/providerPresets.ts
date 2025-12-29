import { LLMConfig, LLMProvider, LocalModelFormat } from '../core/types';

/**
 * Provider display info type
 * Note: displayName and description are localized using t(`provider.${provider}`) and t(`provider.${provider}.description`)
 */
export interface ProviderDisplayInfo {
    /** Icon name from Ionicons */
    icon: string;
    /** Theme color for the provider */
    color: string;
    /** Whether the URL can be edited by user */
    urlEditable: boolean;
    /** Whether API key is required */
    apiKeyRequired: boolean;
    /** Whether this is a local on-device provider */
    isLocal: boolean;
    /** Supported model file formats for local providers */
    supportedFormats?: LocalModelFormat[];
    /** Whether streaming is supported */
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

    anthropic: {
        name: 'Anthropic Claude',
        provider: 'anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        defaultModel: 'claude-3-5-sonnet-20241022',
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
    anthropic: [
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
    ],
    ollama: [],
    executorch: [],
    'llama-rn': [],
};

/**
 * Provider display info
 * Note: For localized displayName use t(`provider.${provider}`)
 * Note: For localized description use t(`provider.${provider}.description`)
 */
export const PROVIDER_INFO: Record<LLMProvider, ProviderDisplayInfo> = {
    openai: {
        icon: 'logo-openai',
        color: '#10a37f',
        urlEditable: false,
        apiKeyRequired: true,
        isLocal: false,
        supportsStreaming: true,
    },
    'openai-spec': {
        icon: 'server',
        color: '#8b5cf6',
        urlEditable: true,
        apiKeyRequired: false,
        isLocal: false,
        supportsStreaming: true,
    },
    anthropic: {
        icon: 'chatbubbles',
        color: '#d4a27f',
        urlEditable: false,
        apiKeyRequired: true,
        isLocal: false,
        supportsStreaming: true,
    },
    ollama: {
        icon: 'hardware-chip',
        color: '#6366f1',
        urlEditable: true,
        apiKeyRequired: false,
        isLocal: false,
        supportsStreaming: true,
    },
    executorch: {
        icon: 'phone-portrait',
        color: '#0668E1',
        urlEditable: false,
        apiKeyRequired: false,
        isLocal: true,
        supportedFormats: ['pte'],
        supportsStreaming: false,
    },
    'llama-rn': {
        icon: 'hardware-chip',
        color: '#FF6B35',
        urlEditable: false,
        apiKeyRequired: false,
        isLocal: true,
        supportedFormats: ['gguf'],
        supportsStreaming: true,
    },
};

