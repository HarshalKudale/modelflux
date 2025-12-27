/**
 * ExecuTorch Models Configuration
 * 
 * This is the base file that TypeScript resolves.
 * On native (iOS/Android), Metro bundles .native.ts instead.
 * On web, Metro bundles .web.ts instead.
 */

export interface ExecutorchModel {
    id: string;
    name: string;
    description: string;
    modelSource: string;
    tokenizerSource: string;
    tokenizerConfigSource: string;
    sizeEstimate: string;
    category: 'llama' | 'qwen' | 'smollm' | 'other';
}

// Empty array for TypeScript - actual values come from platform-specific files
export const EXECUTORCH_MODELS: ExecutorchModel[] = [];
