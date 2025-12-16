import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    useColorScheme,
    View,
    ViewStyle,
} from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../config/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
    icon?: keyof typeof Ionicons.glyphMap;
    iconPosition?: 'left' | 'right';
    style?: ViewStyle;
    textStyle?: TextStyle;
    fullWidth?: boolean;
}

export function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon,
    iconPosition = 'left',
    style,
    textStyle,
    fullWidth = false,
}: ButtonProps) {
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];

    const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
        switch (variant) {
            case 'primary':
                return {
                    container: {
                        backgroundColor: disabled ? colors.textMuted : colors.tint,
                    },
                    text: { color: '#FFFFFF' },
                };
            case 'secondary':
                return {
                    container: {
                        backgroundColor: colors.backgroundSecondary,
                        borderWidth: 1,
                        borderColor: colors.border,
                    },
                    text: { color: colors.text },
                };
            case 'danger':
                return {
                    container: {
                        backgroundColor: disabled ? colors.textMuted : colors.error,
                    },
                    text: { color: '#FFFFFF' },
                };
            case 'ghost':
                return {
                    container: {
                        backgroundColor: 'transparent',
                    },
                    text: { color: disabled ? colors.textMuted : colors.tint },
                };
        }
    };

    const getSizeStyles = (): { container: ViewStyle; text: TextStyle; iconSize: number } => {
        switch (size) {
            case 'sm':
                return {
                    container: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
                    text: { fontSize: FontSizes.sm },
                    iconSize: 14,
                };
            case 'md':
                return {
                    container: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
                    text: { fontSize: FontSizes.md },
                    iconSize: 18,
                };
            case 'lg':
                return {
                    container: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
                    text: { fontSize: FontSizes.lg },
                    iconSize: 22,
                };
        }
    };

    const variantStyles = getVariantStyles();
    const sizeStyles = getSizeStyles();

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            style={[
                styles.container,
                variantStyles.container,
                sizeStyles.container,
                fullWidth && styles.fullWidth,
                style,
            ]}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator color={variantStyles.text.color} size="small" />
            ) : (
                <View style={styles.content}>
                    {icon && iconPosition === 'left' && (
                        <Ionicons
                            name={icon}
                            size={sizeStyles.iconSize}
                            color={variantStyles.text.color as string}
                            style={styles.iconLeft}
                        />
                    )}
                    <Text style={[styles.text, variantStyles.text, sizeStyles.text, textStyle]}>
                        {title}
                    </Text>
                    {icon && iconPosition === 'right' && (
                        <Ionicons
                            name={icon}
                            size={sizeStyles.iconSize}
                            color={variantStyles.text.color as string}
                            style={styles.iconRight}
                        />
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    fullWidth: {
        width: '100%',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontWeight: '600',
    },
    iconLeft: {
        marginRight: Spacing.xs,
    },
    iconRight: {
        marginLeft: Spacing.xs,
    },
});
