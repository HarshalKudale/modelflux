/**
 * RAG Config Repository
 * 
 * Persistence layer for RAG provider configurations.
 * Similar to LLMConfigRepository but for RAG configs.
 */

import { RAGConfig } from '../types';
import { storageAdapter } from './StorageAdapter';

const STORAGE_KEY = 'rag_configs';

class RAGConfigRepository {
    /**
     * Get all RAG configs
     */
    async findAll(): Promise<RAGConfig[]> {
        try {
            const data = await storageAdapter.get<RAGConfig[]>(STORAGE_KEY);
            return data || [];
        } catch (error) {
            console.error('[RAGConfigRepository] Error loading configs:', error);
            return [];
        }
    }

    /**
     * Get a single config by ID
     */
    async findById(id: string): Promise<RAGConfig | null> {
        const configs = await this.findAll();
        return configs.find(c => c.id === id) || null;
    }

    /**
     * Get the default RAG config
     */
    async getDefault(): Promise<RAGConfig | null> {
        const configs = await this.findAll();
        return configs.find(c => c.isDefault) || null;
    }

    /**
     * Create a new RAG config
     */
    async create(config: RAGConfig): Promise<RAGConfig> {
        const configs = await this.findAll();

        // If this is set as default, unset other defaults
        if (config.isDefault) {
            configs.forEach(c => c.isDefault = false);
        }

        configs.push(config);
        await storageAdapter.set(STORAGE_KEY, configs);
        return config;
    }

    /**
     * Update an existing RAG config
     */
    async update(config: RAGConfig): Promise<RAGConfig> {
        let configs = await this.findAll();

        // If this is set as default, unset other defaults
        if (config.isDefault) {
            configs.forEach(c => {
                if (c.id !== config.id) c.isDefault = false;
            });
        }

        configs = configs.map(c => c.id === config.id ? config : c);
        await storageAdapter.set(STORAGE_KEY, configs);
        return config;
    }

    /**
     * Delete a RAG config
     */
    async delete(id: string): Promise<void> {
        const configs = await this.findAll();
        const filtered = configs.filter(c => c.id !== id);
        await storageAdapter.set(STORAGE_KEY, filtered);
    }

    /**
     * Set a config as the default
     */
    async setDefault(id: string): Promise<void> {
        const configs = await this.findAll();
        const updated = configs.map(c => ({
            ...c,
            isDefault: c.id === id,
        }));
        await storageAdapter.set(STORAGE_KEY, updated);
    }
}

export const ragConfigRepository = new RAGConfigRepository();
