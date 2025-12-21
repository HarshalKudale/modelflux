import { create } from 'zustand';
import { ChatMessage, LLMError, llmClientFactory } from '../core/llm';
import { conversationRepository, messageRepository } from '../core/storage';
import { Conversation, Message, generateId } from '../core/types';
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
    streamingContent: string;
    error: string | null;
}

interface ConversationStoreActions {
    loadConversations: () => Promise<void>;
    createConversation: (llmId?: string, model?: string, personaId?: string) => Promise<Conversation>;
    startNewConversation: () => void;
    selectConversation: (id: string | null) => Promise<void>;
    deleteConversation: (id: string) => Promise<void>;
    updateConversationTitle: (id: string, title: string) => Promise<void>;
    loadMessages: (conversationId: string) => Promise<void>;
    sendMessage: (content: string) => Promise<void>;
    cancelStreaming: () => void;
    setActiveLLM: (llmId: string, model: string) => Promise<void>;
    getCurrentConversation: () => Conversation | null;
    getCurrentMessages: () => Message[];
    clearError: () => void;
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
    streamingContent: '',
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

    sendMessage: async (content) => {
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

                    chatMessages.unshift({
                        role: 'system',
                        content: systemContent,
                    });
                }
            }

            // Create abort controller
            abortController = new AbortController();

            const client = llmClientFactory.getClient(llmConfig);
            const streamingEnabled = useSettingsStore.getState().settings.streamingEnabled;

            if (streamingEnabled) {
                set({ isStreaming: true, streamingContent: '' });

                let fullContent = '';
                const stream = client.sendMessageStream({
                    llmConfig,
                    messages: chatMessages,
                    model: conversation.activeModel,
                    signal: abortController.signal,
                });

                for await (const chunk of stream) {
                    fullContent += chunk.content;
                    set({ streamingContent: fullContent });

                    if (chunk.done) break;
                }

                // Save assistant message
                const assistantMessage: Message = {
                    id: generateId(),
                    conversationId: currentConversationId,
                    role: 'assistant',
                    content: fullContent,
                    contentType: 'text',
                    timestamp: Date.now(),
                    llmIdUsed: conversation.activeLLMId,
                    modelUsed: conversation.activeModel,
                };

                await messageRepository.create(assistantMessage);
                set((state) => ({
                    messages: {
                        ...state.messages,
                        [currentConversationId]: [
                            ...(state.messages[currentConversationId] || []),
                            assistantMessage,
                        ],
                    },
                    isStreaming: false,
                    isSendingMessage: false,
                    streamingContent: '',
                }));
            } else {
                // Non-streaming request
                const response = await client.sendMessage({
                    llmConfig,
                    messages: chatMessages,
                    model: conversation.activeModel,
                    signal: abortController.signal,
                });

                const assistantMessage: Message = {
                    id: generateId(),
                    conversationId: currentConversationId,
                    role: 'assistant',
                    content: response.content,
                    contentType: response.images?.length ? 'mixed' : 'text',
                    images: response.images?.map((img) => ({
                        id: generateId(),
                        url: img.url,
                        revisedPrompt: img.revisedPrompt,
                    })),
                    timestamp: Date.now(),
                    llmIdUsed: conversation.activeLLMId,
                    modelUsed: conversation.activeModel,
                    usage: response.usage,
                };

                await messageRepository.create(assistantMessage);
                set((state) => ({
                    messages: {
                        ...state.messages,
                        [currentConversationId]: [
                            ...(state.messages[currentConversationId] || []),
                            assistantMessage,
                        ],
                    },
                    isSendingMessage: false,
                }));
            }

            // Update conversation timestamp
            await conversationRepository.touch(currentConversationId);

        } catch (error) {
            if (error instanceof LLMError && error.code === 'CANCELLED') {
                // User cancelled, just reset state
                set({ isSendingMessage: false, isStreaming: false, streamingContent: '' });
                return;
            }

            set({
                error: error instanceof Error ? error.message : 'Failed to send message',
                isSendingMessage: false,
                isStreaming: false,
                streamingContent: '',
            });
        } finally {
            abortController = null;
        }
    },

    cancelStreaming: () => {
        if (abortController) {
            abortController.abort();
            abortController = null;
        }
        set({ isStreaming: false, isSendingMessage: false, streamingContent: '' });
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
}));
