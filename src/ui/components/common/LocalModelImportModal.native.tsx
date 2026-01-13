import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
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
import { MODEL_TYPE_PRESETS, ModelType, ModelTypeKey } from '../../../config/modelTypePresets';
import { getLocalProviders, PROVIDER_LIST } from '../../../config/providerPresets';
import { BorderRadius, Colors, FontSizes, Shadows, Spacing } from '../../../config/theme';
import { DownloadedModelProvider, LLMProviderKey } from '../../../core/types';
import { pickFile } from '../../../utils/filePicker';
import { useAppColorScheme, useLocale } from '../../hooks';

// Get the models directory path (same as ModelDownloadService)
function getModelsDirPath(): string {
    return `${RNFS.DownloadDirectoryPath}/modelflux/models`;
}

// Copy a file to the modelflux models directory
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
        provider: DownloadedModelProvider,
        type: ModelType,
        modelPath: string,
        tokenizerPath?: string,
        tokenizerConfigPath?: string
    ) => Promise<void>;
}

export function LocalModelImportModal({
    visible,
    onClose,
    onImport,
}: LocalModelImportModalProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const shadows = Shadows[colorScheme];
    const { t } = useLocale();

    // Get local providers from presets
    const localProviders = useMemo(() => {
        return getLocalProviders().map(providerId => ({
            value: providerId as DownloadedModelProvider,
            label: PROVIDER_LIST[providerId].name,
            formats: PROVIDER_LIST[providerId].supportedFormats || [],
        }));
    }, []);

    // Get supported model types (LLM and Embedding only)
    const modelTypes = useMemo(() => {
        return MODEL_TYPE_PRESETS.filter(
            mt => mt.id === ModelTypeKey.LLM || mt.id === ModelTypeKey.Embedding
        ).map(mt => ({
            value: mt.id,
            label: mt.name,
        }));
    }, []);

    // Form state
    const [provider, setProvider] = useState<DownloadedModelProvider>(
        localProviders[0]?.value || LLMProviderKey.Executorch
    );
    const [modelType, setModelType] = useState<ModelType>('llm');
    const [modelName, setModelName] = useState('');
    const [modelPath, setModelPath] = useState('');
    const [tokenizerPath, setTokenizerPath] = useState('');
    const [tokenizerConfigPath, setTokenizerConfigPath] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    // Get current provider config
    const providerConfig = PROVIDER_LIST[provider];
    const supportedFormats = providerConfig?.supportedFormats || [];
    const isLlamaCpp = provider === LLMProviderKey.LlamaCpp;
    const isExecutorch = provider === LLMProviderKey.Executorch;

    // Handle file pick for a specific file type
    const handlePickFile = async (type: 'model' | 'tokenizer' | 'tokenizerConfig') => {
        const result = await pickFile(type);
        if (!result) return;

        const { uri, name } = result;

        switch (type) {
            case 'model':
                setModelPath(uri);
                // Auto-fill name from filename if empty
                if (!modelName) {
                    setModelName(name.replace(/\.[^/.]+$/, '')); // Remove extension
                }
                break;
            case 'tokenizer':
                setTokenizerPath(uri);
                break;
            case 'tokenizerConfig':
                setTokenizerConfigPath(uri);
                break;
        }
    };

    // Get filename from path/uri
    const getFilename = (path: string): string => {
        if (!path) return '';
        return path.split('/').pop() || path;
    };

    // Get file extension hint based on provider
    const getModelFileHint = (): string => {
        if (supportedFormats.length > 0) {
            return t('localModel.import.selectModelFile', { formats: supportedFormats.join(', .') });
        }
        return t('localModel.import.selectModelFileGeneric');
    };

    // Reset form when provider changes
    const handleProviderChange = (newProvider: DownloadedModelProvider) => {
        setProvider(newProvider);
        // Clear file paths when switching providers (different formats)
        setModelPath('');
        setTokenizerPath('');
        setTokenizerConfigPath('');
    };

    // Handle import
    const handleImport = async () => {
        // For llama-cpp, only model file is required
        // For executorch, model and tokenizer are required
        if (!modelName.trim() || !modelPath) {
            return;
        }
        if (isExecutorch && !tokenizerPath) {
            return;
        }

        setIsImporting(true);
        try {
            // Generate a unique model ID for this import
            const modelId = `local-${Date.now()}`;

            // Copy files to modelflux/models directory
            console.log('[LocalModelImport] Copying files to modelflux/models directory...');

            const copiedModelPath = await copyFileToModelsDir(modelPath, modelId);
            let copiedTokenizerPath: string | undefined;
            let copiedTokenizerConfigPath: string | undefined;

            if (tokenizerPath) {
                copiedTokenizerPath = await copyFileToModelsDir(tokenizerPath, modelId);
            }

            if (tokenizerConfigPath) {
                copiedTokenizerConfigPath = await copyFileToModelsDir(tokenizerConfigPath, modelId);
            }

            console.log('[LocalModelImport] Files copied successfully');
            console.log('[LocalModelImport] Model path:', copiedModelPath);
            if (copiedTokenizerPath) {
                console.log('[LocalModelImport] Tokenizer path:', copiedTokenizerPath);
            }
            if (copiedTokenizerConfigPath) {
                console.log('[LocalModelImport] Tokenizer config path:', copiedTokenizerConfigPath);
            }

            const modelTypeLabel = modelTypes.find(t => t.value === modelType)?.label || modelType;
            await onImport(
                modelName.trim(),
                t('localModel.import.importedDescription', { type: modelTypeLabel }),
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
    // For llama-cpp: only model file required
    // For executorch: model and tokenizer required
    const isFormValid = modelName.trim() && modelPath && (isLlamaCpp || tokenizerPath);

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
                            {t('localModel.import.title')}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content}>
                        {/* Provider Selection */}
                        <View style={styles.fieldGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>{t('localModel.import.provider')}</Text>
                            <View style={styles.chipRow}>
                                {localProviders.map((p) => (
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
                                        onPress={() => handleProviderChange(p.value)}
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
                            {supportedFormats.length > 0 && (
                                <Text style={[styles.hint, { color: colors.textMuted }]}>
                                    {t('localModel.import.supportedFormat', { formats: supportedFormats.join(', .') })}
                                </Text>
                            )}
                        </View>

                        {/* Model Type Selection */}
                        <View style={styles.fieldGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>{t('localModel.import.modelType')}</Text>
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
                            <Text style={[styles.label, { color: colors.text }]}>{t('localModel.import.modelName')}</Text>
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
                                placeholder={t('localModel.import.modelNamePlaceholder')}
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        {/* Model File */}
                        <View style={styles.fieldGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>
                                {t('localModel.import.modelFileRequired')}
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
                                        {modelPath ? getFilename(modelPath) : getModelFileHint()}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.pickButton, { backgroundColor: colors.tint }]}
                                    onPress={() => handlePickFile('model')}
                                >
                                    <Ionicons name="add" size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Tokenizer File - Only for ExecuTorch */}
                        {isExecutorch && (
                            <View style={styles.fieldGroup}>
                                <Text style={[styles.label, { color: colors.text }]}>
                                    {t('localModel.import.tokenizerFileRequired')}
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
                                            {tokenizerPath ? getFilename(tokenizerPath) : t('localModel.import.selectTokenizerFile')}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.pickButton, { backgroundColor: colors.tint }]}
                                        onPress={() => handlePickFile('tokenizer')}
                                    >
                                        <Ionicons name="add" size={20} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Tokenizer Config File - Only for ExecuTorch, optional */}
                        {isExecutorch && (
                            <View style={styles.fieldGroup}>
                                <Text style={[styles.label, { color: colors.text }]}>
                                    {t('localModel.import.tokenizerConfig')}
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
                                                : t('localModel.import.selectConfigFile')}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.pickButton, { backgroundColor: colors.tint }]}
                                        onPress={() => handlePickFile('tokenizerConfig')}
                                    >
                                        <Ionicons name="add" size={20} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Info note for llama-cpp */}
                        {isLlamaCpp && (
                            <View style={[styles.infoBox, { backgroundColor: colors.tint + '15' }]}>
                                <Ionicons name="information-circle" size={20} color={colors.tint} />
                                <Text style={[styles.infoText, { color: colors.text }]}>
                                    {t('localModel.import.ggufInfo')}
                                </Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Footer */}
                    <View style={[styles.footer, { borderTopColor: colors.border }]}>
                        <TouchableOpacity
                            style={[styles.cancelButton, { borderColor: colors.border }]}
                            onPress={onClose}
                        >
                            <Text style={[styles.cancelButtonText, { color: colors.text }]}>{t('common.cancel')}</Text>
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
                                <Text style={styles.importButtonText}>{t('localModel.import.importButton')}</Text>
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
    hint: {
        fontSize: FontSizes.xs,
        marginTop: Spacing.xs,
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
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.xs,
    },
    infoText: {
        flex: 1,
        fontSize: FontSizes.sm,
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
