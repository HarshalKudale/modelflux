import { LLMConfig, LLMProvider } from '../core/types';

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
        isLocal: false,
        isEnabled: true,
    },

    'openai-spec': {
        name: 'OpenAI Compatible',
        provider: 'openai-spec',
        baseUrl: '',
        defaultModel: '',
        isLocal: false,
        isEnabled: true,
    },

    ollama: {
        name: 'Ollama (Local)',
        provider: 'ollama',
        baseUrl: 'http://localhost:11434',
        defaultModel: '',
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
};

/**
 * Provider display info
 */
export const PROVIDER_INFO: Record<
    LLMProvider,
    { displayName: string; description: string; icon: string; color: string; urlEditable: boolean; apiKeyRequired: boolean }
> = {
    openai: {
        displayName: 'OpenAI',
        description: 'Official OpenAI API (GPT-4, etc.)',
        icon: 'logo-openai',
        color: '#10a37f',
        urlEditable: false,
        apiKeyRequired: true,
    },
    'openai-spec': {
        displayName: 'OpenAI Compatible',
        description: 'OpenAI-compatible API (LM Studio, etc.)',
        icon: 'server',
        color: '#8b5cf6',
        urlEditable: true,
        apiKeyRequired: false,
    },
    ollama: {
        displayName: 'Ollama',
        description: 'Local Ollama server',
        icon: 'hardware-chip',
        color: '#6366f1',
        urlEditable: true,
        apiKeyRequired: false,
    },
};
