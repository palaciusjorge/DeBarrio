import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLinkingURL } from 'expo-linking';
import { router } from 'expo-router';

import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase/client';

type CallbackState = 'loading' | 'success' | 'error';

function getCallbackParameter(url: URL, key: string) {
  const queryValue = url.searchParams.get(key);

  if (queryValue) return queryValue;

  return new URLSearchParams(url.hash.slice(1)).get(key);
}

export default function AuthCallbackScreen() {
  const linkingUrl = useLinkingURL();
  const handledUrl = useRef<string | null>(null);
  const [state, setState] = useState<CallbackState>('loading');
  const [message, setMessage] = useState('Verificando tu correo electrónico…');

  useEffect(() => {
    if (!linkingUrl || handledUrl.current === linkingUrl) return;

    const callbackUrl = linkingUrl;
    handledUrl.current = callbackUrl;

    async function completeAuthentication() {
      try {
        const url = new URL(callbackUrl);
        const callbackError =
          getCallbackParameter(url, 'error_description') ??
          getCallbackParameter(url, 'error');

        if (callbackError) {
          throw new Error(callbackError);
        }

        const code = getCallbackParameter(url, 'code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          const accessToken = getCallbackParameter(url, 'access_token');
          const refreshToken = getCallbackParameter(url, 'refresh_token');

          if (!accessToken || !refreshToken) {
            throw new Error(
              'El enlace no contiene los datos necesarios. Solicita un nuevo correo de confirmación.',
            );
          }

          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        }

        setMessage('Correo confirmado. Tu cuenta ya está activa.');
        setState('success');
      } catch (error) {
        console.error('Error al confirmar el correo:', error);
        setMessage(
          error instanceof Error
            ? error.message
            : 'No se ha podido confirmar el correo. Solicita un nuevo enlace.',
        );
        setState('error');
      }
    }

    void completeAuthentication();
  }, [linkingUrl]);

  return (
    <View style={styles.container}>
      {state === 'loading' ? (
        <ActivityIndicator color={colors.primary} size="large" />
      ) : null}
      <Text
        accessibilityRole={state === 'error' ? 'alert' : undefined}
        style={[styles.message, state === 'error' && styles.error]}
      >
        {message}
      </Text>
      {state !== 'loading' ? (
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.replace(state === 'success' ? '/(tabs)' : '/register')
          }
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          <Text style={styles.link}>
            {state === 'success' ? 'Continuar' : 'Volver al registro'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  message: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 18,
    textAlign: 'center',
  },
  error: {
    color: '#B42318',
  },
  link: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 24,
  },
  pressed: {
    opacity: 0.75,
  },
});
