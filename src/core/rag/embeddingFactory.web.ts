/**
 * Embedding Factory - Web Stub
 * 
 * Web platform does not support RAG embeddings.
 */

import { Embeddings } from 'react-native-rag';
import { DownloadedModel, RAGProviderType } from '../types';
import { IEmbeddingFactory } from './types';

/**
 * Stub embedding factory for web platform
 */
class EmbeddingFactory implements IEmbeddingFactory {
    async createEmbedding(_providerType: RAGProviderType, _model: DownloadedModel): Promise<Embeddings> {
        throw new Error('RAG embeddings not supported on web platform');
    }

    isLocalProvider(_providerType: RAGProviderType): boolean {
        return false;
    }
}

export const embeddingFactory = new EmbeddingFactory();
