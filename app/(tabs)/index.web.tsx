/**
 * Home Screen - Web Implementation
 * 
 * Side-by-side layout with persistent sidebar.
 * Sidebar remains visible in collapsed state as a thin bar.
 */
import { Colors } from '@/src/config/theme';
import { Sidebar } from '@/src/ui/components/sidebar';
import { useAppColorScheme } from '@/src/ui/hooks';
import { ChatScreen } from '@/src/ui/screens';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
    const router = useRouter();
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const handleNavigate = (screen: 'settings' | 'llm-management') => {
        router.push(`/${screen}`);
    };

    const toggleSidebar = () => {
        setSidebarCollapsed(prev => !prev);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            {/* Sidebar - always visible, handles collapsed state internally */}
            <Sidebar
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={toggleSidebar}
                onNavigate={handleNavigate}
            />
            <View style={styles.mainContent}>
                <ChatScreen />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
    },
    mainContent: {
        flex: 1,
    },
});

