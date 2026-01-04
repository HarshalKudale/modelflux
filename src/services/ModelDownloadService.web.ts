/**
 * Model Download Service - Web Stub
 * Web platform doesn't support background downloads or notifications
 */

import { DownloadableModel } from '../config/downloadableModels';
import { DownloadedModel } from '../core/types';

type ProgressCallback = (modelId: string, progress: number) => void;
type CompletionCallback = (modelId: string, model: DownloadedModel) => void;
type ErrorCallback = (modelId: string, error: string) => void;

export function setDownloadCallbacks(
    _onProgress: ProgressCallback,
    _onComplete: CompletionCallback,
    _onError: ErrorCallback
) {
    // No-op on web
}

export function clearDownloadCallbacks() {
    // No-op on web
}

export async function startDownload(_model: DownloadableModel): Promise<void> {
    throw new Error('Model downloads are not supported on web. Please use the mobile app.');
}

export async function cancelDownload(_modelId: string): Promise<void> {
    // No-op on web
}

export function isDownloading(_modelId: string): boolean {
    return false;
}

export function getActiveDownloadIds(): string[] {
    return [];
}

export function getQueuePosition(_modelId: string): number {
    return -1;
}

export async function reattachBackgroundDownloads(): Promise<void> {
    // No-op on web
}

export async function deleteDownloadedModel(_modelId: string): Promise<void> {
    throw new Error('Model deletion is not supported on web. Please use the mobile app.');
}

export async function importLocalModel(
    _name: string,
    _description: string,
    _provider: 'executorch' | 'llama-cpp',
    _type: 'llm' | 'embedding' | 'image-gen' | 'tts' | 'stt',
    _modelFilePath: string,
    _tokenizerFilePath: string,
    _tokenizerConfigFilePath?: string
): Promise<DownloadedModel> {
    throw new Error('Local model import is not supported on web. Please use the mobile app.');
}
