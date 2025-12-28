/**
 * Model Download Store
 * Manages download state and coordinates with the download service
 */

import { create } from 'zustand';
import { ExecutorchModel } from '../config/executorchModels';
import { downloadedModelRepository } from '../core/storage';
import { DownloadedModel } from '../core/types';
import {
    cancelDownload as cancelDownloadService,
    deleteDownloadedModel as deleteDownloadedModelService,
    reattachBackgroundDownloads,
    setDownloadCallbacks,
    startDownload as startDownloadService
} from '../services/ModelDownloadService';

interface ActiveDownload {
    modelId: string;
    name: string;
    progress: number;
}

interface ModelDownloadState {
    // Currently downloading models
    activeDownloads: ActiveDownload[];

    // All downloaded models from repository
    downloadedModels: DownloadedModel[];

    // Loading state
    isLoading: boolean;

    // Actions
    loadDownloadedModels: () => Promise<void>;
    startDownload: (model: ExecutorchModel) => Promise<void>;
    cancelDownload: (modelId: string) => Promise<void>;
    isDownloading: (modelId: string) => boolean;
    isDownloaded: (modelId: string) => boolean;
    getDownloadProgress: (modelId: string) => number;
    getDownloadedModel: (modelId: string) => DownloadedModel | undefined;
    deleteDownloadedModel: (modelId: string) => Promise<void>;
}

export const useModelDownloadStore = create<ModelDownloadState>((set, get) => {
    // Set up callbacks for the download service
    setDownloadCallbacks(
        // onProgress
        (modelId: string, progress: number) => {
            set((state) => ({
                activeDownloads: state.activeDownloads.map((d) =>
                    d.modelId === modelId ? { ...d, progress } : d
                ),
            }));
        },
        // onComplete
        (modelId: string, model: DownloadedModel) => {
            set((state) => ({
                activeDownloads: state.activeDownloads.filter((d) => d.modelId !== modelId),
                downloadedModels: [...state.downloadedModels, model],
            }));
        },
        // onError
        (modelId: string, _error: string) => {
            set((state) => ({
                activeDownloads: state.activeDownloads.filter((d) => d.modelId !== modelId),
            }));
        }
    );

    return {
        activeDownloads: [],
        downloadedModels: [],
        isLoading: false,

        loadDownloadedModels: async () => {
            set({ isLoading: true });
            try {
                // Reattach to any background downloads that may have been running
                await reattachBackgroundDownloads();

                // Load completed downloads from repository
                const models = await downloadedModelRepository.getAll();
                // Filter to only completed downloads
                const completedModels = models.filter((m) => m.status === 'completed');
                set({ downloadedModels: completedModels, isLoading: false });
            } catch (error) {
                console.error('[ModelDownloadStore] Failed to load downloaded models:', error);
                set({ isLoading: false });
            }
        },

        startDownload: async (model: ExecutorchModel) => {
            const { activeDownloads } = get();

            // Check if already downloading
            if (activeDownloads.some((d) => d.modelId === model.id)) {
                console.log('[ModelDownloadStore] Model already downloading:', model.id);
                return;
            }

            // Check if already downloaded
            if (get().isDownloaded(model.id)) {
                console.log('[ModelDownloadStore] Model already downloaded:', model.id);
                return;
            }

            // Add to active downloads
            set((state) => ({
                activeDownloads: [
                    ...state.activeDownloads,
                    { modelId: model.id, name: model.name, progress: 0 },
                ],
            }));

            // Start the download
            try {
                await startDownloadService(model);
            } catch (error) {
                // Remove from active downloads on error
                set((state) => ({
                    activeDownloads: state.activeDownloads.filter((d) => d.modelId !== model.id),
                }));
                throw error;
            }
        },

        cancelDownload: async (modelId: string) => {
            await cancelDownloadService(modelId);
            set((state) => ({
                activeDownloads: state.activeDownloads.filter((d) => d.modelId !== modelId),
            }));
        },

        isDownloading: (modelId: string) => {
            return get().activeDownloads.some((d) => d.modelId === modelId);
        },

        isDownloaded: (modelId: string) => {
            return get().downloadedModels.some((m) => m.modelId === modelId);
        },

        getDownloadProgress: (modelId: string) => {
            const download = get().activeDownloads.find((d) => d.modelId === modelId);
            return download?.progress ?? 0;
        },

        getDownloadedModel: (modelId: string) => {
            return get().downloadedModels.find((m) => m.modelId === modelId);
        },

        deleteDownloadedModel: async (modelId: string) => {
            const model = get().getDownloadedModel(modelId);
            if (model) {
                // Delete files and from repository using the service
                await deleteDownloadedModelService(modelId);

                // Update state
                set((state) => ({
                    downloadedModels: state.downloadedModels.filter((m) => m.modelId !== modelId),
                }));
            }
        },
    };
});
