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
    onSave: (personaData: Omit<Persona, 'id' | 'createdAt' | 'updatedAt' | 'compiledSystemPrompt'>) => void;
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

    // Form state - Character Card V2 fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [personality, setPersonality] = useState('');
    const [scenario, setScenario] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [postHistoryInstructions, setPostHistoryInstructions] = useState('');
    const [creatorNotes, setCreatorNotes] = useState('');

    useEffect(() => {
        if (persona) {
            setName(persona.name);
            setDescription(persona.description || '');
            setPersonality(persona.personality || '');
            setScenario(persona.scenario || '');
            setSystemPrompt(persona.system_prompt || '');
            setPostHistoryInstructions(persona.post_history_instructions || '');
            setCreatorNotes(persona.creator_notes || '');
        } else {
            setName('');
            setDescription('');
            setPersonality('');
            setScenario('');
            setSystemPrompt('');
            setPostHistoryInstructions('');
            setCreatorNotes('');
        }
    }, [persona, visible]);

    const isValid = name.trim().length > 0;

    const handleSave = () => {
        if (!isValid) return;
        onSave({
            name: name.trim(),
            description: description.trim(),
            personality: personality.trim(),
            scenario: scenario.trim(),
            system_prompt: systemPrompt.trim(),
            post_history_instructions: postHistoryInstructions.trim(),
            creator_notes: creatorNotes.trim(),
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
                        {/* Identity Section */}
                        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                            {t('settings.personas.identity')}
                        </Text>

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

                        {/* Description */}
                        <View style={styles.field}>
                            <Text style={[styles.label, { color: colors.text }]}>
                                {t('settings.personas.description')}
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
                                value={description}
                                onChangeText={setDescription}
                                placeholder={t('settings.personas.descriptionPlaceholder')}
                                placeholderTextColor={colors.textMuted}
                                multiline
                                numberOfLines={2}
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Personality */}
                        <View style={styles.field}>
                            <Text style={[styles.label, { color: colors.text }]}>
                                {t('settings.personas.personality')}
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
                                value={personality}
                                onChangeText={setPersonality}
                                placeholder={t('settings.personas.personalityPlaceholder')}
                                placeholderTextColor={colors.textMuted}
                                multiline
                                numberOfLines={2}
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Scenario Section */}
                        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                            {t('settings.personas.scenarioSection')}
                        </Text>

                        <View style={styles.field}>
                            <Text style={[styles.label, { color: colors.text }]}>
                                {t('settings.personas.scenario')}
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
                                value={scenario}
                                onChangeText={setScenario}
                                placeholder={t('settings.personas.scenarioPlaceholder')}
                                placeholderTextColor={colors.textMuted}
                                multiline
                                numberOfLines={2}
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Prompts Section */}
                        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                            {t('settings.personas.promptsSection')}
                        </Text>

                        {/* System Prompt */}
                        <View style={styles.field}>
                            <Text style={[styles.label, { color: colors.text }]}>
                                {t('settings.personas.systemPrompt')}
                            </Text>
                            <TextInput
                                style={[
                                    styles.textArea,
                                    {
                                        backgroundColor: colors.backgroundSecondary,
                                        color: colors.text,
                                        borderColor: colors.border,
                                        minHeight: 100,
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

                        {/* Post History Instructions */}
                        <View style={styles.field}>
                            <Text style={[styles.label, { color: colors.text }]}>
                                {t('settings.personas.postHistoryInstructions')}
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
                                value={postHistoryInstructions}
                                onChangeText={setPostHistoryInstructions}
                                placeholder={t('settings.personas.postHistoryInstructionsPlaceholder')}
                                placeholderTextColor={colors.textMuted}
                                multiline
                                numberOfLines={2}
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Metadata Section */}
                        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                            {t('settings.personas.metadataSection')}
                        </Text>

                        {/* Creator Notes */}
                        <View style={styles.field}>
                            <Text style={[styles.label, { color: colors.text }]}>
                                {t('settings.personas.creatorNotes')}
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
                                value={creatorNotes}
                                onChangeText={setCreatorNotes}
                                placeholder={t('settings.personas.creatorNotesPlaceholder')}
                                placeholderTextColor={colors.textMuted}
                                multiline
                                numberOfLines={2}
                                textAlignVertical="top"
                            />
                            <Text style={[styles.hint, { color: colors.textMuted }]}>
                                {t('settings.personas.creatorNotesHint')}
                            </Text>
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
        maxHeight: height * 0.85,
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
        minHeight: 60,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        fontSize: FontSizes.md,
    },
    hint: {
        fontSize: FontSizes.xs,
        marginTop: Spacing.xs,
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
