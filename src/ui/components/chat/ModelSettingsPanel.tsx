import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { EXECUTORCH_MODELS } from '../../../config/executorchModels';
import { PROVIDER_INFO } from '../../../config/providerPresets';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../config/theme';
import { LLMConfig, Persona } from '../../../core/types';
import { useAppColorScheme, useLocale } from '../../hooks';
import { SelectionModal, SelectionOption } from '../common';

interface ModelSettingsPanelProps {
    // Provider
    providers: LLMConfig[];
    selectedProviderId?: string;
    onProviderChange: (id: string | undefined) => void;
    providerConnectionStatus?: Record<string, boolean>;
    onNavigateToProviders?: () => void;

    // Model
    availableModels: string[];
    isLoadingModels?: boolean;
    selectedModel?: string;
    onModelChange: (model: string | undefined) => void;

    // Persona
    personas: Persona[];
    selectedPersonaId?: string;
    onPersonaChange: (id: string | undefined) => void;
    onNavigateToPersonas?: () => void;
}

export function ModelSettingsPanel({
    providers,
    selectedProviderId,
    onProviderChange,
    providerConnectionStatus = {},
    onNavigateToProviders,
    availableModels,
    isLoadingModels = false,
    selectedModel,
    onModelChange,
    personas,
    selectedPersonaId,
    onPersonaChange,
    onNavigateToPersonas,
}: ModelSettingsPanelProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();

    // Modal visibility states
    const [showProviderModal, setShowProviderModal] = useState(false);
    const [showModelModal, setShowModelModal] = useState(false);
    const [showPersonaModal, setShowPersonaModal] = useState(false);

    // Get selected provider
    const selectedProvider = providers.find(p => p.id === selectedProviderId);

    // Convert providers to selection options
    const providerOptions: SelectionOption[] = providers
        .filter(p => p.isEnabled)
        .map(provider => ({
            id: provider.id,
            label: provider.name,
            subtitle: t(`provider.${provider.provider}`),
            icon: (
                <Text style={{ color: '#FFFFFF', fontSize: FontSizes.sm, fontWeight: '700' }}>
                    {provider.provider.charAt(0).toUpperCase()}
                </Text>
            ),
            iconColor: PROVIDER_INFO[provider.provider]?.color || colors.tint,
            status: (providerConnectionStatus[provider.id] === true
                ? 'online'
                : providerConnectionStatus[provider.id] === false
                    ? 'offline'
                    : 'unknown') as 'online' | 'offline' | 'unknown',
        }));

    // Convert models to selection options
    // For ExecuTorch, show EXECUTORCH_MODELS; for remote providers, use availableModels
    const modelOptions: SelectionOption[] = selectedProvider?.provider === 'executorch'
        ? EXECUTORCH_MODELS.map(model => ({
            id: model.name,
            label: model.name,
            subtitle: model.description,
        }))
        : availableModels.map(model => ({
            id: model,
            label: model,
        }));

    // Convert personas to selection options
    const personaOptions: SelectionOption[] = personas.map(persona => ({
        id: persona.id,
        label: persona.name,
        subtitle: persona.systemPrompt,
    }));

    // Get display names
    const selectedProviderName = selectedProvider?.name || t('chat.settings.provider.select');
    const selectedModelName = selectedModel || t('chat.settings.model.select');
    const selectedPersona = personas.find(p => p.id === selectedPersonaId);
    const selectedPersonaName = selectedPersona?.name || t('chat.settings.persona.none');

    return (
        <View style={styles.container}>
            {/* Provider Dropdown */}
            <View style={styles.dropdownSection}>
                <Text style={[styles.dropdownLabel, { color: colors.textMuted }]}>
                    {t('chat.settings.provider')}
                </Text>
                <TouchableOpacity
                    style={[styles.dropdownButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                    onPress={() => setShowProviderModal(true)}
                >
                    {selectedProvider && (
                        <View style={[styles.providerBadge, { backgroundColor: PROVIDER_INFO[selectedProvider.provider]?.color || colors.tint }]}>
                            <Text style={styles.providerBadgeText}>
                                {selectedProvider.provider.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    <Text style={[styles.dropdownText, { color: selectedProvider ? colors.text : colors.textMuted }]} numberOfLines={1}>
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
                    {isLoadingModels ? (
                        <ActivityIndicator size="small" color={colors.tint} style={{ marginRight: Spacing.sm }} />
                    ) : null}
                    <Text style={[styles.dropdownText, { color: selectedModel ? colors.text : colors.textMuted }]} numberOfLines={1}>
                        {isLoadingModels ? t('chat.settings.model.loading') : selectedModelName}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                </TouchableOpacity>
            </View>

            {/* Persona Dropdown */}
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

            {/* Selection Modals */}
            <SelectionModal
                visible={showProviderModal}
                title={t('chat.settings.provider.select')}
                options={providerOptions}
                selectedId={selectedProviderId}
                onSelect={(id) => onProviderChange(id)}
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
                onSelect={(id) => onModelChange(id)}
                onClose={() => setShowModelModal(false)}
                emptyMessage={isLoadingModels ? t('chat.settings.model.loading') : t('chat.settings.model.empty')}
            />

            <SelectionModal
                visible={showPersonaModal}
                title={t('chat.persona.select')}
                options={personaOptions}
                selectedId={selectedPersonaId}
                onSelect={(id) => onPersonaChange(id)}
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
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
    providerBadge: {
        width: 24,
        height: 24,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
    },
    providerBadgeText: {
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
