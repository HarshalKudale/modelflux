/**
 * Conversation Runtime Store
 * 
 * Manages the runtime-only state for the currently active conversation.
 * This store resets when switching conversations and never persists data.
 * 
 * Key design principles:
 * - Runtime state ≠ persisted state
 * - Only one conversation can be generating at a time
 * - UI reads runtime state during active generation
 * - Providers emit tokens to this store, not directly to repositories
 * 
 * Responsibilities:
 * - Track current conversation context
 * - Manage generation state (streaming content)
 * - Handle source selection per-message
 * - Coordinate safe conversation switching during generation
 */

import { Alert } from 'react-native';
import { create } from 'zustand';
import { t } from '../services/LocaleService';

interface ConversationRuntimeState {
    // Current conversation context
    currentConversationId: string | null;

    // Generation state
    isGenerating: boolean;
    currentMessage: string;
    currentThinkingMessage: string;

    // Selections (per-message, cleared after send)
    selectedSources: number[];
    selectedProviderId: string | null;
    selectedModelId: string | null;

    // Error state
    error: string | null;
}

interface ConversationRuntimeActions {
    // Conversation lifecycle
    setCurrentConversation: (id: string | null) => void;

    /**
     * Handle navigation during active generation.
     * Shows warning: "Current conversation will stop generating if you switch"
     * If user confirms: interrupt, save partial state, then switch
     * Returns: true if switch allowed, false if cancelled
     */
    confirmSwitchConversation: (newId: string | null) => Promise<boolean>;

    // Generation control
    startGeneration: () => void;
    updateCurrentMessage: (content: string) => void;
    appendToCurrentMessage: (token: string) => void;
    updateCurrentThinkingMessage: (content: string) => void;
    appendToThinkingMessage: (token: string) => void;
    stopGeneration: () => void;

    /**
     * Interrupt generation and prepare for safe state save.
     * Called when stop button pressed or when switching conversations.
     * Returns the partial content for saving.
     */
    interruptAndGetPartialContent: () => { content: string; thinkingContent: string };

    // Source selection
    setSelectedSources: (sourceIds: number[]) => void;
    addSelectedSource: (sourceId: number) => void;
    removeSelectedSource: (sourceId: number) => void;
    clearSelectedSources: () => void;

    // Provider/model selection
    setSelectedProvider: (providerId: string) => void;
    setSelectedModel: (modelId: string) => void;

    // Error handling
    setError: (error: string | null) => void;
    clearError: () => void;

    // Reset
    reset: () => void;

    // Getters
    getCurrentMessage: () => string;
    getCurrentThinkingMessage: () => string;
    getSelectedSources: () => number[];
}

type ConversationRuntimeStore = ConversationRuntimeState & ConversationRuntimeActions;

const initialState: ConversationRuntimeState = {
    currentConversationId: null,
    isGenerating: false,
    currentMessage: '',
    currentThinkingMessage: '',
    selectedSources: [],
    selectedProviderId: null,
    selectedModelId: null,
    error: null,
};

export const useConversationRuntimeStore = create<ConversationRuntimeStore>((set, get) => ({
    // Initial state
    ...initialState,

    // Conversation lifecycle
    setCurrentConversation: (id) => {
        // If switching conversations, reset generation state
        if (id !== get().currentConversationId) {
            set({
                currentConversationId: id,
                isGenerating: false,
                currentMessage: '',
                currentThinkingMessage: '',
                selectedSources: [],
                error: null,
            });
        }
    },

    confirmSwitchConversation: async (newId) => {
        const { isGenerating, currentConversationId } = get();

        // If not generating or switching to same conversation, allow immediately
        if (!isGenerating || newId === currentConversationId) {
            get().setCurrentConversation(newId);
            return true;
        }

        // Show confirmation dialog
        return new Promise((resolve) => {
            Alert.alert(
                t('conversation.stopGeneration.title'),
                t('conversation.stopGeneration.message'),
                [
                    {
                        text: t('common.cancel'),
                        style: 'cancel',
                        onPress: () => resolve(false),
                    },
                    {
                        text: t('conversation.stopGeneration.switch'),
                        style: 'destructive',
                        onPress: () => {
                            // Interrupt and switch
                            get().interruptAndGetPartialContent();
                            get().setCurrentConversation(newId);
                            resolve(true);
                        },
                    },
                ]
            );
        });
    },

    // Generation control
    startGeneration: () => {
        set({
            isGenerating: true,
            currentMessage: '',
            currentThinkingMessage: '',
            error: null,
        });
    },

    updateCurrentMessage: (content) => {
        set({ currentMessage: content });
    },

    appendToCurrentMessage: (token) => {
        set((state) => ({
            currentMessage: state.currentMessage + token,
        }));
    },

    updateCurrentThinkingMessage: (content) => {
        set({ currentThinkingMessage: content });
    },

    appendToThinkingMessage: (token) => {
        set((state) => ({
            currentThinkingMessage: state.currentThinkingMessage + token,
        }));
    },

    stopGeneration: () => {
        set({ isGenerating: false });
    },

    interruptAndGetPartialContent: () => {
        const { currentMessage, currentThinkingMessage } = get();
        set({ isGenerating: false });
        return {
            content: currentMessage,
            thinkingContent: currentThinkingMessage,
        };
    },

    // Source selection
    setSelectedSources: (sourceIds) => {
        set({ selectedSources: sourceIds });
    },

    addSelectedSource: (sourceId) => {
        set((state) => ({
            selectedSources: state.selectedSources.includes(sourceId)
                ? state.selectedSources
                : [...state.selectedSources, sourceId],
        }));
    },

    removeSelectedSource: (sourceId) => {
        set((state) => ({
            selectedSources: state.selectedSources.filter((id) => id !== sourceId),
        }));
    },

    clearSelectedSources: () => {
        set({ selectedSources: [] });
    },

    // Provider/model selection
    setSelectedProvider: (providerId) => {
        set({ selectedProviderId: providerId });
    },

    setSelectedModel: (modelId) => {
        set({ selectedModelId: modelId });
    },

    // Error handling
    setError: (error) => {
        set({ error });
    },

    clearError: () => {
        set({ error: null });
    },

    // Reset
    reset: () => {
        set(initialState);
    },

    // Getters
    getCurrentMessage: () => get().currentMessage,
    getCurrentThinkingMessage: () => get().currentThinkingMessage,
    getSelectedSources: () => get().selectedSources,
}));
