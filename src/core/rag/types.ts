/**
 * RAG Types
 * 
 * Type definitions specific to the RAG pipeline.
 */

import { Embeddings } from 'react-native-rag';
import { DownloadedModel, RAGProviderType } from '../types';

/**
 * Generate a fingerprint for a RAG provider config
 * Used to detect when reprocessing is needed
 */
export function generateProviderFingerprint(providerType: RAGProviderType, modelId: string): string {
    return `${providerType}:${modelId}`;
}

/**
 * Interface for embedding instance factory
 * Creates embedding instances based on provider type
 */
export interface IEmbeddingFactory {
    /**
     * Create an embedding instance for the given provider and model
     * @param providerType The RAG provider type
     * @param model The downloaded model (for local providers) or config
     * @returns An Embeddings instance
     */
    createEmbedding(providerType: RAGProviderType, model: DownloadedModel): Promise<Embeddings>;

    /**
     * Check if a provider type is local (uses downloaded models)
     */
    isLocalProvider(providerType: RAGProviderType): boolean;
}

/**
 * Search result from vector store query
 */
export interface RAGSearchResult {
    content: string;
    metadata?: {
        documentId?: number;
        name?: string;
    };
    similarity?: number;
}
