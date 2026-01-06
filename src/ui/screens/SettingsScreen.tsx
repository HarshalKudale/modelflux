import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../config/theme';
import { ThemeMode } from '../../core/types';
import { SUPPORTED_LANGUAGES } from '../../locales';
import { dataExportService } from '../../services';
import { useLLMStore, usePersonaStore, useSettingsStore } from '../../state';
import { showError, showInfo } from '../../utils/alert';
import { SettingsSection } from '../components/settings';
import { useAppColorScheme, useLocale } from '../hooks';

type ScreenType =
    | 'llm-management'
    | 'llm-editor'
    | 'model-list'
    | 'persona-list'
    | 'persona-editor'
    | 'logs'
    | 'language-select'
    | 'rag-settings'
    | 'rag-provider-list'
    | 'rag-provider-editor';

interface SettingsScreenProps {
    onNavigate: (screen: ScreenType, params?: Record<string, string>) => void;
    onBack: () => void;
}

export function SettingsScreen({ onNavigate, onBack }: SettingsScreenProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const { settings, setTheme } = useSettingsStore();
    const { configs } = useLLMStore();
    const { personas, loadPersonas } = usePersonaStore();

    // Load data on mount
    useEffect(() => {
        loadPersonas();
    }, []);

    // Get current language info
    const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === settings.language) || SUPPORTED_LANGUAGES[0];

    const themeOptions: { label: string; value: ThemeMode; icon: keyof typeof Ionicons.glyphMap }[] = [
        { label: t('settings.theme.light'), value: 'light', icon: 'sunny' },
        { label: t('settings.theme.dark'), value: 'dark', icon: 'moon' },
        { label: t('settings.theme.system'), value: 'system', icon: 'phone-portrait' },
    ];

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const summary = await dataExportService.getExportSummary();
            showInfo(
                t('settings.export.title'),
                t('settings.export.summary', {
                    llmConfigs: summary.llmConfigs,
                    conversations: summary.conversations,
                    messages: summary.messages,
                })
            );
            await dataExportService.exportData();
            showInfo(t('common.success'), t('settings.export.success'));
        } catch (error) {
            console.error('Export error:', error);
            showError(t('settings.export.failed'), error instanceof Error ? error.message : t('common.error'));
        } finally {
            setIsExporting(false);
        }
    };

    const handleImport = async () => {
        setIsImporting(true);
        try {
            const result = await dataExportService.importData();
            if (result.success) {
                showInfo(
                    t('settings.import.success'),
                    result.stats
                        ? t('settings.import.summary', {
                            llmConfigs: result.stats.llmConfigs,
                            conversations: result.stats.conversations,
                            messages: result.stats.messages,
                        })
                        : result.message
                );
            } else {
                showError(t('settings.import.title'), result.message);
            }
        } catch (error) {
            console.error('Import error:', error);
            showError(t('settings.import.failed'), error instanceof Error ? error.message : t('common.error'));
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>{t('settings.title')}</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {/* ===== GENERAL SECTION ===== */}
                <SettingsSection title={t('settings.general')}>
                    {/* Theme Selection */}
                    <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.theme')}</Text>
                        </View>
                        <View style={styles.themeOptions}>
                            {themeOptions.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.themeOption,
                                        {
                                            backgroundColor:
                                                settings.theme === option.value
                                                    ? colors.tint
                                                    : colors.backgroundSecondary,
                                        },
                                    ]}
                                    onPress={() => setTheme(option.value)}
                                >
                                    <Ionicons
                                        name={option.icon}
                                        size={16}
                                        color={settings.theme === option.value ? '#FFFFFF' : colors.text}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Language Selection - Navigate to full screen */}
                    <TouchableOpacity
                        style={[styles.settingItem, { borderBottomColor: colors.border }]}
                        onPress={() => onNavigate('language-select')}
                    >
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.language')}</Text>
                        </View>
                        <View style={styles.languageDropdown}>
                            <Text style={[styles.languageDropdownText, { color: colors.text }]}>
                                {currentLanguage.nativeName}
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                        </View>
                    </TouchableOpacity>
                </SettingsSection>

                {/* ===== LLM SECTION ===== */}
                <SettingsSection title={t('settings.llm.title')}>
                    {/* Manage LLM Providers → Navigate to list */}
                    <TouchableOpacity
                        style={[styles.settingItem, styles.linkItem, { borderBottomColor: colors.border }]}
                        onPress={() => onNavigate('llm-management')}
                    >
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: colors.text }]}>
                                {t('settings.providers.manage')}
                            </Text>
                            <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                                {t('settings.providers.count', { count: configs.length })}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </TouchableOpacity>

                    {/* RAG Providers → Navigate to list (conditionally shown on native) */}
                    {Platform.OS !== 'web' && (
                        <TouchableOpacity
                            style={[styles.settingItem, styles.linkItem, { borderBottomColor: colors.border }]}
                            onPress={() => onNavigate('rag-provider-list')}
                        >
                            <View style={styles.settingInfo}>
                                <Text style={[styles.settingLabel, { color: colors.text }]}>
                                    {t('settings.rag.configure')}
                                </Text>
                                <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                                    {t('settings.rag.description')}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    )}

                    {/* Models → Navigate to list */}
                    <TouchableOpacity
                        style={[styles.settingItem, styles.linkItem, { borderBottomColor: colors.border }]}
                        onPress={() => onNavigate('model-list')}
                    >
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: colors.text }]}>
                                {t('settings.models.title')}
                            </Text>
                            <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                                {t('settings.models.description')}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </TouchableOpacity>

                    {/* Personas → Navigate to list */}
                    <TouchableOpacity
                        style={[styles.settingItem, styles.linkItem]}
                        onPress={() => onNavigate('persona-list')}
                    >
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: colors.text }]}>
                                {t('settings.personas.title')}
                            </Text>
                            <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                                {personas.length === 0
                                    ? t('settings.personas.empty')
                                    : t('settings.personas.count', { count: personas.length })}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                </SettingsSection>

                {/* ===== DATA MANAGEMENT SECTION ===== */}
                <SettingsSection title={t('settings.data.title')}>
                    <TouchableOpacity
                        style={[styles.settingItem, { borderBottomColor: colors.border }]}
                        onPress={handleExport}
                        disabled={isExporting}
                    >
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: isExporting ? colors.textMuted : colors.text }]}>
                                {t('settings.export.title')}
                            </Text>
                            <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                                {t('settings.export.description')}
                            </Text>
                        </View>
                        {isExporting ? (
                            <ActivityIndicator size="small" color={colors.tint} />
                        ) : (
                            <Ionicons name="download-outline" size={20} color={colors.textMuted} />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.settingItem, { borderBottomColor: colors.border }]}
                        onPress={handleImport}
                        disabled={isImporting}
                    >
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: isImporting ? colors.textMuted : colors.text }]}>
                                {t('settings.import.title')}
                            </Text>
                            <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                                {t('settings.import.description')}
                            </Text>
                        </View>
                        {isImporting ? (
                            <ActivityIndicator size="small" color={colors.tint} />
                        ) : (
                            <Ionicons name="cloud-upload-outline" size={20} color={colors.textMuted} />
                        )}
                    </TouchableOpacity>
                </SettingsSection>


                {/* ===== DEVELOPER SECTION ===== */}
                <SettingsSection title={t('settings.developer.title')}>
                    <TouchableOpacity
                        style={[styles.settingItem, styles.linkItem]}
                        onPress={() => onNavigate('logs')}
                    >
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: colors.text }]}>
                                {t('settings.developer.logs')}
                            </Text>
                            <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                                {t('settings.developer.logsDesc')}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                </SettingsSection>

                {/* ===== ABOUT SECTION ===== */}
                <SettingsSection title={t('settings.about.title')}>
                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: colors.text }]}>
                                {t('common.version')}
                            </Text>
                        </View>
                        <Text style={[styles.settingValue, { color: colors.textMuted }]}>
                            1.0.0
                        </Text>
                    </View>
                </SettingsSection>
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
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'transparent',
    },
    linkItem: {
        borderBottomWidth: 0,
    },
    settingInfo: {
        flex: 1,
        marginRight: Spacing.md,
    },
    settingLabel: {
        fontSize: FontSizes.md,
        fontWeight: '500',
    },
    settingDescription: {
        fontSize: FontSizes.sm,
        marginTop: 2,
    },
    settingValue: {
        fontSize: FontSizes.md,
    },
    themeOptions: {
        flexDirection: 'row',
        gap: Spacing.xs,
    },
    themeOption: {
        width: 36,
        height: 36,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    languageDropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    languageDropdownText: {
        fontSize: FontSizes.md,
        fontWeight: '500',
    },
});
