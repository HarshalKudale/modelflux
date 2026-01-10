import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HELP_FEATURES, HelpFeature } from '../../config/helpData';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../config/theme';
import { HelpSlides } from '../components/onboarding';
import { useAppColorScheme, useLocale } from '../hooks';

interface HelpScreenProps {
    onBack: () => void;
}

export function HelpScreen({ onBack }: HelpScreenProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();
    const [selectedFeature, setSelectedFeature] = useState<HelpFeature | null>(null);

    if (selectedFeature) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => setSelectedFeature(null)} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.text }]}>
                        {t(selectedFeature.titleKey)}
                    </Text>
                    <View style={styles.placeholder} />
                </View>

                <HelpSlides
                    slides={selectedFeature.slides}
                    onComplete={() => setSelectedFeature(null)}
                    onBack={() => setSelectedFeature(null)}
                    completeButtonKey="common.ok"
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>
                    {t('help.title')}
                </Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                    {t('help.selectFeature')}
                </Text>

                <View style={styles.featureList}>
                    {HELP_FEATURES.map((feature) => (
                        <TouchableOpacity
                            key={feature.id}
                            style={[
                                styles.featureCard,
                                { backgroundColor: colors.cardBackground, borderColor: colors.border },
                            ]}
                            onPress={() => setSelectedFeature(feature)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.featureIcon, { backgroundColor: colors.tint + '20' }]}>
                                <Ionicons
                                    name={feature.icon as keyof typeof Ionicons.glyphMap}
                                    size={24}
                                    color={colors.tint}
                                />
                            </View>
                            <View style={styles.featureInfo}>
                                <Text style={[styles.featureTitle, { color: colors.text }]}>
                                    {t(feature.titleKey)}
                                </Text>
                                <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
                                    {t(feature.descKey)}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    ))}
                </View>
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
    subtitle: {
        fontSize: FontSizes.sm,
        marginBottom: Spacing.md,
    },
    featureList: {
        gap: Spacing.md,
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        gap: Spacing.md,
    },
    featureIcon: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureInfo: {
        flex: 1,
    },
    featureTitle: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        marginBottom: 2,
    },
    featureDesc: {
        fontSize: FontSizes.sm,
    },
});
