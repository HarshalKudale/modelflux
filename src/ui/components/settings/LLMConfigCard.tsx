import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { PROVIDER_INFO } from '../../../config/providerPresets';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../config/theme';
import { LLMConfig } from '../../../core/types';
import { useAppColorScheme } from '../../hooks';

interface LLMConfigCardProps {
    config: LLMConfig;
    onEdit: () => void;
    onDelete: () => void;
    onToggleEnabled: (enabled: boolean) => void;
    onTestConnection: () => Promise<boolean>;
}

export function LLMConfigCard({
    config,
    onEdit,
    onDelete,
    onToggleEnabled,
    onTestConnection,
}: LLMConfigCardProps) {
    const [isTesting, setIsTesting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];

    const providerInfo = PROVIDER_INFO[config.provider] || PROVIDER_INFO.openai;

    const handleTestConnection = async () => {
        setIsTesting(true);
        setConnectionStatus('idle');
        const success = await onTestConnection();
        setConnectionStatus(success ? 'success' : 'error');
        setIsTesting(false);

        // Reset status after 3 seconds
        setTimeout(() => setConnectionStatus('idle'), 3000);
    };

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: colors.cardBackground, borderColor: colors.border },
            ]}
        >
            <View style={styles.header}>
                <View
                    style={[
                        styles.providerIcon,
                        { backgroundColor: providerInfo.color },
                    ]}
                >
                    <Text style={styles.providerIconText}>
                        {config.provider.charAt(0).toUpperCase()}
                    </Text>
                </View>

                <View style={styles.info}>
                    <View style={styles.titleRow}>
                        <Text style={[styles.name, { color: colors.text }]}>{config.name}</Text>
                        {config.isLocal && (
                            <View style={[styles.localBadge, { backgroundColor: colors.backgroundTertiary }]}>
                                <Text style={[styles.localBadgeText, { color: colors.textSecondary }]}>
                                    Local
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.provider, { color: colors.textSecondary }]}>
                        {providerInfo.displayName}
                    </Text>
                    <Text style={[styles.detail, { color: colors.textMuted }]} numberOfLines={1}>
                        {config.baseUrl}
                    </Text>
                    <Text style={[styles.detail, { color: colors.textMuted }]}>
                        Model: {config.defaultModel}
                    </Text>
                </View>

                <Switch
                    value={config.isEnabled}
                    onValueChange={onToggleEnabled}
                    trackColor={{ false: colors.backgroundTertiary, true: colors.tint + '60' }}
                    thumbColor={config.isEnabled ? colors.tint : colors.textMuted}
                />
            </View>

            <View style={[styles.actions, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleTestConnection}
                    disabled={isTesting}
                >
                    {isTesting ? (
                        <ActivityIndicator size="small" color={colors.tint} />
                    ) : (
                        <>
                            <Ionicons
                                name={
                                    connectionStatus === 'success'
                                        ? 'checkmark-circle'
                                        : connectionStatus === 'error'
                                            ? 'close-circle'
                                            : 'wifi'
                                }
                                size={16}
                                color={
                                    connectionStatus === 'success'
                                        ? colors.success
                                        : connectionStatus === 'error'
                                            ? colors.error
                                            : colors.textSecondary
                                }
                            />
                            <Text
                                style={[
                                    styles.actionText,
                                    {
                                        color:
                                            connectionStatus === 'success'
                                                ? colors.success
                                                : connectionStatus === 'error'
                                                    ? colors.error
                                                    : colors.textSecondary,
                                    },
                                ]}
                            >
                                {connectionStatus === 'success'
                                    ? 'Connected'
                                    : connectionStatus === 'error'
                                        ? 'Failed'
                                        : 'Test'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
                    <Ionicons name="pencil" size={16} color={colors.textSecondary} />
                    <Text style={[styles.actionText, { color: colors.textSecondary }]}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                    <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
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
    providerIcon: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    providerIconText: {
        color: '#FFFFFF',
        fontSize: FontSizes.xl,
        fontWeight: '700',
    },
    info: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    name: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
    },
    localBadge: {
        paddingHorizontal: Spacing.xs,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
    },
    localBadgeText: {
        fontSize: FontSizes.xs,
        fontWeight: '500',
    },
    provider: {
        fontSize: FontSizes.sm,
        marginTop: 2,
    },
    detail: {
        fontSize: FontSizes.xs,
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
