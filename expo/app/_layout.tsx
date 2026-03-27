import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

import { useColorScheme } from '@/hooks/useColorScheme';
import { TRPCProvider } from '@/lib/trpc';
import { useUserStore } from '@/store/userStore';
import { BannedScreen } from '@/components/BannedScreen';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const { 
    currentUser, 
    isInitialized, 
    initializeApp, 
    isUserBanned,
    authToken 
  } = useUserStore();

  const [isAppReady, setIsAppReady] = useState(false);

  const resolvedBackendUrl = useMemo(() => {
    if (Platform.OS === 'web') {
      return '';
    }
    const hostUri = (Constants as any)?.expoGoConfig?.hostUri as string | undefined;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      const url = `http://${host}:3000`;
      return url;
    }
    return 'http://localhost:3000';
  }, []);

  useEffect(() => {
    (global as any).BACKEND_URL = resolvedBackendUrl;
    console.log('🌎 BACKEND_URL set to', resolvedBackendUrl);
  }, [resolvedBackendUrl]);

  useEffect(() => {
    async function prepare() {
      try {
        await initializeApp();
        setIsAppReady(true);
      } catch (e) {
        console.warn('Error during app initialization:', e);
        setIsAppReady(true);
      }
    }

    prepare();
  }, [initializeApp]);

  useEffect(() => {
    if (isAppReady) {
      SplashScreen.hideAsync();
    }
  }, [isAppReady]);

  if (!isAppReady || !isInitialized) {
    return null;
  }

  // Check if current user is banned
  if (currentUser && isUserBanned(currentUser.id)) {
    return <BannedScreen />;
  }

  // Dev mode: always allow app access; userStore pre-seeds a local test account.
  const isAuthenticated = true;

  console.log('🔓 Auth bypass enabled:', { hasUser: !!currentUser, hasToken: !!authToken });

  return (
    <TRPCProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade'
          }}
        >
          {!isAuthenticated ? (
            // Authentication flow
            <>
              <Stack.Screen 
                name="auth/login" 
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen 
                name="auth/signup"
                options={{
                  headerShown: false,
                }}
              />
            </>
          ) : (
            // Main app flow
            <>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="profile/[id]" />
              <Stack.Screen name="profile/edit" />
              <Stack.Screen name="profile/friends" />
              <Stack.Screen name="chat/[id]" />
              <Stack.Screen name="party/[id]" />
              <Stack.Screen name="party/create" />
              <Stack.Screen name="party/invite/[id]" />
              <Stack.Screen name="group/create" />
              <Stack.Screen name="school" />
              <Stack.Screen name="school/search" />
              <Stack.Screen name="school/[id]" />
              <Stack.Screen name="settings/privacy" />
              <Stack.Screen name="settings/blocked" />
              <Stack.Screen name="settings/appearance" />
              <Stack.Screen name="settings/distance" />
              <Stack.Screen name="settings/notifications" />
              <Stack.Screen name="settings/account" />
              <Stack.Screen name="settings/terms" />
              <Stack.Screen name="+not-found" />
            </>
          )}
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </TRPCProvider>
  );
}