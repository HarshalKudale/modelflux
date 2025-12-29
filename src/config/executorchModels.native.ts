/**
 * ExecuTorch Models Configuration - Native
 * 
 * Loads models from the JSON config file.
 * Models are hosted by Software Mansion on Hugging Face and downloaded on first use.
 */

import modelsConfig from './models.json';

export interface ModelAssets {
    model: string;
    tokenizer: string;
    tokenizerConfig: string;
    mmproj?: string;
}

export interface ExecutorchModel {
    id: string;
    name: string;
    description: string;
    category: string;
    tags: string[];
    params: string;
    size: string;
    assets: ModelAssets;
}

/**
 * Built-in ExecuTorch models loaded from JSON config
 */
export const EXECUTORCH_MODELS: ExecutorchModel[] = modelsConfig.models;
