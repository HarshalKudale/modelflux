import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';
import { BorderRadius, Colors, Spacing } from '../../../config/theme';

interface UserInfoProps {
    onSettingsPress: () => void;
}

export function UserInfo({ onSettingsPress }: UserInfoProps) {
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];

    return (
        <View style={[styles.container, { borderTopColor: colors.border }]}>
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
        justifyContent: 'flex-end',
    },
    button: {
        padding: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
});
