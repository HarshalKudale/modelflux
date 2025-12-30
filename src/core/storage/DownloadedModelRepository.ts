import { DownloadedModel, generateId } from '../types';
import { storageAdapter } from './StorageAdapter';

const STORAGE_KEY_PREFIX = 'downloaded-models';

/**
 * Repository for managing downloaded model metadata
 */
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
    private readonly listKey = `${STORAGE_KEY_PREFIX}:list`;

    private getItemKey(id: string): string {
        return `${STORAGE_KEY_PREFIX}:${id}`;
    }

    async getAll(): Promise<DownloadedModel[]> {
        const ids = await storageAdapter.get<string[]>(this.listKey);
        if (!ids || ids.length === 0) return [];

        const models: DownloadedModel[] = [];
        for (const id of ids) {
            const model = await storageAdapter.get<DownloadedModel>(this.getItemKey(id));
            if (model) {
                // Backward compatibility: add provider and type if missing
                if (!model.provider) {
                    model.provider = 'executorch';
                }
                if (!model.type) {
                    // Determine type from tags for existing models
                    model.type = model.tags?.includes('Embedding') ? 'embedding' : 'llm';
                }
                models.push(model);
            }
        }
        return models;
    }

    async getById(id: string): Promise<DownloadedModel | null> {
        return await storageAdapter.get<DownloadedModel>(this.getItemKey(id));
    }

    async getByModelId(modelId: string): Promise<DownloadedModel | null> {
        const all = await this.getAll();
        return all.find(m => m.modelId === modelId) || null;
    }

    async create(model: Omit<DownloadedModel, 'id'>): Promise<DownloadedModel> {
        const id = generateId();
        const newModel: DownloadedModel = { ...model, id };

        // Save the model
        await storageAdapter.set(this.getItemKey(id), newModel);

        // Update the list
        const ids = await storageAdapter.get<string[]>(this.listKey) || [];
        ids.push(id);
        await storageAdapter.set(this.listKey, ids);

        return newModel;
    }

    async update(id: string, updates: Partial<DownloadedModel>): Promise<DownloadedModel | null> {
        const existing = await this.getById(id);
        if (!existing) return null;

        const updated: DownloadedModel = { ...existing, ...updates };
        await storageAdapter.set(this.getItemKey(id), updated);
        return updated;
    }

    async delete(id: string): Promise<boolean> {
        const existing = await this.getById(id);
        if (!existing) return false;

        // Remove from storage
        await storageAdapter.remove(this.getItemKey(id));

        // Update the list
        const ids = await storageAdapter.get<string[]>(this.listKey) || [];
        const updatedIds = ids.filter((i: string) => i !== id);
        await storageAdapter.set(this.listKey, updatedIds);

        return true;
    }

    async deleteByModelId(modelId: string): Promise<boolean> {
        const model = await this.getByModelId(modelId);
        if (!model) return false;
        return this.delete(model.id);
    }
}

export const downloadedModelRepository = new DownloadedModelRepository();
