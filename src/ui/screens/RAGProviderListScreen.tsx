import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../config/theme';
import { RAGConfig, RAGProvider } from '../../core/types';
import { useLLMStore, useModelDownloadStore, useOllamaModelStore, useProviderConfigStore } from '../../state';
import { showConfirm, showError, showInfo } from '../../utils/alert';
import { ResourceCard } from '../components/common';
import { useAppColorScheme, useLocale } from '../hooks';

interface RAGProviderListScreenProps {
    onNavigate: (screen: string, params?: Record<string, string>) => void;
    onBack: () => void;
}

// Selectable providers (local + ollama)
type SelectableRAGProvider = 'executorch' | 'llama-cpp' | 'ollama';

// RAG provider info
const RAG_PROVIDER_INFO: Record<SelectableRAGProvider, { name: string; color: string; description: string }> = {
    executorch: {
        name: 'ExecuTorch',
        color: '#0668E1',
        description: 'On-device embeddings using ExecuTorch',
    },
    'llama-cpp': {
        name: 'Llama.cpp',
        color: '#FF6B35',
        description: 'On-device embeddings using llama.rn',
    },
    ollama: {
        name: 'Ollama',
        color: '#1D1D1D',
        description: 'Embeddings via Ollama server',
    },
};

// Helper to safely get provider info
function getProviderInfo(provider: RAGProvider) {
    if (provider === 'none' || provider === 'openai') {
        return { name: provider.charAt(0).toUpperCase() + provider.slice(1), color: '#888888', description: 'Provider' };
    }
    return RAG_PROVIDER_INFO[provider as SelectableRAGProvider];
}

