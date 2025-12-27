/**
 * Local LLM Service
 * 
 * Manages on-device AI model loading and inference for local providers.
 * Ensures only one model can be loaded at a time across all local providers.
 */

import { LLMConfig, LocalModel } from '../types';

/**
 * Status of the local LLM runtime
 */
export type LocalLLMStatus = 'idle' | 'loading' | 'ready' | 'generating' | 'error';

/**
 * Message format for local LLM
 */
export interface LocalLLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

/**
 * Options for local model loading
 */
export interface LocalModelLoadOptions {
    modelSource: string;
    tokenizerSource?: string;
    tokenizerConfigSource?: string;
}

/**
 * Response from local LLM generation
 */
export interface LocalLLMGenerationResult {
    response: string;
    isComplete: boolean;
    error?: string;
}

/**
 * Callback for streaming responses
 */
export type LocalLLMStreamCallback = (chunk: string, isComplete: boolean) => void;

/**
 * State of the currently loaded model
 */
export interface LoadedModelState {
    providerId: string;
    modelId: string;
    modelPath: string;
    status: LocalLLMStatus;
    error?: string;
}

/**
 * Local LLM Service Singleton
 * 
 * This service manages a single loaded model at a time.
 * When a new model is requested, the previous one is unloaded.
 */
class LocalLLMServiceImpl {
    private currentModel: LoadedModelState | null = null;
    private listeners: Set<(state: LoadedModelState | null) => void> = new Set();

    /**
     * Get the current loaded model state
     */
    getCurrentModel(): LoadedModelState | null {
        return this.currentModel;
    }

    /**
     * Subscribe to model state changes
     */
    subscribe(listener: (state: LoadedModelState | null) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Notify all listeners of state change
     */
    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.currentModel));
    }

    /**
     * Update current model state
     */
    private updateState(state: Partial<LoadedModelState>): void {
        if (this.currentModel) {
            this.currentModel = { ...this.currentModel, ...state };
        } else if (state.providerId && state.modelId && state.modelPath) {
            this.currentModel = {
                providerId: state.providerId,
                modelId: state.modelId,
                modelPath: state.modelPath,
                status: state.status || 'idle',
                error: state.error,
            };
        }
        this.notifyListeners();
    }

    /**
     * Check if a specific model is currently loaded
     */
    isModelLoaded(providerId: string, modelId: string): boolean {
        return (
            this.currentModel?.providerId === providerId &&
            this.currentModel?.modelId === modelId &&
            this.currentModel?.status === 'ready'
        );
    }

    /**
     * Check if any model is currently loading
     */
    isLoading(): boolean {
        return this.currentModel?.status === 'loading';
    }

    /**
     * Check if any model is currently generating
     */
    isGenerating(): boolean {
        return this.currentModel?.status === 'generating';
    }

    /**
     * Load a local model
     * 
     * This will unload any currently loaded model first.
     * In a real implementation, this would use react-native-executorch's useLLM hook.
     */
    async loadModel(
        config: LLMConfig,
        model: LocalModel
    ): Promise<boolean> {
        // Check if this model is already loaded
        if (this.isModelLoaded(config.id, model.id)) {
            console.log('[LocalLLM] Model already loaded:', model.name);
            return true;
        }

        // Unload current model if any
        if (this.currentModel) {
            await this.unloadModel();
        }

        // Set loading state
        this.currentModel = {
            providerId: config.id,
            modelId: model.id,
            modelPath: model.filePath,
            status: 'loading',
        };
        this.notifyListeners();

        try {
            console.log('[LocalLLM] Loading model:', model.name, 'from', model.filePath);

            // NOTE: Actual model loading happens through react-native-executorch's useLLM hook
            // This service tracks the state and coordinates between components
            // The actual loading is done in the component that uses the useLLM hook

            // Simulate loading delay for now (real loading happens in component)
            await new Promise(resolve => setTimeout(resolve, 100));

            this.updateState({ status: 'ready' });
            console.log('[LocalLLM] Model loaded successfully:', model.name);
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load model';
            this.updateState({ status: 'error', error: errorMessage });
            console.error('[LocalLLM] Failed to load model:', error);
            return false;
        }
    }

    /**
     * Unload the current model
     */
    async unloadModel(): Promise<void> {
        if (!this.currentModel) {
            return;
        }

        console.log('[LocalLLM] Unloading model');

        // NOTE: Actual unloading would be handled by the component unmounting
        // or by calling a cleanup function from useLLM

        this.currentModel = null;
        this.notifyListeners();
    }

    /**
     * Mark that generation is starting
     */
    startGeneration(): void {
        if (this.currentModel?.status === 'ready') {
            this.updateState({ status: 'generating' });
        }
    }

    /**
     * Mark that generation is complete
     */
    endGeneration(): void {
        if (this.currentModel?.status === 'generating') {
            this.updateState({ status: 'ready' });
        }
    }

    /**
     * Get the status of a specific model
     */
    getModelStatus(providerId: string, modelId: string): LocalLLMStatus {
        if (
            this.currentModel?.providerId === providerId &&
            this.currentModel?.modelId === modelId
        ) {
            return this.currentModel.status;
        }
        return 'idle';
    }
}

// Export singleton instance
export const LocalLLMService = new LocalLLMServiceImpl();
