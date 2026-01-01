import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../config/theme';
import { Conversation } from '../../../core/types';
import { useAppColorScheme } from '../../hooks';

interface ChatHeaderProps {
    conversation: Conversation | null;
    onEditTitle: (title: string) => void;
    onMenuPress?: () => void;
    onSettingsPress?: () => void;
    showAlert?: boolean; // Show warning icon instead of settings when local model needs selection
}

export function ChatHeader({
    conversation,
    onEditTitle,
    onMenuPress,
    onSettingsPress,
    showAlert = false,
}: ChatHeaderProps) {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];

    const handleStartEdit = () => {
        if (conversation) {
            setEditedTitle(conversation.title);
            setIsEditingTitle(true);
        }
    };

    const handleSaveTitle = () => {
        if (editedTitle.trim()) {
            onEditTitle(editedTitle.trim());
        }
        setIsEditingTitle(false);
    };

    if (!conversation) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                <View style={styles.leftSection}>
                    {onMenuPress && (
                        <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
                            <Ionicons name="menu" size={24} color={colors.text} />
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.centerSection}>
                    <Text style={[styles.title, { color: colors.textSecondary }]}>
                        New Conversation
                    </Text>
                </View>
                <View style={styles.rightSection} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            <View style={styles.leftSection}>
                {onMenuPress && (
                    <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
                        <Ionicons name="menu" size={24} color={colors.text} />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.centerSection}>
                {isEditingTitle ? (
                    <TextInput
                        value={editedTitle}
                        onChangeText={setEditedTitle}
                        onBlur={handleSaveTitle}
                        onSubmitEditing={handleSaveTitle}
                        autoFocus
                        style={[styles.titleInput, { color: colors.text, borderColor: colors.border }]}
                        selectTextOnFocus
                    />
                ) : (
                    <TouchableOpacity onPress={handleStartEdit} style={styles.titleContainer}>
                        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                            {conversation.title}
                        </Text>
                        <Ionicons name="pencil" size={14} color={colors.textMuted} style={styles.editIcon} />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.rightSection}>
                {onSettingsPress && (
                    <TouchableOpacity onPress={onSettingsPress} style={styles.settingsButton}>
                        <Ionicons
                            name={showAlert ? 'alert-circle' : 'settings-outline'}
                            size={22}
                            color={showAlert ? colors.warning : colors.textMuted}
                        />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        minHeight: 56,
        ...Platform.select({
            web: {
                position: 'sticky' as any,
                top: 0,
                zIndex: 10,
            },
        }),
    },
    leftSection: {
        width: 48,
    },
    menuButton: {
        padding: Spacing.xs,
    },
    centerSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.sm,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        maxWidth: '100%',
    },
    title: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        maxWidth: 200,
    },
    editIcon: {
        marginLeft: Spacing.xs,
    },
    titleInput: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        textAlign: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderWidth: 1,
        borderRadius: BorderRadius.sm,
        minWidth: 150,
    },
    rightSection: {
        width: 80,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: Spacing.xs,
    },

    settingsButton: {
        padding: Spacing.xs,
    },
});
