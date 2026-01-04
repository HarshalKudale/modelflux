/**
 * RAG Config Repository
 * 
 * Persistence layer for RAG provider configurations using WatermelonDB.
 */

import { Q } from '@nozbe/watermelondb';
import { database } from '../database';
import { RAGConfigModel } from '../database/models';
import { RAGConfig, RAGProvider } from '../types';

/**
 * Convert WatermelonDB model to RAGConfig type
 */
function modelToRAGConfig(model: RAGConfigModel): RAGConfig {
    return {
        id: model.id,
        name: model.name,
        provider: model.provider as RAGProvider,
        modelId: model.modelId,
        modelName: model.modelName,
        modelPath: model.modelPath,
        tokenizerPath: model.tokenizerPath,
        isDefault: model.isDefault,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
    };
}

class RAGConfigRepository {
    private get collection() {
        return database.get<RAGConfigModel>('rag_configs');
    }

    /**
     * Get all RAG configs
     */
    async findAll(): Promise<RAGConfig[]> {
        try {
            const models = await this.collection.query().fetch();
            return models.map(modelToRAGConfig);
        } catch (error) {
            console.error('[RAGConfigRepository] Error loading configs:', error);
            return [];
        }
    }

    /**
     * Get a single config by ID
     */
    async findById(id: string): Promise<RAGConfig | null> {
        try {
            const model = await this.collection.find(id);
            return modelToRAGConfig(model);
        } catch {
            return null;
        }
    }

    /**
     * Get the default RAG config
     */
    async getDefault(): Promise<RAGConfig | null> {
        const models = await this.collection
            .query(Q.where('is_default', true))
            .fetch();
        return models.length > 0 ? modelToRAGConfig(models[0]) : null;
    }

    /**
     * Create a new RAG config
     */
    async create(config: RAGConfig): Promise<RAGConfig> {
        // If this is set as default, unset other defaults
        if (config.isDefault) {
            await this.clearDefaults();
        }

        await database.write(async () => {
            await this.collection.create((record) => {
                (record._raw as any).id = config.id;
                record.name = config.name;
                record.provider = config.provider;
                record.modelId = config.modelId;
                record.modelName = config.modelName;
                record.modelPath = config.modelPath;
                record.tokenizerPath = config.tokenizerPath;
                record.isDefault = config.isDefault;
                record.createdAt = config.createdAt;
                record.updatedAt = config.updatedAt;
            });
        });

        return config;
    }

    /**
     * Update an existing RAG config
     */
    async update(config: RAGConfig): Promise<RAGConfig> {
        // If this is set as default, unset other defaults
        if (config.isDefault) {
            await this.clearDefaults(config.id);
        }

        await database.write(async () => {
            const model = await this.collection.find(config.id);
            await model.update((record) => {
                record.name = config.name;
                record.provider = config.provider;
                record.modelId = config.modelId;
                record.modelName = config.modelName;
                record.modelPath = config.modelPath;
                record.tokenizerPath = config.tokenizerPath;
                record.isDefault = config.isDefault;
                record.updatedAt = Date.now();
            });
        });

        return config;
    }

    /**
     * Delete a RAG config
     */
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

    /**
     * Set a config as the default
     */
    async setDefault(id: string): Promise<void> {
        await this.clearDefaults();
        await database.write(async () => {
            try {
                const model = await this.collection.find(id);
                await model.update((record) => {
                    record.isDefault = true;
                });
            } catch {
                // Record doesn't exist, ignore
            }
        });
    }

    /**
     * Clear all default flags except for the given ID
     */
    private async clearDefaults(exceptId?: string): Promise<void> {
        await database.write(async () => {
            const models = await this.collection
                .query(Q.where('is_default', true))
                .fetch();
            for (const model of models) {
                if (model.id !== exceptId) {
                    await model.update((record) => {
                        record.isDefault = false;
                    });
                }
            }
        });
    }
}

export const ragConfigRepository = new RAGConfigRepository();
