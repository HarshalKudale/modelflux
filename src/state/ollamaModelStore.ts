/**
 * Ollama Model Store
 *
 * Runtime-only Zustand store for Ollama model classification.
 * Fetches models from Ollama and classifies them as completion or embedding
 * based on the `capabilities[]` array in the /api/show response.
 *
 * This store is NOT persisted - it resets on app restart.
 */

import { fetch } from 'expo/fetch';
import { create } from 'zustand';
import { logger } from '../services/LoggerService.native';

interface OllamaModelInfo {
    name: string;
    capabilities: string[];
}

interface OllamaModelStoreState {
    /** Models that support text completion */
    completionModels: string[];
    /** Models that support embeddings */
    embeddingModels: string[];
    /** Whether we're currently fetching models */
    isFetching: boolean;
    /** Whether we've attempted to fetch (prevents repeated fetches on empty results) */
    hasFetched: boolean;
    /** Last error message, if any */
    error: string | null;
}

interface OllamaModelStoreActions {
    /**
     * Fetch all models from Ollama and classify them by capability
     * @param baseUrl The Ollama server base URL
     * @param headers Optional headers for authentication
     */
    fetchAndClassifyModels: (baseUrl: string, headers?: Record<string, string>) => Promise<void>;

    /**
     * Get completion models (for LLM chat)
     */
    getCompletionModels: () => string[];

    /**
     * Get embedding models (for RAG)
     */
    getEmbeddingModels: () => string[];

    /**
     * Reset the store (for app restart behavior)
     */
    reset: () => void;

    /**
     * Clear any error
     */
    clearError: () => void;
}

type OllamaModelStore = OllamaModelStoreState & OllamaModelStoreActions;

const initialState: OllamaModelStoreState = {
    completionModels: [],
    embeddingModels: [],
    isFetching: false,
    hasFetched: false,
    error: null,
};

export const useOllamaModelStore = create<OllamaModelStore>((set, get) => ({
    ...initialState,

    fetchAndClassifyModels: async (baseUrl: string, headers?: Record<string, string>) => {
        // Only fetch once per app session
        if (get().hasFetched || get().isFetching) {
            logger.debug('OllamaModelStore', 'Already fetched or fetching, skipping');
            return;
        }

        set({ isFetching: true, error: null });
        logger.log('OllamaModelStore', 'Fetching models from:', baseUrl);

        try {
            // Step 1: Fetch all models via /api/tags
            const tagsResponse = await fetch(`${baseUrl}/api/tags`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
            });

            if (!tagsResponse.ok) {
                throw new Error(`Failed to fetch tags: ${tagsResponse.status}`);
            }

            const tagsData = await tagsResponse.json();
            const models: { name: string }[] = tagsData.models || [];

            logger.log('OllamaModelStore', 'Found', models.length, 'models');

            // Step 2: Get capabilities for each model via /api/show
            const completionModels: string[] = [];
            const embeddingModels: string[] = [];

            for (const model of models) {
                try {
                    const showResponse = await fetch(`${baseUrl}/api/show`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...headers,
                        },
                        body: JSON.stringify({ name: model.name }),
                    });

                    if (!showResponse.ok) {
                        logger.warn('OllamaModelStore', 'Failed to get info for:', model.name);
                        // Default to completion if we can't determine capabilities
                        completionModels.push(model.name);
                        continue;
                    }

                    const showData = await showResponse.json();
                    const capabilities: string[] = showData.capabilities || [];

                    logger.debug('OllamaModelStore', 'Model:', model.name, 'capabilities:', capabilities);

                    // Classify based on capabilities
                    if (capabilities.includes('embedding')) {
                        embeddingModels.push(model.name);
                    }
                    if (capabilities.includes('completion')) {
                        completionModels.push(model.name);
                    }

                    // If no capabilities specified, default to completion
                    if (capabilities.length === 0) {
                        completionModels.push(model.name);
                    }
                } catch (error) {
                    logger.warn('OllamaModelStore', 'Error fetching model info:', model.name, error);
                    // Default to completion on error
                    completionModels.push(model.name);
                }
            }

            set({
                completionModels: completionModels.sort(),
                embeddingModels: embeddingModels.sort(),
                isFetching: false,
                hasFetched: true,
            });

            logger.log('OllamaModelStore', 'Classification complete:',
                completionModels.length, 'completion,',
                embeddingModels.length, 'embedding');
        } catch (error) {
            logger.error('OllamaModelStore', 'Error fetching models:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to fetch Ollama models',
                isFetching: false,
                hasFetched: true, // Mark as fetched to prevent retry loop
            });
        }
    },

    getCompletionModels: () => get().completionModels,

    getEmbeddingModels: () => get().embeddingModels,

    reset: () => {
        logger.debug('OllamaModelStore', 'Resetting store');
        set(initialState);
    },

    clearError: () => set({ error: null }),
}));
