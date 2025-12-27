/**
 * Local LLM Store
 * 
 * State management for on-device LLM models using LLMModule.
 * Stores the LLMModule instance and current streaming response.
 */

import { create } from 'zustand';

// LLMModule instance type (from react-native-executorch)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LLMModuleInstance = any;

interface LocalLLMState {
    // Selected model
    selectedModelId: string | null;
    selectedModelName: string | null;

    // The LLMModule instance
    llmModule: LLMModuleInstance | null;

    // Model state
    isLoading: boolean;
    isReady: boolean;
    downloadProgress: number;
    error: string | null;

    // Current streaming response (tokens appended here during generation)
    currentResponse: string;
    isGenerating: boolean;

    // Token count - used to detect when generation ends (when count resets)
    currentTokenCount: number;
}

interface LocalLLMActions {
    selectModel: (modelId: string, modelName: string) => void;
    setLLMModule: (module: LLMModuleInstance | null) => void;
    setLoading: (loading: boolean) => void;
    setReady: (ready: boolean) => void;
    setDownloadProgress: (progress: number) => void;
    setError: (error: string | null) => void;

    // For streaming
    appendToken: (token: string, newCount: number) => void;
    clearResponse: () => void;
    setGenerating: (generating: boolean) => void;

    unload: () => void;
}

type LocalLLMStore = LocalLLMState & LocalLLMActions;

export const useLocalLLMStore = create<LocalLLMStore>((set) => ({
    selectedModelId: null,
    selectedModelName: null,
    llmModule: null,
    isLoading: false,
    isReady: false,
    downloadProgress: 0,
    error: null,
    currentResponse: '',
    isGenerating: false,
    currentTokenCount: 0,

    selectModel: (modelId, modelName) => set((state) => {
        console.log('[LocalLLMStore] Selecting model:', modelName);

        // If same model is already loaded and ready, don't change state
        if (state.selectedModelId === modelId && state.isReady && state.llmModule) {
            console.log('[LocalLLMStore] Model already loaded and ready, skipping state change');
            return state; // No state change
        }

        // Otherwise, set loading state
        return {
            selectedModelId: modelId,
            selectedModelName: modelName,
            isLoading: true,
            isReady: false,
            downloadProgress: 0,
            error: null,
        };
    }),

    setLLMModule: (module) => {
        console.log('[LocalLLMStore] LLM module', module ? 'set' : 'cleared');
        set({ llmModule: module });
    },

    setLoading: (loading) => set({ isLoading: loading }),
    setReady: (ready) => set({ isReady: ready, isLoading: !ready }),
    setDownloadProgress: (progress) => set({ downloadProgress: progress }),
    setError: (error) => set({ error, isLoading: false, isReady: false }),

    appendToken: (token, newCount) => set((state) => {
        // If newCount is less than stored count, it means a new generation started
        // (previous one finished and count reset)
        if (newCount !== state.currentTokenCount) {
            console.log('[LocalLLMStore] Generation ended (count reset from', state.currentTokenCount, 'to', newCount, ')');
            return {
                currentResponse: state.currentResponse + token,
                currentTokenCount: newCount,
                isGenerating: false,
            };
        }
        return {
            currentResponse: state.currentResponse + token,
            currentTokenCount: newCount,
        };
    }),
    clearResponse: () => set({ currentResponse: '', currentTokenCount: 0 }),
    setGenerating: (generating) => set({ isGenerating: generating }),

    unload: () => {
        console.log('[LocalLLMStore] Unloading');
        set({
            selectedModelId: null,
            selectedModelName: null,
            llmModule: null,
            isLoading: false,
            isReady: false,
            downloadProgress: 0,
            error: null,
            currentResponse: '',
            isGenerating: false,
        });
    },
}));

/**
 * Helper function to check if a provider is a local on-device provider
 */
export function isLocalProvider(provider: string): boolean {
    return provider === 'executorch' || provider === 'llama-rn';
}
