import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Colors } from '../../config/theme';
import { useConversationStore, useLLMStore, usePersonaStore } from '../../state';
import { ChatHeader, MessageInput, MessageList } from '../components/chat';
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

    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];

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

    const { configs, availableModels, fetchModels, isLoadingModels, testConnection } = useLLMStore();
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

    // Determine if this is a new conversation (no messages yet)
    const isNewConversation = currentMessages.length === 0;

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
    };

    const handlePersonaChange = (personaId: string | undefined) => {
        setPendingPersonaId(personaId);
    };

    const handleEditTitle = async (title: string) => {
        if (currentConversationId) {
            await updateConversationTitle(currentConversationId, title);
        }
    };

    // Input should be disabled only if no LLM is configured
    const isInputDisabled = hasNoLLM;

    // Show processing indicator when sending message - this stays true until response completes
    // The MessageList will decide whether to show spinner or streaming content based on streamingContent
    const isProcessing = isSendingMessage;

    // Get current persona name for display
    const currentPersona = conversation?.personaId
        ? getPersonaById(conversation.personaId)
        : pendingPersonaId
            ? getPersonaById(pendingPersonaId)
            : null;

    // Get available models for selected provider
    const currentModels = pendingProviderId ? (availableModels[pendingProviderId] || []) : [];

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
            />

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
                        // Don't show model selector in input for new conversations
                        selectedLLMId={isNewConversation ? '' : (conversation?.activeLLMId || '')}
                        selectedModel={isNewConversation ? '' : (conversation?.activeModel || '')}
                        onChangeModel={isNewConversation ? undefined : async (llmId, model) => {
                            await setActiveLLM(llmId, model);
                        }}
                        // Thinking mode for existing conversations
                        thinkingEnabled={isNewConversation ? pendingThinkingEnabled : (conversation?.thinkingEnabled || false)}
                        onThinkingChange={isNewConversation ? undefined : setThinkingEnabled}
                        showPersonaSelector={false}
                    />
                </View>
            </View>
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
});
