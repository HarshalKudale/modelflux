import { Ionicons } from '@expo/vector-icons';
import { pick } from '@react-native-documents/picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import RNFS from 'react-native-fs';
import { BorderRadius, Colors, FontSizes, Shadows, Spacing } from '../../../config/theme';
import { DownloadedModelType } from '../../../core/types';
import { useAppColorScheme, useLocale } from '../../hooks';

// Get the models directory path (same as ModelDownloadService)
function getModelsDirPath(): string {
    return `${RNFS.DownloadDirectoryPath}/LLMHub/models`;
}

// Copy a file to the LLMHub models directory
async function copyFileToModelsDir(sourceUri: string, modelId: string): Promise<string> {
    // Decode URI only for extracting the filename
    const decodedUri = decodeURIComponent(sourceUri);

    // Extract just the filename from the decoded path and trim whitespace
    const rawFilename = decodedUri.split('/').pop() || 'file';
    const filename = rawFilename.trim();

    // Create destination directory
    const destDir = `${getModelsDirPath()}/${modelId}`;
    const destExists = await RNFS.exists(destDir);
    if (!destExists) {
        await RNFS.mkdir(destDir);
    }

    const destPath = `${destDir}/${filename}`;

    // Check if destination file already exists
    const fileExists = await RNFS.exists(destPath);
    if (fileExists) {
        console.log(`[LocalModelImport] File already exists at ${destPath}, skipping copy`);
        return `file://${destPath}`;
    }

    console.log(`[LocalModelImport] Source URI: ${sourceUri}`);
    console.log(`[LocalModelImport] Extracted filename: ${filename}`);
    console.log(`[LocalModelImport] Copying to: ${destPath}`);

    // Pass the ORIGINAL URI to RNFS - it handles content:// URIs internally
    await RNFS.copyFile(sourceUri, destPath);

    return `file://${destPath}`;
}

interface LocalModelImportModalProps {
    visible: boolean;
    onClose: () => void;
    onImport: (
        name: string,
        description: string,
        provider: 'executorch',
        type: DownloadedModelType,
        modelPath: string,
        tokenizerPath: string,
        tokenizerConfigPath?: string
    ) => Promise<void>;
}

type Provider = 'executorch';

