import { Tabs } from 'expo-router';
import React from 'react';

import { Colors } from '@/src/config/theme';
import { useAppColorScheme } from '@/src/ui/hooks';

export default function TabLayout() {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          display: 'none', // Hide tab bar since we use sidebar navigation
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chat',
        }}
      />
    </Tabs>
  );
}
