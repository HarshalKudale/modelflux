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
import { storageAdapter } from '../core/storage/StorageAdapter';
import { DownloadedModel, RAGProvider } from '../core/types';

// Storage keys for persistence
const RAG_TRACKING_STORAGE_KEY = 'rag_sources_tracking';

interface ExecutorchRagState {
    // Vector store instance
    vectorStore: OPSQLiteVectorStore | null;

    // Embeddings instance
    embeddings: Embeddings | null;

    // Initialization state
    isInitialized: boolean;
    isInitializing: boolean;
    error: string | null;

    // Currently loaded model (the model used to initialize the vector store)
    selectedModelId: string | null;

    // Stale state tracking - tracks what provider/model was used to PROCESS sources
    // This differs from selectedModelId when sources were processed with a different model
    currentProvider: RAGProvider | null;
    currentModelId: string | null;
    isStale: boolean;  // True when sources need reprocessing with the new model

    // Platform support flag
    isSupported: boolean;
}

interface ExecutorchRagActions {
    /**
     * Initialize the vector store with a downloaded embedding model
     * @param downloadedModel The downloaded model with embedding tag
     * @param provider The RAG provider type
     */
    initialize: (downloadedModel: DownloadedModel, provider?: RAGProvider) => Promise<void>;

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

    /**
     * Mark sources as stale (need reprocessing)
     */
    markAsStale: () => void;

    /**
     * Update the current provider/model after reprocessing sources
     * @param provider The provider used to reprocess
     * @param modelId The model ID used to reprocess
     */
    updateSourcesProcessedWith: (provider: RAGProvider, modelId: string) => void;

    /**
     * Load persisted tracking state from storage
     */
    loadPersistedState: () => Promise<void>;
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
    currentProvider: null,
    currentModelId: null,
    isStale: false,
    isSupported: true, // Native platforms support RAG

    initialize: async (downloadedModel: DownloadedModel, provider?: RAGProvider) => {
        const { isInitialized, isInitializing, selectedModelId, currentModelId } = get();

        // Skip if already initialized with same model
        if (isInitialized && selectedModelId === downloadedModel.id) {
            console.log('[ExecutorchRagStore] Already initialized with same model');
            // Check if sources were processed with a different model
            if (currentModelId && currentModelId !== downloadedModel.id) {
                console.log('[ExecutorchRagStore] Sources are stale - processed with different model');
                set({ isStale: true });
            }
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
                modelSource: { source: downloadedModel.modelFilePath, type: 1 },
                tokenizerSource: { source: downloadedModel.tokenizerFilePath, type: 1 },
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

            // Check if sources are stale (processed with a different model)
            const { currentModelId: prevCurrentModelId } = get();
            const sourcesAreStale = prevCurrentModelId !== null && prevCurrentModelId !== downloadedModel.id;

            set({
                vectorStore: store,
                embeddings: embeddingsInstance,
                isInitialized: true,
                isInitializing: false,
                selectedModelId: downloadedModel.id,
                isStale: sourcesAreStale,
            });

            if (sourcesAreStale) {
                console.log('[ExecutorchRagStore] Sources are stale - need reprocessing');
            }
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

        // Note: We do NOT reset currentProvider/currentModelId here
        // because those track what model was used to PROCESS sources,
        // not what model is currently loaded
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

    markAsStale: () => {
        console.log('[ExecutorchRagStore] Marking sources as stale');
        set({ isStale: true });
    },

    updateSourcesProcessedWith: async (provider: RAGProvider, modelId: string) => {
        console.log('[ExecutorchRagStore] Sources processed with:', provider, modelId);

        // Persist to storage
        try {
            await storageAdapter.set(RAG_TRACKING_STORAGE_KEY, {
                currentProvider: provider,
                currentModelId: modelId,
            });
            console.log('[ExecutorchRagStore] Tracking state persisted');
        } catch (err) {
            console.error('[ExecutorchRagStore] Failed to persist tracking state:', err);
        }

        set({
            currentProvider: provider,
            currentModelId: modelId,
            isStale: false,
        });
    },

    loadPersistedState: async () => {
        try {
            const saved = await storageAdapter.get<{
                currentProvider: RAGProvider;
                currentModelId: string;
            }>(RAG_TRACKING_STORAGE_KEY);

            if (saved) {
                console.log('[ExecutorchRagStore] Loaded persisted tracking state:', saved);
                set({
                    currentProvider: saved.currentProvider,
                    currentModelId: saved.currentModelId,
                });
            }
        } catch (err) {
            console.error('[ExecutorchRagStore] Failed to load persisted state:', err);
        }
    },
}));

/**
 * Check if RAG is supported on current platform
 */
export function isRagSupported(): boolean {
    return true;
}
