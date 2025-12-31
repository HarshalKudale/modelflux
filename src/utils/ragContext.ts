/**
 * RAG Context Utility
 * 
 * Prepares context from selected sources for RAG-enhanced conversations.
 * Performs similarity search on the vector store and formats the context.
 */

import { Platform } from 'react-native';
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
 * 
 * @param prompt - The user's message to find relevant context for
 * @param enabledSourceIds - Array of source IDs to search within
 * @returns Array of formatted context strings
 */
export async function prepareContext(
    prompt: string,
    enabledSourceIds: number[]
): Promise<string[]> {
    if (Platform.OS === 'web') {
        console.log('[RAGContext] RAG not supported on web');
        return [];
    }

    if (enabledSourceIds.length === 0) {
        return [];
    }

    try {
        const ragRuntime = useRAGRuntimeStore.getState();

        // Block RAG when not ready or stale
        if (ragRuntime.status !== 'ready') {
            console.log('[RAGContext] RAG not ready, status:', ragRuntime.status);
            return [];
        }

        console.log('[RAGContext] Searching for context with', enabledSourceIds.length, 'sources');

        // Query using the new RAGRuntimeStore API
        const results = await ragRuntime.query(
            prompt,
            K_DOCUMENTS_TO_RETRIEVE,
            (value: SearchResult) => {
                // Filter by enabled source IDs
                return enabledSourceIds.includes(value.metadata?.documentId || 0);
            }
        );

        if (!results || results.length === 0) {
            console.log('[RAGContext] No relevant context found');
            return [];
        }

        // Sort by relevance
        results.sort((a: SearchResult, b: SearchResult) =>
            (b.similarity || 0) - (a.similarity || 0)
        );

        // Format context entries
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
 * Wrap user message with context if sources are selected
 * 
 * @param userMessage - The original user message
 * @param context - Array of context strings from prepareContext
 * @returns The message wrapped with context tags
 */
export function wrapMessageWithContext(userMessage: string, context: string[]): string {
    if (context.length === 0) {
        return userMessage;
    }

    return `<context>${context.join(' ')}</context>
${userMessage}`;
}

/**
 * Get the context instruction to prepend to system prompt
 */
export function getContextInstruction(): string {
    return CONTEXT_INSTRUCTION;
}

/**
 * Check if RAG context should be applied
 * 
 * @param selectedSourceIds - Array of selected source IDs
 * @returns true if context should be applied
 */
export function shouldApplyContext(selectedSourceIds: number[]): boolean {
    if (Platform.OS === 'web') return false;

    const ragRuntime = useRAGRuntimeStore.getState();

    // Only apply context if ready (not stale, not error, not idle)
    if (ragRuntime.status !== 'ready') {
        console.log('[RAGContext] Cannot apply context, status:', ragRuntime.status);
        return false;
    }

    return selectedSourceIds.length > 0 && ragRuntime.vectorStore !== null;
}
