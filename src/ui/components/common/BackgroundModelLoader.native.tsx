/**
 * BackgroundModelLoader - Native Implementation
 * 
 * Uses LLMModule class (not useLLM hook) to load models.
 * Stores the module instance in localLLMStore.
 * Uses tokenCallback for streaming - no polling needed.
 */

import { useEffect, useRef } from 'react';
import { LLMModule } from 'react-native-executorch';
import { useLLMStore } from '../../../state/llmStore';
import { useLocalLLMStore } from '../../../state/localLLMStore';
import { useModelDownloadStore } from '../../../state/modelDownloadStore';

export function BackgroundModelLoader() {
    const {
        selectedModelId,
        setLLMModule,
        setLoading,
        setReady,
        setDownloadProgress,
        setError,
        appendToken,
        setGenerating,
    } = useLocalLLMStore();
    const { getDownloadedModel } = useModelDownloadStore();

    const moduleRef = useRef<InstanceType<typeof LLMModule> | null>(null);
    const loadedModelIdRef = useRef<string | null>(null);

    useEffect(() => {
        // If no model selected, do nothing
        if (!selectedModelId) {
            console.log('[BackgroundModelLoader] No selectedModelId, returning early');
            return;
        }

        // Debug: log values being compared
        console.log('[BackgroundModelLoader] Checking if should skip:', {
            selectedModelId,
            loadedModelIdRef: loadedModelIdRef.current,
            hasModuleRef: !!moduleRef.current,
            areEqual: loadedModelIdRef.current === selectedModelId,
        });

        // If same model already loaded and module exists, skip loading
        if (loadedModelIdRef.current === selectedModelId && moduleRef.current) {
            console.log('[BackgroundModelLoader] Model already loaded, skipping:', selectedModelId);
            // Ensure state reflects the loaded model
            setReady(true);
            setLoading(false);
            return;
        }

        console.log('[BackgroundModelLoader] Skip check failed, will load. Reason:',
            !moduleRef.current ? 'moduleRef is null' :
                loadedModelIdRef.current !== selectedModelId ? `ID mismatch: loaded=${loadedModelIdRef.current} vs selected=${selectedModelId}` :
                    'unknown');

        // Look up the downloaded model to get local file paths
        const downloadedModel = getDownloadedModel(selectedModelId);
        if (!downloadedModel) {
            setError(`Model not downloaded: ${selectedModelId}. Please download it first from Models screen.`);
            return;
        }

        console.log('[BackgroundModelLoader] Loading model from local files:', selectedModelId);
        console.log('[BackgroundModelLoader] Model path:', downloadedModel.modelFilePath);
        console.log('[BackgroundModelLoader] Tokenizer path:', downloadedModel.tokenizerFilePath);

        // Load the model
        const loadModel = async () => {
            try {
                // If there's an existing model loaded and it's different, clean it up first
                if (moduleRef.current && loadedModelIdRef.current && loadedModelIdRef.current !== selectedModelId) {
                    console.log('[BackgroundModelLoader] Cleaning up previous model:', loadedModelIdRef.current);
                    try {
                        // Interrupt any ongoing generation
                        moduleRef.current.interrupt?.();
                        // Delete the old model to free memory
                        await moduleRef.current.delete?.();
                    } catch (cleanupErr) {
                        console.warn('[BackgroundModelLoader] Cleanup error (continuing):', cleanupErr);
                    }
                    moduleRef.current = null;
                    loadedModelIdRef.current = null;
                }

                setLoading(true);

                // Create LLMModule with tokenCallback and messageHistoryCallback
                const llmModule = new LLMModule({
                    tokenCallback: (token: string) => {
                        // Use getState() for fresh store access
                        const tokenCount = llmModule.getGeneratedTokenCount();
                        useLocalLLMStore.getState().appendToken(token, tokenCount);
                    },
                    messageHistoryCallback: (messages) => {
                        // Called when model finishes generation
                        console.log('[BackgroundModelLoader] Generation complete');
                        useLocalLLMStore.getState().setGenerating(false);
                    },
                });

                // Load using local file paths from downloaded model
                await llmModule.load(
                    {
                        modelSource: downloadedModel.modelFilePath,
                        tokenizerSource: downloadedModel.tokenizerFilePath,
                        tokenizerConfigSource: downloadedModel.tokenizerConfigFilePath,
                    },
                    (progress: number) => {
                        useLocalLLMStore.getState().setDownloadProgress(progress);
                    }
                );

                console.log('[BackgroundModelLoader] Model loaded successfully');

                // Apply generation config from ExecuTorch provider configuration
                const executorchConfig = useLLMStore.getState().getConfigById('executorch-default');
                if (executorchConfig?.executorchConfig) {
                    const genConfig = executorchConfig.executorchConfig;
                    console.log('[BackgroundModelLoader] Applying generation config:', genConfig);

                    // Build generationConfig object with only defined values
                    const generationConfig: {
                        temperature?: number;
                        topp?: number;
                        outputTokenBatchSize?: number;
                        batchTimeInterval?: number;
                    } = {};

                    if (genConfig.temperature !== undefined) generationConfig.temperature = genConfig.temperature;
                    if (genConfig.topp !== undefined) generationConfig.topp = genConfig.topp;
                    if (genConfig.outputTokenBatchSize !== undefined) generationConfig.outputTokenBatchSize = genConfig.outputTokenBatchSize;
                    if (genConfig.batchTimeInterval !== undefined) generationConfig.batchTimeInterval = genConfig.batchTimeInterval;

                    if (Object.keys(generationConfig).length > 0) {
                        llmModule.configure({ generationConfig });
                        console.log('[BackgroundModelLoader] Generation config applied');
                    }
                }

                moduleRef.current = llmModule;
                loadedModelIdRef.current = selectedModelId;
                setLLMModule(llmModule);
                setReady(true);
            } catch (err) {
                console.error('[BackgroundModelLoader] Load error:', err);
                setError(err instanceof Error ? err.message : String(err));
            }
        };

        loadModel();

        // Cleanup when component unmounts
        return () => {
            // Don't cleanup on every re-render, only when truly unmounting
            // The cleanup of old models is now handled inside loadModel
        };
    }, [selectedModelId, setLLMModule, setLoading, setReady, setDownloadProgress, setError, appendToken, setGenerating]);

    return null;
}
