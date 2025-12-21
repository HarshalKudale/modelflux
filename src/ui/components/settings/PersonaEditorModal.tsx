import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../config/theme';
import { Persona } from '../../../core/types';
import { useAppColorScheme, useLocale } from '../../hooks';

interface PersonaEditorModalProps {
    visible: boolean;
    persona?: Persona | null;
    onSave: (personaData: Omit<Persona, 'id' | 'createdAt' | 'updatedAt'>) => void;
    onClose: () => void;
}

export function PersonaEditorModal({
    visible,
    persona,
    onSave,
    onClose,
}: PersonaEditorModalProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();

    const [name, setName] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [age, setAge] = useState('');
    const [location, setLocation] = useState('');
    const [job, setJob] = useState('');

    useEffect(() => {
        if (persona) {
            setName(persona.name);
            setSystemPrompt(persona.systemPrompt);
            setAge(persona.age || '');
            setLocation(persona.location || '');
            setJob(persona.job || '');
        } else {
            setName('');
            setSystemPrompt('');
            setAge('');
            setLocation('');
            setJob('');
        }
    }, [persona, visible]);

    const isValid = name.trim() && systemPrompt.trim();

    const handleSave = () => {
        if (!isValid) return;
        onSave({
            name: name.trim(),
            systemPrompt: systemPrompt.trim(),
            age: age.trim() || undefined,
            location: location.trim() || undefined,
            job: job.trim() || undefined,
        });
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View
                    style={[
                        styles.modalContent,
                        { backgroundColor: colors.cardBackground },
                    ]}
                    onStartShouldSetResponder={() => true}
                >
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {persona ? t('settings.personas.edit') : t('settings.personas.create')}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
                        {/* Name - Required */}
                        <View style={styles.field}>
                            <Text style={[styles.label, { color: colors.text }]}>
                                {t('settings.personas.name')} *
                            </Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: colors.backgroundSecondary,
                                        color: colors.text,
                                        borderColor: colors.border,
                                    },
                                ]}
                                value={name}
                                onChangeText={setName}
                                placeholder={t('settings.personas.namePlaceholder')}
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        {/* System Prompt - Required */}
                        <View style={styles.field}>
                            <Text style={[styles.label, { color: colors.text }]}>
                                {t('settings.personas.systemPrompt')} *
                            </Text>
                            <TextInput
                                style={[
                                    styles.textArea,
                                    {
                                        backgroundColor: colors.backgroundSecondary,
                                        color: colors.text,
                                        borderColor: colors.border,
                                    },
                                ]}
                                value={systemPrompt}
                                onChangeText={setSystemPrompt}
                                placeholder={t('settings.personas.systemPromptPlaceholder')}
                                placeholderTextColor={colors.textMuted}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Optional Fields */}
                        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                            {t('settings.personas.optionalDetails')}
                        </Text>

                        <View style={styles.field}>
                            <Text style={[styles.label, { color: colors.text }]}>
                                {t('settings.personas.age')}
                            </Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: colors.backgroundSecondary,
                                        color: colors.text,
                                        borderColor: colors.border,
                                    },
                                ]}
                                value={age}
                                onChangeText={setAge}
                                placeholder={t('settings.personas.agePlaceholder')}
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        <View style={styles.field}>
                            <Text style={[styles.label, { color: colors.text }]}>
                                {t('settings.personas.location')}
                            </Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: colors.backgroundSecondary,
                                        color: colors.text,
                                        borderColor: colors.border,
                                    },
                                ]}
                                value={location}
                                onChangeText={setLocation}
                                placeholder={t('settings.personas.locationPlaceholder')}
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        <View style={styles.field}>
                            <Text style={[styles.label, { color: colors.text }]}>
                                {t('settings.personas.job')}
                            </Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: colors.backgroundSecondary,
                                        color: colors.text,
                                        borderColor: colors.border,
                                    },
                                ]}
                                value={job}
                                onChangeText={setJob}
                                placeholder={t('settings.personas.jobPlaceholder')}
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                    </ScrollView>

                    <View style={[styles.footer, { borderTopColor: colors.border }]}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
                            onPress={onClose}
                        >
                            <Text style={[styles.buttonText, { color: colors.text }]}>
                                {t('common.cancel')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.saveButton,
                                { backgroundColor: isValid ? colors.tint : colors.textMuted },
                            ]}
                            onPress={handleSave}
                            disabled={!isValid}
                        >
                            <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                                {t('common.save')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: Math.min(width - 32, 500),
        maxHeight: height * 0.8,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
    },
    closeButton: {
        padding: Spacing.xs,
    },
    form: {
        flex: 1,
    },
    formContent: {
        padding: Spacing.md,
    },
    field: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: FontSizes.sm,
        fontWeight: '500',
        marginBottom: Spacing.xs,
    },
    sectionLabel: {
        fontSize: FontSizes.xs,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: Spacing.sm,
        marginBottom: Spacing.md,
    },
    input: {
        height: 44,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        paddingHorizontal: Spacing.md,
        fontSize: FontSizes.md,
    },
    textArea: {
        minHeight: 100,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        fontSize: FontSizes.md,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        gap: Spacing.sm,
        borderTopWidth: 1,
    },
    button: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        minWidth: 80,
        alignItems: 'center',
    },
    cancelButton: {
        borderWidth: 1,
    },
    saveButton: {},
    buttonText: {
        fontSize: FontSizes.md,
        fontWeight: '600',
    },
});
