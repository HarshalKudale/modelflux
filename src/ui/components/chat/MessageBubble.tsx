import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { memo, useCallback, useMemo, useState } from 'react';
import {
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../config/theme';
import { Message } from '../../../core/types';
import { useLLMStore } from '../../../state';
import { useAppColorScheme } from '../../hooks';

interface MessageBubbleProps {
    message: Message;
    showLLMBadge?: boolean;
}

// Code block component with copy button
const CodeBlock = memo(function CodeBlock({
    content,
    language,
    colors,
}: {
    content: string;
    language?: string;
    colors: any;
}) {
    const handleCopy = useCallback(async () => {
        await Clipboard.setStringAsync(content);
    }, [content]);

    return (
        <View style={[codeStyles.container, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={[codeStyles.header, { borderBottomColor: colors.border }]}>
                <Text style={[codeStyles.language, { color: colors.textMuted }]}>
                    {language || 'code'}
                </Text>
                <TouchableOpacity onPress={handleCopy} style={codeStyles.copyButton}>
                    <Ionicons name="copy-outline" size={14} color={colors.textMuted} />
                    <Text style={[codeStyles.copyText, { color: colors.textMuted }]}>Copy</Text>
                </TouchableOpacity>
            </View>
            <Text
                style={[
                    codeStyles.code,
                    {
                        color: colors.text,
                        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                    }
                ]}
                selectable
            >
                {content}
            </Text>
        </View>
    );
});

const codeStyles = StyleSheet.create({
    container: {
        borderRadius: BorderRadius.sm,
        marginVertical: Spacing.xs,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderBottomWidth: 1,
    },
    language: {
        fontSize: FontSizes.xs,
        textTransform: 'lowercase',
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: 4,
    },
    copyText: {
        fontSize: FontSizes.xs,
    },
    code: {
        fontSize: FontSizes.sm,
        padding: Spacing.sm,
        lineHeight: 20,
    },
});

export const MessageBubble = memo(function MessageBubble({
    message,
    showLLMBadge = true,
}: MessageBubbleProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { getConfigById } = useLLMStore();

    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    const llmConfig = message.llmIdUsed ? getConfigById(message.llmIdUsed) : null;

    // State for thinking content expansion
    const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);

    const handleCopyMessage = useCallback(async () => {
        await Clipboard.setStringAsync(message.content);
    }, [message.content]);

    const getBubbleStyle = () => {
        if (isUser) {
            return {
                backgroundColor: colors.userBubble,
                borderRadius: BorderRadius.lg,
            };
        }
        if (isSystem) {
            return {
                backgroundColor: colors.systemBubble,
                borderRadius: BorderRadius.lg,
            };
        }
        // Assistant messages: no background, no border radius
        return {
            backgroundColor: 'transparent',
            borderRadius: 0,
        };
    };

    const getTextColor = () => {
        if (isUser) return colors.userBubbleText;
        if (isSystem) return colors.systemBubbleText;
        return colors.assistantBubbleText;
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Custom renderers for markdown
    const markdownRules = useMemo(() => ({
        fence: (node: any, children: any, parent: any, styles: any) => {
            const language = node.sourceInfo || '';
            const content = node.content || '';
            return (
                <CodeBlock
                    key={node.key}
                    content={content.trim()}
                    language={language}
                    colors={colors}
                />
            );
        },
        code_block: (node: any, children: any, parent: any, styles: any) => {
            const content = node.content || '';
            return (
                <CodeBlock
                    key={node.key}
                    content={content.trim()}
                    colors={colors}
                />
            );
        },
    }), [colors]);

    // Markdown styles based on theme
    const markdownStyles = useMemo(() => ({
        body: {
            color: getTextColor(),
            fontSize: FontSizes.md,
            lineHeight: 22,
        },
        heading1: {
            color: getTextColor(),
            fontSize: FontSizes.xl,
            fontWeight: '700' as const,
            marginTop: Spacing.sm,
            marginBottom: Spacing.xs,
        },
        heading2: {
            color: getTextColor(),
            fontSize: FontSizes.lg,
            fontWeight: '600' as const,
            marginTop: Spacing.sm,
            marginBottom: Spacing.xs,
        },
        heading3: {
            color: getTextColor(),
            fontSize: FontSizes.md,
            fontWeight: '600' as const,
            marginTop: Spacing.xs,
            marginBottom: Spacing.xs,
        },
        paragraph: {
            marginTop: 0,
            marginBottom: Spacing.xs,
        },
        strong: {
            fontWeight: '700' as const,
        },
        em: {
            fontStyle: 'italic' as const,
        },
        link: {
            color: colors.tint,
            textDecorationLine: 'underline' as const,
        },
        blockquote: {
            backgroundColor: colors.backgroundSecondary,
            borderLeftColor: colors.tint,
            borderLeftWidth: 4,
            paddingLeft: Spacing.sm,
            paddingVertical: Spacing.xs,
            marginVertical: Spacing.xs,
        },
        code_inline: {
            backgroundColor: colors.backgroundSecondary,
            color: colors.tint,
            fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
            fontSize: FontSizes.sm,
            paddingHorizontal: 4,
            paddingVertical: 2,
            borderRadius: 4,
        },
        list_item: {
            marginBottom: Spacing.xs,
        },
        bullet_list: {
            marginVertical: Spacing.xs,
        },
        ordered_list: {
            marginVertical: Spacing.xs,
        },
        hr: {
            backgroundColor: colors.border,
            height: 1,
            marginVertical: Spacing.sm,
        },
        table: {
            borderColor: colors.border,
            borderWidth: 1,
            marginVertical: Spacing.xs,
        },
        th: {
            backgroundColor: colors.backgroundSecondary,
            padding: Spacing.xs,
            borderColor: colors.border,
        },
        td: {
            padding: Spacing.xs,
            borderColor: colors.border,
        },
    }), [colorScheme, colors]);

    return (
        <View
            style={[
                styles.container,
                isUser && styles.userContainer,
                !isUser && !isSystem && styles.assistantContainer,
            ]}
        >
            <View style={[styles.bubble, getBubbleStyle()]}>
                {/* Collapsible Thinking Section for assistant messages */}
                {!isUser && !isSystem && message.thinkingContent && (
                    <TouchableOpacity
                        style={[
                            styles.thinkingContainer,
                            { backgroundColor: colors.backgroundSecondary }
                        ]}
                        onPress={() => setIsThinkingExpanded(!isThinkingExpanded)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.thinkingHeader}>
                            <Ionicons
                                name="bulb"
                                size={16}
                                color={colors.tint}
                            />
                            <Text style={[styles.thinkingTitle, { color: colors.tint }]}>
                                Thinking
                            </Text>
                            <Ionicons
                                name={isThinkingExpanded ? 'chevron-up' : 'chevron-down'}
                                size={16}
                                color={colors.textMuted}
                            />
                        </View>
                        {isThinkingExpanded && (
                            <Text
                                style={[
                                    styles.thinkingContent,
                                    { color: colors.textSecondary }
                                ]}
                                selectable
                            >
                                {message.thinkingContent}
                            </Text>
                        )}
                    </TouchableOpacity>
                )}

                {/* LLM Badge for assistant messages */}
                {showLLMBadge && !isUser && !isSystem && llmConfig && (
                    <View style={[styles.llmBadge, { backgroundColor: colors.backgroundTertiary }]}>
                        <Text style={[styles.llmBadgeText, { color: colors.textSecondary }]}>
                            {llmConfig.name} • {message.modelUsed}
                        </Text>
                    </View>
                )}

                {/* Message content with Markdown support */}
                <Markdown style={markdownStyles} rules={markdownRules}>
                    {message.content}
                </Markdown>

                {/* Images */}
                {message.contentType === 'mixed' && message.images && message.images.length > 0 && (
                    <View style={styles.imageContainer}>
                        {message.images.map((image) => (
                            <TouchableOpacity key={image.id} style={styles.imageWrapper}>
                                <Image
                                    source={{ uri: image.url }}
                                    style={styles.image}
                                    resizeMode="cover"
                                />
                                {image.revisedPrompt && (
                                    <Text
                                        style={[styles.imageCaption, { color: colors.textMuted }]}
                                        numberOfLines={2}
                                    >
                                        {image.revisedPrompt}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Timestamp and actions */}
                <View style={styles.footer}>
                    <Text style={[styles.timestamp, { color: colors.textMuted }]}>
                        {formatTime(message.timestamp)}
                    </Text>
                    {!isSystem && (
                        <TouchableOpacity style={styles.copyButton} onPress={handleCopyMessage}>
                            <Ionicons name="copy-outline" size={14} color={colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        maxWidth: '85%',
    },
    userContainer: {
        alignSelf: 'flex-end',
    },
    assistantContainer: {
        maxWidth: '100%',
        alignSelf: 'stretch',
    },
    bubble: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        maxWidth: '100%',
    },
    llmBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
        alignSelf: 'flex-start',
        marginBottom: Spacing.xs,
    },
    llmBadgeText: {
        fontSize: FontSizes.xs,
    },
    content: {
        fontSize: FontSizes.md,
        lineHeight: 22,
    },
    imageContainer: {
        marginTop: Spacing.sm,
        gap: Spacing.sm,
    },
    imageWrapper: {
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: BorderRadius.md,
    },
    imageCaption: {
        fontSize: FontSizes.xs,
        marginTop: Spacing.xs,
        fontStyle: 'italic',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: Spacing.xs,
        gap: Spacing.sm,
    },
    timestamp: {
        fontSize: FontSizes.xs,
    },
    copyButton: {
        padding: 2,
    },
    thinkingContainer: {
        borderRadius: BorderRadius.md,
        padding: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    thinkingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    thinkingTitle: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        flex: 1,
    },
    thinkingContent: {
        fontSize: FontSizes.sm,
        lineHeight: 20,
        marginTop: Spacing.sm,
        fontStyle: 'italic',
    },
});
