/**
 * Llama.cpp LLM Store - Native Implementation
 *
 * State management for on-device LLM models using llama.rn.
 * Handles model loading, token generation, and performance tracking.
 * Based on llama.rn API: https://github.com/mybigday/llama.rn
 */

import { create } from 'zustand';
import { DownloadedModel } from '../core/types';
import { useConversationStore } from './conversationStore';

// Type definitions for llama.rn (package provides these at runtime)
interface LlamaContext {
    completion: (
        params: {
            messages?: Array<{ role: string; content: string }>;
            prompt?: string;
            n_predict?: number;
            stop?: string[];
            temperature?: number;
            top_p?: number;
        },
        callback: (data: { token: string }) => void
    ) => Promise<{ text: string }>;
    stopCompletion: () => void;
    release: () => Promise<void>;
}

interface InitLlamaParams {
    model: string;
    n_ctx?: number;
    n_gpu_layers?: number;
    use_mlock?: boolean;
    embedding?: boolean;
}

// Dynamic import for llama.rn
let initLlamaFn: ((params: InitLlamaParams) => Promise<LlamaContext>) | null = null;

async function getInitLlama(): Promise<(params: InitLlamaParams) => Promise<LlamaContext>> {
    if (!initLlamaFn) {
        try {
            const llamaRn = await import('llama.rn');
            initLlamaFn = llamaRn.initLlama;
        } catch (error) {
            throw new Error('llama.rn is not installed or not available');
        }
    }
    return initLlamaFn;
}

/**
 * Llama.cpp configuration options that can be edited by users
 */
export interface LlamaCppConfig {
    /** Context window size */
    n_ctx: number;
    /** Number of GPU layers to offload (Metal/Vulkan) */
    n_gpu_layers: number;
    /** Use memory locking */
    use_mlock: boolean;
    /** Temperature for sampling (0.0-2.0) */
    temperature: number;
    /** Top-P sampling threshold (0.0-1.0) */
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
    // Selected model
    selectedModelId: string | null;
    selectedModelName: string | null;

    // Model state
    isLoading: boolean;
    isReady: boolean;
    error: string | null;

    // Generation state
    currentResponse: string;
    isGenerating: boolean;
    isProcessingPrompt: boolean;
    currentConversationId: string | null;

    // Parsed content for thinking mode
    parsedThinkingContent: string;
    parsedMessageContent: string;

    // Configuration
    config: LlamaCppConfig;

    // Performance tracking
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

    // For streaming
    appendToken: (token: string) => void;
    clearResponse: () => void;
    setGenerating: (generating: boolean) => void;
    setProcessingPrompt: (processing: boolean) => void;
    setCurrentConversationId: (conversationId: string | null) => void;

    // Config
    updateConfig: (config: Partial<LlamaCppConfig>) => void;

    // For LlamaCppProvider access
    getContext: () => LlamaContext | null;
    getParsedContent: () => { thinking: string; message: string };
    updateParsedContent: (thinking: string, message: string) => void;
}

type LlamaCppLLMStore = LlamaCppLLMState & LlamaCppLLMActions;

// Singleton llama context instance
let llamaContext: LlamaContext | null = null;

// Module-level parsing state for token callback
let isInThinkingMode = false;
let thinkingBuffer = '';
let messageBuffer = '';
let rawBuffer = '';

// Function to reset parsing state
function resetParsingState() {
    isInThinkingMode = false;
    thinkingBuffer = '';
    messageBuffer = '';
    rawBuffer = '';
}

