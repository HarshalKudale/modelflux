import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../config/theme';
import { Message } from '../../../core/types';
import { useLLMStore } from '../../../state';

interface MessageBubbleProps {
    message: Message;
    showLLMBadge?: boolean;
}

export const MessageBubble = memo(function MessageBubble({
    message,
    showLLMBadge = true,
}: MessageBubbleProps) {
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];
    const { getConfigById } = useLLMStore();

    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    const llmConfig = message.llmIdUsed ? getConfigById(message.llmIdUsed) : null;

    const getBubbleStyle = () => {
        if (isUser) {
            return {
                backgroundColor: colors.userBubble,
                alignSelf: 'flex-end' as const,
            };
        }
        if (isSystem) {
            return {
                backgroundColor: colors.systemBubble,
                alignSelf: 'center' as const,
            };
        }
        return {
            backgroundColor: colors.assistantBubble,
            alignSelf: 'flex-start' as const,
        };
    };

    const getTextColor = () => {
        if (isUser) return colors.userBubbleText;
        if (isSystem) return colors.systemBubbleText;
        return colors.assistantBubbleText;
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <View
            style={[
                styles.container,
                isUser && styles.userContainer,
            ]}
        >
            <View style={[styles.bubble, getBubbleStyle()]}>
                {/* LLM Badge for assistant messages */}
                {showLLMBadge && !isUser && !isSystem && llmConfig && (
                    <View style={[styles.llmBadge, { backgroundColor: colors.backgroundTertiary }]}>
                        <Text style={[styles.llmBadgeText, { color: colors.textSecondary }]}>
                            {llmConfig.name} • {message.modelUsed}
                        </Text>
                    </View>
                )}

                {/* Message content */}
                <Text
                    style={[styles.content, { color: getTextColor() }]}
                    selectable
                >
                    {message.content}
                </Text>

                {/* Images */}
                {message.contentType === 'mixed' && message.images && message.images.length > 0 && (
                    <View style={styles.imageContainer}>
                        {message.images.map((image) => (
                            <TouchableOpacity key={image.id} style={styles.imageWrapper}>
                                <Image
                                    source={{ uri: image.url }}
                                    style={styles.image}
                                    resizeMode="cover"
                                />
                                {image.revisedPrompt && (
                                    <Text
                                        style={[styles.imageCaption, { color: colors.textMuted }]}
                                        numberOfLines={2}
                                    >
                                        {image.revisedPrompt}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Timestamp and actions */}
                <View style={styles.footer}>
                    <Text style={[styles.timestamp, { color: colors.textMuted }]}>
                        {formatTime(message.timestamp)}
                    </Text>
                    {!isSystem && (
                        <TouchableOpacity style={styles.copyButton}>
                            <Ionicons name="copy-outline" size={14} color={colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        maxWidth: '85%',
    },
    userContainer: {
        alignSelf: 'flex-end',
    },
    bubble: {
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        maxWidth: '100%',
    },
    llmBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
        alignSelf: 'flex-start',
        marginBottom: Spacing.xs,
    },
    llmBadgeText: {
        fontSize: FontSizes.xs,
    },
    content: {
        fontSize: FontSizes.md,
        lineHeight: 22,
    },
    imageContainer: {
        marginTop: Spacing.sm,
        gap: Spacing.sm,
    },
    imageWrapper: {
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: BorderRadius.md,
    },
    imageCaption: {
        fontSize: FontSizes.xs,
        marginTop: Spacing.xs,
        fontStyle: 'italic',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: Spacing.xs,
        gap: Spacing.sm,
    },
    timestamp: {
        fontSize: FontSizes.xs,
    },
    copyButton: {
        padding: 2,
    },
});
