import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../config/theme';
import { useLLMStore } from '../../../state';
import { useAppColorScheme, useLocale } from '../../hooks';
import { ModelSelector } from './ModelSelector';

interface MessageInputProps {
    value: string;
    onChange: (text: string) => void;
    onSend: () => void;
    onStop: () => void;
    isStreaming: boolean;
    disabled: boolean;
    selectedLLMId?: string;
    selectedModel?: string;
    onChangeModel?: (llmId: string, model: string) => void;
    showPersonaSelector?: boolean;
    currentPersonaName?: string;
    onPersonaPress?: () => void;
}

export function MessageInput({
    value,
    onChange,
    onSend,
    onStop,
    isStreaming,
    disabled,
    selectedLLMId = '',
    selectedModel = '',
    onChangeModel,
    showPersonaSelector,
    currentPersonaName,
    onPersonaPress,
}: MessageInputProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();
    const [inputHeight, setInputHeight] = useState(44);

    const { configs } = useLLMStore();
    const selectedConfig = configs.find((c) => c.id === selectedLLMId);

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

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
            {/* Model selector row */}
            {onChangeModel && (
                <View style={styles.modelRow}>
                    <ModelSelector
                        selectedLLMId={selectedLLMId}
                        selectedModel={selectedModel}
                        onSelect={onChangeModel}
                    />
                </View>
            )}

            {/* Persona selector row */}
            {showPersonaSelector && onPersonaPress && (
                <TouchableOpacity style={styles.personaRow} onPress={onPersonaPress}>
                    <Ionicons name="person-circle-outline" size={16} color={colors.tint} />
                    <Text style={[styles.personaText, { color: colors.tint }]}>
                        {currentPersonaName || t('chat.persona.select')}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color={colors.tint} />
                </TouchableOpacity>
            )}

            {/* Input row */}
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        paddingBottom: Platform.OS === 'ios' ? Spacing.lg : Spacing.lg,
    },
    modelRow: {
        marginBottom: Spacing.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        paddingLeft: Spacing.md,
        paddingRight: Spacing.xs,
        paddingVertical: Spacing.xs,
    },
    input: {
        flex: 1,
        fontSize: FontSizes.md,
        paddingVertical: Spacing.sm,
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
        marginLeft: Spacing.sm,
    },
    personaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xs,
        gap: Spacing.xs,
    },
    personaText: {
        fontSize: FontSizes.sm,
        fontWeight: '500',
    },
});
