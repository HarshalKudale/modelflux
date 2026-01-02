import { LLMConfig, LLMProvider } from '../types';
import { anthropicProvider, ExecuTorchProvider, LlamaCppProvider, ollamaProvider, openAIProvider } from './providers';
import { ILLMClient } from './types';

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
                // Official OpenAI API
                return this.getOrCreate('openai', () => openAIProvider);
            case 'openai-spec':
                // OpenAI-compatible API (uses same provider, just different URL)
                return this.getOrCreate('openai-spec', () => openAIProvider);
            case 'anthropic':
                // Anthropic Claude API
                return this.getOrCreate('anthropic', () => anthropicProvider);
            case 'ollama':
                return this.getOrCreate('ollama', () => ollamaProvider);
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

