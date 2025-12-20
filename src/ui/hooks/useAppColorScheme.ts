import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../../state';

/**
 * Custom hook that returns the effective color scheme based on app settings.
 * - If theme is 'system', uses the device's color scheme
 * - If theme is 'light' or 'dark', uses that explicit value
 * - Falls back to 'dark' if neither is available
 */
export function useAppColorScheme(): 'light' | 'dark' {
    const systemColorScheme = useColorScheme();
    const theme = useSettingsStore((s) => s.settings.theme);

    if (theme === 'system') {
        return systemColorScheme ?? 'dark';
    }

    return theme;
}