export function LocalModelImportModal({
    visible,
    onClose,
    onImport,
}: LocalModelImportModalProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const shadows = Shadows[colorScheme];
    const { t } = useLocale();

    // Form state
    const [provider, setProvider] = useState<Provider>('executorch');
    const [modelType, setModelType] = useState<DownloadedModelType>('llm');
    const [modelName, setModelName] = useState('');
    const [modelPath, setModelPath] = useState('');
    const [tokenizerPath, setTokenizerPath] = useState('');
    const [tokenizerConfigPath, setTokenizerConfigPath] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    // Provider options
    const providers: { value: Provider; label: string }[] = [
        { value: 'executorch', label: 'ExecuTorch' },
    ];

    // Model type options
    const modelTypes: { value: DownloadedModelType; label: string }[] = [
        { value: 'llm', label: 'LLM' },
        { value: 'embedding', label: 'Embedding' },
        { value: 'image-gen', label: 'Image Generation' },
        { value: 'tts', label: 'Text to Speech' },
        { value: 'stt', label: 'Speech to Text' },
    ];

    // Pick file using native documents picker
    const pickFile = async (type: 'model' | 'tokenizer' | 'tokenizerConfig') => {
        try {
            const [result] = await pick({ mode: 'open', requestLongTermAccess: true });
            console.log('[LocalModelImport] Picked file:', result);

            if (result?.uri) {
                // @react-native-documents/picker returns accessible file:// paths
                const uri = result.uri;
                const filename = result.name || uri.split('/').pop() || '';

                switch (type) {
                    case 'model':
                        setModelPath(uri);
                        // Auto-fill name from filename if empty
                        if (!modelName) {
                            setModelName(filename.replace(/\.[^/.]+$/, '')); // Remove extension
                        }
                        break;
                    case 'tokenizer':
                        setTokenizerPath(uri);
                        break;
                    case 'tokenizerConfig':
                        setTokenizerConfigPath(uri);
                        break;
                }
            }
        } catch (error) {
            // User cancelled or error
            if ((error as Error).message?.includes('cancel')) {
                console.log('[LocalModelImport] User cancelled file picker');
            } else {
                console.error('[LocalModelImport] Error picking file:', error);
            }
        }
    };

    // Get filename from path/uri
    const getFilename = (path: string): string => {
        if (!path) return '';
        return path.split('/').pop() || path;
    };

    // Handle import
    const handleImport = async () => {
        if (!modelName.trim() || !modelPath || !tokenizerPath) {
            return;
        }

        setIsImporting(true);
        try {
            // Generate a unique model ID for this import
            const modelId = `local-${Date.now()}`;

            // Copy files to LLMHub/models directory
            console.log('[LocalModelImport] Copying files to LLMHub/models directory...');

            const copiedModelPath = await copyFileToModelsDir(modelPath, modelId);
            const copiedTokenizerPath = await copyFileToModelsDir(tokenizerPath, modelId);
            let copiedTokenizerConfigPath: string | undefined;

            if (tokenizerConfigPath) {
                copiedTokenizerConfigPath = await copyFileToModelsDir(tokenizerConfigPath, modelId);
            }

            console.log('[LocalModelImport] Files copied successfully');
            console.log('[LocalModelImport] Model path:', copiedModelPath);
            console.log('[LocalModelImport] Tokenizer path:', copiedTokenizerPath);
            if (copiedTokenizerConfigPath) {
                console.log('[LocalModelImport] Tokenizer config path:', copiedTokenizerConfigPath);
            }

            await onImport(
                modelName.trim(),
                `Imported ${modelTypes.find(t => t.value === modelType)?.label} model`,
                provider,
                modelType,
                copiedModelPath,
                copiedTokenizerPath,
                copiedTokenizerConfigPath
            );
            // Reset form
            setModelName('');
            setModelPath('');
            setTokenizerPath('');
            setTokenizerConfigPath('');
            onClose();
        } catch (error) {
            console.error('Error importing model:', error);
        } finally {
            setIsImporting(false);
        }
    };

    // Check if form is valid
    const isFormValid = modelName.trim() && modelPath && tokenizerPath;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable
                style={[styles.overlay, { backgroundColor: colors.overlay }]}
                onPress={onClose}
            >
                <View
                    style={[styles.modal, { backgroundColor: colors.cardBackground }, shadows.lg]}
                    onStartShouldSetResponder={() => true}
                >
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.title, { color: colors.text }]}>
                            Import Local Model
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content}>
                        {/* Provider Selection */}
                        <View style={styles.fieldGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Provider</Text>
                            <View style={styles.chipRow}>
                                {providers.map((p) => (
                                    <TouchableOpacity
                                        key={p.value}
                                        style={[
                                            styles.chip,
                                            {
                                                backgroundColor:
                                                    provider === p.value
                                                        ? colors.tint
                                                        : colors.backgroundSecondary,
                                            },
                                        ]}
                                        onPress={() => setProvider(p.value)}
                                    >
                                        <Text
                                            style={[
                                                styles.chipText,
                                                { color: provider === p.value ? '#FFFFFF' : colors.text },
                                            ]}
                                        >
                                            {p.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Model Type Selection */}
                        <View style={styles.fieldGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Model Type</Text>
                            <View style={styles.chipRow}>
                                {modelTypes.map((mt) => (
                                    <TouchableOpacity
                                        key={mt.value}
                                        style={[
                                            styles.chip,
                                            {
                                                backgroundColor:
                                                    modelType === mt.value
                                                        ? colors.tint
                                                        : colors.backgroundSecondary,
                                            },
                                        ]}
                                        onPress={() => setModelType(mt.value)}
                                    >
                                        <Text
                                            style={[
                                                styles.chipText,
                                                { color: modelType === mt.value ? '#FFFFFF' : colors.text },
                                            ]}
                                        >
                                            {mt.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Model Name */}
                        <View style={styles.fieldGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Model Name</Text>
                            <TextInput
                                style={[
                                    styles.textInput,
                                    {
                                        backgroundColor: colors.backgroundSecondary,
                                        color: colors.text,
                                        borderColor: colors.border,
                                    },
                                ]}
                                value={modelName}
                                onChangeText={setModelName}
                                placeholder="Enter model name"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        {/* Model File */}
                        <View style={styles.fieldGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>
                                Model File <Text style={{ color: colors.error }}>*</Text>
                            </Text>
                            <View style={styles.filePickerRow}>
                                <View
                                    style={[
                                        styles.filePathContainer,
                                        { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
                                    ]}
                                >
                                    <Text
                                        style={[styles.filePath, { color: modelPath ? colors.text : colors.textMuted }]}
                                        numberOfLines={1}
                                    >
                                        {modelPath ? getFilename(modelPath) : 'Select model file (.pte)'}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.pickButton, { backgroundColor: colors.tint }]}
                                    onPress={() => pickFile('model')}
                                >
                                    <Ionicons name="add" size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Tokenizer File */}
                        <View style={styles.fieldGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>
                                Tokenizer File <Text style={{ color: colors.error }}>*</Text>
                            </Text>
                            <View style={styles.filePickerRow}>
                                <View
                                    style={[
                                        styles.filePathContainer,
                                        { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
                                    ]}
                                >
                                    <Text
                                        style={[styles.filePath, { color: tokenizerPath ? colors.text : colors.textMuted }]}
                                        numberOfLines={1}
                                    >
                                        {tokenizerPath ? getFilename(tokenizerPath) : 'Select tokenizer file (.json)'}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.pickButton, { backgroundColor: colors.tint }]}
                                    onPress={() => pickFile('tokenizer')}
                                >
                                    <Ionicons name="add" size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Tokenizer Config File */}
                        <View style={styles.fieldGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>
                                Tokenizer Config (optional)
                            </Text>
                            <View style={styles.filePickerRow}>
                                <View
                                    style={[
                                        styles.filePathContainer,
                                        { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.filePath,
                                            { color: tokenizerConfigPath ? colors.text : colors.textMuted },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {tokenizerConfigPath
                                            ? getFilename(tokenizerConfigPath)
                                            : 'Select config file (.json)'}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.pickButton, { backgroundColor: colors.tint }]}
                                    onPress={() => pickFile('tokenizerConfig')}
                                >
                                    <Ionicons name="add" size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={[styles.footer, { borderTopColor: colors.border }]}>
                        <TouchableOpacity
                            style={[styles.cancelButton, { borderColor: colors.border }]}
                            onPress={onClose}
                        >
                            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.importButton,
                                {
                                    backgroundColor: isFormValid ? colors.tint : colors.backgroundSecondary,
                                    opacity: isFormValid ? 1 : 0.5,
                                },
                            ]}
                            onPress={handleImport}
                            disabled={!isFormValid || isImporting}
                        >
                            {isImporting ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.importButtonText}>Import Model</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    modal: {
        width: '100%',
        maxWidth: 500,
        maxHeight: '90%',
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
    },
    content: {
        padding: Spacing.md,
    },
    fieldGroup: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: FontSizes.sm,
        fontWeight: '500',
        marginBottom: Spacing.xs,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
    },
    chip: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.md,
    },
    chipText: {
        fontSize: FontSizes.sm,
        fontWeight: '500',
    },
    textInput: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.sm,
        fontSize: FontSizes.md,
    },
    filePickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    filePathContainer: {
        flex: 1,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.sm,
    },
    filePath: {
        fontSize: FontSizes.sm,
    },
    pickButton: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderTopWidth: 1,
    },
    cancelButton: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    cancelButtonText: {
        fontSize: FontSizes.md,
        fontWeight: '500',
    },
    importButton: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        minWidth: 120,
        alignItems: 'center',
    },
    importButtonText: {
        color: '#FFFFFF',
        fontSize: FontSizes.md,
        fontWeight: '600',
    },
});
