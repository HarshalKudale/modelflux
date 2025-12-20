import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Colors } from '../../config/theme';
import { useConversationStore, useLLMStore } from '../../state';
import { ChatHeader, MessageInput, MessageList } from '../components/chat';
import { useAppColorScheme } from '../hooks';

// Maximum width for chat content on web (similar to ChatGPT/Claude interfaces)
const MAX_CONTENT_WIDTH = 800;

interface ChatScreenProps {
    onMenuPress?: () => void;
}

export function ChatScreen({ onMenuPress }: ChatScreenProps) {
    const [inputValue, setInputValue] = useState('');
    // Track pending model selection for when no conversation exists yet
    const [pendingLLMId, setPendingLLMId] = useState<string | null>(null);
    const [pendingModel, setPendingModel] = useState<string | null>(null);
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];

    const {
        currentConversationId,
        isStreaming,
        isSendingMessage,
        streamingContent,
        getCurrentConversation,
        getCurrentMessages,
        sendMessage,
        cancelStreaming,
        setActiveLLM,
        updateConversationTitle,
        createConversation,
    } = useConversationStore();

    const { configs } = useLLMStore();

    const conversation = getCurrentConversation();
    const currentMessages = getCurrentMessages();
    const enabledConfigs = configs.filter((c) => c.isEnabled);
    const hasNoLLM = enabledConfigs.length === 0;

    const handleSend = async () => {
        if (!inputValue.trim()) return;
        const message = inputValue;
        setInputValue('');

        // Dismiss keyboard to give more screen space
        Keyboard.dismiss();

        // If no conversation exists, create one first with pending model selection
        if (!currentConversationId) {
            try {
                await createConversation(pendingLLMId || undefined, pendingModel || undefined);
                // Clear pending selections
                setPendingLLMId(null);
                setPendingModel(null);
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

    const handleChangeModel = async (llmId: string, model: string) => {
        if (currentConversationId) {
            // Update existing conversation
            await setActiveLLM(llmId, model);
        } else {
            // No conversation yet - store pending selection for when conversation is created
            setPendingLLMId(llmId);
            setPendingModel(model);
        }
    };

    const handleEditTitle = async (title: string) => {
        if (currentConversationId) {
            await updateConversationTitle(currentConversationId, title);
        }
    };

    // Input should be disabled only if no LLM is configured
    const isInputDisabled = hasNoLLM;

    // Show processing indicator when sending message but streaming hasn't started yet
    const isProcessing = isSendingMessage && !isStreaming && !streamingContent;

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
                        isLoading={false}
                        isProcessing={isProcessing}
                    />

                    <MessageInput
                        value={inputValue}
                        onChange={setInputValue}
                        onSend={handleSend}
                        onStop={cancelStreaming}
                        isStreaming={isStreaming || isSendingMessage}
                        disabled={isInputDisabled}
                        selectedLLMId={conversation?.activeLLMId || pendingLLMId || ''}
                        selectedModel={conversation?.activeModel || pendingModel || ''}
                        onChangeModel={handleChangeModel}
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
