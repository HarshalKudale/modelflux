import { create } from 'zustand';
import { CONTEXT_INSTRUCTION, K_DOCUMENTS_TO_RETRIEVE } from '../config/ragConstants';
import { ChatMessage, LLMError, llmClientFactory } from '../core/llm';
import { conversationRepository, messageRepository, sourceRepository } from '../core/storage';
import { Conversation, Message, Source, generateId } from '../core/types';
import { isLocalProvider, useExecutorchLLMStore } from './executorchLLMStore';
import { useExecutorchRagStore } from './executorchRagStore';
import { useLLMStore } from './llmStore';
import { usePersonaStore } from './personaStore';
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
    createConversation: (llmId?: string, model?: string, personaId?: string, thinkingEnabled?: boolean) => Promise<Conversation>;
    startNewConversation: () => void;
    selectConversation: (id: string | null) => Promise<void>;
    deleteConversation: (id: string) => Promise<void>;
    updateConversationTitle: (id: string, title: string) => Promise<void>;
    setThinkingEnabled: (enabled: boolean) => Promise<void>;
    loadMessages: (conversationId: string) => Promise<void>;
    sendMessage: (content: string, selectedSourceIds?: number[]) => Promise<void>;
    cancelStreaming: () => void;
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

let abortController: AbortController | null = null;

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

    createConversation: async (llmId, model, personaId, thinkingEnabled) => {
        const settings = useSettingsStore.getState().settings;
        const llmConfigs = useLLMStore.getState().configs;

        // Determine which LLM to use
        const activeLLMId = llmId || settings.defaultLLMId || llmConfigs[0]?.id || '';
        const activeLLMConfig = llmConfigs.find((c) => c.id === activeLLMId);
        const activeModel = model || activeLLMConfig?.defaultModel || '';

        const now = Date.now();
        const conversation: Conversation = {
            id: generateId(),
            title: 'New Conversation',
            createdAt: now,
            updatedAt: now,
            activeLLMId,
            activeModel,
            personaId,
            thinkingEnabled,
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
                const llmConfig = useLLMStore.getState().getConfigById(conversation.activeLLMId);
                if (llmConfig && isLocalProvider(llmConfig.provider)) {
                    // Get currently loaded local model from executorchLLMStore
                    const { selectedModelId, selectedModelName } = useExecutorchLLMStore.getState();
                    if (selectedModelId && selectedModelName && conversation.activeModel !== selectedModelId) {
                        console.log('[conversationStore] Syncing local model for conversation:', selectedModelId);
                        // Update conversation to use the currently loaded local model
                        try {
                            const updated = await conversationRepository.update({
                                ...conversation,
                                activeModel: selectedModelId,
                            });
                            set((state) => ({
                                conversations: state.conversations.map((c) =>
                                    c.id === id ? updated : c
                                ),
                            }));
                        } catch (error) {
                            console.error('Failed to sync local model:', error);
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

        const llmConfig = useLLMStore.getState().getConfigById(conversation.activeLLMId);
        if (!llmConfig) {
            set({ error: 'No LLM configured. Please add an LLM in settings.' });
            return;
        }

        const now = Date.now();

        // Create user message
        const userMessage: Message = {
            id: generateId(),
            conversationId: currentConversationId,
            role: 'user',
            content: content.trim(),
            contentType: 'text',
            timestamp: now,
            llmIdUsed: conversation.activeLLMId,
            modelUsed: conversation.activeModel,
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

            // Build chat history
            const chatMessages: ChatMessage[] = currentMessages.map((m) => ({
                role: m.role,
                content: m.content,
            }));

            // Prepare RAG context if sources are selected
            let ragContext: string[] = [];
            if (selectedSourceIds && selectedSourceIds.length > 0) {
                try {
                    const vectorStore = useExecutorchRagStore.getState().getVectorStore();
                    if (vectorStore) {
                        console.log('[conversationStore] Preparing RAG context for', selectedSourceIds.length, 'sources');

                        const results = await vectorStore.similaritySearch(
                            content,
                            K_DOCUMENTS_TO_RETRIEVE,
                            (value: { metadata?: { documentId?: number } }) => {
                                return selectedSourceIds.includes(value.metadata?.documentId || 0);
                            }
                        );

                        if (results && results.length > 0) {
                            const sources = await sourceRepository.findAll();
                            ragContext = results.map((item: { content: string; metadata?: { documentId?: number; name?: string }; similarity?: number }, index: number) => {
                                const sourceName = sources.find((s: Source) => s.id === item.metadata?.documentId)?.name
                                    || item.metadata?.name
                                    || `Document ${item.metadata?.documentId || 'Unknown'}`;
                                return `\n--- Source ${index + 1}: ${sourceName} ---\n${item.content.trim()}\n--- End of Source ${index + 1} ---`;
                            });
                            console.log('[conversationStore] Prepared', ragContext.length, 'context entries');
                        }
                    }
                } catch (e) {
                    console.error('[conversationStore] Error preparing RAG context:', e);
                }
            }

            // Prepend persona system prompt if persona is assigned
            if (conversation.personaId) {
                const persona = usePersonaStore.getState().getPersonaById(conversation.personaId);
                if (persona) {
                    // Build system prompt from persona details
                    const personaDetails: string[] = [];
                    if (persona.name) personaDetails.push(`Name: ${persona.name}`);
                    if (persona.age) personaDetails.push(`Age: ${persona.age}`);
                    if (persona.location) personaDetails.push(`Location: ${persona.location}`);
                    if (persona.job) personaDetails.push(`Job: ${persona.job}`);

                    let systemContent = persona.systemPrompt;
                    if (personaDetails.length > 0) {
                        systemContent = `${personaDetails.join(', ')}\n\n${persona.systemPrompt}`;
                    }

                    // Add RAG context instruction if context is available
                    if (ragContext.length > 0) {
                        systemContent = `${systemContent}\n\n${CONTEXT_INSTRUCTION}`;
                    }

                    chatMessages.unshift({
                        role: 'system',
                        content: systemContent,
                    });
                }
            } else if (ragContext.length > 0) {
                // No persona, but RAG context is available - add context instruction as system prompt
                chatMessages.unshift({
                    role: 'system',
                    content: CONTEXT_INSTRUCTION,
                });
            }

            // Wrap user message with context if available
            if (ragContext.length > 0) {
                const lastMessageIndex = chatMessages.length - 1;
                if (lastMessageIndex >= 0 && chatMessages[lastMessageIndex].role === 'user') {
                    chatMessages[lastMessageIndex].content = `<context>${ragContext.join(' ')}</context>\n${chatMessages[lastMessageIndex].content}`;
                }
            }

            // Create abort controller
            abortController = new AbortController();

            const client = llmClientFactory.getClient(llmConfig);

            // Clear current message for this conversation before starting
            get().clearCurrentMessage(currentConversationId);

            console.log('[conversationStore] Calling sendMessageStream with', chatMessages.length, 'messages');

            // Set isStreaming=true - providers will update currentMessage/currentThinkingMessage
            set({ isStreaming: true });

            const stream = client.sendMessageStream({
                llmConfig,
                messages: chatMessages,
                model: conversation.activeModel,
                signal: abortController.signal,
                thinkingEnabled: conversation.thinkingEnabled,
                conversationId: currentConversationId,
            });

            // Wait for stream to complete - providers update currentMessageMap via their streaming logic
            for await (const chunk of stream) {
                if (chunk.done) break;
            }

            // Get the final content from currentMessageMap (populated by providers during streaming)
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
                llmIdUsed: conversation.activeLLMId,
                modelUsed: conversation.activeModel,
                thinkingContent: thinkingContent || undefined,
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
            abortController = null;
        }
    },

    cancelStreaming: () => {
        const { currentConversationId } = get();
        if (abortController) {
            abortController.abort();
            abortController = null;
        }
        if (currentConversationId) {
            get().clearCurrentMessage(currentConversationId);
        }
        set({ isStreaming: false, isSendingMessage: false });
    },

    setActiveLLM: async (llmId, model) => {
        const { currentConversationId, conversations } = get();
        if (!currentConversationId) return;

        const conversation = conversations.find((c) => c.id === currentConversationId);
        if (!conversation) return;

        try {
            const updated = await conversationRepository.update({
                ...conversation,
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

