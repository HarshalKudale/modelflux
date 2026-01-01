/**
 * Embedding Factory - Native Implementation
 * 
 * Creates embedding instances based on provider type.
 * This is the native implementation for iOS/Android.
 */

import { ExecuTorchEmbeddings } from '@react-native-rag/executorch';
import { Embeddings } from 'react-native-rag';
import { DownloadedModel, RAGProviderType } from '../types';
import { LlamaEmbeddings } from './LlamaEmbeddings';
import { IEmbeddingFactory } from './types';

/**
 * Embedding factory for native platforms
 */
class EmbeddingFactory implements IEmbeddingFactory {
    /**
     * Create an embedding instance for the given provider and model
     */
    async createEmbedding(providerType: RAGProviderType, model: DownloadedModel): Promise<Embeddings> {
        switch (providerType) {
            case 'executorch':
                return this.createExecuTorchEmbedding(model);

            case 'llama-cpp':
                return this.createLlamaEmbedding(model);

            case 'openai':
                // TODO: Implement OpenAI embeddings
                throw new Error('OpenAI embeddings not yet implemented');

            case 'ollama':
                // TODO: Implement Ollama embeddings
                throw new Error('Ollama embeddings not yet implemented');

            default:
                throw new Error(`Unknown provider type: ${providerType}`);
        }
    }

    /**
     * Check if a provider type uses local downloaded models
     */
    isLocalProvider(providerType: RAGProviderType): boolean {
        switch (providerType) {
            case 'executorch':
            case 'llama-cpp':
                return true;
            case 'openai':
            case 'ollama':
                return false;
            default:
                return false;
        }
    }

    /**
     * Create ExecuTorch embedding instance from downloaded model
     */
    private createExecuTorchEmbedding(model: DownloadedModel): Embeddings {
        console.log('[EmbeddingFactory] Creating ExecuTorch embedding with model:', model.name);
        console.log('[EmbeddingFactory] Model path:', model.modelFilePath);
        console.log('[EmbeddingFactory] Tokenizer path:', model.tokenizerFilePath);

        const assets = {
            modelSource: { source: model.modelFilePath, type: 1 },
            tokenizerSource: { source: model.tokenizerFilePath, type: 1 },
        };

        return new ExecuTorchEmbeddings(assets);
    }

    /**
     * Create Llama.cpp embedding instance from downloaded model
     */
    private async createLlamaEmbedding(model: DownloadedModel): Promise<Embeddings> {
        console.log('[EmbeddingFactory] Creating Llama.cpp embedding with model:', model.name);
        console.log('[EmbeddingFactory] Model path:', model.modelFilePath);

        const embeddings = new LlamaEmbeddings({
            modelSource: model.modelFilePath,
        });

        // Load the model before returning
        await embeddings.load();

        return embeddings;
    }
}

export const embeddingFactory = new EmbeddingFactory();
