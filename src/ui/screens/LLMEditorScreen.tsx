/**
 * LLM Editor Screen
 * 
 * Refactored to use provider-specific editor components.
 * Provider dropdown at top, switch statement renders the appropriate editor.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, FontSizes, Spacing } from '../../config/theme';
import { LLMProvider, LLMProviderKey } from '../../core/types';
import { useLLMStore } from '../../state';
import { showConfirm } from '../../utils/alert';
import { Dropdown } from '../components/common';
import { useAppColorScheme, useLocale } from '../hooks';

import {
    AnthropicEditor,
    ExecuTorchEditor,
    LlamaCppEditor,
    OllamaEditor,
    OpenAIEditor,
} from '../components/settings/provider-editors';

interface LLMEditorScreenProps {
    configId?: string;
    presetProvider?: LLMProvider;
    onBack: () => void;
}

/**
 * Helper to determine if a provider is a local on-device provider
 */
function isLocalProvider(provider: LLMProvider): boolean {
    return provider === 'executorch' || provider === 'llama-cpp';
}

export function LLMEditorScreen({ configId, presetProvider, onBack }: LLMEditorScreenProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();

    const { getConfigById } = useLLMStore();

    const isEditing = Boolean(configId);
    const existingConfig = configId ? getConfigById(configId) : null;

    // Provider state
    const [provider, setProvider] = useState<LLMProvider>('openai');

    // Initialize provider from existing config or preset
    useEffect(() => {
        if (existingConfig) {
            setProvider(existingConfig.provider);
        } else if (presetProvider) {
            setProvider(presetProvider);
        }
    }, [existingConfig, presetProvider]);

    const handleProviderChange = async (newProvider: LLMProvider) => {
        const wasLocal = isLocalProvider(provider);
        const willBeLocal = isLocalProvider(newProvider);
        const isTypeChangingLocality = wasLocal !== willBeLocal;

        // Warn if changing from local to remote or vice versa while editing
        if (isEditing && isTypeChangingLocality) {
            const confirmed = await showConfirm(
                t('llm.editor.changeType.title') || 'Change Provider Type?',
                t('llm.editor.changeType.warning') || 'Changing provider type will remove incompatible settings.',
                t('common.continue') || 'Continue',
                t('common.cancel') || 'Cancel'
            );

            if (!confirmed) return;
        }

        setProvider(newProvider);
    };

    // Provider options for dropdown - show all providers for new configs, lock for editing
    const getProviderOptions = () => {
        // Remote providers that can be added by users
        const remoteOptions = [
            { label: t('provider.openai') || 'OpenAI', value: LLMProviderKey.OpenAI },
            { label: t('provider.openai-spec') || 'OpenAI Compatible', value: LLMProviderKey.OpenAISpec },
            { label: t('provider.anthropic') || 'Anthropic Claude', value: LLMProviderKey.Anthropic },
            { label: t('provider.ollama') || 'Ollama', value: LLMProviderKey.Ollama },
        ];

        // Local providers (usually pre-configured, but user might want to edit)
        if (isEditing && isLocalProvider(provider)) {
            // When editing a local provider, show it in dropdown
            const localOptions = [
                { label: t('provider.llama-cpp') || 'Llama.cpp', value: LLMProviderKey.LlamaCpp },
                { label: t('provider.executorch') || 'ExecuTorch', value: LLMProviderKey.Executorch },
            ];
            return [...remoteOptions, ...localOptions];
        }

        return remoteOptions;
    };

    /**
     * Render the appropriate provider editor based on selected provider
     */
    const renderProviderEditor = () => {
        switch (provider) {
            case LLMProviderKey.OpenAI:
            case LLMProviderKey.OpenAISpec:
                return (
                    <OpenAIEditor
                        configId={configId}
                        provider={provider as 'openai' | 'openai-spec'}
                        onBack={onBack}
                    />
                );

            case LLMProviderKey.Anthropic:
                return (
                    <AnthropicEditor
                        configId={configId}
                        onBack={onBack}
                    />
                );

            case LLMProviderKey.Ollama:
                return (
                    <OllamaEditor
                        configId={configId}
                        onBack={onBack}
                    />
                );

            case LLMProviderKey.LlamaCpp:
                return (
                    <LlamaCppEditor
                        configId={configId}
                        onBack={onBack}
                    />
                );

            case LLMProviderKey.Executorch:
                return (
                    <ExecuTorchEditor
                        configId={configId}
                        onBack={onBack}
                    />
                );

            default:
                return (
                    <View style={styles.errorContainer}>
                        <Text style={[styles.errorText, { color: colors.error }]}>
                            {t('llm.editor.unsupportedProvider') || 'Unsupported provider type'}
                        </Text>
                    </View>
                );
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>
                    {isEditing ? t('llm.editor.edit.title') : t('llm.editor.add.title')}
                </Text>
                <View style={styles.placeholder} />
            </View>

            {/* Provider Dropdown */}
            <View style={styles.providerSection}>
                <Dropdown
                    label={t('llm.editor.providerType')}
                    value={provider}
                    options={getProviderOptions()}
                    onSelect={handleProviderChange}
                    disabled={isEditing} // Lock provider type when editing
                />
            </View>

            {/* Provider-specific Editor */}
            <View style={styles.editorContainer}>
                {renderProviderEditor()}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: Spacing.xs,
    },
    title: {
        fontSize: FontSizes.xl,
        fontWeight: '600',
    },
    placeholder: {
        width: 32,
    },
    providerSection: {
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
    },
    editorContainer: {
        flex: 1,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    errorText: {
        fontSize: FontSizes.md,
        textAlign: 'center',
    },
});
