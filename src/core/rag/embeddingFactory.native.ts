import { ExecuTorchEmbeddings } from '@react-native-rag/executorch';
import { Embeddings } from 'react-native-rag';
import { DownloadedModel, RAGProviderType } from '../types';
import { LlamaEmbeddings } from './LlamaEmbeddings';
import { OllamaEmbeddings, OllamaEmbeddingsConfig } from './OllamaEmbeddings';
import { IEmbeddingFactory } from './types';

/**
 * Embedding factory for native platforms
 */
class EmbeddingFactory implements IEmbeddingFactory {
    /**
     * Create an embedding instance for the given provider and model
     */
    async createEmbedding(
        providerType: RAGProviderType,
        model: DownloadedModel,
        ollamaConfig?: OllamaEmbeddingsConfig
    ): Promise<Embeddings> {
        switch (providerType) {
            case 'executorch':
                return this.createExecuTorchEmbedding(model);

            case 'llama-cpp':
                return this.createLlamaEmbedding(model);

            case 'openai':
                // TODO: Implement OpenAI embeddings
                throw new Error('OpenAI embeddings not yet implemented');

            case 'ollama':
                if (!ollamaConfig) {
                    throw new Error('Ollama config required for Ollama embeddings');
                }
                return this.createOllamaEmbedding(ollamaConfig);

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

        // Pass file paths directly as strings (file:// URIs)
        // ResourceFetcher.getType() correctly handles file:// strings as LOCAL_FILE type
        return new ExecuTorchEmbeddings({
            modelSource: model.modelFilePath,
            tokenizerSource: model.tokenizerFilePath,
        });
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

    /**
     * Create Ollama embedding instance from config
     */
    private async createOllamaEmbedding(config: OllamaEmbeddingsConfig): Promise<Embeddings> {
        console.log('[EmbeddingFactory] Creating Ollama embedding with model:', config.model);
        console.log('[EmbeddingFactory] Base URL:', config.baseUrl);

        const embeddings = new OllamaEmbeddings(config);

        // Load (verify connection) before returning
        await embeddings.load();

        return embeddings;
    }
}

export const embeddingFactory = new EmbeddingFactory();

