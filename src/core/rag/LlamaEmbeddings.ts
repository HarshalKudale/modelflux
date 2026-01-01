/**
 * Llama Embeddings
 *
 * Embedding implementation using llama.rn for RAG.
 * Similar to ExecuTorchEmbeddings but uses llama.rn's embedding API.
 *
 * Usage:
 *   const embeddings = new LlamaEmbeddings({ modelSource: '/path/to/model.gguf' });
 *   await embeddings.load();
 *   const vector = await embeddings.embed('Hello, world!');
 *   await embeddings.unload();
 */

import { Embeddings } from 'react-native-rag';

// Type definitions for llama.rn (the package provides these at runtime)
interface LlamaContext {
    embedding(text: string): Promise<{ embedding: number[] }>;
    release(): Promise<void>;
}

interface InitLlamaParams {
    model: string;
    embedding?: boolean;
    n_ctx?: number;
    n_gpu_layers?: number;
}

// Dynamic import will be used at runtime
let initLlamaFn: ((params: InitLlamaParams) => Promise<LlamaContext>) | null = null;

async function getInitLlama(): Promise<(params: InitLlamaParams) => Promise<LlamaContext>> {
    if (!initLlamaFn) {
        try {
            const llamaRn = await import('llama.rn');
            initLlamaFn = llamaRn.initLlama;
        } catch (error) {
            throw new Error('llama.rn is not installed or not available');
        }
    }
    return initLlamaFn;
}

export interface LlamaEmbeddingsConfig {
    /** Path to the GGUF model file */
    modelSource: string;
    /** Context window size (default: 512 for embeddings) */
    n_ctx?: number;
    /** Number of GPU layers to offload (Metal/Vulkan) */
    n_gpu_layers?: number;
}

/**
 * Llama.cpp Embeddings implementation
 * Implements the Embeddings interface from react-native-rag
 */
export class LlamaEmbeddings implements Embeddings {
    private config: LlamaEmbeddingsConfig;
    private context: LlamaContext | null = null;
    private _isLoaded = false;

    constructor(config: LlamaEmbeddingsConfig) {
        this.config = {
            n_ctx: 512,
            n_gpu_layers: 99,
            ...config,
        };
    }

    /**
     * Load the embedding model
     * Returns self for chaining (required by Embeddings interface)
     */
    async load(): Promise<this> {
        if (this._isLoaded && this.context) {
            console.log('[LlamaEmbeddings] Already loaded');
            return this;
        }

        console.log('[LlamaEmbeddings] Loading embedding model:', this.config.modelSource);

        try {
            const initLlama = await getInitLlama();
            this.context = await initLlama({
                model: this.config.modelSource,
                embedding: true,
                n_ctx: this.config.n_ctx,
                n_gpu_layers: this.config.n_gpu_layers,
            });

            this._isLoaded = true;
            console.log('[LlamaEmbeddings] Model loaded successfully');
            return this;
        } catch (error) {
            console.error('[LlamaEmbeddings] Failed to load model:', error);
            throw error;
        }
    }

    /**
     * Unload the embedding model and release resources
     */
    async unload(): Promise<void> {
        if (this.context) {
            console.log('[LlamaEmbeddings] Unloading model');
            try {
                await this.context.release();
            } catch (error) {
                console.warn('[LlamaEmbeddings] Error during unload:', error);
            }
            this.context = null;
            this._isLoaded = false;
        }
    }

    /**
     * Generate embedding for a single text
     */
    async embed(text: string): Promise<number[]> {
        if (!this.context || !this._isLoaded) {
            throw new Error('[LlamaEmbeddings] Model not loaded. Call load() first.');
        }

        try {
            const result = await this.context.embedding(text);
            return result.embedding;
        } catch (error) {
            console.error('[LlamaEmbeddings] Embedding error:', error);
            throw error;
        }
    }

    /**
     * Check if the model is loaded
     */
    isLoaded(): boolean {
        return this._isLoaded && this.context !== null;
    }
}
