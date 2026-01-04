/**
 * Message Repository
 *
 * Manages persistence of messages using WatermelonDB.
 */
import { Q } from '@nozbe/watermelondb';
import { database } from '../database';
import { MessageModel } from '../database/models';
import { Message, MessageContentType, MessageImage, TokenUsage } from '../types';

export interface IMessageRepository {
    findById(id: string): Promise<Message | null>;
    findAll(): Promise<Message[]>;
    findByConversationId(conversationId: string): Promise<Message[]>;
    findByConversationIdSorted(conversationId: string): Promise<Message[]>;
    create(entity: Message): Promise<Message>;
    update(entity: Message): Promise<Message>;
    delete(id: string): Promise<void>;
    deleteByConversationId(conversationId: string): Promise<void>;
    createBatch(messages: Message[]): Promise<Message[]>;
}

/**
 * Convert WatermelonDB model to Message type
 */
function modelToMessage(model: MessageModel): Message {
    return {
        id: model.id,
        conversationId: model.conversationId,
        role: model.role as Message['role'],
        content: model.content,
        contentType: model.contentType as MessageContentType,
        images: model.images as MessageImage[],
        modelId: model.modelId,
        usage: model.usage as TokenUsage | undefined,
        thinkingContent: model.thinkingContent,
        context: model.context,
        contextIds: model.contextIds,
        interrupted: model.interrupted,
        timestamp: model.timestamp,
    };
}

class MessageRepository implements IMessageRepository {
    private get collection() {
        return database.get<MessageModel>('messages');
    }

    async findById(id: string): Promise<Message | null> {
        try {
            const model = await this.collection.find(id);
            return modelToMessage(model);
        } catch {
            return null;
        }
    }

    async findAll(): Promise<Message[]> {
        const models = await this.collection.query().fetch();
        return models.map(modelToMessage);
    }

    async findByConversationId(conversationId: string): Promise<Message[]> {
        const models = await this.collection
            .query(Q.where('conversation_id', conversationId))
            .fetch();
        return models.map(modelToMessage);
    }

    async findByConversationIdSorted(conversationId: string): Promise<Message[]> {
        const models = await this.collection
            .query(
                Q.where('conversation_id', conversationId),
                Q.sortBy('timestamp', Q.asc)
            )
            .fetch();
        return models.map(modelToMessage);
    }

    async create(entity: Message): Promise<Message> {
        await database.write(async () => {
            await this.collection.create((record) => {
                (record._raw as any).id = entity.id;
                record.conversationId = entity.conversationId;
                record.role = entity.role;
                record.content = entity.content;
                record.contentType = entity.contentType;
                (record as any)._setRaw('images', JSON.stringify(entity.images || []));
                record.modelId = entity.modelId;
                (record as any)._setRaw('usage', JSON.stringify(entity.usage || null));
                record.thinkingContent = entity.thinkingContent;
                record.context = entity.context;
                (record as any)._setRaw('context_ids', JSON.stringify(entity.contextIds || []));
                record.interrupted = entity.interrupted || false;
                record.timestamp = entity.timestamp;
            });
        });
        return entity;
    }

    async update(entity: Message): Promise<Message> {
        await database.write(async () => {
            const model = await this.collection.find(entity.id);
            await model.update((record) => {
                record.content = entity.content;
                record.contentType = entity.contentType;
                (record as any)._setRaw('images', JSON.stringify(entity.images || []));
                record.modelId = entity.modelId;
                (record as any)._setRaw('usage', JSON.stringify(entity.usage || null));
                record.thinkingContent = entity.thinkingContent;
                record.context = entity.context;
                (record as any)._setRaw('context_ids', JSON.stringify(entity.contextIds || []));
                record.interrupted = entity.interrupted || false;
            });
        });
        return entity;
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

    async deleteByConversationId(conversationId: string): Promise<void> {
        await database.write(async () => {
            const models = await this.collection
                .query(Q.where('conversation_id', conversationId))
                .fetch();
            for (const model of models) {
                await model.destroyPermanently();
            }
        });
    }

    async createBatch(messages: Message[]): Promise<Message[]> {
        if (messages.length === 0) return [];

        await database.write(async () => {
            for (const entity of messages) {
                await this.collection.create((record) => {
                    (record._raw as any).id = entity.id;
                    record.conversationId = entity.conversationId;
                    record.role = entity.role;
                    record.content = entity.content;
                    record.contentType = entity.contentType;
                    (record as any)._setRaw('images', JSON.stringify(entity.images || []));
                    record.modelId = entity.modelId;
                    (record as any)._setRaw('usage', JSON.stringify(entity.usage || null));
                    record.thinkingContent = entity.thinkingContent;
                    record.context = entity.context;
                    (record as any)._setRaw('context_ids', JSON.stringify(entity.contextIds || []));
                    record.interrupted = entity.interrupted || false;
                    record.timestamp = entity.timestamp;
                });
            }
        });

        return messages;
    }
}

export const messageRepository = new MessageRepository();
