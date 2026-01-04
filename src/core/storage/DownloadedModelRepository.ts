/**
 * Downloaded Model Repository
 *
 * Repository for managing downloaded model metadata using WatermelonDB.
 */

import { Q } from '@nozbe/watermelondb';
import { database } from '../database';
import { DownloadedModelModel } from '../database/models';
import { DownloadedModel, DownloadedModelProvider, DownloadedModelType, generateId, ModelDownloadStatus, ModelTag } from '../types';

/**
 * Convert WatermelonDB model to DownloadedModel type
 */
function modelToDownloadedModel(model: DownloadedModelModel): DownloadedModel {
    return {
        id: model.id,
        modelId: model.modelId,
        name: model.name,
        description: model.description,
        provider: model.provider as DownloadedModelProvider,
        type: model.type as DownloadedModelType,
        tags: model.tags as ModelTag[],
        localPath: model.localPath,
        modelFilePath: model.modelFilePath,
        tokenizerFilePath: model.tokenizerFilePath,
        tokenizerConfigFilePath: model.tokenizerConfigFilePath,
        sizeEstimate: model.sizeEstimate,
        downloadedSize: model.downloadedSize,
        status: model.status as ModelDownloadStatus,
        progress: model.progress,
        downloadedAt: model.downloadedAt,
        errorMessage: model.errorMessage,
    };
}

export interface IDownloadedModelRepository {
    getAll(): Promise<DownloadedModel[]>;
    getById(id: string): Promise<DownloadedModel | null>;
    getByModelId(modelId: string): Promise<DownloadedModel | null>;
    create(model: Omit<DownloadedModel, 'id'>): Promise<DownloadedModel>;
    update(id: string, updates: Partial<DownloadedModel>): Promise<DownloadedModel | null>;
    delete(id: string): Promise<boolean>;
    deleteByModelId(modelId: string): Promise<boolean>;
}

class DownloadedModelRepository implements IDownloadedModelRepository {
    private get collection() {
        return database.get<DownloadedModelModel>('downloaded_models');
    }

    async getAll(): Promise<DownloadedModel[]> {
        const models = await this.collection.query().fetch();
        return models.map(modelToDownloadedModel);
    }

    async getById(id: string): Promise<DownloadedModel | null> {
        try {
            const model = await this.collection.find(id);
            return modelToDownloadedModel(model);
        } catch {
            return null;
        }
    }

    async getByModelId(modelId: string): Promise<DownloadedModel | null> {
        const models = await this.collection
            .query(Q.where('model_id', modelId))
            .fetch();
        return models.length > 0 ? modelToDownloadedModel(models[0]) : null;
    }

    async create(model: Omit<DownloadedModel, 'id'>): Promise<DownloadedModel> {
        const id = generateId();
        const newModel: DownloadedModel = { ...model, id };

        await database.write(async () => {
            await this.collection.create((record) => {
                (record._raw as any).id = id;
                record.modelId = model.modelId;
                record.name = model.name;
                record.description = model.description;
                record.provider = model.provider;
                record.type = model.type;
                (record as any)._setRaw('tags', JSON.stringify(model.tags || []));
                record.localPath = model.localPath;
                record.modelFilePath = model.modelFilePath;
                record.tokenizerFilePath = model.tokenizerFilePath;
                record.tokenizerConfigFilePath = model.tokenizerConfigFilePath;
                record.sizeEstimate = model.sizeEstimate;
                record.downloadedSize = model.downloadedSize;
                record.status = model.status;
                record.progress = model.progress;
                record.downloadedAt = model.downloadedAt;
                record.errorMessage = model.errorMessage;
            });
        });

        return newModel;
    }

    async update(id: string, updates: Partial<DownloadedModel>): Promise<DownloadedModel | null> {
        try {
            const existing = await this.getById(id);
            if (!existing) return null;

            await database.write(async () => {
                const model = await this.collection.find(id);
                await model.update((record) => {
                    if (updates.modelId !== undefined) record.modelId = updates.modelId;
                    if (updates.name !== undefined) record.name = updates.name;
                    if (updates.description !== undefined) record.description = updates.description;
                    if (updates.provider !== undefined) record.provider = updates.provider;
                    if (updates.type !== undefined) record.type = updates.type;
                    if (updates.tags !== undefined) (record as any)._setRaw('tags', JSON.stringify(updates.tags));
                    if (updates.localPath !== undefined) record.localPath = updates.localPath;
                    if (updates.modelFilePath !== undefined) record.modelFilePath = updates.modelFilePath;
                    if (updates.tokenizerFilePath !== undefined) record.tokenizerFilePath = updates.tokenizerFilePath;
                    if (updates.tokenizerConfigFilePath !== undefined) record.tokenizerConfigFilePath = updates.tokenizerConfigFilePath;
                    if (updates.sizeEstimate !== undefined) record.sizeEstimate = updates.sizeEstimate;
                    if (updates.downloadedSize !== undefined) record.downloadedSize = updates.downloadedSize;
                    if (updates.status !== undefined) record.status = updates.status;
                    if (updates.progress !== undefined) record.progress = updates.progress;
                    if (updates.downloadedAt !== undefined) record.downloadedAt = updates.downloadedAt;
                    if (updates.errorMessage !== undefined) record.errorMessage = updates.errorMessage;
                });
            });

            return { ...existing, ...updates };
        } catch {
            return null;
        }
    }

    async delete(id: string): Promise<boolean> {
        try {
            await database.write(async () => {
                const model = await this.collection.find(id);
                await model.destroyPermanently();
            });
            return true;
        } catch {
            return false;
        }
    }

    async deleteByModelId(modelId: string): Promise<boolean> {
        const model = await this.getByModelId(modelId);
        if (!model) return false;
        return this.delete(model.id);
    }
}

export const downloadedModelRepository = new DownloadedModelRepository();
