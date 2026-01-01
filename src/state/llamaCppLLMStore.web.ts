/**
 * Llama.cpp LLM Store - Web Stub
 *
 * Stub implementation for web platform where llama.rn is not supported.
 */

import { create } from 'zustand';
import { DownloadedModel } from '../core/types';

export interface LlamaCppConfig {
    n_ctx: number;
    n_gpu_layers: number;
    use_mlock: boolean;
    temperature: number;
    top_p: number;
}

const DEFAULT_CONFIG: LlamaCppConfig = {
    n_ctx: 2048,
    n_gpu_layers: 99,
    use_mlock: true,
    temperature: 0.7,
    top_p: 0.9,
};

interface LlamaCppLLMState {
    selectedModelId: string | null;
    selectedModelName: string | null;
    isLoading: boolean;
    isReady: boolean;
    error: string | null;
    currentResponse: string;
    isGenerating: boolean;
    isProcessingPrompt: boolean;
    currentConversationId: string | null;
    parsedThinkingContent: string;
    parsedMessageContent: string;
    config: LlamaCppConfig;
    performance: {
        tokenCount: number;
        firstTokenTime: number;
    };
}

interface LlamaCppLLMActions {
    loadModel: (
        modelId: string,
        modelName: string,
        downloadedModel: DownloadedModel,
        hardReload?: boolean
    ) => Promise<void>;
    interrupt: () => void;
    unload: () => void;
    appendToken: (token: string) => void;
    clearResponse: () => void;
    setGenerating: (generating: boolean) => void;
    setProcessingPrompt: (processing: boolean) => void;
    setCurrentConversationId: (conversationId: string | null) => void;
    updateConfig: (config: Partial<LlamaCppConfig>) => void;
    getContext: () => null;
    getParsedContent: () => { thinking: string; message: string };
    updateParsedContent: (thinking: string, message: string) => void;
}

type LlamaCppLLMStore = LlamaCppLLMState & LlamaCppLLMActions;

export const useLlamaCppLLMStore = create<LlamaCppLLMStore>((set, get) => ({
    selectedModelId: null,
    selectedModelName: null,
    isLoading: false,
    isReady: false,
    error: 'Llama.cpp is not supported on web',
    currentResponse: '',
    isGenerating: false,
    isProcessingPrompt: false,
    currentConversationId: null,
    parsedThinkingContent: '',
    parsedMessageContent: '',
    config: DEFAULT_CONFIG,
    performance: {
        tokenCount: 0,
        firstTokenTime: 0,
    },

    loadModel: async () => {
        set({ error: 'Llama.cpp is not supported on web' });
    },
    interrupt: () => { },
    unload: () => { },
    appendToken: () => { },
    clearResponse: () => { },
    setGenerating: () => { },
    setProcessingPrompt: () => { },
    setCurrentConversationId: () => { },
    updateConfig: () => { },
    getContext: () => null,
    getParsedContent: () => ({ thinking: '', message: '' }),
    updateParsedContent: () => { },
}));

export function processTokenWithThinking(): void {
    // Not supported on web
}

export function isLocalProvider(provider: string): boolean {
    return provider === 'executorch' || provider === 'llama-rn';
}
