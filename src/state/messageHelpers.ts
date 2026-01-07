/**
 * Message Processing Helpers
 * 
 * Utility functions for building LLM request messages.
 */

import { K_DOCUMENTS_TO_RETRIEVE } from '../config/ragConstants';
import { ChatMessage } from '../core/llm';
import { sourceRepository } from '../core/storage';
import { Conversation, Message, Persona, Source } from '../core/types';

/**
 * Static context instruction - added to system prompt when sources capability is enabled
 */
export const CONTEXT_INSTRUCTION = `IMPORTANT CONTEXT INFORMATION: You have access to relevant information from the user's document sources. Use this context to provide accurate, well-informed responses. Always prioritize information from the provided context when it's relevant to the user's question.

Instructions for using context:
- The context is delimited by <context> and </context> tags
- Refer to the context information when answering questions
- If the context directly addresses the user's question, use that information as the primary basis for your response
- If information from context conflicts with your general knowledge, prioritize the context
- If the context doesn't contain relevant information say "I don't know" or "The provided context does not contain the information"
- When citing information from context, you can reference it naturally without formal citations`;

/**
 * RAG context result from generateRagContext
 */
export interface RagContextResult {
    /** Map of sourceId -> content for storage in message.contextMap */
    contextMap: Record<number, string>;
    /** Single formatted context string for message.context field */
    contextString: string;
}

/**
 * Generate RAG context for a user query.
 * 
 * @param query - The user's query text
 * @param sourceIds - Selected source IDs to search
 * @param vectorStore - The vector store for similarity search
 * @returns Context map and formatted string for storage
 */
export async function generateRagContext(
    query: string,
    sourceIds: number[],
    vectorStore: { similaritySearch: Function } | null
): Promise<RagContextResult> {
    const emptyResult: RagContextResult = { contextMap: {}, contextString: '' };

    if (!vectorStore || sourceIds.length === 0) {
        return emptyResult;
    }

    try {
        const results = await vectorStore.similaritySearch(
            query,
            K_DOCUMENTS_TO_RETRIEVE,
            (value: { metadata?: { documentId?: number } }) =>
                sourceIds.includes(value.metadata?.documentId || 0)
        );

        if (!results || results.length === 0) {
            return emptyResult;
        }

        const sources = await sourceRepository.findAll();
        const contextMap: Record<number, string> = {};

        // Aggregate content by source ID
        results.forEach((item: { content: string; metadata?: { documentId?: number } }) => {
            const docId = item.metadata?.documentId || 0;
            if (docId > 0) {
                if (contextMap[docId]) {
                    contextMap[docId] += '\n' + item.content.trim();
                } else {
                    contextMap[docId] = item.content.trim();
                }
            }
        });

        // Format single context string
        const contextString = formatContextString(contextMap, sources);

        console.log('[messageHelpers] Generated context for', Object.keys(contextMap).length, 'sources');
        return { contextMap, contextString };
    } catch (error) {
        console.error('[messageHelpers] Error generating RAG context:', error);
        return emptyResult;
    }
}

/**
 * Sanitize content for LLM consumption.
 * Removes control characters and normalizes whitespace.
 */
function sanitizeContent(content: string): string {
    return content
        // Remove control characters except newlines and tabs
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // Normalize multiple newlines to max 2
        .replace(/\n{3,}/g, '\n\n')
        // Trim each line
        .split('\n')
        .map(line => line.trim())
        .join('\n')
        .trim();
}

/**
 * Format context map into a single LLM-readable string.
 */
function formatContextString(
    contextMap: Record<number, string>,
    sources: Source[]
): string {
    const parts: string[] = [];
    let sourceIndex = 1;

    for (const sourceId of Object.keys(contextMap).map(Number)) {
        const sourceName = sources.find((s) => s.id === sourceId)?.name
            || `Document ${sourceId}`;
        // Sanitize content to prevent parsing issues
        const sanitizedContent = sanitizeContent(contextMap[sourceId]);
        parts.push(
            `[Source ${sourceIndex}: ${sourceName}]\n${sanitizedContent}\n[End Source ${sourceIndex}]`
        );
        sourceIndex++;
    }

    return parts.join('\n\n');
}

/**
 * Compile system prompt for a persona.
 * 
 * Called when:
 * 1. Persona is created/updated (stored in persona.compiledSystemPrompt)
 * 2. Conversation is created without pre-compiled prompt (fallback)
 * 
 * Prompt structure (Character Card V2):
 * - Personality traits
 * - Scenario/setting
 * - System prompt (main instructions)
 * - Context instruction (RAG support)
 * - Post-history instructions (at end of chat, before response)
 * 
 * @param persona - The persona (if any)
 * @returns Compiled system prompt
 */
export function compileSystemPrompt(persona: Persona | null, includeRagContext: boolean = true): string {
    if (!persona) {
        // No persona - return context instruction only if RAG sources are attached
        return includeRagContext ? CONTEXT_INSTRUCTION : '';
    }

    const parts: string[] = [];

    // Character name and description
    if (persona.name) {
        parts.push(`You are ${persona.name}.`);
    }
    if (persona.description) {
        parts.push(persona.description);
    }

    // Personality traits
    if (persona.personality) {
        parts.push(`Personality: ${persona.personality}`);
    }

    // Scenario/setting
    if (persona.scenario) {
        parts.push(`Scenario: ${persona.scenario}`);
    }

    // Main system prompt (V2 field)
    const mainPrompt = persona.system_prompt || '';
    if (mainPrompt) {
        parts.push(mainPrompt);
    }

    // Only append context instruction if RAG sources are attached
    if (includeRagContext) {
        parts.push(CONTEXT_INSTRUCTION);
    }

    // Post-history instructions are NOT added here - they go after chat history
    // This is handled in prepareChatMessages

    return parts.filter(p => p.trim()).join('\n\n');
}

/**
 * Get post-history instructions from persona.
 * These are placed after the chat history, before the model responds.
 * 
 * @param persona - The persona
 * @returns Post-history instructions or empty string
 */
export function getPostHistoryInstructions(persona: Persona | null): string {
    return persona?.post_history_instructions || '';
}

/**
 * Prepare ChatMessage array for LLM request.
 * 
 * This function:
 * 1. Combines personaPrompt + contextPrompt from conversation as system prompt
 * 2. For each message, prefixes message.context with message.content using <context> tags
 * 
 * @param conversation - The conversation (contains personaPrompt, contextPrompt)
 * @param messages - Message history
 * @returns ChatMessage array ready for LLM
 */
export function prepareChatMessages(
    conversation: Conversation,
    messages: Message[]
): ChatMessage[] {
    const chatMessages: ChatMessage[] = [];

    // Combine prompt parts from conversation
    const promptParts: string[] = [];

    // Add persona prompt (empty if no persona)
    if (conversation.personaPrompt) {
        promptParts.push(conversation.personaPrompt);
    }

    // Add context prompt (set when sources first attached)
    if (conversation.contextPrompt) {
        promptParts.push(conversation.contextPrompt);
    }

    const systemPromptContent = promptParts.join('\n\n');

    // Add system prompt at the top
    if (systemPromptContent) {
        chatMessages.push({
            role: 'system',
            content: systemPromptContent,
        });
    }

    // Process each message
    for (const msg of messages) {
        let content = msg.content;

        // If message has context, prefix it with <context> tags
        if (msg.context && msg.context.trim()) {
            content = `<context>\n${msg.context}\n</context>\n${msg.content}`;
        }

        chatMessages.push({
            role: msg.role,
            content,
        });
    }

    return chatMessages;
}
