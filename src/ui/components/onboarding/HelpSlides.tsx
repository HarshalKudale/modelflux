import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    ImageSourcePropType,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewToken,
} from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../config/theme';
import { useAppColorScheme, useLocale } from '../../hooks';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface HelpSlideData {
    titleKey: string;
    textKey: string;
    image: ImageSourcePropType;
}

interface HelpSlidesProps {
    slides: HelpSlideData[];
    onComplete: () => void;
    onBack?: () => void;
    completeButtonKey?: string;
}

export function HelpSlides({
    slides,
    onComplete,
    onBack,
    completeButtonKey = 'common.ok',
}: HelpSlidesProps) {
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { t } = useLocale();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (viewableItems.length > 0 && viewableItems[0].index !== null) {
                setCurrentIndex(viewableItems[0].index);
            }
        }
    ).current;

    const viewabilityConfig = useRef({
        viewAreaCoveragePercentThreshold: 50,
    }).current;

    const goToNext = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        } else {
            onComplete();
        }
    };

    const goToPrevious = () => {
        if (currentIndex > 0) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex - 1,
                animated: true,
            });
        } else if (onBack) {
            onBack();
        }
    };

    const isLastSlide = currentIndex === slides.length - 1;
    const isFirstSlide = currentIndex === 0;

    const renderSlide = ({ item }: { item: HelpSlideData }) => (
        <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
            {/* Image with padding */}
            <View style={[styles.imageContainer, { backgroundColor: colors.backgroundSecondary }]}>
                <Image
                    source={item.image}
                    style={styles.image}
                    resizeMode="contain"
                />
            </View>

            {/* Title and Text below image */}
            <View style={styles.textContainer}>
                <Text style={[styles.slideTitle, { color: colors.text }]}>
                    {t(item.titleKey)}
                </Text>
                <Text style={[styles.slideText, { color: colors.textSecondary }]}>
                    {t(item.textKey)}
                </Text>
            </View>
        </View>
    );

    const renderDots = () => (
        <View style={styles.dotsContainer}>
            {slides.map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.dot,
                        {
                            backgroundColor:
                                index === currentIndex ? colors.tint : colors.border,
                        },
                    ]}
                />
            ))}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderSlide}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                keyExtractor={(_, index) => index.toString()}
                getItemLayout={(_, index) => ({
                    length: SCREEN_WIDTH,
                    offset: SCREEN_WIDTH * index,
                    index,
                })}
            />

            {renderDots()}

            <View style={styles.navigation}>
                <TouchableOpacity
                    style={[
                        styles.navButton,
                        styles.backButton,
                        { borderColor: colors.border },
                        isFirstSlide && !onBack && styles.navButtonDisabled,
                    ]}
                    onPress={goToPrevious}
                    disabled={isFirstSlide && !onBack}
                >
                    <Ionicons
                        name="chevron-back"
                        size={20}
                        color={isFirstSlide && !onBack ? colors.textMuted : colors.text}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.navButton,
                        styles.nextButton,
                        { backgroundColor: colors.tint },
                    ]}
                    onPress={goToNext}
                >
                    <Text style={styles.nextButtonText}>
                        {isLastSlide ? t(completeButtonKey) : t('onboarding.next')}
                    </Text>
                    {!isLastSlide && (
                        <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.45;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    slide: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
    },
    imageContainer: {
        height: IMAGE_HEIGHT,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        marginBottom: Spacing.lg,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        flex: 1,
        paddingHorizontal: Spacing.sm,
    },
    slideTitle: {
        fontSize: FontSizes.xl,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    slideText: {
        fontSize: FontSizes.md,
        textAlign: 'center',
        lineHeight: 24,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        gap: Spacing.sm,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    navigation: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xl,
        gap: Spacing.md,
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.lg,
    },
    navButtonDisabled: {
        opacity: 0.5,
    },
    backButton: {
        borderWidth: 1,
        minWidth: 48,
    },
    nextButton: {
        flex: 1,
        gap: Spacing.xs,
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: FontSizes.md,
        fontWeight: '600',
    },
});
