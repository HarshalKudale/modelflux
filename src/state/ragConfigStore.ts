/**
 * RAG Config Store
 * 
 * Zustand store for managing RAG provider configurations.
 * Similar to llmStore but for RAG providers.
 */

import { create } from 'zustand';
import { ragConfigRepository } from '../core/storage';
import { generateId, RAGConfig } from '../core/types';

interface RAGConfigStoreState {
    configs: RAGConfig[];
    isLoading: boolean;
    error: string | null;
}

interface RAGConfigStoreActions {
    loadConfigs: () => Promise<void>;
    createConfig: (config: Omit<RAGConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<RAGConfig>;
    updateConfig: (config: RAGConfig) => Promise<void>;
    deleteConfig: (id: string) => Promise<void>;
    setDefaultConfig: (id: string) => Promise<void>;
    getDefaultConfig: () => RAGConfig | null;
    getConfigById: (id: string) => RAGConfig | undefined;
    clearError: () => void;
}

type RAGConfigStore = RAGConfigStoreState & RAGConfigStoreActions;

export const useRagConfigStore = create<RAGConfigStore>((set, get) => ({
    // State
    configs: [],
    isLoading: false,
    error: null,

    // Actions
    loadConfigs: async () => {
        set({ isLoading: true, error: null });
        try {
            const configs = await ragConfigRepository.findAll();
            set({ configs, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load RAG configs',
                isLoading: false,
            });
        }
    },

    createConfig: async (configData) => {
        const now = Date.now();
        const config: RAGConfig = {
            ...configData,
            id: generateId(),
            createdAt: now,
            updatedAt: now,
        };

        try {
            await ragConfigRepository.create(config);
            set((state) => ({ configs: [...state.configs, config] }));
            return config;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to create RAG config',
            });
            throw error;
        }
    },

    updateConfig: async (config) => {
        try {
            const updated = await ragConfigRepository.update(config);

            // If this config is now default, update all others
            if (updated.isDefault) {
                set((state) => ({
                    configs: state.configs.map((c) => ({
                        ...c,
                        isDefault: c.id === updated.id,
                    })),
                }));
            } else {
                set((state) => ({
                    configs: state.configs.map((c) => (c.id === updated.id ? updated : c)),
                }));
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to update RAG config',
            });
            throw error;
        }
    },

    deleteConfig: async (id) => {
        try {
            await ragConfigRepository.delete(id);
            set((state) => ({
                configs: state.configs.filter((c) => c.id !== id),
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to delete RAG config',
            });
            throw error;
        }
    },

    setDefaultConfig: async (id) => {
        try {
            await ragConfigRepository.setDefault(id);
            set((state) => ({
                configs: state.configs.map((c) => ({
                    ...c,
                    isDefault: c.id === id,
                })),
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to set default RAG config',
            });
            throw error;
        }
    },

    getDefaultConfig: () => {
        return get().configs.find((c) => c.isDefault) || null;
    },

    getConfigById: (id) => {
        return get().configs.find((c) => c.id === id);
    },

    clearError: () => {
        set({ error: null });
    },
}));
