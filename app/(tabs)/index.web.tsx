/**
 * Home Screen - Web Implementation
 * 
 * Responsive layout:
 * - Large screens (>= 768px): Side-by-side layout with persistent sidebar
 * - Small screens (< 768px): Floating drawer overlay (like native)
 */
import { Colors, Layout } from '@/src/config/theme';
import { Sidebar } from '@/src/ui/components/sidebar';
import { useAppColorScheme } from '@/src/ui/hooks';
import { ChatScreen } from '@/src/ui/screens';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Animated, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Breakpoint below which sidebar becomes floating overlay
const MOBILE_BREAKPOINT = 768;

export default function HomeScreen() {
    const router = useRouter();
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];
    const { width: windowWidth } = useWindowDimensions();

    const isMobile = windowWidth < MOBILE_BREAKPOINT;

    // For desktop: controls collapsed/expanded state
    // For mobile: controls drawer open/closed state
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

    const handleNavigate = (screen: 'settings' | 'llm-management') => {
        if (isMobile) {
            setSidebarOpen(false);
        }
        router.push(`/${screen}`);
    };

    const toggleSidebar = () => {
        setSidebarOpen(prev => !prev);
    };

    const openSidebar = () => {
        setSidebarOpen(true);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    // Mobile: Floating drawer layout
    if (isMobile) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
                <View style={styles.mainContent}>
                    <ChatScreen onMenuPress={openSidebar} />
                </View>

                {/* Drawer overlay */}
                {sidebarOpen && (
                    <Pressable
                        style={[styles.overlay, { backgroundColor: colors.overlay }]}
                        onPress={closeSidebar}
                    />
                )}

                {/* Floating drawer */}
                {sidebarOpen && (
                    <Animated.View
                        style={[
                            styles.drawer,
                            { backgroundColor: colors.sidebar },
                        ]}
                    >
                        <Sidebar
                            isCollapsed={false}
                            onToggleCollapse={closeSidebar}
                            onNavigate={handleNavigate}
                        />
                    </Animated.View>
                )}
            </SafeAreaView>
        );
    }

    // Desktop: Side-by-side layout
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            {/* Sidebar - always visible, handles collapsed state internally */}
            <Sidebar
                isCollapsed={!sidebarOpen}
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
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 10,
    },
    drawer: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: Layout.sidebarWidth,
        zIndex: 20,
    },
});

