import { STORAGE_KEYS } from '../../config/constants';
import { Message } from '../types';
import { storageAdapter } from './StorageAdapter';

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

class MessageRepository implements IMessageRepository {
    private getKey(conversationId: string): string {
        return `${STORAGE_KEYS.MESSAGES_PREFIX}${conversationId}`;
    }

    private async getMessages(conversationId: string): Promise<Message[]> {
        const data = await storageAdapter.get<Message[]>(this.getKey(conversationId));
        return data || [];
    }

    private async saveMessages(conversationId: string, messages: Message[]): Promise<void> {
        await storageAdapter.set(this.getKey(conversationId), messages);
    }

    async findById(id: string): Promise<Message | null> {
        // Need to search all messages - not ideal but works for MVP
        const keys = await storageAdapter.getKeys(STORAGE_KEYS.MESSAGES_PREFIX);
        for (const key of keys) {
            const messages = await storageAdapter.get<Message[]>(key);
            if (messages) {
                const message = messages.find((m) => m.id === id);
                if (message) return message;
            }
        }
        return null;
    }

    async findAll(): Promise<Message[]> {
        const keys = await storageAdapter.getKeys(STORAGE_KEYS.MESSAGES_PREFIX);
        const allMessages: Message[] = [];
        for (const key of keys) {
            const messages = await storageAdapter.get<Message[]>(key);
            if (messages) {
                allMessages.push(...messages);
            }
        }
        return allMessages;
    }

    async findByConversationId(conversationId: string): Promise<Message[]> {
        return this.getMessages(conversationId);
    }

    async findByConversationIdSorted(conversationId: string): Promise<Message[]> {
        const messages = await this.getMessages(conversationId);
        return messages.sort((a, b) => a.timestamp - b.timestamp);
    }

    async create(entity: Message): Promise<Message> {
        const messages = await this.getMessages(entity.conversationId);
        messages.push(entity);
        await this.saveMessages(entity.conversationId, messages);
        return entity;
    }

    async update(entity: Message): Promise<Message> {
        const messages = await this.getMessages(entity.conversationId);
        const index = messages.findIndex((m) => m.id === entity.id);
        if (index === -1) {
            throw new Error(`Message not found: ${entity.id}`);
        }
        messages[index] = entity;
        await this.saveMessages(entity.conversationId, messages);
        return entity;
    }

    async delete(id: string): Promise<void> {
        const message = await this.findById(id);
        if (!message) return;

        const messages = await this.getMessages(message.conversationId);
        const filtered = messages.filter((m) => m.id !== id);
        await this.saveMessages(message.conversationId, filtered);
    }

    async deleteByConversationId(conversationId: string): Promise<void> {
        await storageAdapter.remove(this.getKey(conversationId));
    }

    async createBatch(messages: Message[]): Promise<Message[]> {
        if (messages.length === 0) return [];

        // Group by conversation
        const grouped = messages.reduce((acc, msg) => {
            if (!acc[msg.conversationId]) {
                acc[msg.conversationId] = [];
            }
            acc[msg.conversationId].push(msg);
            return acc;
        }, {} as Record<string, Message[]>);

        // Save each group
        for (const [conversationId, msgs] of Object.entries(grouped)) {
            const existing = await this.getMessages(conversationId);
            existing.push(...msgs);
            await this.saveMessages(conversationId, existing);
        }

        return messages;
    }
}

export const messageRepository = new MessageRepository();
