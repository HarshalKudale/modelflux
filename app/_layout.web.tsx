/**
 * Root Layout - Web Implementation
 * No GestureHandlerRootView wrapper - not needed on web and can interfere with events
 */
import '@/src/polyfills';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { useConversationStore, useLLMStore, useRagConfigStore, useSettingsStore } from '@/src/state';

export {
    ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
    initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded, error] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
        ...FontAwesome.font,
        ...Ionicons.font,
    });

    const [appReady, setAppReady] = useState(false);

    const loadSettings = useSettingsStore((s) => s.loadSettings);
    const loadConfigs = useLLMStore((s) => s.loadConfigs);
    const loadConversations = useConversationStore((s) => s.loadConversations);
    const loadRagConfigs = useRagConfigStore((s) => s.loadConfigs);

    useEffect(() => {
        if (error) throw error;
    }, [error]);

    useEffect(() => {
        const initializeApp = async () => {
            await Promise.all([
                loadSettings(),
                loadConfigs(),
                loadConversations(),
                loadRagConfigs(),
            ]);
            setAppReady(true);
        };

        initializeApp();
    }, []);

    useEffect(() => {
        if (loaded && appReady) {
            SplashScreen.hideAsync();
        }
    }, [loaded, appReady]);

    // Wait for both fonts and app data to be ready
    if (!loaded || !appReady) {
        return null;
    }

    return <RootLayoutNav />;
}

function RootLayoutNav() {
    const colorScheme = useColorScheme();

    return (
        <View style={{ flex: 1 }}>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen
                        name="settings"
                        options={{
                            headerShown: false,
                            presentation: 'modal',
                        }}
                    />
                    <Stack.Screen
                        name="llm-management"
                        options={{
                            headerShown: false,
                            presentation: 'modal',
                        }}
                    />
                    <Stack.Screen
                        name="llm-editor"
                        options={{
                            headerShown: false,
                            presentation: 'modal',
                        }}
                    />
                    <Stack.Screen
                        name="persona-list"
                        options={{
                            headerShown: false,
                            presentation: 'modal',
                        }}
                    />
                    <Stack.Screen
                        name="persona-editor"
                        options={{
                            headerShown: false,
                            presentation: 'modal',
                        }}
                    />
                    <Stack.Screen
                        name="language-select"
                        options={{
                            headerShown: false,
                            presentation: 'modal',
                        }}
                    />
                    <Stack.Screen
                        name="model-list"
                        options={{
                            headerShown: false,
                            presentation: 'modal',
                        }}
                    />
                    <Stack.Screen
                        name="rag-settings"
                        options={{
                            headerShown: false,
                            presentation: 'modal',
                        }}
                    />
                    <Stack.Screen
                        name="rag-provider-list"
                        options={{
                            headerShown: false,
                            presentation: 'modal',
                        }}
                    />
                    <Stack.Screen
                        name="rag-provider-editor"
                        options={{
                            headerShown: false,
                            presentation: 'modal',
                        }}
                    />
                    <Stack.Screen
                        name="logs"
                        options={{
                            headerShown: false,
                            presentation: 'modal',
                        }}
                    />
                </Stack>
            </ThemeProvider>
        </View>
    );
}
