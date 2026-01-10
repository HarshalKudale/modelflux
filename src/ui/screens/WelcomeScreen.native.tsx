import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ONBOARDING_LINKS, WELCOME_SLIDES } from '../../config/helpData';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../config/theme';
import { useSettingsStore } from '../../state';
import { FeatureSlides } from '../components/onboarding';
import { useAppColorScheme, useLocale } from '../hooks';

interface WelcomeScreenProps {
    onComplete: () => void;
}

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();
    const { completeOnboarding } = useSettingsStore();
    const [showSlides, setShowSlides] = useState(false);

    const handleComplete = async () => {
        await completeOnboarding();
        onComplete();
    };

    const handleOpenLink = (url: string) => {
        Linking.openURL(url);
    };

    if (showSlides) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
                <FeatureSlides
                    slides={WELCOME_SLIDES}
                    onComplete={handleComplete}
                    showBackButton={true}
                    onBack={() => setShowSlides(false)}
                    completeButtonKey="onboarding.getStarted"
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.tint }]}>
                        <Ionicons name="cube-outline" size={48} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>
                        {t('onboarding.welcome')}
                    </Text>
                </View>

                {/* Feature highlights */}
                <View style={styles.features}>
                    <FeatureHighlight
                        icon="chatbubbles-outline"
                        title={t('onboarding.slide1.title')}
                        colors={colors}
                    />
                    <FeatureHighlight
                        icon="shield-checkmark-outline"
                        title={t('onboarding.slide2.title')}
                        colors={colors}
                    />
                    <FeatureHighlight
                        icon="document-text-outline"
                        title={t('onboarding.slide3.title')}
                        colors={colors}
                    />
                </View>

                {/* Links */}
                <View style={styles.links}>
                    <TouchableOpacity
                        style={[styles.linkButton, { borderColor: colors.border }]}
                        onPress={() => handleOpenLink(ONBOARDING_LINKS.github)}
                    >
                        <Ionicons name="logo-github" size={20} color={colors.text} />
                        <Text style={[styles.linkText, { color: colors.text }]}>
                            {t('onboarding.github')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.linkButton, { borderColor: colors.border }]}
                        onPress={() => handleOpenLink(ONBOARDING_LINKS.website)}
                    >
                        <Ionicons name="globe-outline" size={20} color={colors.text} />
                        <Text style={[styles.linkText, { color: colors.text }]}>
                            {t('onboarding.website')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Help note */}
                <Text style={[styles.helpNote, { color: colors.textMuted }]}>
                    {t('onboarding.slide4.text')}
                </Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.learnMoreButton, { borderColor: colors.border }]}
                    onPress={() => setShowSlides(true)}
                >
                    <Text style={[styles.learnMoreText, { color: colors.text }]}>
                        Learn More
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.getStartedButton, { backgroundColor: colors.tint }]}
                    onPress={handleComplete}
                >
                    <Text style={styles.getStartedText}>
                        {t('onboarding.getStarted')}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

interface FeatureHighlightProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    colors: typeof Colors.light;
}

function FeatureHighlight({ icon, title, colors }: FeatureHighlightProps) {
    return (
        <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: colors.tint + '20' }]}>
                <Ionicons name={icon} size={24} color={colors.tint} />
            </View>
            <Text style={[styles.featureTitle, { color: colors.text }]}>
                {title}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.xl,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center',
    },
    features: {
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    featureIcon: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '500',
        flex: 1,
    },
    links: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    linkButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        borderWidth: 1,
        borderRadius: BorderRadius.lg,
    },
    linkText: {
        fontSize: FontSizes.sm,
        fontWeight: '500',
    },
    helpNote: {
        fontSize: FontSizes.sm,
        textAlign: 'center',
        lineHeight: 20,
    },
    actions: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xl,
        gap: Spacing.md,
    },
    learnMoreButton: {
        paddingVertical: Spacing.md,
        borderWidth: 1,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    learnMoreText: {
        fontSize: FontSizes.md,
        fontWeight: '600',
    },
    getStartedButton: {
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    getStartedText: {
        color: '#FFFFFF',
        fontSize: FontSizes.md,
        fontWeight: '600',
    },
});
