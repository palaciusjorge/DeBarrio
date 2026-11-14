
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';

import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase/client';

type Category = {
  id: number;
  name: string;
  description: string | null;
};

type Business = {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
};

type BusinessCategory = {
  business_id: number;
  category_id: number;
};

const categorySymbols = {
  Restauración: {
    ios: 'fork.knife',
    android: 'restaurant',
    web: 'restaurant',
  },
  Alimentación: {
    ios: 'basket.fill',
    android: 'shopping_basket',
    web: 'shopping_basket',
  },
  Moda: {
    ios: 'tshirt.fill',
    android: 'checkroom',
    web: 'checkroom',
  },
  'Salud y bienestar': {
    ios: 'heart.fill',
    android: 'favorite',
    web: 'favorite',
  },
  Hogar: {
    ios: 'house.fill',
    android: 'home',
    web: 'home',
  },
  Servicios: {
    ios: 'wrench.fill',
    android: 'build',
    web: 'build',
  },
  Ocio: {
    ios: 'gamecontroller.fill',
    android: 'sports_esports',
    web: 'sports_esports',
  },
  Tecnología: {
    ios: 'laptopcomputer',
    android: 'devices',
    web: 'devices',
  },
} as const;

const fallbackSymbol = {
  ios: 'tag.fill',
  android: 'label',
  web: 'label',
} as const;

