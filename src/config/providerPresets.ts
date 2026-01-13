/**
 * Provider Configuration - Single Source of Truth
 * 
 * This file contains all provider configuration in one place.
 * Use PROVIDER_LIST for all provider-related lookups.
 * Use LLMProviderKey enum from types.ts instead of hardcoding provider strings.
 */

import { LLMProvider, LLMProviderKey, LocalModelFormat } from '../core/types';

/**
 * Supported platforms for providers
 */
export type ProviderPlatform = 'android' | 'ios' | 'web';

/**
 * Provider capabilities - determines what the provider can do
 * - llm: Can be used for LLM chat/generation
 * - embedding: Can be used for embeddings (RAG)
 */
export type ProviderCapability = 'llm' | 'embedding';

/**
 * Complete provider configuration
 * Includes display info, behavior settings, and default values
 */
export interface ProviderConfig {
    /** Provider key (matches LLMProviderKey enum) */
    id: LLMProvider;
    /** Display name */
    name: string;
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
    /** Supported platforms */
    platforms: ProviderPlatform[];
    /** Provider capabilities (llm, embedding) */
    capabilities: ProviderCapability[];
    /** Whether this provider can be deleted by user */
    isDeletable: boolean;
    /** Whether new instances of this provider can be added */
    isAddable: boolean;
    /** Default base URL for remote providers */
    defaultBaseUrl: string;
}

/**
 * PROVIDER_LIST - Single source of truth for all provider configuration
 * Use LLMProviderKey enum to access entries
 */
export const PROVIDER_LIST: Record<LLMProvider, ProviderConfig> = {
    [LLMProviderKey.OpenAI]: {
        id: LLMProviderKey.OpenAI,
        name: 'OpenAI',
        icon: 'logo-openai',
        color: '#10a37f',
        urlEditable: false,
        apiKeyRequired: true,
        isLocal: false,
        platforms: ['android', 'ios', 'web'],
        capabilities: ['llm'],
        isDeletable: true,
        isAddable: true,
        defaultBaseUrl: 'https://api.openai.com/v1',
    },
    [LLMProviderKey.OpenAISpec]: {
        id: LLMProviderKey.OpenAISpec,
        name: 'OpenAI Compatible',
        icon: 'server',
        color: '#8b5cf6',
        urlEditable: true,
        apiKeyRequired: false,
        isLocal: false,
        platforms: ['android', 'ios', 'web'],
        capabilities: ['llm'],
        isDeletable: true,
        isAddable: true,
        defaultBaseUrl: '',
    },
    [LLMProviderKey.Anthropic]: {
        id: LLMProviderKey.Anthropic,
        name: 'Anthropic Claude',
        icon: 'chatbubbles',
        color: '#d4a27f',
        urlEditable: false,
        apiKeyRequired: true,
        isLocal: false,
        platforms: ['android', 'ios', 'web'],
        capabilities: ['llm'],
        isDeletable: true,
        isAddable: true,
        defaultBaseUrl: 'https://api.anthropic.com/v1',
    },
    [LLMProviderKey.Ollama]: {
        id: LLMProviderKey.Ollama,
        name: 'Ollama',
        icon: 'hardware-chip',
        color: '#6366f1',
        urlEditable: true,
        apiKeyRequired: false,
        isLocal: false,
        platforms: ['android', 'ios', 'web'],
        capabilities: ['llm', 'embedding'],
        isDeletable: true,
        isAddable: true,
        defaultBaseUrl: 'http://localhost:11434',
    },
    [LLMProviderKey.Executorch]: {
        id: LLMProviderKey.Executorch,
        name: 'ExecuTorch',
        icon: 'phone-portrait',
        color: '#0668E1',
        urlEditable: false,
        apiKeyRequired: false,
        isLocal: true,
        supportedFormats: ['pte'],
        platforms: ['android', 'ios'],
        capabilities: ['llm', 'embedding'],
        isDeletable: false,
        isAddable: false,
        defaultBaseUrl: '',
    },
    [LLMProviderKey.LlamaCpp]: {
        id: LLMProviderKey.LlamaCpp,
        name: 'Llama.cpp',
        icon: 'hardware-chip',
        color: '#FF6B35',
        urlEditable: false,
        apiKeyRequired: false,
        isLocal: true,
        supportedFormats: ['gguf'],
        platforms: ['android', 'ios'],
        capabilities: ['llm', 'embedding'],
        isDeletable: false,
        isAddable: false,
        defaultBaseUrl: '',
    },
};

/**
 * Helper functions for working with providers
 */

/** Get all local providers (for Models screen Row 1 filter) */
export const getLocalProviders = (): LLMProvider[] => {
    return (Object.values(PROVIDER_LIST) as ProviderConfig[])
        .filter((config) => config.isLocal)
        .map((config) => config.id);
};

/** Get all remote providers */
export const getRemoteProviders = (): LLMProvider[] => {
    return (Object.values(PROVIDER_LIST) as ProviderConfig[])
        .filter((config) => !config.isLocal)
        .map((config) => config.id);
};

/** Get providers that support a specific capability */
export const getProvidersByCapability = (capability: ProviderCapability): LLMProvider[] => {
    return (Object.values(PROVIDER_LIST) as ProviderConfig[])
        .filter((config) => config.capabilities.includes(capability))
        .map((config) => config.id);
};

/** Get local providers that support a specific capability (for downloads/models) */
export const getLocalProvidersByCapability = (capability: ProviderCapability): LLMProvider[] => {
    return (Object.values(PROVIDER_LIST) as ProviderConfig[])
        .filter((config) => config.isLocal && config.capabilities.includes(capability))
        .map((config) => config.id);
};

/** Check if a provider is local */
export const isLocalProvider = (provider: LLMProvider): boolean => {
    return PROVIDER_LIST[provider]?.isLocal ?? false;
};

/** Get provider config by key */
export const getProviderConfig = (provider: LLMProvider): ProviderConfig => {
    return PROVIDER_LIST[provider];
};

/** Get the first local provider (for default fallback) */
export const getFirstLocalProvider = (): LLMProvider | null => {
    const localProviders = getLocalProviders();
    return localProviders.length > 0 ? localProviders[0] : null;
};

/**
 * Generate a default LLMConfig for a local provider
 * Used for auto-creating local provider configs in stores
 */
export const getDefaultLocalConfig = (provider: LLMProvider): {
    id: string;
    name: string;
    provider: LLMProvider;
    baseUrl: string;
    defaultModel: string;
    supportsStreaming: boolean;
    isLocal: boolean;
    isEnabled: boolean;
} | null => {
    const config = PROVIDER_LIST[provider];
    if (!config || !config.isLocal) return null;

    return {
        id: `${provider}-default`,
        name: config.name,
        provider: config.id,
        baseUrl: config.defaultBaseUrl,
        defaultModel: '',
        supportsStreaming: true,
        isLocal: true,
        isEnabled: true,
    };
};

/**
 * Get all default local configs
 * Returns configs for all local providers that are addable or are built-in
 */
export const getAllDefaultLocalConfigs = (): ReturnType<typeof getDefaultLocalConfig>[] => {
    return getLocalProviders()
        .map(provider => getDefaultLocalConfig(provider))
        .filter((config): config is NonNullable<typeof config> => config !== null);
};
