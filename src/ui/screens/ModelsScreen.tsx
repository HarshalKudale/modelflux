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
import { EXECUTORCH_MODELS, ExecutorchModel } from '../../config/executorchModels';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../config/theme';
import { useModelDownloadStore } from '../../state';
import { useAppColorScheme, useLocale } from '../hooks';

type FilterType = 'all' | 'downloading' | 'downloaded' | 'llama' | 'qwen' | 'smollm';

interface ModelsScreenProps {
    onBack: () => void;
}

export function ModelsScreen({ onBack }: ModelsScreenProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<FilterType>('all');

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
        let models = [...EXECUTORCH_MODELS];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            models = models.filter(
                (m) =>
                    m.name.toLowerCase().includes(query) ||
                    m.description.toLowerCase().includes(query)
            );
        }

        // Apply category filter
        switch (filter) {
            case 'downloading':
                models = models.filter((m) => isDownloading(m.id));
                break;
            case 'downloaded':
                models = models.filter((m) => isDownloaded(m.id));
                break;
            case 'llama':
                models = models.filter((m) => m.category === 'llama');
                break;
            case 'qwen':
                models = models.filter((m) => m.category === 'qwen');
                break;
            case 'smollm':
                models = models.filter((m) => m.category === 'smollm');
                break;
            default:
                break;
        }

        // Sort: downloading models first, then by name
        models.sort((a, b) => {
            const aDownloading = isDownloading(a.id);
            const bDownloading = isDownloading(b.id);
            if (aDownloading && !bDownloading) return -1;
            if (!aDownloading && bDownloading) return 1;
            return a.name.localeCompare(b.name);
        });

        return models;
    }, [searchQuery, filter, activeDownloads, downloadedModels]);

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

    // Render filter chip
    const renderFilterChip = (filterValue: FilterType, label: string) => {
        const isActive = filter === filterValue;
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
                onPress={() => setFilter(filterValue)}
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
                                    {t('models.tag.executorch')}
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
                        {model.sizeEstimate}
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
                <View style={styles.placeholder} />
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

            {/* Filter Chips */}
            <View style={styles.filterContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={[
                        { value: 'all' as FilterType, label: t('models.filter.all') },
                        { value: 'downloading' as FilterType, label: t('models.filter.downloading') },
                        { value: 'downloaded' as FilterType, label: t('models.filter.downloaded') },
                        { value: 'llama' as FilterType, label: 'LLaMA' },
                        { value: 'qwen' as FilterType, label: 'Qwen' },
                        { value: 'smollm' as FilterType, label: 'SmolLM' },
                    ]}
                    keyExtractor={(item) => item.value}
                    renderItem={({ item }) =>
                        renderFilterChip(item.value, item.label)
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
