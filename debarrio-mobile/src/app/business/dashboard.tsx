import { useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

export default function BusinessDashboardScreen() {
  const {
    user,
    loading,
    profile,
    business,
    profileLoading,
    profileError,
  } = useAuth();

  useEffect(() => {
    if (loading || profileLoading || profileError) {
      return;
    }

    if (!user) {
      router.replace('/login');
    } else if (profile?.role !== 'business' || !business) {
      router.replace('/(tabs)/settings');
    }
  }, [loading, profileLoading, profileError, user, profile, business]);

  const isAuthorized =
    Boolean(user) &&
    profile?.role === 'business' &&
    Boolean(business) &&
    !profileLoading &&
    !profileError;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.content}>
        {loading || profileLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : profileError ? (
          <View style={styles.card}>
            <Text accessibilityRole="alert" style={styles.error}>
              {profileError}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/(tabs)/settings')}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Volver a Ajustes</Text>
            </Pressable>
          </View>
        ) : isAuthorized && business ? (
          <>
            <Text style={styles.eyebrow}>Panel privado</Text>
            <Text style={styles.title}>Mi negocio</Text>
            <View style={styles.card}>
              <Text style={styles.businessName}>{business.name}</Text>
              {business.description ? (
                <Text style={styles.description}>{business.description}</Text>
              ) : null}
              {business.address || business.city ? (
                <Text style={styles.address}>
                  {[business.address, business.city].filter(Boolean).join(', ')}
                </Text>
              ) : null}
            </View>
            <Text style={styles.note}>
              Este espacio está reservado para la gestión de tu comercio.
            </Text>
          </>
        ) : (
          <ActivityIndicator color={colors.primary} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 32,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 24,
    marginTop: 6,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },
  businessName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  description: {
    color: colors.secondaryText,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  address: {
    color: colors.secondaryText,
    fontSize: 14,
    marginTop: 12,
  },
  note: {
    color: colors.secondaryText,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 20,
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 48,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
  error: {
    color: '#B42318',
    fontSize: 14,
    lineHeight: 20,
  },
});
