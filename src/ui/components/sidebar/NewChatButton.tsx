import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../config/theme';
import { useAppColorScheme } from '../../hooks';

interface NewChatButtonProps {
    onPress: () => void;
    disabled?: boolean;
}

export function NewChatButton({ onPress, disabled = false }: NewChatButtonProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            style={[
                styles.container,
                { backgroundColor: disabled ? colors.backgroundTertiary : colors.tint }
            ]}
            activeOpacity={0.8}
        >
            <Ionicons name="add" size={20} color={disabled ? colors.textMuted : '#FFFFFF'} />
            <Text style={[styles.text, { color: disabled ? colors.textMuted : '#FFFFFF' }]}>New Chat</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        marginHorizontal: Spacing.md,
        marginVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
    text: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        marginLeft: Spacing.xs,
    },
});
