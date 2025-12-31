/**
 * Source Store
 * 
 * State management for source documents (PDFs) used in RAG.
 * Handles loading, adding, deleting, and processing sources.
 */

import { Platform } from 'react-native';
import { create } from 'zustand';
import { TEXT_SPLITTER_CHUNK_OVERLAP, TEXT_SPLITTER_CHUNK_SIZE } from '../config/ragConstants';
import { sourceRepository } from '../core/storage';
import { Source } from '../core/types';
import { useExecutorchRagStore } from './executorchRagStore';

// Conditional imports for native platforms
let readPDF: ((path: string) => Promise<string>) | null = null;
let RecursiveCharacterTextSplitter: any = null;

// Dynamic import for native-only modules
if (Platform.OS !== 'web') {
    try {
        // These will be available on native platforms
        const pdfium = require('react-native-pdfium');
        readPDF = pdfium.readPDF;

        const rag = require('@react-native-rag/op-sqlite');
        RecursiveCharacterTextSplitter = rag.RecursiveCharacterTextSplitter;
    } catch (e) {
        console.warn('[SourceStore] Native RAG modules not available:', e);
    }
}

interface SourceStoreState {
    sources: Source[];
    isLoading: boolean;
    isProcessing: boolean;
    processingSourceId: number | null;
    error: string | null;
}

interface SourceStoreActions {
    loadSources: () => Promise<void>;
    addSource: (
        source: Omit<Source, 'id'>,
        sourceUri: string
    ) => Promise<{ success: boolean; isEmpty?: boolean; error?: string }>;
    deleteSource: (source: Source) => Promise<void>;
    renameSource: (id: number, newName: string) => Promise<void>;
    setSourceProcessing: (id: number, isProcessing: boolean) => void;
    reindexAllSources: () => Promise<void>;
    clearError: () => void;
}

type SourceStore = SourceStoreState & SourceStoreActions;

