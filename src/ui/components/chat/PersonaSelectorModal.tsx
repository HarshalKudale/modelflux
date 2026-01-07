import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../config/theme';
import { usePersonaStore } from '../../../state';
import { useAppColorScheme, useLocale } from '../../hooks';

interface PersonaSelectorModalProps {
    visible: boolean;
    selectedPersonaId?: string | null;
    onSelect: (personaId: string | undefined) => void;
    onClose: () => void;
}

export function PersonaSelectorModal({
    visible,
    selectedPersonaId,
    onSelect,
    onClose,
}: PersonaSelectorModalProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();
    const { personas, loadPersonas } = usePersonaStore();
    const { width, height } = useWindowDimensions();

    // Load personas when modal becomes visible
    useEffect(() => {
        if (visible) {
            loadPersonas();
        }
    }, [visible]);

    // Calculate modal dimensions dynamically
    const modalWidth = Math.min(width - 32, 400);
    const modalMaxHeight = height * 0.6;
    const modalMinHeight = 200;

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
                        {
                            backgroundColor: colors.cardBackground,
                            width: modalWidth,
                            maxHeight: modalMaxHeight,
                            minHeight: modalMinHeight,
                        },
                    ]}
                    onStartShouldSetResponder={() => true}
                >
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {t('chat.persona.select')}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.list}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={true}
                        nestedScrollEnabled={true}
                    >
                        {/* No Persona Option */}
                        <TouchableOpacity
                            style={[
                                styles.personaItem,
                                { borderBottomColor: colors.border },
                                !selectedPersonaId && { backgroundColor: colors.tint + '20' },
                            ]}
                            onPress={() => {
                                onSelect(undefined);
                                onClose();
                            }}
                        >
                            <View style={styles.personaInfo}>
                                <Text style={[styles.personaName, { color: colors.text }]}>
                                    {t('chat.persona.none')}
                                </Text>
                                <Text style={[styles.personaDesc, { color: colors.textMuted }]}>
                                    {t('chat.persona.noneDesc')}
                                </Text>
                            </View>
                            {!selectedPersonaId && (
                                <Ionicons name="checkmark-circle" size={20} color={colors.tint} />
                            )}
                        </TouchableOpacity>

                        {/* Persona List */}
                        {personas.map((persona) => (
                            <TouchableOpacity
                                key={persona.id}
                                style={[
                                    styles.personaItem,
                                    { borderBottomColor: colors.border },
                                    selectedPersonaId === persona.id && { backgroundColor: colors.tint + '20' },
                                ]}
                                onPress={() => {
                                    onSelect(persona.id);
                                    onClose();
                                }}
                            >
                                <View style={styles.personaInfo}>
                                    <Text style={[styles.personaName, { color: colors.text }]}>
                                        {persona.name}
                                    </Text>
                                    <Text style={[styles.personaDesc, { color: colors.textMuted }]} numberOfLines={2}>
                                        {persona.system_prompt}
                                    </Text>
                                </View>
                                {selectedPersonaId === persona.id && (
                                    <Ionicons name="checkmark-circle" size={20} color={colors.tint} />
                                )}
                            </TouchableOpacity>
                        ))}

                        {personas.length === 0 && (
                            <View style={styles.emptyState}>
                                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                    {t('chat.persona.empty')}
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
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
    list: {
        flexGrow: 1,
        flexShrink: 1,
    },
    listContent: {
        paddingVertical: Spacing.xs,
        flexGrow: 1,
    },
    personaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    personaInfo: {
        flex: 1,
        marginRight: Spacing.md,
    },
    personaName: {
        fontSize: FontSizes.md,
        fontWeight: '500',
        marginBottom: 2,
    },
    personaDesc: {
        fontSize: FontSizes.sm,
    },
    emptyState: {
        padding: Spacing.lg,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: FontSizes.sm,
        textAlign: 'center',
    },
});
