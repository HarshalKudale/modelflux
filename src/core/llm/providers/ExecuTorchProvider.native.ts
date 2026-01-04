/**
 * ExecuTorch Provider
 * 
 * Provider for running LLM models on-device using react-native-executorch LLMModule.
 * 
 * Design notes:
 * - Uses setTokenCallback for real-time token streaming (NOT polling)
 * - Processes tokens into thinking/content and calls onToken/onThinking
 * - Checks isStreaming from conversationStore, if false calls llmModule.interrupt()
 * - interrupt() calls the native module's interrupt function directly
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
import { useExecutorchLLMStore } from '../../../state/executorchLLMStore';

export class ExecuTorchProvider implements ILLMProvider {
    private getStoreState() {
        return useExecutorchLLMStore.getState();
    }

    isReady(): boolean {
        return this.getStoreState().isReady;
    }

    /**
     * Interrupt active generation.
     * Calls the native module's interrupt function to stop the model.
     */
    interrupt(): void {
        console.log('[ExecuTorchProvider] Interrupting generation');
        const state = this.getStoreState();
        state.interrupt(); // This calls llmModule.interrupt()
    }

    async *sendMessageStream(
        request: LLMRequest
    ): AsyncGenerator<LLMStreamChunk, void, unknown> {
        const { llmConfig, messages, onToken, onThinking } = request;
        const state = this.getStoreState();
        const llmModule = state.getLLMModule();

        if (!llmModule || !state.isReady) {
            throw new LLMError(
                'Local model not loaded.',
                LLMErrorCode.MODEL_NOT_FOUND,
                'executorch'
            );
        }

        const formattedMessages = messages.map(m => ({
            role: m.role as 'user' | 'assistant' | 'system',
            content: m.content,
        }));

        console.log('[ExecuTorchProvider] Starting generation with', formattedMessages.length, 'messages');

        // Clear previous response and set up for generation
        state.clearResponse();
        state.setProcessingPrompt(true);
        state.setGenerating(true);

        // Parsing state for thinking tags
        let isInThinkingMode = false;
        let thinkingBuffer = '';
        let messageBuffer = '';
        let rawBuffer = '';

        // Queue for yielding chunks - we'll drain this from the generator
        const chunkQueue: LLMStreamChunk[] = [];
        let resolveWait: (() => void) | null = null;
        let generationComplete = false;

        // Get generation config from llmConfig
        const genConfig = llmConfig?.executorchConfig;

        llmModule.configure({
            generationConfig: {
                topp: genConfig?.topp ?? 0.9,
                temperature: genConfig?.temperature ?? 0.7,
                outputTokenBatchSize: genConfig?.outputTokenBatchSize,
                batchTimeInterval: genConfig?.batchTimeInterval,
            }
        })

        // Set up token callback BEFORE calling generate
        llmModule.setTokenCallback({
            tokenCallback: (token: string) => {
                // Check if streaming was stopped by UI
                const isStreaming = useConversationStore.getState().isStreaming;
                if (!isStreaming) {
                    // User pressed stop - interrupt the model
                    console.log('[ExecuTorchProvider] isStreaming=false, interrupting...');
                    llmModule.interrupt();
                    return;
                }

                // Accumulate raw buffer
                rawBuffer += token;

                // Parse thinking tags
                const thinkOpenTag = '<think>';
                const thinkCloseTag = '</think>';

                if (!isInThinkingMode && rawBuffer.startsWith(thinkOpenTag)) {
                    isInThinkingMode = true;
                    // Check if closing tag is already in the buffer
                    const closeTagIndex = rawBuffer.indexOf(thinkCloseTag);
                    if (closeTagIndex !== -1) {
                        // Both open and close tags in same buffer
                        thinkingBuffer = rawBuffer.slice(thinkOpenTag.length, closeTagIndex);
                        messageBuffer = rawBuffer.slice(closeTagIndex + thinkCloseTag.length);
                        isInThinkingMode = false;
                    } else {
                        thinkingBuffer = rawBuffer.slice(thinkOpenTag.length);
                    }
                } else if (isInThinkingMode) {
                    const closeTagIndex = rawBuffer.indexOf(thinkCloseTag);
                    if (closeTagIndex !== -1) {
                        thinkingBuffer = rawBuffer.slice(thinkOpenTag.length, closeTagIndex);
                        messageBuffer = rawBuffer.slice(closeTagIndex + thinkCloseTag.length);
                        isInThinkingMode = false;
                    } else {
                        thinkingBuffer = rawBuffer.slice(thinkOpenTag.length);
                    }
                } else {
                    messageBuffer = rawBuffer;
                }
                console.log(thinkingBuffer);
                console.log(messageBuffer);

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
            },
        });

        // Start generation in background
        const generatePromise = llmModule.generate(formattedMessages).then((fullResponse) => {
            console.log('[ExecuTorchProvider] Generation complete, response length:', fullResponse?.length || 0);
            generationComplete = true;

            // Add final chunk
            chunkQueue.push({
                content: '',
                thinking: thinkingBuffer || undefined,
                done: true,
            });

            // Wake up generator
            if (resolveWait) {
                resolveWait();
                resolveWait = null;
            }

            return fullResponse;
        }).catch((error) => {
            console.error('[ExecuTorchProvider] Generation error:', error);
            generationComplete = true;
            if (resolveWait) {
                resolveWait();
                resolveWait = null;
            }
            throw error;
        }).finally(() => {
            state.setGenerating(false);
            state.setProcessingPrompt(false);
        });

        try {
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

            // Wait for generation to complete
            await generatePromise;

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
        return new LLMError(message, LLMErrorCode.UNKNOWN, 'executorch');
    }
}
