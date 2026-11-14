import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';

import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase/client';

type RegistrationStatus = 'idle' | 'confirmation' | 'complete';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const minimumPasswordLength = 8;

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [status, setStatus] = useState<RegistrationStatus>('idle');
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleRegister() {
    setErrorMessage(null);
    setNotice(null);

    const trimmedName = name.trim();
    const trimmedSurname = surname.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedSurname) {
      setErrorMessage('Introduce tu nombre y tus apellidos.');
      return;
    }

    if (!emailPattern.test(normalizedEmail)) {
      setErrorMessage('Introduce un correo electrónico válido.');
      return;
    }

    if (password.length < minimumPasswordLength) {
      setErrorMessage(
        `La contraseña debe tener al menos ${minimumPasswordLength} caracteres.`,
      );
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            name: trimmedName,
            surname: trimmedSurname,
          },
          emailRedirectTo: Linking.createURL('auth/callback'),
        },
      });

      if (error) throw error;

      setConfirmationEmail(normalizedEmail);
      setStatus(data.session ? 'complete' : 'confirmation');
    } catch (error) {
      console.error('Error al registrar el usuario:', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'No se ha podido crear la cuenta. Inténtalo de nuevo.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResendConfirmation() {
    setErrorMessage(null);
    setNotice(null);
    setResending(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: confirmationEmail,
        options: {
          emailRedirectTo: Linking.createURL('auth/callback'),
        },
      });

      if (error) throw error;
      setNotice('Hemos enviado otro correo de confirmación.');
    } catch (error) {
      console.error('Error al reenviar la confirmación:', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'No se ha podido reenviar el correo. Inténtalo de nuevo.',
      );
    } finally {
      setResending(false);
    }
  }

  if (status !== 'idle') {
    const confirmationPending = status === 'confirmation';

    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.resultContainer}>
          <Text style={styles.title}>
            {confirmationPending ? 'Confirma tu correo' : 'Cuenta creada'}
          </Text>
          <Text style={styles.description}>
            {confirmationPending
              ? `Te hemos enviado un enlace a ${confirmationEmail}. Ábrelo para confirmar tu cuenta y continuar.`
              : 'Tu cuenta se ha creado correctamente.'}
          </Text>

          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
          {errorMessage ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {errorMessage}
            </Text>
          ) : null}

          {confirmationPending && (
            <Pressable
              accessibilityRole="button"
              disabled={resending}
              onPress={handleResendConfirmation}
              style={({ pressed }) => [
                styles.secondaryButton,
                (pressed || resending) && styles.buttonPressed,
              ]}
            >
              {resending ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={styles.secondaryButtonText}>
                  Reenviar correo
                </Text>
              )}
            </Pressable>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/(tabs)')}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {confirmationPending ? 'Volver al inicio' : 'Continuar'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.backButtonText}>‹ Volver</Text>
          </Pressable>

          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.description}>
            Regístrate para disfrutar de tu experiencia en DeBarrio.
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              autoCapitalize="words"
              autoComplete="given-name"
              accessibilityLabel="Nombre"
              editable={!loading}
              onChangeText={setName}
              placeholder="Tu nombre"
              placeholderTextColor={colors.muted}
              returnKeyType="next"
              style={styles.input}
              value={name}
            />

            <Text style={styles.label}>Apellidos</Text>
            <TextInput
              autoCapitalize="words"
              autoComplete="family-name"
              accessibilityLabel="Apellidos"
              editable={!loading}
              onChangeText={setSurname}
              placeholder="Tus apellidos"
              placeholderTextColor={colors.muted}
              returnKeyType="next"
              style={styles.input}
              value={surname}
            />

            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              accessibilityLabel="Correo electrónico"
              editable={!loading}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="nombre@ejemplo.com"
              placeholderTextColor={colors.muted}
              returnKeyType="next"
              style={styles.input}
              textContentType="emailAddress"
              value={email}
            />

            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="new-password"
              accessibilityLabel="Contraseña"
              editable={!loading}
              onChangeText={setPassword}
              placeholder={`Al menos ${minimumPasswordLength} caracteres`}
              placeholderTextColor={colors.muted}
              returnKeyType="next"
              secureTextEntry
              style={styles.input}
              textContentType="newPassword"
              value={password}
            />

            <Text style={styles.label}>Repetir contraseña</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="new-password"
              accessibilityLabel="Repetir contraseña"
              editable={!loading}
              onChangeText={setPasswordConfirmation}
              placeholder="Vuelve a escribir la contraseña"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
              secureTextEntry
              style={styles.input}
              textContentType="newPassword"
              value={passwordConfirmation}
            />
          </View>

          {errorMessage ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {errorMessage}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={loading}
            onPress={handleRegister}
            style={({ pressed }) => [
              styles.primaryButton,
              (pressed || loading) && styles.buttonPressed,
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.primaryButtonText}>Crear cuenta</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 28,
    paddingVertical: 8,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  description: {
    color: colors.secondaryText,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  form: {
    gap: 8,
    marginTop: 28,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    marginTop: 24,
    minHeight: 52,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: colors.primary,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 24,
    minHeight: 50,
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.75,
  },
  error: {
    color: '#B42318',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 16,
  },
  notice: {
    color: colors.primary,
    fontSize: 14,
    marginTop: 18,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
});
