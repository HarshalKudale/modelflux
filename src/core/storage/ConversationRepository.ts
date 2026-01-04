/**
 * Conversation Repository
 *
 * Manages persistence of conversations using WatermelonDB.
 */
import { Q } from '@nozbe/watermelondb';
import { database } from '../database';
import { ConversationModel } from '../database/models';
import { Conversation } from '../types';

export interface IConversationRepository {
    findById(id: string): Promise<Conversation | null>;
    findAll(): Promise<Conversation[]>;
    findAllSorted(): Promise<Conversation[]>;
    create(entity: Conversation): Promise<Conversation>;
    update(entity: Conversation): Promise<Conversation>;
    delete(id: string): Promise<void>;
    search(query: string): Promise<Conversation[]>;
    touch(id: string): Promise<void>;
}

/**
 * Convert WatermelonDB model to Conversation type
 */
function modelToConversation(model: ConversationModel): Conversation {
    return {
        id: model.id,
        title: model.title,
        providerId: model.providerId,
        modelId: model.modelId,
        providerType: model.providerType as Conversation['providerType'],
        personaId: model.personaId,
        personaPrompt: model.personaPrompt,
        contextPrompt: model.contextPrompt,
        attachedSourceIds: model.attachedSourceIds,
        thinkingEnabled: model.thinkingEnabled,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
    };
}

class ConversationRepository implements IConversationRepository {
    private get collection() {
        return database.get<ConversationModel>('conversations');
    }

    async findById(id: string): Promise<Conversation | null> {
        try {
            const model = await this.collection.find(id);
            return modelToConversation(model);
        } catch {
            return null;
        }
    }

    async findAll(): Promise<Conversation[]> {
        const models = await this.collection.query().fetch();
        return models.map(modelToConversation);
    }

    async findAllSorted(): Promise<Conversation[]> {
        const models = await this.collection
            .query(Q.sortBy('updated_at', Q.desc))
            .fetch();
        return models.map(modelToConversation);
    }

    async create(entity: Conversation): Promise<Conversation> {
        let created: ConversationModel | null = null;
        await database.write(async () => {
            created = await this.collection.create((record) => {
                // Use prepareCreate with custom ID
                (record._raw as any).id = entity.id;
                record.title = entity.title;
                record.providerId = entity.providerId;
                record.modelId = entity.modelId;
                record.providerType = entity.providerType;
                record.personaId = entity.personaId;
                record.personaPrompt = entity.personaPrompt;
                record.contextPrompt = entity.contextPrompt;
                (record as any)._setRaw('attached_source_ids', JSON.stringify(entity.attachedSourceIds || []));
                record.thinkingEnabled = entity.thinkingEnabled || false;
                record.createdAt = entity.createdAt;
                record.updatedAt = entity.updatedAt;
            });
        });
        return entity;
    }

    async update(entity: Conversation): Promise<Conversation> {
        await database.write(async () => {
            const model = await this.collection.find(entity.id);
            await model.update((record) => {
                record.title = entity.title;
                record.providerId = entity.providerId;
                record.modelId = entity.modelId;
                record.providerType = entity.providerType;
                record.personaId = entity.personaId;
                record.personaPrompt = entity.personaPrompt;
                record.contextPrompt = entity.contextPrompt;
                (record as any)._setRaw('attached_source_ids', JSON.stringify(entity.attachedSourceIds || []));
                record.thinkingEnabled = entity.thinkingEnabled || false;
                record.updatedAt = Date.now();
            });
        });
        return { ...entity, updatedAt: Date.now() };
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

    async search(query: string): Promise<Conversation[]> {
        const lowerQuery = query.toLowerCase();
        const models = await this.collection
            .query(Q.where('title', Q.like(`%${Q.sanitizeLikeString(lowerQuery)}%`)))
            .fetch();
        return models.map(modelToConversation);
    }

    async touch(id: string): Promise<void> {
        await database.write(async () => {
            try {
                const model = await this.collection.find(id);
                await model.update((record) => {
                    record.updatedAt = Date.now();
                });
            } catch {
                // Record doesn't exist, ignore
            }
        });
    }
}

export const conversationRepository = new ConversationRepository();
