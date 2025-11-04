import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../services/queryClient';
import { useMarketData } from '../hooks/useMarketData';
import { useEffect, useRef } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Simple utility to run an effect only once
const useEffectOnce = (effect: () => (() => void) | void) => {
  const destroyFunc = useRef<(() => void) | void>(undefined);
  const effectCalled = useRef(false);

  useEffect(() => {
    if (!effectCalled.current) {
      destroyFunc.current = effect();
      effectCalled.current = true;
    }

    return () => {
      if (destroyFunc.current) {
        destroyFunc.current();
      }
    };
  }, []);
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

// This component lives INSIDE the QueryClientProvider
// so it can safely call the useMarketData hook.
function AppContent() {
  // ▼▼▼ THE HOOK IS CALLED HERE ▼▼▼
  const { setupSSE, cleanupSSE } = useMarketData();
  useEffectOnce(() => {
    setupSSE();
    return () => {
      cleanupSSE();
    };
  });
  // ▲▲▲ HOOK ENDS ▲▲▲

  // navigation stack
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

// This component's ONLY job is to set up the providers.
function RootLayoutNav() {
  // NO hook is called here!
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}