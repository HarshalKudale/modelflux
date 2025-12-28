/**
 * ExecuTorch Provider
 * 
 * Provider for running LLM models on-device using react-native-executorch LLMModule.
 * Uses the stored llmModule from executorchLLMStore.
 * Streaming works via tokenCallback which appends to store's currentResponse.
 */

import { LLMConfig } from '../../types';
import {
    ILLMClient,
    LLMError,
    LLMErrorCode,
    LLMRequest,
    LLMStreamChunk
} from '../types';

import { useExecutorchLLMStore } from '../../../state/executorchLLMStore';

export class ExecuTorchProvider implements ILLMClient {
    private getStoreState() {
        return useExecutorchLLMStore.getState();
    }

    isReady(): boolean {
        return this.getStoreState().isReady;
    }

    async *sendMessageStream(
        request: LLMRequest
    ): AsyncGenerator<LLMStreamChunk, void, unknown> {
        const { messages, conversationId } = request;
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

        console.log('[ExecuTorchProvider] Messages:', JSON.stringify(formattedMessages, null, 2));

        // Clear previous response and set up for generation
        state.clearResponse();
        state.setCurrentConversationId(conversationId || null);
        state.setProcessingPrompt(true);
        state.setGenerating(true);

        try {
            // Await generate() - tokens are streamed via tokenCallback in executorchLLMStore
            // which updates conversationStore.currentMessage in real-time
            const fullResponse = await llmModule.generate(formattedMessages);

            console.log('[ExecuTorchProvider] Generation complete, response length:', fullResponse?.length || 0);

            // Generation complete
            state.setGenerating(false);
            state.setProcessingPrompt(false);
            state.setCurrentConversationId(null);

            // Yield the full response as done
            yield { content: fullResponse || '', done: true };

        } catch (error) {
            state.setGenerating(false);
            state.setProcessingPrompt(false);
            state.setCurrentConversationId(null);
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

