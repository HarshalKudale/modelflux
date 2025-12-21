import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../config/theme';
import { Persona } from '../../../core/types';
import { useAppColorScheme, useLocale } from '../../hooks';

interface PersonaListItemProps {
    persona: Persona;
    onEdit: (persona: Persona) => void;
    onDelete: (persona: Persona) => void;
}

export function PersonaListItem({ persona, onEdit, onDelete }: PersonaListItemProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();

    const detailParts: string[] = [];
    if (persona.age) detailParts.push(persona.age);
    if (persona.location) detailParts.push(persona.location);
    if (persona.job) detailParts.push(persona.job);

    return (
        <View style={[styles.container, { borderBottomColor: colors.border }]}>
            <View style={styles.info}>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                    {persona.name}
                </Text>
                {detailParts.length > 0 && (
                    <Text style={[styles.details, { color: colors.textMuted }]} numberOfLines={1}>
                        {detailParts.join(' • ')}
                    </Text>
                )}
                <Text style={[styles.prompt, { color: colors.textSecondary }]} numberOfLines={2}>
                    {persona.systemPrompt}
                </Text>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => onEdit(persona)}
                >
                    <Ionicons name="pencil" size={16} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => onDelete(persona)}
                >
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    info: {
        flex: 1,
        marginRight: Spacing.md,
    },
    name: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        marginBottom: 2,
    },
    details: {
        fontSize: FontSizes.sm,
        marginBottom: 4,
    },
    prompt: {
        fontSize: FontSizes.sm,
    },
    actions: {
        flexDirection: 'row',
        gap: Spacing.xs,
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
