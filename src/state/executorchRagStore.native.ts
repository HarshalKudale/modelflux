/**
 * ExecutorTorch RAG Store - Native
 * 
 * State management for RAG (Retrieval-Augmented Generation) using
 * ExecutorTorch embeddings and OP-SQLite vector store.
 * This is the native implementation for iOS/Android.
 */

import { ExecuTorchEmbeddings } from '@react-native-rag/executorch';
import { OPSQLiteVectorStore } from '@react-native-rag/op-sqlite';
import { Embeddings } from 'react-native-rag';
import { create } from 'zustand';
import { DownloadedModel } from '../core/types';

interface ExecutorchRagState {
    // Vector store instance
    vectorStore: OPSQLiteVectorStore | null;

    // Embeddings instance
    embeddings: Embeddings | null;

    // Initialization state
    isInitialized: boolean;
    isInitializing: boolean;
    error: string | null;

    // Selected model info
    selectedModelId: string | null;

    // Platform support flag
    isSupported: boolean;
}

interface ExecutorchRagActions {
    /**
     * Initialize the vector store with a downloaded embedding model
     * @param downloadedModel The downloaded model with embedding tag
     */
    initialize: (downloadedModel: DownloadedModel) => Promise<void>;

    /**
     * Reset the vector store (e.g., when switching models)
     */
    reset: () => void;

    /**
     * Get the current vector store instance
     */
    getVectorStore: () => OPSQLiteVectorStore | null;

    /**
     * Get the current embeddings instance
     */
    getEmbeddings: () => Embeddings | null;
}

type ExecutorchRagStore = ExecutorchRagState & ExecutorchRagActions;

export const useExecutorchRagStore = create<ExecutorchRagStore>((set, get) => ({
    // Initial state
    vectorStore: null,
    embeddings: null,
    isInitialized: false,
    isInitializing: false,
    error: null,
    selectedModelId: null,
    isSupported: true, // Native platforms support RAG

    initialize: async (downloadedModel: DownloadedModel) => {
        const { isInitialized, isInitializing, selectedModelId } = get();

        // Skip if already initialized with same model
        if (isInitialized && selectedModelId === downloadedModel.id) {
            console.log('[ExecutorchRagStore] Already initialized with same model');
            return;
        }

        // If different model, reset first
        if (isInitialized && selectedModelId !== downloadedModel.id) {
            console.log('[ExecutorchRagStore] Switching to different model, resetting...');
            get().reset();
        }

        if (isInitializing) {
            console.log('[ExecutorchRagStore] Already initializing, skipping');
            return;
        }

        set({ isInitializing: true, error: null });

        try {
            console.log('[ExecutorchRagStore] Initializing with model:', downloadedModel.name);
            console.log('[ExecutorchRagStore] Model path:', downloadedModel.modelFilePath);
            console.log('[ExecutorchRagStore] Tokenizer path:', downloadedModel.tokenizerFilePath);

            // Create embeddings instance from react-native-rag with model assets
            const assets = {
                modelSource: downloadedModel.modelFilePath,
                tokenizerSource: downloadedModel.tokenizerFilePath,
            };

            console.log('[ExecutorchRagStore] Creating ExecuTorchEmbeddings with assets...');
            const embeddingsInstance = new ExecuTorchEmbeddings(assets);

            // Create vector store with embeddings
            console.log('[ExecutorchRagStore] Creating vector store...');
            const store = await new OPSQLiteVectorStore({
                name: 'llmhub-rag',
                embeddings: embeddingsInstance,
            }).load();

            console.log('[ExecutorchRagStore] Vector store initialized successfully');

            set({
                vectorStore: store,
                embeddings: embeddingsInstance,
                isInitialized: true,
                isInitializing: false,
                selectedModelId: downloadedModel.id,
            });
        } catch (err) {
            console.error('[ExecutorchRagStore] Initialization error:', err);
            set({
                isInitializing: false,
                error: err instanceof Error ? err.message : String(err),
            });
        }
    },

    reset: () => {
        const { vectorStore } = get();

        if (vectorStore) {
            console.log('[ExecutorchRagStore] Resetting vector store');
        }

        set({
            vectorStore: null,
            embeddings: null,
            isInitialized: false,
            isInitializing: false,
            error: null,
            selectedModelId: null,
        });
    },

    getVectorStore: () => {
        return get().vectorStore;
    },

    getEmbeddings: () => {
        return get().embeddings;
    },
}));

/**
 * Check if RAG is supported on current platform
 */
export function isRagSupported(): boolean {
    return true;
}
