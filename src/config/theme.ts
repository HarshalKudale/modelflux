// Theme configuration for LLM Hub

export const Colors = {
    light: {
        text: '#11181C',
        textSecondary: '#687076',
        textMuted: '#9BA1A6',
        background: '#FFFFFF',
        backgroundSecondary: '#F4F4F5',
        backgroundTertiary: '#E4E4E7',
        tint: '#6366F1',
        tintSecondary: '#818CF8',
        border: '#E4E4E7',
        borderLight: '#F4F4F5',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        userBubble: '#6366F1',
        userBubbleText: '#FFFFFF',
        assistantBubble: '#F4F4F5',
        assistantBubbleText: '#11181C',
        systemBubble: '#FEF3C7',
        systemBubbleText: '#92400E',
        sidebar: '#FAFAFA',
        sidebarActive: '#EEF2FF',
        cardBackground: '#FFFFFF',
        overlay: 'rgba(0, 0, 0, 0.5)',
    },
    dark: {
        text: '#ECEDEE',
        textSecondary: '#9BA1A6',
        textMuted: '#687076',
        background: '#0A0A0B',
        backgroundSecondary: '#18181B',
        backgroundTertiary: '#27272A',
        tint: '#818CF8',
        tintSecondary: '#6366F1',
        border: '#27272A',
        borderLight: '#3F3F46',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        userBubble: '#6366F1',
        userBubbleText: '#FFFFFF',
        assistantBubble: '#27272A',
        assistantBubbleText: '#ECEDEE',
        systemBubble: '#422006',
        systemBubbleText: '#FDE68A',
        sidebar: '#111113',
        sidebarActive: '#1E1E3F',
        cardBackground: '#18181B',
        overlay: 'rgba(0, 0, 0, 0.7)',
    },
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const FontSizes = {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    title: 28,
    hero: 34,
};

export const BorderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
};

export const Shadows = {
    light: {
        sm: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
        },
        md: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
        },
        lg: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 4,
        },
    },
    dark: {
        sm: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.3,
            shadowRadius: 2,
            elevation: 1,
        },
        md: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.4,
            shadowRadius: 4,
            elevation: 2,
        },
        lg: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.5,
            shadowRadius: 8,
            elevation: 4,
        },
    },
};

export type ThemeColors = typeof Colors.light;
export type ThemeType = 'light' | 'dark';
