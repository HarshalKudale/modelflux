/**
 * RAG Context Utility - Web Implementation
 * RAG is not supported on web - provides stub functions
 */

import { CONTEXT_INSTRUCTION } from '../config/ragConstants';

/**
 * Prepare context - Web stub (RAG not supported)
 */
export async function prepareContext(
    _prompt: string,
    _enabledSourceIds: number[]
): Promise<string[]> {
    console.log('[RAGContext] RAG not supported on web');
    return [];
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
 * Check if RAG context should be applied - Web always returns false
 */
export function shouldApplyContext(_selectedSourceIds: number[]): boolean {
    return false;
}
