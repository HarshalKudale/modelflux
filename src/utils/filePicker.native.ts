/**
 * Native platform file picker implementation using @react-native-documents/picker
 */
import { pick } from '@react-native-documents/picker';
import type { FilePickerType, PickedFile } from './filePicker';

export async function pickFile(type: FilePickerType): Promise<PickedFile | null> {
    try {
        const [result] = await pick({ mode: 'open', requestLongTermAccess: true });
        console.log('[FilePicker] Picked file:', result);

        if (result?.uri) {
            const uri = result.uri;
            const name = result.name || uri.split('/').pop() || '';
            return { uri, name };
        }
        return null;
    } catch (error) {
        // User cancelled or error
        if ((error as Error).message?.includes('cancel')) {
            console.log('[FilePicker] User cancelled file picker');
        } else {
            console.error('[FilePicker] Error picking file:', error);
        }
        return null;
    }
}

// Re-export types
export type { FilePickerType, PickedFile };
