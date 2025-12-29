import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, Spacing } from '../../../config/theme';
import { useSettingsStore } from '../../../state';
import { useAppColorScheme } from '../../hooks';

interface UserInfoProps {
    onSettingsPress: () => void;
    onSourcesPress?: () => void;
}

export function UserInfo({ onSettingsPress, onSourcesPress }: UserInfoProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];

    // Check if RAG is enabled in settings
    const ragSettings = useSettingsStore((state) => state.settings.ragSettings);
    const isRagEnabled = ragSettings?.isEnabled && Platform.OS !== 'web';

    return (
        <View style={[styles.container, { borderTopColor: colors.border }]}>
            {/* Sources button - only show when RAG is enabled */}
            {isRagEnabled && onSourcesPress && (
                <TouchableOpacity
                    onPress={onSourcesPress}
                    style={[styles.button, { backgroundColor: colors.backgroundSecondary }]}
                >
                    <Ionicons name="documents-outline" size={20} color={colors.text} />
                </TouchableOpacity>
            )}

            {/* Spacer to push settings to the right */}
            <View style={styles.spacer} />

            {/* Settings button */}
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
