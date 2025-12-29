/**
 * Source Repository
 * 
 * Manages persistence of source documents (PDFs) for RAG.
 * Uses the same storage adapter pattern as other repositories.
 */

import { Source } from '../types';
import { storageAdapter } from './StorageAdapter';

const SOURCES_KEY = 'llmhub_sources';

class SourceRepository {
    /**
     * Get all sources
     */
    async findAll(): Promise<Source[]> {
        const sources = await storageAdapter.get<Source[]>(SOURCES_KEY);
        return sources || [];
    }

    /**
     * Create a new source
     */
    async create(source: Omit<Source, 'id'>): Promise<Source> {
        const sources = await this.findAll();

        // Generate a new ID (use timestamp as simple incrementing ID)
        const maxId = sources.reduce((max, s) => Math.max(max, s.id), 0);
        const newSource: Source = {
            ...source,
            id: maxId + 1,
        };

        sources.push(newSource);
        await storageAdapter.set(SOURCES_KEY, sources);

        return newSource;
    }

    /**
     * Update an existing source
     */
    async update(source: Source): Promise<Source> {
        const sources = await this.findAll();
        const index = sources.findIndex((s) => s.id === source.id);

        if (index === -1) {
            throw new Error(`Source with id ${source.id} not found`);
        }

        sources[index] = source;
        await storageAdapter.set(SOURCES_KEY, sources);

        return source;
    }

    /**
     * Delete a source by ID
     */
    async delete(id: number): Promise<void> {
        const sources = await this.findAll();
        const filtered = sources.filter((s) => s.id !== id);
        await storageAdapter.set(SOURCES_KEY, filtered);
    }

    /**
     * Find a source by ID
     */
    async findById(id: number): Promise<Source | null> {
        const sources = await this.findAll();
        return sources.find((s) => s.id === id) || null;
    }

    /**
     * Rename a source
     */
    async rename(id: number, newName: string): Promise<Source | null> {
        const source = await this.findById(id);
        if (!source) return null;

        source.name = newName;
        return this.update(source);
    }
}

export const sourceRepository = new SourceRepository();
