/**
 * Model Download Service - Native
 * Handles downloading ExecutorCh models with progress tracking, notifications, and queue support
 * Uses expo-file-system legacy API (createDownloadResumable) for downloads with progress
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ExecutorchModel } from '../config/executorchModels';
import { downloadedModelRepository } from '../core/storage';
import { DownloadedModel } from '../core/types';

// Notification channel for Android
const DOWNLOAD_CHANNEL_ID = 'model-downloads';

// Download queue - models waiting to be downloaded
interface QueuedDownload {
    model: ExecutorchModel;
    addedAt: number;
}
const downloadQueue: QueuedDownload[] = [];

// Currently active download
let currentDownload: {
    modelId: string;
    cancelled: boolean;
    downloadResumable: FileSystem.DownloadResumable | null;
} | null = null;

// Progress callbacks
type ProgressCallback = (modelId: string, progress: number) => void;
type CompletionCallback = (modelId: string, model: DownloadedModel) => void;
type ErrorCallback = (modelId: string, error: string) => void;

let progressCallback: ProgressCallback | null = null;
let completionCallback: CompletionCallback | null = null;
let errorCallback: ErrorCallback | null = null;
let hasRequestedNotificationPermission = false;

/**
 * Set callbacks for download events
 */
export function setDownloadCallbacks(
    onProgress: ProgressCallback,
    onComplete: CompletionCallback,
    onError: ErrorCallback
) {
    progressCallback = onProgress;
    completionCallback = onComplete;
    errorCallback = onError;
}

/**
 * Clear download callbacks
 */
export function clearDownloadCallbacks() {
    progressCallback = null;
    completionCallback = null;
    errorCallback = null;
}

/**
 * Request notification permissions if not already done
 */
async function ensureNotificationPermissions(): Promise<boolean> {
    if (hasRequestedNotificationPermission) {
        const { status } = await Notifications.getPermissionsAsync();
        return status === 'granted';
    }

    hasRequestedNotificationPermission = true;

    // Configure notification handler
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: false,
            shouldPlaySound: false,
            shouldSetBadge: false,
            shouldShowInForeground: true,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });

    // Create Android notification channel
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(DOWNLOAD_CHANNEL_ID, {
            name: 'Model Downloads',
            importance: Notifications.AndroidImportance.LOW,
            vibrationPattern: [0],
            lightColor: '#4A90D9',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') {
        return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
}

/**
 * Show or update download notification
 */
async function showDownloadNotification(
    modelId: string,
    modelName: string,
    progress: number,
    isComplete: boolean = false,
    isFailed: boolean = false,
    isCancelled: boolean = false
) {
    const hasPermission = await ensureNotificationPermissions();
    if (!hasPermission) return;

    let title = 'Downloading Model';
    let body = `${modelName}: ${progress}%`;

    if (isComplete) {
        title = 'Download Complete';
        body = `${modelName} is ready to use`;
    } else if (isFailed) {
        title = 'Download Failed';
        body = `Failed to download ${modelName}`;
    } else if (isCancelled) {
        title = 'Download Cancelled';
        body = `${modelName} download was cancelled`;
    }

    await Notifications.scheduleNotificationAsync({
        identifier: `download-${modelId}`,
        content: {
            title,
            body,
            data: { modelId },
            ...(Platform.OS === 'android' && { channelId: DOWNLOAD_CHANNEL_ID }),
        },
        trigger: null,
    });
}

/**
 * Dismiss download notification
 */
async function dismissDownloadNotification(modelId: string) {
    await Notifications.dismissNotificationAsync(`download-${modelId}`);
}

/**
 * Get the models directory path (in documents)
 */
function getModelsDirPath(): string {
    return `${FileSystem.documentDirectory}models/`;
}

/**
 * Get the directory path for a specific model
 */
function getModelDirPath(modelId: string): string {
    return `${getModelsDirPath()}${modelId}/`;
}

/**
 * Ensure the models directory exists
 */
async function ensureModelsDir(): Promise<void> {
    const modelsDirPath = getModelsDirPath();
    const dirInfo = await FileSystem.getInfoAsync(modelsDirPath);
    if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(modelsDirPath, { intermediates: true });
        console.log(`[ModelDownload] Created models directory: ${modelsDirPath}`);
    }
}

