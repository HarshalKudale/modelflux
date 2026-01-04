import { create } from 'zustand';
import { LLMError, llmClientFactory } from '../core/llm';
import { conversationRepository, messageRepository } from '../core/storage';
import { Conversation, Message, generateId } from '../core/types';
import { logger } from '../services/LoggerService.native';
import { isLocalProvider, useExecutorchLLMStore } from './executorchLLMStore';
import { useLLMStore } from './llmStore';
import {
    CONTEXT_INSTRUCTION,
    compileSystemPrompt,
    prepareChatMessages
} from './messageHelpers';
import { usePersonaStore } from './personaStore';
import { useRAGRuntimeStore } from './ragRuntimeStore';
import { useSettingsStore } from './settingsStore';

interface ConversationStoreState {
    conversations: Conversation[];
    currentConversationId: string | null;
    messages: Record<string, Message[]>;
    isLoadingConversations: boolean;
    isSendingMessage: boolean;
    isStreaming: boolean;
    currentMessageMap: Record<string, string>;
    currentThinkingMessageMap: Record<string, string>;
    error: string | null;
}

interface ConversationStoreActions {
    loadConversations: () => Promise<void>;
    createConversation: (llmId?: string, model?: string, personaId?: string) => Promise<Conversation>;
    startNewConversation: () => void;
    selectConversation: (id: string | null) => Promise<void>;
    deleteConversation: (id: string) => Promise<void>;
    updateConversationTitle: (id: string, title: string) => Promise<void>;
    setThinkingEnabled: (enabled: boolean) => Promise<void>;
    loadMessages: (conversationId: string) => Promise<void>;
    sendMessage: (content: string, selectedSourceIds?: number[]) => Promise<void>;
    cancelStreaming: () => Promise<void>;
    regenerateLastMessage: () => Promise<void>;
    setActiveLLM: (llmId: string, model: string) => Promise<void>;
    getCurrentConversation: () => Conversation | null;
    getCurrentMessages: () => Message[];
    clearError: () => void;
    updateCurrentMessage: (conversationId: string, content: string) => void;
    updateCurrentThinkingMessage: (conversationId: string, content: string) => void;
    clearCurrentMessage: (conversationId: string) => void;
    getCurrentMessage: (conversationId: string) => string;
    getCurrentThinkingMessage: (conversationId: string) => string;
}

type ConversationStore = ConversationStoreState & ConversationStoreActions;

// Store reference to active provider for interrupt calls
let activeProvider: { interrupt: () => void } | null = null;

