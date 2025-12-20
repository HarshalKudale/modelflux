import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PROVIDER_INFO, PROVIDER_PRESETS } from '../../config/providerPresets';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../config/theme';
import { llmClientFactory } from '../../core/llm';
import { LLMConfig, LLMProvider } from '../../core/types';
import { useLLMStore } from '../../state';
import { showError, showInfo } from '../../utils/alert';
import { Button, Dropdown, Input } from '../components/common';
import { useAppColorScheme, useLocale } from '../hooks';

interface LLMEditorScreenProps {
    configId?: string;
    presetProvider?: LLMProvider;
    onBack: () => void;
}

export function LLMEditorScreen({ configId, presetProvider, onBack }: LLMEditorScreenProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();

    const { createConfig, updateConfig, testConnection, getConfigById } = useLLMStore();

    const isEditing = Boolean(configId);
    const existingConfig = configId ? getConfigById(configId) : null;

    // Form state
    const [name, setName] = useState('');
    const [provider, setProvider] = useState<LLMProvider>('openai');
    const [baseUrl, setBaseUrl] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [defaultModel, setDefaultModel] = useState('');
    const [isLocal, setIsLocal] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Model fetching state
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);

    // Get provider info
    const providerInfo = PROVIDER_INFO[provider];

    // Initialize form with existing config or preset
    useEffect(() => {
        if (existingConfig) {
            setName(existingConfig.name);
            setProvider(existingConfig.provider);
            setBaseUrl(existingConfig.baseUrl);
            setApiKey(existingConfig.apiKey || '');
            setDefaultModel(existingConfig.defaultModel);
            setIsLocal(existingConfig.isLocal);
        } else if (presetProvider) {
            const preset = PROVIDER_PRESETS[presetProvider];
            setName(preset.name || '');
            setProvider(presetProvider);
            setBaseUrl(preset.baseUrl || '');
            setDefaultModel(preset.defaultModel || '');
            setIsLocal(preset.isLocal || false);
        }
    }, [existingConfig, presetProvider]);

    // Fetch models when URL and API key are available
    const fetchModels = async () => {
        if (!baseUrl) return;
        if (providerInfo.apiKeyRequired && !apiKey) return;

        setIsLoadingModels(true);
        try {
            // Create a temporary config for fetching models
            const tempConfig: LLMConfig = {
                id: 'temp',
                name,
                provider,
                baseUrl,
                apiKey: apiKey || undefined,
                defaultModel: '',
                isLocal,
                isEnabled: true,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };

            const client = llmClientFactory.getClient(tempConfig);
            const models = await client.fetchModels(tempConfig);
            setAvailableModels(models);
        } catch (error) {
            console.log('Failed to fetch models:', error);
            setAvailableModels([]);
        } finally {
            setIsLoadingModels(false);
        }
    };

    // Auto-fetch models when relevant fields change
    useEffect(() => {
        const canFetchModels = baseUrl && (!providerInfo.apiKeyRequired || apiKey);
        if (canFetchModels) {
            const timer = setTimeout(() => {
                fetchModels();
            }, 500); // Debounce
            return () => clearTimeout(timer);
        }
    }, [baseUrl, apiKey, provider]);

    const handleProviderChange = (newProvider: LLMProvider) => {
        setProvider(newProvider);
        const preset = PROVIDER_PRESETS[newProvider];
        if (!isEditing) {
            setName(preset.name || '');
            setBaseUrl(preset.baseUrl || '');
            setDefaultModel(preset.defaultModel || '');
            setIsLocal(preset.isLocal || false);
            setAvailableModels([]);
        }
    };

    const handleTestConnection = async () => {
        if (!baseUrl) {
            showError(t('common.error'), t('llm.editor.error.url'));
            return;
        }

        setIsTesting(true);

        try {
            // Create a temporary config for testing
            const tempConfig: LLMConfig = {
                id: existingConfig?.id || 'temp',
                name,
                provider,
                baseUrl,
                apiKey: apiKey || undefined,
                defaultModel,
                isLocal,
                isEnabled: true,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };

            const client = llmClientFactory.getClient(tempConfig);
            const success = await client.testConnection(tempConfig);

            showInfo(
                success ? t('common.success') : t('common.error'),
                success
                    ? t('llm.editor.test.success')
                    : t('llm.editor.test.failed')
            );
        } catch (error) {
            showError(t('common.error'), t('llm.editor.error.test'));
        } finally {
            setIsTesting(false);
        }
    };

    const handleSave = async () => {
        // Validation
        if (!name.trim()) {
            showError(t('common.error'), t('llm.editor.error.name'));
            return;
        }
        if (!baseUrl.trim()) {
            showError(t('common.error'), t('llm.editor.error.url'));
            return;
        }
        if (!defaultModel.trim()) {
            showError(t('common.error'), t('llm.editor.error.model'));
            return;
        }
        if (providerInfo.apiKeyRequired && !apiKey.trim()) {
            showError(t('common.error'), t('llm.editor.error.apiKey'));
            return;
        }

        setIsSaving(true);

        try {
            const configData = {
                name: name.trim(),
                provider,
                baseUrl: baseUrl.trim(),
                apiKey: apiKey.trim() || undefined,
                defaultModel: defaultModel.trim(),
                isLocal,
                isEnabled: existingConfig?.isEnabled ?? true,
            };

            if (isEditing && existingConfig) {
                await updateConfig({
                    ...existingConfig,
                    ...configData,
                });
            } else {
                await createConfig(configData);
            }

            onBack();
        } catch (error) {
            showError(t('common.error'), t('llm.editor.error.save'));
        } finally {
            setIsSaving(false);
        }
    };

    const providerOptions = [
        { label: t('provider.openai'), value: 'openai' as LLMProvider },
        { label: t('provider.openai-spec'), value: 'openai-spec' as LLMProvider },
        { label: t('provider.ollama'), value: 'ollama' as LLMProvider },
    ];

    const modelOptions = availableModels.map((model) => ({
        label: model,
        value: model,
    }));

    const getModelHint = () => {
        if (!baseUrl) return t('llm.editor.model.hint.noUrl');
        if (providerInfo.apiKeyRequired && !apiKey) return t('llm.editor.model.hint.noKey');
        return t('llm.editor.model.hint.manual');
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

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {/* Provider Type */}
                <Dropdown
                    label={t('llm.editor.providerType')}
                    value={provider}
                    options={providerOptions}
                    onSelect={handleProviderChange}
                    disabled={isEditing}
                />

                {/* Provider Description */}
                <View style={[styles.providerInfo, { backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={[styles.providerDescription, { color: colors.textSecondary }]}>
                        {providerInfo.description}
                    </Text>
                </View>

                {/* Name */}
                <Input
                    label={t('llm.editor.name')}
                    value={name}
                    onChangeText={setName}
                    placeholder={t('llm.editor.name.placeholder')}
                />

                {/* Base URL - only editable for certain providers */}
                {providerInfo.urlEditable ? (
                    <Input
                        label={t('llm.editor.baseUrl')}
                        value={baseUrl}
                        onChangeText={setBaseUrl}
                        placeholder={provider === 'ollama' ? 'http://localhost:11434' : 'https://api.example.com/v1'}
                        hint={t('llm.editor.baseUrl.hint')}
                    />
                ) : (
                    <View style={styles.fixedField}>
                        <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('llm.editor.baseUrl')}</Text>
                        <Text style={[styles.fixedValue, { color: colors.textSecondary }]}>
                            {baseUrl}
                        </Text>
                    </View>
                )}

                {/* API Key - required for some providers */}
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

                {/* Default Model - Dropdown if models are available */}
                <View style={styles.modelSection}>
                    <View style={styles.modelHeader}>
                        <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('llm.editor.defaultModel')}</Text>
                        {isLoadingModels && (
                            <ActivityIndicator size="small" color={colors.tint} />
                        )}
                        {!isLoadingModels && baseUrl && (
                            <TouchableOpacity onPress={fetchModels} style={styles.refreshButton}>
                                <Ionicons name="refresh" size={16} color={colors.tint} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {availableModels.length > 0 ? (
                        <Dropdown
                            value={defaultModel}
                            options={modelOptions}
                            onSelect={setDefaultModel}
                            placeholder={t('llm.editor.model.select')}
                        />
                    ) : (
                        <Input
                            value={defaultModel}
                            onChangeText={setDefaultModel}
                            placeholder={provider === 'ollama' ? 'llama2' : 'gpt-4o'}
                            hint={getModelHint()}
                        />
                    )}
                </View>

                {/* Test Connection */}
                <View style={styles.testSection}>
                    <Button
                        title={isTesting ? t('llm.editor.testing') : t('llm.editor.test')}
                        onPress={handleTestConnection}
                        variant="secondary"
                        loading={isTesting}
                        icon="wifi"
                        fullWidth
                    />
                </View>

                {/* Save Button */}
                <View style={styles.saveSection}>
                    <Button
                        title={isSaving ? t('llm.editor.saving') : isEditing ? t('llm.editor.update') : t('llm.editor.save')}
                        onPress={handleSave}
                        loading={isSaving}
                        fullWidth
                    />
                </View>
            </ScrollView>
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
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: Spacing.md,
    },
    providerInfo: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.md,
    },
    providerDescription: {
        fontSize: FontSizes.sm,
    },
    fixedField: {
        marginBottom: Spacing.md,
    },
    fieldLabel: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        marginBottom: Spacing.xs,
    },
    fixedValue: {
        fontSize: FontSizes.md,
        paddingVertical: Spacing.sm,
    },
    modelSection: {
        marginBottom: Spacing.md,
    },
    modelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.xs,
    },
    refreshButton: {
        padding: Spacing.xs,
    },
    testSection: {
        marginTop: Spacing.md,
    },
    saveSection: {
        marginTop: Spacing.lg,
        marginBottom: Spacing.xl,
    },
});