/**
 * Ensure a specific model directory exists
 */
async function ensureModelDir(modelId: string): Promise<string> {
    const modelDirPath = getModelDirPath(modelId);
    const dirInfo = await FileSystem.getInfoAsync(modelDirPath);
    if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(modelDirPath, { intermediates: true });
        console.log(`[ModelDownload] Created model directory: ${modelDirPath}`);
    }
    return modelDirPath;
}

/**
 * Get filename from URL
 */
function getFileNameFromUrl(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 1] || 'file';
}



/**
 * Download a single file using FileSystem.createDownloadResumable
 * Returns the file URI and size, with real-time progress via callback
 */
async function downloadFileWithProgress(
    url: string,
    destinationPath: string,
    onProgress: (bytesWritten: number, totalBytes: number) => void
): Promise<{ uri: string; size: number }> {
    console.log(`[ModelDownload] Downloading from ${url} to ${destinationPath}`);

    return new Promise((resolve, reject) => {
        const downloadResumable = FileSystem.createDownloadResumable(
            url,
            destinationPath,
            {},
            (progress) => {
                // Log output.size during download as requested
                console.log(`[ModelDownload] output.size: ${progress.totalBytesWritten}`);
                onProgress(progress.totalBytesWritten, progress.totalBytesExpectedToWrite);
            }
        );

        // Store reference for potential cancellation
        if (currentDownload) {
            currentDownload.downloadResumable = downloadResumable;
        }

        downloadResumable.downloadAsync()
            .then((result) => {
                if (!result || !result.uri) {
                    reject(new Error('Download failed - no result returned'));
                    return;
                }

                console.log(`[ModelDownload] Downloaded ${result.uri}`);

                // Get file info to get size
                FileSystem.getInfoAsync(result.uri)
                    .then((info) => {
                        const size = info.exists && 'size' in info ? info.size : 0;
                        console.log(`[ModelDownload] File size: ${size} bytes`);
                        resolve({ uri: result.uri, size });
                    })
                    .catch((err) => {
                        console.warn(`[ModelDownload] Could not get file info:`, err);
                        resolve({ uri: result.uri, size: 0 });
                    });
            })
            .catch((error) => {
                console.error(`[ModelDownload] Error downloading ${url}:`, error);
                reject(error);
            });
    });
}

/**
 * Process the next item in the download queue
 */
async function processQueue(): Promise<void> {
    // If there's already an active download, don't start another
    if (currentDownload) {
        console.log('[ModelDownload] Download in progress, queue item will wait');
        return;
    }

    // Get the next item from queue
    const nextItem = downloadQueue.shift();
    if (!nextItem) {
        console.log('[ModelDownload] Queue is empty');
        return;
    }

    // Start downloading this model
    await executeDownload(nextItem.model);
}

/**
 * Execute the actual download of a model's files
 */
