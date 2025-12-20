import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PROVIDER_INFO } from '../../config/providerPresets';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../config/theme';
import { LLMProvider } from '../../core/types';
import { useLLMStore } from '../../state';
import { showConfirm } from '../../utils/alert';
import { LLMConfigCard } from '../components/settings';
import { useAppColorScheme, useLocale } from '../hooks';

interface LLMManagementScreenProps {
    onNavigate: (screen: 'llm-editor', params?: { configId?: string; provider?: LLMProvider }) => void;
    onBack: () => void;
}

export function LLMManagementScreen({ onNavigate, onBack }: LLMManagementScreenProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();

    const { configs, updateConfig, deleteConfig, testConnection } = useLLMStore();

    const handleAddProvider = (provider: LLMProvider) => {
        onNavigate('llm-editor', { provider });
    };

    const handleEdit = (configId: string) => {
        onNavigate('llm-editor', { configId });
    };

    const handleDelete = async (configId: string) => {
        const config = configs.find((c) => c.id === configId);
        const confirmed = await showConfirm(
            t('llm.management.delete.title'),
            t('llm.management.delete.confirm', { name: config?.name || '' }),
            t('common.delete'),
            t('common.cancel'),
            true
        );
        if (confirmed) {
            deleteConfig(configId);
        }
    };

    const handleToggleEnabled = async (configId: string, enabled: boolean) => {
        const config = configs.find((c) => c.id === configId);
        if (config) {
            await updateConfig({ ...config, isEnabled: enabled });
        }
    };

    const handleTestConnection = async (configId: string): Promise<boolean> => {
        return testConnection(configId);
    };

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
                {/* Quick Add Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        {t('llm.management.add')}
                    </Text>
                    <View style={styles.quickAddGrid}>
                        {providerOptions.map((provider) => {
                            const info = PROVIDER_INFO[provider];
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
                                        {info.displayName}
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
                        {configs.map((config) => (
                            <LLMConfigCard
                                key={config.id}
                                config={config}
                                onEdit={() => handleEdit(config.id)}
                                onDelete={() => handleDelete(config.id)}
                                onToggleEnabled={(enabled) => handleToggleEnabled(config.id, enabled)}
                                onTestConnection={() => handleTestConnection(config.id)}
                            />
                        ))}
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
