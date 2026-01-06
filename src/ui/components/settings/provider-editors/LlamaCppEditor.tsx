/**
 * Llama.cpp Provider Editor
 * 
 * Handles configuration for llama.cpp local on-device providers (GGUF models).
 * Supports: temperature, topP, nCtx, repeatPenalty, nPredict
 */
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PROVIDER_LIST } from '../../../../config/providerPresets';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../../config/theme';
import { LLMProviderKey, LlamaCppConfig } from '../../../../core/types';
import { useLLMStore, useSettingsStore } from '../../../../state';
import { showError, showInfo } from '../../../../utils/alert';
import { useAppColorScheme, useLocale } from '../../../hooks';
import { Button, Input } from '../../common';

interface LlamaCppEditorProps {
    configId?: string;
    onBack: () => void;
}

export function LlamaCppEditor({ configId, onBack }: LlamaCppEditorProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();

    const { configs, createConfig, updateConfig, getConfigById } = useLLMStore();
    const { setDefaultLLM } = useSettingsStore();

    const provider = LLMProviderKey.LlamaCpp;
    const isEditing = Boolean(configId);
    const existingConfig = configId ? getConfigById(configId) : null;
    const providerInfo = PROVIDER_LIST[provider];

    // Provider settings (local model configs)
    const [temperature, setTemperature] = useState<string>('');
    const [topP, setTopP] = useState<string>('');
    const [nCtx, setNCtx] = useState<string>('');
    const [repeatPenalty, setRepeatPenalty] = useState<string>('');
    const [nPredict, setNPredict] = useState<string>('');

    // UI state
    const [isSaving, setIsSaving] = useState(false);

    // Initialize form
    useEffect(() => {
        if (existingConfig?.llamaCppConfig) {
            const config = existingConfig.llamaCppConfig;
            setTemperature(config.temperature?.toString() || '');
            setTopP(config.topP?.toString() || '');
            setNCtx(config.nCtx?.toString() || '');
            setRepeatPenalty(config.repeatPenalty?.toString() || '');
            setNPredict(config.nPredict?.toString() || '');
        }
    }, [existingConfig]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Build llama.cpp config
            const llamaCppConfig: LlamaCppConfig = {};
            const temp = parseFloat(temperature);
            const top = parseFloat(topP);
            const ctx = parseInt(nCtx, 10);
            const repeat = parseFloat(repeatPenalty);
            const predict = parseInt(nPredict, 10);

            if (!isNaN(temp)) llamaCppConfig.temperature = temp;
            if (!isNaN(top)) llamaCppConfig.topP = top;
            if (!isNaN(ctx)) llamaCppConfig.nCtx = ctx;
            if (!isNaN(repeat)) llamaCppConfig.repeatPenalty = repeat;
            if (!isNaN(predict)) llamaCppConfig.nPredict = predict;

            const configData = {
                name: providerInfo.name,
                provider,
                baseUrl: '',
                defaultModel: '',
                llamaCppConfig: Object.keys(llamaCppConfig).length > 0 ? llamaCppConfig : undefined,
                supportsStreaming: true,
                isLocal: true,
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

            showInfo(t('common.success'), t('llm.editor.saved'));
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

            <Text style={[styles.hint, { color: colors.textMuted }]}>
                {t('llm.editor.llama-cpp.hint')}
            </Text>

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
                    placeholder="0.8"
                    keyboardType="decimal-pad"
                    hint={t('llm.editor.temperature.hint')}
                />

                <Input
                    label={t('llm.editor.topP')}
                    value={topP}
                    onChangeText={setTopP}
                    placeholder="0.95"
                    keyboardType="decimal-pad"
                    hint={t('llm.editor.topP.hint')}
                />

                <Input
                    label={t('llm.editor.nCtx')}
                    value={nCtx}
                    onChangeText={setNCtx}
                    placeholder="2048"
                    keyboardType="number-pad"
                    hint={t('llm.editor.nCtx.hint')}
                />

                <Input
                    label={t('llm.editor.repeatPenalty')}
                    value={repeatPenalty}
                    onChangeText={setRepeatPenalty}
                    placeholder="1.1"
                    keyboardType="decimal-pad"
                    hint={t('llm.editor.repeatPenalty.hint')}
                />

                <Input
                    label={t('llm.editor.nPredict')}
                    value={nPredict}
                    onChangeText={setNPredict}
                    placeholder="2048"
                    keyboardType="number-pad"
                    hint={t('llm.editor.nPredict.hint')}
                />
            </View>

            {/* Actions */}
            <View style={styles.actions}>
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
    hint: {
        fontSize: FontSizes.sm,
        marginBottom: Spacing.md,
    },
    section: {
        marginTop: Spacing.md,
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
});