export const useConversationStore = create<ConversationStore>((set, get) => ({
    // State
    conversations: [],
    currentConversationId: null,
    messages: {},
    isLoadingConversations: false,
    isSendingMessage: false,
    isStreaming: false,
    currentMessageMap: {},
    currentThinkingMessageMap: {},
    error: null,

    // Actions
    loadConversations: async () => {
        set({ isLoadingConversations: true, error: null });
        try {
            const conversations = await conversationRepository.findAllSorted();
            set({ conversations, isLoadingConversations: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load conversations',
                isLoadingConversations: false,
            });
        }
    },

    createConversation: async (llmId, model, personaId) => {
        const settings = useSettingsStore.getState().settings;
        const llmConfigs = useLLMStore.getState().configs;

        // Determine which LLM to use
        const providerId = llmId || settings.defaultLLMId || llmConfigs[0]?.id || '';
        const providerConfig = llmConfigs.find((c) => c.id === providerId);
        const modelId = model || providerConfig?.defaultModel || '';
        const providerType = providerConfig?.provider || 'openai';

        // Get persona prompt (without RAG context instruction)
        const persona = personaId
            ? usePersonaStore.getState().personas.find(p => p.id === personaId) || null
            : null;
        // Use pre-compiled prompt if available, otherwise generate (for legacy personas)
        const personaPrompt = persona?.compiledSystemPrompt || compileSystemPrompt(persona, false);

        const now = Date.now();
        const conversation: Conversation = {
            id: generateId(),
            title: 'New Conversation',
            createdAt: now,
            updatedAt: now,
            // New fields
            providerId,
            modelId,
            providerType,
            personaId,
            personaPrompt: personaPrompt || undefined,  // Persona prompt (empty if no persona)
            contextPrompt: undefined,                    // RAG context (set when sources first attached)
            // Deprecated fields for migration compatibility
            activeLLMId: providerId,
            activeModel: modelId,
        };

        try {
            await conversationRepository.create(conversation);
            set((state) => ({
                conversations: [conversation, ...state.conversations],
                currentConversationId: conversation.id,
                messages: { ...state.messages, [conversation.id]: [] },
            }));
            return conversation;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to create conversation',
            });
            throw error;
        }
    },

    selectConversation: async (id) => {
        set({ currentConversationId: id });
        if (id && !get().messages[id]) {
            await get().loadMessages(id);
        }

        // If conversation uses a local provider, sync with currently loaded local model
        if (id) {
            const conversation = get().conversations.find((c) => c.id === id);
            if (conversation) {
                // Use new fields with fallback to deprecated fields for migration
                const configId = conversation.providerId || conversation.activeLLMId || '';
                const currentModelId = conversation.modelId || conversation.activeModel || '';

                const llmConfig = useLLMStore.getState().getConfigById(configId);
                if (llmConfig && isLocalProvider(llmConfig.provider)) {
                    // Get currently loaded local model from executorchLLMStore
                    const { selectedModelId, selectedModelName } = useExecutorchLLMStore.getState();
                    if (selectedModelId && selectedModelName && currentModelId !== selectedModelId) {
                        logger.log('ConversationStore', 'Syncing local model for conversation:', selectedModelId);
                        // Update conversation to use the currently loaded local model
                        try {
                            const updated = await conversationRepository.update({
                                ...conversation,
                                modelId: selectedModelId,
                                activeModel: selectedModelId, // Keep deprecated field in sync
                            });
                            set((state) => ({
                                conversations: state.conversations.map((c) =>
                                    c.id === id ? updated : c
                                ),
                            }));
                        } catch (error) {
                            logger.error('ConversationStore', 'Failed to sync local model:', error);
                        }
                    }
                }
            }
        }
    },

    startNewConversation: () => {
        // Just clear the current conversation - don't create anything in database
        // The actual conversation will be created when the first message is sent
        set({ currentConversationId: null });
    },

    deleteConversation: async (id) => {
        try {
            await conversationRepository.delete(id);
            await messageRepository.deleteByConversationId(id);

            set((state) => {
                const { [id]: _, ...remainingMessages } = state.messages;
                return {
                    conversations: state.conversations.filter((c) => c.id !== id),
                    currentConversationId:
                        state.currentConversationId === id ? null : state.currentConversationId,
                    messages: remainingMessages,
                };
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to delete conversation',
            });
        }
    },

    updateConversationTitle: async (id, title) => {
        const conversation = get().conversations.find((c) => c.id === id);
        if (!conversation) return;

        try {
            const updated = await conversationRepository.update({ ...conversation, title });
            set((state) => ({
                conversations: state.conversations.map((c) =>
                    c.id === id ? updated : c
                ),
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to update title',
            });
        }
    },

    setThinkingEnabled: async (enabled) => {
        const { currentConversationId, conversations } = get();
        if (!currentConversationId) return;

        const conversation = conversations.find((c) => c.id === currentConversationId);
        if (!conversation) return;

        try {
            const updated = await conversationRepository.update({
                ...conversation,
                thinkingEnabled: enabled,
            });
            set((state) => ({
                conversations: state.conversations.map((c) =>
                    c.id === currentConversationId ? updated : c
                ),
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to update thinking mode',
            });
        }
    },

    loadMessages: async (conversationId) => {
        try {
            const messages = await messageRepository.findByConversationIdSorted(conversationId);
            set((state) => ({
                messages: { ...state.messages, [conversationId]: messages },
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load messages',
            });
        }
    },

    sendMessage: async (content, selectedSourceIds) => {
        const { currentConversationId, conversations } = get();
        if (!currentConversationId || !content.trim()) return;

        const conversation = conversations.find((c) => c.id === currentConversationId);
        if (!conversation) return;

        // Use new field with fallback to deprecated field for migration
        const configId = conversation.providerId || conversation.activeLLMId || '';
        const llmConfig = useLLMStore.getState().getConfigById(configId);
        if (!llmConfig) {
            set({ error: 'No LLM configured. Please add an LLM in settings.' });
            return;
        }

        const now = Date.now();

        // Generate RAG context if sources are selected - RAG store handles lazy init internally
        let contextResult = { contextMap: {} as Record<number, string>, contextString: '' };
        let updatedConversation = conversation;

        if (selectedSourceIds && selectedSourceIds.length > 0) {
            contextResult = await useRAGRuntimeStore.getState().generateContext(content, selectedSourceIds);

            // Set contextPrompt on conversation if not already set (first time sources attached)
            if (!conversation.contextPrompt) {
                try {
                    updatedConversation = await conversationRepository.update({
                        ...conversation,
                        contextPrompt: CONTEXT_INSTRUCTION,
                    });
                    set((state) => ({
                        conversations: state.conversations.map((c) =>
                            c.id === currentConversationId ? updatedConversation : c
                        ),
                    }));
                    logger.log('ConversationStore', 'Set contextPrompt on conversation (first source attached)');
                } catch (error) {
                    logger.error('ConversationStore', 'Failed to update contextPrompt:', error);
                }
            }
        }

        // Create user message - context stored in message.context field
        const conversationModelId = conversation.modelId || conversation.activeModel || '';

        const userMessage: Message = {
            id: generateId(),
            conversationId: currentConversationId,
            role: 'user',
            content: content.trim(),
            contentType: 'text',
            timestamp: now,
            modelId: conversationModelId,
            // Store context in dedicated field (NOT in content)
            context: contextResult.contextString || undefined,
            contextIds: selectedSourceIds && selectedSourceIds.length > 0 ? selectedSourceIds : undefined,
            // Deprecated fields for migration
            llmIdUsed: conversation.providerId || conversation.activeLLMId,
            modelUsed: conversationModelId,
            sourceIds: selectedSourceIds && selectedSourceIds.length > 0 ? selectedSourceIds : undefined,
            contextMap: Object.keys(contextResult.contextMap).length > 0 ? contextResult.contextMap : undefined,
        };

        // Save user message and update UI
        try {
            await messageRepository.create(userMessage);
            set((state) => ({
                messages: {
                    ...state.messages,
                    [currentConversationId]: [...(state.messages[currentConversationId] || []), userMessage],
                },
                isSendingMessage: true,
                error: null,
            }));

            // Update conversation title if first message
            const currentMessages = get().messages[currentConversationId] || [];
            if (currentMessages.filter((m) => m.role === 'user').length === 1) {
                const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
                await get().updateConversationTitle(currentConversationId, title);
            }

            // Build chat messages using helper (uses updated conversation with contextPrompt)
            const chatMessages = prepareChatMessages(updatedConversation, currentMessages);

            const client = llmClientFactory.getClient(llmConfig);
            // Store reference for interrupt calls
            activeProvider = client;

            // Clear current message for this conversation before starting
            get().clearCurrentMessage(currentConversationId);
            logger.log('ConversationStore', 'Calling sendMessageStream with', chatMessages.length, 'messages');

            // Set isStreaming=true - use new callbacks for streaming updates
            set({ isStreaming: true });

            // Use new modelId field with fallback
            const currentModelId = conversation.modelId || conversation.activeModel || '';

            const stream = client.sendMessageStream({
                llmConfig,
                messages: chatMessages,
                model: currentModelId,
                thinkingEnabled: conversation.thinkingEnabled,
                onToken: (content: string) => {
                    get().updateCurrentMessage(currentConversationId, content);
                },
                onThinking: (content: string) => {
                    get().updateCurrentThinkingMessage(currentConversationId, content);
                },
            });

            // Wait for stream to complete - callbacks update currentMessageMap
            for await (const chunk of stream) {
                if (chunk.done) break;
            }

            // Check if streaming was cancelled - if so, cancelStreaming already saved the message
            // This prevents duplicate messages when user interrupts during generation
            if (!get().isStreaming) {
                logger.log('ConversationStore', 'Streaming was cancelled, skipping message save (handled by cancelStreaming)');
                return;
            }

            // Get the final content from currentMessageMap (populated by callbacks during streaming)
            const fullContent = get().getCurrentMessage(currentConversationId);
            const thinkingContent = get().getCurrentThinkingMessage(currentConversationId);

            // Save assistant message with the collected content
            const assistantMessage: Message = {
                id: generateId(),
                conversationId: currentConversationId,
                role: 'assistant',
                content: fullContent,
                contentType: 'text',
                timestamp: Date.now(),
                // New field
                modelId: currentModelId,
                thinkingContent: thinkingContent || undefined,
                // Deprecated fields for migration compatibility
                llmIdUsed: conversation.providerId || conversation.activeLLMId,
                modelUsed: currentModelId,
            };

            await messageRepository.create(assistantMessage);

            // Add message to state and clear streaming content
            set((state) => {
                const { [currentConversationId]: _, ...restMessages } = state.currentMessageMap;
                const { [currentConversationId]: __, ...restThinking } = state.currentThinkingMessageMap;
                return {
                    messages: {
                        ...state.messages,
                        [currentConversationId]: [
                            ...(state.messages[currentConversationId] || []),
                            assistantMessage,
                        ],
                    },
                    currentMessageMap: restMessages,
                    currentThinkingMessageMap: restThinking,
                    isStreaming: false,
                    isSendingMessage: false,
                };
            });

            // Update conversation timestamp
            await conversationRepository.touch(currentConversationId);

        } catch (error) {
            if (error instanceof LLMError && error.code === 'CANCELLED') {
                // User cancelled, just reset state
                if (currentConversationId) {
                    get().clearCurrentMessage(currentConversationId);
                }
                set({ isSendingMessage: false, isStreaming: false });
                return;
            }

            if (currentConversationId) {
                get().clearCurrentMessage(currentConversationId);
            }
            set({
                error: error instanceof Error ? error.message : 'Failed to send message',
                isSendingMessage: false,
                isStreaming: false,
            });
        } finally {
            activeProvider = null;
        }
    },

    cancelStreaming: async () => {
        const { currentConversationId, conversations } = get();

        // Immediately set streaming to false so UI updates
        set({ isStreaming: false, isSendingMessage: false });

        // Call interrupt on the provider (stops native model or HTTP request)
        if (activeProvider) {
            try {
                activeProvider.interrupt();
            } catch (e) {
                logger.warn('ConversationStore', 'Error interrupting provider:', e);
            }
            activeProvider = null;
        }

        // Get any partial content that was being streamed
        if (currentConversationId) {
            const partialContent = get().getCurrentMessage(currentConversationId);
            const partialThinking = get().getCurrentThinkingMessage(currentConversationId);

            // If there's partial content OR partial thinking, save it as an interrupted message
            // This ensures we preserve thinking content even if no actual response was generated
            if ((partialContent && partialContent.trim()) || (partialThinking && partialThinking.trim())) {
                const conversation = conversations.find((c) => c.id === currentConversationId);
                if (conversation) {
                    const currentModelId = conversation.modelId || conversation.activeModel || '';

                    const interruptedMessage: Message = {
                        id: generateId(),
                        conversationId: currentConversationId,
                        role: 'assistant',
                        content: partialContent || '', // May be empty if interrupted during thinking
                        contentType: 'text',
                        timestamp: Date.now(),
                        // New field
                        modelId: currentModelId,
                        thinkingContent: partialThinking || undefined,
                        // Mark as interrupted
                        interrupted: true,
                        // Deprecated fields for compatibility
                        llmIdUsed: conversation.providerId || conversation.activeLLMId,
                        modelUsed: currentModelId,
                    };

                    try {
                        await messageRepository.create(interruptedMessage);
                        set((state) => ({
                            messages: {
                                ...state.messages,
                                [currentConversationId]: [
                                    ...(state.messages[currentConversationId] || []),
                                    interruptedMessage,
                                ],
                            },
                        }));
                        logger.log('ConversationStore', 'Saved interrupted message with',
                            partialContent?.length || 0, 'chars content,',
                            partialThinking?.length || 0, 'chars thinking');
                    } catch (error) {
                        logger.error('ConversationStore', 'Failed to save interrupted message:', error);
                    }
                }
            }

            // Clear the streaming state
            get().clearCurrentMessage(currentConversationId);
        }

        set({ isStreaming: false, isSendingMessage: false });
    },

    setActiveLLM: async (llmId, model) => {
        const { currentConversationId, conversations } = get();
        if (!currentConversationId) return;

        const conversation = conversations.find((c) => c.id === currentConversationId);
        if (!conversation) return;

        // Get provider type from config
        const llmConfig = useLLMStore.getState().getConfigById(llmId);
        const providerType = llmConfig?.provider || conversation.providerType;

        try {
            const updated = await conversationRepository.update({
                ...conversation,
                // New fields
                providerId: llmId,
                modelId: model,
                providerType: providerType,
                // Keep deprecated fields in sync for migration
                activeLLMId: llmId,
                activeModel: model,
            });
            set((state) => ({
                conversations: state.conversations.map((c) =>
                    c.id === currentConversationId ? updated : c
                ),
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to update LLM',
            });
        }
    },

    regenerateLastMessage: async () => {
        const { currentConversationId, messages } = get();
        if (!currentConversationId) {
            set({ error: 'No conversation selected' });
            return;
        }

        const currentMessages = messages[currentConversationId] || [];
        if (currentMessages.length === 0) {
            set({ error: 'No messages to regenerate' });
            return;
        }

        // Find the last message and verify it's an assistant message
        const lastMessage = currentMessages[currentMessages.length - 1];
        if (lastMessage.role !== 'assistant') {
            set({ error: 'Can only regenerate assistant messages' });
            return;
        }

        // Get the user message that triggered this response
        // Find the last user message before this assistant message
        let lastUserMessage: Message | undefined;
        for (let i = currentMessages.length - 2; i >= 0; i--) {
            if (currentMessages[i].role === 'user') {
                lastUserMessage = currentMessages[i];
                break;
            }
        }

        if (!lastUserMessage) {
            set({ error: 'No user message found to regenerate from' });
            return;
        }

        try {
            // Delete the last assistant message from repository
            await messageRepository.delete(lastMessage.id);

            // Update local state to remove the last assistant message
            set((state) => ({
                messages: {
                    ...state.messages,
                    [currentConversationId]: currentMessages.slice(0, -1),
                },
            }));

            logger.log('ConversationStore', 'Deleted last assistant message, re-sending...');

            // Re-send the last user message (with its original context if any)
            // Note: We use the original sourceIds/contextIds from the user message
            const sourceIds = lastUserMessage.contextIds || lastUserMessage.sourceIds;
            await get().sendMessage(lastUserMessage.content, sourceIds);

        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to regenerate message',
            });
        }
    },

    getCurrentConversation: () => {
        const { currentConversationId, conversations } = get();
        return conversations.find((c) => c.id === currentConversationId) || null;
    },

    getCurrentMessages: () => {
        const { currentConversationId, messages } = get();
        return currentConversationId ? messages[currentConversationId] || [] : [];
    },

    clearError: () => {
        set({ error: null });
    },

    updateCurrentMessage: (conversationId, content) => {
        set((state) => ({
            currentMessageMap: {
                ...state.currentMessageMap,
                [conversationId]: content,
            },
        }));
    },

    updateCurrentThinkingMessage: (conversationId, content) => {
        set((state) => ({
            currentThinkingMessageMap: {
                ...state.currentThinkingMessageMap,
                [conversationId]: content,
            },
        }));
    },

    clearCurrentMessage: (conversationId) => {
        set((state) => {
            const { [conversationId]: _, ...restMessages } = state.currentMessageMap;
            const { [conversationId]: __, ...restThinking } = state.currentThinkingMessageMap;
            return {
                currentMessageMap: restMessages,
                currentThinkingMessageMap: restThinking,
            };
        });
    },

    getCurrentMessage: (conversationId) => {
        return get().currentMessageMap[conversationId] || '';
    },

    getCurrentThinkingMessage: (conversationId) => {
        return get().currentThinkingMessageMap[conversationId] || '';
    },
}));