async function executeDownload(model: ExecutorchModel): Promise<void> {
    const modelId = model.id;

    // Set current download
    currentDownload = { modelId, cancelled: false, downloadResumable: null };

    console.log(`[ModelDownload] Starting download for ${model.name}`);

    try {
        // Request notification permission
        await ensureNotificationPermissions();

        // Ensure directories exist
        await ensureModelsDir();
        const modelDirPath = await ensureModelDir(modelId);

        // File definitions with filenames
        const files = [
            { url: model.modelSource, filename: getFileNameFromUrl(model.modelSource), weight: 80 },
            { url: model.tokenizerSource, filename: getFileNameFromUrl(model.tokenizerSource), weight: 10 },
            { url: model.tokenizerConfigSource, filename: getFileNameFromUrl(model.tokenizerConfigSource), weight: 10 },
        ];

        // Show initial notification
        await showDownloadNotification(modelId, model.name, 0);
        progressCallback?.(modelId, 0);

        let completedWeight = 0;
        const downloadedFiles: { uri: string; size: number }[] = [];

        // Download each file
        for (const file of files) {
            // Check if cancelled
            if (currentDownload?.cancelled) {
                throw new Error('Download cancelled');
            }

            const destinationPath = `${modelDirPath}${file.filename}`;
            const baseWeight = completedWeight;
            let lastNotifiedProgress = completedWeight;

            // Download the file with progress
            const result = await downloadFileWithProgress(
                file.url,
                destinationPath,
                (bytesWritten, totalBytes) => {
                    // Calculate progress within this file's weight
                    const fileProgress = totalBytes > 0 ? (bytesWritten / totalBytes) : 0;
                    const totalProgress = baseWeight + (fileProgress * file.weight);
                    const roundedProgress = Math.round(totalProgress);

                    progressCallback?.(modelId, roundedProgress);

                    // Update notification every 5% progress
                    if (roundedProgress - lastNotifiedProgress >= 5) {
                        lastNotifiedProgress = roundedProgress;
                        showDownloadNotification(modelId, model.name, roundedProgress);
                    }
                }
            );
            downloadedFiles.push(result);

            // Update completed weight
            completedWeight += file.weight;
            progressCallback?.(modelId, completedWeight);
            await showDownloadNotification(modelId, model.name, completedWeight);
        }

        // Calculate total size
        const totalSize = downloadedFiles.reduce((sum, f) => sum + f.size, 0);

        // Create downloaded model record
        const downloadedModel = await downloadedModelRepository.create({
            modelId: model.id,
            name: model.name,
            description: model.description,
            tags: ['executorch'],
            localPath: modelDirPath,
            modelFilePath: downloadedFiles[0].uri,
            tokenizerFilePath: downloadedFiles[1].uri,
            tokenizerConfigFilePath: downloadedFiles[2].uri,
            sizeEstimate: model.sizeEstimate,
            downloadedSize: totalSize,
            status: 'completed',
            progress: 100,
            downloadedAt: Date.now(),
        });

        // Clear current download
        currentDownload = null;

        // Show completion notification
        await showDownloadNotification(modelId, model.name, 100, true);

        // Notify callback
        completionCallback?.(modelId, downloadedModel);

        console.log(`[ModelDownload] Download complete for ${model.name}`);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const isCancelled = errorMessage === 'Download cancelled';

        console.error(`[ModelDownload] Error downloading ${model.name}:`, errorMessage);

        // Clear current download
        currentDownload = null;

        // Clean up partial downloads
        await cleanupDownload(modelId);

        if (isCancelled) {
            await showDownloadNotification(modelId, model.name, 0, false, false, true);
        } else {
            await showDownloadNotification(modelId, model.name, 0, false, true, false);
            errorCallback?.(modelId, errorMessage);
        }
    }

    // Process next item in queue
    processQueue();
}

/**
 * Start downloading a model (adds to queue if another download is in progress)
 */
export async function startDownload(model: ExecutorchModel): Promise<void> {
    const modelId = model.id;

    // Check if already downloading
    if (currentDownload?.modelId === modelId) {
        console.log(`[ModelDownload] ${model.name} is already downloading`);
        return;
    }

    // Check if already in queue
    if (downloadQueue.some(q => q.model.id === modelId)) {
        console.log(`[ModelDownload] ${model.name} is already in queue`);
        return;
    }

    // Add to queue
    downloadQueue.push({ model, addedAt: Date.now() });
    console.log(`[ModelDownload] Added ${model.name} to queue (queue size: ${downloadQueue.length})`);

    // Process queue
    await processQueue();
}

