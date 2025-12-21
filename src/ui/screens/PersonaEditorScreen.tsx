import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSizes, Spacing } from '../../config/theme';
import { usePersonaStore, useSettingsStore } from '../../state';
import { showError } from '../../utils/alert';
import { Button, Input } from '../components/common';
import { useAppColorScheme, useLocale } from '../hooks';

interface PersonaEditorScreenProps {
    personaId?: string;
    onBack: () => void;
}

export function PersonaEditorScreen({ personaId, onBack }: PersonaEditorScreenProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();

    const { personas, createPersona, updatePersona, getPersonaById } = usePersonaStore();
    const { settings, setDefaultPersona } = useSettingsStore();

    const isEditing = Boolean(personaId);
    const existingPersona = personaId ? getPersonaById(personaId) : null;

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [age, setAge] = useState('');
    const [location, setLocation] = useState('');
    const [job, setJob] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Initialize form with existing persona
    useEffect(() => {
        if (existingPersona) {
            setName(existingPersona.name);
            setDescription(existingPersona.description || '');
            setSystemPrompt(existingPersona.systemPrompt);
            setAge(existingPersona.age || '');
            setLocation(existingPersona.location || '');
            setJob(existingPersona.job || '');
        }
    }, [existingPersona]);

    const isValid = name.trim() && systemPrompt.trim();

    const handleSave = async () => {
        if (!isValid) {
            showError(t('common.error'), t('settings.personas.name') + ' and ' + t('settings.personas.systemPrompt') + ' are required.');
            return;
        }

        setIsSaving(true);

        try {
            const personaData = {
                name: name.trim(),
                description: description.trim() || undefined,
                systemPrompt: systemPrompt.trim(),
                age: age.trim() || undefined,
                location: location.trim() || undefined,
                job: job.trim() || undefined,
            };

            if (isEditing && existingPersona) {
                await updatePersona({
                    ...existingPersona,
                    ...personaData,
                });
            } else {
                const newPersona = await createPersona(personaData);
                // If this is the first persona, set it as default
                if (personas.length === 0) {
                    await setDefaultPersona(newPersona.id);
                }
            }

            onBack();
        } catch (error) {
            showError(t('common.error'), error instanceof Error ? error.message : t('alert.error.default'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>
                    {isEditing ? t('settings.personas.edit') : t('settings.personas.create')}
                </Text>
                <View style={styles.placeholder} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                    {/* Name - Required */}
                    <Input
                        label={`${t('settings.personas.name')} *`}
                        value={name}
                        onChangeText={setName}
                        placeholder={t('settings.personas.namePlaceholder')}
                    />

                    {/* Description - Optional */}
                    <Input
                        label={t('settings.personas.description')}
                        value={description}
                        onChangeText={setDescription}
                        placeholder={t('settings.personas.descriptionPlaceholder')}
                    />

                    {/* System Prompt - Required */}
                    <View style={styles.promptSection}>
                        <View style={styles.promptHeader}>
                            <Text style={[styles.label, { color: colors.text }]}>
                                {t('settings.personas.systemPrompt')} *
                            </Text>
                            <Text style={[styles.charCount, { color: colors.textMuted }]}>
                                {systemPrompt.length} characters
                            </Text>
                        </View>
                        <Input
                            value={systemPrompt}
                            onChangeText={setSystemPrompt}
                            placeholder={t('settings.personas.systemPromptPlaceholder')}
                            multiline
                            numberOfLines={6}
                        />
                    </View>

                    {/* Optional Details Section */}
                    <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                        {t('settings.personas.optionalDetails')}
                    </Text>

                    <Input
                        label={t('settings.personas.age')}
                        value={age}
                        onChangeText={setAge}
                        placeholder={t('settings.personas.agePlaceholder')}
                    />

                    <Input
                        label={t('settings.personas.location')}
                        value={location}
                        onChangeText={setLocation}
                        placeholder={t('settings.personas.locationPlaceholder')}
                    />

                    <Input
                        label={t('settings.personas.job')}
                        value={job}
                        onChangeText={setJob}
                        placeholder={t('settings.personas.jobPlaceholder')}
                    />
                </ScrollView>

                {/* Sticky Bottom Action Bar */}
                <View style={[styles.bottomBar, { backgroundColor: colors.cardBackground, borderTopColor: colors.border }]}>
                    <Button
                        title={isSaving ? t('common.loading') : t('common.save')}
                        onPress={handleSave}
                        loading={isSaving}
                        disabled={!isValid || isSaving}
                        fullWidth
                    />
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
    promptSection: {
        marginBottom: Spacing.md,
    },
    promptHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    label: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
    charCount: {
        fontSize: FontSizes.xs,
    },
    sectionLabel: {
        fontSize: FontSizes.xs,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: Spacing.sm,
        marginBottom: Spacing.md,
    },
    bottomBar: {
        padding: Spacing.md,
        borderTopWidth: 1,
    },
});
