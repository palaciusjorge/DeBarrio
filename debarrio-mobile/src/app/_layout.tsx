
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AppState, Platform } from 'react-native';

import { AuthProvider } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    if (AppState.currentState === 'active') {
      supabase.auth.startAutoRefresh();
    }

    return () => {
      subscription.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="business/[id]"
          options={{ headerShown: true, title: 'Comercio' }}
        />
      </Stack>
    </AuthProvider>
  );
}

