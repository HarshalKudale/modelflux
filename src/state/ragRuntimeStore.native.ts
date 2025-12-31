/**
 * RAG Runtime Store - Native Implementation
 * 
 * Manages the active embedding runtime and vector store.
 * This is ephemeral runtime state, not persistent data.
 * 
 * Responsibilities:
 * - Initialize embedding instance and vector store
 * - Detect stale state when provider changes
 * - Handle reprocessing flow
 * - Provide vector store operations
 */

import { OPSQLiteVectorStore } from '@react-native-rag/op-sqlite';
import { Embeddings } from 'react-native-rag';
import { create } from 'zustand';
import { embeddingFactory } from '../core/rag/embeddingFactory';
import { isProcessingSupported, processSource } from '../core/rag/sourceProcessor';
import { generateProviderFingerprint, RAGSearchResult } from '../core/rag/types';
import { sourceRepository } from '../core/storage';
import { storageAdapter } from '../core/storage/StorageAdapter';
import { DownloadedModel, RAGConfig, RAGProviderType, RAGRuntimeStatus } from '../core/types';

// Storage key for persisting fingerprint
const RAG_FINGERPRINT_STORAGE_KEY = 'rag_last_provider_fingerprint';

interface RAGRuntimeState {
    // Current provider config being used
    currentConfig: RAGConfig | null;

    // Active embedding instance
    embeddings: Embeddings | null;

    // Active vector store instance
    vectorStore: OPSQLiteVectorStore | null;

    // Fingerprint tracking for stale detection
    lastUsedFingerprint: string | null;
    currentFingerprint: string | null;

    // Status state machine
    status: RAGRuntimeStatus;

    // Error message if status is 'error'
    error: string | null;

    // Processing state
    isProcessing: boolean;
    processingProgress: { current: number; total: number } | null;

    // Platform support
    isSupported: boolean;
}

interface RAGRuntimeActions {
    /**
     * Initialize the RAG runtime with a provider config and model
     */
    initialize: (config: RAGConfig, model: DownloadedModel) => Promise<void>;

    /**
     * Reset the runtime (unload embeddings and vector store)
     */
    reset: () => void;

    /**
     * Load persisted fingerprint from storage
     */
    loadPersistedState: () => Promise<void>;

    /**
     * Reprocess all sources with current embedding
     * Flow: initialize new embedding → clear vector store → reprocess all sources
     */
    reprocess: () => Promise<void>;

    /**
     * Add chunks to vector store
     */
    addChunks: (chunks: string[], metadata: { documentId: number; name: string }) => Promise<void>;

    /**
     * Query vector store for similar content
     */
    query: (prompt: string, k: number, filter?: (result: RAGSearchResult) => boolean) => Promise<RAGSearchResult[]>;

    /**
     * Delete all data in vector store
     */
    clearVectorStore: () => Promise<void>;

    /**
     * Get the current vector store instance
     */
    getVectorStore: () => OPSQLiteVectorStore | null;

    /**
     * Get the current embeddings instance
     */
    getEmbeddings: () => Embeddings | null;

    /**
     * Check if runtime is ready for queries
     */
    isReady: () => boolean;

    /**
     * Check if sources are stale (need reprocessing)
     */
    isStale: () => boolean;
}

type RAGRuntimeStore = RAGRuntimeState & RAGRuntimeActions;

