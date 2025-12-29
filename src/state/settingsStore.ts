import { create } from 'zustand';
import { settingsRepository } from '../core/storage';
import { AppSettings, DEFAULT_SETTINGS, RAGProvider, RAGSettings, ThemeMode } from '../core/types';
import { localeService } from '../services/LocaleService';

interface SettingsStoreState {
    settings: AppSettings;
    isLoading: boolean;
    error: string | null;
}

interface SettingsStoreActions {
    loadSettings: () => Promise<void>;
    updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
    resetSettings: () => Promise<void>;
    setTheme: (theme: ThemeMode) => Promise<void>;
    toggleSidebar: () => Promise<void>;
    setDefaultLLM: (llmId: string | null) => Promise<void>;
    setDefaultPersona: (personaId: string | null) => Promise<void>;
    setLanguage: (language: string) => Promise<void>;
    // RAG settings
    setRagProvider: (provider: RAGProvider) => Promise<void>;
    setRagModel: (modelId: string | null) => Promise<void>;
    setRagEnabled: (enabled: boolean) => Promise<void>;
    updateRagSettings: (ragSettings: Partial<RAGSettings>) => Promise<void>;
    clearError: () => void;
}

type SettingsStore = SettingsStoreState & SettingsStoreActions;

export const useSettingsStore = create<SettingsStore>((set, get) => ({
    // State
    settings: DEFAULT_SETTINGS,
    isLoading: false,
    error: null,

    // Actions
    loadSettings: async () => {
        set({ isLoading: true, error: null });
        try {
            const settings = await settingsRepository.get();
            // Sync locale service with persisted language setting
            localeService.setLanguage(settings.language);
            set({ settings, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load settings',
                isLoading: false,
            });
        }
    },

    updateSettings: async (updates) => {
        try {
            const settings = await settingsRepository.update(updates);
            set({ settings });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to update settings',
            });
        }
    },

    resetSettings: async () => {
        try {
            const settings = await settingsRepository.reset();
            set({ settings });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to reset settings',
            });
        }
    },

    setTheme: async (theme) => {
        await get().updateSettings({ theme });
    },

    toggleSidebar: async () => {
        const current = get().settings.sidebarCollapsed;
        await get().updateSettings({ sidebarCollapsed: !current });
    },

    setDefaultLLM: async (llmId) => {
        await get().updateSettings({ defaultLLMId: llmId });
    },

    setDefaultPersona: async (personaId) => {
        await get().updateSettings({ defaultPersonaId: personaId });
    },

    setLanguage: async (language) => {
        localeService.setLanguage(language);
        await get().updateSettings({ language });
    },

    // RAG Settings
    setRagProvider: async (provider) => {
        const current = get().settings.ragSettings;
        await get().updateSettings({
            ragSettings: {
                ...current,
                provider,
                isEnabled: provider !== 'none',
            },
        });
    },

    setRagModel: async (modelId) => {
        const current = get().settings.ragSettings;
        await get().updateSettings({
            ragSettings: {
                ...current,
                modelId,
            },
        });
    },

    setRagEnabled: async (enabled) => {
        const current = get().settings.ragSettings;
        await get().updateSettings({
            ragSettings: {
                ...current,
                isEnabled: enabled,
                provider: enabled ? (current.provider === 'none' ? 'executorch' : current.provider) : 'none',
            },
        });
    },

    updateRagSettings: async (ragSettings) => {
        const current = get().settings.ragSettings;
        await get().updateSettings({
            ragSettings: {
                ...current,
                ...ragSettings,
            },
        });
    },

    clearError: () => {
        set({ error: null });
    },
}));
