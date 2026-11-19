import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import type { OwnedBusiness } from '@/contexts/AuthContext';
import { useBusinessAccess } from '@/hooks/useBusinessAccess';

type BusinessPrivateScreenProps = {
  children: (business: OwnedBusiness) => ReactNode;
  title: string;
};

export function BusinessPrivateScreen({
  children,
  title,
}: BusinessPrivateScreenProps) {
  const { business, error, loading } = useBusinessAccess();

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.dismissTo('/(tabs)')}
          style={({ pressed }) => [
            styles.panelLink,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.panelLinkText}>‹ Mi negocio</Text>
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : error ? (
          <View style={styles.card}>
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
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
        ) : business ? (
          children(business)
        ) : (
          <ActivityIndicator color={colors.primary} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: 16,
    padding: 20,
    paddingTop: 24,
  },
  panelLink: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  panelLinkText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
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
