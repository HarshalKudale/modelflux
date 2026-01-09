/**
 * Anthropic Provider Editor
 * 
 * Handles configuration for Anthropic Claude providers.
 * Supports: name, apiKey, temperature, topP, maxTokens
 */
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PROVIDER_LIST } from '../../../../config/providerPresets';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../../config/theme';
import { llmClientFactory } from '../../../../core/llm';
import { LLMConfig, LLMProviderKey } from '../../../../core/types';
import { useLLMStore, useSettingsStore } from '../../../../state';
import { showError, showInfo } from '../../../../utils/alert';
import { useAppColorScheme, useLocale } from '../../../hooks';
import { Button, Input } from '../../common';

interface AnthropicEditorProps {
    configId?: string;
    onBack: () => void;
}

export function AnthropicEditor({ configId, onBack }: AnthropicEditorProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();

    const { configs, createConfig, updateConfig, getConfigById } = useLLMStore();
    const { setDefaultLLM } = useSettingsStore();

    const provider = LLMProviderKey.Anthropic;
    const isEditing = Boolean(configId);
    const existingConfig = configId ? getConfigById(configId) : null;
    const providerInfo = PROVIDER_LIST[provider];

    // Form state
    const [name, setName] = useState('');
    const [apiKey, setApiKey] = useState('');

    // Provider settings
    const [temperature, setTemperature] = useState<string>('');
    const [topP, setTopP] = useState<string>('');
    const [maxTokens, setMaxTokens] = useState<string>('');

    // UI state
    const [isTesting, setIsTesting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize form
    useEffect(() => {
        if (existingConfig) {
            setName(existingConfig.name);
            setApiKey(existingConfig.apiKey || '');
            if (existingConfig.providerSettings) {
                setTemperature(existingConfig.providerSettings.temperature?.toString() || '');
                setTopP(existingConfig.providerSettings.topP?.toString() || '');
                setMaxTokens(existingConfig.providerSettings.maxOutputTokens?.toString() || '');
            }
        } else {
            setName(providerInfo.name || '');
        }
    }, [existingConfig, providerInfo]);

    const handleTest = async () => {
        if (!apiKey.trim()) {
            showError(t('common.error'), t('llm.editor.error.apiKey'));
            return;
        }

        setIsTesting(true);
        try {
            const tempConfig: LLMConfig = {
                id: existingConfig?.id || 'temp',
                name,
                provider,
                baseUrl: providerInfo.defaultBaseUrl,
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
        if (!apiKey.trim()) {
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

            if (!isNaN(temp)) providerSettings.temperature = temp;
            if (!isNaN(top)) providerSettings.topP = top;
            if (!isNaN(max)) providerSettings.maxOutputTokens = max;

            const configData = {
                name: name.trim(),
                provider,
                baseUrl: providerInfo.defaultBaseUrl,
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

            <Input
                label={t('llm.editor.apiKey')}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="sk-ant-..."
                secureTextEntry
                hint={t('llm.editor.apiKey.hint')}
            />

            {/* Generation Settings */}
            <View style={[styles.section, { borderTopColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {t('llm.editor.generationSettings')}
                </Text>
                <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
                    {t('llm.editor.generationSettings.hint')}
                </Text>

                <Input
                    label={t('llm.editor.temperature')}
                    value={temperature}
                    onChangeText={setTemperature}
                    placeholder="1.0"
                    keyboardType="decimal-pad"
                    hint={t('llm.editor.temperature.anthropic.hint')}
                />

                <Input
                    label={t('llm.editor.topP')}
                    value={topP}
                    onChangeText={setTopP}
                    placeholder="1.0"
                    keyboardType="decimal-pad"
                    hint={t('llm.editor.topP.hint')}
                />

                <Input
                    label={t('llm.editor.maxTokens')}
                    value={maxTokens}
                    onChangeText={setMaxTokens}
                    placeholder="4096"
                    keyboardType="number-pad"
                    hint={t('llm.editor.maxTokens.hint')}
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
