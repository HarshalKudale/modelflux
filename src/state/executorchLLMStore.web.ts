/**
 * Executorch LLM Store - Web Stub
 *
 * Empty stub for web platform where react-native-executorch is not available.
 * All methods are no-ops that return appropriate default values.
 */

import { create } from 'zustand';
import { DownloadedModel } from '../core/types';

interface ExecutorchLLMState {
    // Selected model
    selectedModelId: string | null;
    selectedModelName: string | null;

    // Model state
    isLoading: boolean;
    isReady: boolean;
    downloadProgress: number;
    error: string | null;

    // Generation state
    currentResponse: string;
    isGenerating: boolean;
    isProcessingPrompt: boolean;
    currentConversationId: string | null;

    // Parsed content for thinking mode (separated from raw response)
    parsedThinkingContent: string;
    parsedMessageContent: string;

    // Performance tracking
    performance: {
        tokenCount: number;
        firstTokenTime: number;
    };
}

interface ExecutorchLLMActions {
    loadModel: (
        modelId: string,
        modelName: string,
        downloadedModel: DownloadedModel,
        hardReload?: boolean
    ) => Promise<void>;
    interrupt: () => void;
    unload: () => void;

    // For streaming
    appendToken: (token: string) => void;
    clearResponse: () => void;
    setGenerating: (generating: boolean) => void;
    setProcessingPrompt: (processing: boolean) => void;
    setCurrentConversationId: (conversationId: string | null) => void;

    // For ExecuTorchProvider access - returns null on web
    getLLMModule: () => null;
    getParsedContent: () => { thinking: string; message: string };
    updateParsedContent: (thinking: string, message: string) => void;
}

type ExecutorchLLMStore = ExecutorchLLMState & ExecutorchLLMActions;

/**
 * Web stub store - all operations are no-ops
 */
export const useExecutorchLLMStore = create<ExecutorchLLMStore>((set, get) => ({
    // Initial state
    selectedModelId: null,
    selectedModelName: null,
    isLoading: false,
    isReady: false,
    downloadProgress: 0,
    error: 'ExecuTorch is not supported on web',
    currentResponse: '',
    isGenerating: false,
    isProcessingPrompt: false,
    currentConversationId: null,
    parsedThinkingContent: '',
    parsedMessageContent: '',
    performance: {
        tokenCount: 0,
        firstTokenTime: 0,
    },

    // All methods are no-ops on web
    loadModel: async () => {
        console.warn('[ExecutorchLLMStore] ExecuTorch is not supported on web');
        set({ error: 'ExecuTorch is not supported on web' });
    },

    interrupt: () => { },

    unload: () => { },

    appendToken: () => { },

    clearResponse: () => {
        set({
            currentResponse: '',
            performance: {
                tokenCount: 0,
                firstTokenTime: 0,
            },
        });
    },

    setGenerating: (generating) => set({ isGenerating: generating }),

    setProcessingPrompt: (processing) => set({ isProcessingPrompt: processing }),

    setCurrentConversationId: (conversationId) => set({ currentConversationId: conversationId }),

    getLLMModule: () => null,

    getParsedContent: () => ({ thinking: '', message: '' }),

    updateParsedContent: () => { },
}));

/**
 * Helper function to check if a provider is a local on-device provider
 */
export function isLocalProvider(provider: string): boolean {
    return provider === 'executorch' || provider === 'llama-rn';
}
