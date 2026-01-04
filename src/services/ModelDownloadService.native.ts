/**
 * Model Download Service - Native
 * Handles downloading local models with true background download support.
 * Uses @kesha-antonov/react-native-background-downloader for downloads that
 * continue even when app is closed or terminated by OS.
 */

import {
    completeHandler,
    createDownloadTask,
    DownloadTask,
    getExistingDownloadTasks
} from '@kesha-antonov/react-native-background-downloader';
import * as Notifications from 'expo-notifications';
import { PermissionsAndroid, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { DOWNLOADABLE_MODELS, DownloadableModel } from '../config/downloadableModels';
import { downloadedModelRepository } from '../core/storage';
import { DownloadedModel } from '../core/types';
import { logger } from './LoggerService.native';

// Notification channel for Android
const DOWNLOAD_CHANNEL_ID = 'model-downloads';

// File types for a model download (any asset key from model.assets)
type FileType = string;

// Metadata stored with each download task
interface DownloadMetadata {
    modelId: string;
    fileType: FileType;
    modelName: string;
    destinationDir: string;
}

// Track active downloads - maps modelId to its download tasks
const activeDownloads = new Map<string, {
    model: DownloadableModel;
    tasks: Map<FileType, DownloadTask>;
    completedFiles: Map<FileType, string>; // fileType -> filePath
    totalBytesExpected: number;
    bytesDownloaded: Map<FileType, number>;
    lastNotifiedProgress: number;
}>();

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
 * Get the models directory path (in public Downloads folder)
 */
function getModelsDirPath(): string {
    // Use public Downloads folder: /storage/emulated/0/Download/LLMHub/models
    return `${RNFS.DownloadDirectoryPath}/LLMHub/models`;
}

/**
 * Get the directory path for a specific model
 */
function getModelDirPath(modelId: string): string {
    return `${getModelsDirPath()}/${modelId}/`;
}

/**
 * Request storage permission for Android
 * On Android 10+ (SDK 29+), WRITE_EXTERNAL_STORAGE is no longer needed
 */
async function requestStoragePermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    // Android 10+ (SDK 29+) doesn't need WRITE_EXTERNAL_STORAGE for Downloads folder
    // The react-native-fs library handles this transparently
    const sdkVersion = Platform.Version;
    if (typeof sdkVersion === 'number' && sdkVersion >= 29) {
        logger.debug('ModelDownload', 'Android 10+, no storage permission needed');
        return true;
    }

    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
                title: 'Storage Permission',
                message: 'LLMHub needs storage access to save models to Downloads folder',
                buttonPositive: 'OK',
            }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
        logger.warn('ModelDownload', 'Permission request error:', err);
        return false;
    }
}

/**
 * Ensure the models directory exists
 */
async function ensureModelsDir(): Promise<void> {
    const modelsDirPath = getModelsDirPath();
    const exists = await RNFS.exists(modelsDirPath);
    if (!exists) {
        await RNFS.mkdir(modelsDirPath);
        logger.log('ModelDownload', 'Created models directory:', modelsDirPath);
    }
}

/**
 * Ensure a specific model directory exists
 */
