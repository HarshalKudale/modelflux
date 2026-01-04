/**
 * Home Screen - Native Implementation
 * 
 * Drawer-based navigation with swipe gestures.
 */
import { Colors } from '@/src/config/theme';
import { Sidebar } from '@/src/ui/components/sidebar';
import { useAppColorScheme } from '@/src/ui/hooks';
import { ChatScreen } from '@/src/ui/screens';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

// Edge width for swipe gesture detection (in pixels)
const SWIPE_EDGE_WIDTH = 150;
// Minimum swipe distance to trigger drawer open
const SWIPE_THRESHOLD = 30;

export default function HomeScreen() {
    const router = useRouter();
    const colorScheme = useAppColorScheme();
    const colors = Colors[colorScheme];

    const [drawerOpen, setDrawerOpen] = useState(false);
    const drawerAnimation = useRef(new Animated.Value(0)).current;

    const openDrawer = () => {
        setDrawerOpen(true);
        Animated.timing(drawerAnimation, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
        }).start();
    };

    const closeDrawer = () => {
        Animated.timing(drawerAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setDrawerOpen(false);
        });
    };

    // Swipe gesture to open drawer from left edge
    const startXRef = useRef(0);
    const swipeGesture = Gesture.Pan()
        .runOnJS(true)
        .activeOffsetX(20)
        .failOffsetY([-15, 15])
        .onBegin((event) => {
            startXRef.current = event.absoluteX;
        })
        .onEnd((event) => {
            if (startXRef.current <= SWIPE_EDGE_WIDTH &&
                event.translationX >= SWIPE_THRESHOLD) {
                openDrawer();
            }
        });

    const handleNavigate = (screen: 'settings' | 'llm-management') => {
        closeDrawer();
        router.push(`/${screen}`);
    };

    const translateX = drawerAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [-280, 0],
    });

    return (
        <GestureDetector gesture={swipeGesture}>
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
                <View style={styles.mainContent}>
                    <ChatScreen onMenuPress={openDrawer} />
                </View>

                {/* Drawer overlay */}
                {drawerOpen && (
                    <Pressable
                        style={[styles.overlay, { backgroundColor: colors.overlay }]}
                        onPress={closeDrawer}
                    />
                )}

                {/* Drawer */}
                {drawerOpen && (
                    <Animated.View
                        style={[
                            styles.drawer,
                            { backgroundColor: colors.sidebar, transform: [{ translateX }] },
                        ]}
                    >
                        <Sidebar
                            isCollapsed={false}
                            onToggleCollapse={closeDrawer}
                            onNavigate={handleNavigate}
                        />
                    </Animated.View>
                )}
            </SafeAreaView>
        </GestureDetector>
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
        width: 280,
        zIndex: 20,
    },
});
