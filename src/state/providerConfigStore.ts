/**
 * Provider Config Store
 * 
 * Zustand store for managing RAG provider configurations.
 * Owns what models exist and which one is default — nothing else.
 * 
 * Key design: Only ONE config per provider type is allowed.
 */

import { create } from 'zustand';
import { generateProviderFingerprint } from '../core/rag/types';
import { ragConfigRepository } from '../core/storage';
import { generateId, RAGConfig, RAGProviderType } from '../core/types';

interface ProviderConfigStoreState {
    configs: RAGConfig[];
    isLoading: boolean;
    error: string | null;
}

interface ProviderConfigStoreActions {
    loadConfigs: () => Promise<void>;

    /**
     * Add a new provider config
     * @throws Error if provider type already exists
     */
    addProvider: (config: Omit<RAGConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<RAGConfig>;

    /**
     * Update an existing provider config
     */
    updateProvider: (config: RAGConfig) => Promise<void>;

    /**
     * Remove a provider config by ID
     */
    removeProvider: (id: string) => Promise<void>;

    /**
     * Set a config as the default
     */
    setDefaultProvider: (id: string) => Promise<void>;

    /**
     * Get the default provider config
     */
    getDefaultProvider: () => RAGConfig | null;

    /**
     * Get config by provider type
     */
    getConfigByProviderType: (providerType: RAGProviderType) => RAGConfig | undefined;

    /**
     * Get config by ID
     */
    getProviderById: (id: string) => RAGConfig | undefined;

    /**
     * Generate fingerprint for a config (providerType:modelId)
     */
    getFingerprint: (config: RAGConfig) => string;

    /**
     * Check if a provider type already has a config
     */
    hasProviderType: (providerType: RAGProviderType) => boolean;

    clearError: () => void;
}

type ProviderConfigStore = ProviderConfigStoreState & ProviderConfigStoreActions;

// STUBBED: All functions return empty/null values
export const useProviderConfigStore = create<ProviderConfigStore>()((set, get) => ({
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
                error: error instanceof Error ? error.message : 'Failed to load provider configs',
                isLoading: false,
            });
        }
    },

    addProvider: async (configData) => {
        const { provider } = configData;

        // Check if provider type already exists (enforce one-per-type)
        if (provider !== 'none' && get().hasProviderType(provider as RAGProviderType)) {
            throw new Error(`A config for provider type "${provider}" already exists. Edit the existing config instead.`);
        }

        const now = Date.now();
        const isFirstConfig = get().configs.length === 0;

        const config: RAGConfig = {
            ...configData,
            id: generateId(),
            isDefault: configData.isDefault || isFirstConfig, // First config is default
            createdAt: now,
            updatedAt: now,
        };

        try {
            await ragConfigRepository.create(config);

            // If this is now default, unset others
            if (config.isDefault) {
                set((state) => ({
                    configs: [...state.configs.map(c => ({ ...c, isDefault: false })), config],
                }));
            } else {
                set((state) => ({ configs: [...state.configs, config] }));
            }

            return config;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to add provider config',
            });
            throw error;
        }
    },

    updateProvider: async (config) => {
        try {
            const updated = await ragConfigRepository.update({
                ...config,
                updatedAt: Date.now(),
            });

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
                error: error instanceof Error ? error.message : 'Failed to update provider config',
            });
            throw error;
        }
    },

    removeProvider: async (id) => {
        try {
            await ragConfigRepository.delete(id);
            set((state) => ({
                configs: state.configs.filter((c) => c.id !== id),
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to remove provider config',
            });
            throw error;
        }
    },

    setDefaultProvider: async (id) => {
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
                error: error instanceof Error ? error.message : 'Failed to set default provider',
            });
            throw error;
        }
    },

    getDefaultProvider: () => {
        return get().configs.find((c) => c.isDefault) || null;
    },

    getConfigByProviderType: (providerType: RAGProviderType) => {
        return get().configs.find((c) => c.provider === providerType);
    },

    getProviderById: (id) => {
        return get().configs.find((c) => c.id === id);
    },

    getFingerprint: (config) => {
        if (config.provider === 'none') {
            return 'none:none';
        }
        return generateProviderFingerprint(config.provider as RAGProviderType, config.modelId);
    },

    hasProviderType: (providerType: RAGProviderType) => {
        return get().configs.some((c) => c.provider === providerType);
    },

    clearError: () => {
        set({ error: null });
    },
}));

// Export for backwards compatibility (will be removed after migration)
export const useRagConfigStore = useProviderConfigStore;
