/**
 * ExecuTorch Models Configuration - Web Stub
 * 
 * Empty stub for web platform where react-native-executorch is not available.
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

/**
 * Empty array on web - ExecuTorch not supported
 */
export const EXECUTORCH_MODELS: ExecutorchModel[] = [];
