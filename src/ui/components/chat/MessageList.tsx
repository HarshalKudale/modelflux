import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, Text, View } from 'react-native';
import { Colors, FontSizes, Spacing } from '../../../config/theme';
import { DownloadedModel, Message } from '../../../core/types';
import { useLLMStore } from '../../../state';
import { useAppColorScheme } from '../../hooks';
import { ModelPicker } from '../common';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
    messages: Message[];
    streamingContent?: string;
    streamingThinkingContent?: string;
    isLoading: boolean;
    isProcessing?: boolean;
    // Selection state (controlled by parent)
    selectedProviderId?: string;
    selectedModel?: string;
    selectedPersonaId?: string;
    // Callbacks for parent state updates
    onProviderChange?: (providerId: string) => void;
    onModelChange?: (model: string, downloadedModel?: DownloadedModel) => void;
    onPersonaChange?: (personaId: string | undefined) => void;
    // Navigation
    onNavigateToProviders?: () => void;
    onNavigateToPersonas?: () => void;
    onNavigateToModels?: () => void;
    // Optional: provider connection status
    providerConnectionStatus?: Record<string, boolean>;
}

// Threshold for considering user "at bottom" (in pixels)
const SCROLL_THRESHOLD = 100;

export function MessageList({
    messages,
    streamingContent,
    streamingThinkingContent,
    isLoading,
    isProcessing = false,
    selectedProviderId,
    selectedModel,
    selectedPersonaId,
    onProviderChange,
    onModelChange,
    onPersonaChange,
    onNavigateToProviders,
    onNavigateToPersonas,
    onNavigateToModels,
    providerConnectionStatus = {},
}: MessageListProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const flatListRef = useRef<FlatList>(null);
    // Track if user is at the bottom of the list
    const isAtBottomRef = useRef(true);
    // Track content height and layout height for scroll calculations
    const contentHeightRef = useRef(0);
    const layoutHeightRef = useRef(0);

    // Check if any LLM configs exist
    const { configs } = useLLMStore();
    const hasConfigs = configs.some(c => c.isEnabled);

    // Handle scroll events to determine if user is at bottom
    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
        isAtBottomRef.current = distanceFromBottom <= SCROLL_THRESHOLD;
    }, []);

    // Scroll to bottom only if user is already near the bottom
    const scrollToBottomIfNeeded = useCallback(() => {
        if (isAtBottomRef.current && flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: false });
        }
    }, []);

    // Auto-scroll when new messages arrive (not during streaming updates)
    useEffect(() => {
        if (flatListRef.current && messages.length > 0) {
            // When a new message is added, scroll to bottom
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
                isAtBottomRef.current = true;
            }, 100);
        }
    }, [messages.length]);

    // When streaming starts, reset to bottom
    useEffect(() => {
        if (streamingContent !== undefined && flatListRef.current) {
            // When streaming starts (first content), ensure we're at bottom
            isAtBottomRef.current = true;
            flatListRef.current.scrollToEnd({ animated: false });
        }
    }, [streamingContent !== undefined]);

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    // Empty state with model picker for new conversations
    if (messages.length === 0 && !isProcessing && !streamingContent) {
        return (
            <View style={styles.centerContainer}>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    Start a conversation
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    {hasConfigs
                        ? 'Select a provider, model, and persona to begin.'
                        : 'Configure an LLM provider in Settings to get started.'}
                </Text>

                {hasConfigs && onProviderChange && onModelChange && (
                    <ModelPicker
                        mode="panel"
                        selectedProviderId={selectedProviderId}
                        selectedModel={selectedModel}
                        selectedPersonaId={selectedPersonaId}
                        onProviderChange={onProviderChange}
                        onModelChange={onModelChange}
                        onPersonaChange={onPersonaChange}
                        onNavigateToProviders={onNavigateToProviders}
                        onNavigateToPersonas={onNavigateToPersonas}
                        onNavigateToModels={onNavigateToModels}
                        providerConnectionStatus={providerConnectionStatus}
                        showPersona={true}
                    />
                )}

                {/* Tip text */}
                {hasConfigs && (
                    <Text style={[styles.tipText, { color: colors.textMuted }]}>
                        Type your message below to begin
                    </Text>
                )}
            </View>
        );
    }

    // Show a processing state if we're waiting for LLM but have no messages yet
    // This handles the edge case of the first message being sent
    if (messages.length === 0 && (isProcessing || streamingContent)) {
        return (
            <View style={styles.initialProcessingContainer}>
                {streamingContent ? (
                    <View style={styles.streamingContainer}>
                        <MessageBubble
                            message={{
                                id: 'streaming',
                                conversationId: '',
                                role: 'assistant',
                                content: streamingContent,
                                contentType: 'text',
                                timestamp: Date.now(),
                                modelId: '',
                                llmIdUsed: '',
                                modelUsed: '',
                            }}
                            showLLMBadge={false}
                        />
                    </View>
                ) : (
                    <View style={styles.processingContainer}>
                        <View style={[styles.processingBubble, { backgroundColor: colors.backgroundSecondary }]}>
                            <ActivityIndicator size="small" color={colors.tint} />
                            <Text style={[styles.processingText, { color: colors.textSecondary }]}>
                                Thinking...
                            </Text>
                        </View>
                    </View>
                )}
            </View>
        );
    }

    const renderItem = ({ item }: { item: Message }) => (
        <MessageBubble message={item} showLLMBadge={item.role === 'assistant'} />
    );

    // Determine footer content: processing indicator, streaming content, or nothing
    const renderFooter = () => {
        // Show streaming content when response is coming in (either thinking or actual content)
        // Note: Check for !== undefined to handle empty string initial state during streaming
        if (streamingContent !== undefined || streamingThinkingContent) {
            return (
                <View style={styles.streamingContainer}>
                    {/* Show streaming thinking content if available */}
                    {streamingThinkingContent && (
                        <View style={[styles.streamingThinkingContainer, { backgroundColor: colors.backgroundSecondary }]}>
                            <View style={styles.streamingThinkingHeader}>
                                <Ionicons name="bulb" size={16} color={colors.tint} />
                                <Text style={[styles.streamingThinkingTitle, { color: colors.tint }]}>
                                    Thinking...
                                </Text>
                            </View>
                            <Text style={[styles.streamingThinkingContent, { color: colors.textSecondary }]}>
                                {streamingThinkingContent}
                            </Text>
                        </View>
                    )}
                    <MessageBubble
                        message={{
                            id: 'streaming',
                            conversationId: '',
                            role: 'assistant',
                            content: streamingContent || '',
                            contentType: 'text',
                            timestamp: Date.now(),
                            modelId: '',
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

        // Show processing indicator when waiting for LLM to start responding
        // isProcessing = isSendingMessage && !isStreaming && !streamingContent
        if (isProcessing) {
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
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={(w, h) => {
                contentHeightRef.current = h;
                scrollToBottomIfNeeded();
            }}
            onLayout={(event) => {
                layoutHeightRef.current = event.nativeEvent.layout.height;
            }}
            maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 10,
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
    initialProcessingContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: Spacing.md,
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
        maxWidth: 320,
        marginBottom: Spacing.lg,
    },
    tipText: {
        fontSize: FontSizes.sm,
        marginTop: Spacing.lg,
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
    streamingThinkingContainer: {
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.sm,
        padding: Spacing.md,
        borderRadius: 12,
    },
    streamingThinkingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.xs,
    },
    streamingThinkingTitle: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
    streamingThinkingContent: {
        fontSize: FontSizes.sm,
        lineHeight: 20,
        fontStyle: 'italic',
    },
});
