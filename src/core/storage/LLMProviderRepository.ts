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

import { Q } from '@nozbe/watermelondb';
import { getDefaultLocalConfig, getLocalProviders } from '../../config/providerPresets';
import { database } from '../database';
import { LLMConfigModel } from '../database/models';
import { LLMConfig, LLMProvider, LLMProviderCategory, generateId } from '../types';

/**
 * Convert WatermelonDB model to LLMConfig type
 */
function modelToLLMConfig(model: LLMConfigModel): LLMConfig {
    return {
        id: model.id,
        name: model.name,
        provider: model.provider as LLMProvider,
        baseUrl: model.baseUrl,
        apiKey: model.apiKey,
        defaultModel: model.defaultModel,
        headers: model.headers,
        localModels: model.localModels,
        executorchConfig: model.executorchConfig,
        llamaCppConfig: model.llamaCppConfig,
        providerSettings: model.providerSettings,
        supportsStreaming: model.supportsStreaming,
        isLocal: model.isLocal,
        isEnabled: model.isEnabled,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
    };
}

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
    private get collection() {
        return database.get<LLMConfigModel>('llm_configs');
    }

    /**
     * List all provider configurations (both local and remote)
     */
    async listProviders(): Promise<LLMConfig[]> {
        const models = await this.collection.query().fetch();
        return models.map(modelToLLMConfig);
    }

    /**
     * Get a specific provider by ID
     */
    async getProvider(id: string): Promise<LLMConfig | null> {
        try {
            const model = await this.collection.find(id);
            return modelToLLMConfig(model);
        } catch {
            return null;
        }
    }

    /**
     * Get a provider by its type (useful for local providers which have one instance each)
     */
    async getProviderByType(providerType: LLMProvider): Promise<LLMConfig | null> {
        const models = await this.collection
            .query(Q.where('provider', providerType))
            .fetch();
        return models.length > 0 ? modelToLLMConfig(models[0]) : null;
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

        await database.write(async () => {
            await this.collection.create((record) => {
                (record._raw as any).id = config.id;
                record.name = config.name;
                record.provider = config.provider;
                record.baseUrl = config.baseUrl;
                record.apiKey = config.apiKey;
                record.defaultModel = config.defaultModel;
                (record as any)._setRaw('headers', JSON.stringify(config.headers || {}));
                (record as any)._setRaw('local_models', JSON.stringify(config.localModels || []));
                (record as any)._setRaw('executorch_config', JSON.stringify(config.executorchConfig || null));
                (record as any)._setRaw('llama_cpp_config', JSON.stringify(config.llamaCppConfig || null));
                (record as any)._setRaw('provider_settings', JSON.stringify(config.providerSettings || null));
                record.supportsStreaming = config.supportsStreaming;
                record.isLocal = config.isLocal;
                record.isEnabled = config.isEnabled;
                record.createdAt = config.createdAt;
                record.updatedAt = config.updatedAt;
            });
        });

        return config;
    }

    /**
     * Update an existing provider configuration
     */
    async updateProvider(config: LLMConfig): Promise<LLMConfig> {
        const now = Date.now();
        await database.write(async () => {
            const model = await this.collection.find(config.id);
            await model.update((record) => {
                record.name = config.name;
                record.provider = config.provider;
                record.baseUrl = config.baseUrl;
                record.apiKey = config.apiKey;
                record.defaultModel = config.defaultModel;
                (record as any)._setRaw('headers', JSON.stringify(config.headers || {}));
                (record as any)._setRaw('local_models', JSON.stringify(config.localModels || []));
                (record as any)._setRaw('executorch_config', JSON.stringify(config.executorchConfig || null));
                (record as any)._setRaw('llama_cpp_config', JSON.stringify(config.llamaCppConfig || null));
                (record as any)._setRaw('provider_settings', JSON.stringify(config.providerSettings || null));
                record.supportsStreaming = config.supportsStreaming;
                record.isLocal = config.isLocal;
                record.isEnabled = config.isEnabled;
                record.updatedAt = now;
            });
        });
        return { ...config, updatedAt: now };
    }

    /**
     * Remove a provider configuration
     * @throws Error if trying to remove a local provider
     */
    async removeProvider(id: string): Promise<void> {
        const config = await this.getProvider(id);

        if (config && this.isLocalProvider(config.provider)) {
            throw new Error(`Cannot remove local provider '${config.provider}' - local providers are fixed`);
        }

        await database.write(async () => {
            try {
                const model = await this.collection.find(id);
                await model.destroyPermanently();
            } catch {
                // Record doesn't exist, ignore
            }
        });
    }

    /**
     * Get all local provider configurations
     */
    async getLocalProviders(): Promise<LLMConfig[]> {
        const models = await this.collection
            .query(Q.where('is_local', true))
            .fetch();
        return models.map(modelToLLMConfig);
    }

    /**
     * Get all remote provider configurations
     */
    async getRemoteProviders(): Promise<LLMConfig[]> {
        const models = await this.collection
            .query(Q.where('is_local', false))
            .fetch();
        return models.map(modelToLLMConfig);
    }

    /**
     * Get the category of a provider type
     */
    getProviderCategory(providerType: LLMProvider): LLMProviderCategory {
        return getLocalProviders().includes(providerType) ? 'local' : 'remote';
    }

    /**
     * Check if a provider type is a local provider
     */
    isLocalProvider(providerType: LLMProvider): boolean {
        return getLocalProviders().includes(providerType);
    }

    /**
     * Ensure local providers exist in storage
     * Called during app initialization to auto-create local provider configs
     */
    async ensureLocalProviders(): Promise<void> {
        const localProviderTypes = getLocalProviders();
        for (const providerType of localProviderTypes) {
            const existing = await this.getProviderByType(providerType);
            const defaultConfig = getDefaultLocalConfig(providerType);
            if (!existing && defaultConfig) {
                const now = Date.now();
                const config: LLMConfig = {
                    ...defaultConfig,
                    createdAt: now,
                    updatedAt: now,
                };

                await database.write(async () => {
                    await this.collection.create((record: LLMConfigModel) => {
                        (record._raw as any).id = config.id;
                        record.name = config.name;
                        record.provider = config.provider;
                        record.baseUrl = config.baseUrl;
                        record.apiKey = config.apiKey;
                        record.defaultModel = config.defaultModel;
                        (record as any)._setRaw('headers', JSON.stringify(config.headers || {}));
                        (record as any)._setRaw('local_models', JSON.stringify(config.localModels || []));
                        (record as any)._setRaw('executorch_config', JSON.stringify(config.executorchConfig || null));
                        (record as any)._setRaw('llama_cpp_config', JSON.stringify(config.llamaCppConfig || null));
                        (record as any)._setRaw('provider_settings', JSON.stringify(config.providerSettings || null));
                        record.supportsStreaming = config.supportsStreaming;
                        record.isLocal = config.isLocal;
                        record.isEnabled = config.isEnabled;
                        record.createdAt = config.createdAt;
                        record.updatedAt = config.updatedAt;
                    });
                });
                console.log(`[LLMProviderRepository] Auto-created local provider: ${providerType}`);
            }
        }
    }
}

export const llmProviderRepository = new LLMProviderRepository();
