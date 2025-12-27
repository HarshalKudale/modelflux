import { Platform } from 'react-native';
import { create } from 'zustand';
import { PROVIDER_PRESETS } from '../config/providerPresets';
import { llmClientFactory } from '../core/llm';
import { llmConfigRepository } from '../core/storage';
import { LLMConfig, LLMProvider, generateId } from '../core/types';

// Default ExecuTorch config that's pre-installed on native platforms
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
    // State
    configs: [],
    selectedConfigId: null,
    availableModels: {},
    isLoadingModels: false,
    isLoading: false,
    error: null,

    // Actions
    loadConfigs: async () => {
        set({ isLoading: true, error: null });
        try {
            let configs = await llmConfigRepository.findAll();

            // On native platforms, ensure ExecuTorch is always available as a default config
            if (Platform.OS !== 'web') {
                const hasExecuTorch = configs.some(c => c.provider === 'executorch');
                if (!hasExecuTorch) {
                    // Add default ExecuTorch config
                    const now = Date.now();
                    const execuTorchConfig = {
                        ...DEFAULT_EXECUTORCH_CONFIG,
                        createdAt: now,
                        updatedAt: now,
                    };
                    // Save to repository so it persists
                    await llmConfigRepository.create(execuTorchConfig);
                    configs = [...configs, execuTorchConfig];
                    console.log('[LLMStore] Added default ExecuTorch config');
                }
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
        const preset = PROVIDER_PRESETS[provider];
        const now = Date.now();
        const config: LLMConfig = {
            id: generateId(),
            name: preset.name || provider,
            provider,
            baseUrl: preset.baseUrl || '',
            apiKey,
            defaultModel: preset.defaultModel || '',
            supportsStreaming: preset.supportsStreaming ?? true,
            isLocal: preset.isLocal || false,
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
