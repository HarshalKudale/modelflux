import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../config/theme';
import { RAGProvider } from '../../core/types';
import { useModelDownloadStore, useProviderConfigStore } from '../../state';
import { useAppColorScheme, useLocale } from '../hooks';

interface RAGProviderEditorScreenProps {
    configId?: string;
    provider?: RAGProvider;
    onBack: () => void;
}

// Selectable providers (local providers only for now)
type SelectableRAGProvider = 'executorch';

// RAG provider info
const RAG_PROVIDER_INFO: Record<SelectableRAGProvider, { name: string; color: string; description: string }> = {
    executorch: {
        name: 'ExecuTorch',
        color: '#FF6B35',
        description: 'On-device embeddings using ExecuTorch',
    },
};

// Selectable providers list
const RAG_PROVIDERS: SelectableRAGProvider[] = ['executorch'];

// Helper to safely get provider info
function getProviderInfo(provider: RAGProvider) {
    if (provider === 'none' || provider === 'openai' || provider === 'ollama') {
        return { name: provider.charAt(0).toUpperCase() + provider.slice(1), color: '#888888', description: 'Provider' };
    }
    return RAG_PROVIDER_INFO[provider];
}

export function RAGProviderEditorScreen({ configId, provider: initialProvider, onBack }: RAGProviderEditorScreenProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();

    const { configs, addProvider, updateProvider, getProviderById } = useProviderConfigStore();
    const { downloadedModels, loadDownloadedModels } = useModelDownloadStore();

    // Form state
    const [name, setName] = useState('');
    const [provider, setProvider] = useState<RAGProvider>(initialProvider || 'executorch');
    const [selectedModelId, setSelectedModelId] = useState<string>('');
    const [isDefault, setIsDefault] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showProviderPicker, setShowProviderPicker] = useState(false);

    const isEditing = !!configId;

    // Get embedding models (downloaded models with 'Embedding' tag)
    const embeddingModels = downloadedModels.filter(m =>
        m.provider === 'executorch' && m.type === 'embedding'
    );

    useEffect(() => {
        loadDownloadedModels();

        if (configId) {
            const existingConfig = getProviderById(configId);
            if (existingConfig) {
                setName(existingConfig.name);
                setProvider(existingConfig.provider);
                setSelectedModelId(existingConfig.modelId);
                setIsDefault(existingConfig.isDefault);
            }
        } else {
            // Set default name for new config
            const info = getProviderInfo(provider);
            setName(info.name);
            // Auto-select first embedding model if available
            if (embeddingModels.length > 0 && embeddingModels[0]) {
                setSelectedModelId(embeddingModels[0].id);
            }
        }
    }, [configId]);

    const handleSave = async () => {
        if (!name.trim() || !selectedModelId) return;

        setIsSaving(true);
        try {
            const now = Date.now();

            if (isEditing && configId) {
                const existingConfig = getProviderById(configId);
                if (existingConfig) {
                    await updateProvider({
                        ...existingConfig,
                        name: name.trim(),
                        provider,
                        modelId: selectedModelId,
                        isDefault,
                        updatedAt: now,
                    });
                }
            } else {
                await addProvider({
                    name: name.trim(),
                    provider,
                    modelId: selectedModelId,
                    isDefault: configs.length === 0 ? true : isDefault, // First config is default
                });
            }
            onBack();
        } catch (error) {
            console.error('Failed to save RAG config:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const canSave = name.trim().length > 0 && selectedModelId.length > 0;

    if (Platform.OS === 'web') {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.text }]}>{t('rag.editor.title')}</Text>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.unsupportedContainer}>
                    <Text style={[styles.unsupportedText, { color: colors.textMuted }]}>
                        {t('settings.rag.unsupported')}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const selectedProviderInfo = getProviderInfo(provider);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>
                    {isEditing ? t('rag.editor.edit') : t('rag.editor.create')}
                </Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={!canSave || isSaving}
                    style={styles.saveButton}
                >
                    <Text style={[
                        styles.saveButtonText,
                        { color: canSave && !isSaving ? colors.tint : colors.textMuted }
                    ]}>
                        {isSaving ? t('common.saving') : t('common.save')}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Provider Selection (Dropdown at top) */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        {t('rag.editor.provider')}
                    </Text>
                    <TouchableOpacity
                        style={[
                            styles.dropdownButton,
                            { backgroundColor: colors.cardBackground, borderColor: colors.border },
                        ]}
                        onPress={() => setShowProviderPicker(!showProviderPicker)}
                    >
                        <View style={[styles.providerIcon, { backgroundColor: selectedProviderInfo.color }]}>
                            <Text style={styles.providerIconText}>
                                {provider.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View style={styles.dropdownInfo}>
                            <Text style={[styles.dropdownTitle, { color: colors.text }]}>
                                {selectedProviderInfo.name}
                            </Text>
                            <Text style={[styles.dropdownSubtitle, { color: colors.textMuted }]}>
                                {selectedProviderInfo.description}
                            </Text>
                        </View>
                        <Ionicons
                            name={showProviderPicker ? "chevron-up" : "chevron-down"}
                            size={20}
                            color={colors.textMuted}
                        />
                    </TouchableOpacity>

                    {/* Provider Options (expandable) */}
                    {showProviderPicker && (
                        <View style={[styles.pickerOptions, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                            {RAG_PROVIDERS.map((p) => {
                                const info = RAG_PROVIDER_INFO[p];
                                const isSelected = provider === p;
                                return (
                                    <TouchableOpacity
                                        key={p}
                                        style={[
                                            styles.pickerOption,
                                            isSelected && { backgroundColor: colors.tint + '15' },
                                        ]}
                                        onPress={() => {
                                            setProvider(p);
                                            if (!isEditing) {
                                                setName(info.name);
                                            }
                                            setShowProviderPicker(false);
                                        }}
                                    >
                                        <View style={[styles.providerIcon, { backgroundColor: info.color }]}>
                                            <Text style={styles.providerIconText}>
                                                {p.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={styles.pickerOptionInfo}>
                                            <Text style={[styles.pickerOptionTitle, { color: colors.text }]}>
                                                {info.name}
                                            </Text>
                                            <Text style={[styles.pickerOptionSubtitle, { color: colors.textMuted }]}>
                                                {info.description}
                                            </Text>
                                        </View>
                                        {isSelected && (
                                            <Ionicons name="checkmark-circle" size={22} color={colors.tint} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* Name Input */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        {t('rag.editor.name')}
                    </Text>
                    <View style={[styles.inputContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            value={name}
                            onChangeText={setName}
                            placeholder={t('rag.editor.namePlaceholder')}
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>
                </View>

                {/* Default Toggle */}
                <View style={styles.section}>
                    <View style={[styles.toggleRow, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                        <View style={styles.toggleInfo}>
                            <Text style={[styles.toggleLabel, { color: colors.text }]}>
                                {t('rag.editor.setDefault')}
                            </Text>
                            <Text style={[styles.toggleHint, { color: colors.textMuted }]}>
                                {t('rag.editor.setDefaultHint')}
                            </Text>
                        </View>
                        <Switch
                            value={isDefault}
                            onValueChange={setIsDefault}
                            trackColor={{ false: colors.border, true: colors.tint + '80' }}
                            thumbColor={isDefault ? colors.tint : colors.background}
                        />
                    </View>
                </View>

                {/* Model Selection (at bottom) */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        {t('rag.editor.model')}
                    </Text>

                    {embeddingModels.length === 0 ? (
                        <View style={[styles.noModelsContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                            <Ionicons name="cube-outline" size={32} color={colors.textMuted} />
                            <Text style={[styles.noModelsText, { color: colors.textMuted }]}>
                                {t('rag.noEmbeddingModels')}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.modelList}>
                            {embeddingModels.map((model) => {
                                const isSelected = selectedModelId === model.id;
                                return (
                                    <TouchableOpacity
                                        key={model.id}
                                        style={[
                                            styles.modelItem,
                                            { backgroundColor: colors.cardBackground, borderColor: isSelected ? colors.tint : colors.border },
                                            isSelected && { borderWidth: 2 },
                                        ]}
                                        onPress={() => setSelectedModelId(model.id)}
                                    >
                                        <View style={styles.modelInfo}>
                                            <Text style={[styles.modelName, { color: colors.text }]}>
                                                {model.name}
                                            </Text>
                                            {model.description && (
                                                <Text style={[styles.modelDescription, { color: colors.textMuted }]} numberOfLines={2}>
                                                    {model.description}
                                                </Text>
                                            )}
                                            <View style={styles.modelTags}>
                                                {model.tags.map((tag) => (
                                                    <View key={tag} style={[styles.tag, { backgroundColor: colors.tint + '20' }]}>
                                                        <Text style={[styles.tagText, { color: colors.tint }]}>{tag}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                        {isSelected && (
                                            <Ionicons name="checkmark-circle" size={24} color={colors.tint} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    backButton: {
        marginRight: Spacing.md,
    },
    title: {
        flex: 1,
        fontSize: FontSizes.xl,
        fontWeight: '600',
    },
    saveButton: {
        paddingHorizontal: Spacing.sm,
    },
    saveButtonText: {
        fontSize: FontSizes.md,
        fontWeight: '600',
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    section: {
        padding: Spacing.md,
    },
    sectionTitle: {
        fontSize: FontSizes.xs,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xs,
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    providerIcon: {
        width: 36,
        height: 36,
        borderRadius: BorderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    providerIconText: {
        color: '#FFFFFF',
        fontSize: FontSizes.lg,
        fontWeight: '700',
    },
    dropdownInfo: {
        flex: 1,
    },
    dropdownTitle: {
        fontSize: FontSizes.md,
        fontWeight: '600',
    },
    dropdownSubtitle: {
        fontSize: FontSizes.sm,
        marginTop: 2,
    },
    pickerOptions: {
        marginTop: Spacing.xs,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        overflow: 'hidden',
    },
    pickerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
    },
    pickerOptionInfo: {
        flex: 1,
    },
    pickerOptionTitle: {
        fontSize: FontSizes.md,
        fontWeight: '500',
    },
    pickerOptionSubtitle: {
        fontSize: FontSizes.sm,
        marginTop: 2,
    },
    inputContainer: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
    },
    input: {
        fontSize: FontSizes.md,
        paddingVertical: Spacing.md,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    toggleInfo: {
        flex: 1,
    },
    toggleLabel: {
        fontSize: FontSizes.md,
        fontWeight: '500',
    },
    toggleHint: {
        fontSize: FontSizes.sm,
        marginTop: 2,
    },
    noModelsContainer: {
        alignItems: 'center',
        padding: Spacing.xl,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    noModelsText: {
        fontSize: FontSizes.sm,
        textAlign: 'center',
        marginTop: Spacing.sm,
    },
    modelList: {
        gap: Spacing.sm,
    },
    modelItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    modelInfo: {
        flex: 1,
    },
    modelName: {
        fontSize: FontSizes.md,
        fontWeight: '600',
    },
    modelDescription: {
        fontSize: FontSizes.sm,
        marginTop: 4,
    },
    modelTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
        marginTop: Spacing.xs,
    },
    tag: {
        paddingHorizontal: Spacing.xs,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
    },
    tagText: {
        fontSize: FontSizes.xs,
        fontWeight: '500',
    },
    unsupportedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    unsupportedText: {
        fontSize: FontSizes.md,
        textAlign: 'center',
    },
});
