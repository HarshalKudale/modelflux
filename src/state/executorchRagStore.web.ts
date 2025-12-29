/**
 * ExecutorTorch RAG Store - Web Stub
 * 
 * Web stub for RAG functionality.
 * RAG is not supported on web platform.
 */

import { create } from 'zustand';
import { DownloadedModel } from '../core/types';

interface ExecutorchRagState {
    vectorStore: null;
    embeddings: null;
    isInitialized: boolean;
    isInitializing: boolean;
    error: string | null;
    selectedModelId: string | null;
    isSupported: boolean;
}

interface ExecutorchRagActions {
    initialize: (downloadedModel: DownloadedModel) => Promise<void>;
    reset: () => void;
    getVectorStore: () => null;
    getEmbeddings: () => null;
}

type ExecutorchRagStore = ExecutorchRagState & ExecutorchRagActions;

export const useExecutorchRagStore = create<ExecutorchRagStore>((set, get) => ({
    // Initial state
    vectorStore: null,
    embeddings: null,
    isInitialized: false,
    isInitializing: false,
    error: 'RAG is not supported on web',
    selectedModelId: null,
    isSupported: false, // Web does not support RAG

    initialize: async (_downloadedModel: DownloadedModel) => {
        console.warn('[ExecutorchRagStore] RAG is not supported on web');
        set({ error: 'RAG is not supported on web' });
    },

    reset: () => {
        // No-op on web
    },

    getVectorStore: () => null,
    getEmbeddings: () => null,
}));

/**
 * Check if RAG is supported on current platform
 */
export function isRagSupported(): boolean {
    return false;
}
