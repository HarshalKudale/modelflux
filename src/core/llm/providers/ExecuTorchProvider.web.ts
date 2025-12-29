/**
 * ExecuTorch Provider - Web Stub
 * 
 * Empty stub for web platform where react-native-executorch is not available.
 * All methods throw errors indicating ExecuTorch is not supported on web.
 */

import { LLMConfig } from '../../types';
import {
    ILLMClient,
    LLMError,
    LLMErrorCode,
    LLMRequest,
    LLMStreamChunk
} from '../types';

export class ExecuTorchProvider implements ILLMClient {
    isReady(): boolean {
        return false;
    }

    async *sendMessageStream(
        request: LLMRequest
    ): AsyncGenerator<LLMStreamChunk, void, unknown> {
        throw new LLMError(
            'ExecuTorch is not supported on web. Please use the mobile app for on-device LLM inference.',
            LLMErrorCode.PROVIDER_NOT_SUPPORTED,
            'executorch'
        );
    }

    async fetchModels(llmConfig: LLMConfig): Promise<string[]> {
        // Return empty array on web - no models available
        return [];
    }

    async testConnection(llmConfig: LLMConfig): Promise<boolean> {
        // Always return false on web - ExecuTorch not supported
        return false;
    }
}
