/**
 * RAG Settings Screen
 * 
 * Settings screen for RAG (Retrieval-Augmented Generation) configuration.
 * Allows selecting provider and embedding model.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RAG_EMBEDDING_MODELS, isRagSupported } from '../../config/ragConstants';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../config/theme';
import { RAGProvider } from '../../core/types';
import { useExecutorchRagStore, useModelDownloadStore, useSettingsStore } from '../../state';
import { SettingsSection } from '../components/settings';
import { useAppColorScheme, useLocale } from '../hooks';

interface RAGSettingsScreenProps {
    onBack: () => void;
}

const RAG_PROVIDERS: { id: RAGProvider; name: string; description: string }[] = [
    {
        id: 'executorch',
        name: 'ExecuTorch',
        description: 'On-device embeddings using ExecuTorch',
    },
];

export function RAGSettingsScreen({ onBack }: RAGSettingsScreenProps) {
    console.log('[RAGSettings] ========= COMPONENT RENDERING =========');
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();

    const { settings, setRagProvider, setRagModel, setRagEnabled } = useSettingsStore();
    const { isInitialized, isInitializing, error, initialize } = useExecutorchRagStore();
    const { downloadedModels, loadDownloadedModels } = useModelDownloadStore();

    const ragSettings = settings.ragSettings;
    const selectedProvider = ragSettings?.provider || 'none';
    const selectedModelId = ragSettings?.modelId || null;
    const isEnabled = ragSettings?.isEnabled || false;

    // Load downloaded models on mount
    useEffect(() => {
        console.log('[RAGSettings] Component mounted, loading downloaded models...');
        loadDownloadedModels();
    }, [loadDownloadedModels]);

    // Debug log when downloadedModels changes
    useEffect(() => {
        console.log('[RAGSettings] downloadedModels state changed, count:', downloadedModels.length);
    }, [downloadedModels]);

    // Combine config models with downloaded embedding models
    const allEmbeddingModels = useMemo(() => {
        console.log('[RAGSettings] All downloaded models:', downloadedModels.map(dm => ({
            modelId: dm.modelId,
            name: dm.name,
            type: dm.type
        })));

        const downloadedEmbedding = downloadedModels
            .filter((dm) => dm.type === 'embedding')
            .map((dm) => ({
                id: dm.modelId,
                name: dm.name,
                description: dm.description,
            }));

        console.log('[RAGSettings] Downloaded embedding models:', downloadedEmbedding);

        return [
            ...downloadedEmbedding,
            ...RAG_EMBEDDING_MODELS,
        ];
    }, [downloadedModels]);

    // Initialize RAG when enabled and model is selected
    useEffect(() => {
        if (isEnabled && selectedProvider === 'executorch' && selectedModelId && !isInitialized && !isInitializing) {
            const model = downloadedModels.find((dm) => dm.modelId === selectedModelId);
            if (model) {
                initialize(model);
            }
        }
    }, [isEnabled, selectedProvider, selectedModelId, isInitialized, isInitializing, downloadedModels]);

    const handleProviderChange = async (providerId: RAGProvider) => {
        await setRagProvider(providerId);
        if (providerId !== 'none' && !selectedModelId) {
            // Auto-select first model
            const firstModel = RAG_EMBEDDING_MODELS[0];
            if (firstModel) {
                await setRagModel(firstModel.id);
                await setRagEnabled(true);
            }
        } else if (providerId === 'none') {
            await setRagEnabled(false);
        } else {
            await setRagEnabled(true);
        }
    };

    const handleModelChange = async (modelId: string) => {
        await setRagModel(modelId);
        // Re-initialize with new model
        if (isEnabled) {
            const model = downloadedModels.find((dm) => dm.modelId === modelId);
            if (model) {
                initialize(model);
            }
        }
    };

    if (!isRagSupported()) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.text }]}>{t('settings.rag.title')}</Text>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.unsupportedContainer}>
                    <Ionicons name="warning-outline" size={48} color={colors.textMuted} />
                    <Text style={[styles.unsupportedText, { color: colors.textMuted }]}>
                        {t('settings.rag.unsupported')}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>{t('settings.rag.title')}</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content}>
                {/* Provider Selection */}
                <SettingsSection title={t('settings.rag.provider')}>
                    {/* None option */}
                    <TouchableOpacity
                        style={[
                            styles.optionItem,
                            selectedProvider === 'none' && { backgroundColor: colors.tint + '20' },
                            { borderBottomColor: colors.border },
                        ]}
                        onPress={() => handleProviderChange('none')}
                    >
                        <View style={styles.optionInfo}>
                            <Text style={[styles.optionLabel, { color: colors.text }]}>
                                {t('settings.rag.disabled')}
                            </Text>
                            <Text style={[styles.optionDescription, { color: colors.textMuted }]}>
                                {t('settings.rag.disabled.description')}
                            </Text>
                        </View>
                        {selectedProvider === 'none' && (
                            <Ionicons name="checkmark-circle" size={24} color={colors.tint} />
                        )}
                    </TouchableOpacity>

                    {/* Provider options */}
                    {RAG_PROVIDERS.map((provider) => (
                        <TouchableOpacity
                            key={provider.id}
                            style={[
                                styles.optionItem,
                                selectedProvider === provider.id && { backgroundColor: colors.tint + '20' },
                                { borderBottomColor: colors.border },
                            ]}
                            onPress={() => handleProviderChange(provider.id)}
                        >
                            <View style={styles.optionInfo}>
                                <Text style={[styles.optionLabel, { color: colors.text }]}>
                                    {provider.name}
                                </Text>
                                <Text style={[styles.optionDescription, { color: colors.textMuted }]}>
                                    {provider.description}
                                </Text>
                            </View>
                            {selectedProvider === provider.id && (
                                <Ionicons name="checkmark-circle" size={24} color={colors.tint} />
                            )}
                        </TouchableOpacity>
                    ))}
                </SettingsSection>

                {/* Model Selection - only show when provider is selected */}
                {selectedProvider !== 'none' && (
                    <SettingsSection title={t('settings.rag.model')}>
                        {allEmbeddingModels.map((model) => (
                            <TouchableOpacity
                                key={model.id}
                                style={[
                                    styles.optionItem,
                                    selectedModelId === model.id && { backgroundColor: colors.tint + '20' },
                                    { borderBottomColor: colors.border },
                                ]}
                                onPress={() => handleModelChange(model.id)}
                            >
                                <View style={styles.optionInfo}>
                                    <Text style={[styles.optionLabel, { color: colors.text }]}>
                                        {model.name}
                                    </Text>
                                    <Text style={[styles.optionDescription, { color: colors.textMuted }]}>
                                        {model.description}
                                    </Text>
                                </View>
                                {selectedModelId === model.id && (
                                    <Ionicons name="checkmark-circle" size={24} color={colors.tint} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </SettingsSection>
                )}

                {/* Status Section */}
                {selectedProvider !== 'none' && (
                    <SettingsSection title={t('settings.rag.status')}>
                        <View style={[styles.statusItem, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.statusLabel, { color: colors.text }]}>
                                {t('settings.rag.vectorStore')}
                            </Text>
                            <View style={styles.statusValue}>
                                {isInitializing ? (
                                    <>
                                        <ActivityIndicator size="small" color={colors.tint} />
                                        <Text style={[styles.statusText, { color: colors.textMuted }]}>
                                            {t('settings.rag.initializing')}
                                        </Text>
                                    </>
                                ) : isInitialized ? (
                                    <>
                                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                                        <Text style={[styles.statusText, { color: colors.success }]}>
                                            {t('settings.rag.ready')}
                                        </Text>
                                    </>
                                ) : error ? (
                                    <>
                                        <Ionicons name="alert-circle" size={20} color={colors.error} />
                                        <Text style={[styles.statusText, { color: colors.error }]} numberOfLines={2}>
                                            {error}
                                        </Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="ellipse-outline" size={20} color={colors.textMuted} />
                                        <Text style={[styles.statusText, { color: colors.textMuted }]}>
                                            {t('settings.rag.notInitialized')}
                                        </Text>
                                    </>
                                )}
                            </View>
                        </View>

                        {/* Initialize button */}
                        {!isInitialized && !isInitializing && selectedModelId && (
                            <TouchableOpacity
                                style={[styles.initButton, { backgroundColor: colors.tint }]}
                                onPress={() => {
                                    const model = downloadedModels.find((dm) => dm.modelId === selectedModelId);
                                    if (model) {
                                        initialize(model);
                                    }
                                }}
                            >
                                <Text style={styles.initButtonText}>
                                    {t('settings.rag.initialize')}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </SettingsSection>
                )}
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
    placeholder: {
        width: 24,
    },
    content: {
        flex: 1,
    },
    unsupportedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    unsupportedText: {
        fontSize: FontSizes.md,
        marginTop: Spacing.md,
        textAlign: 'center',
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    optionInfo: {
        flex: 1,
    },
    optionLabel: {
        fontSize: FontSizes.md,
        fontWeight: '500',
    },
    optionDescription: {
        fontSize: FontSizes.sm,
        marginTop: 2,
    },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    statusLabel: {
        fontSize: FontSizes.md,
    },
    statusValue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    statusText: {
        fontSize: FontSizes.sm,
    },
    initButton: {
        marginHorizontal: Spacing.md,
        marginVertical: Spacing.md,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    initButtonText: {
        color: '#FFFFFF',
        fontSize: FontSizes.md,
        fontWeight: '600',
    },
});