export const useSourceStore = create<SourceStore>((set, get) => ({
    // Initial state
    sources: [],
    isLoading: false,
    isProcessing: false,
    processingSourceId: null,
    error: null,

    loadSources: async () => {
        set({ isLoading: true, error: null });
        try {
            const sources = await sourceRepository.findAll();
            set({ sources, isLoading: false });
        } catch (e) {
            console.error('[SourceStore] Error loading sources:', e);
            set({
                error: e instanceof Error ? e.message : 'Failed to load sources',
                isLoading: false,
            });
        }
    },

    addSource: async (source, sourceUri) => {
        // Check if RAG is supported
        if (Platform.OS === 'web' || !readPDF) {
            return { success: false, error: 'RAG not supported on this platform' };
        }

        const vectorStore = useExecutorchRagStore.getState().getVectorStore();
        if (!vectorStore) {
            return { success: false, error: 'Vector store not initialized' };
        }

        const normalizedUri = sourceUri.replace('file://', '');
        const tempId = -Date.now();

        set({ isProcessing: true, processingSourceId: tempId });

        try {
            // Read PDF content
            console.log('[SourceStore] Reading PDF:', normalizedUri);
            const sourceTextContent = await readPDF(normalizedUri);

            if (!sourceTextContent || sourceTextContent.trim().length === 0) {
                set({ isProcessing: false, processingSourceId: null });
                return { success: false, isEmpty: true };
            }

            // Add temporary source to UI
            const tempSource: Source = {
                ...source,
                id: tempId,
                isProcessing: true,
            };
            set((state) => ({
                sources: [...state.sources, tempSource],
            }));

            // Split text into chunks
            console.log('[SourceStore] Splitting text...');
            let chunks: string[] = [];

            if (RecursiveCharacterTextSplitter) {
                const textSplitter = new RecursiveCharacterTextSplitter({
                    chunkSize: TEXT_SPLITTER_CHUNK_SIZE,
                    chunkOverlap: TEXT_SPLITTER_CHUNK_OVERLAP,
                });
                chunks = await textSplitter.splitText(sourceTextContent);
            } else {
                // Fallback: simple chunking
                const words = sourceTextContent.split(/\s+/);
                const chunkSize = 200; // words per chunk
                for (let i = 0; i < words.length; i += chunkSize) {
                    chunks.push(words.slice(i, i + chunkSize).join(' '));
                }
            }

            console.log('[SourceStore] Created', chunks.length, 'chunks');

            // Save source to repository
            const savedSource = await sourceRepository.create(source);
            if (!savedSource) {
                set((state) => ({
                    sources: state.sources.filter((s) => s.id !== tempId),
                    isProcessing: false,
                    processingSourceId: null,
                }));
                return { success: false, error: 'Failed to save source' };
            }

            // Add chunks to vector store
            console.log('[SourceStore] Adding chunks to vector store...');
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i]!;
                await vectorStore.add(chunk, {
                    documentId: savedSource.id,
                    name: savedSource.name,
                });
            }

            // Update the current provider/model to track what model processed these sources
            const ragState = useExecutorchRagStore.getState();
            if (ragState.selectedModelId) {
                // Get provider from the initialized state (default to 'executorch' for now)
                ragState.updateSourcesProcessedWith('executorch', ragState.selectedModelId);
            }

            // Update UI with real source
            set((state) => ({
                sources: state.sources.map((s) =>
                    s.id === tempId ? { ...savedSource, isProcessing: false } : s
                ),
                isProcessing: false,
                processingSourceId: null,
            }));

            console.log('[SourceStore] Source added successfully');
            return { success: true };
        } catch (e) {
            console.error('[SourceStore] Error adding source:', e);
            set((state) => ({
                sources: state.sources.filter((s) => s.id !== tempId),
                isProcessing: false,
                processingSourceId: null,
                error: e instanceof Error ? e.message : 'Failed to add source',
            }));
            return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
        }
    },

    deleteSource: async (source: Source) => {
        try {
            // Delete from repository
            await sourceRepository.delete(source.id);

            // Note: We should also delete from vector store
            // but OPSQLiteVectorStore may not have a delete by metadata method
            // This would need to be implemented based on the library's API

            // Reload sources
            await get().loadSources();
        } catch (e) {
            console.error('[SourceStore] Error deleting source:', e);
            set({
                error: e instanceof Error ? e.message : 'Failed to delete source',
            });
        }
    },

    renameSource: async (id, newName) => {
        try {
            await sourceRepository.rename(id, newName);
            await get().loadSources();
        } catch (e) {
            console.error('[SourceStore] Error renaming source:', e);
            set({
                error: e instanceof Error ? e.message : 'Failed to rename source',
            });
        }
    },

    setSourceProcessing: (id, isProcessing) => {
        set((state) => ({
            sources: state.sources.map((source) =>
                source.id === id ? { ...source, isProcessing } : source
            ),
        }));
    },

    clearError: () => {
        set({ error: null });
    },

    reindexAllSources: async () => {
        // Check if RAG is supported
        if (Platform.OS === 'web' || !readPDF) {
            console.warn('[SourceStore] RAG not supported on this platform');
            return;
        }

        const vectorStore = useExecutorchRagStore.getState().getVectorStore();
        if (!vectorStore) {
            console.warn('[SourceStore] Vector store not initialized, skipping reindex');
            return;
        }

        const sources = get().sources;
        if (sources.length === 0) {
            console.log('[SourceStore] No sources to reindex');
            return;
        }

        console.log('[SourceStore] Reindexing', sources.length, 'sources...');
        set({ isProcessing: true });

        for (const source of sources) {
            try {
                // Mark this source as processing
                set((state) => ({
                    sources: state.sources.map((s) =>
                        s.id === source.id ? { ...s, isProcessing: true } : s
                    ),
                }));

                const normalizedUri = source.uri.replace('file://', '');
                console.log('[SourceStore] Reindexing source:', source.name);

                // Read PDF content
                const sourceTextContent = await readPDF(normalizedUri);

                if (!sourceTextContent || sourceTextContent.trim().length === 0) {
                    console.warn('[SourceStore] Source has no content, skipping:', source.name);
                    continue;
                }

                // Split text into chunks
                let chunks: string[] = [];

                if (RecursiveCharacterTextSplitter) {
                    const textSplitter = new RecursiveCharacterTextSplitter({
                        chunkSize: TEXT_SPLITTER_CHUNK_SIZE,
                        chunkOverlap: TEXT_SPLITTER_CHUNK_OVERLAP,
                    });
                    chunks = await textSplitter.splitText(sourceTextContent);
                } else {
                    // Fallback: simple chunking
                    const words = sourceTextContent.split(/\s+/);
                    const chunkSize = 200;
                    for (let i = 0; i < words.length; i += chunkSize) {
                        chunks.push(words.slice(i, i + chunkSize).join(' '));
                    }
                }

                // Add chunks to vector store
                for (let i = 0; i < chunks.length; i++) {
                    const chunk = chunks[i]!;
                    await vectorStore.add(chunk, {
                        documentId: source.id,
                        name: source.name,
                    });
                }

                console.log('[SourceStore] Reindexed source:', source.name, 'with', chunks.length, 'chunks');

                // Mark source as done
                set((state) => ({
                    sources: state.sources.map((s) =>
                        s.id === source.id ? { ...s, isProcessing: false } : s
                    ),
                }));
            } catch (e) {
                console.error('[SourceStore] Error reindexing source:', source.name, e);
                // Mark source as done even on error
                set((state) => ({
                    sources: state.sources.map((s) =>
                        s.id === source.id ? { ...s, isProcessing: false } : s
                    ),
                }));
            }
        }

        set({ isProcessing: false });
        console.log('[SourceStore] Reindexing complete');
    },
}));
