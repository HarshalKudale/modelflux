/**
 * LocalModelImportModal - Web Stub
 * Local model import is not supported on web platform.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { ModelType } from '../../../config/modelTypePresets';
import { BorderRadius, Colors, FontSizes, Shadows, Spacing } from '../../../config/theme';
import { DownloadedModelProvider } from '../../../core/types';
import { useAppColorScheme } from '../../hooks';

interface LocalModelImportModalProps {
    visible: boolean;
    onClose: () => void;
    onImport: (
        name: string,
        description: string,
        provider: DownloadedModelProvider,
        type: ModelType,
        modelPath: string,
        tokenizerPath?: string,
        tokenizerConfigPath?: string
    ) => Promise<void>;
}

export function LocalModelImportModal({
    visible,
    onClose,
}: LocalModelImportModalProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const shadows = Shadows[colorScheme];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable
                style={[styles.overlay, { backgroundColor: colors.overlay }]}
                onPress={onClose}
            >
                <View
                    style={[styles.modal, { backgroundColor: colors.cardBackground }, shadows.lg]}
                    onStartShouldSetResponder={() => true}
                >
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.title, { color: colors.text }]}>
                            Import Local Model
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="phone-portrait-outline" size={48} color={colors.textMuted} />
                        </View>
                        <Text style={[styles.message, { color: colors.text }]}>
                            Local model import is not available on web.
                        </Text>
                        <Text style={[styles.submessage, { color: colors.textMuted }]}>
                            Please use the mobile app to import local models. Web version only supports remote LLM providers.
                        </Text>
                    </View>

                    {/* Footer */}
                    <View style={[styles.footer, { borderTopColor: colors.border }]}>
                        <TouchableOpacity
                            style={[styles.closeButton, { backgroundColor: colors.tint }]}
                            onPress={onClose}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    modal: {
        width: '100%',
        maxWidth: 400,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
    },
    content: {
        padding: Spacing.xl,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: Spacing.md,
    },
    message: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    submessage: {
        fontSize: FontSizes.sm,
        textAlign: 'center',
        lineHeight: 20,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderTopWidth: 1,
    },
    closeButton: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        minWidth: 100,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#FFFFFF',
        fontSize: FontSizes.md,
        fontWeight: '600',
    },
});
