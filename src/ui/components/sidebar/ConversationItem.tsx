import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../config/theme';
import { Conversation } from '../../../core/types';
import { useAppColorScheme } from '../../hooks';

interface ConversationItemProps {
    conversation: Conversation;
    isSelected: boolean;
    onPress: () => void;
    onDelete: () => void;
}

export const ConversationItem = memo(function ConversationItem({
    conversation,
    isSelected,
    onPress,
    onDelete,
}: ConversationItemProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];

    const formatDate = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const day = 24 * 60 * 60 * 1000;

        if (diff < day) {
            return new Date(timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            });
        }
        if (diff < 7 * day) {
            return new Date(timestamp).toLocaleDateString([], { weekday: 'short' });
        }
        return new Date(timestamp).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.container,
                {
                    backgroundColor: isSelected ? colors.sidebarActive : 'transparent',
                },
            ]}
            activeOpacity={0.7}
        >
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons
                        name="chatbubble-outline"
                        size={18}
                        color={isSelected ? colors.tint : colors.textSecondary}
                    />
                </View>
                <View style={styles.textContainer}>
                    <Text
                        style={[
                            styles.title,
                            { color: isSelected ? colors.tint : colors.text },
                        ]}
                        numberOfLines={1}
                    >
                        {conversation.title}
                    </Text>
                    <Text style={[styles.date, { color: colors.textMuted }]}>
                        {formatDate(conversation.updatedAt)}
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                onPress={(e) => {
                    e.stopPropagation?.();
                    onDelete();
                }}
                style={styles.deleteButton}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
                <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        marginHorizontal: Spacing.sm,
        marginVertical: 2,
        borderRadius: BorderRadius.md,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        marginRight: Spacing.sm,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: FontSizes.md,
        fontWeight: '500',
    },
    date: {
        fontSize: FontSizes.xs,
        marginTop: 2,
    },
    deleteButton: {
        padding: Spacing.xs,
        marginLeft: Spacing.sm,
        opacity: 0.6,
    },
});
