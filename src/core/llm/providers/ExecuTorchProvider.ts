/**
 * ExecuTorch Provider
 * 
 * Provider for running LLM models on-device using react-native-executorch LLMModule.
 * Uses the stored llmModule from localLLMStore.
 * Streaming works via tokenCallback which appends to store's currentResponse.
 */

import { LLMConfig } from '../../types';
import {
    ILLMClient,
    LLMError,
    LLMErrorCode,
    LLMRequest,
    LLMResponse,
    LLMStreamChunk
} from '../types';

import { useLocalLLMStore } from '../../../state/localLLMStore';

export class ExecuTorchProvider implements ILLMClient {
    private getStoreState() {
        return useLocalLLMStore.getState();
    }

    isReady(): boolean {
        return this.getStoreState().isReady;
    }

    async sendMessage(request: LLMRequest): Promise<LLMResponse> {
        const { llmConfig, messages } = request;
        const { llmModule, isReady, clearResponse, setGenerating } = this.getStoreState();

        if (!llmModule || !isReady) {
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

        console.log('[ExecuTorchProvider] Messages:', JSON.stringify(formattedMessages, null, 2));

        try {
            clearResponse();
            setGenerating(true);

            // generate() returns the full response when complete
            const response = await llmModule.generate(formattedMessages);

            setGenerating(false);

            return {
                content: response,
                model: llmConfig.defaultModel,
            };
        } catch (error) {
            setGenerating(false);
            console.error('[ExecuTorchProvider] Error:', error);
            throw this.wrapError(error);
        }
    }

    async *sendMessageStream(
        request: LLMRequest
    ): AsyncGenerator<LLMStreamChunk, void, unknown> {
        const { messages, llmConfig } = request;
        const state = this.getStoreState();

        if (!state.llmModule || !state.isReady) {
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

        console.log('[ExecuTorchProvider] Messages:', JSON.stringify(formattedMessages, null, 2));

        // Clear previous response and start generation
        state.clearResponse();
        state.setGenerating(true);

        // Start generation in background - tokens will come via tokenCallback
        const generatePromise = state.llmModule.generate(formattedMessages);

        // Poll currentResponse for new tokens
        let lastLength = 0;
        const pollIntervalMs = 30;
        const maxWaitMs = 120000;
        let waitedMs = 0;

        try {
            while (waitedMs < maxWaitMs) {
                const currentState = this.getStoreState();
                const currentResponse = currentState.currentResponse;

                // Yield new content
                if (currentResponse.length > lastLength) {
                    const newContent = currentResponse.slice(lastLength);
                    lastLength = currentResponse.length;
                    yield { content: newContent, done: false };
                }

                // Check if generation is complete
                if (!currentState.isGenerating && currentResponse.length > 0) {
                    break;
                }

                await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
                waitedMs += pollIntervalMs;
            }

            // Wait for generate to complete
            await generatePromise;
            state.setGenerating(false);

            // Yield any remaining content
            const finalState = this.getStoreState();
            if (finalState.currentResponse.length > lastLength) {
                yield { content: finalState.currentResponse.slice(lastLength), done: false };
            }

            yield { content: '', done: true };

        } catch (error) {
            state.setGenerating(false);
            throw this.wrapError(error);
        }
    }

    async fetchModels(llmConfig: LLMConfig): Promise<string[]> {
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
