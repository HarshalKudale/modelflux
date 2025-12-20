import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../config/theme';
import { ThemeMode } from '../../core/types';
import { LanguageInfo, SUPPORTED_LANGUAGES } from '../../locales';
import { dataExportService } from '../../services';
import { useLLMStore, useSettingsStore } from '../../state';
import { showError, showInfo } from '../../utils/alert';
import { SettingsSection } from '../components/settings';
import { useAppColorScheme, useLocale } from '../hooks';

interface SettingsScreenProps {
    onNavigate: (screen: 'llm-management' | 'llm-editor') => void;
    onBack: () => void;
}

export function SettingsScreen({ onNavigate, onBack }: SettingsScreenProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
    const flatListRef = useRef<FlatList<LanguageInfo>>(null);

    const { settings, setTheme, toggleStreaming, setLanguage } = useSettingsStore();
    const { configs, loadConfigs } = useLLMStore();

    const themeOptions: { label: string; value: ThemeMode; icon: keyof typeof Ionicons.glyphMap }[] = [
        { label: t('settings.theme.light'), value: 'light', icon: 'sunny' },
        { label: t('settings.theme.dark'), value: 'dark', icon: 'moon' },
        { label: t('settings.theme.system'), value: 'system', icon: 'phone-portrait' },
    ];

    // Get current language info
    const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === settings.language) || SUPPORTED_LANGUAGES[0];

    // Scroll to selected language when modal opens
    useEffect(() => {
        if (isLanguageModalVisible && flatListRef.current) {
            const index = SUPPORTED_LANGUAGES.findIndex(lang => lang.code === settings.language);
            if (index >= 0) {
                setTimeout(() => {
                    flatListRef.current?.scrollToIndex({
                        index,
                        animated: true,
                        viewPosition: 0.5, // Center the item
                    });
                }, 100);
            }
        }
    }, [isLanguageModalVisible, settings.language]);

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
                // Reload data
                await loadConfigs();
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

    const handleLanguageChange = async (languageCode: string) => {
        await setLanguage(languageCode);
        setIsLanguageModalVisible(false);
    };

    const renderLanguageItem = ({ item }: { item: LanguageInfo }) => {
        const isSelected = item.code === settings.language;
        return (
            <TouchableOpacity
                style={[
                    styles.languageModalItem,
                    {
                        backgroundColor: isSelected ? colors.tint : 'transparent',
                    },
                ]}
                onPress={() => handleLanguageChange(item.code)}
            >
                <Text
                    style={[
                        styles.languageModalItemText,
                        {
                            color: isSelected ? '#FFFFFF' : colors.text,
                            fontWeight: isSelected ? '700' : '500',
                        },
                    ]}
                >
                    {item.nativeName}
                </Text>
                <Text
                    style={[
                        styles.languageModalItemSubtext,
                        {
                            color: isSelected ? 'rgba(255,255,255,0.7)' : colors.textMuted,
                        },
                    ]}
                >
                    {item.name}
                </Text>
            </TouchableOpacity>
        );
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
                {/* General Settings */}
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

                    {/* Language Selection - Dropdown */}
                    <TouchableOpacity
                        style={[styles.settingItem, { borderBottomColor: colors.border }]}
                        onPress={() => setIsLanguageModalVisible(true)}
                    >
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.language')}</Text>
                        </View>
                        <View style={styles.languageDropdown}>
                            <Text style={[styles.languageDropdownText, { color: colors.text }]}>
                                {currentLanguage.nativeName}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                        </View>
                    </TouchableOpacity>

                    {/* Streaming Toggle */}
                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: colors.text }]}>
                                {t('settings.streaming.title')}
                            </Text>
                            <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                                {t('settings.streaming.description')}
                            </Text>
                        </View>
                        <Switch
                            value={settings.streamingEnabled}
                            onValueChange={toggleStreaming}
                            trackColor={{ false: colors.backgroundTertiary, true: colors.tint + '60' }}
                            thumbColor={settings.streamingEnabled ? colors.tint : colors.textMuted}
                        />
                    </View>
                </SettingsSection>

                {/* LLM Settings */}
                <SettingsSection title={t('settings.providers.title')}>
                    <TouchableOpacity
                        style={[styles.settingItem, styles.linkItem]}
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
                </SettingsSection>

                {/* Data Management */}
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
                        style={styles.settingItem}
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

                {/* About */}
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

            {/* Language Selection Modal */}
            <Modal
                visible={isLanguageModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsLanguageModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsLanguageModalVisible(false)}
                >
                    <View
                        style={[
                            styles.languageModal,
                            { backgroundColor: colors.cardBackground },
                        ]}
                    >
                        <View style={[styles.languageModalHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.languageModalTitle, { color: colors.text }]}>
                                {t('settings.language')}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setIsLanguageModalVisible(false)}
                                style={styles.languageModalClose}
                            >
                                <Ionicons name="close" size={24} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            ref={flatListRef}
                            data={SUPPORTED_LANGUAGES}
                            keyExtractor={(item) => item.code}
                            renderItem={renderLanguageItem}
                            contentContainerStyle={styles.languageModalList}
                            showsVerticalScrollIndicator={false}
                            getItemLayout={(_, index) => ({
                                length: 60,
                                offset: 60 * index,
                                index,
                            })}
                            onScrollToIndexFailed={() => {
                                // Fallback if scroll fails
                            }}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
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
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    languageModal: {
        width: Math.min(Dimensions.get('window').width - 48, 320),
        maxHeight: 360,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
    },
    languageModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
    },
    languageModalTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
    },
    languageModalClose: {
        padding: Spacing.xs,
    },
    languageModalList: {
        paddingVertical: Spacing.xs,
    },
    languageModalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        height: 60,
    },
    languageModalItemText: {
        fontSize: FontSizes.md,
    },
    languageModalItemSubtext: {
        fontSize: FontSizes.sm,
    },
});
