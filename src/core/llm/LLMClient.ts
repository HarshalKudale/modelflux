import { LLMConfig, LLMProvider } from '../types';
import { aisdkProvider, ExecuTorchProvider, LlamaCppProvider } from './providers';

// Unified interface for all providers
interface ILLMClient {
    sendMessageStream(request: import('./types').LLMRequest): AsyncGenerator<import('./types').LLMStreamChunk, void, unknown>;
    sendGenerateStream(request: import('./types').LLMGenerateRequest): AsyncGenerator<import('./types').LLMStreamChunk, void, unknown>;
    interrupt(): void;
    fetchModels(config: LLMConfig): Promise<string[]>;
    testConnection(config: LLMConfig): Promise<boolean>;
}

// Create singleton instances of local providers
const execuTorchProvider = new ExecuTorchProvider();
const llamaCppProvider = new LlamaCppProvider();

/**
 * Factory for creating provider-specific LLM clients
 */
export interface ILLMClientFactory {
    getClient(config: LLMConfig): ILLMClient;
}

class LLMClientFactory implements ILLMClientFactory {
    private clients: Map<LLMProvider, ILLMClient> = new Map();

    getClient(config: LLMConfig): ILLMClient {
        switch (config.provider) {
            case 'openai':
            case 'openai-spec':
            case 'anthropic':
            case 'ollama':
                // All remote providers use AI SDK adapter
                return aisdkProvider;
            case 'executorch':
                // Local on-device provider using ExecuTorch
                return this.getOrCreate('executorch', () => execuTorchProvider);
            case 'llama-cpp':
                // Local on-device provider using llama.cpp
                return this.getOrCreate('llama-cpp', () => llamaCppProvider);
            default:
                throw new Error(`Unknown provider: ${config.provider}`);
        }
    }

    private getOrCreate(
        key: LLMProvider,
        factory: () => ILLMClient
    ): ILLMClient {
        if (!this.clients.has(key)) {
            this.clients.set(key, factory());
        }
        return this.clients.get(key)!;
    }
}

export const llmClientFactory = new LLMClientFactory();
