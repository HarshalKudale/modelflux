/**
 * Downloadable Models Configuration - Web
 *
 * Web stub - Local model downloads are not supported on web platform.
 */

import { DownloadedModelProvider, DownloadedModelType } from '../core/types';

export interface ModelAssets {
    model: string;
    tokenizer?: string;
    tokenizerConfig?: string;
    mmproj?: string;
}

export interface DownloadableModel {
    id: string;
    name: string;
    description: string;
    provider: DownloadedModelProvider;
    type: DownloadedModelType;
    params: string;
    size: string;
    assets: ModelAssets;
}

// Empty array for web - local model downloads not supported
export const DOWNLOADABLE_MODELS: DownloadableModel[] = [];
