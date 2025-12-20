// Locale bundles aggregator

import { de } from './de';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { ja } from './ja';
import { zh } from './zh';

export interface LanguageInfo {
    code: string;
    name: string;
    nativeName: string;
}

// All available language bundles
export const LANGUAGE_BUNDLES: Record<string, Record<string, string>> = {
    en,
    es,
    fr,
    de,
    zh,
    ja,
};

// Supported languages with metadata
export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
];

export { de, en, es, fr, ja, zh };

