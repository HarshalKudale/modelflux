/**
 * LLM Config Repository
 *
 * Manages persistence of LLM configurations using WatermelonDB.
 */
import { Q } from '@nozbe/watermelondb';
import { database } from '../database';
import { LLMConfigModel } from '../database/models';
import { LLMConfig, LLMProvider } from '../types';

export interface ILLMConfigRepository {
    findById(id: string): Promise<LLMConfig | null>;
    findAll(): Promise<LLMConfig[]>;
    findEnabled(): Promise<LLMConfig[]>;
    findByProvider(provider: LLMProvider): Promise<LLMConfig[]>;
    create(entity: LLMConfig): Promise<LLMConfig>;
    update(entity: LLMConfig): Promise<LLMConfig>;
    delete(id: string): Promise<void>;
}

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

class LLMConfigRepository implements ILLMConfigRepository {
    private get collection() {
        return database.get<LLMConfigModel>('llm_configs');
    }

    async findById(id: string): Promise<LLMConfig | null> {
        try {
            const model = await this.collection.find(id);
            return modelToLLMConfig(model);
        } catch {
            return null;
        }
    }

    async findAll(): Promise<LLMConfig[]> {
        const models = await this.collection.query().fetch();
        return models.map(modelToLLMConfig);
    }

    async findEnabled(): Promise<LLMConfig[]> {
        const models = await this.collection
            .query(Q.where('is_enabled', true))
            .fetch();
        return models.map(modelToLLMConfig);
    }

    async findByProvider(provider: LLMProvider): Promise<LLMConfig[]> {
        const models = await this.collection
            .query(Q.where('provider', provider))
            .fetch();
        return models.map(modelToLLMConfig);
    }

    async create(entity: LLMConfig): Promise<LLMConfig> {
        await database.write(async () => {
            await this.collection.create((record) => {
                (record._raw as any).id = entity.id;
                record.name = entity.name;
                record.provider = entity.provider;
                record.baseUrl = entity.baseUrl;
                record.apiKey = entity.apiKey;
                record.defaultModel = entity.defaultModel;
                (record as any)._setRaw('headers', JSON.stringify(entity.headers || {}));
                (record as any)._setRaw('local_models', JSON.stringify(entity.localModels || []));
                (record as any)._setRaw('executorch_config', JSON.stringify(entity.executorchConfig || null));
                (record as any)._setRaw('llama_cpp_config', JSON.stringify(entity.llamaCppConfig || null));
                (record as any)._setRaw('provider_settings', JSON.stringify(entity.providerSettings || null));
                record.supportsStreaming = entity.supportsStreaming;
                record.isLocal = entity.isLocal;
                record.isEnabled = entity.isEnabled;
                record.createdAt = entity.createdAt;
                record.updatedAt = entity.updatedAt;
            });
        });
        return entity;
    }

    async update(entity: LLMConfig): Promise<LLMConfig> {
        const now = Date.now();
        await database.write(async () => {
            const model = await this.collection.find(entity.id);
            await model.update((record) => {
                record.name = entity.name;
                record.provider = entity.provider;
                record.baseUrl = entity.baseUrl;
                record.apiKey = entity.apiKey;
                record.defaultModel = entity.defaultModel;
                (record as any)._setRaw('headers', JSON.stringify(entity.headers || {}));
                (record as any)._setRaw('local_models', JSON.stringify(entity.localModels || []));
                (record as any)._setRaw('executorch_config', JSON.stringify(entity.executorchConfig || null));
                (record as any)._setRaw('llama_cpp_config', JSON.stringify(entity.llamaCppConfig || null));
                (record as any)._setRaw('provider_settings', JSON.stringify(entity.providerSettings || null));
                record.supportsStreaming = entity.supportsStreaming;
                record.isLocal = entity.isLocal;
                record.isEnabled = entity.isEnabled;
                record.updatedAt = now;
            });
        });
        return { ...entity, updatedAt: now };
    }

    async delete(id: string): Promise<void> {
        await database.write(async () => {
            try {
                const model = await this.collection.find(id);
                await model.destroyPermanently();
            } catch {
                // Record doesn't exist, ignore
            }
        });
    }
}

export const llmConfigRepository = new LLMConfigRepository();
