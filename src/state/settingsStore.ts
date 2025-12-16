import { create } from 'zustand';
import { settingsRepository } from '../core/storage';
import { AppSettings, DEFAULT_SETTINGS, ThemeMode } from '../core/types';

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
    toggleStreaming: () => Promise<void>;
    toggleSidebar: () => Promise<void>;
    setDefaultLLM: (llmId: string | null) => Promise<void>;
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

    toggleStreaming: async () => {
        const current = get().settings.streamingEnabled;
        await get().updateSettings({ streamingEnabled: !current });
    },

    toggleSidebar: async () => {
        const current = get().settings.sidebarCollapsed;
        await get().updateSettings({ sidebarCollapsed: !current });
    },

    setDefaultLLM: async (llmId) => {
        await get().updateSettings({ defaultLLMId: llmId });
    },

    clearError: () => {
        set({ error: null });
    },
}));
