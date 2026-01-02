/**
 * Llama.cpp Provider - Web Stub
 *
 * Stub implementation for web platform where llama.cpp is not supported.
 */

import { LLMConfig } from '../../types';
import {
    ILLMProvider,
    LLMError,
    LLMErrorCode,
    LLMRequest,
    LLMStreamChunk
} from '../types';

export class LlamaCppProvider implements ILLMProvider {
    isReady(): boolean {
        return false;
    }

    interrupt(): void {
        // Not supported on web
    }

    async *sendMessageStream(
        _request: LLMRequest
    ): AsyncGenerator<LLMStreamChunk, void, unknown> {
        throw new LLMError(
            'Llama.cpp is not supported on web platform.',
            LLMErrorCode.PROVIDER_NOT_SUPPORTED,
            'llama-cpp'
        );
    }

    async fetchModels(_llmConfig: LLMConfig): Promise<string[]> {
        return [];
    }

    async testConnection(_llmConfig: LLMConfig): Promise<boolean> {
        return false;
    }
}
