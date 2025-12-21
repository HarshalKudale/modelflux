import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PROVIDER_INFO } from '../../../config/providerPresets';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../config/theme';
import { LLMConfig, Message, Persona } from '../../../core/types';
import { useAppColorScheme, useLocale } from '../../hooks';
import { SelectionModal, SelectionOption } from '../common';
import { MessageBubble } from './MessageBubble';

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
    const { t } = useLocale();
    const flatListRef = useRef<FlatList>(null);

    // Modal visibility states
    const [showProviderModal, setShowProviderModal] = useState(false);
    const [showModelModal, setShowModelModal] = useState(false);
    const [showPersonaModal, setShowPersonaModal] = useState(false);

    // Auto-scroll to bottom when new messages arrive or streaming updates
    useEffect(() => {
        if (flatListRef.current && (messages.length > 0 || streamingContent)) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages.length, streamingContent]);

    // Get selected provider
    const selectedProvider = providers.find(p => p.id === selectedProviderId);

    // Convert providers to selection options
    const providerOptions: SelectionOption[] = providers
        .filter(p => p.isEnabled)
        .map(provider => ({
            id: provider.id,
            label: provider.name,
            subtitle: PROVIDER_INFO[provider.provider]?.displayName || provider.provider,
            icon: (
                <Text style={{ color: '#FFFFFF', fontSize: FontSizes.sm, fontWeight: '700' }}>
                    {provider.provider.charAt(0).toUpperCase()}
                </Text>
            ),
            iconColor: PROVIDER_INFO[provider.provider]?.color || colors.tint,
            status: providerConnectionStatus[provider.id] === true
                ? 'online'
                : providerConnectionStatus[provider.id] === false
                    ? 'offline'
                    : 'unknown',
        }));

    // Convert models to selection options
    const modelOptions: SelectionOption[] = availableModels.map(model => ({
        id: model,
        label: model,
    }));

    // Convert personas to selection options
    const personaOptions: SelectionOption[] = personas.map(persona => ({
        id: persona.id,
        label: persona.name,
        subtitle: persona.systemPrompt,
    }));

    // Get display names
    const selectedProviderName = selectedProvider?.name || 'Select Provider';
    const selectedModelName = selectedModel || 'Select Model';
    const selectedPersona = personas.find(p => p.id === selectedPersonaId);
    const selectedPersonaName = selectedPersona?.name || 'No Persona';

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
                    <View style={styles.dropdownsContainer}>
                        {/* Provider Dropdown */}
                        <View style={styles.dropdownSection}>
                            <Text style={[styles.dropdownLabel, { color: colors.textMuted }]}>
                                Provider
                            </Text>
                            <TouchableOpacity
                                style={[styles.dropdownButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                                onPress={() => setShowProviderModal(true)}
                            >
                                {selectedProvider && (
                                    <View style={[styles.providerBadge, { backgroundColor: PROVIDER_INFO[selectedProvider.provider]?.color || colors.tint }]}>
                                        <Text style={styles.providerBadgeText}>
                                            {selectedProvider.provider.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                )}
                                <Text style={[styles.dropdownText, { color: selectedProvider ? colors.text : colors.textMuted }]} numberOfLines={1}>
                                    {selectedProviderName}
                                </Text>
                                {selectedProviderId && providerConnectionStatus[selectedProviderId] !== undefined && (
                                    <View style={[
                                        styles.statusDot,
                                        { backgroundColor: providerConnectionStatus[selectedProviderId] ? colors.success : colors.error }
                                    ]} />
                                )}
                                <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        {/* Model Dropdown */}
                        <View style={styles.dropdownSection}>
                            <Text style={[styles.dropdownLabel, { color: colors.textMuted }]}>
                                Model
                            </Text>
                            <TouchableOpacity
                                style={[
                                    styles.dropdownButton,
                                    {
                                        backgroundColor: colors.backgroundSecondary,
                                        borderColor: colors.border,
                                        opacity: !selectedProviderId ? 0.5 : 1,
                                    }
                                ]}
                                onPress={() => selectedProviderId && setShowModelModal(true)}
                                disabled={!selectedProviderId}
                            >
                                {isLoadingModels ? (
                                    <ActivityIndicator size="small" color={colors.tint} style={{ marginRight: Spacing.sm }} />
                                ) : null}
                                <Text style={[styles.dropdownText, { color: selectedModel ? colors.text : colors.textMuted }]} numberOfLines={1}>
                                    {isLoadingModels ? 'Loading models...' : selectedModelName}
                                </Text>
                                <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        {/* Persona Dropdown */}
                        <View style={styles.dropdownSection}>
                            <Text style={[styles.dropdownLabel, { color: colors.textMuted }]}>
                                Persona
                            </Text>
                            <TouchableOpacity
                                style={[styles.dropdownButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                                onPress={() => setShowPersonaModal(true)}
                            >
                                <Ionicons name="person-circle-outline" size={20} color={colors.tint} style={{ marginRight: Spacing.sm }} />
                                <Text style={[styles.dropdownText, { color: selectedPersonaId ? colors.text : colors.textMuted }]} numberOfLines={1}>
                                    {selectedPersonaName}
                                </Text>
                                <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        {/* Thinking Mode Toggle */}
                        <View style={styles.dropdownSection}>
                            <Text style={[styles.dropdownLabel, { color: colors.textMuted }]}>
                                Thinking Mode
                            </Text>
                            <TouchableOpacity
                                style={[
                                    styles.dropdownButton,
                                    {
                                        backgroundColor: thinkingEnabled ? colors.tint : colors.backgroundSecondary,
                                        borderColor: thinkingEnabled ? colors.tint : colors.border,
                                    }
                                ]}
                                onPress={() => onThinkingChange?.(!thinkingEnabled)}
                            >
                                <Ionicons
                                    name="bulb"
                                    size={20}
                                    color={thinkingEnabled ? '#FFFFFF' : colors.tint}
                                    style={{ marginRight: Spacing.sm }}
                                />
                                <Text
                                    style={[
                                        styles.dropdownText,
                                        { color: thinkingEnabled ? '#FFFFFF' : colors.text }
                                    ]}
                                >
                                    {thinkingEnabled ? 'Enabled' : 'Disabled'}
                                </Text>
                                <Ionicons
                                    name={thinkingEnabled ? 'toggle' : 'toggle-outline'}
                                    size={24}
                                    color={thinkingEnabled ? '#FFFFFF' : colors.textMuted}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Tip text */}
                {hasConfigs && (
                    <Text style={[styles.tipText, { color: colors.textMuted }]}>
                        Type your message below to begin
                    </Text>
                )}

                {/* Selection Modals */}
                <SelectionModal
                    visible={showProviderModal}
                    title="Select Provider"
                    options={providerOptions}
                    selectedId={selectedProviderId}
                    onSelect={(id) => onProviderChange?.(id)}
                    onClose={() => setShowProviderModal(false)}
                    onManagePress={() => {
                        setShowProviderModal(false);
                        onNavigateToProviders?.();
                    }}
                    emptyMessage="No providers configured. Add one in Settings."
                />

                <SelectionModal
                    visible={showModelModal}
                    title="Select Model"
                    options={modelOptions}
                    selectedId={selectedModel}
                    onSelect={(id) => onModelChange?.(id)}
                    onClose={() => setShowModelModal(false)}
                    emptyMessage={isLoadingModels ? 'Loading models...' : 'No models available. Check provider connection.'}
                />

                <SelectionModal
                    visible={showPersonaModal}
                    title="Select Persona"
                    options={personaOptions}
                    selectedId={selectedPersonaId}
                    onSelect={(id) => onPersonaChange?.(id)}
                    onClose={() => setShowPersonaModal(false)}
                    onManagePress={() => {
                        setShowPersonaModal(false);
                        onNavigateToPersonas?.();
                    }}
                    showNoneOption={true}
                    noneOptionLabel="No Persona"
                    noneOptionSubtitle="Use default assistant behavior"
                    emptyMessage="No personas created yet."
                />
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
        if (streamingContent || streamingThinkingContent) {
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
    dropdownsContainer: {
        width: '100%',
        maxWidth: 320,
    },
    dropdownSection: {
        marginBottom: Spacing.md,
    },
    dropdownLabel: {
        fontSize: FontSizes.xs,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: Spacing.xs,
        marginLeft: Spacing.xs,
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    dropdownText: {
        flex: 1,
        fontSize: FontSizes.md,
    },
    providerBadge: {
        width: 24,
        height: 24,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
    },
    providerBadgeText: {
        color: '#FFFFFF',
        fontSize: FontSizes.xs,
        fontWeight: '700',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: Spacing.sm,
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
