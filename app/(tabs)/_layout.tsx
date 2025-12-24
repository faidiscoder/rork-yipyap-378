import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { TabBarIcon } from '@/components/TabBarIcon';
import { TabBarBackground } from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUserStore } from '@/store/userStore';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { currentUser } = useUserStore();

  // ULTRA STRICT ADMIN VERIFICATION - ONLY admin15 username can see admin tab
  const shouldShowAdminTab = Boolean(
    currentUser &&
    currentUser.username === 'admin15'
  );

  // Debug logging to see what's happening
  console.log('TabLayout Admin Check:', {
    hasCurrentUser: !!currentUser,
    currentUserUsername: currentUser?.username,
    shouldShowAdminTab
  });

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pool',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="pool" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="chat" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera-tab"
        options={{
          title: 'Camera',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="camera" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="stories"
        options={{
          title: 'Stories',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="stories" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="profile" color={color} focused={focused} />
          ),
        }}
      />
      
      {/* CRITICAL SECURITY: Admin tab only shows if username is exactly "admin15" */}
      {shouldShowAdminTab && (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="admin" color={color} focused={focused} />
            ),
          }}
        />
      )}
    </Tabs>
  );
}