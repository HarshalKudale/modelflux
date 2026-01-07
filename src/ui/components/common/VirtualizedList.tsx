/**
 * VirtualizedList Component
 * 
 * A reusable wrapper around FlashList for improved performance.
 * FlashList v2 provides up to 5x faster rendering through view recycling
 * and automatic item measurement.
 */

import { FlashList, FlashListProps, FlashListRef } from '@shopify/flash-list';
import React, { forwardRef, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontSizes, Spacing } from '../../../config/theme';
import { useAppColorScheme } from '../../hooks';

export interface VirtualizedListProps<T> extends FlashListProps<T> {
    /** Empty state text when no data */
    emptyText?: string;
}

/**
 * VirtualizedList wraps FlashList with sensible defaults for the app.
 * Use this instead of FlatList for better performance with large datasets.
 * 
 * FlashList v2 automatically measures items, no estimatedItemSize needed.
 */
function VirtualizedListInner<T>(
    {
        data,
        renderItem,
        keyExtractor,
        emptyText,
        ListEmptyComponent,
        showsVerticalScrollIndicator = false,
        ...rest
    }: VirtualizedListProps<T>,
    ref: React.ForwardedRef<FlashListRef<T>>
) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];

    // Memoize the empty component for performance
    const renderEmpty = useCallback(() => {
        if (ListEmptyComponent) {
            return typeof ListEmptyComponent === 'function'
                ? <ListEmptyComponent />
                : ListEmptyComponent;
        }
        if (emptyText) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                        {emptyText}
                    </Text>
                </View>
            );
        }
        return null;
    }, [ListEmptyComponent, emptyText, colors.textMuted]);

    return (
        <FlashList<T>
            ref={ref}
            data={data}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={showsVerticalScrollIndicator}
            {...rest}
        />
    );
}

// Use forwardRef with proper generic typing
export const VirtualizedList = forwardRef(VirtualizedListInner) as <T>(
    props: VirtualizedListProps<T> & { ref?: React.ForwardedRef<FlashListRef<T>> }
) => React.ReactElement;

const styles = StyleSheet.create({
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    emptyText: {
        fontSize: FontSizes.md,
        textAlign: 'center',
    },
});
