import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../config/theme';
import { Persona } from '../../core/types';
import { usePersonaStore, useSettingsStore } from '../../state';
import { showConfirm, showError, showInfo } from '../../utils/alert';
import { ResourceCard, ResponsiveContainer } from '../components/common';
import { useAppColorScheme, useLocale } from '../hooks';

interface PersonaListScreenProps {
    onNavigate: (screen: 'persona-editor', params?: { personaId?: string }) => void;
    onBack: () => void;
}

export function PersonaListScreen({ onNavigate, onBack }: PersonaListScreenProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();

    const { personas, loadPersonas, deletePersona } = usePersonaStore();
    const { settings, setDefaultPersona } = useSettingsStore();

    useEffect(() => {
        loadPersonas();
    }, []);

    const handleCreate = () => {
        onNavigate('persona-editor');
    };

    const handleEdit = (persona: Persona) => {
        onNavigate('persona-editor', { personaId: persona.id });
    };

    const handleSetDefault = async (persona: Persona) => {
        await setDefaultPersona(persona.id);
        showInfo(t('common.success'), `${persona.name} is now the default persona.`);
    };

    const handleDelete = async (persona: Persona) => {
        const isDefault = settings.defaultPersonaId === persona.id;
        const confirmMessage = isDefault
            ? `${t('settings.personas.delete.confirm', { name: persona.name })}\n\n${t('settings.personas.delete.isDefault')}`
            : t('settings.personas.delete.confirm', { name: persona.name });

        const confirmed = await showConfirm(
            t('settings.personas.delete.title'),
            confirmMessage,
            t('common.delete'),
            t('common.cancel'),
            true
        );

        if (confirmed) {
            try {
                await deletePersona(persona.id);

                // If we deleted the default, set a new default
                if (isDefault && personas.length > 1) {
                    const remaining = personas.filter(p => p.id !== persona.id);
                    if (remaining.length > 0) {
                        await setDefaultPersona(remaining[0].id);
                    }
                } else if (isDefault) {
                    await setDefaultPersona(null);
                }
            } catch (error) {
                showError(t('common.error'), error instanceof Error ? error.message : t('alert.error.default'));
            }
        }
    };

    const getPersonaIcon = (persona: Persona) => (
        <Text style={{ fontSize: 20 }}>🎭</Text>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>{t('settings.personas.title')}</Text>
                <TouchableOpacity onPress={handleCreate} style={styles.addButton}>
                    <Ionicons name="add" size={24} color={colors.tint} />
                </TouchableOpacity>
            </View>

            {personas.length === 0 ? (
                /* Empty State */
                <ResponsiveContainer>
                    <View style={styles.emptyState}>
                        <Ionicons name="person-outline" size={64} color={colors.textMuted} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>
                            {t('settings.personas.emptyState.title')}
                        </Text>
                        <Text style={[styles.emptyDescription, { color: colors.textMuted }]}>
                            {t('settings.personas.emptyState.description')}
                        </Text>
                        <TouchableOpacity
                            style={[styles.emptyButton, { backgroundColor: colors.tint }]}
                            onPress={handleCreate}
                        >
                            <Ionicons name="add" size={20} color="#FFFFFF" />
                            <Text style={styles.emptyButtonText}>
                                {t('settings.personas.emptyState.cta')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ResponsiveContainer>
            ) : (
                <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                    <ResponsiveContainer>
                        {personas.map((persona) => (
                            <ResourceCard
                                key={persona.id}
                                title={persona.name}
                                subtitle={persona.description}
                                description={persona.system_prompt}
                                icon={getPersonaIcon(persona)}
                                iconColor={colors.backgroundSecondary}
                                isDefault={settings.defaultPersonaId === persona.id}
                                onPress={() => handleEdit(persona)}
                                onSetDefault={() => handleSetDefault(persona)}
                                onDelete={() => handleDelete(persona)}
                            />
                        ))}
                    </ResponsiveContainer>
                </ScrollView>
            )}
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
    addButton: {
        padding: Spacing.xs,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: Spacing.md,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
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
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.lg,
        gap: Spacing.xs,
    },
    emptyButtonText: {
        color: '#FFFFFF',
        fontSize: FontSizes.md,
        fontWeight: '600',
    },
});
