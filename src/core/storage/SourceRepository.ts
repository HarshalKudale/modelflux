/**
 * Source Repository
 * 
 * Manages persistence of source documents (PDFs) for RAG using WatermelonDB.
 */

import { Q } from '@nozbe/watermelondb';
import { database } from '../database';
import { SourceModel } from '../database/models';
import { Source } from '../types';

/**
 * Convert WatermelonDB model to Source type
 */
function modelToSource(model: SourceModel): Source {
    return {
        id: model.sourceId,
        name: model.name,
        uri: model.uri,
        fileSize: model.fileSize,
        mimeType: model.mimeType,
        addedAt: model.addedAt,
        isProcessing: model.isProcessing,
    };
}

class SourceRepository {
    private get collection() {
        return database.get<SourceModel>('sources');
    }

    /**
     * Get all sources
     */
    async findAll(): Promise<Source[]> {
        const models = await this.collection.query().fetch();
        return models.map(modelToSource);
    }

    /**
     * Create a new source
     */
    async create(source: Omit<Source, 'id'>): Promise<Source> {
        // Get next ID
        const sources = await this.findAll();
        const maxId = sources.reduce((max, s) => Math.max(max, s.id), 0);
        const newId = maxId + 1;

        const newSource: Source = {
            ...source,
            id: newId,
        };

        await database.write(async () => {
            await this.collection.create((record) => {
                record.sourceId = newId;
                record.name = source.name;
                record.uri = source.uri;
                record.fileSize = source.fileSize;
                record.mimeType = source.mimeType;
                record.addedAt = source.addedAt;
                record.isProcessing = source.isProcessing || false;
            });
        });

        return newSource;
    }

    /**
     * Update an existing source
     */
    async update(source: Source): Promise<Source> {
        await database.write(async () => {
            const models = await this.collection
                .query(Q.where('source_id', source.id))
                .fetch();
            if (models.length > 0) {
                await models[0].update((record) => {
                    record.name = source.name;
                    record.uri = source.uri;
                    record.fileSize = source.fileSize;
                    record.mimeType = source.mimeType;
                    record.addedAt = source.addedAt;
                    record.isProcessing = source.isProcessing || false;
                });
            }
        });
        return source;
    }

    /**
     * Delete a source by ID
     */
    async delete(id: number): Promise<void> {
        await database.write(async () => {
            const models = await this.collection
                .query(Q.where('source_id', id))
                .fetch();
            for (const model of models) {
                await model.destroyPermanently();
            }
        });
    }

    /**
     * Find a source by ID
     */
    async findById(id: number): Promise<Source | null> {
        const models = await this.collection
            .query(Q.where('source_id', id))
            .fetch();
        return models.length > 0 ? modelToSource(models[0]) : null;
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
