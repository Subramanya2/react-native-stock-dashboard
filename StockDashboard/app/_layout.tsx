import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient } from '../services/queryClient';
import { clientPersister } from '../services/storage';
import { useMarketData } from '../hooks/useMarketData';
import { ToastNotification } from '../components/ToastNotification';
import { useEffect, useRef } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

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

// Custom Dark Navigation Theme to eliminate white flash transitions
const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0b0f17',
    card: '#0b0f17',
    text: '#ffffff',
    border: '#1e293b',
  },
};

// Utility to run an effect only once
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
  const { setupSSE, cleanupSSE } = useMarketData();
  useEffectOnce(() => {
    setupSSE();
    return () => {
      cleanupSSE();
    };
  });

  return (
    <ThemeProvider value={customDarkTheme}>
      <StatusBar style="light" backgroundColor="#0b0f17" />
      <ToastNotification />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0b0f17' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="stock/[symbol]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: '#141c2e' },
            headerTintColor: '#ffffff',
            headerTitleStyle: { fontWeight: 'bold', fontSize: 16 },
            contentStyle: { backgroundColor: '#0b0f17' },
          }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

// Set up the persistence query client provider.
function RootLayoutNav() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: clientPersister, maxAge: 1000 * 60 * 60 * 24 }}
    >
      <AppContent />
    </PersistQueryClientProvider>
  );
}