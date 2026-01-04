/**
 * RAG Context Utility - Native Implementation
 * Performs similarity search on the vector store and formats the context.
 */

import { CONTEXT_INSTRUCTION, K_DOCUMENTS_TO_RETRIEVE } from '../config/ragConstants';
import { useRAGRuntimeStore } from '../state/ragRuntimeStore';
import { useSourceStore } from '../state/sourceStore';

interface SearchResult {
    content: string;
    metadata?: {
        documentId?: number;
        name?: string;
    };
    similarity?: number;
}

/**
 * Prepare context from selected sources using similarity search
 */
export async function prepareContext(
    prompt: string,
    enabledSourceIds: number[]
): Promise<string[]> {
    if (enabledSourceIds.length === 0) {
        return [];
    }

    try {
        const ragRuntime = useRAGRuntimeStore.getState();

        if (ragRuntime.status !== 'ready') {
            console.log('[RAGContext] RAG not ready, status:', ragRuntime.status);
            return [];
        }

        console.log('[RAGContext] Searching for context with', enabledSourceIds.length, 'sources');

        const results = await ragRuntime.query(
            prompt,
            K_DOCUMENTS_TO_RETRIEVE,
            (value: SearchResult) => {
                return enabledSourceIds.includes(value.metadata?.documentId || 0);
            }
        );

        if (!results || results.length === 0) {
            console.log('[RAGContext] No relevant context found');
            return [];
        }

        results.sort((a: SearchResult, b: SearchResult) =>
            (b.similarity || 0) - (a.similarity || 0)
        );

        const sources = useSourceStore.getState().sources;
        const preparedContext = results.map((item: SearchResult, index: number) => {
            const sourceName = sources.find(s => s.id === item.metadata?.documentId)?.name
                || item.metadata?.name
                || `Document ${item.metadata?.documentId || 'Unknown'}`;
            const relevanceScore = item.similarity
                ? `(Relevance: ${(item.similarity * 100).toFixed(1)}%)`
                : '';

            return `\n --- Source ${index + 1}: ${sourceName} ${relevanceScore} --- \n ${item.content.trim()} \n --- End of Source ${index + 1} ---`;
        });

        console.log('[RAGContext] Prepared', preparedContext.length, 'context entries');
        return preparedContext;
    } catch (error) {
        console.error('[RAGContext] Error preparing context:', error);
        return [];
    }
}

/**
 * Wrap user message with context
 */
export function wrapMessageWithContext(userMessage: string, context: string[]): string {
    if (context.length === 0) {
        return userMessage;
    }
    return `<context>${context.join(' ')}</context>
${userMessage}`;
}

/**
 * Get the context instruction
 */
export function getContextInstruction(): string {
    return CONTEXT_INSTRUCTION;
}

/**
 * Check if RAG context should be applied
 */
export function shouldApplyContext(selectedSourceIds: number[]): boolean {
    const ragRuntime = useRAGRuntimeStore.getState();

    if (ragRuntime.status !== 'ready') {
        console.log('[RAGContext] Cannot apply context, status:', ragRuntime.status);
        return false;
    }

    return selectedSourceIds.length > 0 && ragRuntime.vectorStore !== null;
}
