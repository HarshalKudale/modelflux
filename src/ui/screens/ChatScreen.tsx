import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { EXECUTORCH_MODELS } from '../../config/executorchModels';
import { BorderRadius, Colors, FontSizes, Shadows, Spacing } from '../../config/theme';
import { isLocalProvider, useConversationStore, useLLMStore, useLocalLLMStore, usePersonaStore } from '../../state';
import { ChatHeader, MessageInput, MessageList, ModelSettingsPanel } from '../components/chat';
import { useAppColorScheme } from '../hooks';

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
    const [pendingThinkingEnabled, setPendingThinkingEnabled] = useState(false);
    // Provider connection status cache
    const [providerConnectionStatus, setProviderConnectionStatus] = useState<Record<string, boolean>>({});
    // Settings modal visibility for existing conversations
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const shadows = Shadows[colorScheme];

    const {
        currentConversationId,
        isStreaming,
        isSendingMessage,
        streamingContent,
        streamingThinkingContent,
        getCurrentConversation,
        getCurrentMessages,
        sendMessage,
        cancelStreaming,
        setActiveLLM,
        setThinkingEnabled,
        updateConversationTitle,
        createConversation,
    } = useConversationStore();

    const { configs, availableModels, fetchModels, isLoadingModels, testConnection, getConfigById } = useLLMStore();
    const { personas, loadPersonas, getPersonaById } = usePersonaStore();

    // Load personas on mount
    useEffect(() => {
        loadPersonas();
    }, []);

    // Set initial provider if configs exist
    useEffect(() => {
        if (!pendingProviderId && configs.length > 0) {
            const enabledConfigs = configs.filter(c => c.isEnabled);
            if (enabledConfigs.length > 0) {
                setPendingProviderId(enabledConfigs[0].id);
            }
        }
    }, [configs, pendingProviderId]);

    // Fetch models when provider changes
    useEffect(() => {
        if (pendingProviderId) {
            fetchModels(pendingProviderId);
        }
    }, [pendingProviderId]);

    // Set initial model when models are loaded
    useEffect(() => {
        if (pendingProviderId && availableModels[pendingProviderId]?.length > 0 && !pendingModel) {
            setPendingModel(availableModels[pendingProviderId][0]);
        }
    }, [availableModels, pendingProviderId, pendingModel]);

    // Test provider connections on mount
    useEffect(() => {
        const testProviders = async () => {
            const enabledConfigs = configs.filter(c => c.isEnabled);
            for (const config of enabledConfigs) {
                try {
                    const isOnline = await testConnection(config.id);
                    setProviderConnectionStatus(prev => ({ ...prev, [config.id]: isOnline }));
                } catch {
                    setProviderConnectionStatus(prev => ({ ...prev, [config.id]: false }));
                }
            }
        };
        if (configs.length > 0) {
            testProviders();
        }
    }, [configs]);

    const conversation = getCurrentConversation();
    const currentMessages = getCurrentMessages();
    const enabledConfigs = configs.filter((c) => c.isEnabled);
    const hasNoLLM = enabledConfigs.length === 0;

    // Get local model state from localLLMStore (must be before functions that use it)
    const {
        selectedModelName,
        selectedModelId,
        isReady: isLocalModelReady,
        isLoading: isLocalModelLoading,
        downloadProgress,
        selectModel
    } = useLocalLLMStore();

    // Get selected provider (must be before functions that use it)
    const selectedProvider = pendingProviderId ? getConfigById(pendingProviderId) : undefined;

    // Determine if this is a new conversation (no messages yet)
    const isNewConversation = currentMessages.length === 0;

    // Sync pendingModel and pendingProviderId when switching to conversation with local provider
    useEffect(() => {
        if (!conversation) return;

        // Get the LLM config for this conversation
        const conversationProvider = conversation.activeLLMId
            ? getConfigById(conversation.activeLLMId)
            : null;

        if (conversationProvider && isLocalProvider(conversationProvider.provider)) {
            // For local providers, sync with currently loaded local model
            if (selectedModelName && isLocalModelReady) {
                // Sync pendingProviderId and pendingModel
                if (pendingProviderId !== conversationProvider.id) {
                    setPendingProviderId(conversationProvider.id);
                }
                if (pendingModel !== selectedModelName) {
                    setPendingModel(selectedModelName);
                }
            }
        }
    }, [conversation?.id, conversation?.activeLLMId, selectedModelName, isLocalModelReady, getConfigById]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;
        const message = inputValue;
        setInputValue('');

        // Dismiss keyboard to give more screen space
        Keyboard.dismiss();

        // If no conversation exists, create one first with pending selections
        if (!currentConversationId) {
            try {
                await createConversation(pendingProviderId, pendingModel, pendingPersonaId, pendingThinkingEnabled);
                // Clear pending selections
                setPendingProviderId(undefined);
                setPendingModel(undefined);
                setPendingPersonaId(undefined);
                setPendingThinkingEnabled(false);
                // Small delay to ensure state is updated
                setTimeout(async () => {
                    await sendMessage(message);
                }, 100);
            } catch (error) {
                console.error('Failed to create conversation:', error);
            }
        } else {
            await sendMessage(message);
        }
    };

    const handleProviderChange = (providerId: string | undefined) => {
        setPendingProviderId(providerId);
        setPendingModel(undefined); // Reset model when provider changes
        if (providerId) {
            fetchModels(providerId);
        }
    };

    const handleModelChange = (model: string | undefined) => {
        setPendingModel(model);

        // If this is an ExecuTorch provider, trigger model loading
        if (selectedProvider && isLocalProvider(selectedProvider.provider) && model) {
            // Find the model in EXECUTORCH_MODELS to get its ID
            const localModel = EXECUTORCH_MODELS.find(m => m.name === model);
            if (localModel) {
                // Check if this model is already loaded - skip if same model
                if (selectedModelId === localModel.id && isLocalModelReady) {
                    console.log('[ChatScreen] Model already loaded:', localModel.id);
                    return;
                }
                console.log('[ChatScreen] Triggering local model load:', localModel.id, localModel.name);
                selectModel(localModel.id, localModel.name);
            }
        }
    };

    const handlePersonaChange = (personaId: string | undefined) => {
        setPendingPersonaId(personaId);
    };

    const handleEditTitle = async (title: string) => {
        if (currentConversationId) {
            await updateConversationTitle(currentConversationId, title);
        }
    };

    // Check if existing conversation uses a local provider
    const existingConversationProvider = conversation?.activeLLMId
        ? getConfigById(conversation.activeLLMId)
        : undefined;
    const existingUsesLocalProvider = existingConversationProvider
        ? isLocalProvider(existingConversationProvider.provider)
        : false;

    // For existing conversations with local provider, require explicit model selection
    // The local model must be loaded and ready to use
    const localProviderNeedsSelection = !isNewConversation && existingUsesLocalProvider && !isLocalModelReady;

    // Input should be disabled if:
    // 1. No LLM is configured
    // 2. Local model is currently loading
    // 3. Existing conversation uses local provider but model not ready (needs selection)
    const isLocalModelLoading_needsLoad = selectedProvider && isLocalProvider(selectedProvider.provider) && !isLocalModelReady && isLocalModelLoading;
    const isInputDisabled = hasNoLLM || !!isLocalModelLoading_needsLoad || localProviderNeedsSelection;

    // Show loading banner for local model (for both new and existing conversations)
    const isNewConversationLocalLoading = selectedProvider && isLocalProvider(selectedProvider.provider) && isLocalModelLoading;
    const isExistingConversationLocalLoading = existingUsesLocalProvider && isLocalModelLoading;
    const showLocalModelLoadingBanner = !!(isNewConversationLocalLoading || isExistingConversationLocalLoading);

    // Show processing indicator when sending message - this stays true until response completes
    // The MessageList will decide whether to show spinner or streaming content based on streamingContent
    const isProcessing = isSendingMessage;

    // Get current persona name for display
    const currentPersona = conversation?.personaId
        ? getPersonaById(conversation.personaId)
        : pendingPersonaId
            ? getPersonaById(pendingPersonaId)
            : null;



    const currentModels = (() => {
        if (!pendingProviderId) return [];

        // For local providers, show loaded model if ready
        if (selectedProvider && isLocalProvider(selectedProvider.provider)) {
            if (selectedModelName && isLocalModelReady) {
                return [selectedModelName];
            }
            return []; // No model loaded yet
        }

        // For remote providers, use availableModels
        return availableModels[pendingProviderId] || [];
    })();

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
                thinkingEnabled={isNewConversation ? pendingThinkingEnabled : (conversation?.thinkingEnabled ?? false)}
                onThinkingChange={isNewConversation ? setPendingThinkingEnabled : setThinkingEnabled}
                onSettingsPress={!isNewConversation ? () => setShowSettingsModal(true) : undefined}
                showAlert={localProviderNeedsSelection}
            />

            {/* Local Model Loading Banner */}
            {showLocalModelLoadingBanner && (
                <View style={[styles.loadingBanner, { backgroundColor: colors.tint + '15', borderColor: colors.tint }]}>
                    <ActivityIndicator size="small" color={colors.tint} />
                    <Text style={[styles.loadingBannerText, { color: colors.tint }]}>
                        {downloadProgress > 0 && downloadProgress < 1
                            ? `Downloading model: ${(downloadProgress * 100).toFixed(2)}%`
                            : `Loading ${selectedModelName || 'model'}...`}
                    </Text>
                </View>
            )}

            <View style={styles.contentWrapper}>
                <View style={styles.contentContainer}>
                    <MessageList
                        messages={currentMessages}
                        streamingContent={isStreaming ? streamingContent : undefined}
                        streamingThinkingContent={isStreaming ? streamingThinkingContent : undefined}
                        isLoading={false}
                        isProcessing={isProcessing}
                        isNewConversation={isNewConversation}
                        // Provider selection
                        providers={enabledConfigs}
                        selectedProviderId={pendingProviderId}
                        onProviderChange={handleProviderChange}
                        providerConnectionStatus={providerConnectionStatus}
                        // Model selection  
                        availableModels={currentModels}
                        isLoadingModels={isLoadingModels}
                        selectedModel={pendingModel}
                        onModelChange={handleModelChange}
                        // Persona selection
                        personas={personas}
                        selectedPersonaId={pendingPersonaId}
                        onPersonaChange={handlePersonaChange}
                        // Thinking mode
                        thinkingEnabled={pendingThinkingEnabled}
                        onThinkingChange={setPendingThinkingEnabled}
                        onNavigateToProviders={() => router.push('/llm-management')}
                        onNavigateToPersonas={() => router.push('/persona-list')}
                        hasConfigs={!hasNoLLM}
                    />

                    <MessageInput
                        value={inputValue}
                        onChange={setInputValue}
                        onSend={handleSend}
                        onStop={cancelStreaming}
                        isStreaming={isStreaming || isSendingMessage}
                        disabled={isInputDisabled}
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
                                    // Only allow closing if provider and model are selected
                                    if (conversation?.activeLLMId && conversation?.activeModel) {
                                        setShowSettingsModal(false);
                                    }
                                }}
                                disabled={!conversation?.activeLLMId || !conversation?.activeModel}
                                style={[
                                    styles.modalCloseButton,
                                    (!conversation?.activeLLMId || !conversation?.activeModel) && { opacity: 0.3 }
                                ]}
                            >
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <ModelSettingsPanel
                            providers={enabledConfigs}
                            selectedProviderId={conversation?.activeLLMId}
                            onProviderChange={async (id) => {
                                if (id) {
                                    // Clear model when provider changes - user must select new model
                                    await setActiveLLM(id, '');
                                    fetchModels(id);
                                }
                            }}
                            providerConnectionStatus={providerConnectionStatus}
                            onNavigateToProviders={() => {
                                setShowSettingsModal(false);
                                router.push('/llm-management');
                            }}
                            availableModels={conversation?.activeLLMId ? (availableModels[conversation.activeLLMId] || []) : []}
                            isLoadingModels={isLoadingModels}
                            // Show empty if model is empty string or if local provider needs selection
                            selectedModel={(!conversation?.activeModel || localProviderNeedsSelection) ? undefined : conversation?.activeModel}
                            onModelChange={async (model) => {
                                if (model && conversation?.activeLLMId) {
                                    await setActiveLLM(conversation.activeLLMId, model);

                                    // If this is a local provider, trigger model loading immediately
                                    if (existingUsesLocalProvider) {
                                        const localModel = EXECUTORCH_MODELS.find(m => m.name === model);
                                        if (localModel) {
                                            console.log('[ChatScreen] Settings modal: Triggering local model load:', localModel.id, localModel.name);
                                            selectModel(localModel.id, localModel.name);
                                        }
                                    }
                                }
                            }}
                            personas={personas}
                            selectedPersonaId={conversation?.personaId}
                            onPersonaChange={async (_id: string | undefined) => {
                                // Persona changes for existing conversations not yet supported
                                // Could add setPersona to conversationStore if needed
                            }}
                            onNavigateToPersonas={() => {
                                setShowSettingsModal(false);
                                router.push('/persona-list');
                            }}
                        />
                    </View>
                </Pressable>
            </Modal>
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
