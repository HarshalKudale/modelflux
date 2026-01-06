/**
 * ExecuTorch Provider Editor
 * 
 * Handles configuration for ExecuTorch local on-device providers (PTE models).
 * Supports: temperature, topp, outputTokenBatchSize, batchTimeInterval
 */
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PROVIDER_LIST } from '../../../../config/providerPresets';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../../config/theme';
import { ExecutorChGenerationConfig, LLMProviderKey } from '../../../../core/types';
import { useLLMStore, useSettingsStore } from '../../../../state';
import { showError, showInfo } from '../../../../utils/alert';
import { useAppColorScheme, useLocale } from '../../../hooks';
import { Button, Input } from '../../common';

interface ExecuTorchEditorProps {
    configId?: string;
    onBack: () => void;
}

export function ExecuTorchEditor({ configId, onBack }: ExecuTorchEditorProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();

    const { configs, createConfig, updateConfig, getConfigById } = useLLMStore();
    const { setDefaultLLM } = useSettingsStore();

    const provider = LLMProviderKey.Executorch;
    const isEditing = Boolean(configId);
    const existingConfig = configId ? getConfigById(configId) : null;
    const providerInfo = PROVIDER_LIST[provider];

    // Provider settings
    const [temperature, setTemperature] = useState<string>('');
    const [topp, setTopp] = useState<string>('');
    const [batchSize, setBatchSize] = useState<string>('');
    const [batchInterval, setBatchInterval] = useState<string>('');

    // UI state
    const [isSaving, setIsSaving] = useState(false);

    // Initialize form
    useEffect(() => {
        if (existingConfig?.executorchConfig) {
            const config = existingConfig.executorchConfig;
            setTemperature(config.temperature?.toString() || '');
            setTopp(config.topp?.toString() || '');
            setBatchSize(config.outputTokenBatchSize?.toString() || '');
            setBatchInterval(config.batchTimeInterval?.toString() || '');
        }
    }, [existingConfig]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Build executorch config
            const executorchConfig: ExecutorChGenerationConfig = {};
            const temp = parseFloat(temperature);
            const top = parseFloat(topp);
            const size = parseInt(batchSize, 10);
            const interval = parseInt(batchInterval, 10);

            if (!isNaN(temp)) executorchConfig.temperature = temp;
            if (!isNaN(top)) executorchConfig.topp = top;
            if (!isNaN(size)) executorchConfig.outputTokenBatchSize = size;
            if (!isNaN(interval)) executorchConfig.batchTimeInterval = interval;

            const configData = {
                name: 'ExecuTorch', // Fixed name - only one allowed
                provider,
                baseUrl: '',
                defaultModel: '',
                executorchConfig: Object.keys(executorchConfig).length > 0 ? executorchConfig : undefined,
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
                {t('llm.editor.executorch.hint')}
            </Text>

            {/* Generation Settings */}
            <View style={[styles.section, { borderTopColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {t('llm.editor.generationConfig.title')}
                </Text>
                <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
                    {t('llm.editor.generationSettings.hint')}
                </Text>

                <Input
                    label={t('llm.editor.generationConfig.temperature')}
                    value={temperature}
                    onChangeText={setTemperature}
                    placeholder="0.7"
                    keyboardType="decimal-pad"
                    hint={t('llm.editor.generationConfig.temperatureHint')}
                />

                <Input
                    label={t('llm.editor.generationConfig.topp')}
                    value={topp}
                    onChangeText={setTopp}
                    placeholder="0.9"
                    keyboardType="decimal-pad"
                    hint={t('llm.editor.generationConfig.toppHint')}
                />

                <Input
                    label={t('llm.editor.generationConfig.batchSize')}
                    value={batchSize}
                    onChangeText={setBatchSize}
                    placeholder="10"
                    keyboardType="number-pad"
                    hint={t('llm.editor.generationConfig.batchSizeHint')}
                />

                <Input
                    label={t('llm.editor.generationConfig.batchInterval')}
                    value={batchInterval}
                    onChangeText={setBatchInterval}
                    placeholder="100"
                    keyboardType="number-pad"
                    hint={t('llm.editor.generationConfig.batchIntervalHint')}
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