async function ensureModelDir(modelId: string): Promise<string> {
    const modelDirPath = getModelDirPath(modelId);
    const exists = await RNFS.exists(modelDirPath);
    if (!exists) {
        await RNFS.mkdir(modelDirPath);
        logger.log('ModelDownload', 'Created model directory:', modelDirPath);
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
 * Generate a unique task ID for a file download
 */
function getTaskId(modelId: string, fileType: FileType): string {
    return `${modelId}-${fileType}`;
}

/**
 * Parse task ID to get modelId and fileType
 * Task IDs are formatted as: modelId-fileType
 * Since modelId can contain dashes, we take the last part as fileType
 */
function parseTaskId(taskId: string): { modelId: string; fileType: FileType } | null {
    const parts = taskId.split('-');
    if (parts.length < 2) return null;

    const fileType = parts.pop() as FileType;
    const modelId = parts.join('-');

    // Accept any file type (asset key)
    return { modelId, fileType };
}

/**
 * Calculate overall progress for a model download
 * Dynamically weights based on actual assets being downloaded
 */
function calculateProgress(modelId: string): number {
    const download = activeDownloads.get(modelId);
    if (!download) return 0;

    // Get all asset keys from the model
    const assetKeys = Object.keys(download.model.assets).filter(
        key => download.model.assets[key as keyof typeof download.model.assets]
    );

    if (assetKeys.length === 0) return 0;

    // Weight: model gets 80%, remaining assets split the other 20%
    const modelWeight = 80;
    const otherWeight = assetKeys.length > 1 ? 20 / (assetKeys.length - 1) : 0;

    let totalProgress = 0;

    // Add progress from completed files
    for (const [fileType] of download.completedFiles) {
        const weight = fileType === 'model' ? modelWeight : otherWeight;
        totalProgress += weight;
    }

    // Add progress from active downloads
    for (const [fileType, task] of download.tasks) {
        if (!download.completedFiles.has(fileType)) {
            const bytesDownloaded = download.bytesDownloaded.get(fileType) || 0;
            const bytesTotal = task.bytesTotal > 0 ? task.bytesTotal : 1;
            const fileProgress = bytesDownloaded / bytesTotal;
            const weight = fileType === 'model' ? modelWeight : otherWeight;
            totalProgress += fileProgress * weight;
        }
    }

    return Math.round(totalProgress);
}

/**
 * Handle completion of a single file download
 */
async function handleFileComplete(
    modelId: string,
    fileType: FileType,
    location: string,
    taskId: string
): Promise<void> {
    logger.log('ModelDownload', 'File complete:', fileType, 'for', modelId);

    const download = activeDownloads.get(modelId);
    if (!download) {
        logger.warn('ModelDownload', 'No active download found for', modelId);
        completeHandler(taskId);
        return;
    }

    // Ensure path starts with file://
    const finalLocation = location.startsWith('file://') ? location : `file://${location}`;

    // Mark file as complete
    download.completedFiles.set(fileType, finalLocation);
    download.tasks.delete(fileType);

    // Update progress
    const progress = calculateProgress(modelId);
    progressCallback?.(modelId, progress);
    await showDownloadNotification(modelId, download.model.name, progress);

    // Signal completion to OS
    completeHandler(taskId);

    // Check if all files are complete - dynamically get required files from assets
    const requiredFiles = Object.keys(download.model.assets).filter(
        key => download.model.assets[key as keyof typeof download.model.assets]
    );

    const allComplete = requiredFiles.every(ft => download.completedFiles.has(ft));

    if (allComplete) {
        await finalizeDownload(modelId);
    }
}

/**
 * Finalize a completed model download
 */
async function finalizeDownload(modelId: string): Promise<void> {
    const download = activeDownloads.get(modelId);
    if (!download) return;

    logger.log('ModelDownload', 'Finalizing download for', modelId);

    try {
        const rawModelDirPath = getModelDirPath(modelId);
        const modelDirPath = rawModelDirPath.startsWith('file://') ? rawModelDirPath : `file://${rawModelDirPath}`;

        // Calculate total size from download tracking
        let totalSize = 0;
        for (const [fileType] of download.completedFiles) {
            const bytesDownloaded = download.bytesDownloaded.get(fileType) || 0;
            totalSize += bytesDownloaded;
        }


        // Prepare downloaded model record
        const modelData = {
            modelId: download.model.id,
            name: download.model.name,
            description: download.model.description,
            provider: download.model.provider,
            type: download.model.type,
            tags: [],
            localPath: modelDirPath,
            modelFilePath: download.completedFiles.get('model') || '',
            tokenizerFilePath: download.completedFiles.get('tokenizer') || '',
            tokenizerConfigFilePath: download.completedFiles.get('tokenizerConfig') || '',
            sizeEstimate: download.model.size,
            downloadedSize: totalSize,
            status: 'completed' as const,
            progress: 100,
            downloadedAt: Date.now(),
        };

        console.log('[ModelDownload] Saving downloaded model:', JSON.stringify(modelData, null, 2));

        // Create downloaded model record
        const downloadedModel = await downloadedModelRepository.create(modelData);

        // Clean up tracking
        activeDownloads.delete(modelId);

        // Show completion notification
        await showDownloadNotification(modelId, download.model.name, 100, true);

        // Notify callback
        progressCallback?.(modelId, 100);
        completionCallback?.(modelId, downloadedModel);

        console.log(`[ModelDownload] Download complete for ${download.model.name}`);
    } catch (error) {
        console.error(`[ModelDownload] Error finalizing download: `, error);
        handleDownloadError(modelId, error instanceof Error ? error.message : 'Unknown error');
    }
}

/**
 * Handle download error
 */
async function handleDownloadError(modelId: string, errorMessage: string): Promise<void> {
    console.error(`[ModelDownload] Error for ${modelId}: `, errorMessage);

    const download = activeDownloads.get(modelId);
    const modelName = download?.model.name || modelId;

    // Stop all tasks for this model
    if (download) {
        for (const [, task] of download.tasks) {
            try {
                await task.stop();
            } catch (e) {
                // Ignore errors when stopping
            }
        }
    }

    // Clean up
    activeDownloads.delete(modelId);
    await cleanupDownload(modelId);
    await showDownloadNotification(modelId, modelName, 0, false, true, false);

    errorCallback?.(modelId, errorMessage);
}

/**
 * Start downloading a model
 */
export async function startDownload(model: DownloadableModel): Promise<void> {
    const modelId = model.id;

    // Check if already downloading
    if (activeDownloads.has(modelId)) {
        console.log(`[ModelDownload] ${model.name} is already downloading`);
        return;
    }

    console.log(`[ModelDownload] Starting download for ${model.name}`);

    try {
        // Request notification permission
        await ensureNotificationPermissions();

        // Request storage permission for Downloads folder access
        const hasStoragePermission = await requestStoragePermission();
        if (!hasStoragePermission) {
            throw new Error('Storage permission denied. Cannot download models.');
        }

        // Ensure directories exist
        await ensureModelsDir();
        const modelDirPath = await ensureModelDir(modelId);

        // Initialize tracking
        const downloadState = {
            model,
            tasks: new Map<FileType, DownloadTask>(),
            completedFiles: new Map<FileType, string>(),
            totalBytesExpected: 0,
            bytesDownloaded: new Map<FileType, number>(),
            lastNotifiedProgress: 0,
        };
        activeDownloads.set(modelId, downloadState);

        // Show initial notification
        await showDownloadNotification(modelId, model.name, 0);
        progressCallback?.(modelId, 0);

        // Define files to download - iterate over all assets dynamically
        // Only 'model' is required, all other assets are optional
        const files: { url: string; fileType: FileType; filename: string }[] = [];

        for (const [assetKey, assetUrl] of Object.entries(model.assets)) {
            if (assetUrl && typeof assetUrl === 'string') {
                files.push({
                    url: assetUrl,
                    fileType: assetKey as FileType,
                    filename: getFileNameFromUrl(assetUrl),
                });
            }
        }

        // Create and start download tasks
        for (const file of files) {
            const taskId = getTaskId(modelId, file.fileType);
            const destination = `${modelDirPath}${file.filename} `;

            const metadata: DownloadMetadata = {
                modelId,
                fileType: file.fileType,
                modelName: model.name,
                destinationDir: modelDirPath,
            };

            console.log(`[ModelDownload] Creating task ${taskId} for ${file.url}`);

            const task = createDownloadTask({
                id: taskId,
                url: file.url,
                destination,
                metadata,
            })
                .begin(({ expectedBytes }) => {
                    console.log(`[ModelDownload] ${file.fileType} begin: ${expectedBytes} bytes`);
                    const download = activeDownloads.get(modelId);
                    if (download) {
                        download.totalBytesExpected += expectedBytes;
                    }
                })
                .progress(({ bytesDownloaded, bytesTotal }) => {
                    const download = activeDownloads.get(modelId);
                    if (download) {
                        download.bytesDownloaded.set(file.fileType, bytesDownloaded);
                        const progress = calculateProgress(modelId);
                        progressCallback?.(modelId, progress);

                        // Update notification if progress changed significantly (e.g. 1%)
                        if (progress > download.lastNotifiedProgress && (progress - download.lastNotifiedProgress >= 1 || progress === 100)) {
                            download.lastNotifiedProgress = progress;
                            showDownloadNotification(modelId, model.name, progress);
                        }
                    }
                })
                .done(({ location }) => {
                    console.log(`[ModelDownload] ${file.fileType} done: ${location}`);
                    handleFileComplete(modelId, file.fileType, location, taskId);
                })
                .error(({ error }) => {
                    handleDownloadError(modelId, error);
                });

            downloadState.tasks.set(file.fileType, task);
            task.start();
        }

    } catch (error) {
        console.error(`[ModelDownload] Error starting download: `, error);
        activeDownloads.delete(modelId);
        errorCallback?.(modelId, error instanceof Error ? error.message : 'Unknown error');
    }
}

/**
 * Cancel an ongoing download
 */
export async function cancelDownload(modelId: string): Promise<void> {
    const download = activeDownloads.get(modelId);

    if (download) {
        console.log(`[ModelDownload] Cancelling download for ${modelId}`);

        // Stop all tasks
        for (const [fileType, task] of download.tasks) {
            try {
                await task.stop();
                completeHandler(getTaskId(modelId, fileType));
            } catch (e) {
                console.warn(`[ModelDownload] Error stopping task: `, e);
            }
        }

        activeDownloads.delete(modelId);
    }

    // Clean up files
    await cleanupDownload(modelId);
    await dismissDownloadNotification(modelId);
}

/**
 * Clean up partial or cancelled downloads
 */
async function cleanupDownload(modelId: string): Promise<void> {
    try {
        const modelDirPath = getModelDirPath(modelId);
        const exists = await RNFS.exists(modelDirPath);
        if (exists) {
            await RNFS.unlink(modelDirPath);
            console.log(`[ModelDownload] Deleted model directory: ${modelDirPath}`);
        }
    } catch (error) {
        console.error('[ModelDownload] Error cleaning up download:', error);
    }

    await downloadedModelRepository.deleteByModelId(modelId);
}

/**
 * Check if a model is currently downloading
 */
export function isDownloading(modelId: string): boolean {
    return activeDownloads.has(modelId);
}

/**
 * Get all active download IDs
 */
export function getActiveDownloadIds(): string[] {
    return Array.from(activeDownloads.keys());
}

/**
 * Get queue position for a model (0 if downloading, -1 if not found)
 * Note: With background downloads, there's no queue - all downloads run in parallel
 */
export function getQueuePosition(modelId: string): number {
    return activeDownloads.has(modelId) ? 0 : -1;
}

/**
 * Re-attach to background downloads that were running while app was closed
 * Call this on app startup!
 */
export async function reattachBackgroundDownloads(): Promise<void> {
    console.log('[ModelDownload] Checking for existing background downloads...');

    try {
        const existingTasks = await getExistingDownloadTasks();
        console.log(`[ModelDownload] Found ${existingTasks.length} existing tasks`);

        if (existingTasks.length === 0) return;

        // Group tasks by modelId
        const tasksByModel = new Map<string, DownloadTask[]>();

        for (const task of existingTasks) {
            const parsed = parseTaskId(task.id);
            if (!parsed) {
                console.warn(`[ModelDownload] Unknown task ID format: ${task.id} `);
                continue;
            }

            const { modelId } = parsed;
            if (!tasksByModel.has(modelId)) {
                tasksByModel.set(modelId, []);
            }
            tasksByModel.get(modelId)!.push(task);
        }

        // Re-attach to each model's downloads
        for (const [modelId, tasks] of tasksByModel) {
            // Find the model definition
            const model = DOWNLOADABLE_MODELS.find((m: DownloadableModel) => m.id === modelId);
            if (!model) {
                console.warn(`[ModelDownload] Model not found for ${modelId}, stopping tasks`);
                for (const task of tasks) {
                    await task.stop();
                    completeHandler(task.id);
                }
                continue;
            }

            // Initialize tracking if not already exists
            if (!activeDownloads.has(modelId)) {
                activeDownloads.set(modelId, {
                    model,
                    tasks: new Map(),
                    completedFiles: new Map(),
                    totalBytesExpected: 0,
                    bytesDownloaded: new Map(),
                    lastNotifiedProgress: 0,
                });
            }

            const download = activeDownloads.get(modelId)!;

            // Re-attach callbacks to each task
            for (const task of tasks) {
                const parsed = parseTaskId(task.id);
                if (!parsed) continue;

                const { fileType } = parsed;
                console.log(`[ModelDownload] Re - attaching to ${task.id}, state: ${task.state} `);

                download.tasks.set(fileType, task);
                download.bytesDownloaded.set(fileType, task.bytesDownloaded);

                task
                    .progress(({ bytesDownloaded }) => {
                        const dl = activeDownloads.get(modelId);
                        if (dl) {
                            dl.bytesDownloaded.set(fileType, bytesDownloaded);
                            const progress = calculateProgress(modelId);
                            progressCallback?.(modelId, progress);

                            // Update notification if progress changed significantly
                            if (progress > dl.lastNotifiedProgress && (progress - dl.lastNotifiedProgress >= 1 || progress === 100)) {
                                dl.lastNotifiedProgress = progress;
                                showDownloadNotification(modelId, dl.model.name, progress);
                            }
                        }
                    })
                    .done(({ location }) => {
                        handleFileComplete(modelId, fileType, location, task.id);
                    })
                    .error(({ error }) => {
                        handleDownloadError(modelId, error);
                    });
            }

            // Report current progress
            const progress = calculateProgress(modelId);
            progressCallback?.(modelId, progress);
        }

        console.log(`[ModelDownload] Re - attached to ${tasksByModel.size} model downloads`);
    } catch (error) {
        console.error('[ModelDownload] Error re-attaching to downloads:', error);
    }
}

/**
 * Delete a downloaded model and clean up files
 * Only deletes files if they are in the LLMHub folder (downloaded models)
 * Imported models are only removed from database, not deleted from disk
 */
export async function deleteDownloadedModel(modelId: string): Promise<void> {
    console.log(`[ModelDownload] Deleting downloaded model: ${modelId}`);

    try {
        // Get the model from database to check its path
        const model = await downloadedModelRepository.getByModelId(modelId);

        if (model) {
            // Only delete files if they are in the LLMHub folder (downloaded models)
            const isLLMHubModel = model.localPath?.includes('/LLMHub/');

            if (isLLMHubModel) {
                const modelDirPath = getModelDirPath(modelId);
                const exists = await RNFS.exists(modelDirPath);
                if (exists) {
                    await RNFS.unlink(modelDirPath);
                    console.log(`[ModelDownload] Deleted model files: ${modelDirPath}`);
                }
            } else {
                console.log(`[ModelDownload] Imported model, skipping file deletion: ${modelId}`);
            }
        }

        // Always delete from database
        await downloadedModelRepository.deleteByModelId(modelId);
        console.log(`[ModelDownload] Deleted model from database: ${modelId}`);
    } catch (error) {
        console.error(`[ModelDownload] Error deleting model ${modelId}:`, error);
        throw error;
    }
}

/**
 * Import a local model from user's storage
 */
export async function importLocalModel(
    name: string,
    description: string,
    provider: 'executorch' | 'llama-cpp',
    type: 'llm' | 'embedding' | 'image-gen' | 'tts' | 'stt',
    modelFilePath: string,
    tokenizerFilePath: string,
    tokenizerConfigFilePath?: string
): Promise<DownloadedModel> {
    console.log(`[ModelDownload] Importing local model: ${name}`);

    // Generate a unique model ID
    const modelId = `local-${Date.now()}`;

    // Get the directory from the model file path
    const localPath = modelFilePath.substring(0, modelFilePath.lastIndexOf('/'));

    // Create the downloaded model record
    const downloadedModel = await downloadedModelRepository.create({
        modelId,
        name,
        description,
        provider,
        type,
        tags: ['custom'], // Mark as user-imported
        localPath,
        modelFilePath,
        tokenizerFilePath,
        tokenizerConfigFilePath: tokenizerConfigFilePath || '',
        sizeEstimate: 'Unknown',
        downloadedSize: 0,
        status: 'completed',
        progress: 100,
        downloadedAt: Date.now(),
    });

    console.log(`[ModelDownload] Imported local model: ${name} (${modelId})`);
    return downloadedModel;
}
