import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, Colors, FontSizes, Layout, Spacing } from '../../../config/theme';
import { useConversationRuntimeStore, useConversationStore } from '../../../state';
import { useAppColorScheme, useLocale } from '../../hooks';
import { ConversationList } from './ConversationList';
import { NewChatButton } from './NewChatButton';
import { SourcesModal } from './SourcesModal';
import { UserInfo } from './UserInfo';

interface SidebarProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    onNavigate: (screen: 'settings' | 'llm-management') => void;
}

export function Sidebar({
    isCollapsed,
    onToggleCollapse,
    onNavigate,
}: SidebarProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();

    const [isSourcesModalVisible, setSourcesModalVisible] = useState(false);

    const {
        conversations,
        currentConversationId,
        startNewConversation,
        selectConversation,
        deleteConversation,
        getCurrentMessages,
        isStreaming,
        cancelStreaming,
    } = useConversationStore();

    const { confirmSwitchConversation } = useConversationRuntimeStore();

    // Check if we're already on a new (empty) conversation
    const currentMessages = getCurrentMessages();
    const isOnNewConversation = currentConversationId === null;

    const handleNewChat = async () => {
        // Don't go to new conversation if we're already on one
        if (isOnNewConversation) return;

        // If streaming, show confirmation
        if (isStreaming) {
            const confirmed = await confirmSwitchConversation(null);
            if (!confirmed) return;
            await cancelStreaming();
        }
        startNewConversation();
    };

    // Safe conversation selection with streaming check
    const handleSelectConversation = async (id: string | null) => {
        if (id === currentConversationId) return;

        // If streaming, show confirmation
        if (isStreaming) {
            const confirmed = await confirmSwitchConversation(id);
            if (!confirmed) return;
            await cancelStreaming();
        }
        await selectConversation(id);
    };

    const isWeb = Platform.OS === 'web';

    // Collapsed state - show thin bar with icons
    if (isCollapsed) {
        return (
            <SafeAreaView
                style={[
                    styles.collapsedContainer,
                    { backgroundColor: colors.sidebar, borderRightColor: colors.border }
                ]}
                edges={['top', 'bottom']}
            >
                {/* Toggle button */}
                <TouchableOpacity
                    onPress={onToggleCollapse}
                    style={[styles.collapsedButton, styles.toggleButton]}
                >
                    <Ionicons name="menu" size={22} color={colors.text} />
                </TouchableOpacity>

                {/* New Chat button */}
                <TouchableOpacity
                    onPress={handleNewChat}
                    style={[
                        styles.collapsedButton,
                        { backgroundColor: colors.tint },
                        isOnNewConversation && { opacity: 0.5 }
                    ]}
                    disabled={isOnNewConversation}
                >
                    <Ionicons name="add" size={22} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Spacer */}
                <View style={styles.collapsedSpacer} />

                {/* Settings button */}
                <TouchableOpacity
                    onPress={() => onNavigate('settings')}
                    style={[styles.collapsedButton, { backgroundColor: colors.backgroundSecondary }]}
                >
                    <Ionicons name="settings-outline" size={20} color={colors.text} />
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            style={[
                styles.container,
                { backgroundColor: colors.sidebar, borderRightColor: colors.border }
            ]}
            edges={['top', 'bottom']}
        >
            {/* Header - ModelFlux left, sidebar toggle right */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>{t('app.name')}</Text>
                <TouchableOpacity onPress={onToggleCollapse} style={styles.toggleButton}>
                    <Ionicons name="chevron-back-outline" size={20} color={colors.textMuted} />
                </TouchableOpacity>
            </View>

            {/* New Chat Button - below header */}
            <NewChatButton onPress={handleNewChat} disabled={isOnNewConversation} />

            {/* Conversation List */}
            <ConversationList
                conversations={conversations}
                selectedId={currentConversationId}
                onSelect={handleSelectConversation}
                onDelete={deleteConversation}
            />

            {/* User Info / Settings */}
            <UserInfo
                onSettingsPress={() => {
                    onNavigate('settings')
                }}
                onSourcesPress={() => setSourcesModalVisible(true)}
            />

            {/* Sources Modal */}
            <SourcesModal
                visible={isSourcesModalVisible}
                onClose={() => setSourcesModalVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        width: Layout.sidebarWidth,
        height: '100%',
        flexDirection: 'column',
        borderRightWidth: 1,
    },
    collapsedContainer: {
        width: Layout.sidebarCollapsedWidth,
        height: '100%',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderRightWidth: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    toggleButton: {
        padding: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
    title: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
    },
    collapsedButton: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    collapsedSpacer: {
        flex: 1,
    },
});

