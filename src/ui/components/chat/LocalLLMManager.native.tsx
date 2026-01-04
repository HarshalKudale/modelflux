/**
 * LocalLLMManager Component - Native Implementation
 * Shows status banners for local model loading
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FontSizes, Spacing } from '../../../config/theme';
import { isLocalProvider, useConversationStore, useExecutorchLLMStore, useLLMStore } from '../../../state';

interface LocalLLMManagerProps {
    children: React.ReactNode;
}

export function LocalLLMManager({ children }: LocalLLMManagerProps) {
    const { selectedModelName, selectedModelId, isReady, isLoading, downloadProgress } = useExecutorchLLMStore();
    const { getConfigById } = useLLMStore();
    const { getCurrentConversation } = useConversationStore();

    const conversation = getCurrentConversation();
    const conversationConfig = conversation?.activeLLMId ? getConfigById(conversation.activeLLMId) : null;
    const needsLocalModel = conversationConfig && isLocalProvider(conversationConfig.provider);
    const hasMatchingLoadedModel = selectedModelId && isReady;

    if (needsLocalModel && !hasMatchingLoadedModel && !isLoading) {
        return (
            <View style={styles.container}>
                <View style={styles.warningBanner}>
                    <Text style={styles.warningText}>
                        No local model loaded for this provider.
                        Load a model from provider settings to use this LLM.
                    </Text>
                </View>
                {children}
            </View>
        );
    }

    if (needsLocalModel && isLoading) {
        const progressPercent = Math.round(downloadProgress * 100);
        const statusText = downloadProgress < 1
            ? `Downloading model... ${progressPercent}%`
            : 'Loading model...';

        return (
            <View style={styles.container}>
                <View style={styles.loadingBanner}>
                    <Text style={styles.loadingText}>
                        {statusText}
                    </Text>
                </View>
                {children}
            </View>
        );
    }

    if (needsLocalModel && hasMatchingLoadedModel) {
        return (
            <View style={styles.container}>
                <View style={styles.successBanner}>
                    <Text style={styles.successText}>
                        Using local model: {selectedModelName}
                    </Text>
                </View>
                {children}
            </View>
        );
    }

    return <>{children}</>;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingBanner: {
        padding: Spacing.sm,
        backgroundColor: '#EEF2FF',
    },
    loadingText: {
        color: '#4338CA',
        fontSize: FontSizes.sm,
        textAlign: 'center',
    },
    warningBanner: {
        padding: Spacing.sm,
        backgroundColor: '#FEF3C7',
    },
    warningText: {
        color: '#92400E',
        fontSize: FontSizes.sm,
        textAlign: 'center',
    },
    successBanner: {
        padding: Spacing.sm,
        backgroundColor: '#D1FAE5',
    },
    successText: {
        color: '#065F46',
        fontSize: FontSizes.sm,
        textAlign: 'center',
    },
});
