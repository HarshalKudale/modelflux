import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../config/theme';
import { useAppColorScheme } from '../../hooks';

interface SettingsSectionProps {
    title: string;
    children: React.ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: colors.textSecondary }]}>
                {title}
            </Text>
            <View
                style={[
                    styles.content,
                    { backgroundColor: colors.cardBackground, borderColor: colors.border },
                ]}
            >
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: FontSizes.xs,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xs,
    },
    content: {
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        overflow: 'hidden',
    },
});
