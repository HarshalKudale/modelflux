/**
 * LLM Provider Repository
 * 
 * Manages all LLM provider instances and their configurations.
 * 
 * Provider Categories:
 * - Local: Executorch, Llama.cpp (fixed, one instance per type, non-removable)
 * - Remote: Ollama, OpenAI, OpenAI-spec, Anthropic (user-managed, multiple allowed)
 * 
 * Key design decisions:
 * - listModels() is NOT a repository function - it's a provider function
 *   (remote providers fetch from API, local providers filter downloaded models)
 * - Local providers are auto-created on first access if not present
 * - Remote providers can be added, edited, and removed by users
 */

import { STORAGE_KEYS } from '../../config/constants';
import { LLMConfig, LLMProvider, LLMProviderCategory, generateId } from '../types';
import { storageAdapter } from './StorageAdapter';

// Local provider types that are fixed and non-removable
const LOCAL_PROVIDER_TYPES: LLMProvider[] = ['executorch', 'llama-cpp'];

// Remote provider types that are user-managed
const REMOTE_PROVIDER_TYPES: LLMProvider[] = ['openai', 'openai-spec', 'anthropic', 'ollama'];

// Default configurations for local providers (auto-created if not present)
const DEFAULT_LOCAL_CONFIGS: Record<string, Omit<LLMConfig, 'id' | 'createdAt' | 'updatedAt'>> = {
    'executorch': {
        name: 'ExecuTorch (Local)',
        provider: 'executorch',
        baseUrl: '',
        defaultModel: '',
        supportsStreaming: true,
        isLocal: true,
        isEnabled: true,
    },
    // llama-cpp can be added here when implemented
};

export interface ILLMProviderRepository {
    // Provider Management
    listProviders(): Promise<LLMConfig[]>;
    getProvider(id: string): Promise<LLMConfig | null>;
    getProviderByType(providerType: LLMProvider): Promise<LLMConfig | null>;
    addRemoteProvider(config: Omit<LLMConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<LLMConfig>;
    updateProvider(config: LLMConfig): Promise<LLMConfig>;
    removeProvider(id: string): Promise<void>;

    // Category Helpers
    getLocalProviders(): Promise<LLMConfig[]>;
    getRemoteProviders(): Promise<LLMConfig[]>;
    getProviderCategory(providerType: LLMProvider): LLMProviderCategory;
    isLocalProvider(providerType: LLMProvider): boolean;

    // Initialization
    ensureLocalProviders(): Promise<void>;
}

class LLMProviderRepository implements ILLMProviderRepository {
    private async getAll(): Promise<LLMConfig[]> {
        const data = await storageAdapter.get<LLMConfig[]>(STORAGE_KEYS.LLM_CONFIGS);
        return data || [];
    }

    private async saveAll(configs: LLMConfig[]): Promise<void> {
        await storageAdapter.set(STORAGE_KEYS.LLM_CONFIGS, configs);
    }

    /**
     * List all provider configurations (both local and remote)
     */
    async listProviders(): Promise<LLMConfig[]> {
        return this.getAll();
    }

    /**
     * Get a specific provider by ID
     */
    async getProvider(id: string): Promise<LLMConfig | null> {
        const configs = await this.getAll();
        return configs.find((c) => c.id === id) || null;
    }

    /**
     * Get a provider by its type (useful for local providers which have one instance each)
     */
    async getProviderByType(providerType: LLMProvider): Promise<LLMConfig | null> {
        const configs = await this.getAll();
        return configs.find((c) => c.provider === providerType) || null;
    }

    /**
     * Add a new remote provider configuration
     * @throws Error if trying to add a local provider type
     */
    async addRemoteProvider(configData: Omit<LLMConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<LLMConfig> {
        if (this.isLocalProvider(configData.provider)) {
            throw new Error(`Cannot add local provider '${configData.provider}' - local providers are auto-managed`);
        }

        const now = Date.now();
        const config: LLMConfig = {
            ...configData,
            id: generateId(),
            createdAt: now,
            updatedAt: now,
        };

        const configs = await this.getAll();
        configs.push(config);
        await this.saveAll(configs);
        return config;
    }

    /**
     * Update an existing provider configuration
     */
    async updateProvider(config: LLMConfig): Promise<LLMConfig> {
        const configs = await this.getAll();
        const index = configs.findIndex((c) => c.id === config.id);
        if (index === -1) {
            throw new Error(`Provider not found: ${config.id}`);
        }

        const updated = { ...config, updatedAt: Date.now() };
        configs[index] = updated;
        await this.saveAll(configs);
        return updated;
    }

    /**
     * Remove a provider configuration
     * @throws Error if trying to remove a local provider
     */
    async removeProvider(id: string): Promise<void> {
        const configs = await this.getAll();
        const config = configs.find((c) => c.id === id);

        if (config && this.isLocalProvider(config.provider)) {
            throw new Error(`Cannot remove local provider '${config.provider}' - local providers are fixed`);
        }

        const filtered = configs.filter((c) => c.id !== id);
        await this.saveAll(filtered);
    }

    /**
     * Get all local provider configurations
     */
    async getLocalProviders(): Promise<LLMConfig[]> {
        const configs = await this.getAll();
        return configs.filter((c) => this.isLocalProvider(c.provider));
    }

    /**
     * Get all remote provider configurations
     */
    async getRemoteProviders(): Promise<LLMConfig[]> {
        const configs = await this.getAll();
        return configs.filter((c) => !this.isLocalProvider(c.provider));
    }

    /**
     * Get the category of a provider type
     */
    getProviderCategory(providerType: LLMProvider): LLMProviderCategory {
        return LOCAL_PROVIDER_TYPES.includes(providerType) ? 'local' : 'remote';
    }

    /**
     * Check if a provider type is a local provider
     */
    isLocalProvider(providerType: LLMProvider): boolean {
        return LOCAL_PROVIDER_TYPES.includes(providerType);
    }

    /**
     * Ensure local providers exist in storage
     * Called during app initialization to auto-create local provider configs
     */
    async ensureLocalProviders(): Promise<void> {
        const configs = await this.getAll();
        let updated = false;

        for (const providerType of LOCAL_PROVIDER_TYPES) {
            const exists = configs.some((c) => c.provider === providerType);
            if (!exists && DEFAULT_LOCAL_CONFIGS[providerType]) {
                const now = Date.now();
                const config: LLMConfig = {
                    ...DEFAULT_LOCAL_CONFIGS[providerType],
                    id: `${providerType}-default`,
                    createdAt: now,
                    updatedAt: now,
                };
                configs.push(config);
                updated = true;
                console.log(`[LLMProviderRepository] Auto-created local provider: ${providerType}`);
            }
        }

        if (updated) {
            await this.saveAll(configs);
        }
    }
}

export const llmProviderRepository = new LLMProviderRepository();
