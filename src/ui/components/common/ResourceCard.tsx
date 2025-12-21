import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../config/theme';
import { useAppColorScheme, useLocale } from '../../hooks';

interface ResourceCardProps {
    title: string;
    subtitle?: string;
    description?: string;
    icon?: React.ReactNode;
    iconColor?: string;
    isDefault?: boolean;
    showDefaultBadge?: boolean;
    onPress: () => void;
    onTest?: () => Promise<boolean>;
    onSetDefault?: () => void;
    onDelete: () => void;
    testLabel?: string;
    defaultLabel?: string;
    deleteLabel?: string;
}

export function ResourceCard({
    title,
    subtitle,
    description,
    icon,
    iconColor = '#007AFF',
    isDefault = false,
    showDefaultBadge = true,
    onPress,
    onTest,
    onSetDefault,
    onDelete,
    testLabel = 'Test',
    defaultLabel,
    deleteLabel = 'Delete',
}: ResourceCardProps) {
    const [isTesting, setIsTesting] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();

    const handleTest = async () => {
        if (!onTest) return;
        setIsTesting(true);
        setTestStatus('idle');
        const success = await onTest();
        setTestStatus(success ? 'success' : 'error');
        setIsTesting(false);
        // Reset status after 3 seconds
        setTimeout(() => setTestStatus('idle'), 3000);
    };

    return (
        <TouchableOpacity
            style={[
                styles.container,
                {
                    backgroundColor: colors.cardBackground,
                    borderColor: isDefault && showDefaultBadge ? colors.tint + '40' : colors.border
                },
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.header}>
                {/* Icon */}
                {icon && (
                    <View style={[styles.iconContainer, { backgroundColor: iconColor }]}>
                        {icon}
                    </View>
                )}

                {/* Info */}
                <View style={styles.info}>
                    <View style={styles.titleRow}>
                        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                            {title}
                        </Text>
                        {isDefault && showDefaultBadge && (
                            <View style={[styles.defaultBadge, { backgroundColor: colors.tint + '20' }]}>
                                <Text style={[styles.defaultBadgeText, { color: colors.tint }]}>
                                    DEFAULT
                                </Text>
                            </View>
                        )}
                    </View>
                    {subtitle && (
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                            {subtitle}
                        </Text>
                    )}
                    {description && (
                        <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={2}>
                            {description}
                        </Text>
                    )}
                </View>
            </View>

            {/* Actions */}
            <View style={[styles.actions, { borderTopColor: colors.border }]}>
                {/* Test Button */}
                {onTest && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleTest}
                        disabled={isTesting}
                    >
                        {isTesting ? (
                            <ActivityIndicator size="small" color={colors.tint} />
                        ) : (
                            <>
                                <Ionicons
                                    name={
                                        testStatus === 'success'
                                            ? 'checkmark-circle'
                                            : testStatus === 'error'
                                                ? 'close-circle'
                                                : 'wifi'
                                    }
                                    size={16}
                                    color={
                                        testStatus === 'success'
                                            ? colors.success
                                            : testStatus === 'error'
                                                ? colors.error
                                                : colors.textSecondary
                                    }
                                />
                                <Text
                                    style={[
                                        styles.actionText,
                                        {
                                            color:
                                                testStatus === 'success'
                                                    ? colors.success
                                                    : testStatus === 'error'
                                                        ? colors.error
                                                        : colors.textSecondary,
                                        },
                                    ]}
                                >
                                    {testStatus === 'success'
                                        ? t('common.success')
                                        : testStatus === 'error'
                                            ? 'Failed'
                                            : testLabel}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {/* Default Button */}
                {onSetDefault && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={onSetDefault}
                        disabled={isDefault}
                    >
                        <Ionicons
                            name={isDefault ? 'checkmark-circle' : 'star-outline'}
                            size={16}
                            color={isDefault ? colors.tint : colors.textSecondary}
                        />
                        <Text
                            style={[
                                styles.actionText,
                                { color: isDefault ? colors.tint : colors.textSecondary },
                            ]}
                        >
                            {isDefault
                                ? (defaultLabel || t('settings.personas.isDefault'))
                                : (defaultLabel || t('settings.personas.setDefault'))}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Delete Button */}
                <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                    <Text style={[styles.actionText, { color: colors.error }]}>
                        {deleteLabel}
                    </Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginBottom: Spacing.md,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: Spacing.md,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    info: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        flexWrap: 'wrap',
    },
    title: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
    },
    defaultBadge: {
        paddingHorizontal: Spacing.xs,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
    },
    defaultBadgeText: {
        fontSize: FontSizes.xs,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: FontSizes.sm,
        marginTop: 2,
    },
    description: {
        fontSize: FontSizes.sm,
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        paddingHorizontal: Spacing.sm,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.sm,
        gap: Spacing.xs,
    },
    actionText: {
        fontSize: FontSizes.sm,
        fontWeight: '500',
    },
});
