import { STORAGE_KEYS } from '../../config/constants';
import { Conversation } from '../types';
import { storageAdapter } from './StorageAdapter';

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

class ConversationRepository implements IConversationRepository {
    private async getAll(): Promise<Conversation[]> {
        const data = await storageAdapter.get<Conversation[]>(STORAGE_KEYS.CONVERSATIONS);
        return data || [];
    }

    private async saveAll(conversations: Conversation[]): Promise<void> {
        await storageAdapter.set(STORAGE_KEYS.CONVERSATIONS, conversations);
    }

    async findById(id: string): Promise<Conversation | null> {
        const conversations = await this.getAll();
        return conversations.find((c) => c.id === id) || null;
    }

    async findAll(): Promise<Conversation[]> {
        return this.getAll();
    }

    async findAllSorted(): Promise<Conversation[]> {
        const conversations = await this.getAll();
        return conversations.sort((a, b) => b.updatedAt - a.updatedAt);
    }

    async create(entity: Conversation): Promise<Conversation> {
        const conversations = await this.getAll();
        conversations.push(entity);
        await this.saveAll(conversations);
        return entity;
    }

    async update(entity: Conversation): Promise<Conversation> {
        const conversations = await this.getAll();
        const index = conversations.findIndex((c) => c.id === entity.id);
        if (index === -1) {
            throw new Error(`Conversation not found: ${entity.id}`);
        }
        conversations[index] = { ...entity, updatedAt: Date.now() };
        await this.saveAll(conversations);
        return conversations[index];
    }

    async delete(id: string): Promise<void> {
        const conversations = await this.getAll();
        const filtered = conversations.filter((c) => c.id !== id);
        await this.saveAll(filtered);
    }

    async search(query: string): Promise<Conversation[]> {
        const conversations = await this.getAll();
        const lowerQuery = query.toLowerCase();
        return conversations.filter((c) =>
            c.title.toLowerCase().includes(lowerQuery)
        );
    }

    async touch(id: string): Promise<void> {
        const conversation = await this.findById(id);
        if (conversation) {
            await this.update({ ...conversation, updatedAt: Date.now() });
        }
    }
}

export const conversationRepository = new ConversationRepository();
