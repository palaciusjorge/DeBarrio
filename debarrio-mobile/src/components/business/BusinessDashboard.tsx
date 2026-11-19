import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BusinessButton } from '@/components/business/BusinessButton';
import { colors } from '@/constants/theme';
import type { OwnedBusiness } from '@/contexts/AuthContext';

export function BusinessDashboard({ business }: { business: OwnedBusiness }) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>Mi negocio</Text>

        <View style={styles.card}>
          <Text style={styles.businessName}>{business.name}</Text>
          {business.description ? (
            <Text style={styles.description}>{business.description}</Text>
          ) : null}
          {business.address || business.city ? (
            <Text style={styles.detail}>
              {[business.address, business.city].filter(Boolean).join(', ')}
            </Text>
          ) : null}
          {business.phone ? (
            <Text style={styles.detail}>{business.phone}</Text>
          ) : null}
          {business.email ? (
            <Text style={styles.detail}>{business.email}</Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          <BusinessButton
            label="Ver ficha pública"
            onPress={() => router.push({
              pathname: '/business/[id]',
              params: { id: String(business.id), from: 'panel' },
            })}
          />
          <BusinessButton
            label="Editar perfil del comercio"
            onPress={() => router.push('/business/edit')}
            variant="secondary"
          />
          <BusinessButton
            label="Gestionar productos"
            onPress={() => router.push('/business/products')}
            variant="secondary"
          />
          <BusinessButton
            label="Gestionar ofertas"
            onPress={() => router.push('/business/offers')}
            variant="secondary"
          />
        </View>
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
    gap: 16,
    padding: 20,
    paddingTop: 24,
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
  detail: {
    color: colors.secondaryText,
    fontSize: 14,
    marginTop: 10,
  },
  actions: {
    gap: 12,
  },
});
