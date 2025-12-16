import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../config/theme';

interface NewChatButtonProps {
    onPress: () => void;
}

export function NewChatButton({ onPress }: NewChatButtonProps) {
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.container, { backgroundColor: colors.tint }]}
            activeOpacity={0.8}
        >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.text}>New Chat</Text>
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
        color: '#FFFFFF',
        fontSize: FontSizes.md,
        fontWeight: '600',
        marginLeft: Spacing.xs,
    },
});
