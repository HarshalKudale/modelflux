/**
 * Platform-agnostic file picker types and re-exports.
 * Platform-specific implementations are resolved by Metro bundler:
 * - filePicker.native.ts for iOS/Android
 * - filePicker.web.ts for web
 */

export type FilePickerType = 'model' | 'tokenizer' | 'tokenizerConfig';

export interface PickedFile {
    uri: string;
    name: string;
}

// Declare pickFile here so TypeScript knows about it, 
// but the actual implementation comes from platform-specific files
export declare function pickFile(type: FilePickerType): Promise<PickedFile | null>;