function getCategorySymbol(name: string) {
  return (
    categorySymbols[name as keyof typeof categorySymbols] ??
    fallbackSymbol
  );
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    null,
  );
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessCategories, setBusinessCategories] = useState<
    BusinessCategory[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [categoriesResult, businessesResult, linksResult] =
          await Promise.all([
            supabase
              .from('categories')
              .select('id, name, description')
              .order('name'),
            supabase
              .from('businesses')
              .select(
                'id, name, description, address, city, postal_code, latitude, longitude',
              )
              .order('name'),
            supabase
              .from('business_categories')
              .select('business_id, category_id'),
          ]);

        if (categoriesResult.error) throw categoriesResult.error;
        if (businessesResult.error) throw businessesResult.error;
        if (linksResult.error) throw linksResult.error;

        if (active) {
          setCategories(categoriesResult.data ?? []);
          setBusinesses(businessesResult.data ?? []);
          setBusinessCategories(linksResult.data ?? []);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'No se han podido cargar los datos.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const filteredBusinesses = useMemo(() => {
    const query = normalize(search);

    return businesses.filter((business) => {
      const matchesSearch =
        !query ||
        normalize(
          [
            business.name,
            business.description ?? '',
            business.address ?? '',
            business.city ?? '',
            business.postal_code ?? '',
          ].join(' '),
        ).includes(query);

      const matchesCategory =
        selectedCategory === null ||
        businessCategories.some(
          (link) =>
            link.business_id === business.id &&
            link.category_id === selectedCategory,
        );

      return matchesSearch && matchesCategory;
    });
  }, [businesses, businessCategories, search, selectedCategory]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brand}>DeBarrio</Text>
          <Text style={styles.subtitle}>
            Descubre los comercios de tu zona
          </Text>
        </View>

        <View style={styles.searchBox}>
          <SymbolView
            name={{
              ios: 'magnifyingglass',
              android: 'search',
              web: 'search',
            }}
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
              onPress={() => setSearch('')}
            >
              <SymbolView
                name={{
                  ios: 'xmark.circle.fill',
                  android: 'cancel',
                  web: 'cancel',
                }}
                tintColor={colors.muted}
                size={18}
              />
            </Pressable>
          )}
        </View>

        <View style={styles.section}>
          <View
            style={[
              styles.sectionHeading,
              categoriesExpanded && styles.sectionHeadingExpanded,
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: categoriesExpanded }}
              onPress={() => setCategoriesExpanded((expanded) => !expanded)}
              style={({ pressed }) => [
                styles.categoryToggle,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.categoryToggleLabel}>
                <Text style={styles.sectionTitle}>Categorías</Text>
                {selectedCategory !== null && (
                  <Text numberOfLines={1} style={styles.selectedCategoryLabel}>
                    {categories.find(
                      (category) => category.id === selectedCategory,
                    )?.name}
                  </Text>
                )}
              </View>

              <SymbolView
                name={
                  categoriesExpanded
                    ? {
                        ios: 'chevron.down',
                        android: 'keyboard_arrow_down',
                        web: 'keyboard_arrow_down',
                      }
                    : {
                        ios: 'chevron.right',
                        android: 'chevron_right',
                        web: 'chevron_right',
                      }
                }
                tintColor={colors.muted}
                size={20}
              />
            </Pressable>

            {selectedCategory !== null && (
              <Pressable
                accessibilityRole="button"
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={styles.clearSelection}>Quitar filtro</Text>
              </Pressable>
            )}
          </View>

          {categoriesExpanded &&
            (loading && categories.length === 0 ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <View style={styles.categoriesGrid}>
                {categories.map((category) => {
                  const isSelected = selectedCategory === category.id;

                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      key={category.id}
                      onPress={() =>
                        setSelectedCategory(
                          isSelected ? null : category.id,
                        )
                      }
                      style={({ pressed }) => [
                        styles.categoryCard,
                        isSelected && styles.categoryCardSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.categoryIcon,
                          isSelected && styles.categoryIconSelected,
                        ]}
                      >
                        <SymbolView
                          name={getCategorySymbol(category.name)}
                          tintColor={
                            isSelected ? colors.surface : colors.primary
                          }
                          size={22}
                        />
                      </View>

                      <Text
                        numberOfLines={2}
                        style={[
                          styles.categoryName,
                          isSelected && styles.categoryNameSelected,
                        ]}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cerca de ti</Text>

          {loading ? (
            <View style={styles.messageState}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.emptyDescription}>
                Cargando comercios...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.messageState}>
              <Text style={styles.emptyTitle}>
                No se han podido cargar los datos
              </Text>
              <Text style={styles.emptyDescription}>{error}</Text>
            </View>
          ) : filteredBusinesses.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <SymbolView
                  name={{
                    ios: 'map.fill',
                    android: 'map',
                    web: 'map',
                  }}
                  tintColor={colors.primary}
                  size={26}
                />
              </View>

              <Text style={styles.emptyTitle}>
                {businesses.length === 0
                  ? 'Todavía no hay comercios'
                  : 'No hay resultados'}
              </Text>

              <Text style={styles.emptyDescription}>
                {businesses.length === 0
                  ? 'Pronto podrás descubrir comercios de tu barrio.'
                  : 'Prueba con otra búsqueda o selecciona otra categoría.'}
              </Text>
            </View>
          ) : (
            <View style={styles.businessList}>
              {filteredBusinesses.map((business) => {
                const businessCategoryNames = businessCategories
                  .filter((link) => link.business_id === business.id)
                  .map(
                    (link) =>
                      categories.find(
                        (category) => category.id === link.category_id,
                      )?.name,
                  )
                  .filter((name): name is string => Boolean(name));

                return (
                  <Pressable
                    key={business.id}
                    onPress={() =>
                      router.push({
                        pathname: '/business/[id]',
                        params: { id: String(business.id) },
                      })
                    }
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.businessCard,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.businessIcon}>
                      <SymbolView
                        name={{
                          ios: 'storefront.fill',
                          android: 'storefront',
                          web: 'storefront',
                        }}
                        tintColor={colors.primary}
                        size={25}
                      />
                    </View>

                    <View style={styles.businessInfo}>
                      <Text style={styles.businessName}>
                        {business.name}
                      </Text>

                      {(business.address || business.city) && (
                        <Text style={styles.businessAddress}>
                          {[business.address, business.city]
                            .filter(Boolean)
                            .join(', ')}
                        </Text>
                      )}

                      {business.description ? (
                        <Text style={styles.businessDescription}>
                          {business.description}
                        </Text>
                      ) : null}

                      {businessCategoryNames.length > 0 && (
                        <View style={styles.categoryTags}>
                          {businessCategoryNames.map((name) => (
                            <Text key={name} style={styles.categoryTag}>
                              {name}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>

                    <SymbolView
                      name={{
                        ios: 'chevron.right',
                        android: 'chevron_right',
                        web: 'chevron_right',
                      }}
                      tintColor={colors.muted}
                      size={18}
                    />
                  </Pressable>
                );
              })}
            </View>
          )}
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
  },
  sectionHeadingExpanded: {
    marginBottom: 14,
  },
  categoryToggle: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingRight: 12,
  },
  categoryToggleLabel: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '700',
  },
  selectedCategoryLabel: {
    color: colors.primary,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  clearSelection: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
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
  messageState: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 24,
    gap: 10,
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
    textAlign: 'center',
  },
  emptyDescription: {
    color: colors.secondaryText,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    maxWidth: 280,
    textAlign: 'center',
  },
  businessList: {
    gap: 12,
  },
  businessCard: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  businessIcon: {
    alignItems: 'center',
    backgroundColor: colors.iconBackground,
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  businessAddress: {
    color: colors.secondaryText,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  businessDescription: {
    color: colors.secondaryText,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  categoryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  categoryTag: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  pressed: {
    opacity: 0.78,
  },
});
