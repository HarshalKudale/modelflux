/**
 * ResponsiveContainer
 * 
 * A wrapper component that applies max-width constraints on web
 * to prevent content from stretching too wide on large screens.
 * On native platforms, it renders children without constraints.
 */
import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { Layout } from '../../../config/theme';

interface ResponsiveContainerProps {
    children: React.ReactNode;
    /** Maximum width on web. Defaults to Layout.contentMaxWidth (720) */
    maxWidth?: number;
    /** Additional styles for the container */
    style?: ViewStyle;
}

export function ResponsiveContainer({
    children,
    maxWidth = Layout.contentMaxWidth,
    style
}: ResponsiveContainerProps) {
    if (Platform.OS !== 'web') {
        // On native, just render children without wrapper overhead
        return <>{children}</>;
    }

    return (
        <View style={[styles.container, { maxWidth }, style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignSelf: 'center',
    },
});
