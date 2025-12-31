/**
 * Source Store
 * 
 * State management for source documents (PDFs) used in RAG.
 * Handles loading, adding, deleting, and managing source metadata.
 * 
 * NOTE: Processing logic has been moved to sourceProcessor.ts
 * This store is now purely for state management and persistence.
 */

import { create } from 'zustand';
import { sourceRepository } from '../core/storage';
import { Source } from '../core/types';

interface SourceStoreState {
    sources: Source[];
    isLoading: boolean;
    error: string | null;
}

interface SourceStoreActions {
    loadSources: () => Promise<void>;
    addSource: (source: Omit<Source, 'id'>) => Promise<Source | null>;
    deleteSource: (source: Source) => Promise<void>;
    renameSource: (id: number, newName: string) => Promise<void>;
    setSourceProcessing: (id: number, isProcessing: boolean) => void;
    clearError: () => void;
}

type SourceStore = SourceStoreState & SourceStoreActions;

export const useSourceStore = create<SourceStore>((set, get) => ({
    // Initial state
    sources: [],
    isLoading: false,
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

    addSource: async (source) => {
        try {
            const savedSource = await sourceRepository.create(source);
            set((state) => ({
                sources: [...state.sources, savedSource],
            }));
            return savedSource;
        } catch (e) {
            console.error('[SourceStore] Error adding source:', e);
            set({
                error: e instanceof Error ? e.message : 'Failed to add source',
            });
            return null;
        }
    },

    deleteSource: async (source: Source) => {
        try {
            await sourceRepository.delete(source.id);
            set((state) => ({
                sources: state.sources.filter((s) => s.id !== source.id),
            }));
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
            set((state) => ({
                sources: state.sources.map((s) =>
                    s.id === id ? { ...s, name: newName } : s
                ),
            }));
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
}));
