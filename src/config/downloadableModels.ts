/**
 * Downloadable Models Configuration
 *
 * Defines models that can be downloaded for local on-device inference.
 * Supports both executorch (.pte) and llama-cpp (.gguf) models.
 *
 * This is the base file that TypeScript resolves.
 * On native (iOS/Android), Metro bundles .native.ts instead.
 * On web, Metro bundles .web.ts instead.
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

// Empty array for TypeScript - actual values come from platform-specific files
export const DOWNLOADABLE_MODELS: DownloadableModel[] = [];
