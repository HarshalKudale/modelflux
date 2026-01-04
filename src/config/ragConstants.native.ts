/**
 * RAG Pipeline Constants - Native Implementation
 */

export const K_DOCUMENTS_TO_RETRIEVE = 5;
export const TEXT_SPLITTER_CHUNK_SIZE = 900;
export const TEXT_SPLITTER_CHUNK_OVERLAP = 100;

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

export interface RAGEmbeddingModel {
    id: string;
    name: string;
    description: string;
    dimensions: number;
}

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

export function getEmbeddingModelById(id: string): RAGEmbeddingModel | undefined {
    return RAG_EMBEDDING_MODELS.find(m => m.id === id);
}

export const DEFAULT_EMBEDDING_MODEL_ID = 'all-minilm-l6-v2';

/**
 * RAG supported on native
 */
export function isRagSupported(): boolean {
    return true;
}
