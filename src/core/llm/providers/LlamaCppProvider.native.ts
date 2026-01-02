/**
 * Llama.cpp Provider - Native Implementation
 *
 * Provider for running LLM models on-device using llama.cpp.
 *
 * Design notes:
 * - Uses context.completion() with token callback for streaming
 * - Processes tokens into thinking/content and calls onToken/onThinking
 * - Checks isStreaming from conversationStore, if false calls stopCompletion()
 * - Based on llama.rn API: https://github.com/mybigday/llama.rn (library is called llama.rn but runs llama.cpp)
 */

import { LLMConfig } from '../../types';
import {
    ILLMProvider,
    LLMError,
    LLMErrorCode,
    LLMRequest,
    LLMStreamChunk
} from '../types';

import { useConversationStore } from '../../../state/conversationStore';
import { useLlamaCppLLMStore } from '../../../state/llamaCppLLMStore';

// Stop words for generation
const STOP_WORDS = [
    '<' + '/s>',
    '<' + '|end|>',
    '<' + '|eot_id|>',
    '<' + '|end_of_text|>',
    '<' + '|im_end|>',
    '<' + '|EOT|>',
    '<' + '|END_OF_TURN_TOKEN|>',
    '<' + '|end_of_turn|>',
    '<' + '|endoftext|>'
];

export class LlamaCppProvider implements ILLMProvider {
    private getStoreState() {
        return useLlamaCppLLMStore.getState();
    }

    isReady(): boolean {
        return this.getStoreState().isReady;
    }

    /**
     * Interrupt active generation.
     * Calls stopCompletion() on the llama context.
     */
    interrupt(): void {
        console.log('[LlamaCppProvider] Interrupting generation');
        this.getStoreState().interrupt();
    }

    async *sendMessageStream(
        request: LLMRequest
    ): AsyncGenerator<LLMStreamChunk, void, unknown> {
        const { messages, onToken, onThinking } = request;
        const state = this.getStoreState();
        const context = state.getContext();
        const config = state.config;

        if (!context || !state.isReady) {
            throw new LLMError(
                'Local model not loaded.',
                LLMErrorCode.MODEL_NOT_FOUND,
                'llama-cpp'
            );
        }

        const formattedMessages = messages.map(m => ({
            role: m.role as 'user' | 'assistant' | 'system',
            content: m.content,
        }));

        console.log('[LlamaCppProvider] Starting generation with', formattedMessages.length, 'messages');

        // Clear previous response and set up for generation
        state.clearResponse();
        state.setProcessingPrompt(true);
        state.setGenerating(true);

        // Parsing state for thinking tags
        let isInThinkingMode = false;
        let thinkingBuffer = '';
        let messageBuffer = '';
        let rawBuffer = '';

        // Queue for yielding chunks
        const chunkQueue: LLMStreamChunk[] = [];
        let resolveWait: (() => void) | null = null;
        let generationComplete = false;

        const thinkOpenTag = '<' + 'think>';
        const thinkCloseTag = '<' + '/think>';

        try {
            // Start generation with token callback
            const completionPromise = context.completion(
                {
                    messages: formattedMessages,
                    n_predict: 2048,
                    stop: STOP_WORDS,
                    temperature: config.temperature,
                    top_p: config.top_p,
                },
                (data) => {
                    // Check if streaming was stopped by UI
                    const isStreaming = useConversationStore.getState().isStreaming;
                    if (!isStreaming) {
                        console.log('[LlamaCppProvider] isStreaming=false, stopping...');
                        context.stopCompletion();
                        return;
                    }

                    const token = data.token;

                    // Accumulate raw buffer
                    rawBuffer += token;

                    // Parse thinking tags
                    if (!isInThinkingMode && rawBuffer.startsWith(thinkOpenTag)) {
                        isInThinkingMode = true;
                        thinkingBuffer = rawBuffer.slice(7);
                    } else if (isInThinkingMode) {
                        const closeTagIndex = rawBuffer.indexOf(thinkCloseTag);
                        if (closeTagIndex !== -1) {
                            thinkingBuffer = rawBuffer.slice(7, closeTagIndex);
                            messageBuffer = rawBuffer.slice(closeTagIndex + 8);
                            isInThinkingMode = false;
                        } else {
                            thinkingBuffer = rawBuffer.slice(7);
                        }
                    } else {
                        messageBuffer = rawBuffer;
                    }

                    // Call callbacks for UI updates
                    if (onToken && messageBuffer) {
                        onToken(messageBuffer);
                    }
                    if (onThinking && thinkingBuffer) {
                        onThinking(thinkingBuffer);
                    }

                    // Add chunk to queue
                    const chunk: LLMStreamChunk = {
                        content: token,
                        thinking: isInThinkingMode ? token : undefined,
                        done: false,
                    };
                    chunkQueue.push(chunk);

                    // Wake up the generator if it's waiting
                    if (resolveWait) {
                        resolveWait();
                        resolveWait = null;
                    }
                }
            );

            // Handle completion
            completionPromise.then((result) => {
                console.log('[LlamaCppProvider] Generation complete, result length:', result?.text?.length || 0);
                generationComplete = true;

                // Add final chunk
                chunkQueue.push({
                    content: '',
                    thinking: thinkingBuffer || undefined,
                    done: true,
                });

                if (resolveWait) {
                    resolveWait();
                    resolveWait = null;
                }
            }).catch((error) => {
                console.error('[LlamaCppProvider] Generation error:', error);
                generationComplete = true;
                if (resolveWait) {
                    resolveWait();
                    resolveWait = null;
                }
            }).finally(() => {
                state.setGenerating(false);
                state.setProcessingPrompt(false);
            });

            // Yield chunks as they come in
            while (!generationComplete || chunkQueue.length > 0) {
                if (chunkQueue.length > 0) {
                    const chunk = chunkQueue.shift()!;
                    yield chunk;
                    if (chunk.done) {
                        return;
                    }
                } else {
                    // Wait for more chunks
                    await new Promise<void>((resolve) => {
                        resolveWait = resolve;
                    });
                }
            }

            await completionPromise;

        } catch (error) {
            state.setGenerating(false);
            state.setProcessingPrompt(false);
            throw this.wrapError(error);
        }
    }

    async fetchModels(llmConfig: LLMConfig): Promise<string[]> {
        // Local provider: models come from downloaded models, not API
        return llmConfig.defaultModel ? [llmConfig.defaultModel] : [];
    }

    async testConnection(llmConfig: LLMConfig): Promise<boolean> {
        return this.getStoreState().isReady;
    }

    private wrapError(error: unknown): LLMError {
        if (error instanceof LLMError) return error;
        const message = error instanceof Error ? error.message : String(error);
        return new LLMError(message, LLMErrorCode.UNKNOWN, 'llama-cpp');
    }
}
