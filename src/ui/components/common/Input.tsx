import React from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TextStyle,
    useColorScheme,
    View,
    ViewStyle,
} from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../config/theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    hint?: string;
    containerStyle?: ViewStyle;
    inputStyle?: TextStyle;
    disabled?: boolean;
}

export function Input({
    value,
    onChangeText,
    placeholder,
    label,
    error,
    hint,
    containerStyle,
    inputStyle,
    disabled = false,
    multiline,
    ...rest
}: InputProps) {
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
            )}
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.textMuted}
                editable={!disabled}
                multiline={multiline}
                style={[
                    styles.input,
                    {
                        backgroundColor: colors.backgroundSecondary,
                        color: colors.text,
                        borderColor: error ? colors.error : colors.border,
                    },
                    multiline && styles.multiline,
                    disabled && { opacity: 0.5 },
                    inputStyle,
                ]}
                {...rest}
            />
            {error && (
                <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
            )}
            {hint && !error && (
                <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        marginBottom: Spacing.xs,
    },
    input: {
        fontSize: FontSizes.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    multiline: {
        minHeight: 80,
        textAlignVertical: 'top',
        paddingTop: Spacing.sm,
    },
    error: {
        fontSize: FontSizes.xs,
        marginTop: Spacing.xs,
    },
    hint: {
        fontSize: FontSizes.xs,
        marginTop: Spacing.xs,
    },
});
