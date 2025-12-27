import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../config/theme';
import { LocalModel, LocalModelFormat, generateId } from '../../../core/types';
import { useAppColorScheme } from '../../hooks';

interface LocalModelPickerProps {
    acceptedFormats: LocalModelFormat[];
    onModelSelected: (model: LocalModel) => void;
    disabled?: boolean;
}

/**
 * Get file extension from path
 */
function getFileExtension(path: string): string {
    const parts = path.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Get file name from path
 */
function getFileName(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1] || 'Unknown';
}

/**
 * Component for picking local model files
 */
export function LocalModelPicker({
    acceptedFormats,
    onModelSelected,
    disabled = false,
}: LocalModelPickerProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const [isLoading, setIsLoading] = useState(false);

    const formatHint = acceptedFormats.map(f => `.${f}`).join(', ');

    const handlePickFile = async () => {
        if (disabled || isLoading) return;

        setIsLoading(true);
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*', // Allow all types, we'll filter by extension
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) {
                setIsLoading(false);
                return;
            }

            const asset = result.assets[0];
            const extension = getFileExtension(asset.name || asset.uri);

            // Validate file extension
            if (!acceptedFormats.includes(extension as LocalModelFormat)) {
                setIsLoading(false);
                // Could show an error message here
                console.warn(`Invalid file format: .${extension}. Expected: ${formatHint}`);
                return;
            }

            // Get file info
            let fileSize = asset.size || 0;
            if (!fileSize && asset.uri) {
                try {
                    const fileInfo = await FileSystem.getInfoAsync(asset.uri);
                    if (fileInfo.exists && 'size' in fileInfo) {
                        fileSize = fileInfo.size || 0;
                    }
                } catch (e) {
                    console.warn('Could not get file size:', e);
                }
            }

            const model: LocalModel = {
                id: generateId(),
                name: asset.name || getFileName(asset.uri),
                filePath: asset.uri,
                fileSize,
                format: extension as LocalModelFormat,
                status: 'ready',
                addedAt: Date.now(),
            };

            onModelSelected(model);
        } catch (error) {
            console.error('Error picking model file:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[
                    styles.button,
                    {
                        backgroundColor: colors.tint,
                        opacity: disabled ? 0.5 : 1,
                    },
                ]}
                onPress={handlePickFile}
                disabled={disabled || isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                    <>
                        <Ionicons name="add" size={20} color="#FFFFFF" />
                        <Text style={styles.buttonText}>Add Model</Text>
                    </>
                )}
            </TouchableOpacity>
            <Text style={[styles.hint, { color: colors.textMuted }]}>
                Supported formats: {formatHint}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md,
        gap: Spacing.xs,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: FontSizes.md,
        fontWeight: '600',
    },
    hint: {
        fontSize: FontSizes.xs,
        marginTop: Spacing.xs,
        textAlign: 'center',
    },
});
