import { STORAGE_KEYS } from '../../config/constants';
import { LLMConfig, LLMProvider } from '../types';
import { storageAdapter } from './StorageAdapter';

export interface ILLMConfigRepository {
    findById(id: string): Promise<LLMConfig | null>;
    findAll(): Promise<LLMConfig[]>;
    findEnabled(): Promise<LLMConfig[]>;
    findByProvider(provider: LLMProvider): Promise<LLMConfig[]>;
    create(entity: LLMConfig): Promise<LLMConfig>;
    update(entity: LLMConfig): Promise<LLMConfig>;
    delete(id: string): Promise<void>;
}

class LLMConfigRepository implements ILLMConfigRepository {
    private async getAll(): Promise<LLMConfig[]> {
        const data = await storageAdapter.get<LLMConfig[]>(STORAGE_KEYS.LLM_CONFIGS);
        return data || [];
    }

    private async saveAll(configs: LLMConfig[]): Promise<void> {
        await storageAdapter.set(STORAGE_KEYS.LLM_CONFIGS, configs);
    }

    async findById(id: string): Promise<LLMConfig | null> {
        const configs = await this.getAll();
        return configs.find((c) => c.id === id) || null;
    }

    async findAll(): Promise<LLMConfig[]> {
        return this.getAll();
    }

    async findEnabled(): Promise<LLMConfig[]> {
        const configs = await this.getAll();
        return configs.filter((c) => c.isEnabled);
    }

    async findByProvider(provider: LLMProvider): Promise<LLMConfig[]> {
        const configs = await this.getAll();
        return configs.filter((c) => c.provider === provider);
    }

    async create(entity: LLMConfig): Promise<LLMConfig> {
        const configs = await this.getAll();
        configs.push(entity);
        await this.saveAll(configs);
        return entity;
    }

    async update(entity: LLMConfig): Promise<LLMConfig> {
        const configs = await this.getAll();
        const index = configs.findIndex((c) => c.id === entity.id);
        if (index === -1) {
            throw new Error(`LLM Config not found: ${entity.id}`);
        }
        configs[index] = { ...entity, updatedAt: Date.now() };
        await this.saveAll(configs);
        return configs[index];
    }

    async delete(id: string): Promise<void> {
        const configs = await this.getAll();
        const filtered = configs.filter((c) => c.id !== id);
        await this.saveAll(filtered);
    }
}

export const llmConfigRepository = new LLMConfigRepository();
