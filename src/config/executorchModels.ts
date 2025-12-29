/**
 * ExecuTorch Models Configuration
 * 
 * This is the base file that TypeScript resolves.
 * On native (iOS/Android), Metro bundles .native.ts instead.
 * On web, Metro bundles .web.ts instead.
 */

export interface ModelAssets {
    model: string;
    tokenizer: string;
    tokenizerConfig?: string; // Optional - not all models have this (e.g., embedding models)
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

// Empty array for TypeScript - actual values come from platform-specific files
export const EXECUTORCH_MODELS: ExecutorchModel[] = [];
