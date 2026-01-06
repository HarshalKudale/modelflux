/**
 * UserInfo - Web Implementation
 * Settings button only (no RAG sources on web)
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BorderRadius, Colors, Spacing } from '../../../config/theme';

import { useAppColorScheme } from '../../hooks';

interface UserInfoProps {
    onSettingsPress: () => void;
    onSourcesPress?: () => void;
}

export function UserInfo({ onSettingsPress }: UserInfoProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];

    return (
        <View style={[styles.container, { borderTopColor: colors.border }]}>
            <View style={styles.spacer} />

            <Pressable
                onPress={onSettingsPress}
                style={[styles.button, { backgroundColor: colors.backgroundSecondary }]}
            >
                <Ionicons name="settings-outline" size={20} color={colors.text} />
            </Pressable>
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
