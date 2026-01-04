/**
 * UserInfo - Native Implementation
 * Settings and RAG sources buttons
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, Spacing } from '../../../config/theme';
import { useRagConfigStore } from '../../../state';
import { useAppColorScheme } from '../../hooks';

interface UserInfoProps {
    onSettingsPress: () => void;
    onSourcesPress?: () => void;
}

export function UserInfo({ onSettingsPress, onSourcesPress }: UserInfoProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];

    const ragConfigs = useRagConfigStore((state) => state.configs);
    const hasRagProvider = ragConfigs.length > 0;

    return (
        <View style={[styles.container, { borderTopColor: colors.border }]}>
            {hasRagProvider && onSourcesPress && (
                <TouchableOpacity
                    onPress={onSourcesPress}
                    style={[styles.button, { backgroundColor: colors.backgroundSecondary }]}
                >
                    <Ionicons name="documents-outline" size={20} color={colors.text} />
                </TouchableOpacity>
            )}

            <View style={styles.spacer} />


            <TouchableOpacity
                onPress={onSettingsPress}
                style={[styles.button, { backgroundColor: colors.backgroundSecondary }]}
            >
                <Ionicons name="settings-outline" size={20} color={colors.text} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderTopWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    spacer: {
        flex: 1,
    },
    button: {
        padding: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
});
