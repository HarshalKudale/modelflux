/**
 * Provider Editor Components
 * 
 * Each editor component handles its own provider-specific configuration UI.
 */

export { AnthropicEditor } from './AnthropicEditor';
export { ExecuTorchEditor } from './ExecuTorchEditor';
export { LlamaCppEditor } from './LlamaCppEditor';
export { OllamaEditor } from './OllamaEditor';
export { OpenAIEditor } from './OpenAIEditor';

// Common props interface for all provider editors
export interface ProviderEditorProps {
    configId?: string;
    onBack: () => void;
}
