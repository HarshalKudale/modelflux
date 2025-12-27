import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { EXECUTORCH_MODELS } from '../../../config/executorchModels';
import { POPULAR_MODELS, PROVIDER_INFO } from '../../../config/providerPresets';
import { BorderRadius, Colors, FontSizes, Shadows, Spacing } from '../../../config/theme';
import { LLMConfig } from '../../../core/types';
import { isLocalProvider, useLLMStore, useLocalLLMStore } from '../../../state';
import { useAppColorScheme } from '../../hooks';

interface ModelSelectorProps {
    selectedLLMId: string;
    selectedModel: string;
    onSelect: (llmId: string, model: string) => void;
}

export function ModelSelector({
    selectedLLMId,
    selectedModel,
    onSelect,
}: ModelSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [expandedConfigId, setExpandedConfigId] = useState<string | null>(null);
    const [isLocalSectionExpanded, setIsLocalSectionExpanded] = useState(false);

    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const shadows = Shadows[colorScheme];

    const { configs, availableModels, fetchModels, isLoadingModels } = useLLMStore();
    const {
        selectedModelName,
        selectedModelId,
        isReady: isLocalModelReady,
        isLoading: isLocalModelLoading,
        downloadProgress,
        selectModel
    } = useLocalLLMStore();

    // Show all enabled configs (including ExecuTorch which is now a real config)
    const enabledConfigs = configs.filter((c) => c.isEnabled);

    const selectedConfig = configs.find((c) => c.id === selectedLLMId);

    const handleConfigSelect = async (config: LLMConfig) => {
        if (expandedConfigId === config.id) {
            setExpandedConfigId(null);
        } else {
            setExpandedConfigId(config.id);
            // Fetch models for remote providers only
            if (!isLocalProvider(config.provider) && !availableModels[config.id]) {
                await fetchModels(config.id);
            }
        }
    };

    const handleModelSelect = (llmId: string, model: string) => {
        onSelect(llmId, model);
        setIsOpen(false);
        setExpandedConfigId(null);
    };

    const getModelsForConfig = (config: LLMConfig): string[] => {
        // For ExecuTorch, show all available local models
        if (config.provider === 'executorch') {
            return EXECUTORCH_MODELS.map(m => m.name);
        }

        // For remote providers - use fetched models if available
        if (availableModels[config.id] && availableModels[config.id].length > 0) {
            return availableModels[config.id];
        }
        // Fallback to popular models for the provider
        return POPULAR_MODELS[config.provider] || [];
    };

    // Handle selecting a local ExecuTorch model
    const handleLocalModelSelect = (modelId: string, modelName: string) => {
        // Select/load the model
        selectModel(modelId, modelName);
        // For now, close the selector - later we can keep it open to show loading progress
        setIsOpen(false);
        setIsLocalSectionExpanded(false);
        // Use a special 'executorch' llmId to indicate local model
        onSelect('executorch-local', modelName);
    };

    return (
        <>
            <TouchableOpacity
                onPress={() => setIsOpen(true)}
                style={[styles.trigger, { backgroundColor: colors.backgroundSecondary }]}
            >
                <View style={styles.triggerContent}>
                    {selectedConfig && (
                        <View
                            style={[
                                styles.providerBadge,
                                { backgroundColor: PROVIDER_INFO[selectedConfig.provider]?.color || colors.tint },
                            ]}
                        >
                            <Text style={styles.providerBadgeText}>
                                {selectedConfig.provider.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    <Text style={[styles.triggerText, { color: colors.text }]} numberOfLines={1}>
                        {selectedConfig?.name || 'Select LLM'}
                        {selectedModel && ` • ${selectedModel}`}
                    </Text>
                </View>
                <Ionicons name="chevron-down" size={16} color={colors.textMuted} style={styles.triggerChevron} />
            </TouchableOpacity>

            <Modal
                visible={isOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setIsOpen(false)}
            >
                <Pressable
                    style={[styles.overlay, { backgroundColor: colors.overlay }]}
                    onPress={() => setIsOpen(false)}
                >
                    <View
                        style={[styles.modal, { backgroundColor: colors.cardBackground }, shadows.lg]}
                    >
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                Select Model
                            </Text>
                            <TouchableOpacity onPress={() => setIsOpen(false)}>
                                <Ionicons name="close" size={24} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent}>
                            {/* Providers and Models */}
                            {enabledConfigs.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="settings-outline" size={48} color={colors.textMuted} />
                                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                        No LLM providers configured.{'\n'}Add one in Settings.
                                    </Text>
                                </View>
                            ) : (
                                enabledConfigs.map((config) => (
                                    <View key={config.id} style={styles.configSection}>
                                        <TouchableOpacity
                                            style={[
                                                styles.configHeader,
                                                { backgroundColor: config.id === selectedLLMId ? colors.sidebarActive : 'transparent' },
                                            ]}
                                            onPress={() => handleConfigSelect(config)}
                                        >
                                            <View
                                                style={[
                                                    styles.providerIcon,
                                                    { backgroundColor: PROVIDER_INFO[config.provider]?.color || colors.tint },
                                                ]}
                                            >
                                                <Text style={styles.providerIconText}>
                                                    {config.provider.charAt(0).toUpperCase()}
                                                </Text>
                                            </View>
                                            <View style={styles.configInfo}>
                                                <Text style={[styles.configName, { color: colors.text }]}>
                                                    {config.name}
                                                </Text>
                                                <Text style={[styles.configProvider, { color: colors.textMuted }]}>
                                                    {PROVIDER_INFO[config.provider]?.displayName}
                                                </Text>
                                            </View>
                                            <Ionicons
                                                name={expandedConfigId === config.id ? 'chevron-up' : 'chevron-down'}
                                                size={20}
                                                color={colors.textMuted}
                                            />
                                        </TouchableOpacity>

                                        {expandedConfigId === config.id && (
                                            <View style={[styles.modelList, { backgroundColor: colors.backgroundSecondary }]}>
                                                {isLoadingModels ? (
                                                    <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                                                        Loading models...
                                                    </Text>
                                                ) : (
                                                    <>
                                                        {getModelsForConfig(config).map((model) => (
                                                            <TouchableOpacity
                                                                key={model}
                                                                style={[
                                                                    styles.modelItem,
                                                                    model === selectedModel && config.id === selectedLLMId && {
                                                                        backgroundColor: colors.tint + '20',
                                                                    },
                                                                ]}
                                                                onPress={() => handleModelSelect(config.id, model)}
                                                            >
                                                                <Text style={[styles.modelName, { color: colors.text }]}>
                                                                    {model}
                                                                </Text>
                                                                {model === selectedModel && config.id === selectedLLMId && (
                                                                    <Ionicons name="checkmark" size={18} color={colors.tint} />
                                                                )}
                                                            </TouchableOpacity>
                                                        ))}

                                                        {getModelsForConfig(config).length === 0 && !isLoadingModels && (
                                                            <Text style={[styles.noModelsText, { color: colors.textMuted }]}>
                                                                {isLocalProvider(config.provider)
                                                                    ? 'No model loaded. Go to Settings to download and load a model.'
                                                                    : 'No models available. Check connection.'}
                                                            </Text>
                                                        )}
                                                    </>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </Pressable>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.md,
        minWidth: 150,
    },
    triggerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: Spacing.xs,
        minWidth: 0,
    },
    triggerChevron: {
        flexShrink: 0,
    },
    providerBadge: {
        width: 20,
        height: 20,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.xs,
    },
    providerBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    triggerText: {
        fontSize: FontSizes.sm,
        fontWeight: '500',
        flex: 1,
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    modal: {
        width: '100%',
        maxWidth: 450,
        maxHeight: '80%',
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
    },
    modalContent: {
        padding: Spacing.md,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    emptyText: {
        marginTop: Spacing.md,
        textAlign: 'center',
        fontSize: FontSizes.md,
    },
    configSection: {
        marginBottom: Spacing.sm,
    },
    configHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    providerIcon: {
        width: 36,
        height: 36,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    providerIconText: {
        color: '#FFFFFF',
        fontSize: FontSizes.lg,
        fontWeight: '700',
    },
    configInfo: {
        flex: 1,
    },
    configName: {
        fontSize: FontSizes.md,
        fontWeight: '600',
    },
    configProvider: {
        fontSize: FontSizes.sm,
        marginTop: 2,
    },
    modelList: {
        marginTop: Spacing.xs,
        borderRadius: BorderRadius.md,
        padding: Spacing.sm,
        marginLeft: Spacing.xl + Spacing.md,
    },
    loadingText: {
        fontSize: FontSizes.sm,
        padding: Spacing.sm,
    },
    modelItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.sm,
    },
    modelName: {
        fontSize: FontSizes.md,
    },
    noModelsText: {
        fontSize: FontSizes.sm,
        fontStyle: 'italic',
        padding: Spacing.sm,
        textAlign: 'center',
    },
    // Local model section styles
    loadingBadge: {
        fontSize: FontSizes.xs,
        fontWeight: '600',
        marginRight: Spacing.sm,
    },
    localModelInfo: {
        flex: 1,
    },
    modelDescription: {
        fontSize: FontSizes.xs,
        marginTop: 2,
    },
    modelReadyBadge: {
        marginLeft: Spacing.sm,
    },
    modelLoadingText: {
        fontSize: FontSizes.xs,
        fontWeight: '500',
        marginLeft: Spacing.sm,
    },
});
