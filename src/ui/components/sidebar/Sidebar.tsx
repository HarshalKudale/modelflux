import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSizes, Spacing } from '../../../config/theme';
import { useConversationStore } from '../../../state';
import { ConversationList } from './ConversationList';
import { NewChatButton } from './NewChatButton';
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
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];

    const {
        conversations,
        currentConversationId,
        createConversation,
        selectConversation,
        deleteConversation,
    } = useConversationStore();

    const handleNewChat = async () => {
        await createConversation();
    };

    if (isCollapsed) {
        return (
            <SafeAreaView style={[styles.collapsedContainer, { backgroundColor: colors.sidebar }]} edges={['top', 'bottom']}>
                <TouchableOpacity onPress={onToggleCollapse} style={styles.expandButton}>
                    <Ionicons name="menu" size={24} color={colors.text} />
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.sidebar }]} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>LLM Hub</Text>
                <TouchableOpacity onPress={onToggleCollapse} style={styles.collapseButton}>
                    <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
                </TouchableOpacity>
            </View>

            {/* New Chat Button */}
            <NewChatButton onPress={handleNewChat} />

            {/* Conversation List */}
            <ConversationList
                conversations={conversations}
                selectedId={currentConversationId}
                onSelect={selectConversation}
                onDelete={deleteConversation}
            />

            {/* User Info / Settings */}
            <UserInfo onSettingsPress={() => onNavigate('settings')} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 280,
        height: '100%',
        flexDirection: 'column',
    },
    collapsedContainer: {
        width: 60,
        height: '100%',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
    },
    title: {
        fontSize: FontSizes.xl,
        fontWeight: '700',
    },
    collapseButton: {
        padding: Spacing.xs,
    },
    expandButton: {
        padding: Spacing.sm,
    },
});

