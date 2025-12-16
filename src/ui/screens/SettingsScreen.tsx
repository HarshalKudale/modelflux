import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../config/theme';
import { ThemeMode } from '../../core/types';
import { dataExportService } from '../../services';
import { useLLMStore, useSettingsStore } from '../../state';
import { showError, showInfo } from '../../utils/alert';
import { SettingsSection } from '../components/settings';

interface SettingsScreenProps {
    onNavigate: (screen: 'llm-management' | 'llm-editor') => void;
    onBack: () => void;
}

export function SettingsScreen({ onNavigate, onBack }: SettingsScreenProps) {
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const { settings, setTheme, toggleStreaming } = useSettingsStore();
    const { configs, loadConfigs } = useLLMStore();

    const themeOptions: { label: string; value: ThemeMode; icon: keyof typeof Ionicons.glyphMap }[] = [
        { label: 'Light', value: 'light', icon: 'sunny' },
        { label: 'Dark', value: 'dark', icon: 'moon' },
        { label: 'System', value: 'system', icon: 'phone-portrait' },
    ];

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const summary = await dataExportService.getExportSummary();
            showInfo(
                'Export Data',
                `Exporting:\n• ${summary.llmConfigs} provider(s)\n• ${summary.conversations} conversation(s)\n• ${summary.messages} message(s)`
            );
            await dataExportService.exportData();
            showInfo('Success', 'Data exported successfully!');
        } catch (error) {
            console.error('Export error:', error);
            showError('Export Failed', error instanceof Error ? error.message : 'Unknown error');
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
                    'Import Successful',
                    result.stats
                        ? `Imported:\n• ${result.stats.llmConfigs} provider(s)\n• ${result.stats.conversations} conversation(s)\n• ${result.stats.messages} message(s)`
                        : result.message
                );
                // Reload data
                await loadConfigs();
            } else {
                showError('Import', result.message);
            }
        } catch (error) {
            console.error('Import error:', error);
            showError('Import Failed', error instanceof Error ? error.message : 'Unknown error');
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
                <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {/* General Settings */}
                <SettingsSection title="General">
                    {/* Theme Selection */}
                    <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: colors.text }]}>Theme</Text>
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

                    {/* Streaming Toggle */}
                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: colors.text }]}>
                                Streaming Responses
                            </Text>
                            <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                                Show AI responses as they're generated
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
                <SettingsSection title="LLM Providers">
                    <TouchableOpacity
                        style={[styles.settingItem, styles.linkItem]}
                        onPress={() => onNavigate('llm-management')}
                    >
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: colors.text }]}>
                                Manage Providers
                            </Text>
                            <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                                {configs.length} provider{configs.length !== 1 ? 's' : ''} configured
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                </SettingsSection>

                {/* Data Management */}
                <SettingsSection title="Data">
                    <TouchableOpacity
                        style={[styles.settingItem, { borderBottomColor: colors.border }]}
                        onPress={handleExport}
                        disabled={isExporting}
                    >
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: isExporting ? colors.textMuted : colors.text }]}>
                                Export Data
                            </Text>
                            <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                                Save providers & chats as JSON
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
                                Import Data
                            </Text>
                            <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                                Load providers & chats from JSON
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
                <SettingsSection title="About">
                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: colors.text }]}>
                                Version
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
});
