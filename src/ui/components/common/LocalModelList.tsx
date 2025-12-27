import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../config/theme';
import { LocalModel } from '../../../core/types';
import { useAppColorScheme } from '../../hooks';

interface LocalModelListProps {
    models: LocalModel[];
    defaultModelId?: string;
    // Loading state
    loadedModelId?: string;      // Currently loaded model
    isLoadingModel?: boolean;    // Is any model loading
    loadingModelId?: string;     // Which model is loading
    loadError?: string | null;   // Load error message
    // Callbacks
    onSetDefault: (modelId: string) => void;
    onDeleteModel: (modelId: string) => void;
    onLoadModel?: (modelId: string) => void;    // Load callback
    onUnloadModel?: () => void;                  // Unload callback
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Component for displaying and managing local models
 */
export function LocalModelList({
    models,
    defaultModelId,
    loadedModelId,
    isLoadingModel,
    loadingModelId,
    loadError,
    onSetDefault,
    onDeleteModel,
    onLoadModel,
    onUnloadModel,
}: LocalModelListProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];

    if (models.length === 0) {
        return (
            <View style={[styles.emptyContainer, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="folder-open-outline" size={40} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    No models added yet
                </Text>
                <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
                    Add a model file to get started
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {models.map((model) => {
                const isDefault = model.id === defaultModelId;
                const isLoaded = model.id === loadedModelId;
                const isThisLoading = model.id === loadingModelId && isLoadingModel;
                const hasError = model.status === 'error';
                const hasLoadError = isLoaded && loadError;

                return (
                    <View
                        key={model.id}
                        style={[
                            styles.modelItem,
                            {
                                backgroundColor: colors.cardBackground,
                                borderColor: hasError || hasLoadError
                                    ? colors.error
                                    : isLoaded
                                        ? colors.success
                                        : colors.border,
                                borderWidth: isLoaded ? 2 : 1,
                            },
                        ]}
                    >
                        {/* Radio button for default selection */}
                        <TouchableOpacity
                            style={styles.radioButton}
                            onPress={() => onSetDefault(model.id)}
                            disabled={hasError}
                        >
                            <View
                                style={[
                                    styles.radioOuter,
                                    {
                                        borderColor: hasError
                                            ? colors.textMuted
                                            : isDefault
                                                ? colors.tint
                                                : colors.border,
                                    },
                                ]}
                            >
                                {isDefault && (
                                    <View
                                        style={[styles.radioInner, { backgroundColor: colors.tint }]}
                                    />
                                )}
                            </View>
                        </TouchableOpacity>

                        {/* Model info */}
                        <View style={styles.modelInfo}>
                            <View style={styles.modelHeader}>
                                <Text
                                    style={[
                                        styles.modelName,
                                        { color: hasError ? colors.error : colors.text },
                                    ]}
                                    numberOfLines={1}
                                >
                                    {model.name}
                                </Text>
                                <View
                                    style={[
                                        styles.formatBadge,
                                        { backgroundColor: colors.backgroundTertiary },
                                    ]}
                                >
                                    <Text style={[styles.formatText, { color: colors.textSecondary }]}>
                                        .{model.format}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.modelMeta}>
                                <Text style={[styles.fileSize, { color: colors.textMuted }]}>
                                    {formatFileSize(model.fileSize)}
                                </Text>

                                {/* Status indicator */}
                                <View style={styles.statusContainer}>
                                    {isThisLoading ? (
                                        <View style={styles.statusRow}>
                                            <ActivityIndicator size="small" color={colors.tint} />
                                            <Text style={[styles.statusText, { color: colors.tint }]}>
                                                Loading...
                                            </Text>
                                        </View>
                                    ) : hasLoadError ? (
                                        <View style={styles.statusRow}>
                                            <Ionicons name="alert-circle" size={14} color={colors.error} />
                                            <Text style={[styles.statusText, { color: colors.error }]} numberOfLines={1}>
                                                {loadError}
                                            </Text>
                                        </View>
                                    ) : isLoaded ? (
                                        <View style={styles.statusRow}>
                                            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                                            <Text style={[styles.statusText, { color: colors.success }]}>
                                                Loaded
                                            </Text>
                                        </View>
                                    ) : hasError ? (
                                        <View style={styles.statusRow}>
                                            <Ionicons name="alert-circle" size={14} color={colors.error} />
                                            <Text style={[styles.statusText, { color: colors.error }]}>
                                                {model.errorMessage || 'Error'}
                                            </Text>
                                        </View>
                                    ) : (
                                        <View style={styles.statusRow}>
                                            <Ionicons name="ellipse-outline" size={14} color={colors.textMuted} />
                                            <Text style={[styles.statusText, { color: colors.textMuted }]}>
                                                Not Loaded
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* Action buttons */}
                        <View style={styles.actionButtons}>
                            {/* Load/Unload button */}
                            {onLoadModel && onUnloadModel && (
                                isLoaded ? (
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.unloadButton]}
                                        onPress={onUnloadModel}
                                        disabled={isThisLoading}
                                    >
                                        <Text style={styles.unloadButtonText}>Unload</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        style={[
                                            styles.actionButton,
                                            styles.loadButton,
                                            { backgroundColor: colors.tint },
                                            (isThisLoading || isLoadingModel) && styles.disabledButton,
                                        ]}
                                        onPress={() => onLoadModel(model.id)}
                                        disabled={isThisLoading || hasError || isLoadingModel}
                                    >
                                        {isThisLoading ? (
                                            <ActivityIndicator size="small" color="#FFFFFF" />
                                        ) : (
                                            <Text style={styles.loadButtonText}>Load</Text>
                                        )}
                                    </TouchableOpacity>
                                )
                            )}

                            {/* Delete button */}
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => onDeleteModel(model.id)}
                                disabled={isLoaded || isThisLoading}
                            >
                                <Ionicons
                                    name="trash-outline"
                                    size={18}
                                    color={isLoaded || isThisLoading ? colors.textMuted : colors.error}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: Spacing.sm,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
        borderRadius: BorderRadius.md,
    },
    emptyText: {
        fontSize: FontSizes.md,
        fontWeight: '500',
        marginTop: Spacing.sm,
    },
    emptyHint: {
        fontSize: FontSizes.sm,
        marginTop: Spacing.xs,
    },
    modelItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    radioButton: {
        marginRight: Spacing.md,
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    modelInfo: {
        flex: 1,
    },
    modelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    modelName: {
        fontSize: FontSizes.md,
        fontWeight: '500',
        flex: 1,
    },
    formatBadge: {
        paddingHorizontal: Spacing.xs,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
    },
    formatText: {
        fontSize: FontSizes.xs,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    modelMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.xs,
        gap: Spacing.md,
    },
    fileSize: {
        fontSize: FontSizes.sm,
    },
    statusContainer: {
        flex: 1,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statusText: {
        fontSize: FontSizes.sm,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    actionButton: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm,
        minWidth: 60,
        alignItems: 'center',
    },
    loadButton: {
        // backgroundColor set dynamically
    },
    loadButtonText: {
        color: '#FFFFFF',
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
    unloadButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#DC2626',
    },
    unloadButtonText: {
        color: '#DC2626',
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.5,
    },
    deleteButton: {
        padding: Spacing.xs,
    },
});
