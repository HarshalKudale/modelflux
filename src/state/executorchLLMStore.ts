/**
 * Executorch LLM Store
 *
 * State management for on-device LLM models using react-native-executorch LLMModule.
 * Handles model loading, token generation, and performance tracking.
 * Based on reference implementation from private-mind repository.
 */

import { LLMModule } from 'react-native-executorch';
import { create } from 'zustand';
import { DownloadedModel } from '../core/types';
import { useConversationStore } from './conversationStore';

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

    // For ExecuTorchProvider access
    getLLMModule: () => InstanceType<typeof LLMModule> | null;
}

type ExecutorchLLMStore = ExecutorchLLMState & ExecutorchLLMActions;

// Singleton LLMModule instance
let llmInstance: InstanceType<typeof LLMModule> | null = null;

export const useExecutorchLLMStore = create<ExecutorchLLMStore>((set, get) => ({
    // Initial state
    selectedModelId: null,
    selectedModelName: null,
    isLoading: false,
    isReady: false,
    downloadProgress: 0,
    error: null,
    currentResponse: '',
    isGenerating: false,
    isProcessingPrompt: false,
    currentConversationId: null,
    performance: {
        tokenCount: 0,
        firstTokenTime: 0,
    },

    loadModel: async (modelId, modelName, downloadedModel, hardReload = false) => {
        const { selectedModelId, isReady } = get();

        // If same model already loaded and ready, skip unless hard reload
        if (modelId === selectedModelId && isReady && llmInstance && !hardReload) {
            console.log('[ExecutorchLLMStore] Model already loaded, skipping:', modelId);
            return;
        }

        // Clean up previous model if exists
        if (llmInstance) {
            console.log('[ExecutorchLLMStore] Cleaning up previous model');
            try {
                llmInstance.interrupt();
                llmInstance.delete();
            } catch (cleanupErr) {
                console.warn('[ExecutorchLLMStore] Cleanup error (continuing):', cleanupErr);
            }
            llmInstance = null;
        }

        set({
            selectedModelId: modelId,
            selectedModelName: modelName,
            isLoading: true,
            isReady: false,
            downloadProgress: 0,
            error: null,
        });

        console.log('[ExecutorchLLMStore] Loading model:', modelName);
        console.log('[ExecutorchLLMStore] Model path:', downloadedModel.modelFilePath);
        console.log('[ExecutorchLLMStore] Tokenizer path:', downloadedModel.tokenizerFilePath);

        try {
            // Create new LLMModule instance
            llmInstance = new LLMModule();

            // Set up token callback
            llmInstance.setTokenCallback({
                tokenCallback: (token: string) => {
                    const state = get();
                    const isFirstToken = state.performance.tokenCount === 0;

                    // Handle interrupt during prefill
                    if (isFirstToken && !state.isProcessingPrompt && !state.isGenerating) {
                        llmInstance?.interrupt();
                        return;
                    }

                    const newResponse = state.currentResponse + token;

                    set({
                        isProcessingPrompt: false,
                        performance: {
                            tokenCount: state.performance.tokenCount + 1,
                            firstTokenTime: isFirstToken
                                ? performance.now()
                                : state.performance.firstTokenTime,
                        },
                        currentResponse: newResponse,
                    });

                    // Update conversation store's currentMessage if we have a conversationId
                    if (state.currentConversationId) {
                        useConversationStore.getState().updateCurrentMessage(
                            state.currentConversationId,
                            newResponse
                        );
                    }
                },
            });

            // Load the model
            await llmInstance.load({
                modelSource: downloadedModel.modelFilePath,
                tokenizerSource: downloadedModel.tokenizerFilePath,
                tokenizerConfigSource: downloadedModel.tokenizerConfigFilePath,
            });

            console.log('[ExecutorchLLMStore] Model loaded successfully');

            set({
                isLoading: false,
                isReady: true,
            });
        } catch (err) {
            console.error('[ExecutorchLLMStore] Load error:', err);
            llmInstance = null;
            set({
                isLoading: false,
                isReady: false,
                error: err instanceof Error ? err.message : String(err),
            });
        }
    },

    interrupt: () => {
        const state = get();

        if (llmInstance && (state.isGenerating || state.isProcessingPrompt)) {
            llmInstance.interrupt();
        }

        if (state.isGenerating || state.isProcessingPrompt) {
            set({
                isGenerating: false,
                isProcessingPrompt: false,
            });
        }
    },

    unload: () => {
        console.log('[ExecutorchLLMStore] Unloading model');

        if (llmInstance) {
            try {
                llmInstance.interrupt();
                llmInstance.delete();
            } catch (err) {
                console.warn('[ExecutorchLLMStore] Unload error:', err);
            }
            llmInstance = null;
        }

        set({
            selectedModelId: null,
            selectedModelName: null,
            isLoading: false,
            isReady: false,
            downloadProgress: 0,
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

    getLLMModule: () => llmInstance,
}));

/**
 * Helper function to check if a provider is a local on-device provider
 */
export function isLocalProvider(provider: string): boolean {
    return provider === 'executorch' || provider === 'llama-rn';
}