/**
 * Cancel an ongoing download or remove from queue
 */
export async function cancelDownload(modelId: string): Promise<void> {
    // Check if in queue and remove
    const queueIndex = downloadQueue.findIndex(q => q.model.id === modelId);
    if (queueIndex !== -1) {
        const removed = downloadQueue.splice(queueIndex, 1)[0];
        console.log(`[ModelDownload] Removed ${removed.model.name} from queue`);
        return;
    }

    // Check if actively downloading
    if (currentDownload?.modelId === modelId) {
        console.log(`[ModelDownload] Cancelling current download`);
        currentDownload.cancelled = true;

        // Actually abort the download by calling pauseAsync
        if (currentDownload.downloadResumable) {
            try {
                await currentDownload.downloadResumable.pauseAsync();
                console.log(`[ModelDownload] Download aborted via pauseAsync`);
            } catch (error) {
                console.warn(`[ModelDownload] Error pausing download:`, error);
            }
        }
    }

    // Clean up files
    await cleanupDownload(modelId);

    // Dismiss notification
    await dismissDownloadNotification(modelId);
}

/**
 * Clean up partial or cancelled downloads
 */
async function cleanupDownload(modelId: string): Promise<void> {
    try {
        const modelDirPath = getModelDirPath(modelId);
        const dirInfo = await FileSystem.getInfoAsync(modelDirPath);
        if (dirInfo.exists) {
            await FileSystem.deleteAsync(modelDirPath, { idempotent: true });
            console.log(`[ModelDownload] Deleted model directory: ${modelDirPath}`);
        }
    } catch (error) {
        console.error('[ModelDownload] Error cleaning up download:', error);
    }

    await downloadedModelRepository.deleteByModelId(modelId);
}

/**
 * Check if a model is currently downloading (active or queued)
 */
export function isDownloading(modelId: string): boolean {
    return currentDownload?.modelId === modelId || downloadQueue.some(q => q.model.id === modelId);
}

/**
 * Get all active download IDs (both active and queued)
 */
export function getActiveDownloadIds(): string[] {
    const ids: string[] = [];
    if (currentDownload) {
        ids.push(currentDownload.modelId);
    }
    ids.push(...downloadQueue.map(q => q.model.id));
    return ids;
}

/**
 * Get queue position for a model (0 if downloading, 1+ if in queue, -1 if not found)
 */
export function getQueuePosition(modelId: string): number {
    if (currentDownload?.modelId === modelId) {
        return 0;
    }
    const queueIndex = downloadQueue.findIndex(q => q.model.id === modelId);
    return queueIndex >= 0 ? queueIndex + 1 : -1;
}

/**
 * Re-attach to background downloads (no-op for expo/fetch approach)
 */
export async function reattachBackgroundDownloads(): Promise<void> {
    // expo/fetch doesn't support true background downloads
    // This is a no-op but kept for API compatibility
    console.log('[ModelDownload] reattachBackgroundDownloads called (no-op)');
}

/**
 * Delete a downloaded model and clean up files
 */
export async function deleteDownloadedModel(modelId: string): Promise<void> {
    console.log(`[ModelDownload] Deleting downloaded model: ${modelId}`);

    try {
        // Delete the model files from file system
        const modelDirPath = getModelDirPath(modelId);
        const dirInfo = await FileSystem.getInfoAsync(modelDirPath);
        if (dirInfo.exists) {
            await FileSystem.deleteAsync(modelDirPath, { idempotent: true });
            console.log(`[ModelDownload] Deleted model files: ${modelDirPath}`);
        }

        // Delete from database
        await downloadedModelRepository.deleteByModelId(modelId);
        console.log(`[ModelDownload] Deleted model from database: ${modelId}`);
    } catch (error) {
        console.error(`[ModelDownload] Error deleting model ${modelId}:`, error);
        throw error;
    }
}
