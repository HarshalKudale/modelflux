/**
 * Ollama Provider Editor
 * 
 * Handles configuration for Ollama local server providers.
 * Supports: name, baseUrl, temperature, topP, numPredict (maxTokens), numCtx (context window)
 */
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PROVIDER_LIST } from '../../../../config/providerPresets';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../../config/theme';
import { llmClientFactory } from '../../../../core/llm';
import { LLMConfig, LLMProviderKey } from '../../../../core/types';
import { useLLMStore, useSettingsStore } from '../../../../state';
import { showError, showInfo } from '../../../../utils/alert';
import { useAppColorScheme, useLocale } from '../../../hooks';
import { Button, Input } from '../../common';

interface OllamaEditorProps {
    configId?: string;
    onBack: () => void;
}

export function OllamaEditor({ configId, onBack }: OllamaEditorProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();

    const { configs, createConfig, updateConfig, getConfigById } = useLLMStore();
    const { setDefaultLLM } = useSettingsStore();

    const provider = LLMProviderKey.Ollama;
    const isEditing = Boolean(configId);
    const existingConfig = configId ? getConfigById(configId) : null;
    const providerInfo = PROVIDER_LIST[provider];

    // Form state
    const [name, setName] = useState('');
    const [baseUrl, setBaseUrl] = useState('');

    // Provider settings
    const [temperature, setTemperature] = useState<string>('');
    const [topP, setTopP] = useState<string>('');
    const [numPredict, setNumPredict] = useState<string>('');
    const [numCtx, setNumCtx] = useState<string>('');

    // UI state
    const [isTesting, setIsTesting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize form
    useEffect(() => {
        if (existingConfig) {
            setName(existingConfig.name);
            setBaseUrl(existingConfig.baseUrl);
            if (existingConfig.providerSettings) {
                setTemperature(existingConfig.providerSettings.temperature?.toString() || '');
                setTopP(existingConfig.providerSettings.topP?.toString() || '');
                setNumPredict(existingConfig.providerSettings.maxOutputTokens?.toString() || '');
                setNumCtx(existingConfig.providerSettings.topK?.toString() || ''); // Using topK to store numCtx
            }
        } else {
            setName(providerInfo.name || '');
            setBaseUrl(providerInfo.defaultBaseUrl || 'http://localhost:11434');
        }
    }, [existingConfig, providerInfo]);

    const handleTest = async () => {
        if (!baseUrl.trim()) {
            showError(t('common.error'), t('llm.editor.error.url'));
            return;
        }

        setIsTesting(true);
        try {
            const tempConfig: LLMConfig = {
                id: existingConfig?.id || 'temp',
                name,
                provider,
                baseUrl: baseUrl.trim(),
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
        if (!baseUrl.trim()) {
            showError(t('common.error'), t('llm.editor.error.url'));
            return;
        }

        setIsSaving(true);
        try {
            // Build provider settings
            const providerSettings: LLMConfig['providerSettings'] = {};
            const temp = parseFloat(temperature);
            const top = parseFloat(topP);
            const predict = parseInt(numPredict, 10);
            const ctx = parseInt(numCtx, 10);

            if (!isNaN(temp)) providerSettings.temperature = temp;
            if (!isNaN(top)) providerSettings.topP = top;
            if (!isNaN(predict)) providerSettings.maxOutputTokens = predict;
            if (!isNaN(ctx)) providerSettings.topK = ctx; // Using topK field for numCtx

            const configData = {
                name: name.trim(),
                provider,
                baseUrl: baseUrl.trim(),
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

            <Input
                label={t('llm.editor.baseUrl')}
                value={baseUrl}
                onChangeText={setBaseUrl}
                placeholder="http://localhost:11434"
                hint={t('llm.editor.baseUrl.ollama.hint') || 'URL of your Ollama server'}
            />

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
                    placeholder="0.8"
                    keyboardType="decimal-pad"
                    hint={t('llm.editor.temperature.hint') || 'Controls randomness (0.0-2.0)'}
                />

                <Input
                    label={t('llm.editor.topP') || 'Top-P'}
                    value={topP}
                    onChangeText={setTopP}
                    placeholder="0.9"
                    keyboardType="decimal-pad"
                    hint={t('llm.editor.topP.hint') || 'Nucleus sampling (0.0-1.0)'}
                />

                <Input
                    label={t('llm.editor.numPredict') || 'Num Predict'}
                    value={numPredict}
                    onChangeText={setNumPredict}
                    placeholder="128"
                    keyboardType="number-pad"
                    hint={t('llm.editor.numPredict.hint') || 'Maximum tokens to generate'}
                />

                <Input
                    label={t('llm.editor.numCtx') || 'Context Window'}
                    value={numCtx}
                    onChangeText={setNumCtx}
                    placeholder="2048"
                    keyboardType="number-pad"
                    hint={t('llm.editor.numCtx.hint') || 'Context window size in tokens'}
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
