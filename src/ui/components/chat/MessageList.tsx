import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Colors, FontSizes, Spacing } from '../../../config/theme';
import { LLMConfig, Message, Persona } from '../../../core/types';
import { useAppColorScheme } from '../../hooks';
import { MessageBubble } from './MessageBubble';
import { ModelSettingsPanel } from './ModelSettingsPanel';

interface MessageListProps {
    messages: Message[];
    streamingContent?: string;
    streamingThinkingContent?: string;
    isLoading: boolean;
    isProcessing?: boolean;
    // Provider/Model/Persona selection props
    isNewConversation?: boolean;
    providers?: LLMConfig[];
    selectedProviderId?: string;
    onProviderChange?: (providerId: string | undefined) => void;
    availableModels?: string[];
    isLoadingModels?: boolean;
    selectedModel?: string;
    onModelChange?: (model: string | undefined) => void;
    personas?: Persona[];
    selectedPersonaId?: string;
    onPersonaChange?: (personaId: string | undefined) => void;
    thinkingEnabled?: boolean;
    onThinkingChange?: (enabled: boolean) => void;
    onNavigateToProviders?: () => void;
    onNavigateToPersonas?: () => void;
    hasConfigs?: boolean;
    providerConnectionStatus?: Record<string, boolean>;
}

export function MessageList({
    messages,
    streamingContent,
    streamingThinkingContent,
    isLoading,
    isProcessing = false,
    isNewConversation = false,
    providers = [],
    selectedProviderId,
    onProviderChange,
    availableModels = [],
    isLoadingModels = false,
    selectedModel,
    onModelChange,
    personas = [],
    selectedPersonaId,
    onPersonaChange,
    thinkingEnabled = false,
    onThinkingChange,
    onNavigateToProviders,
    onNavigateToPersonas,
    hasConfigs = true,
    providerConnectionStatus = {},
}: MessageListProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const flatListRef = useRef<FlatList>(null);

    // Auto-scroll to bottom when new messages arrive or streaming updates
    useEffect(() => {
        if (flatListRef.current && (messages.length > 0 || streamingContent)) {
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

    // Empty state with dropdowns for new conversations
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

                {hasConfigs && (
                    <ModelSettingsPanel
                        providers={providers}
                        selectedProviderId={selectedProviderId}
                        onProviderChange={(id) => onProviderChange?.(id)}
                        providerConnectionStatus={providerConnectionStatus}
                        onNavigateToProviders={onNavigateToProviders}
                        availableModels={availableModels}
                        isLoadingModels={isLoadingModels}
                        selectedModel={selectedModel}
                        onModelChange={(model) => onModelChange?.(model)}
                        personas={personas}
                        selectedPersonaId={selectedPersonaId}
                        onPersonaChange={(id) => onPersonaChange?.(id)}
                        onNavigateToPersonas={onNavigateToPersonas}
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
            onContentSizeChange={() => {
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
