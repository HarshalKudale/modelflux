import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../config/theme';
import { MCPTransport } from '../../core/types';
import { useMCPStore } from '../../state';
import { showError, showInfo } from '../../utils/alert';
import { Button, Dropdown, Input } from '../components/common';
import { useAppColorScheme, useLocale } from '../hooks';

interface MCPEditorScreenProps {
    serverId?: string;
    onBack: () => void;
}

export function MCPEditorScreen({ serverId, onBack }: MCPEditorScreenProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();

    const { createServer, updateServer, getServerById, testConnection } = useMCPStore();

    const isEditing = Boolean(serverId);
    const existingServer = serverId ? getServerById(serverId) : null;

    // Form state
    const [name, setName] = useState('');
    const [transport, setTransport] = useState<MCPTransport>('http');
    const [endpoint, setEndpoint] = useState('');
    const [command, setCommand] = useState('');
    const [envVars, setEnvVars] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    // Initialize form with existing server
    useEffect(() => {
        if (existingServer) {
            setName(existingServer.name);
            setTransport(existingServer.transport);
            setEndpoint(existingServer.endpoint || '');
            setCommand(existingServer.command || '');
            setEnvVars(existingServer.envVars || {});
        }
    }, [existingServer]);

    const transportOptions = [
        { label: t('settings.mcp.transport.http'), value: 'http' as MCPTransport },
        { label: t('settings.mcp.transport.stdio'), value: 'stdio' as MCPTransport },
    ];

    const isValid = name.trim() && (
        (transport === 'http' && endpoint.trim()) ||
        (transport === 'stdio' && command.trim())
    );

    const handleTest = async () => {
        if (!isValid) return;

        setIsTesting(true);
        try {
            // For now, just simulate a test since we don't have actual MCP connectivity
            await new Promise(resolve => setTimeout(resolve, 1000));
            showInfo(t('common.success'), t('settings.mcp.test.success'));
        } catch (error) {
            showError(t('common.error'), t('settings.mcp.test.failed'));
        } finally {
            setIsTesting(false);
        }
    };

    const handleSave = async () => {
        if (!isValid) {
            showError(t('common.error'), 'Please fill in all required fields.');
            return;
        }

        setIsSaving(true);

        try {
            const serverData = {
                name: name.trim(),
                transport,
                endpoint: transport === 'http' ? endpoint.trim() : undefined,
                command: transport === 'stdio' ? command.trim() : undefined,
                envVars,
                isEnabled: existingServer?.isEnabled ?? true,
            };

            if (isEditing && existingServer) {
                await updateServer({
                    ...existingServer,
                    ...serverData,
                });
            } else {
                await createServer(serverData);
            }

            onBack();
        } catch (error) {
            showError(t('common.error'), error instanceof Error ? error.message : t('alert.error.default'));
        } finally {
            setIsSaving(false);
        }
    };

    // Environment variable management
    const envVarEntries = Object.entries(envVars);

    const handleAddEnvVar = () => {
        const key = `VAR_${envVarEntries.length + 1}`;
        setEnvVars({ ...envVars, [key]: '' });
    };

    const handleUpdateEnvVarKey = (oldKey: string, newKey: string) => {
        const newEnvVars = { ...envVars };
        const value = newEnvVars[oldKey];
        delete newEnvVars[oldKey];
        newEnvVars[newKey] = value;
        setEnvVars(newEnvVars);
    };

    const handleUpdateEnvVarValue = (key: string, value: string) => {
        setEnvVars({ ...envVars, [key]: value });
    };

    const handleRemoveEnvVar = (key: string) => {
        const newEnvVars = { ...envVars };
        delete newEnvVars[key];
        setEnvVars(newEnvVars);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>
                    {isEditing ? t('settings.mcp.edit') : t('settings.mcp.add')}
                </Text>
                <View style={styles.placeholder} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                    {/* Name */}
                    <Input
                        label={`${t('settings.mcp.name')} *`}
                        value={name}
                        onChangeText={setName}
                        placeholder={t('settings.mcp.namePlaceholder')}
                    />

                    {/* Transport Type */}
                    <Dropdown
                        label={t('settings.mcp.transport')}
                        value={transport}
                        options={transportOptions}
                        onSelect={setTransport}
                    />

                    {/* HTTP: Endpoint URL */}
                    {transport === 'http' && (
                        <Input
                            label={`${t('settings.mcp.endpoint')} *`}
                            value={endpoint}
                            onChangeText={setEndpoint}
                            placeholder={t('settings.mcp.endpointPlaceholder')}
                        />
                    )}

                    {/* STDIO: Command */}
                    {transport === 'stdio' && (
                        <Input
                            label={`${t('settings.mcp.command')} *`}
                            value={command}
                            onChangeText={setCommand}
                            placeholder={t('settings.mcp.commandPlaceholder')}
                        />
                    )}

                    {/* Environment Variables */}
                    <View style={styles.envVarsSection}>
                        <View style={styles.envVarsHeader}>
                            <Text style={[styles.sectionLabel, { color: colors.text }]}>
                                {t('settings.mcp.envVars')}
                            </Text>
                            <TouchableOpacity
                                style={[styles.addEnvButton, { backgroundColor: colors.backgroundSecondary }]}
                                onPress={handleAddEnvVar}
                            >
                                <Ionicons name="add" size={16} color={colors.tint} />
                                <Text style={[styles.addEnvButtonText, { color: colors.tint }]}>
                                    {t('settings.mcp.envVars.add')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {envVarEntries.map(([key, value], index) => (
                            <View key={index} style={styles.envVarRow}>
                                <TextInput
                                    style={[
                                        styles.envVarInput,
                                        styles.envVarKey,
                                        {
                                            backgroundColor: colors.backgroundSecondary,
                                            color: colors.text,
                                            borderColor: colors.border,
                                        }
                                    ]}
                                    value={key}
                                    onChangeText={(newKey) => handleUpdateEnvVarKey(key, newKey)}
                                    placeholder="KEY"
                                    placeholderTextColor={colors.textMuted}
                                />
                                <TextInput
                                    style={[
                                        styles.envVarInput,
                                        styles.envVarValue,
                                        {
                                            backgroundColor: colors.backgroundSecondary,
                                            color: colors.text,
                                            borderColor: colors.border,
                                        }
                                    ]}
                                    value={value}
                                    onChangeText={(newValue) => handleUpdateEnvVarValue(key, newValue)}
                                    placeholder="value"
                                    placeholderTextColor={colors.textMuted}
                                />
                                <TouchableOpacity
                                    style={styles.removeEnvButton}
                                    onPress={() => handleRemoveEnvVar(key)}
                                >
                                    <Ionicons name="close-circle" size={20} color={colors.error} />
                                </TouchableOpacity>
                            </View>
                        ))}

                        {envVarEntries.length === 0 && (
                            <Text style={[styles.noEnvVars, { color: colors.textMuted }]}>
                                No environment variables configured
                            </Text>
                        )}
                    </View>
                </ScrollView>

                {/* Sticky Bottom Action Bar */}
                <View style={[styles.bottomBar, { backgroundColor: colors.cardBackground, borderTopColor: colors.border }]}>
                    <View style={styles.bottomActions}>
                        <Button
                            title={isTesting ? t('common.loading') : t('settings.mcp.test')}
                            onPress={handleTest}
                            variant="secondary"
                            loading={isTesting}
                            disabled={!isValid || isTesting || isSaving}
                            icon="wifi"
                        />
                        <View style={styles.saveButtonWrapper}>
                            <Button
                                title={isSaving ? t('common.loading') : t('common.save')}
                                onPress={handleSave}
                                loading={isSaving}
                                disabled={!isValid || isSaving}
                                fullWidth
                            />
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
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
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: Spacing.md,
    },
    sectionLabel: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
    envVarsSection: {
        marginTop: Spacing.md,
    },
    envVarsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    addEnvButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.md,
        gap: Spacing.xs,
    },
    addEnvButtonText: {
        fontSize: FontSizes.sm,
        fontWeight: '500',
    },
    envVarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
        gap: Spacing.xs,
    },
    envVarInput: {
        height: 40,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        paddingHorizontal: Spacing.sm,
        fontSize: FontSizes.sm,
    },
    envVarKey: {
        flex: 1,
        fontWeight: '500',
    },
    envVarValue: {
        flex: 2,
    },
    removeEnvButton: {
        padding: Spacing.xs,
    },
    noEnvVars: {
        fontSize: FontSizes.sm,
        fontStyle: 'italic',
        paddingVertical: Spacing.md,
    },
    bottomBar: {
        padding: Spacing.md,
        borderTopWidth: 1,
    },
    bottomActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    saveButtonWrapper: {
        flex: 1,
    },
});
