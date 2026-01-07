import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontSizes, Spacing } from '../../../config/theme';
import { Conversation } from '../../../core/types';
import { useAppColorScheme } from '../../hooks';
import { VirtualizedList } from '../common';
import { ConversationItem } from './ConversationItem';

interface ConversationListProps {
    conversations: Conversation[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
}

export function ConversationList({
    conversations,
    selectedId,
    onSelect,
    onDelete,
}: ConversationListProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];

    if (conversations.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    No conversations yet
                </Text>
            </View>
        );
    }

    return (
        <VirtualizedList<Conversation>
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <ConversationItem
                    conversation={item}
                    isSelected={item.id === selectedId}
                    onPress={() => onSelect(item.id)}
                    onDelete={() => onDelete(item.id)}
                />
            )}
            contentContainerStyle={styles.listContent}
        />
    );
}

const styles = StyleSheet.create({
    list: {
        flex: 1,
    },
    listContent: {
        paddingVertical: Spacing.sm,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    emptyText: {
        fontSize: FontSizes.sm,
        textAlign: 'center',
    },
});
