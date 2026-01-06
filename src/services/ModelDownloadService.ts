/**
 * Model Download Service - Shared types and placeholder exports
 * Platform-specific implementations in ModelDownloadService.native.ts and ModelDownloadService.web.ts
 * 
 * At runtime, Metro/Expo will resolve the correct platform-specific file.
 * This file provides placeholder exports for TypeScript compatibility.
 */

import { DownloadableModel } from '../config/downloadableModels';
import { ModelType } from '../config/modelTypePresets';
import { DownloadedModel, DownloadedModelProvider } from '../core/types';

// Progress/completion callback types
export type ProgressCallback = (modelId: string, progress: number) => void;
export type CompletionCallback = (modelId: string, model: DownloadedModel) => void;
export type ErrorCallback = (modelId: string, error: string) => void;

/**
 * Placeholder exports for TypeScript compatibility.
 * At runtime, Metro/Expo will resolve the correct platform-specific file
 * (ModelDownloadService.native.ts or ModelDownloadService.web.ts).
 * 
 * These placeholders should never be called - if you see errors from here,
 * the bundler is not correctly resolving platform-specific files.
 */

const notImplementedError = () => {
    throw new Error('ModelDownloadService not initialized - platform resolution failed');
};

export function setDownloadCallbacks(
    _onProgress: ProgressCallback,
    _onComplete: CompletionCallback,
    _onError: ErrorCallback
): void {
    notImplementedError();
}

export function clearDownloadCallbacks(): void {
    notImplementedError();
}

export async function startDownload(_model: DownloadableModel): Promise<void> {
    notImplementedError();
}

export async function cancelDownload(_modelId: string): Promise<void> {
    notImplementedError();
}

export function isDownloading(_modelId: string): boolean {
    notImplementedError();
    return false;
}

export function getActiveDownloadIds(): string[] {
    notImplementedError();
    return [];
}

export function getQueuePosition(_modelId: string): number {
    notImplementedError();
    return -1;
}

export async function reattachBackgroundDownloads(): Promise<void> {
    notImplementedError();
}

export async function deleteDownloadedModel(_modelId: string): Promise<void> {
    notImplementedError();
}

export async function importLocalModel(
    _name: string,
    _description: string,
    _provider: DownloadedModelProvider,
    _type: ModelType,
    _modelFilePath: string,
    _tokenizerFilePath?: string,
    _tokenizerConfigFilePath?: string
): Promise<DownloadedModel> {
    notImplementedError();
    throw new Error('Not implemented');
}
