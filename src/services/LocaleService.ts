// Locale Service - Handles internationalization (i18n) for the app

import { LANGUAGE_BUNDLES, LanguageInfo, SUPPORTED_LANGUAGES } from '../locales';

const DEFAULT_LANGUAGE = 'en';

class LocaleService {
    private currentLanguage: string = DEFAULT_LANGUAGE;
    private listeners: Set<() => void> = new Set();

    /**
     * Get a translated string for the given key
     * Falls back to English if key not found in current language
     * Falls back to the key itself if not found in English (for debugging)
     */
    get(key: string, params?: Record<string, string | number>): string {
        const bundle = LANGUAGE_BUNDLES[this.currentLanguage];
        let value = bundle?.[key];

        // Fallback to English if not found
        if (!value && this.currentLanguage !== DEFAULT_LANGUAGE) {
            value = LANGUAGE_BUNDLES[DEFAULT_LANGUAGE]?.[key];
        }

        // Fallback to key itself if not found in English
        if (!value) {
            console.warn(`[Locale] Missing translation for key: "${key}"`);
            return key;
        }

        // Replace parameters if provided (e.g., {count}, {name})
        if (params) {
            Object.entries(params).forEach(([paramKey, paramValue]) => {
                value = value!.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
            });
        }

        return value;
    }

    /**
     * Set the current language
     */
    setLanguage(languageCode: string): void {
        // Validate language code
        if (!LANGUAGE_BUNDLES[languageCode]) {
            console.warn(`[Locale] Language "${languageCode}" not found, falling back to English`);
            languageCode = DEFAULT_LANGUAGE;
        }

        if (this.currentLanguage !== languageCode) {
            this.currentLanguage = languageCode;
            this.notifyListeners();
        }
    }

    /**
     * Get the current language code
     */
    getCurrentLanguage(): string {
        return this.currentLanguage;
    }

    /**
     * Get list of supported languages
     */
    getSupportedLanguages(): LanguageInfo[] {
        return SUPPORTED_LANGUAGES;
    }

    /**
     * Subscribe to language changes
     */
    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Notify all listeners of language change
     */
    private notifyListeners(): void {
        this.listeners.forEach((listener) => listener());
    }
}

// Export singleton instance
export const localeService = new LocaleService();

// Convenience shorthand for getting translations
export const t = (key: string, params?: Record<string, string | number>): string => {
    return localeService.get(key, params);
};
