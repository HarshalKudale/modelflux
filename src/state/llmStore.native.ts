/**
 * LLM Store - Native Implementation
 * Includes auto-creation of local providers
 */
import { create } from 'zustand';
import { PROVIDER_LIST } from '../config/providerPresets';
import { llmClientFactory } from '../core/llm';
import { llmConfigRepository } from '../core/storage';
import { LLMConfig, LLMProvider, LLMProviderKey, generateId } from '../core/types';

const DEFAULT_EXECUTORCH_CONFIG: LLMConfig = {
    id: 'executorch-default',
    name: 'ExecuTorch (Local)',
    provider: 'executorch',
    baseUrl: '',
    defaultModel: '',
    supportsStreaming: true,
    isLocal: true,
    isEnabled: true,
    createdAt: 0,
    updatedAt: 0,
};

const DEFAULT_LLAMA_CPP_CONFIG: LLMConfig = {
    id: 'llama-cpp-default',
    name: 'Llama.cpp (Local)',
    provider: 'llama-cpp',
    baseUrl: '',
    defaultModel: '',
    supportsStreaming: true,
    isLocal: true,
    isEnabled: true,
    createdAt: 0,
    updatedAt: 0,
};

interface LLMStoreState {
    configs: LLMConfig[];
    selectedConfigId: string | null;
    availableModels: Record<string, string[]>;
    isLoadingModels: boolean;
    isLoading: boolean;
    error: string | null;
}

interface LLMStoreActions {
    loadConfigs: () => Promise<void>;
    createConfig: (
        config: Omit<LLMConfig, 'id' | 'createdAt' | 'updatedAt'>
    ) => Promise<LLMConfig>;
    createFromPreset: (provider: LLMProvider, apiKey?: string) => Promise<LLMConfig>;
    updateConfig: (config: LLMConfig) => Promise<void>;
    deleteConfig: (id: string) => Promise<void>;
    selectConfig: (id: string | null) => void;
    fetchModels: (configId: string) => Promise<string[]>;
    testConnection: (configId: string) => Promise<boolean>;
    getConfigById: (id: string) => LLMConfig | undefined;
    clearError: () => void;
}

type LLMStore = LLMStoreState & LLMStoreActions;

export const useLLMStore = create<LLMStore>((set, get) => ({
    configs: [],
    selectedConfigId: null,
    availableModels: {},
    isLoadingModels: false,
    isLoading: false,
    error: null,

    loadConfigs: async () => {
        set({ isLoading: true, error: null });
        try {
            let configs = await llmConfigRepository.findAll();

            const now = Date.now();

            // Ensure ExecuTorch is available
            const hasExecuTorch = configs.some(c => c.provider === LLMProviderKey.Executorch);
            if (!hasExecuTorch) {
                const execuTorchConfig = {
                    ...DEFAULT_EXECUTORCH_CONFIG,
                    createdAt: now,
                    updatedAt: now,
                };
                await llmConfigRepository.create(execuTorchConfig);
                configs = [...configs, execuTorchConfig];
                console.log('[LLMStore] Added default ExecuTorch config');
            }

            // Ensure Llama.cpp is available
            const hasLlamaCpp = configs.some(c => c.provider === LLMProviderKey.LlamaCpp);
            if (!hasLlamaCpp) {
                const llamaCppConfig = {
                    ...DEFAULT_LLAMA_CPP_CONFIG,
                    createdAt: now,
                    updatedAt: now,
                };
                await llmConfigRepository.create(llamaCppConfig);
                configs = [...configs, llamaCppConfig];
                console.log('[LLMStore] Added default Llama.cpp config');
            }

            set({ configs, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load configs',
                isLoading: false,
            });
        }
    },

    createConfig: async (configData) => {
        const now = Date.now();
        const config: LLMConfig = {
            ...configData,
            id: generateId(),
            createdAt: now,
            updatedAt: now,
        };

        try {
            await llmConfigRepository.create(config);
            set((state) => ({ configs: [...state.configs, config] }));
            return config;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to create config',
            });
            throw error;
        }
    },

    createFromPreset: async (provider, apiKey) => {
        const providerConfig = PROVIDER_LIST[provider];
        const now = Date.now();
        const config: LLMConfig = {
            id: generateId(),
            name: providerConfig.name || provider,
            provider,
            baseUrl: providerConfig.defaultBaseUrl || '',
            apiKey,
            defaultModel: '',
            supportsStreaming: true,
            isLocal: providerConfig.isLocal || false,
            isEnabled: true,
            createdAt: now,
            updatedAt: now,
        };

        try {
            await llmConfigRepository.create(config);
            set((state) => ({ configs: [...state.configs, config] }));
            return config;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to create config',
            });
            throw error;
        }
    },

    updateConfig: async (config) => {
        try {
            const updated = await llmConfigRepository.update(config);
            set((state) => ({
                configs: state.configs.map((c) => (c.id === updated.id ? updated : c)),
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to update config',
            });
            throw error;
        }
    },

    deleteConfig: async (id) => {
        try {
            await llmConfigRepository.delete(id);
            set((state) => ({
                configs: state.configs.filter((c) => c.id !== id),
                selectedConfigId:
                    state.selectedConfigId === id ? null : state.selectedConfigId,
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to delete config',
            });
            throw error;
        }
    },

    selectConfig: (id) => {
        set({ selectedConfigId: id });
    },

    fetchModels: async (configId) => {
        const config = get().configs.find((c) => c.id === configId);
        if (!config) return [];

        set({ isLoadingModels: true });
        try {
            const client = llmClientFactory.getClient(config);
            const models = await client.fetchModels(config);
            set((state) => ({
                availableModels: { ...state.availableModels, [configId]: models },
                isLoadingModels: false,
            }));
            return models;
        } catch (error) {
            set({ isLoadingModels: false });
            return [];
        }
    },

    testConnection: async (configId) => {
        const config = get().configs.find((c) => c.id === configId);
        if (!config) return false;

        try {
            const client = llmClientFactory.getClient(config);
            return await client.testConnection(config);
        } catch {
            return false;
        }
    },

    getConfigById: (id) => {
        return get().configs.find((c) => c.id === id);
    },

    clearError: () => {
        set({ error: null });
    },
}));
