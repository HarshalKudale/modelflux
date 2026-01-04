/**
 * Web platform file picker implementation using standard File API
 */
import type { FilePickerType, PickedFile } from './filePicker';

function getAcceptedFileTypes(type: FilePickerType): string {
    switch (type) {
        case 'model':
            return '.pte,.gguf,.bin';
        case 'tokenizer':
        case 'tokenizerConfig':
            return '.json';
        default:
            return '*';
    }
}

export function pickFile(type: FilePickerType): Promise<PickedFile | null> {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = getAcceptedFileTypes(type);

        input.onchange = (event: Event) => {
            const target = event.target as HTMLInputElement;
            const file = target.files?.[0];

            if (file) {
                // Create a blob URL for the file
                const uri = URL.createObjectURL(file);
                const name = file.name;
                console.log('[FilePicker] Picked file:', { uri, name });
                resolve({ uri, name });
            } else {
                resolve(null);
            }
        };

        // Handle cancel (when no file is selected)
        input.oncancel = () => {
            console.log('[FilePicker] User cancelled file picker');
            resolve(null);
        };

        input.click();
    });
}

// Re-export types
export type { FilePickerType, PickedFile };
