/**
 * RAG Runtime Store - Web Stub
 * 
 * Web platform does not support RAG.
 */

import { create } from 'zustand';
import { RAGRuntimeStatus } from '../core/types';

interface RAGRuntimeState {
    currentConfig: null;
    embeddings: null;
    vectorStore: null;
    lastUsedFingerprint: null;
    currentFingerprint: null;
    status: RAGRuntimeStatus;
    error: string | null;
    isProcessing: boolean;
    processingProgress: null;
    isSupported: boolean;
}

interface RAGRuntimeActions {
    initialize: () => Promise<void>;
    reset: () => void;
    loadPersistedState: () => Promise<void>;
    reprocess: () => Promise<void>;
    addChunks: () => Promise<void>;
    query: () => Promise<[]>;
    clearVectorStore: () => Promise<void>;
    getVectorStore: () => null;
    getEmbeddings: () => null;
    isReady: () => boolean;
    isStale: () => boolean;
}

type RAGRuntimeStore = RAGRuntimeState & RAGRuntimeActions;

export const useRAGRuntimeStore = create<RAGRuntimeStore>(() => ({
    currentConfig: null,
    embeddings: null,
    vectorStore: null,
    lastUsedFingerprint: null,
    currentFingerprint: null,
    status: 'idle',
    error: 'RAG not supported on web',
    isProcessing: false,
    processingProgress: null,
    isSupported: false,

    initialize: async () => { },
    reset: () => { },
    loadPersistedState: async () => { },
    reprocess: async () => { },
    addChunks: async () => { },
    query: async () => [],
    clearVectorStore: async () => { },
    getVectorStore: () => null,
    getEmbeddings: () => null,
    isReady: () => false,
    isStale: () => false,
}));

export function isRagSupported(): boolean {
    return false;
}

// Backwards compatibility
export const useExecutorchRagStore = useRAGRuntimeStore;
