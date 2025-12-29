/**
 * ExecuTorch Models Configuration - Web
 * 
 * Web stub - ExecuTorch is not supported on web platform.
 */

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

// Empty array for web - ExecuTorch not supported
export const EXECUTORCH_MODELS: ExecutorchModel[] = [];
