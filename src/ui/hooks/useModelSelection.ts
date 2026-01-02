/**
 * useModelSelection Hook
 * 
 * Centralized hook for model selection logic across the app.
 * Handles:
 * - LLM config fetching from useLLMStore
 * - Downloaded models from useModelDownloadStore
 * - Local model state from useExecutorchLLMStore and useLlamaCppLLMStore
 * - Model filtering by provider type (executorch, llama-cpp, remote)
 * - Ollama model classification (completion vs embedding)
 * - Model loading dispatch to the correct store
 */

import { useCallback, useEffect, useMemo } from 'react';
import { DownloadedModel, LLMConfig, LLMProviderKey, Persona } from '../../core/types';
import {
    isLocalProvider,
    useExecutorchLLMStore,
    useLlamaCppLLMStore,
    useLLMStore,
    useModelDownloadStore,
    useOllamaModelStore,
    usePersonaStore,
} from '../../state';

export interface LocalModelState {
    isLoading: boolean;
    isReady: boolean;
    selectedModelId: string | null;
    selectedModelName: string | null;
    downloadProgress: number;
}

export interface UseModelSelectionReturn {
    // LLM Configs
    enabledConfigs: LLMConfig[];
    getConfigById: (id: string) => LLMConfig | undefined;

    // Downloaded models (local)
    downloadedModels: DownloadedModel[];

    // Model list helpers
    getModelsForConfig: (config: LLMConfig) => string[];
    getDownloadedModelByName: (name: string) => DownloadedModel | undefined;

    // Local model state (unified from both stores)
    localModelState: LocalModelState;

    // Actions
    loadLocalModel: (downloadedModel: DownloadedModel) => void;
    fetchModelsForConfig: (configId: string) => Promise<void>;

    // Remote model state
    availableModels: Record<string, string[]>;
    isLoadingRemoteModels: boolean;

    // Personas
    personas: Persona[];
    getPersonaById: (id: string) => Persona | undefined;
}

export function useModelSelection(): UseModelSelectionReturn {
    // LLM Store
    const {
        configs,
        availableModels,
        fetchModels,
        isLoadingModels,
        getConfigById,
    } = useLLMStore();

    // Downloaded models store
    const { downloadedModels, loadDownloadedModels } = useModelDownloadStore();

    // Executorch LLM store
    const {
        selectedModelName: executorchModelName,
        selectedModelId: executorchModelId,
        isReady: isExecutorchReady,
        isLoading: isExecutorchLoading,
        downloadProgress: executorchDownloadProgress,
        loadModel: loadExecutorchModel,
    } = useExecutorchLLMStore();

    // Llama.cpp LLM store
    const {
        selectedModelName: llamaCppModelName,
        selectedModelId: llamaCppModelId,
        isReady: isLlamaCppReady,
        isLoading: isLlamaCppLoading,
        loadModel: loadLlamaCppModel,
    } = useLlamaCppLLMStore();

    // Ollama model store for completion/embedding classification
    const {
        completionModels: ollamaCompletionModels,
        hasFetched: ollamaHasFetched,
        fetchAndClassifyModels: fetchOllamaModels,
    } = useOllamaModelStore();

    // Persona store
    const { personas, loadPersonas, getPersonaById } = usePersonaStore();

    // Load data on mount
    useEffect(() => {
        loadDownloadedModels();
        loadPersonas();
    }, [loadDownloadedModels, loadPersonas]);

    // Enabled configs only
    const enabledConfigs = useMemo(
        () => configs.filter((c) => c.isEnabled),
        [configs]
    );

    // Unified local model state
    const localModelState: LocalModelState = useMemo(() => ({
        isLoading: isExecutorchLoading || isLlamaCppLoading,
        isReady: isExecutorchReady || isLlamaCppReady,
        selectedModelId: executorchModelId || llamaCppModelId,
        selectedModelName: executorchModelName || llamaCppModelName,
        downloadProgress: executorchDownloadProgress,
    }), [
        isExecutorchLoading, isLlamaCppLoading,
        isExecutorchReady, isLlamaCppReady,
        executorchModelId, llamaCppModelId,
        executorchModelName, llamaCppModelName,
        executorchDownloadProgress,
    ]);

    // Get models for a config - handles local vs remote providers
    const getModelsForConfig = useCallback((config: LLMConfig): string[] => {
        // For ExecuTorch, show downloaded executorch LLM models
        if (config.provider === LLMProviderKey.Executorch) {
            return downloadedModels
                .filter(dm => dm.provider === 'executorch' && dm.type === 'llm')
                .map(dm => dm.name);
        }

        // For llama-cpp, show downloaded llama-cpp LLM models
        if (config.provider === LLMProviderKey.LlamaCpp) {
            return downloadedModels
                .filter(dm => dm.provider === 'llama-cpp' && dm.type === 'llm')
                .map(dm => dm.name);
        }

        // For Ollama, show only completion models (not embedding models)
        if (config.provider === LLMProviderKey.Ollama) {
            // If we have classified models, use only completion models
            if (ollamaCompletionModels.length > 0) {
                return ollamaCompletionModels;
            }
            // Fall back to all fetched models if classification not done
            if (availableModels[config.id] && availableModels[config.id].length > 0) {
                return availableModels[config.id];
            }
            // Return empty for now - models should be fetched
            return [];
        }

        // For other remote providers - use fetched models if available
        if (availableModels[config.id] && availableModels[config.id].length > 0) {
            return availableModels[config.id];
        }

        // Return empty array - models should be fetched from provider
        return [];
    }, [downloadedModels, availableModels, ollamaCompletionModels]);

    // Find downloaded model by display name
    const getDownloadedModelByName = useCallback((name: string): DownloadedModel | undefined => {
        return downloadedModels.find(m => m.name === name);
    }, [downloadedModels]);

    // Load a local model using the correct store
    const loadLocalModel = useCallback((downloadedModel: DownloadedModel) => {
        console.log('[useModelSelection] Loading local model:', downloadedModel.name, 'provider:', downloadedModel.provider);

        if (downloadedModel.provider === 'llama-cpp') {
            loadLlamaCppModel(downloadedModel.modelId, downloadedModel.name, downloadedModel);
        } else {
            loadExecutorchModel(downloadedModel.modelId, downloadedModel.name, downloadedModel);
        }
    }, [loadLlamaCppModel, loadExecutorchModel]);

    // Fetch models for a remote config - memoized to prevent infinite loops
    const fetchModelsForConfig = useCallback(async (configId: string) => {
        const config = getConfigById(configId);
        if (config && !isLocalProvider(config.provider)) {
            await fetchModels(configId);

            // For Ollama, also trigger model classification (only once)
            if (config.provider === LLMProviderKey.Ollama && !ollamaHasFetched && config.baseUrl) {
                fetchOllamaModels(config.baseUrl, config.headers);
            }
        }
    }, [getConfigById, fetchModels, ollamaHasFetched, fetchOllamaModels]);

    return {
        // LLM Configs
        enabledConfigs,
        getConfigById,

        // Downloaded models
        downloadedModels,

        // Model helpers
        getModelsForConfig,
        getDownloadedModelByName,

        // Local model state
        localModelState,

        // Actions
        loadLocalModel,
        fetchModelsForConfig,

        // Remote models
        availableModels,
        isLoadingRemoteModels: isLoadingModels,

        // Personas
        personas,
        getPersonaById,
    };
}

