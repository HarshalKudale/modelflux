/**
 * ModelPicker Component
 *
 * Self-contained model selection component that fetches its own data from stores.
 * Supports two display modes:
 * - 'compact': Header-style trigger that opens a modal (for existing conversations)
 * - 'panel': Form-style vertical layout with dropdowns (for new conversations)
 *
 * The component handles:
 * - Provider selection
 * - Model selection (with proper filtering for local vs remote)
 * - Persona selection (optional)
 * - Local model loading dispatch
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { PROVIDER_LIST } from '../../../config/providerPresets';
import { BorderRadius, Colors, FontSizes, Shadows, Spacing } from '../../../config/theme';
import { DownloadedModel, LLMConfig } from '../../../core/types';
import { isLocalProvider } from '../../../state';
import { useAppColorScheme, useLocale, useModelSelection } from '../../hooks';
// Import directly to avoid require cycle with ../common/index.ts
import { SelectionModal, SelectionOption } from './SelectionModal';

export interface ModelPickerProps {
    // Display mode
    mode: 'compact' | 'panel';

    // Current selection (controlled)
    selectedProviderId?: string;
    selectedModel?: string;
    selectedPersonaId?: string;

    // Callbacks - parent provides these for state management
    onProviderChange: (providerId: string) => void;
    onModelChange: (model: string, downloadedModel?: DownloadedModel) => void;
    onPersonaChange?: (personaId: string | undefined) => void;

    // Optional navigation callbacks
    onNavigateToModels?: () => void;
    onNavigateToProviders?: () => void;
    onNavigateToPersonas?: () => void;

    // Optional: include persona selection (default: true for panel, false for compact)
    showPersona?: boolean;

    // Optional: connection status for providers
    providerConnectionStatus?: Record<string, boolean>;
}

export function ModelPicker({
    mode,
    selectedProviderId,
    selectedModel,
    selectedPersonaId,
    onProviderChange,
    onModelChange,
    onPersonaChange,
    onNavigateToModels,
    onNavigateToProviders,
    onNavigateToPersonas,
    showPersona,
    providerConnectionStatus = {},
}: ModelPickerProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const shadows = Shadows[colorScheme];
    const { t } = useLocale();

    // Use the centralized model selection hook
    const {
        enabledConfigs,
        getConfigById,
        getModelsForConfig,
        getDownloadedModelByName,
        localModelState,
        loadLocalModel,
        fetchModelsForConfig,
        isLoadingRemoteModels,
        personas,
        getPersonaById,
    } = useModelSelection();

    // Modal states for compact mode
    const [isCompactModalOpen, setIsCompactModalOpen] = useState(false);
    const [expandedConfigId, setExpandedConfigId] = useState<string | null>(null);

    // Modal states for panel mode
    const [showProviderModal, setShowProviderModal] = useState(false);
    const [showModelModal, setShowModelModal] = useState(false);
    const [showPersonaModal, setShowPersonaModal] = useState(false);

    // Default showPersona based on mode
    const shouldShowPersona = showPersona ?? (mode === 'panel');

    // Get the selected config
    const selectedConfig = selectedProviderId ? getConfigById(selectedProviderId) : undefined;

    // Get models for the selected provider
    const modelsForSelectedProvider = selectedConfig ? getModelsForConfig(selectedConfig) : [];

    // Fetch models when provider changes (for remote providers)
    useEffect(() => {
        if (selectedProviderId) {
            fetchModelsForConfig(selectedProviderId);
        }
    }, [selectedProviderId, fetchModelsForConfig]);

    // Handle model selection with automatic local model loading
    const handleModelSelect = (model: string) => {
        const downloadedModel = getDownloadedModelByName(model);

        // For local providers, trigger model loading
        if (selectedConfig && isLocalProvider(selectedConfig.provider) && downloadedModel) {
            // Check if already loaded
            if (localModelState.selectedModelId !== downloadedModel.modelId || !localModelState.isReady) {
                loadLocalModel(downloadedModel);
            }
        }

        onModelChange(model, downloadedModel);
    };

    // Handle config expand/collapse in compact mode
    const handleConfigToggle = async (config: LLMConfig) => {
        if (expandedConfigId === config.id) {
            setExpandedConfigId(null);
        } else {
            setExpandedConfigId(config.id);
            // Fetch models for remote providers
            if (!isLocalProvider(config.provider)) {
                await fetchModelsForConfig(config.id);
            }
        }
    };

    // Handle full selection in compact mode (provider + model)
    const handleCompactSelect = (configId: string, model: string) => {
        onProviderChange(configId);
        handleModelSelect(model);
        setIsCompactModalOpen(false);
        setExpandedConfigId(null);
    };

    // =====================
    // COMPACT MODE RENDER
    // =====================
    if (mode === 'compact') {
        return (
            <>
                {/* Trigger Button */}
                <TouchableOpacity
                    onPress={() => setIsCompactModalOpen(true)}
                    style={[styles.compactTrigger, { backgroundColor: colors.backgroundSecondary }]}
                >
                    <View style={styles.compactTriggerContent}>
                        {selectedConfig && (
                            <View
                                style={[
                                    styles.providerBadge,
                                    { backgroundColor: PROVIDER_LIST[selectedConfig.provider]?.color || colors.tint },
                                ]}
                            >
                                <Text style={styles.providerBadgeText}>
                                    {selectedConfig.provider.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <Text style={[styles.compactTriggerText, { color: colors.text }]} numberOfLines={1}>
                            {selectedConfig?.name || 'Select LLM'}
                            {selectedModel && ` • ${selectedModel}`}
                        </Text>
                    </View>
                    <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                </TouchableOpacity>

                {/* Compact Modal */}
                <Modal
                    visible={isCompactModalOpen}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setIsCompactModalOpen(false)}
                >
                    <Pressable
                        style={[styles.overlay, { backgroundColor: colors.overlay }]}
                        onPress={() => setIsCompactModalOpen(false)}
                    >
                        <View
                            style={[styles.compactModal, { backgroundColor: colors.cardBackground }, shadows.lg]}
                            onStartShouldSetResponder={() => true}
                        >
                            <View style={[styles.compactModalHeader, { borderBottomColor: colors.border }]}>
                                <Text style={[styles.compactModalTitle, { color: colors.text }]}>
                                    {t('chat.modelSelector.title')}
                                </Text>
                                <TouchableOpacity onPress={() => setIsCompactModalOpen(false)}>
                                    <Ionicons name="close" size={24} color={colors.textMuted} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.compactModalContent}>
                                {enabledConfigs.length === 0 ? (
                                    <View style={styles.emptyState}>
                                        <Ionicons name="settings-outline" size={48} color={colors.textMuted} />
                                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                            {t('chat.modelSelector.empty')}
                                        </Text>
                                    </View>
                                ) : (
                                    enabledConfigs.map((config) => (
                                        <View key={config.id} style={styles.configSection}>
                                            {/* Config Header */}
                                            <TouchableOpacity
                                                style={[
                                                    styles.configHeader,
                                                    { backgroundColor: config.id === selectedProviderId ? colors.sidebarActive : 'transparent' },
                                                ]}
                                                onPress={() => handleConfigToggle(config)}
                                            >
                                                <View
                                                    style={[
                                                        styles.providerIcon,
                                                        { backgroundColor: PROVIDER_LIST[config.provider]?.color || colors.tint },
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
                                                        {t(`provider.${config.provider}`)}
                                                    </Text>
                                                </View>
                                                <Ionicons
                                                    name={expandedConfigId === config.id ? 'chevron-up' : 'chevron-down'}
                                                    size={20}
                                                    color={colors.textMuted}
                                                />
                                            </TouchableOpacity>

                                            {/* Model List */}
                                            {expandedConfigId === config.id && (
                                                <View style={[styles.modelList, { backgroundColor: colors.backgroundSecondary }]}>
                                                    {isLoadingRemoteModels ? (
                                                        <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                                                            {t('chat.settings.model.loading')}
                                                        </Text>
                                                    ) : (
                                                        <>
                                                            {getModelsForConfig(config).map((model) => (
                                                                <TouchableOpacity
                                                                    key={model}
                                                                    style={[
                                                                        styles.modelItem,
                                                                        model === selectedModel && config.id === selectedProviderId && {
                                                                            backgroundColor: colors.tint + '20',
                                                                        },
                                                                    ]}
                                                                    onPress={() => handleCompactSelect(config.id, model)}
                                                                >
                                                                    <Text style={[styles.modelName, { color: colors.text }]}>
                                                                        {model}
                                                                    </Text>
                                                                    {model === selectedModel && config.id === selectedProviderId && (
                                                                        <Ionicons name="checkmark" size={18} color={colors.tint} />
                                                                    )}
                                                                </TouchableOpacity>
                                                            ))}

                                                            {getModelsForConfig(config).length === 0 && (
                                                                <View style={styles.noModelsContainer}>
                                                                    <Text style={[styles.noModelsText, { color: colors.textMuted }]}>
                                                                        {isLocalProvider(config.provider)
                                                                            ? t('chat.modelSelector.noModels.local')
                                                                            : t('chat.modelSelector.noModels.remote')}
                                                                    </Text>
                                                                    {isLocalProvider(config.provider) && onNavigateToModels && (
                                                                        <TouchableOpacity
                                                                            style={[styles.downloadButton, { backgroundColor: colors.tint }]}
                                                                            onPress={() => {
                                                                                setIsCompactModalOpen(false);
                                                                                onNavigateToModels();
                                                                            }}
                                                                        >
                                                                            <Ionicons name="add" size={20} color="#FFFFFF" />
                                                                            <Text style={styles.downloadButtonText}>
                                                                                {t('chat.modelSelector.downloadModels')}
                                                                            </Text>
                                                                        </TouchableOpacity>
                                                                    )}
                                                                </View>
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

    // =====================
    // PANEL MODE RENDER
    // =====================

    // Convert providers to selection options
    const providerOptions: SelectionOption[] = enabledConfigs.map(provider => ({
        id: provider.id,
        label: provider.name,
        subtitle: t(`provider.${provider.provider}`),
        icon: (
            <Text style={{ color: '#FFFFFF', fontSize: FontSizes.sm, fontWeight: '700' }}>
                {provider.provider.charAt(0).toUpperCase()}
            </Text>
        ),
        iconColor: PROVIDER_LIST[provider.provider]?.color || colors.tint,
        status: (providerConnectionStatus[provider.id] === true
            ? 'online'
            : providerConnectionStatus[provider.id] === false
                ? 'offline'
                : 'unknown') as 'online' | 'offline' | 'unknown',
    }));

    // Convert models to selection options
    const modelOptions: SelectionOption[] = modelsForSelectedProvider.map(model => ({
        id: model,
        label: model,
    }));

    // Convert personas to selection options
    const personaOptions: SelectionOption[] = personas.map(persona => ({
        id: persona.id,
        label: persona.name,
        subtitle: persona.system_prompt,
    }));

    // Get display names
    const selectedProviderName = selectedConfig?.name || t('chat.settings.provider.select');
    const selectedModelName = selectedModel || t('chat.settings.model.select');
    const selectedPersona = selectedPersonaId ? getPersonaById(selectedPersonaId) : null;
    const selectedPersonaName = selectedPersona?.name || t('chat.settings.persona.none');

    return (
        <View style={styles.panelContainer}>
            {/* Provider Dropdown */}
            <View style={styles.dropdownSection}>
                <Text style={[styles.dropdownLabel, { color: colors.textMuted }]}>
                    {t('chat.settings.provider')}
                </Text>
                <TouchableOpacity
                    style={[styles.dropdownButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                    onPress={() => setShowProviderModal(true)}
                >
                    {selectedConfig && (
                        <View style={[styles.panelProviderBadge, { backgroundColor: PROVIDER_LIST[selectedConfig.provider]?.color || colors.tint }]}>
                            <Text style={styles.panelProviderBadgeText}>
                                {selectedConfig.provider.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    <Text style={[styles.dropdownText, { color: selectedConfig ? colors.text : colors.textMuted }]} numberOfLines={1}>
                        {selectedProviderName}
                    </Text>
                    {selectedProviderId && providerConnectionStatus[selectedProviderId] !== undefined && (
                        <View style={[
                            styles.statusDot,
                            { backgroundColor: providerConnectionStatus[selectedProviderId] ? colors.success : colors.error }
                        ]} />
                    )}
                    <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                </TouchableOpacity>
            </View>

            {/* Model Dropdown */}
            <View style={styles.dropdownSection}>
                <Text style={[styles.dropdownLabel, { color: colors.textMuted }]}>
                    {t('chat.settings.model')}
                </Text>
                <TouchableOpacity
                    style={[
                        styles.dropdownButton,
                        {
                            backgroundColor: colors.backgroundSecondary,
                            borderColor: colors.border,
                            opacity: !selectedProviderId ? 0.5 : 1,
                        }
                    ]}
                    onPress={() => selectedProviderId && setShowModelModal(true)}
                    disabled={!selectedProviderId}
                >
                    {isLoadingRemoteModels || localModelState.isLoading ? (
                        <ActivityIndicator size="small" color={colors.tint} style={{ marginRight: Spacing.sm }} />
                    ) : null}
                    <Text style={[styles.dropdownText, { color: selectedModel ? colors.text : colors.textMuted }]} numberOfLines={1}>
                        {isLoadingRemoteModels ? t('chat.settings.model.loading') : selectedModelName}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                </TouchableOpacity>
            </View>

            {/* Persona Dropdown */}
            {shouldShowPersona && (
                <View style={styles.dropdownSection}>
                    <Text style={[styles.dropdownLabel, { color: colors.textMuted }]}>
                        {t('chat.settings.persona')}
                    </Text>
                    <TouchableOpacity
                        style={[styles.dropdownButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                        onPress={() => setShowPersonaModal(true)}
                    >
                        <Ionicons name="person-circle-outline" size={20} color={colors.tint} style={{ marginRight: Spacing.sm }} />
                        <Text style={[styles.dropdownText, { color: selectedPersonaId ? colors.text : colors.textMuted }]} numberOfLines={1}>
                            {selectedPersonaName}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Selection Modals */}
            <SelectionModal
                visible={showProviderModal}
                title={t('chat.settings.provider.select')}
                options={providerOptions}
                selectedId={selectedProviderId}
                onSelect={(id) => {
                    if (id) onProviderChange(id);
                }}
                onClose={() => setShowProviderModal(false)}
                onManagePress={() => {
                    setShowProviderModal(false);
                    onNavigateToProviders?.();
                }}
                emptyMessage={t('chat.settings.provider.empty')}
            />

            <SelectionModal
                visible={showModelModal}
                title={t('chat.settings.model.select')}
                options={modelOptions}
                selectedId={selectedModel}
                onSelect={(id) => {
                    if (id) handleModelSelect(id);
                }}
                onClose={() => setShowModelModal(false)}
                emptyMessage={isLoadingRemoteModels ? t('chat.settings.model.loading') : t('chat.settings.model.empty')}
            />

            {shouldShowPersona && (
                <SelectionModal
                    visible={showPersonaModal}
                    title={t('chat.persona.select')}
                    options={personaOptions}
                    selectedId={selectedPersonaId}
                    onSelect={(id) => onPersonaChange?.(id)}
                    onClose={() => setShowPersonaModal(false)}
                    onManagePress={() => {
                        setShowPersonaModal(false);
                        onNavigateToPersonas?.();
                    }}
                    showNoneOption={true}
                    noneOptionLabel={t('chat.settings.persona.none')}
                    noneOptionSubtitle={t('chat.settings.persona.noneDesc')}
                    emptyMessage={t('chat.settings.persona.empty')}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    // Compact Mode Styles
    compactTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.md,
        minWidth: 150,
    },
    compactTriggerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: Spacing.xs,
        minWidth: 0,
    },
    compactTriggerText: {
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
    compactModal: {
        width: '100%',
        maxWidth: 450,
        maxHeight: '80%',
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
    },
    compactModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    compactModalTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
    },
    compactModalContent: {
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
    noModelsContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    noModelsText: {
        fontSize: FontSizes.sm,
        fontStyle: 'italic',
        padding: Spacing.sm,
        textAlign: 'center',
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.sm,
        gap: Spacing.xs,
    },
    downloadButtonText: {
        color: '#FFFFFF',
        fontSize: FontSizes.sm,
        fontWeight: '600',
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

    // Panel Mode Styles
    panelContainer: {
        width: '100%',
        maxWidth: 320,
    },
    dropdownSection: {
        marginBottom: Spacing.md,
    },
    dropdownLabel: {
        fontSize: FontSizes.xs,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: Spacing.xs,
        marginLeft: Spacing.xs,
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    dropdownText: {
        flex: 1,
        fontSize: FontSizes.md,
    },
    panelProviderBadge: {
        width: 24,
        height: 24,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
    },
    panelProviderBadgeText: {
        color: '#FFFFFF',
        fontSize: FontSizes.xs,
        fontWeight: '700',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: Spacing.sm,
    },
});
