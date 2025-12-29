/**
 * RAG Pipeline Constants
 * 
 * Configuration for Retrieval-Augmented Generation including
 * context preparation, text splitting, and retrieval parameters.
 */

import { Platform } from 'react-native';

/**
 * Number of similar documents to retrieve for context
 */
export const K_DOCUMENTS_TO_RETRIEVE = 5;

/**
 * Text splitter configuration
 */
export const TEXT_SPLITTER_CHUNK_SIZE = 1000;
export const TEXT_SPLITTER_CHUNK_OVERLAP = 100;

/**
 * Context instruction to prepend to system prompt when RAG is enabled
 */
export const CONTEXT_INSTRUCTION = `
IMPORTANT CONTEXT INFORMATION:
You have access to relevant information from the user's document sources. Use this context to provide accurate, well-informed responses. Always prioritize information from the provided context when it's relevant to the user's question.

Instructions for using context:
- The context is delimited by <context> and </context> tags
- Refer to the context information when answering questions
- If the context directly addresses the user's question, use that information as the primary basis for your response
- If information from context conflicts with your general knowledge, prioritize the context
- If the context doesn't contain relevant information say "I don't know" or "The provided context does not contain the information"
- When citing information from context, you can reference it naturally without formal citations`;

/**
 * Embedding model configurations for RAG
 * Note: Using react-native-rag embedding models
 */
export interface RAGEmbeddingModel {
    id: string;
    name: string;
    description: string;
    dimensions: number;
}

/**
 * Available RAG embedding models from react-native-rag/executorch
 * These are sentence transformer models exported for mobile use
 */
export const RAG_EMBEDDING_MODELS: RAGEmbeddingModel[] = [
    {
        id: 'all-minilm-l6-v2',
        name: 'all-MiniLM-L6-v2',
        description: 'Fast & lightweight (23M params, 384 dims)',
        dimensions: 384,
    },
    {
        id: 'bge-small-en-v1.5',
        name: 'BGE Small EN v1.5',
        description: 'Good quality, English only (33M params, 384 dims)',
        dimensions: 384,
    },
];

/**
 * Get embedding model by ID
 */
export function getEmbeddingModelById(id: string): RAGEmbeddingModel | undefined {
    return RAG_EMBEDDING_MODELS.find(m => m.id === id);
}

/**
 * Default embedding model ID
 */
export const DEFAULT_EMBEDDING_MODEL_ID = 'all-minilm-l6-v2';

/**
 * Check if RAG is supported on current platform
 */
export function isRagSupported(): boolean {
    return Platform.OS !== 'web';
}
