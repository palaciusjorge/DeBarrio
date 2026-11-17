import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { BusinessButton } from '@/components/business/BusinessButton';
import { BusinessPrivateScreen } from '@/components/business/BusinessPrivateScreen';
import { colors } from '@/constants/theme';

export default function BusinessDashboardScreen() {
  return (
    <BusinessPrivateScreen showPanelLink={false} title="Mi negocio">
      {(business) => (
        <>
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

          <Text style={styles.note}>
            Desde aquí puedes actualizar la información de tu comercio,
            productos y ofertas.
          </Text>

          <View style={styles.actions}>
            <BusinessButton
              label="Editar perfil del comercio"
              onPress={() => router.push('/business/edit')}
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
        </>
      )}
    </BusinessPrivateScreen>
  );
}

const styles = StyleSheet.create({
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
  note: {
    color: colors.secondaryText,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
});
