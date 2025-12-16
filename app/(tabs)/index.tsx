import { Colors } from '@/src/config/theme';
import { useConversationStore, useSettingsStore } from '@/src/state';
import { Sidebar } from '@/src/ui/components/sidebar';
import { ChatScreen } from '@/src/ui/screens';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, Dimensions, Platform, Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnimation = useRef(new Animated.Value(0)).current;
  const { settings, toggleSidebar } = useSettingsStore();
  const { currentConversationId } = useConversationStore();

  const isWeb = Platform.OS === 'web';
  const windowWidth = Dimensions.get('window').width;
  const isWideScreen = isWeb && windowWidth > 768;

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

  const handleNavigate = (screen: 'settings' | 'llm-management') => {
    closeDrawer();
    router.push(`/${screen}`);
  };

  const renderSidebar = () => (
    <Sidebar
      isCollapsed={false}
      onToggleCollapse={() => {
        if (isWideScreen) {
          toggleSidebar();
        } else {
          closeDrawer();
        }
      }}
      onNavigate={handleNavigate}
    />
  );

  // Web: Side-by-side layout
  if (isWideScreen) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        {!settings.sidebarCollapsed && (
          <View style={[styles.sidebarContainer, { borderRightColor: colors.border }]}>
            {renderSidebar()}
          </View>
        )}
        <View style={styles.mainContent}>
          <ChatScreen onMenuPress={() => toggleSidebar()} />
        </View>
      </SafeAreaView>
    );
  }

  // Mobile: Custom drawer implementation
  const translateX = drawerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-280, 0],
  });

  return (
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
          {renderSidebar()}
        </Animated.View>
      )}
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
