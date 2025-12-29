/**
 * Source Selector
 * 
 * Modal/popover for selecting active sources to use as context in chat.
 * Shows available sources with checkboxes for multi-select.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../config/theme';
import { Source } from '../../../core/types';
import { useSourceStore } from '../../../state';
import { useAppColorScheme, useLocale } from '../../hooks';

interface SourceSelectorProps {
    visible: boolean;
    onClose: () => void;
    selectedSourceIds: number[];
    onSourceToggle: (sourceId: number) => void;
    onClearSelection: () => void;
}

export function SourceSelector({
    visible,
    onClose,
    selectedSourceIds,
    onSourceToggle,
    onClearSelection,
}: SourceSelectorProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();

    const { sources } = useSourceStore();

    const renderSource = ({ item }: { item: Source }) => {
        const isSelected = selectedSourceIds.includes(item.id);

        return (
            <TouchableOpacity
                style={[
                    styles.sourceItem,
                    { backgroundColor: isSelected ? colors.tint + '20' : colors.backgroundSecondary },
                ]}
                onPress={() => onSourceToggle(item.id)}
            >
                <View style={styles.checkbox}>
                    {isSelected ? (
                        <Ionicons name="checkbox" size={24} color={colors.tint} />
                    ) : (
                        <Ionicons name="square-outline" size={24} color={colors.textMuted} />
                    )}
                </View>
                <View style={styles.sourceIcon}>
                    <Ionicons name="document-text" size={20} color={colors.tint} />
                </View>
                <Text style={[styles.sourceName, { color: colors.text }]} numberOfLines={1}>
                    {item.name}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="documents-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {t('sources.empty')}
            </Text>
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.background }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.title, { color: colors.text }]}>
                            {t('chat.sources.title')}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Selection info */}
                    {selectedSourceIds.length > 0 && (
                        <View style={[styles.selectionBar, { backgroundColor: colors.backgroundSecondary }]}>
                            <Text style={[styles.selectionText, { color: colors.text }]}>
                                {t('chat.sources.selected', { count: selectedSourceIds.length })}
                            </Text>
                            <TouchableOpacity onPress={onClearSelection}>
                                <Text style={[styles.clearText, { color: colors.tint }]}>
                                    {t('chat.sources.clear')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Sources list */}
                    <FlatList
                        data={sources.filter(s => !s.isProcessing)}
                        renderItem={renderSource}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={renderEmpty}
                    />

                    {/* Done button */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.doneButton, { backgroundColor: colors.tint }]}
                            onPress={onClose}
                        >
                            <Text style={styles.doneButtonText}>
                                {t('common.ok')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        maxHeight: '70%',
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
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
    closeButton: {
        padding: Spacing.xs,
    },
    selectionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    selectionText: {
        fontSize: FontSizes.sm,
    },
    clearText: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
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
    checkbox: {
        marginRight: Spacing.sm,
    },
    sourceIcon: {
        marginRight: Spacing.sm,
    },
    sourceName: {
        flex: 1,
        fontSize: FontSizes.md,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    emptyText: {
        fontSize: FontSizes.md,
        marginTop: Spacing.sm,
    },
    footer: {
        padding: Spacing.md,
    },
    doneButton: {
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    doneButtonText: {
        color: '#FFFFFF',
        fontSize: FontSizes.md,
        fontWeight: '600',
    },
});
