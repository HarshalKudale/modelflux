import React, { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, useColorScheme } from 'react-native';
import { Colors } from '../../config/theme';
import { useConversationStore, useLLMStore } from '../../state';
import { ChatHeader, MessageInput, MessageList } from '../components/chat';

interface ChatScreenProps {
    onMenuPress?: () => void;
}

export function ChatScreen({ onMenuPress }: ChatScreenProps) {
    const [inputValue, setInputValue] = useState('');
    const colorScheme = useColorScheme() ?? 'dark';
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

        // If no conversation exists, create one first
        if (!currentConversationId) {
            try {
                await createConversation();
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
        // If no conversation, create one first with the selected LLM
        if (!currentConversationId) {
            await createConversation(llmId, model);
        } else {
            await setActiveLLM(llmId, model);
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
                selectedLLMId={conversation?.activeLLMId || ''}
                selectedModel={conversation?.activeModel || ''}
                onChangeModel={handleChangeModel}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
