import { STORAGE_KEYS } from '../../config/constants';
import { MCPServer } from '../types';
import { storageAdapter } from './StorageAdapter';

export interface IMCPServerRepository {
    findById(id: string): Promise<MCPServer | null>;
    findAll(): Promise<MCPServer[]>;
    create(entity: MCPServer): Promise<MCPServer>;
    update(entity: MCPServer): Promise<MCPServer>;
    delete(id: string): Promise<void>;
}

class MCPServerRepository implements IMCPServerRepository {
    private async getAll(): Promise<MCPServer[]> {
        const data = await storageAdapter.get<MCPServer[]>(STORAGE_KEYS.MCP_SERVERS);
        return data || [];
    }

    private async saveAll(servers: MCPServer[]): Promise<void> {
        await storageAdapter.set(STORAGE_KEYS.MCP_SERVERS, servers);
    }

    async findById(id: string): Promise<MCPServer | null> {
        const servers = await this.getAll();
        return servers.find((s) => s.id === id) || null;
    }

    async findAll(): Promise<MCPServer[]> {
        return this.getAll();
    }

    async create(entity: MCPServer): Promise<MCPServer> {
        const servers = await this.getAll();
        servers.push(entity);
        await this.saveAll(servers);
        return entity;
    }

    async update(entity: MCPServer): Promise<MCPServer> {
        const servers = await this.getAll();
        const index = servers.findIndex((s) => s.id === entity.id);
        if (index === -1) {
            throw new Error(`MCP Server not found: ${entity.id}`);
        }
        servers[index] = { ...entity, updatedAt: Date.now() };
        await this.saveAll(servers);
        return servers[index];
    }

    async delete(id: string): Promise<void> {
        const servers = await this.getAll();
        const filtered = servers.filter((s) => s.id !== id);
        await this.saveAll(filtered);
    }
}

export const mcpServerRepository = new MCPServerRepository();
