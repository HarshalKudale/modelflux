import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../config/theme';
import { useProviderConfigStore, useRAGRuntimeStore, useSettingsStore } from '../../../state';
import { useAppColorScheme, useLocale } from '../../hooks';

interface MessageInputProps {
    value: string;
    onChange: (text: string) => void;
    onSend: () => void;
    onStop: () => void;
    isStreaming: boolean;
    disabled: boolean;
    // RAG props
    onSourcesPress?: () => void;
    selectedSourceCount?: number;
    hasSources?: boolean;  // True if any sources exist
}

export function MessageInput({
    value,
    onChange,
    onSend,
    onStop,
    isStreaming,
    disabled,
    onSourcesPress,
    selectedSourceCount = 0,
    hasSources = false,
}: MessageInputProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();
    const [inputHeight, setInputHeight] = useState(44);

    // Check if RAG is enabled and not stale - also require a default provider
    const ragSettings = useSettingsStore((state) => state.settings.ragSettings);
    const isStale = useRAGRuntimeStore((state) => state.status === 'stale');
    const hasDefaultProvider = useProviderConfigStore((state) => state.configs.some(c => c.isDefault));

    // Show sources button only if: (RAG enabled OR has sources) AND not web AND not stale AND has default provider
    const isRagEnabled = (ragSettings?.isEnabled || hasSources) && Platform.OS !== 'web' && !isStale && hasDefaultProvider;

    const handleSend = () => {
        if (value.trim() && !disabled) {
            onSend();
        }
    };

    const handleKeyPress = (e: any) => {
        // Web: Enter to send, Shift+Enter for newline
        if (Platform.OS === 'web') {
            if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        }
    };

    const canSend = value.trim().length > 0 && !disabled && !isStreaming;
    const hasSelectedSources = selectedSourceCount > 0;

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>

            {/* Input row */}
            {/* Sources button - only show when RAG is enabled */}
            {isRagEnabled && onSourcesPress && (
                <TouchableOpacity
                    onPress={onSourcesPress}
                    style={[
                        styles.sourcesButton,
                        hasSelectedSources && { backgroundColor: colors.tint + '20' },
                    ]}
                >
                    <Ionicons
                        name={hasSelectedSources ? "documents" : "add-circle-outline"}
                        size={22}
                        color={hasSelectedSources ? colors.tint : colors.textMuted}
                    />
                </TouchableOpacity>

            )}
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
        paddingBottom: Platform.OS === 'ios' ? Spacing.lg : Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    inputContainer: {
        flex: 1,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
    },
    sourcesButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        fontSize: FontSizes.md,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        maxHeight: 120,
        ...Platform.select({
            web: {
                outlineStyle: 'none',
            } as any,
        }),
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: Spacing.xs,
    },
});