export const useLlamaCppLLMStore = create<LlamaCppLLMStore>((set, get) => ({
    // Initial state
    selectedModelId: null,
    selectedModelName: null,
    isLoading: false,
    isReady: false,
    error: null,
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

    loadModel: async (modelId, modelName, downloadedModel, hardReload = false) => {
        const { selectedModelId, isReady, config } = get();

        // If same model already loaded and ready, skip unless hard reload
        if (modelId === selectedModelId && isReady && llamaContext && !hardReload) {
            console.log('[LlamaCppLLMStore] Model already loaded, skipping:', modelId);
            return;
        }

        // Clean up previous context if exists
        if (llamaContext) {
            console.log('[LlamaCppLLMStore] Cleaning up previous context');
            try {
                await llamaContext.release();
            } catch (cleanupErr) {
                console.warn('[LlamaCppLLMStore] Cleanup error (continuing):', cleanupErr);
            }
            llamaContext = null;
        }

        set({
            selectedModelId: modelId,
            selectedModelName: modelName,
            isLoading: true,
            isReady: false,
            error: null,
        });

        console.log('[LlamaCppLLMStore] Loading model:', modelName);
        console.log('[LlamaCppLLMStore] Model path:', downloadedModel.modelFilePath);

        try {
            // Initialize llama context with model using dynamic import
            const initLlama = await getInitLlama();
            llamaContext = await initLlama({
                model: downloadedModel.modelFilePath,
                n_ctx: config.n_ctx,
                n_gpu_layers: config.n_gpu_layers,
                use_mlock: config.use_mlock,
            });

            console.log('[LlamaCppLLMStore] Model loaded successfully');

            set({
                isLoading: false,
                isReady: true,
            });
        } catch (err) {
            console.error('[LlamaCppLLMStore] Load error:', err);
            llamaContext = null;
            set({
                isLoading: false,
                isReady: false,
                error: err instanceof Error ? err.message : String(err),
            });
        }
    },

    interrupt: () => {
        const state = get();

        if (llamaContext && (state.isGenerating || state.isProcessingPrompt)) {
            console.log('[LlamaCppLLMStore] Stopping completion');
            llamaContext.stopCompletion();
        }

        if (state.isGenerating || state.isProcessingPrompt) {
            set({
                isGenerating: false,
                isProcessingPrompt: false,
            });
        }
    },

    unload: () => {
        console.log('[LlamaCppLLMStore] Unloading model');

        if (llamaContext) {
            try {
                llamaContext.release();
            } catch (err) {
                console.warn('[LlamaCppLLMStore] Unload error:', err);
            }
            llamaContext = null;
        }

        set({
            selectedModelId: null,
            selectedModelName: null,
            isLoading: false,
            isReady: false,
            error: null,
            currentResponse: '',
            isGenerating: false,
            isProcessingPrompt: false,
            performance: {
                tokenCount: 0,
                firstTokenTime: 0,
            },
        });
    },

    appendToken: (token) => {
        set((state) => ({
            currentResponse: state.currentResponse + token,
        }));
    },

    clearResponse: () => {
        resetParsingState();
        set({
            currentResponse: '',
            parsedThinkingContent: '',
            parsedMessageContent: '',
            performance: {
                tokenCount: 0,
                firstTokenTime: 0,
            },
        });
    },

    setGenerating: (generating) => set({ isGenerating: generating }),

    setProcessingPrompt: (processing) => set({ isProcessingPrompt: processing }),

    setCurrentConversationId: (conversationId) => set({ currentConversationId: conversationId }),

    updateConfig: (configUpdates) => {
        set((state) => ({
            config: { ...state.config, ...configUpdates },
        }));
    },

    getContext: () => llamaContext,

    getParsedContent: () => {
        const state = get();
        return {
            thinking: state.parsedThinkingContent,
            message: state.parsedMessageContent,
        };
    },

    updateParsedContent: (thinking, message) => {
        set({
            parsedThinkingContent: thinking,
            parsedMessageContent: message,
        });
    },
}));

/**
 * Process token and parse thinking tags
 * Called from LlamaCppProvider during generation
 */
export function processTokenWithThinking(
    token: string,
    store: LlamaCppLLMStore,
    onToken?: (content: string) => void,
    onThinking?: (thinking: string) => void
): void {
    // Accumulate raw buffer
    rawBuffer += token;
    const newResponse = store.currentResponse + token;

    // Check for <think> tag at the start
    if (!isInThinkingMode && rawBuffer.startsWith('<think>')) {
        isInThinkingMode = true;
        const afterThinkTag = rawBuffer.slice(7);
        thinkingBuffer = afterThinkTag;
    } else if (isInThinkingMode) {
        const closeTagIndex = rawBuffer.indexOf('</think>');
        if (closeTagIndex !== -1) {
            thinkingBuffer = rawBuffer.slice(7, closeTagIndex);
            messageBuffer = rawBuffer.slice(closeTagIndex + 8);
            isInThinkingMode = false;
        } else {
            thinkingBuffer = rawBuffer.slice(7);
        }
    } else {
        messageBuffer = rawBuffer;
    }

    // Update store
    store.updateParsedContent(thinkingBuffer, messageBuffer);

    // Call callbacks
    if (onToken && messageBuffer) {
        onToken(messageBuffer);
    }
    if (onThinking && thinkingBuffer) {
        onThinking(thinkingBuffer);
    }

    // Update conversation store
    const conversationId = store.currentConversationId;
    if (conversationId) {
        if (thinkingBuffer) {
            useConversationStore.getState().updateCurrentThinkingMessage(
                conversationId,
                thinkingBuffer
            );
        }
        if (messageBuffer) {
            useConversationStore.getState().updateCurrentMessage(
                conversationId,
                messageBuffer
            );
        }
    }
}

/**
 * Helper function to check if a provider is a local on-device provider
 */
export function isLocalProvider(provider: string): boolean {
    return provider === 'executorch' || provider === 'llama-cpp';
}
