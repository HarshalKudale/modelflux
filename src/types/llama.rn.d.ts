/**
 * Type declarations for llama.rn
 * This file provides types for dynamic imports when llama.rn is not installed at build time
 */

declare module 'llama.rn' {
    export interface LlamaContext {
        completion(
            params: {
                messages?: Array<{ role: string; content: string }>;
                prompt?: string;
                n_predict?: number;
                stop?: string[];
                temperature?: number;
                top_p?: number;
            },
            callback: (data: { token: string }) => void
        ): Promise<{ text: string }>;

        embedding(text: string): Promise<{ embedding: number[] }>;

        stopCompletion(): void;

        release(): Promise<void>;
    }

    export interface InitLlamaParams {
        model: string;
        n_ctx?: number;
        n_gpu_layers?: number;
        use_mlock?: boolean;
        embedding?: boolean;
    }

    export function initLlama(params: InitLlamaParams): Promise<LlamaContext>;

    export function loadLlamaModelInfo(modelPath: string): Promise<unknown>;
}
