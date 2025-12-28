import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EXECUTORCH_MODELS } from '../../config/executorchModels';
import { PROVIDER_INFO, PROVIDER_PRESETS } from '../../config/providerPresets';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../config/theme';
import { llmClientFactory } from '../../core/llm';
import { ExecutorChGenerationConfig, LLMConfig, LLMProvider, LocalModel } from '../../core/types';
import { useExecutorchLLMStore, useLLMStore, useSettingsStore } from '../../state';
import { showConfirm, showError, showInfo } from '../../utils/alert';
import { Button, Dropdown, Input, LocalModelList, LocalModelPicker } from '../components/common';
import { useAppColorScheme, useLocale } from '../hooks';

interface LLMEditorScreenProps {
    configId?: string;
    presetProvider?: LLMProvider;
    onBack: () => void;
}

/**
 * Helper to determine if a provider is a local on-device provider
 */
function isLocalProvider(provider: LLMProvider): boolean {
    return provider === 'executorch' || provider === 'llama-rn';
}

export function LLMEditorScreen({ configId, presetProvider, onBack }: LLMEditorScreenProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();

    const { configs, createConfig, updateConfig, getConfigById } = useLLMStore();
    const { setDefaultLLM } = useSettingsStore();

    // Local model loading state
    const {
        selectedModelId,
        selectedModelName,
        isLoading: isLoadingLocalModel,
        downloadProgress,
        isReady: isLocalModelReady,
        error: loadError,
        loadModel,
        unload,
    } = useExecutorchLLMStore();

    const isEditing = Boolean(configId);
    const existingConfig = configId ? getConfigById(configId) : null;

    // Form state - Common fields
    const [name, setName] = useState('');
    const [provider, setProvider] = useState<LLMProvider>('openai');
    const [supportsStreaming, setSupportsStreaming] = useState(true);

    // Form state - Remote provider fields
    const [baseUrl, setBaseUrl] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [defaultModel, setDefaultModel] = useState('');

    // Form state - Local provider fields
    const [localModels, setLocalModels] = useState<LocalModel[]>([]);
    const [defaultLocalModelId, setDefaultLocalModelId] = useState<string | undefined>(undefined);

    // Form state - ExecuTorch generation config
    const [genConfigTemperature, setGenConfigTemperature] = useState<string>('');
    const [genConfigTopp, setGenConfigTopp] = useState<string>('');
    const [genConfigBatchSize, setGenConfigBatchSize] = useState<string>('');
    const [genConfigBatchInterval, setGenConfigBatchInterval] = useState<string>('');

    // UI state
    const [isTesting, setIsTesting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Model fetching state (remote providers only)
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);

    // Get provider info
    const providerInfo = PROVIDER_INFO[provider];
    const isLocal = isLocalProvider(provider);

    // Initialize form with existing config or preset
    useEffect(() => {
        if (existingConfig) {
            setName(existingConfig.name);
            setProvider(existingConfig.provider);
            setBaseUrl(existingConfig.baseUrl);
            setApiKey(existingConfig.apiKey || '');
            setDefaultModel(existingConfig.defaultModel);
            setSupportsStreaming(existingConfig.supportsStreaming ?? true);
            setLocalModels(existingConfig.localModels || []);
            // Find default local model
            if (existingConfig.localModels?.length) {
                const defaultLocalModel = existingConfig.localModels.find(
                    m => m.name === existingConfig.defaultModel
                );
                setDefaultLocalModelId(defaultLocalModel?.id);
            }
            // Initialize ExecuTorch generation config
            if (existingConfig.executorchConfig) {
                setGenConfigTemperature(existingConfig.executorchConfig.temperature?.toString() || '');
                setGenConfigTopp(existingConfig.executorchConfig.topp?.toString() || '');
                setGenConfigBatchSize(existingConfig.executorchConfig.outputTokenBatchSize?.toString() || '');
                setGenConfigBatchInterval(existingConfig.executorchConfig.batchTimeInterval?.toString() || '');
            }
        } else if (presetProvider) {
            const preset = PROVIDER_PRESETS[presetProvider];
            setName(preset.name || '');
            setProvider(presetProvider);
            setBaseUrl(preset.baseUrl || '');
            setDefaultModel(preset.defaultModel || '');
            setSupportsStreaming(preset.supportsStreaming ?? true);
            setLocalModels([]);
            setDefaultLocalModelId(undefined);
        }
    }, [existingConfig, presetProvider]);

    // Fetch models when URL and API key are available (remote providers only)
    const fetchModels = async () => {
        if (isLocal) return;
        if (!baseUrl) return;
        if (providerInfo.apiKeyRequired && !apiKey) return;

        setIsLoadingModels(true);
        try {
            const tempConfig: LLMConfig = {
                id: 'temp',
                name,
                provider,
                baseUrl,
                apiKey: apiKey || undefined,
                defaultModel: '',
                supportsStreaming,
                isLocal: false,
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

    // Auto-fetch models when relevant fields change (remote providers only)
    useEffect(() => {
        if (isLocal) return;

        const canFetchModels = baseUrl && (!providerInfo.apiKeyRequired || apiKey);
        if (canFetchModels) {
            const timer = setTimeout(() => {
                fetchModels();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [baseUrl, apiKey, provider, isLocal]);

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

            // Clear incompatible fields
            if (willBeLocal) {
                setBaseUrl('');
                setApiKey('');
                setAvailableModels([]);
            } else {
                setLocalModels([]);
                setDefaultLocalModelId(undefined);
            }
        }

        setProvider(newProvider);
        const preset = PROVIDER_PRESETS[newProvider];

        if (!isEditing) {
            setName(preset.name || '');
            setBaseUrl(preset.baseUrl || '');
            setDefaultModel(preset.defaultModel || '');
            setSupportsStreaming(preset.supportsStreaming ?? true);
            setAvailableModels([]);
            setLocalModels([]);
            setDefaultLocalModelId(undefined);
        } else {
            // Apply streaming support from preset
            setSupportsStreaming(preset.supportsStreaming ?? true);
        }
    };

    const handleAddLocalModel = (model: LocalModel) => {
        setLocalModels(prev => [...prev, model]);
        // Auto-set as default if it's the first model
        if (localModels.length === 0) {
            setDefaultLocalModelId(model.id);
            setDefaultModel(model.name);
        }
    };

    const handleSetDefaultLocalModel = (modelId: string) => {
        setDefaultLocalModelId(modelId);
        const model = localModels.find(m => m.id === modelId);
        if (model) {
            setDefaultModel(model.name);
        }
    };

    const handleDeleteLocalModel = (modelId: string) => {
        // Don't allow deleting selected/loading model
        if (modelId === selectedModelId) {
            showError(t('common.error'), 'Cannot delete a selected model. Unload it first.');
            return;
        }

        setLocalModels(prev => prev.filter(m => m.id !== modelId));
        // If we deleted the default, clear or pick a new one
        if (defaultLocalModelId === modelId) {
            const remaining = localModels.filter(m => m.id !== modelId);
            if (remaining.length > 0) {
                setDefaultLocalModelId(remaining[0].id);
                setDefaultModel(remaining[0].name);
            } else {
                setDefaultLocalModelId(undefined);
                setDefaultModel('');
            }
        }
    };

    // Load/unload local model
    const handleLoadLocalModel = (modelId: string) => {
        // For ExecuTorch, look in EXECUTORCH_MODELS
        if (provider === 'executorch') {
            const executorchModel = EXECUTORCH_MODELS.find(m => m.id === modelId);
            if (executorchModel) {
                // Need to find the downloaded model for paths
                // For now, we just log - the actual model loading happens via ChatScreen/ModelSelector
                console.log('[LLMEditorScreen] ExecuTorch model selected:', executorchModel.name);
            }
            return;
        }

        // For llama-rn, look in localModels array
        const model = localModels.find(m => m.id === modelId);
        if (model) {
            // Similar to ExecuTorch, the actual loading would need DownloadedModel data
            console.log('[LLMEditorScreen] Llama-rn model selected:', model.name);
        }
    };

    const handleUnloadLocalModel = () => {
        unload();
    };

    const handleTestConnection = async () => {
        if (isLocal) {
            // Local provider test: validate model files
            if (localModels.length === 0) {
                showError(t('common.error'), t('llm.editor.error.noModels') || 'At least one model is required');
                return;
            }

            setIsTesting(true);
            try {
                // For now, just check that files exist (runtime validation would need actual runtime integration)
                const hasValidModel = localModels.some(m => m.status === 'ready');
                showInfo(
                    hasValidModel ? t('common.success') : t('common.error'),
                    hasValidModel
                        ? (t('llm.editor.test.local.success') || 'Local model validated successfully')
                        : (t('llm.editor.test.local.failed') || 'Failed to validate local model')
                );
            } finally {
                setIsTesting(false);
            }
        } else {
            // Remote provider test
            if (!baseUrl) {
                showError(t('common.error'), t('llm.editor.error.url'));
                return;
            }

            setIsTesting(true);
            try {
                const tempConfig: LLMConfig = {
                    id: existingConfig?.id || 'temp',
                    name,
                    provider,
                    baseUrl,
                    apiKey: apiKey || undefined,
                    defaultModel,
                    supportsStreaming,
                    isLocal: false,
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
        }
    };

    const handleSave = async () => {
        // Common validation
        // Name validation - not required for ExecuTorch (only one allowed)
        if (provider !== 'executorch' && !name.trim()) {
            showError(t('common.error'), t('llm.editor.error.name'));
            return;
        }

        if (isLocal) {
            // Local provider validation
            if (provider === 'executorch') {
                // ExecuTorch: no validation needed - model is selected in chat, not in provider settings
            } else {
                // llama-rn: needs custom models added
                if (localModels.length === 0) {
                    showError(t('common.error'), t('llm.editor.error.noModels') || 'At least one model is required');
                    return;
                }
                if (!defaultLocalModelId) {
                    showError(t('common.error'), t('llm.editor.error.model') || 'A default model must be selected');
                    return;
                }
            }
        } else {
            // Remote provider validation
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
        }

        setIsSaving(true);

        try {
            // For ExecuTorch, use fixed name since only one provider allowed
            const providerName = provider === 'executorch' ? 'ExecuTorch' : name.trim();

            // Build ExecuTorch generation config if any values are set
            let executorchConfig: ExecutorChGenerationConfig | undefined = undefined;
            if (provider === 'executorch') {
                const temp = parseFloat(genConfigTemperature);
                const topp = parseFloat(genConfigTopp);
                const batchSize = parseInt(genConfigBatchSize, 10);
                const batchInterval = parseInt(genConfigBatchInterval, 10);

                if (!isNaN(temp) || !isNaN(topp) || !isNaN(batchSize) || !isNaN(batchInterval)) {
                    executorchConfig = {
                        temperature: !isNaN(temp) ? temp : undefined,
                        topp: !isNaN(topp) ? topp : undefined,
                        outputTokenBatchSize: !isNaN(batchSize) ? batchSize : undefined,
                        batchTimeInterval: !isNaN(batchInterval) ? batchInterval : undefined,
                    };
                }
            }

            const configData = {
                name: providerName,
                provider,
                baseUrl: isLocal ? '' : baseUrl.trim(),
                apiKey: isLocal ? undefined : (apiKey.trim() || undefined),
                defaultModel: defaultModel.trim(),
                localModels: isLocal && provider !== 'executorch' ? localModels : undefined,
                executorchConfig,
                supportsStreaming,
                isLocal,
                isEnabled: existingConfig?.isEnabled ?? true,
            };

            if (isEditing && existingConfig) {
                await updateConfig({
                    ...existingConfig,
                    ...configData,
                });
            } else {
                const newConfig = await createConfig(configData);
                // If this is the first provider, set it as default
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

    // Local providers (executorch, llama-rn) are NOT listed here
    // They are available directly in the model selector as built-in options
    const providerOptions = [
        { label: t('provider.openai') || 'OpenAI', value: 'openai' as LLMProvider },
        { label: t('provider.openai-spec') || 'OpenAI Compatible', value: 'openai-spec' as LLMProvider },
        { label: t('provider.ollama') || 'Ollama', value: 'ollama' as LLMProvider },
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

    // Check if streaming is supported by this provider
    const streamingSupported = providerInfo.supportsStreaming;

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
                {/* ============ PROVIDER TYPE (Always visible) ============ */}
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
                        {t(`provider.${provider}.description`)}
                    </Text>
                </View>

                {/* ============ COMMON FIELDS (Always visible) ============ */}
                {/* Provider Name - Hidden for ExecuTorch (only one allowed) */}
                {provider !== 'executorch' && (
                    <Input
                        label={t('llm.editor.name')}
                        value={name}
                        onChangeText={setName}
                        placeholder={t('llm.editor.name.placeholder')}
                    />
                )}

                {/* ============ REMOTE PROVIDER FIELDS ============ */}
                {!isLocal && (
                    <>
                        {/* Base URL */}
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

                        {/* API Key */}
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

                        {/* Default Model Selection */}
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
                    </>
                )}

                {/* ============ LOCAL PROVIDER FIELDS ============ */}
                {isLocal && (
                    <View style={styles.localModelsSection}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            {t('llm.editor.localModels') || 'Model Management'}
                        </Text>

                        {/* ExecuTorch: Show generation config only (model selection is done in chat) */}
                        {provider === 'executorch' && (
                            <>
                                <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
                                    {t('llm.editor.executorch.hint') || 'Models are selected in chat. Configure generation settings below.'}
                                </Text>

                                {/* Generation Config Section */}
                                <View style={[styles.genConfigSection, { borderColor: colors.border }]}>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                        {t('llm.editor.generationConfig.title') || 'Generation Config'}
                                    </Text>
                                    <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
                                        {t('llm.editor.generationConfig.hint') || 'These settings are applied when loading the model'}
                                    </Text>

                                    <Input
                                        label={t('llm.editor.generationConfig.temperature') || 'Temperature'}
                                        value={genConfigTemperature}
                                        onChangeText={setGenConfigTemperature}
                                        placeholder="0.7"
                                        keyboardType="decimal-pad"
                                        hint={t('llm.editor.generationConfig.temperatureHint') || 'Controls randomness (0.0-2.0)'}
                                    />

                                    <Input
                                        label={t('llm.editor.generationConfig.topp') || 'Top-P'}
                                        value={genConfigTopp}
                                        onChangeText={setGenConfigTopp}
                                        placeholder="0.9"
                                        keyboardType="decimal-pad"
                                        hint={t('llm.editor.generationConfig.toppHint') || 'Nucleus sampling threshold (0.0-1.0)'}
                                    />

                                    <Input
                                        label={t('llm.editor.generationConfig.batchSize') || 'Token Batch Size'}
                                        value={genConfigBatchSize}
                                        onChangeText={setGenConfigBatchSize}
                                        placeholder="10"
                                        keyboardType="number-pad"
                                        hint={t('llm.editor.generationConfig.batchSizeHint') || 'Tokens per batch'}
                                    />

                                    <Input
                                        label={t('llm.editor.generationConfig.batchInterval') || 'Batch Interval (ms)'}
                                        value={genConfigBatchInterval}
                                        onChangeText={setGenConfigBatchInterval}
                                        placeholder="100"
                                        keyboardType="number-pad"
                                        hint={t('llm.editor.generationConfig.batchIntervalHint') || 'Time between batches in milliseconds'}
                                    />
                                </View>
                            </>
                        )}

                        {/* llama-rn: Keep file picker for GGUF files */}
                        {provider === 'llama-rn' && (
                            <>
                                <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
                                    {t('llm.editor.localModels.formatHint.llama-rn') || 'Supported format: .gguf'}
                                </Text>

                                {/* Add Model Button */}
                                <LocalModelPicker
                                    acceptedFormats={providerInfo.supportedFormats || []}
                                    onModelSelected={handleAddLocalModel}
                                />

                                {/* Model List */}
                                <LocalModelList
                                    models={localModels}
                                    defaultModelId={defaultLocalModelId}
                                    loadedModelId={selectedModelId ?? undefined}
                                    isLoadingModel={isLoadingLocalModel}
                                    loadingModelId={selectedModelId || undefined}
                                    loadError={loadError}
                                    onSetDefault={handleSetDefaultLocalModel}
                                    onDeleteModel={handleDeleteLocalModel}
                                    onLoadModel={handleLoadLocalModel}
                                    onUnloadModel={handleUnloadLocalModel}
                                />
                            </>
                        )}
                    </View>
                )}

                {/* ============ ACTION BUTTONS ============ */}
                {/* Test Button */}
                <View style={styles.testSection}>
                    <Button
                        title={isTesting ? t('llm.editor.testing') : t('llm.editor.test')}
                        onPress={handleTestConnection}
                        variant="secondary"
                        loading={isTesting}
                        icon={isLocal ? 'hardware-chip' : 'wifi'}
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
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
        marginBottom: Spacing.md,
        borderBottomWidth: 1,
    },
    toggleInfo: {
        flex: 1,
        marginRight: Spacing.md,
    },
    toggleLabel: {
        fontSize: FontSizes.md,
        fontWeight: '500',
    },
    toggleHint: {
        fontSize: FontSizes.sm,
        marginTop: Spacing.xs,
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
    localModelsSection: {
        marginBottom: Spacing.md,
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
    testSection: {
        marginTop: Spacing.md,
    },
    saveSection: {
        marginTop: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    fieldContainer: {
        marginBottom: Spacing.md,
    },
    modelInfoCard: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.md,
    },
    modelInfoName: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        marginBottom: Spacing.xs,
    },
    modelInfoDesc: {
        fontSize: FontSizes.sm,
        marginBottom: Spacing.md,
    },
    loadButtonContainer: {
        marginTop: Spacing.sm,
    },
    readyText: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        marginBottom: Spacing.sm,
    },
    errorText: {
        fontSize: FontSizes.sm,
        marginTop: Spacing.sm,
    },
    genConfigSection: {
        marginTop: Spacing.lg,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
    },
});
