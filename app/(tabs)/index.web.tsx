/**
 * Home Screen - Web Implementation
 * 
 * Side-by-side layout with persistent sidebar.
 */
import { Colors } from '@/src/config/theme';
import { Sidebar } from '@/src/ui/components/sidebar';
import { useAppColorScheme } from '@/src/ui/hooks';
import { ChatScreen } from '@/src/ui/screens';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
            {!sidebarCollapsed && (
                <View style={[styles.sidebarContainer, { borderRightColor: colors.border }]}>
                    <Sidebar
                        isCollapsed={false}
                        onToggleCollapse={toggleSidebar}
                        onNavigate={handleNavigate}
                    />
                </View>
            )}
            <View style={styles.mainContent}>
                <ChatScreen onMenuPress={toggleSidebar} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
    },
    sidebarContainer: {
        borderRightWidth: 1,
    },
    mainContent: {
        flex: 1,
    },
});
