import { useSettingsStore } from '@/src/state';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Web-specific color scheme hook that respects app settings.
 * Falls back to system preference when theme is set to 'system'.
 */
export function useColorScheme(): 'light' | 'dark' {
  const systemColorScheme = useRNColorScheme();
  const theme = useSettingsStore((s) => s.settings.theme);

  if (theme === 'system') {
    return systemColorScheme ?? 'dark';
  }

  return theme;
}
