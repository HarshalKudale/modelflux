import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Colors, FontSizes, Spacing } from '../../../config/theme';
import { Message } from '../../../core/types';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
    messages: Message[];
    streamingContent?: string;
    isLoading: boolean;
    isProcessing?: boolean; // LLM is processing but hasn't started streaming yet
}

export function MessageList({
    messages,
    streamingContent,
    isLoading,
    isProcessing = false,
}: MessageListProps) {
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];
    const flatListRef = useRef<FlatList>(null);

    // Auto-scroll to bottom when new messages arrive or streaming updates
    useEffect(() => {
        if (flatListRef.current && (messages.length > 0 || streamingContent)) {
            // Use a small timeout to ensure the layout has updated
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages.length, streamingContent]);

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    if (messages.length === 0 && !isProcessing) {
        return (
            <View style={styles.centerContainer}>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    Start a conversation
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    Type a message below to begin chatting with your AI assistant.
                </Text>
            </View>
        );
    }

    const renderItem = ({ item }: { item: Message }) => (
        <MessageBubble message={item} showLLMBadge={item.role === 'assistant'} />
    );

    // Determine footer content: processing indicator, streaming content, or nothing
    const renderFooter = () => {
        // Show processing indicator when waiting for LLM to start responding
        if (isProcessing && !streamingContent) {
            return (
                <View style={styles.processingContainer}>
                    <View style={[styles.processingBubble, { backgroundColor: colors.backgroundSecondary }]}>
                        <ActivityIndicator size="small" color={colors.tint} />
                        <Text style={[styles.processingText, { color: colors.textSecondary }]}>
                            Thinking...
                        </Text>
                    </View>
                </View>
            );
        }

        // Show streaming content when response is coming in
        if (streamingContent) {
            return (
                <View style={styles.streamingContainer}>
                    <MessageBubble
                        message={{
                            id: 'streaming',
                            conversationId: '',
                            role: 'assistant',
                            content: streamingContent,
                            contentType: 'text',
                            timestamp: Date.now(),
                            llmIdUsed: '',
                            modelUsed: '',
                        }}
                        showLLMBadge={false}
                    />
                    <View style={styles.typingIndicator}>
                        <View
                            style={[styles.typingDot, { backgroundColor: colors.tint }]}
                        />
                        <View
                            style={[
                                styles.typingDot,
                                styles.typingDotMiddle,
                                { backgroundColor: colors.tint },
                            ]}
                        />
                        <View
                            style={[styles.typingDot, { backgroundColor: colors.tint }]}
                        />
                    </View>
                </View>
            );
        }

        return null;
    };

    return (
        <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            inverted={false}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={renderFooter}
            onContentSizeChange={() => {
                // Scroll to end when content size changes
                flatListRef.current?.scrollToEnd({ animated: true });
            }}
        />
    );
}

const styles = StyleSheet.create({
    list: {
        flex: 1,
    },
    listContent: {
        paddingVertical: Spacing.md,
        flexGrow: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    emptyTitle: {
        fontSize: FontSizes.xl,
        fontWeight: '600',
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: FontSizes.md,
        textAlign: 'center',
        maxWidth: 300,
    },
    processingContainer: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    processingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: 16,
        gap: Spacing.sm,
    },
    processingText: {
        fontSize: FontSizes.sm,
    },
    streamingContainer: {
        position: 'relative',
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.sm,
    },
    typingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        opacity: 0.6,
    },
    typingDotMiddle: {
        marginHorizontal: 4,
        opacity: 0.4,
    },
});
