/**
 * Sources Modal
 * 
 * Full-screen modal for managing document sources (PDFs) for RAG.
 * Allows users to add, view, rename, and delete sources.
 * 
 * Lazily initializes the vector store when the modal is opened.
 */

import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../config/theme';
import { Source } from '../../../core/types';
import {
    useExecutorchRagStore,
    useModelDownloadStore,
    useRagConfigStore,
    useSourceStore
} from '../../../state';
import { useAppColorScheme, useLocale } from '../../hooks';

interface SourcesModalProps {
    visible: boolean;
    onClose: () => void;
}

export function SourcesModal({ visible, onClose }: SourcesModalProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();

    const { sources, isLoading, isProcessing, loadSources, addSource, deleteSource, reindexAllSources } = useSourceStore();
    const {
        isInitialized,
        isInitializing,
        error: ragError,
        initialize: initializeRag,
        selectedModelId,
        isStale,
        reset: resetRag,
        updateSourcesProcessedWith,
        loadPersistedState
    } = useExecutorchRagStore();
    const { getDefaultConfig, loadConfigs } = useRagConfigStore();
    const { downloadedModels } = useModelDownloadStore();

    const [initError, setInitError] = useState<string | null>(null);
    const [isReindexing, setIsReindexing] = useState(false);
    const [isLoadingState, setIsLoadingState] = useState(false);

    // Handle modal close - reset RAG state so it re-initializes on next open
    const handleClose = () => {
        console.log('[SourcesModal] Closing modal, resetting RAG state');
        resetRag();
        onClose();
    };

    // Lazy initialization of vector store when modal opens
    useEffect(() => {
        if (visible) {
            const initializeModal = async () => {
                loadSources();

                // Load persisted tracking state first
                setIsLoadingState(true);
                await loadPersistedState();
                setIsLoadingState(false);

                // Reload RAG configs to get fresh data
                await loadConfigs();
                const defaultConfig = getDefaultConfig();

                console.log('[SourcesModal] Fresh defaultConfig:', defaultConfig);

                if (!isInitialized && !isInitializing) {
                    if (defaultConfig) {
                        // Find the downloaded model for this config
                        console.log('downloadedModels', downloadedModels);
                        console.log('defaultConfig', defaultConfig);
                        const model = downloadedModels.find(m => m.id === defaultConfig.modelId);
                        console.log(model);
                        if (model) {
                            console.log('[SourcesModal] Initializing vector store with model:', model.name);
                            setInitError(null);
                            initializeRag(model, defaultConfig.provider);
                        } else {
                            setInitError('Embedding model not found or not downloaded');
                        }
                    } else {
                        setInitError('No RAG provider configured. Please configure one in Settings.');
                    }
                }
            };

            initializeModal();
        }
    }, [visible, isInitialized, isInitializing, downloadedModels, getDefaultConfig, initializeRag, loadSources, loadPersistedState, loadConfigs]);

    // Handle reprocessing sources with current model
    const handleReprocess = async () => {
        const defaultConfig = getDefaultConfig();
        if (!defaultConfig || !selectedModelId) {
            return;
        }

        console.log('[SourcesModal] Starting reprocess with current model:', selectedModelId);
        setIsReindexing(true);

        try {
            await reindexAllSources();
            // Update the current provider/model after successful reprocessing
            updateSourcesProcessedWith(defaultConfig.provider, selectedModelId);
            console.log('[SourcesModal] Reprocess complete, stale state cleared');
        } catch (e) {
            console.error('[SourcesModal] Reprocess failed:', e);
        } finally {
            setIsReindexing(false);
        }
    };

    const handleAddSource = async () => {
        // Check if vector store is ready
        if (!isInitialized) {
            Alert.alert(
                t('common.error'),
                initError || 'Vector store not initialized. Please wait or configure RAG in Settings.'
            );
            return;
        }

        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) {
                return;
            }

            const file = result.assets[0];
            const source: Omit<Source, 'id'> = {
                name: file.name || 'Untitled',
                uri: file.uri,
                fileSize: file.size || 0,
                mimeType: file.mimeType || 'application/pdf',
                addedAt: Date.now(),
            };

            const { success, isEmpty, error } = await addSource(source, file.uri);

            if (!success) {
                if (isEmpty) {
                    Alert.alert(t('common.error'), t('sources.error.empty'));
                } else {
                    Alert.alert(t('common.error'), error || t('sources.error.processing'));
                }
            }
        } catch (e) {
            console.error('[SourcesModal] Error adding source:', e);
            Alert.alert(t('common.error'), t('sources.error.processing'));
        }
    };

    const handleDeleteSource = (source: Source) => {
        Alert.alert(
            t('sources.delete.title'),
            t('sources.delete.confirm', { name: source.name }),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: () => deleteSource(source),
                },
            ]
        );
    };

    const renderSource = ({ item }: { item: Source }) => (
        <View style={[styles.sourceItem, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.sourceIcon}>
                <Ionicons name="document-text" size={24} color={colors.tint} />
            </View>
            <View style={styles.sourceInfo}>
                <Text style={[styles.sourceName, { color: colors.text }]} numberOfLines={1}>
                    {item.name}
                </Text>
                <Text style={[styles.sourceSize, { color: colors.textMuted }]}>
                    {formatFileSize(item.fileSize)}
                </Text>
            </View>
            {item.isProcessing ? (
                <ActivityIndicator size="small" color={colors.tint} />
            ) : (
                <TouchableOpacity
                    onPress={() => handleDeleteSource(item)}
                    style={styles.deleteButton}
                >
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
            )}
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="documents-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {t('sources.empty')}
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textMuted }]}>
                {t('sources.empty.description')}
            </Text>
        </View>
    );

    const renderInitStatus = () => {
        if (isInitializing) {
            return (
                <View style={[styles.statusBar, { backgroundColor: colors.tint + '20' }]}>
                    <ActivityIndicator size="small" color={colors.tint} />
                    <Text style={[styles.statusText, { color: colors.tint }]}>
                        {t('rag.initializing')}
                    </Text>
                </View>
            );
        }

        if (isReindexing) {
            return (
                <View style={[styles.statusBar, { backgroundColor: colors.tint + '20' }]}>
                    <ActivityIndicator size="small" color={colors.tint} />
                    <Text style={[styles.statusText, { color: colors.tint }]}>
                        {t('rag.reindexing') || 'Reindexing sources...'}
                    </Text>
                </View>
            );
        }

        if (isStale && sources.length > 0) {
            return (
                <View style={[styles.statusBar, { backgroundColor: colors.warning + '20' }]}>
                    <Ionicons name="warning-outline" size={18} color={colors.warning || '#F59E0B'} />
                    <Text style={[styles.statusText, { color: colors.warning || '#F59E0B', flex: 1 }]}>
                        {t('rag.stale') || 'Sources need reprocessing with new model'}
                    </Text>
                    <TouchableOpacity
                        onPress={handleReprocess}
                        style={[styles.reprocessButton, { backgroundColor: colors.tint }]}
                    >
                        <Text style={styles.reprocessButtonText}>
                            {t('rag.reprocess') || 'Reprocess'}
                        </Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (initError || ragError) {
            return (
                <View style={[styles.statusBar, { backgroundColor: colors.error + '20' }]}>
                    <Ionicons name="warning-outline" size={18} color={colors.error} />
                    <Text style={[styles.statusText, { color: colors.error }]} numberOfLines={2}>
                        {initError || ragError}
                    </Text>
                </View>
            );
        }

        if (isInitialized) {
            return (
                <View style={[styles.statusBar, { backgroundColor: colors.success + '20' }]}>
                    <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
                    <Text style={[styles.statusText, { color: colors.success }]}>
                        {t('rag.ready')}
                    </Text>
                </View>
            );
        }

        return null;
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.text }]}>
                        {t('sources.title')}
                    </Text>
                    <TouchableOpacity
                        onPress={handleAddSource}
                        disabled={isProcessing || isInitializing || isReindexing || !isInitialized}
                        style={[styles.addButton, { opacity: (isProcessing || isInitializing || isReindexing || !isInitialized) ? 0.5 : 1 }]}
                    >
                        <Ionicons name="add" size={24} color={colors.tint} />
                    </TouchableOpacity>
                </View>

                {/* Initialization Status */}
                {renderInitStatus()}

                {/* Content */}
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.tint} />
                    </View>
                ) : (
                    <FlatList
                        data={sources}
                        renderItem={renderSource}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={renderEmpty}
                    />
                )}

                {/* Processing indicator */}
                {isProcessing && (
                    <View style={[styles.processingBar, { backgroundColor: colors.tint }]}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text style={styles.processingText}>{t('sources.processing')}</Text>
                    </View>
                )}
            </SafeAreaView>
        </Modal>
    );
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
    closeButton: {
        padding: Spacing.xs,
    },
    title: {
        fontSize: FontSizes.xl,
        fontWeight: '600',
    },
    addButton: {
        padding: Spacing.xs,
    },
    statusBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        gap: Spacing.sm,
    },
    statusText: {
        fontSize: FontSizes.sm,
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: Spacing.md,
        flexGrow: 1,
    },
    sourceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.sm,
    },
    sourceIcon: {
        marginRight: Spacing.md,
    },
    sourceInfo: {
        flex: 1,
    },
    sourceName: {
        fontSize: FontSizes.md,
        fontWeight: '500',
    },
    sourceSize: {
        fontSize: FontSizes.sm,
        marginTop: 2,
    },
    deleteButton: {
        padding: Spacing.sm,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
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
    },
    processingBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.sm,
        gap: Spacing.sm,
    },
    processingText: {
        color: '#FFFFFF',
        fontSize: FontSizes.sm,
        fontWeight: '500',
    },
    reprocessButton: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm,
    },
    reprocessButtonText: {
        color: '#FFFFFF',
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
});
