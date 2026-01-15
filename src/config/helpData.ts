/**
 * Help Feature Data
 *
 * Defines the features and slides for the Help & Tutorials section.
 * This is stateless - no tracking of completion.
 */

import { ImageSourcePropType } from 'react-native';

// Import placeholder images - you will replace these with actual screenshots
const PLACEHOLDER_IMAGE = require('../../assets/help/placeholder.png');

export interface HelpSlide {
    titleKey: string;
    textKey: string;
    image: ImageSourcePropType;
}

export interface HelpFeature {
    id: string;
    titleKey: string;
    descKey: string;
    icon: string;
    slides: HelpSlide[];
}

export const HELP_FEATURES: HelpFeature[] = [
    {
        id: 'providers',
        titleKey: 'help.feature.providers',
        descKey: 'help.feature.providers.desc',
        icon: 'server-outline',
        slides: [
            {
                titleKey: 'help.providers.slide1.title',
                textKey: 'help.providers.slide1.text',
                image: PLACEHOLDER_IMAGE,
            },
            {
                titleKey: 'help.providers.slide2.title',
                textKey: 'help.providers.slide2.text',
                image: PLACEHOLDER_IMAGE,
            },
            {
                titleKey: 'help.providers.slide3.title',
                textKey: 'help.providers.slide3.text',
                image: PLACEHOLDER_IMAGE,
            },
            {
                titleKey: 'help.providers.slide4.title',
                textKey: 'help.providers.slide4.text',
                image: PLACEHOLDER_IMAGE,
            },
        ],
    },
    {
        id: 'rag',
        titleKey: 'help.feature.rag',
        descKey: 'help.feature.rag.desc',
        icon: 'document-text-outline',
        slides: [
            {
                titleKey: 'help.rag.slide1.title',
                textKey: 'help.rag.slide1.text',
                image: PLACEHOLDER_IMAGE,
            },
            {
                titleKey: 'help.rag.slide2.title',
                textKey: 'help.rag.slide2.text',
                image: PLACEHOLDER_IMAGE,
            },
            {
                titleKey: 'help.rag.slide3.title',
                textKey: 'help.rag.slide3.text',
                image: PLACEHOLDER_IMAGE,
            },
            {
                titleKey: 'help.rag.slide4.title',
                textKey: 'help.rag.slide4.text',
                image: PLACEHOLDER_IMAGE,
            },
        ],
    },
    {
        id: 'models',
        titleKey: 'help.feature.models',
        descKey: 'help.feature.models.desc',
        icon: 'cloud-download-outline',
        slides: [
            {
                titleKey: 'help.models.slide1.title',
                textKey: 'help.models.slide1.text',
                image: PLACEHOLDER_IMAGE,
            },
            {
                titleKey: 'help.models.slide2.title',
                textKey: 'help.models.slide2.text',
                image: PLACEHOLDER_IMAGE,
            },
            {
                titleKey: 'help.models.slide3.title',
                textKey: 'help.models.slide3.text',
                image: PLACEHOLDER_IMAGE,
            },
            {
                titleKey: 'help.models.slide4.title',
                textKey: 'help.models.slide4.text',
                image: PLACEHOLDER_IMAGE,
            },
        ],
    },
    {
        id: 'conversation',
        titleKey: 'help.feature.conversation',
        descKey: 'help.feature.conversation.desc',
        icon: 'chatbubbles-outline',
        slides: [
            {
                titleKey: 'help.conversation.slide1.title',
                textKey: 'help.conversation.slide1.text',
                image: PLACEHOLDER_IMAGE,
            },
            {
                titleKey: 'help.conversation.slide2.title',
                textKey: 'help.conversation.slide2.text',
                image: PLACEHOLDER_IMAGE,
            },
            {
                titleKey: 'help.conversation.slide3.title',
                textKey: 'help.conversation.slide3.text',
                image: PLACEHOLDER_IMAGE,
            },
            {
                titleKey: 'help.conversation.slide4.title',
                textKey: 'help.conversation.slide4.text',
                image: PLACEHOLDER_IMAGE,
            },
        ],
    },
    {
        id: 'switchModels',
        titleKey: 'help.feature.switchModels',
        descKey: 'help.feature.switchModels.desc',
        icon: 'swap-horizontal-outline',
        slides: [
            {
                titleKey: 'help.switchModels.slide1.title',
                textKey: 'help.switchModels.slide1.text',
                image: PLACEHOLDER_IMAGE,
            },
            {
                titleKey: 'help.switchModels.slide2.title',
                textKey: 'help.switchModels.slide2.text',
                image: PLACEHOLDER_IMAGE,
            },
            {
                titleKey: 'help.switchModels.slide3.title',
                textKey: 'help.switchModels.slide3.text',
                image: PLACEHOLDER_IMAGE,
            },
            {
                titleKey: 'help.switchModels.slide4.title',
                textKey: 'help.switchModels.slide4.text',
                image: PLACEHOLDER_IMAGE,
            },
        ],
    },
    {
        id: 'persona',
        titleKey: 'help.feature.persona',
        descKey: 'help.feature.persona.desc',
        icon: 'person-circle-outline',
        slides: [
            {
                titleKey: 'help.persona.slide1.title',
                textKey: 'help.persona.slide1.text',
                image: PLACEHOLDER_IMAGE,
            },
            {
                titleKey: 'help.persona.slide2.title',
                textKey: 'help.persona.slide2.text',
                image: PLACEHOLDER_IMAGE,
            },
            {
                titleKey: 'help.persona.slide3.title',
                textKey: 'help.persona.slide3.text',
                image: PLACEHOLDER_IMAGE,
            },
            {
                titleKey: 'help.persona.slide4.title',
                textKey: 'help.persona.slide4.text',
                image: PLACEHOLDER_IMAGE,
            },
        ],
    },
];

/**
 * Welcome onboarding slides (first launch only)
 * These don't have images - they use the simple FeatureSlides component
 */
export interface WelcomeSlide {
    titleKey: string;
    textKey: string;
}

export const WELCOME_SLIDES: WelcomeSlide[] = [
    { titleKey: 'onboarding.slide1.title', textKey: 'onboarding.slide1.text' },
    { titleKey: 'onboarding.slide2.title', textKey: 'onboarding.slide2.text' },
    { titleKey: 'onboarding.slide3.title', textKey: 'onboarding.slide3.text' },
    { titleKey: 'onboarding.slide4.title', textKey: 'onboarding.slide4.text' },
];

/**
 * External links for onboarding
 */
export const ONBOARDING_LINKS = {
    github: 'https://github.com/HarshalKudale/lmhub',
    website: 'https://modelflux.harshalkudale.com',
};
