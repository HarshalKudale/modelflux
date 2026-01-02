/**
 * Downloadable Models Configuration - Native
 *
 * Loads models from the JSON config file.
 * Models are hosted on Hugging Face and downloaded on first use.
 */

import { DownloadedModelProvider, DownloadedModelType } from '../core/types';
import modelsConfig from './models.json';

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

/**
 * Built-in downloadable models loaded from JSON config
 */
export const DOWNLOADABLE_MODELS: DownloadableModel[] = modelsConfig.models as DownloadableModel[];
