/**
 * ExecuTorch Provider - Web Stub
 * 
 * Empty stub for web platform where react-native-executorch is not available.
 */

import { LLMConfig } from '../../types';
import {
    ILLMProvider,
    LLMError,
    LLMErrorCode,
    LLMRequest,
    LLMStreamChunk
} from '../types';

export class ExecuTorchProvider implements ILLMProvider {
    isReady(): boolean {
        return false;
    }

    interrupt(): void {
        // No-op on web
    }

    async *sendMessageStream(
        _request: LLMRequest
    ): AsyncGenerator<LLMStreamChunk, void, unknown> {
        throw new LLMError(
            'ExecuTorch is not supported on web.',
            LLMErrorCode.PROVIDER_NOT_SUPPORTED,
            'executorch'
        );
    }

    async fetchModels(_llmConfig: LLMConfig): Promise<string[]> {
        return [];
    }

    async testConnection(_llmConfig: LLMConfig): Promise<boolean> {
        return false;
    }
}
