/**
 * Ollama Embeddings
 *
 * Embedding implementation using Ollama server for RAG.
 * Similar to LlamaEmbeddings but uses Ollama's remote API.
 *
 * Usage:
 *   const embeddings = new OllamaEmbeddings({ baseUrl: 'http://localhost:11434', model: 'nomic-embed-text' });
 *   await embeddings.load();
 *   const vector = await embeddings.embed('Hello, world!');
 *   await embeddings.unload();
 */

import { fetch } from 'expo/fetch';
import { Embeddings } from 'react-native-rag';

export interface OllamaEmbeddingsConfig {
    /** Base URL of the Ollama server (e.g., 'http://localhost:11434') */
    baseUrl: string;
    /** Model name to use for embeddings (e.g., 'nomic-embed-text') */
    model: string;
    /** Optional headers for authentication */
    headers?: Record<string, string>;
}

/**
 * Ollama Embeddings implementation
 * Implements the Embeddings interface from react-native-rag
 */
export class OllamaEmbeddings implements Embeddings {
    private config: OllamaEmbeddingsConfig;
    private _isLoaded = false;

    constructor(config: OllamaEmbeddingsConfig) {
        this.config = config;
    }

    /**
     * Load the embedding model (verify connection to Ollama)
     * Returns self for chaining (required by Embeddings interface)
     */
    async load(): Promise<this> {
        if (this._isLoaded) {
            console.log('[OllamaEmbeddings] Already loaded');
            return this;
        }

        console.log('[OllamaEmbeddings] Loading embedding model:', this.config.model);

        try {
            // Test connection by calling the show endpoint
            const response = await fetch(`${this.config.baseUrl}/api/show`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.config.headers,
                },
                body: JSON.stringify({ name: this.config.model }),
            });

            if (!response.ok) {
                throw new Error(`Failed to verify model: ${response.status} ${response.statusText}`);
            }

            this._isLoaded = true;
            console.log('[OllamaEmbeddings] Model loaded successfully');
            return this;
        } catch (error) {
            console.error('[OllamaEmbeddings] Failed to load model:', error);
            throw error;
        }
    }

    /**
     * Unload the embedding model (no-op for remote Ollama)
     */
    async unload(): Promise<void> {
        console.log('[OllamaEmbeddings] Unloading model');
        this._isLoaded = false;
    }

    /**
     * Generate embedding for a single text
     */
    async embed(text: string): Promise<number[]> {
        if (!this._isLoaded) {
            throw new Error('[OllamaEmbeddings] Model not loaded. Call load() first.');
        }

        try {
            console.log('[OllamaEmbeddings] Embedding text:', text);
            const response = await fetch(`${this.config.baseUrl}/api/embed`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.config.headers,
                },
                body: JSON.stringify({
                    model: this.config.model,
                    input: text,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Embedding request failed: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            // Ollama returns embeddings in data.embeddings array
            // For single input, we want the first embedding
            if (data.embeddings && data.embeddings.length > 0) {
                return data.embeddings[0];
            }

            throw new Error('[OllamaEmbeddings] No embeddings returned from API');
        } catch (error) {
            console.error('[OllamaEmbeddings] Embedding error:', error);
            throw error;
        }
    }

    /**
     * Check if the model is loaded
     */
    isLoaded(): boolean {
        return this._isLoaded;
    }
}
