/**
 * Models Screen
 * Browse, download, and manage AI models
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EXECUTORCH_MODELS, ExecutorchModel, ExecutorchModelProvider } from '../../config/executorchModels';
import { MODEL_TYPE_PRESETS, ModelType } from '../../config/modelTypePresets';
import { getLocalProviders, PROVIDER_LIST } from '../../config/providerPresets';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../config/theme';
import { DownloadedModelType, LLMProvider } from '../../core/types';
import { importLocalModel } from '../../services/ModelDownloadService';
import { useModelDownloadStore } from '../../state';
import { LocalModelImportModal } from '../components/common/LocalModelImportModal';
import { useAppColorScheme, useLocale } from '../hooks';

// Provider filter types (Row 1) - uses local providers from presets
type ProviderFilter = 'all' | ExecutorchModelProvider;

// Model type filter types (Row 2) - uses model types from presets
type ModelTypeFilter = 'all' | ModelType;

interface ModelsScreenProps {
    onBack: () => void;
}

export function ModelsScreen({ onBack }: ModelsScreenProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [providerFilter, setProviderFilter] = useState<ProviderFilter>('all');
    const [modelTypeFilter, setModelTypeFilter] = useState<ModelTypeFilter>('all');
    const [isImportModalVisible, setIsImportModalVisible] = useState(false);

    // Store
    const {
        activeDownloads,
        downloadedModels,
        isLoading,
        loadDownloadedModels,
        startDownload,
        cancelDownload,
        deleteDownloadedModel,
        isDownloading,
        isDownloaded,
        getDownloadProgress,
    } = useModelDownloadStore();

    // Load downloaded models on mount
    useEffect(() => {
        loadDownloadedModels();
    }, []);

    // Filter models based on search and filter criteria
    const filteredModels = useMemo(() => {
        // Start with catalog models
        let models: ExecutorchModel[] = [...EXECUTORCH_MODELS];

        // Add imported models (local ones not in catalog)
        const importedModels = downloadedModels
            .filter((dm) => dm.modelId.startsWith('local-'))
            .map((dm): ExecutorchModel => ({
                id: dm.modelId,
                name: dm.name,
                description: dm.description,
                provider: dm.provider,
                type: dm.type,
                params: 'Local',
                size: dm.sizeEstimate || 'Unknown',
                assets: {
                    model: dm.modelFilePath,
                    tokenizer: dm.tokenizerFilePath,
                    tokenizerConfig: dm.tokenizerConfigFilePath,
                },
            }));

        models = [...importedModels, ...models];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            models = models.filter(
                (m) =>
                    m.name.toLowerCase().includes(query) ||
                    m.description.toLowerCase().includes(query)
            );
        }

        // Apply provider filter (Row 1)
        switch (providerFilter) {
            case 'executorch':
                models = models.filter((m) => m.provider === 'executorch');
                break;
            case 'llama-cpp':
                models = models.filter((m) => m.provider === 'llama-cpp');
                break;
            default:
                // 'all' - show all providers
                break;
        }

        // Apply model type filter (Row 2) - dynamic based on presets
        if (modelTypeFilter !== 'all') {
            models = models.filter((m) => m.type === modelTypeFilter);
        }

        // Sort: importing models first, then downloading, then by name
        models.sort((a, b) => {
            // Imported models first
            const aImported = a.id.startsWith('local-');
            const bImported = b.id.startsWith('local-');
            if (aImported && !bImported) return -1;
            if (!aImported && bImported) return 1;

            const aDownloading = isDownloading(a.id);
            const bDownloading = isDownloading(b.id);
            if (aDownloading && !bDownloading) return -1;
            if (!aDownloading && bDownloading) return 1;
            return a.name.localeCompare(b.name);
        });

        return models;
    }, [searchQuery, providerFilter, modelTypeFilter, activeDownloads, downloadedModels]);

    // Handle download button press
    const handleDownload = async (model: ExecutorchModel) => {
        try {
            await startDownload(model);
        } catch (error) {
            console.error('Failed to start download:', error);
        }
    };

    // Handle cancel button press
    const handleCancel = async (modelId: string) => {
        await cancelDownload(modelId);
    };

    // Handle delete button press
    const handleDelete = async (modelId: string) => {
        try {
            await deleteDownloadedModel(modelId);
        } catch (error) {
            console.error('Failed to delete model:', error);
        }
    };

    // Handle import local model
    const handleImportLocalModel = async (
        name: string,
        description: string,
        provider: 'executorch',
        type: DownloadedModelType,
        modelPath: string,
        tokenizerPath: string,
        tokenizerConfigPath?: string
    ) => {
        await importLocalModel(
            name,
            description,
            provider,
            type,
            modelPath,
            tokenizerPath,
            tokenizerConfigPath
        );
        // Reload models after import
        await loadDownloadedModels();
    };

    // Render provider filter chip (Row 1)
    const renderProviderFilterChip = (filterValue: ProviderFilter, label: string) => {
        const isActive = providerFilter === filterValue;
        return (
            <TouchableOpacity
                key={filterValue}
                style={[
                    styles.filterChip,
                    {
                        backgroundColor: isActive
                            ? colors.tint
                            : colors.backgroundSecondary,
                    },
                ]}
                onPress={() => setProviderFilter(filterValue)}
            >
                <Text
                    style={[
                        styles.filterChipText,
                        { color: isActive ? '#FFFFFF' : colors.text },
                    ]}
                >
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    // Render model type filter chip (Row 2)
    const renderModelTypeFilterChip = (filterValue: ModelTypeFilter, label: string) => {
        const isActive = modelTypeFilter === filterValue;
        return (
            <TouchableOpacity
                key={filterValue}
                style={[
                    styles.filterChip,
                    {
                        backgroundColor: isActive
                            ? colors.tint
                            : colors.backgroundSecondary,
                    },
                ]}
                onPress={() => setModelTypeFilter(filterValue)}
            >
                <Text
                    style={[
                        styles.filterChipText,
                        { color: isActive ? '#FFFFFF' : colors.text },
                    ]}
                >
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    // Render model item
    const renderModelItem = ({ item: model }: { item: ExecutorchModel }) => {
        const downloading = isDownloading(model.id);
        const downloaded = isDownloaded(model.id);
        const progress = getDownloadProgress(model.id);

        return (
            <View
                style={[
                    styles.modelItem,
                    {
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.border,
                    },
                ]}
            >
                <View style={styles.modelInfo}>
                    <View style={styles.modelHeader}>
                        <Text style={[styles.modelName, { color: colors.text }]}>
                            {model.name}
                        </Text>
                        <View style={styles.tagContainer}>
                            <View
                                style={[
                                    styles.tag,
                                    { backgroundColor: colors.tint + '20' },
                                ]}
                            >
                                <Text
                                    style={[styles.tagText, { color: colors.tint }]}
                                >
                                    {model.params}
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.tag,
                                    { backgroundColor: model.type === 'llm' ? colors.success + '20' : colors.warning + '20' },
                                ]}
                            >
                                <Text
                                    style={[styles.tagText, { color: model.type === 'llm' ? colors.success : colors.warning }]}
                                >
                                    {model.type.toUpperCase()}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <Text
                        style={[styles.modelDescription, { color: colors.textMuted }]}
                        numberOfLines={2}
                    >
                        {model.description}
                    </Text>
                    <Text style={[styles.modelSize, { color: colors.textMuted }]}>
                        {model.size}
                    </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionContainer}>
                    {downloaded ? (
                        <View style={styles.downloadedActions}>
                            <View
                                style={[
                                    styles.actionButton,
                                    styles.completedButton,
                                    { backgroundColor: colors.success + '20' },
                                ]}
                            >
                                <Ionicons
                                    name="checkmark-circle"
                                    size={24}
                                    color={colors.success}
                                />
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    styles.deleteButton,
                                    { backgroundColor: colors.error + '20' },
                                ]}
                                onPress={() => handleDelete(model.id)}
                            >
                                <Ionicons
                                    name="trash-outline"
                                    size={22}
                                    color={colors.error}
                                />
                            </TouchableOpacity>
                        </View>
                    ) : downloading ? (
                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                styles.cancelButton,
                                { backgroundColor: colors.error + '20' },
                            ]}
                            onPress={() => handleCancel(model.id)}
                        >
                            <Ionicons name="close" size={24} color={colors.error} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                { backgroundColor: colors.tint + '20' },
                            ]}
                            onPress={() => handleDownload(model)}
                        >
                            <Ionicons
                                name="download-outline"
                                size={24}
                                color={colors.tint}
                            />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Progress Bar */}
                {downloading && (
                    <View style={styles.progressContainer}>
                        <View
                            style={[
                                styles.progressBar,
                                { backgroundColor: colors.border },
                            ]}
                        >
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        backgroundColor: colors.tint,
                                        width: `${progress}%`,
                                    },
                                ]}
                            />
                        </View>
                    </View>
                )}
            </View>
        );
    };

    // Web platform check
    const isWeb = Platform.OS === 'web';

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}
            edges={['top', 'bottom']}
        >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>
                    {t('models.title')}
                </Text>
                <TouchableOpacity
                    onPress={() => setIsImportModalVisible(true)}
                    style={styles.importButton}
                >
                    <Ionicons name="add" size={24} color={colors.tint} />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View
                    style={[
                        styles.searchInputContainer,
                        {
                            backgroundColor: colors.backgroundSecondary,
                            borderColor: colors.border,
                        },
                    ]}
                >
                    <Ionicons
                        name="search"
                        size={20}
                        color={colors.textMuted}
                        style={styles.searchIcon}
                    />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder={t('models.search.placeholder')}
                        placeholderTextColor={colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons
                                name="close-circle"
                                size={20}
                                color={colors.textMuted}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Provider Filter Chips (Row 1) - Local providers from presets */}
            <View style={styles.filterContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={[
                        { value: 'all' as ProviderFilter, label: t('models.filter.all') },
                        ...getLocalProviders().map((provider) => ({
                            value: (provider === 'llama-rn' ? 'llama-cpp' : provider) as ProviderFilter,
                            label: PROVIDER_LIST[provider as LLMProvider]?.isLocal
                                ? provider === 'llama-rn'
                                    ? 'Llama.cpp'
                                    : provider.charAt(0).toUpperCase() + provider.slice(1)
                                : provider,
                        })),
                    ]}
                    keyExtractor={(item) => item.value}
                    renderItem={({ item }) =>
                        renderProviderFilterChip(item.value, item.label)
                    }
                    contentContainerStyle={styles.filterList}
                />
            </View>

            {/* Model Type Filter Chips (Row 2) - Model types from presets */}
            <View style={styles.filterContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={[
                        { value: 'all' as ModelTypeFilter, label: t('models.filter.all') },
                        ...MODEL_TYPE_PRESETS.map((type) => ({
                            value: type.id as ModelTypeFilter,
                            label: type.name,
                        })),
                    ]}
                    keyExtractor={(item) => item.value}
                    renderItem={({ item }) =>
                        renderModelTypeFilterChip(item.value, item.label)
                    }
                    contentContainerStyle={styles.filterList}
                />
            </View>

            {/* Web Warning */}
            {isWeb && (
                <View
                    style={[
                        styles.webWarning,
                        { backgroundColor: colors.warning + '20' },
                    ]}
                >
                    <Ionicons
                        name="warning"
                        size={20}
                        color={colors.warning}
                    />
                    <Text style={[styles.webWarningText, { color: colors.warning }]}>
                        {t('models.web.unsupported')}
                    </Text>
                </View>
            )}

            {/* Loading State */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.tint} />
                </View>
            ) : (
                /* Models List */
                <FlatList
                    data={filteredModels}
                    keyExtractor={(item) => item.id}
                    renderItem={renderModelItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons
                                name="cube-outline"
                                size={48}
                                color={colors.textMuted}
                            />
                            <Text
                                style={[styles.emptyText, { color: colors.textMuted }]}
                            >
                                {searchQuery
                                    ? t('models.empty.search')
                                    : t('models.empty')}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Local Model Import Modal */}
            <LocalModelImportModal
                visible={isImportModalVisible}
                onClose={() => setIsImportModalVisible(false)}
                onImport={handleImportLocalModel}
            />
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
    importButton: {
        padding: Spacing.xs,
    },
    searchContainer: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.sm,
    },
    searchIcon: {
        marginRight: Spacing.xs,
    },
    searchInput: {
        flex: 1,
        paddingVertical: Spacing.sm,
        fontSize: FontSizes.md,
    },
    filterContainer: {
        paddingBottom: Spacing.sm,
    },
    filterList: {
        paddingHorizontal: Spacing.md,
        gap: Spacing.xs,
    },
    filterChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
        marginRight: Spacing.xs,
    },
    filterChipText: {
        fontSize: FontSizes.sm,
        fontWeight: '500',
    },
    listContent: {
        padding: Spacing.md,
        paddingTop: Spacing.xs,
    },
    modelItem: {
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
        position: 'relative',
        overflow: 'hidden',
    },
    modelInfo: {
        flex: 1,
        marginRight: Spacing.md,
    },
    modelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: Spacing.xs,
        marginBottom: Spacing.xs,
    },
    modelName: {
        fontSize: FontSizes.md,
        fontWeight: '600',
    },
    tagContainer: {
        flexDirection: 'row',
        gap: Spacing.xs,
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
    modelDescription: {
        fontSize: FontSizes.sm,
        marginBottom: Spacing.xs,
    },
    modelSize: {
        fontSize: FontSizes.xs,
    },
    actionContainer: {
        justifyContent: 'center',
    },
    actionButton: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    completedButton: {},
    cancelButton: {},
    downloadedActions: {
        flexDirection: 'row',
        gap: Spacing.xs,
    },
    deleteButton: {},
    progressContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
    },
    progressBar: {
        flex: 1,
    },
    progressFill: {
        height: '100%',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xl * 2,
    },
    emptyText: {
        fontSize: FontSizes.md,
        marginTop: Spacing.md,
        textAlign: 'center',
    },
    webWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.sm,
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.sm,
        borderRadius: BorderRadius.md,
        gap: Spacing.xs,
    },
    webWarningText: {
        fontSize: FontSizes.sm,
        flex: 1,
    },
});
