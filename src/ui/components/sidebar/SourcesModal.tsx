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
import { processSource } from '../../../core/rag/sourceProcessor';
import { sourceRepository } from '../../../core/storage';
import { Source } from '../../../core/types';
import {
    useRAGRuntimeStore,
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

    // Source store (persistence only)
    const { sources, isLoading, loadSources, deleteSource } = useSourceStore();

    // RAG Runtime store
    const {
        status,
        error: ragError,
        isProcessing,
        processingProgress,
        reset: resetRag,
        loadPersistedState,
        reprocess,
        addChunks,
        ensureReady,
    } = useRAGRuntimeStore();

    const [initError, setInitError] = useState<string | null>(null);
    const [isAddingSource, setIsAddingSource] = useState(false);

    // Derived state
    const isInitializing = status === 'initializing';
    const isReady = status === 'ready';
    const isStale = status === 'stale';

    // Handle modal close - reset RAG state so it re-initializes on next open
    const handleClose = () => {
        console.log('[SourcesModal] Closing modal, resetting RAG state');
        resetRag();
        onClose();
    };

    // Lazy initialization of RAG runtime when modal opens using ensureReady
    useEffect(() => {
        if (visible) {
            const initializeModal = async () => {
                loadSources();

                // Load persisted tracking state first
                await loadPersistedState();

                // Only initialize if not already ready or stale
                if (status === 'idle' || status === 'error') {
                    console.log('[SourcesModal] Using ensureReady for initialization');
                    setInitError(null);

                    const ready = await ensureReady();
                    if (!ready) {
                        setInitError('No RAG provider configured. Please configure one in Settings.');
                    }
                } else {
                    // Clear any previous error if we're now ready/stale
                    setInitError(null);
                }
            };

            initializeModal();
        }
    }, [visible, status, ensureReady, loadSources, loadPersistedState]);

    // Handle reprocessing sources with current model
    const handleReprocess = async () => {
        console.log('[SourcesModal] Starting reprocess...');
        await reprocess();
    };

    const handleAddSource = async () => {
        // Check if RAG runtime is ready
        if (!isReady) {
            Alert.alert(
                t('common.error'),
                initError || 'RAG not ready. Please wait or configure RAG in Settings.'
            );
            return;
        }

        try {
            // Restrict to PDF and text files only
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'text/plain'],
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) {
                return;
            }

            const file = result.assets[0]!;
            setIsAddingSource(true);

            // Create source metadata
            const sourceData: Omit<Source, 'id'> = {
                name: file.name || 'Untitled',
                uri: file.uri,
                fileSize: file.size || 0,
                mimeType: file.mimeType || 'application/pdf',
                addedAt: Date.now(),
            };

            // Save to repository first
            const savedSource = await sourceRepository.create(sourceData);

            // Reload sources to show the new one
            loadSources();

            // Process the source (extract text, chunk, embed)
            const { success, isEmpty, error } = await processSource(savedSource, addChunks);

            if (!success) {
                if (isEmpty) {
                    Alert.alert(t('common.error'), t('sources.error.empty'));
                } else {
                    Alert.alert(t('common.error'), error || t('sources.error.processing'));
                }
            }

            loadSources(); // Reload to update UI
        } catch (e) {
            console.error('[SourcesModal] Error adding source:', e);
            Alert.alert(t('common.error'), t('sources.error.processing'));
        } finally {
            setIsAddingSource(false);
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

        if (isProcessing) {
            const progressText = processingProgress
                ? `Processing ${processingProgress.current}/${processingProgress.total}...`
                : 'Processing...';
            return (
                <View style={[styles.statusBar, { backgroundColor: colors.tint + '20' }]}>
                    <ActivityIndicator size="small" color={colors.tint} />
                    <Text style={[styles.statusText, { color: colors.tint }]}>
                        {progressText}
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

        // Show ready status first (prioritize success over stale errors)
        if (isReady) {
            return (
                <View style={[styles.statusBar, { backgroundColor: colors.success + '20' }]}>
                    <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
                    <Text style={[styles.statusText, { color: colors.success }]}>
                        {t('rag.ready')}
                    </Text>
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

        return null;
    };

    const canAddSource = isReady && !isProcessing && !isAddingSource;

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
                        disabled={!canAddSource}
                        style={[styles.addButton, { opacity: canAddSource ? 1 : 0.5 }]}
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

                {/* Adding source indicator */}
                {isAddingSource && (
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