export function RAGProviderListScreen({ onNavigate, onBack }: RAGProviderListScreenProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();

    const { configs, loadConfigs, removeProvider, setDefaultProvider } = useProviderConfigStore();
    const { downloadedModels, loadDownloadedModels } = useModelDownloadStore();
    const { configs: llmConfigs } = useLLMStore();

    // Ollama model store for embedding models
    const {
        embeddingModels: ollamaEmbeddingModels,
        hasFetched: ollamaHasFetched,
        fetchAndClassifyModels: fetchOllamaModels,
    } = useOllamaModelStore();

    useEffect(() => {
        loadConfigs();
        loadDownloadedModels();
    }, []);

    // Get Ollama LLM config for baseUrl
    const ollamaConfig = llmConfigs.find(c => c.provider === 'ollama');

    // RAG providers available for adding
    const providerOptions: SelectableRAGProvider[] = ['executorch', 'llama-cpp', 'ollama'];

    // Get embedding models (downloaded models with 'Embedding' tag)
    const embeddingModels = downloadedModels.filter(m =>
        m.type === 'embedding'
    );

    // Check if Ollama has embedding models available
    const hasOllamaEmbeddingModels = ollamaEmbeddingModels.length > 0;

    const handleAddProvider = (provider: RAGProvider) => {
        // For Ollama, check if there's an LLM config and embedding models
        if (provider === 'ollama') {
            if (!ollamaConfig) {
                showInfo(
                    'Ollama Not Configured',
                    'Please add an Ollama LLM provider first in Settings → Manage LLM Providers.'
                );
                return;
            }
            // Trigger fetch if not done yet
            if (!ollamaHasFetched && ollamaConfig.baseUrl) {
                fetchOllamaModels(ollamaConfig.baseUrl, ollamaConfig.headers);
            }
            // If no embedding models after fetch, show message
            if (ollamaHasFetched && !hasOllamaEmbeddingModels) {
                showInfo(
                    'No Embedding Models',
                    'No embedding models found on your Ollama server. Please pull an embedding model like nomic-embed-text.'
                );
                return;
            }
            onNavigate('rag-provider-editor', { provider });
            return;
        }

        // For local providers, check for downloaded embedding models
        if (embeddingModels.length === 0) {
            showInfo(
                t('rag.noEmbeddingModelsTitle'),
                t('rag.noEmbeddingModels')
            );
            return;
        }
        onNavigate('rag-provider-editor', { provider });
    };

    const handleEdit = (config: RAGConfig) => {
        onNavigate('rag-provider-editor', { id: config.id });
    };

    const handleSetDefault = async (config: RAGConfig) => {
        await setDefaultProvider(config.id);
        showInfo(t('common.success'), `${config.name} is now the default RAG provider.`);
    };

    const handleDelete = async (config: RAGConfig) => {
        const confirmed = await showConfirm(
            t('rag.delete.title'),
            t('rag.delete.confirm', { name: config.name }),
            t('common.delete'),
            t('common.cancel'),
            true
        );

        if (confirmed) {
            try {
                await removeProvider(config.id);
            } catch (error) {
                showError(t('common.error'), error instanceof Error ? error.message : t('alert.error.default'));
            }
        }
    };

    const getProviderIcon = (config: RAGConfig) => {
        return (
            <Text style={{ color: '#FFFFFF', fontSize: FontSizes.lg, fontWeight: '700' }}>
                {config.provider.charAt(0).toUpperCase()}
            </Text>
        );
    };

    const getModelName = (modelId: string) => {
        const model = downloadedModels.find(m => m.id === modelId);
        return model?.name || modelId;
    };

    if (Platform.OS === 'web') {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.text }]}>{t('rag.providers.title')}</Text>
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
                <Text style={[styles.title, { color: colors.text }]}>{t('rag.providers.title')}</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {/* Quick Add Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        {t('rag.add')}
                    </Text>
                    <View style={styles.quickAddGrid}>
                        {providerOptions.map((provider) => {
                            const info = RAG_PROVIDER_INFO[provider];
                            return (
                                <TouchableOpacity
                                    key={provider}
                                    style={[
                                        styles.quickAddButton,
                                        { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                    ]}
                                    onPress={() => handleAddProvider(provider)}
                                >
                                    <View
                                        style={[styles.quickAddIcon, { backgroundColor: info.color }]}
                                    >
                                        <Text style={styles.quickAddIconText}>
                                            {provider.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <Text style={[styles.quickAddLabel, { color: colors.text }]}>
                                        {info.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Existing Configs */}
                {configs.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                            {t('rag.yourProviders', { count: configs.length })}
                        </Text>
                        {configs.map((config) => {
                            const info = getProviderInfo(config.provider);
                            return (
                                <ResourceCard
                                    key={config.id}
                                    title={config.name}
                                    subtitle={info.name}
                                    description={`${t('rag.model')}: ${getModelName(config.modelId)}`}
                                    icon={getProviderIcon(config)}
                                    iconColor={info.color}
                                    isDefault={config.isDefault}
                                    onPress={() => handleEdit(config)}
                                    onSetDefault={() => handleSetDefault(config)}
                                    onDelete={() => handleDelete(config)}
                                />
                            );
                        })}
                    </View>
                )}

                {/* Empty State */}
                {configs.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="document-text-outline" size={64} color={colors.textMuted} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>
                            {t('rag.empty.title')}
                        </Text>
                        <Text style={[styles.emptyDescription, { color: colors.textMuted }]}>
                            {t('rag.empty.description')}
                        </Text>
                    </View>
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
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: Spacing.xs,
    },
    title: {
        fontSize: FontSizes.xl,
        fontWeight: '600',
    },
    placeholder: {
        width: 32,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: Spacing.md,
    },
    section: {
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: FontSizes.xs,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xs,
    },
    quickAddGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    quickAddButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    quickAddIcon: {
        width: 28,
        height: 28,
        borderRadius: BorderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
    },
    quickAddIconText: {
        color: '#FFFFFF',
        fontSize: FontSizes.md,
        fontWeight: '700',
    },
    quickAddLabel: {
        fontSize: FontSizes.md,
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing.xxl,
    },
    emptyTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        marginTop: Spacing.md,
    },
    emptyDescription: {
        fontSize: FontSizes.md,
        textAlign: 'center',
        marginTop: Spacing.sm,
        maxWidth: 280,
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
});
