import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import type { BusinessMapProps } from '@/components/business-map.types';

export function BusinessMap({ businesses, onSelectBusiness }: BusinessMapProps) {
  return (
    <View style={styles.container}>
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Comercios del barrio</Text>
        <Text style={styles.noticeText}>
          El mapa interactivo está disponible en iOS y Android. Desde aquí
          también puedes abrir la ficha de cada comercio.
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {businesses.map((business) => (
          <Pressable
            accessibilityRole="button"
            key={business.id}
            onPress={() => onSelectBusiness(business)}
            style={({ pressed }) => [
              styles.business,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.businessName}>{business.name}</Text>
            <Text style={styles.businessAddress}>
              {[business.address, business.city]
                .filter(Boolean)
                .join(', ') || 'Dirección no disponible'}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  business: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    padding: 16,
  },
  businessAddress: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 5,
  },
  businessName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  list: {
    paddingBottom: 24,
  },
  notice: {
    backgroundColor: colors.selected,
    borderRadius: 12,
    marginBottom: 14,
    padding: 16,
  },
  noticeText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
  },
  noticeTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});
