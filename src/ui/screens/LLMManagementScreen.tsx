import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PROVIDER_LIST } from '../../config/providerPresets';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../config/theme';
import { LLMConfig, LLMProvider } from '../../core/types';
import { useLLMStore, useSettingsStore } from '../../state';
import { showConfirm, showError, showInfo } from '../../utils/alert';
import { ResourceCard, ResponsiveContainer } from '../components/common';
import { useAppColorScheme, useLocale } from '../hooks';

interface LLMManagementScreenProps {
    onNavigate: (screen: 'llm-editor', params?: { configId?: string; provider?: LLMProvider }) => void;
    onBack: () => void;
}

export function LLMManagementScreen({ onNavigate, onBack }: LLMManagementScreenProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();

    const { configs, deleteConfig, testConnection } = useLLMStore();
    const { settings, setDefaultLLM } = useSettingsStore();

    const handleAddProvider = (provider: LLMProvider) => {
        onNavigate('llm-editor', { provider });
    };

    const handleEdit = (config: LLMConfig) => {
        onNavigate('llm-editor', { configId: config.id });
    };

    const handleSetDefault = async (config: LLMConfig) => {
        await setDefaultLLM(config.id);
        showInfo(t('common.success'), `${config.name} is now the default provider.`);
    };

    const handleDelete = async (config: LLMConfig) => {
        const isDefault = settings.defaultLLMId === config.id;
        const confirmMessage = isDefault
            ? `${t('llm.management.delete.confirm', { name: config.name })}\n\nThis is the default provider. Another provider will be set as default.`
            : t('llm.management.delete.confirm', { name: config.name });

        const confirmed = await showConfirm(
            t('llm.management.delete.title'),
            confirmMessage,
            t('common.delete'),
            t('common.cancel'),
            true
        );

        if (confirmed) {
            try {
                await deleteConfig(config.id);

                // If we deleted the default, set a new default
                if (isDefault && configs.length > 1) {
                    const remaining = configs.filter(c => c.id !== config.id);
                    if (remaining.length > 0) {
                        await setDefaultLLM(remaining[0].id);
                    }
                } else if (isDefault) {
                    await setDefaultLLM(null);
                }
            } catch (error) {
                showError(t('common.error'), error instanceof Error ? error.message : t('alert.error.default'));
            }
        }
    };

    const handleTestConnection = async (config: LLMConfig): Promise<boolean> => {
        return testConnection(config.id);
    };

    const getProviderIcon = (config: LLMConfig) => {
        const info = PROVIDER_LIST[config.provider];
        return (
            <Text style={{ color: '#FFFFFF', fontSize: FontSizes.lg, fontWeight: '700' }}>
                {config.provider.charAt(0).toUpperCase()}
            </Text>
        );
    };

    // Local providers (executorch, llama-cpp) are NOT listed here
    // They are available directly in the model selector as built-in options
    const providerOptions: LLMProvider[] = ['openai', 'openai-spec', 'ollama'];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>{t('llm.management.title')}</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                <ResponsiveContainer>
                    {/* Quick Add Section */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                            {t('llm.management.add')}
                        </Text>
                        <View style={styles.quickAddGrid}>
                            {providerOptions.map((provider) => {
                                const info = PROVIDER_LIST[provider];
                                return (
                                    <TouchableOpacity
                                        key={provider}
                                        style={[
                                            styles.quickAddButton,
                                            { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                        ]}
                                        onPress={() => handleAddProvider(provider)}
                                    >
                                        <View
                                            style={[styles.quickAddIcon, { backgroundColor: info.color }]}
                                        >
                                            <Text style={styles.quickAddIconText}>
                                                {provider.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <Text style={[styles.quickAddLabel, { color: colors.text }]}>
                                            {t(`provider.${provider}`)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Existing Configs */}
                    {configs.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                                {t('llm.management.yourProviders', { count: configs.length })}
                            </Text>
                            {configs.map((config) => {
                                const info = PROVIDER_LIST[config.provider];
                                return (
                                    <ResourceCard
                                        key={config.id}
                                        title={config.name}
                                        subtitle={t(`provider.${config.provider}`)}
                                        description={config.isLocal ? t(`provider.${config.provider}.description`) : config.baseUrl}
                                        icon={getProviderIcon(config)}
                                        iconColor={info.color}
                                        isDefault={settings.defaultLLMId === config.id}
                                        onPress={() => handleEdit(config)}
                                        onTest={() => handleTestConnection(config)}
                                        onSetDefault={() => handleSetDefault(config)}
                                        onDelete={info.isDeletable ? () => handleDelete(config) : undefined}
                                    />
                                );
                            })}
                        </View>
                    )}

                    {/* Empty State */}
                    {configs.length === 0 && (
                        <View style={styles.emptyState}>
                            <Ionicons name="cloud-outline" size={64} color={colors.textMuted} />
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>
                                {t('llm.management.empty.title')}
                            </Text>
                            <Text style={[styles.emptyDescription, { color: colors.textMuted }]}>
                                {t('llm.management.empty.description')}
                            </Text>
                        </View>
                    )}
                </ResponsiveContainer>
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
    section: {
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: FontSizes.xs,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xs,
    },
    quickAddGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    quickAddButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    quickAddIcon: {
        width: 28,
        height: 28,
        borderRadius: BorderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
    },
    quickAddIconText: {
        color: '#FFFFFF',
        fontSize: FontSizes.md,
        fontWeight: '700',
    },
    quickAddLabel: {
        fontSize: FontSizes.md,
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing.xxl,
    },
    emptyTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        marginTop: Spacing.md,
    },
    emptyDescription: {
        fontSize: FontSizes.md,
        textAlign: 'center',
        marginTop: Spacing.sm,
        maxWidth: 280,
    },
});
