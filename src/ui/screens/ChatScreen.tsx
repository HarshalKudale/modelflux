/**
 * ChatScreen
 * 
 * Main chat interface with simplified model selection using ModelPicker.
 * Uses useModelSelection hook for centralized model state management.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, FontSizes, Shadows, Spacing } from '../../config/theme';
import { DownloadedModel } from '../../core/types';
import { isLocalProvider, useConversationStore, useLLMStore, useSourceStore } from '../../state';
import { ChatHeader, MessageInput, MessageList, SourceSelector } from '../components/chat';
import { ModelPicker } from '../components/common';
import { useAppColorScheme, useModelSelection } from '../hooks';

// Maximum width for chat content on web (similar to ChatGPT/Claude interfaces)
const MAX_CONTENT_WIDTH = 800;

interface ChatScreenProps {
    onMenuPress?: () => void;
}

export function ChatScreen({ onMenuPress }: ChatScreenProps) {
    const router = useRouter();
    const [inputValue, setInputValue] = useState('');
    // Track pending selections for when no conversation exists yet
    const [pendingProviderId, setPendingProviderId] = useState<string | undefined>(undefined);
    const [pendingModel, setPendingModel] = useState<string | undefined>(undefined);
    const [pendingPersonaId, setPendingPersonaId] = useState<string | undefined>(undefined);
    // Provider connection status cache
    const [providerConnectionStatus, setProviderConnectionStatus] = useState<Record<string, boolean>>({});
    // Settings modal visibility for existing conversations
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    // Source selection for RAG
    const [selectedSourceIds, setSelectedSourceIds] = useState<number[]>([]);
    const [showSourceSelector, setShowSourceSelector] = useState(false);

    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const shadows = Shadows[colorScheme];

    // Conversation store
    const {
        currentConversationId,
        isStreaming,
        isSendingMessage,
        getCurrentConversation,
        getCurrentMessages,
        sendMessage,
        cancelStreaming,
        setActiveLLM,
        updateConversationTitle,
        createConversation,
    } = useConversationStore();

    // Subscribe to message maps separately to ensure proper reactive updates
    const currentMessageMap = useConversationStore((state) => state.currentMessageMap);
    const currentThinkingMessageMap = useConversationStore((state) => state.currentThinkingMessageMap);

    // Derive streaming content from the subscribed maps
    const currentStreamingContent = currentConversationId ? (currentMessageMap[currentConversationId] || '') : '';
    const currentStreamingThinkingContent = currentConversationId ? (currentThinkingMessageMap[currentConversationId] || '') : '';

    // Centralized model selection hook
    const {
        enabledConfigs,
        getConfigById,
        localModelState,
        loadLocalModel,
    } = useModelSelection();

    // LLM store for connection testing
    const { testConnection } = useLLMStore();
    const { sources, loadSources } = useSourceStore();

    const hasNoLLM = enabledConfigs.length === 0;

    // Load sources on mount
    useEffect(() => {
        loadSources();
    }, [loadSources]);

    // Set initial provider only for NEW conversations (no selected conversation)
    useEffect(() => {
        // Skip if a conversation is selected - we'll sync from it instead
        if (currentConversationId) return;

        if (!pendingProviderId && enabledConfigs.length > 0) {
            setPendingProviderId(enabledConfigs[0].id);
        }
    }, [enabledConfigs, pendingProviderId, currentConversationId]);

    // Test provider connections on mount
    useEffect(() => {
        const testProviders = async () => {
            for (const config of enabledConfigs) {
                try {
                    const isOnline = await testConnection(config.id);
                    setProviderConnectionStatus(prev => ({ ...prev, [config.id]: isOnline }));
                } catch {
                    setProviderConnectionStatus(prev => ({ ...prev, [config.id]: false }));
                }
            }
        };
        if (enabledConfigs.length > 0) {
            testProviders();
        }
    }, [enabledConfigs, testConnection]);

    // Subscribe to conversations array for reactive updates
    const conversations = useConversationStore((state) => state.conversations);

    // Derive current conversation from subscribed state (reactive)
    const conversation = currentConversationId
        ? conversations.find((c) => c.id === currentConversationId) || null
        : null;
    const currentMessages = getCurrentMessages();

    // Get selected provider
    const selectedProvider = pendingProviderId ? getConfigById(pendingProviderId) : undefined;

    // Determine if this is a new conversation (no messages yet)
    const isNewConversation = currentMessages.length === 0;

    // Sync pendingModel and pendingProviderId when switching to conversation
    useEffect(() => {
        if (!conversation) return;

        // Use new fields with fallback to deprecated fields
        const conversationProviderId = conversation.providerId || conversation.activeLLMId;
        const conversationModelId = conversation.modelId || conversation.activeModel;

        const conversationProvider = conversationProviderId
            ? getConfigById(conversationProviderId)
            : null;

        if (conversationProvider) {
            // Always sync provider first
            setPendingProviderId(conversationProvider.id);

            // Handle model syncing based on provider type
            if (isLocalProvider(conversationProvider.provider)) {
                // For local provider: ONLY sync model if it matches loaded model and ready
                if (localModelState.isReady && localModelState.selectedModelName && localModelState.selectedModelName === conversationModelId) {
                    setPendingModel(localModelState.selectedModelName);
                } else {
                    // If not loaded/ready, do NOT auto-select the model (forces manual selection/loading)
                    setPendingModel(undefined);
                }
            } else {
                // For remote provider: ALWAYS sync model from conversation
                setPendingModel(conversationModelId);
            }
        }
    }, [conversation, enabledConfigs, localModelState.selectedModelName, localModelState.isReady, getConfigById]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;
        const message = inputValue;
        const sourcesToUse = [...selectedSourceIds];
        setInputValue('');
        Keyboard.dismiss();

        if (!currentConversationId) {
            try {
                await createConversation(pendingProviderId, pendingModel, pendingPersonaId);
                setPendingProviderId(undefined);
                setPendingModel(undefined);
                setPendingPersonaId(undefined);
                setTimeout(async () => {
                    await sendMessage(message, sourcesToUse);
                }, 100);
            } catch (error) {
                console.error('Failed to create conversation:', error);
            }
        } else {
            await sendMessage(message, sourcesToUse);
        }
    };

    // Handler for provider changes from ModelPicker
    const handleProviderChange = (providerId: string) => {
        setPendingProviderId(providerId);
        setPendingModel(undefined);
    };

    // Handler for model changes from ModelPicker (includes automatic local model loading)
    const handleModelChange = (model: string, downloadedModel?: DownloadedModel) => {
        setPendingModel(model);
        // ModelPicker already handles local model loading via its internal hook
    };

    const handlePersonaChange = (personaId: string | undefined) => {
        setPendingPersonaId(personaId);
    };

    const handleEditTitle = async (title: string) => {
        if (currentConversationId) {
            await updateConversationTitle(currentConversationId, title);
        }
    };

    // Handler for settings modal model changes (for existing conversations)
    const handleSettingsModelChange = async (model: string, downloadedModel?: DownloadedModel) => {
        if (conversation?.activeLLMId) {
            await setActiveLLM(conversation.activeLLMId, model);
            // ModelPicker handles local model loading internally
        }
    };

    const handleSettingsProviderChange = async (providerId: string) => {
        if (conversation) {
            await setActiveLLM(providerId, '');
        }
    };

    // Check if existing conversation uses a local provider
    const existingConversationProviderId = conversation?.providerId || conversation?.activeLLMId;
    const existingConversationModelId = conversation?.modelId || conversation?.activeModel;
    const existingConversationProvider = existingConversationProviderId
        ? getConfigById(existingConversationProviderId)
        : undefined;
    const existingUsesLocalProvider = existingConversationProvider
        ? isLocalProvider(existingConversationProvider.provider)
        : false;

    // Determine if we should show alert in header
    // 1. Local provider + model not loaded/ready
    // 2. Remote provider + no model selected
    const shouldShowAlert = !isNewConversation && (
        (existingUsesLocalProvider && !localModelState.isReady) ||
        (!existingUsesLocalProvider && !existingConversationModelId)
    );

    // Input disabled states
    const isLocalModelLoading_needsLoad = selectedProvider && isLocalProvider(selectedProvider.provider) && !localModelState.isReady && localModelState.isLoading;
    const isInputDisabled = hasNoLLM || !!isLocalModelLoading_needsLoad || shouldShowAlert;

    // Loading banner states
    const isNewConversationLocalLoading = selectedProvider && isLocalProvider(selectedProvider.provider) && localModelState.isLoading;
    const isExistingConversationLocalLoading = existingUsesLocalProvider && localModelState.isLoading;
    const showLocalModelLoadingBanner = !!(isNewConversationLocalLoading || isExistingConversationLocalLoading);

    const isProcessing = isSendingMessage;

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <ChatHeader
                conversation={conversation}
                onEditTitle={handleEditTitle}
                onMenuPress={onMenuPress}
                onSettingsPress={!isNewConversation ? () => setShowSettingsModal(true) : undefined}
                showAlert={shouldShowAlert}
            />

            {/* Local Model Loading Banner */}
            {showLocalModelLoadingBanner && (
                <View style={[styles.loadingBanner, { backgroundColor: colors.tint + '15', borderColor: colors.tint }]}>
                    <ActivityIndicator size="small" color={colors.tint} />
                    <Text style={[styles.loadingBannerText, { color: colors.tint }]}>
                        {localModelState.downloadProgress > 0 && localModelState.downloadProgress < 1
                            ? `Downloading model: ${(localModelState.downloadProgress * 100).toFixed(2)}%`
                            : `Loading ${localModelState.selectedModelName || 'model'}...`}
                    </Text>
                </View>
            )}

            <View style={styles.contentWrapper}>
                <View style={styles.contentContainer}>
                    <MessageList
                        messages={currentMessages}
                        streamingContent={isStreaming ? currentStreamingContent : undefined}
                        streamingThinkingContent={isStreaming ? currentStreamingThinkingContent : undefined}
                        isLoading={false}
                        isProcessing={isProcessing}
                        selectedProviderId={pendingProviderId}
                        selectedModel={pendingModel}
                        selectedPersonaId={pendingPersonaId}
                        onProviderChange={handleProviderChange}
                        onModelChange={handleModelChange}
                        onPersonaChange={handlePersonaChange}
                        onNavigateToProviders={() => router.push('/llm-management')}
                        onNavigateToPersonas={() => router.push('/persona-list')}
                        onNavigateToModels={() => router.push('/model-list')}
                        providerConnectionStatus={providerConnectionStatus}
                    />

                    <MessageInput
                        value={inputValue}
                        onChange={setInputValue}
                        onSend={async () => {
                            await handleSend();
                            setSelectedSourceIds([]);
                        }}
                        onStop={cancelStreaming}
                        isStreaming={isStreaming || isSendingMessage}
                        disabled={isInputDisabled}
                        onSourcesPress={() => setShowSourceSelector(true)}
                        selectedSourceCount={selectedSourceIds.length}
                        hasSources={sources.length > 0}
                    />
                </View>
            </View>

            {/* Settings Modal for Existing Conversations */}
            <Modal
                visible={showSettingsModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSettingsModal(false)}
            >
                <Pressable
                    style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
                >
                    <View
                        style={[styles.modalContent, { backgroundColor: colors.cardBackground }, shadows.lg]}
                        onStartShouldSetResponder={() => true}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Conversation Settings</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    const hasProvider = pendingProviderId || conversation?.providerId || conversation?.activeLLMId;
                                    const hasModel = pendingModel || conversation?.modelId || conversation?.activeModel;
                                    if (hasProvider && hasModel) {
                                        setShowSettingsModal(false);
                                    }
                                }}
                                disabled={shouldShowAlert}
                                style={[
                                    styles.modalCloseButton,
                                    shouldShowAlert && { opacity: 0.3 }
                                ]}
                            >
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <ModelPicker
                            mode="panel"
                            selectedProviderId={pendingProviderId || conversation?.providerId || conversation?.activeLLMId}
                            selectedModel={shouldShowAlert ? undefined : (pendingModel || conversation?.modelId || conversation?.activeModel)}
                            selectedPersonaId={conversation?.personaId}
                            onProviderChange={handleSettingsProviderChange}
                            onModelChange={handleSettingsModelChange}
                            onNavigateToProviders={() => {
                                setShowSettingsModal(false);
                                router.push('/llm-management');
                            }}
                            onNavigateToModels={() => {
                                setShowSettingsModal(false);
                                router.push('/model-list');
                            }}
                            providerConnectionStatus={providerConnectionStatus}
                            showPersona={false}
                        />
                    </View>
                </Pressable>
            </Modal>

            {/* Source Selector Modal for RAG */}
            <SourceSelector
                visible={showSourceSelector}
                onClose={() => setShowSourceSelector(false)}
                selectedSourceIds={selectedSourceIds}
                onSourceToggle={(sourceId) => {
                    setSelectedSourceIds((prev) =>
                        prev.includes(sourceId)
                            ? prev.filter((id) => id !== sourceId)
                            : [...prev, sourceId]
                    );
                }}
                onClearSelection={() => setSelectedSourceIds([])}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentWrapper: {
        flex: 1,
        alignItems: 'center',
    },
    contentContainer: {
        flex: 1,
        width: '100%',
        maxWidth: Platform.OS === 'web' ? MAX_CONTENT_WIDTH : undefined,
    },
    loadingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderBottomWidth: 1,
        gap: Spacing.sm,
    },
    loadingBannerText: {
        fontSize: FontSizes.sm,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
    },
    modalTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    modalCloseButton: {
        padding: Spacing.xs,
    },
});
