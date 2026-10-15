import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { colors } from '@/constants/theme';

const categories = [
  {
    name: 'Restauración',
    symbol: { ios: 'fork.knife', android: 'restaurant', web: 'restaurant' },
  },
  {
    name: 'Alimentación',
    symbol: { ios: 'basket.fill', android: 'shopping_basket', web: 'shopping_basket' },
  },
  {
    name: 'Moda',
    symbol: { ios: 'tshirt.fill', android: 'checkroom', web: 'checkroom' },
  },
  {
    name: 'Salud y bienestar',
    symbol: { ios: 'heart.fill', android: 'favorite', web: 'favorite' },
  },
  {
    name: 'Hogar',
    symbol: { ios: 'house.fill', android: 'home', web: 'home' },
  },
  {
    name: 'Servicios',
    symbol: { ios: 'wrench.fill', android: 'build', web: 'build' },
  },
  {
    name: 'Ocio',
    symbol: { ios: 'gamecontroller.fill', android: 'sports_esports', web: 'sports_esports' },
  },
  {
    name: 'Tecnología',
    symbol: { ios: 'laptopcomputer', android: 'devices', web: 'devices' },
  },
] as const;

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brand}>DeBarrio</Text>
          <Text style={styles.subtitle}>Descubre los comercios de tu zona</Text>
        </View>

        <View style={styles.searchBox}>
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
            tintColor={colors.muted}
            size={20}
          />
          <TextInput
            accessibilityLabel="Buscar comercios"
            placeholder="Buscar comercios..."
            placeholderTextColor={colors.muted}
            returnKeyType="search"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable
              accessibilityLabel="Limpiar búsqueda"
              hitSlop={8}
              onPress={() => setSearch('')}>
              <SymbolView
                name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
                tintColor={colors.muted}
                size={18}
              />
            </Pressable>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Categorías</Text>
            {selectedCategory && (
              <Pressable
                accessibilityRole="button"
                onPress={() => setSelectedCategory(null)}>
                <Text style={styles.clearSelection}>Quitar filtro</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => {
              const isSelected = selectedCategory === category.name;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  key={category.name}
                  onPress={() =>
                    setSelectedCategory(isSelected ? null : category.name)
                  }
                  style={({ pressed }) => [
                    styles.categoryCard,
                    isSelected && styles.categoryCardSelected,
                    pressed && styles.pressed,
                  ]}>
                  <View
                    style={[
                      styles.categoryIcon,
                      isSelected && styles.categoryIconSelected,
                    ]}>
                    <SymbolView
                      name={category.symbol}
                      tintColor={isSelected ? colors.surface : colors.primary}
                      size={22}
                    />
                  </View>
                  <Text
                    numberOfLines={2}
                    style={[
                      styles.categoryName,
                      isSelected && styles.categoryNameSelected,
                    ]}>
                    {category.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cerca de ti</Text>
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <SymbolView
                name={{ ios: 'map.fill', android: 'map', web: 'map' }}
                tintColor={colors.primary}
                size={26}
              />
            </View>
            <Text style={styles.emptyTitle}>Muy pronto en tu barrio</Text>
            <Text style={styles.emptyDescription}>
              Aquí encontrarás comercios locales cerca de ti.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 24,
  },
  brand: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subtitle: {
    color: colors.secondaryText,
    fontSize: 14,
    marginTop: 4,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
  },
  section: {
    marginTop: 30,
  },
  sectionHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 14,
  },
  clearSelection: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 14,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  categoryCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 112,
    paddingHorizontal: 10,
    paddingVertical: 14,
    width: '48.5%',
  },
  categoryCardSelected: {
    backgroundColor: colors.selected,
    borderColor: colors.primary,
  },
  categoryIcon: {
    alignItems: 'center',
    backgroundColor: colors.iconBackground,
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    marginBottom: 9,
    width: 42,
  },
  categoryIconSelected: {
    backgroundColor: colors.primary,
  },
  categoryName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 2,
    paddingHorizontal: 24,
    paddingVertical: 26,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.iconBackground,
    borderRadius: 18,
    height: 52,
    justifyContent: 'center',
    marginBottom: 14,
    width: 52,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  emptyDescription: {
    color: colors.secondaryText,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    maxWidth: 240,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.78,
  },
});
