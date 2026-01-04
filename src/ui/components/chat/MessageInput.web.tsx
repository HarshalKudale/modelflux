/**
 * MessageInput - Web Implementation
 * No RAG sources button, Enter to send
 */
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../config/theme';
import { useAppColorScheme, useLocale } from '../../hooks';

interface MessageInputProps {
    value: string;
    onChange: (text: string) => void;
    onSend: () => void;
    onStop: () => void;
    isStreaming: boolean;
    disabled: boolean;
    onSourcesPress?: () => void;
    selectedSourceCount?: number;
    hasSources?: boolean;
}

export function MessageInput({
    value,
    onChange,
    onSend,
    onStop,
    isStreaming,
    disabled,
}: MessageInputProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();
    const [inputHeight, setInputHeight] = useState(44);

    const handleSend = () => {
        if (value.trim() && !disabled) {
            onSend();
        }
    };

    const handleKeyPress = (e: any) => {
        if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const canSend = value.trim().length > 0 && !disabled && !isStreaming;

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
            <View
                style={[
                    styles.inputContainer,
                    { backgroundColor: colors.background, borderColor: colors.border },
                ]}
            >
                <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder={disabled ? t('chat.input.placeholder.noLlm') : t('chat.input.placeholder')}
                    placeholderTextColor={colors.textMuted}
                    multiline
                    editable={!disabled}
                    style={[
                        styles.input,
                        { color: colors.text, height: Math.min(inputHeight, 120) },
                    ]}
                    onContentSizeChange={(e) => {
                        setInputHeight(Math.max(44, e.nativeEvent.contentSize.height));
                    }}
                    onKeyPress={handleKeyPress}
                />
            </View>

            {isStreaming ? (
                <TouchableOpacity
                    onPress={onStop}
                    style={[styles.sendButton, { backgroundColor: colors.error }]}
                >
                    <Ionicons name="stop" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    onPress={handleSend}
                    disabled={!canSend}
                    style={[
                        styles.sendButton,
                        {
                            backgroundColor: canSend ? colors.tint : colors.backgroundTertiary,
                        },
                    ]}
                >
                    <Ionicons
                        name="send"
                        size={18}
                        color={canSend ? '#FFFFFF' : colors.textMuted}
                    />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        paddingBottom: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    inputContainer: {
        flex: 1,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
    },
    input: {
        fontSize: FontSizes.md,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        maxHeight: 120,
        outlineStyle: 'none',
    } as any,
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: Spacing.xs,
    },
});
