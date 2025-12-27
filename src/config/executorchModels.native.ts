/**
 * ExecuTorch Models Configuration - Native
 * 
 * Exports the built-in model constants from react-native-executorch.
 * Models are hosted by Software Mansion on Hugging Face and downloaded on first use.
 */

// Import model constants from react-native-executorch
import {
    // LLaMA 3.2 models
    LLAMA3_2_1B,
    LLAMA3_2_1B_QLORA,
    LLAMA3_2_1B_SPINQUANT,
    LLAMA3_2_3B,
    LLAMA3_2_3B_SPINQUANT,
    // Qwen models
    QWEN3_0_6B,
    QWEN3_1_7B,
    // SmolLM models (note the naming convention)
    SMOLLM2_1_135M,
    SMOLLM2_1_360M,
} from 'react-native-executorch';

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
 * Built-in ExecuTorch models with pre-configured URLs
 */
export const EXECUTORCH_MODELS: ExecutorchModel[] = [
    // LLaMA 3.2 models
    {
        id: 'llama3-2-1b-spinquant',
        name: 'LLaMA 3.2 1B SpinQuant',
        description: '1B model with SpinQuant quantization (recommended)',
        modelSource: LLAMA3_2_1B_SPINQUANT.modelSource,
        tokenizerSource: LLAMA3_2_1B_SPINQUANT.tokenizerSource,
        tokenizerConfigSource: LLAMA3_2_1B_SPINQUANT.tokenizerConfigSource,
        sizeEstimate: '~1.3 GB',
        category: 'llama',
    },
    {
        id: 'llama3-2-1b-qlora',
        name: 'LLaMA 3.2 1B QLoRA',
        description: '1B model with QLoRA quantization',
        modelSource: LLAMA3_2_1B_QLORA.modelSource,
        tokenizerSource: LLAMA3_2_1B_QLORA.tokenizerSource,
        tokenizerConfigSource: LLAMA3_2_1B_QLORA.tokenizerConfigSource,
        sizeEstimate: '~1.3 GB',
        category: 'llama',
    },
    {
        id: 'llama3-2-1b',
        name: 'LLaMA 3.2 1B',
        description: 'Full precision 1B model',
        modelSource: LLAMA3_2_1B.modelSource,
        tokenizerSource: LLAMA3_2_1B.tokenizerSource,
        tokenizerConfigSource: LLAMA3_2_1B.tokenizerConfigSource,
        sizeEstimate: '~2.5 GB',
        category: 'llama',
    },
    {
        id: 'llama3-2-3b-spinquant',
        name: 'LLaMA 3.2 3B SpinQuant',
        description: '3B model with SpinQuant quantization',
        modelSource: LLAMA3_2_3B_SPINQUANT.modelSource,
        tokenizerSource: LLAMA3_2_3B_SPINQUANT.tokenizerSource,
        tokenizerConfigSource: LLAMA3_2_3B_SPINQUANT.tokenizerConfigSource,
        sizeEstimate: '~3.2 GB',
        category: 'llama',
    },
    {
        id: 'llama3-2-3b',
        name: 'LLaMA 3.2 3B',
        description: 'Full precision 3B model',
        modelSource: LLAMA3_2_3B.modelSource,
        tokenizerSource: LLAMA3_2_3B.tokenizerSource,
        tokenizerConfigSource: LLAMA3_2_3B.tokenizerConfigSource,
        sizeEstimate: '~6.5 GB',
        category: 'llama',
    },
    // Qwen models
    {
        id: 'qwen3-0-6b',
        name: 'Qwen 3 0.6B',
        description: 'Lightweight Qwen 3 model',
        modelSource: QWEN3_0_6B.modelSource,
        tokenizerSource: QWEN3_0_6B.tokenizerSource,
        tokenizerConfigSource: QWEN3_0_6B.tokenizerConfigSource,
        sizeEstimate: '~0.8 GB',
        category: 'qwen',
    },
    {
        id: 'qwen3-1-7b',
        name: 'Qwen 3 1.7B',
        description: 'Larger Qwen 3 model',
        modelSource: QWEN3_1_7B.modelSource,
        tokenizerSource: QWEN3_1_7B.tokenizerSource,
        tokenizerConfigSource: QWEN3_1_7B.tokenizerConfigSource,
        sizeEstimate: '~2.0 GB',
        category: 'qwen',
    },
    // SmolLM models
    {
        id: 'smollm2-1-135m',
        name: 'SmolLM 2.1 135M',
        description: 'Ultra-lightweight model for simple tasks',
        modelSource: SMOLLM2_1_135M.modelSource,
        tokenizerSource: SMOLLM2_1_135M.tokenizerSource,
        tokenizerConfigSource: SMOLLM2_1_135M.tokenizerConfigSource,
        sizeEstimate: '~150 MB',
        category: 'smollm',
    },
    {
        id: 'smollm2-1-360m',
        name: 'SmolLM 2.1 360M',
        description: 'Small but capable model',
        modelSource: SMOLLM2_1_360M.modelSource,
        tokenizerSource: SMOLLM2_1_360M.tokenizerSource,
        tokenizerConfigSource: SMOLLM2_1_360M.tokenizerConfigSource,
        sizeEstimate: '~400 MB',
        category: 'smollm',
    },
];
