import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../config/theme';
import { useAppColorScheme } from '../../hooks';

export interface SelectionOption {
    id: string;
    label: string;
    subtitle?: string;
    icon?: React.ReactNode;
    iconColor?: string;
    status?: 'online' | 'offline' | 'unknown';
    disabled?: boolean;
}

interface SelectionModalProps {
    visible: boolean;
    title: string;
    options: SelectionOption[];
    selectedId?: string | null;
    onSelect: (id: string | undefined) => void;
    onClose: () => void;
    onManagePress?: () => void;
    showNoneOption?: boolean;
    noneOptionLabel?: string;
    noneOptionSubtitle?: string;
    emptyMessage?: string;
}

export function SelectionModal({
    visible,
    title,
    options,
    selectedId,
    onSelect,
    onClose,
    onManagePress,
    showNoneOption = false,
    noneOptionLabel = 'None',
    noneOptionSubtitle,
    emptyMessage = 'No options available',
}: SelectionModalProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { width, height } = useWindowDimensions();

    const modalWidth = Math.min(width - 32, 400);
    const modalMaxHeight = height * 0.6;
    const modalMinHeight = 200;

    const handleSelect = (id: string | undefined) => {
        onSelect(id);
        onClose();
    };

    const renderStatusIndicator = (status?: 'online' | 'offline' | 'unknown') => {
        if (!status) return null;

        const statusColors = {
            online: colors.success,
            offline: colors.error,
            unknown: colors.textMuted,
        };

        return (
            <View style={[styles.statusDot, { backgroundColor: statusColors[status] }]} />
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View
                    style={[
                        styles.modalContent,
                        {
                            backgroundColor: colors.cardBackground,
                            width: modalWidth,
                            maxHeight: modalMaxHeight,
                            minHeight: modalMinHeight,
                        },
                    ]}
                    onStartShouldSetResponder={() => true}
                >
                    {/* Header */}
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {title}
                        </Text>
                        <View style={styles.headerActions}>
                            {onManagePress && (
                                <TouchableOpacity onPress={onManagePress} style={styles.manageButton}>
                                    <Ionicons name="settings-outline" size={22} color={colors.tint} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Options List */}
                    <ScrollView
                        style={styles.list}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={true}
                        nestedScrollEnabled={true}
                    >
                        {/* None Option */}
                        {showNoneOption && (
                            <TouchableOpacity
                                style={[
                                    styles.optionItem,
                                    { borderBottomColor: colors.border },
                                    !selectedId && { backgroundColor: colors.tint + '15' },
                                ]}
                                onPress={() => handleSelect(undefined)}
                            >
                                <View style={styles.optionInfo}>
                                    <Text style={[styles.optionLabel, { color: colors.text }]}>
                                        {noneOptionLabel}
                                    </Text>
                                    {noneOptionSubtitle && (
                                        <Text style={[styles.optionSubtitle, { color: colors.textMuted }]}>
                                            {noneOptionSubtitle}
                                        </Text>
                                    )}
                                </View>
                                {!selectedId && (
                                    <Ionicons name="checkmark-circle" size={20} color={colors.tint} />
                                )}
                            </TouchableOpacity>
                        )}

                        {/* Options */}
                        {options.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.optionItem,
                                    { borderBottomColor: colors.border },
                                    selectedId === option.id && { backgroundColor: colors.tint + '15' },
                                    option.disabled && { opacity: 0.5 },
                                ]}
                                onPress={() => !option.disabled && handleSelect(option.id)}
                                disabled={option.disabled}
                            >
                                {/* Icon */}
                                {option.icon && (
                                    <View style={[styles.optionIcon, { backgroundColor: option.iconColor || colors.tint }]}>
                                        {option.icon}
                                    </View>
                                )}

                                {/* Info */}
                                <View style={styles.optionInfo}>
                                    <View style={styles.labelRow}>
                                        <Text style={[styles.optionLabel, { color: colors.text }]}>
                                            {option.label}
                                        </Text>
                                        {renderStatusIndicator(option.status)}
                                    </View>
                                    {option.subtitle && (
                                        <Text style={[styles.optionSubtitle, { color: colors.textMuted }]} numberOfLines={2}>
                                            {option.subtitle}
                                        </Text>
                                    )}
                                </View>

                                {/* Checkmark */}
                                {selectedId === option.id && (
                                    <Ionicons name="checkmark-circle" size={20} color={colors.tint} />
                                )}
                            </TouchableOpacity>
                        ))}

                        {/* Empty State */}
                        {options.length === 0 && !showNoneOption && (
                            <View style={styles.emptyState}>
                                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                    {emptyMessage}
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        flex: 1,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    manageButton: {
        padding: Spacing.xs,
    },
    closeButton: {
        padding: Spacing.xs,
    },
    list: {
        flexGrow: 1,
        flexShrink: 1,
    },
    listContent: {
        paddingVertical: Spacing.xs,
        flexGrow: 1,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    optionIcon: {
        width: 36,
        height: 36,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    optionInfo: {
        flex: 1,
        marginRight: Spacing.md,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    optionLabel: {
        fontSize: FontSizes.md,
        fontWeight: '500',
    },
    optionSubtitle: {
        fontSize: FontSizes.sm,
        marginTop: 2,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    emptyState: {
        padding: Spacing.lg,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: FontSizes.sm,
        textAlign: 'center',
    },
});