export const useRAGRuntimeStore = create<RAGRuntimeStore>((set, get) => ({
    // Initial state
    currentConfig: null,
    embeddings: null,
    vectorStore: null,
    lastUsedFingerprint: null,
    currentFingerprint: null,
    status: 'idle',
    error: null,
    isProcessing: false,
    processingProgress: null,
    isSupported: true, // Native platforms support RAG

    initialize: async (config: RAGConfig, model: DownloadedModel) => {
        const state = get();

        // Skip if already initializing
        if (state.status === 'initializing') {
            console.log('[RAGRuntimeStore] Already initializing, skipping');
            return;
        }

        // Generate fingerprint for this config
        const newFingerprint = config.provider === 'none'
            ? 'none:none'
            : generateProviderFingerprint(config.provider as RAGProviderType, config.modelId);

        console.log('[RAGRuntimeStore] Initializing with config:', config.name);
        console.log('[RAGRuntimeStore] New fingerprint:', newFingerprint);
        console.log('[RAGRuntimeStore] Last used fingerprint:', state.lastUsedFingerprint);

        set({ status: 'initializing', error: null, currentFingerprint: newFingerprint });

        try {
            // Create embedding instance via factory
            console.log('[RAGRuntimeStore] Creating embedding instance...');
            const embeddingsInstance = await embeddingFactory.createEmbedding(
                config.provider as RAGProviderType,
                model
            );

            // Create/load vector store
            console.log('[RAGRuntimeStore] Creating/loading vector store...');
            const store = await new OPSQLiteVectorStore({
                name: 'llmhub-rag',
                embeddings: embeddingsInstance,
            }).load();

            // Check if stale (fingerprint mismatch with persisted fingerprint)
            const isStale = state.lastUsedFingerprint !== null &&
                state.lastUsedFingerprint !== newFingerprint;

            if (isStale) {
                console.log('[RAGRuntimeStore] Sources are STALE - need reprocessing');
                set({
                    currentConfig: config,
                    embeddings: embeddingsInstance,
                    vectorStore: store,
                    currentFingerprint: newFingerprint,
                    status: 'stale',
                });
            } else {
                console.log('[RAGRuntimeStore] Sources are up to date');
                // Update persisted fingerprint
                await storageAdapter.set(RAG_FINGERPRINT_STORAGE_KEY, newFingerprint);

                set({
                    currentConfig: config,
                    embeddings: embeddingsInstance,
                    vectorStore: store,
                    currentFingerprint: newFingerprint,
                    lastUsedFingerprint: newFingerprint,
                    status: 'ready',
                });
            }

            console.log('[RAGRuntimeStore] Initialization complete');
        } catch (err) {
            console.error('[RAGRuntimeStore] Initialization error:', err);
            set({
                status: 'error',
                error: err instanceof Error ? err.message : String(err),
            });
        }
    },

    reset: () => {
        console.log('[RAGRuntimeStore] Resetting runtime');
        set({
            currentConfig: null,
            embeddings: null,
            vectorStore: null,
            currentFingerprint: null,
            status: 'idle',
            error: null,
            isProcessing: false,
            processingProgress: null,
        });
    },

    loadPersistedState: async () => {
        try {
            const fingerprint = await storageAdapter.get<string>(RAG_FINGERPRINT_STORAGE_KEY);
            if (fingerprint) {
                console.log('[RAGRuntimeStore] Loaded persisted fingerprint:', fingerprint);
                set({ lastUsedFingerprint: fingerprint });
            }
        } catch (err) {
            console.error('[RAGRuntimeStore] Failed to load persisted state:', err);
        }
    },

    reprocess: async () => {
        const state = get();

        if (!state.vectorStore || !state.embeddings || !state.currentConfig) {
            console.error('[RAGRuntimeStore] Cannot reprocess: not initialized');
            return;
        }

        if (!isProcessingSupported()) {
            console.error('[RAGRuntimeStore] Processing not supported on this platform');
            return;
        }

        console.log('[RAGRuntimeStore] Starting reprocess...');
        set({ isProcessing: true, error: null });

        try {
            // Step 1: Clear existing vector store data
            console.log('[RAGRuntimeStore] Clearing vector store...');
            await state.vectorStore.deleteVectorStore();

            // Reload vector store after clearing
            const store = await new OPSQLiteVectorStore({
                name: 'llmhub-rag',
                embeddings: state.embeddings,
            }).load();

            set({ vectorStore: store });

            // Step 2: Fetch all sources
            const sources = await sourceRepository.findAll();
            console.log('[RAGRuntimeStore] Reprocessing', sources.length, 'sources...');

            set({ processingProgress: { current: 0, total: sources.length } });

            // Step 3: Process each source
            for (let i = 0; i < sources.length; i++) {
                const source = sources[i]!;
                console.log('[RAGRuntimeStore] Processing source', i + 1, '/', sources.length, ':', source.name);

                set({ processingProgress: { current: i + 1, total: sources.length } });

                await processSource(source, get().addChunks);
            }

            // Step 4: Update fingerprint and status
            const fingerprint = state.currentFingerprint;
            if (fingerprint) {
                await storageAdapter.set(RAG_FINGERPRINT_STORAGE_KEY, fingerprint);
            }

            set({
                lastUsedFingerprint: fingerprint,
                status: 'ready',
                isProcessing: false,
                processingProgress: null,
            });

            console.log('[RAGRuntimeStore] Reprocess complete');
        } catch (err) {
            console.error('[RAGRuntimeStore] Reprocess error:', err);
            set({
                status: 'error',
                error: err instanceof Error ? err.message : String(err),
                isProcessing: false,
                processingProgress: null,
            });
        }
    },

    addChunks: async (chunks, metadata) => {
        const { vectorStore } = get();
        if (!vectorStore) {
            throw new Error('Vector store not initialized');
        }

        for (const chunk of chunks) {
            await vectorStore.add(chunk, metadata);
        }
    },

    query: async (prompt, k, filter) => {
        const { vectorStore, status } = get();

        if (!vectorStore) {
            console.log('[RAGRuntimeStore] Cannot query: vector store not initialized');
            return [];
        }

        if (status === 'stale') {
            console.log('[RAGRuntimeStore] Cannot query: sources are stale');
            return [];
        }

        const results = await vectorStore.similaritySearch(prompt, k, filter);
        return results as RAGSearchResult[];
    },

    clearVectorStore: async () => {
        const { vectorStore } = get();
        if (vectorStore) {
            console.log('[RAGRuntimeStore] Clearing vector store...');
            await vectorStore.deleteVectorStore();
        }
    },

    getVectorStore: () => get().vectorStore,

    getEmbeddings: () => get().embeddings,

    isReady: () => get().status === 'ready',

    isStale: () => get().status === 'stale',
}));

/**
 * Check if RAG is supported on current platform
 */
export function isRagSupported(): boolean {
    return true;
}

// Backwards compatibility export (old name)
export const useExecutorchRagStore = useRAGRuntimeStore;
