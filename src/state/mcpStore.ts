import { create } from 'zustand';
import { mcpServerRepository } from '../core/storage';
import { MCPServer, generateId } from '../core/types';

interface MCPStoreState {
    servers: MCPServer[];
    isLoading: boolean;
    error: string | null;
}

interface MCPStoreActions {
    loadServers: () => Promise<void>;
    createServer: (server: Omit<MCPServer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<MCPServer>;
    updateServer: (server: MCPServer) => Promise<void>;
    deleteServer: (id: string) => Promise<void>;
    getServerById: (id: string) => MCPServer | undefined;
    testConnection: (id: string) => Promise<boolean>;
    clearError: () => void;
}

type MCPStore = MCPStoreState & MCPStoreActions;

export const useMCPStore = create<MCPStore>((set, get) => ({
    // State
    servers: [],
    isLoading: false,
    error: null,

    // Actions
    loadServers: async () => {
        set({ isLoading: true, error: null });
        try {
            const servers = await mcpServerRepository.findAll();
            set({ servers, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load MCP servers',
                isLoading: false,
            });
        }
    },

    createServer: async (serverData) => {
        const now = Date.now();
        const server: MCPServer = {
            ...serverData,
            id: generateId(),
            createdAt: now,
            updatedAt: now,
        };

        try {
            await mcpServerRepository.create(server);
            set((state) => ({
                servers: [...state.servers, server],
            }));
            return server;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to create MCP server',
            });
            throw error;
        }
    },

    updateServer: async (server) => {
        try {
            const updated = await mcpServerRepository.update(server);
            set((state) => ({
                servers: state.servers.map((s) => (s.id === server.id ? updated : s)),
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to update MCP server',
            });
            throw error;
        }
    },

    deleteServer: async (id) => {
        try {
            await mcpServerRepository.delete(id);
            set((state) => ({
                servers: state.servers.filter((s) => s.id !== id),
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to delete MCP server',
            });
            throw error;
        }
    },

    getServerById: (id) => {
        return get().servers.find((s) => s.id === id);
    },

    testConnection: async (id) => {
        const server = get().servers.find((s) => s.id === id);
        if (!server) return false;

        // TODO: Implement actual MCP connection testing
        // For now, just simulate a test
        try {
            // Placeholder: In a real implementation, this would:
            // - For HTTP: Make a request to the endpoint
            // - For STDIO: Try to spawn the command and check response
            await new Promise((resolve) => setTimeout(resolve, 500));
            return true;
        } catch {
            return false;
        }
    },

    clearError: () => {
        set({ error: null });
    },
}));
