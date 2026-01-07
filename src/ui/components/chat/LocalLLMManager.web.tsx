/**
 * LocalLLMManager Component - Web Implementation
 * Shows error for local providers on web
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FontSizes, Spacing } from '../../../config/theme';
import { isLocalProvider, useConversationStore, useLLMStore } from '../../../state';

interface LocalLLMManagerProps {
    children: React.ReactNode;
}

export function LocalLLMManager({ children }: LocalLLMManagerProps) {
    const { getConfigById } = useLLMStore();
    const { getCurrentConversation } = useConversationStore();

    const conversation = getCurrentConversation();
    const conversationConfig = conversation?.providerId ? getConfigById(conversation.providerId) : null;
    const needsLocalModel = conversationConfig && isLocalProvider(conversationConfig.provider);

    if (needsLocalModel) {
        return (
            <View style={styles.container}>
                <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>
                        Local models are not supported on web. Please use a native build (iOS/Android).
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
    errorBanner: {
        padding: Spacing.sm,
        backgroundColor: '#FEE2E2',
    },
    errorText: {
        color: '#991B1B',
        fontSize: FontSizes.sm,
        textAlign: 'center',
    },
});
