/**
 * OpenAI Provider Editor
 * 
 * Handles configuration for both OpenAI and OpenAI-compatible (openai-spec) providers.
 * Supports: name, baseUrl (for openai-spec), apiKey, temperature, topP, maxTokens, presencePenalty, frequencyPenalty
 */
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PROVIDER_LIST } from '../../../../config/providerPresets';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../../config/theme';
import { llmClientFactory } from '../../../../core/llm';
import { LLMConfig } from '../../../../core/types';
import { useLLMStore, useSettingsStore } from '../../../../state';
import { showError, showInfo } from '../../../../utils/alert';
import { useAppColorScheme, useLocale } from '../../../hooks';
import { Button, Input } from '../../common';

interface OpenAIEditorProps {
    configId?: string;
    provider: 'openai' | 'openai-spec';
    onBack: () => void;
}

export function OpenAIEditor({ configId, provider, onBack }: OpenAIEditorProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();

    const { configs, createConfig, updateConfig, getConfigById } = useLLMStore();
    const { setDefaultLLM } = useSettingsStore();

    const isEditing = Boolean(configId);
    const existingConfig = configId ? getConfigById(configId) : null;
    const providerInfo = PROVIDER_LIST[provider];

    // Form state
    const [name, setName] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [apiKey, setApiKey] = useState('');

    // Provider settings
    const [temperature, setTemperature] = useState<string>('');
    const [topP, setTopP] = useState<string>('');
    const [maxTokens, setMaxTokens] = useState<string>('');
    const [presencePenalty, setPresencePenalty] = useState<string>('');
    const [frequencyPenalty, setFrequencyPenalty] = useState<string>('');

    // UI state
    const [isTesting, setIsTesting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize form
    useEffect(() => {
        if (existingConfig) {
            setName(existingConfig.name);
            setBaseUrl(existingConfig.baseUrl);
            setApiKey(existingConfig.apiKey || '');
            // Load provider settings
            if (existingConfig.providerSettings) {
                setTemperature(existingConfig.providerSettings.temperature?.toString() || '');
                setTopP(existingConfig.providerSettings.topP?.toString() || '');
                setMaxTokens(existingConfig.providerSettings.maxOutputTokens?.toString() || '');
                setPresencePenalty(existingConfig.providerSettings.presencePenalty?.toString() || '');
                setFrequencyPenalty(existingConfig.providerSettings.frequencyPenalty?.toString() || '');
            }
        } else {
            setName(providerInfo.name || '');
            setBaseUrl(providerInfo.defaultBaseUrl || '');
        }
    }, [existingConfig, providerInfo]);

    const handleTest = async () => {
        if (!baseUrl && provider === 'openai-spec') {
            showError(t('common.error'), t('llm.editor.error.url'));
            return;
        }

        setIsTesting(true);
        try {
            const tempConfig: LLMConfig = {
                id: existingConfig?.id || 'temp',
                name,
                provider,
                baseUrl: provider === 'openai' ? 'https://api.openai.com/v1' : baseUrl,
                apiKey: apiKey || undefined,
                defaultModel: '',
                supportsStreaming: true,
                isLocal: false,
                isEnabled: true,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };

            const client = llmClientFactory.getClient(tempConfig);
            const success = await client.testConnection(tempConfig);

            showInfo(
                success ? t('common.success') : t('common.error'),
                success ? t('llm.editor.test.success') : t('llm.editor.test.failed')
            );
        } catch (error) {
            showError(t('common.error'), t('llm.editor.error.test'));
        } finally {
            setIsTesting(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            showError(t('common.error'), t('llm.editor.error.name'));
            return;
        }
        if (provider === 'openai-spec' && !baseUrl.trim()) {
            showError(t('common.error'), t('llm.editor.error.url'));
            return;
        }
        if (providerInfo.apiKeyRequired && !apiKey.trim()) {
            showError(t('common.error'), t('llm.editor.error.apiKey'));
            return;
        }

        setIsSaving(true);
        try {
            // Build provider settings
            const providerSettings: LLMConfig['providerSettings'] = {};
            const temp = parseFloat(temperature);
            const top = parseFloat(topP);
            const max = parseInt(maxTokens, 10);
            const presence = parseFloat(presencePenalty);
            const frequency = parseFloat(frequencyPenalty);

            if (!isNaN(temp)) providerSettings.temperature = temp;
            if (!isNaN(top)) providerSettings.topP = top;
            if (!isNaN(max)) providerSettings.maxOutputTokens = max;
            if (!isNaN(presence)) providerSettings.presencePenalty = presence;
            if (!isNaN(frequency)) providerSettings.frequencyPenalty = frequency;

            const configData = {
                name: name.trim(),
                provider,
                baseUrl: provider === 'openai' ? 'https://api.openai.com/v1' : baseUrl.trim(),
                apiKey: apiKey.trim() || undefined,
                defaultModel: '',
                providerSettings: Object.keys(providerSettings).length > 0 ? providerSettings : undefined,
                supportsStreaming: true,
                isLocal: false,
                isEnabled: existingConfig?.isEnabled ?? true,
            };

            if (isEditing && existingConfig) {
                await updateConfig({
                    ...existingConfig,
                    ...configData,
                });
            } else {
                const newConfig = await createConfig(configData);
                if (configs.length === 0) {
                    await setDefaultLLM(newConfig.id);
                }
            }

            onBack();
        } catch (error) {
            showError(t('common.error'), t('llm.editor.error.save'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Provider Description */}
            <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                    {t(`provider.${provider}.description`)}
                </Text>
            </View>

            {/* Basic Settings */}
            <Input
                label={t('llm.editor.name')}
                value={name}
                onChangeText={setName}
                placeholder={t('llm.editor.name.placeholder')}
            />

            {provider === 'openai-spec' && (
                <Input
                    label={t('llm.editor.baseUrl')}
                    value={baseUrl}
                    onChangeText={setBaseUrl}
                    placeholder="https://api.example.com/v1"
                    hint={t('llm.editor.baseUrl.hint')}
                />
            )}

            {providerInfo.apiKeyRequired && (
                <Input
                    label={t('llm.editor.apiKey')}
                    value={apiKey}
                    onChangeText={setApiKey}
                    placeholder="sk-..."
                    secureTextEntry
                    hint={t('llm.editor.apiKey.hint')}
                />
            )}

            {/* Generation Settings */}
            <View style={[styles.section, { borderTopColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {t('llm.editor.generationSettings') || 'Generation Settings'}
                </Text>
                <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
                    {t('llm.editor.generationSettings.hint') || 'Optional. Leave empty for defaults.'}
                </Text>

                <Input
                    label={t('llm.editor.temperature') || 'Temperature'}
                    value={temperature}
                    onChangeText={setTemperature}
                    placeholder="1.0"
                    keyboardType="decimal-pad"
                    hint={t('llm.editor.temperature.hint') || 'Controls randomness (0.0-2.0)'}
                />

                <Input
                    label={t('llm.editor.topP') || 'Top-P'}
                    value={topP}
                    onChangeText={setTopP}
                    placeholder="1.0"
                    keyboardType="decimal-pad"
                    hint={t('llm.editor.topP.hint') || 'Nucleus sampling (0.0-1.0)'}
                />

                <Input
                    label={t('llm.editor.maxTokens') || 'Max Tokens'}
                    value={maxTokens}
                    onChangeText={setMaxTokens}
                    placeholder="4096"
                    keyboardType="number-pad"
                    hint={t('llm.editor.maxTokens.hint') || 'Maximum output tokens'}
                />

                <Input
                    label={t('llm.editor.presencePenalty') || 'Presence Penalty'}
                    value={presencePenalty}
                    onChangeText={setPresencePenalty}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    hint={t('llm.editor.presencePenalty.hint') || 'Penalize new topics (-2.0 to 2.0)'}
                />

                <Input
                    label={t('llm.editor.frequencyPenalty') || 'Frequency Penalty'}
                    value={frequencyPenalty}
                    onChangeText={setFrequencyPenalty}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    hint={t('llm.editor.frequencyPenalty.hint') || 'Penalize repetition (-2.0 to 2.0)'}
                />
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                <Button
                    title={isTesting ? t('llm.editor.testing') : t('llm.editor.test')}
                    onPress={handleTest}
                    variant="secondary"
                    loading={isTesting}
                    icon="wifi"
                    fullWidth
                />
                <View style={styles.spacer} />
                <Button
                    title={isSaving ? t('llm.editor.saving') : isEditing ? t('llm.editor.update') : t('llm.editor.save')}
                    onPress={handleSave}
                    loading={isSaving}
                    fullWidth
                />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: Spacing.md,
    },
    infoCard: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.md,
    },
    description: {
        fontSize: FontSizes.sm,
    },
    section: {
        marginTop: Spacing.lg,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
    },
    sectionTitle: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        marginBottom: Spacing.xs,
    },
    sectionHint: {
        fontSize: FontSizes.sm,
        marginBottom: Spacing.md,
    },
    actions: {
        marginTop: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    spacer: {
        height: Spacing.md,
    },
});
