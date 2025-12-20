// Hook for using locale service with React re-renders on language change

import { useCallback, useEffect, useState } from 'react';
import { localeService } from '../../services/LocaleService';

/**
 * Hook that provides translation function and re-renders on language change
 */
export function useLocale() {
    // State to force re-render when language changes
    const [, setLanguageVersion] = useState(0);

    useEffect(() => {
        // Subscribe to language changes
        const unsubscribe = localeService.subscribe(() => {
            setLanguageVersion((v) => v + 1);
        });
        return unsubscribe;
    }, []);

    // Translation function
    const t = useCallback((key: string, params?: Record<string, string | number>): string => {
        return localeService.get(key, params);
    }, []);

    return {
        t,
        currentLanguage: localeService.getCurrentLanguage(),
        supportedLanguages: localeService.getSupportedLanguages(),
    };
}
