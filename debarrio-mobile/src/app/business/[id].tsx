
import { useEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Linking from 'expo-linking';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import type { SymbolViewProps } from 'expo-symbols';

import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase/client';

type Business = {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  city: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
};

type Category = {
  id: number;
  name: string;
};

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
};

type Offer = {
  id: number;
  title: string;
  description: string | null;
  discount_percentage: number | null;
  start_date: string | null;
  end_date: string | null;
};

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [business, setBusiness] = useState<Business | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadBusiness() {
      setLoading(true);
      setError(null);

      try {
        const businessId = Number(id);

        if (!Number.isInteger(businessId) || businessId <= 0) {
          throw new Error('El identificador del comercio no es válido.');
        }

        const businessResult = await supabase
          .from('businesses')
          .select(
            'id, name, description, address, phone, email, website, city, postal_code, latitude, longitude',
          )
          .eq('id', businessId)
          .maybeSingle();

        if (businessResult.error) throw businessResult.error;

        if (!businessResult.data) {
          throw new Error('No hemos encontrado este comercio.');
        }

        const [linksResult, productsResult, offersResult] =
          await Promise.all([
            supabase
              .from('business_categories')
              .select('category_id')
              .eq('business_id', businessId),
            supabase
              .from('products')
              .select('id, name, description, price, image_url')
              .eq('business_id', businessId)
              .eq('active', true),
            supabase
              .from('offers')
              .select(
                'id, title, description, discount_percentage, start_date, end_date',
              )
              .eq('business_id', businessId)
              .eq('active', true),
          ]);

        if (linksResult.error) throw linksResult.error;
        if (productsResult.error) throw productsResult.error;
        if (offersResult.error) throw offersResult.error;

        const categoryIds = (linksResult.data ?? []).map(
          (item) => item.category_id,
        );

        let categoryData: Category[] = [];

        if (categoryIds.length > 0) {
          const categoryResult = await supabase
            .from('categories')
            .select('id, name')
            .in('id', categoryIds);

          if (categoryResult.error) throw categoryResult.error;
          categoryData = categoryResult.data ?? [];
        }

        if (active) {
          setBusiness(businessResult.data);
          setCategories(categoryData);
          setProducts(productsResult.data ?? []);
          const today = new Date();
          const todayDate = [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, '0'),
            String(today.getDate()).padStart(2, '0'),
          ].join('-');
          setOffers(
            (offersResult.data ?? []).filter(
              (offer) =>
                (!offer.start_date ||
                  offer.start_date.slice(0, 10) <= todayDate) &&
                (!offer.end_date || offer.end_date.slice(0, 10) >= todayDate),
            ),
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'No se ha podido cargar el comercio.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBusiness();

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerBackVisible: false,
          headerLeft: () => (
            <Pressable
              accessibilityLabel="Volver a los comercios"
              accessibilityRole="button"
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)');
                }
              }}
              style={styles.backButton}
            >
              <SymbolView
                name={{
                  ios: 'chevron.left',
                  android: 'arrow_back',
                  web: 'arrow_back',
                }}
                tintColor={colors.primary}
                size={20}
              />
              <Text numberOfLines={1} style={styles.backButtonText}>
                Volver a los comercios
              </Text>
            </Pressable>
          ),
          headerTransparent: false,
          headerShown: true,
          title: 'Comercio',
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator
            color={colors.primary}
            size="large"
            style={styles.loader}
          />
        ) : error || !business ? (
          <View style={styles.messageCard}>
            <Text style={styles.heading}>
              No se puede mostrar el comercio
            </Text>
            <Text style={styles.muted}>
              {error ?? 'Inténtalo de nuevo más tarde.'}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.hero}>
              <View style={styles.heroHeading}>
                <View style={styles.heroIcon}>
                  <SymbolView
                    name={{
                      ios: 'storefront.fill',
                      android: 'storefront',
                      web: 'storefront',
                    }}
                    tintColor={colors.primary}
                    size={34}
                  />
                </View>

                <View style={styles.heroDetails}>
                  <Text style={styles.businessName}>{business.name}</Text>

                  {categories.length > 0 && (
                    <View style={styles.tags}>
                      {categories.map((category) => (
                        <Text key={category.id} style={styles.tag}>
                          {category.name}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {business.description ? (
                <Text style={styles.description}>
                  {business.description}
                </Text>
              ) : (
                <Text style={styles.muted}>
                  Descubre este comercio de tu barrio.
                </Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Información</Text>

              <View style={styles.infoCard}>
                <InfoRow
                  symbol={{
                    ios: 'mappin.and.ellipse',
                    android: 'location_on',
                    web: 'location_on',
                  }}
                  label="Dirección"
                  value={
                    [business.address, business.city, business.postal_code]
                      .filter(Boolean)
                      .join(', ') || 'Dirección no disponible'
                  }
                />
                {business.phone && (
                  <InfoRow
                    symbol={{
                      ios: 'phone.fill',
                      android: 'call',
                      web: 'call',
                    }}
                    label="Teléfono"
                    value={business.phone}
                    href={getPhoneUrl(business.phone)}
                  />
                )}
                {business.email && (
                  <InfoRow
                    symbol={{
                      ios: 'envelope.fill',
                      android: 'email',
                      web: 'email',
                    }}
                    label="Correo electrónico"
                    value={business.email}
                    href={`mailto:${encodeURIComponent(business.email.trim())}`}
                  />
                )}
                {business.website && (
                  <InfoRow
                    symbol={{
                      ios: 'globe',
                      android: 'language',
                      web: 'language',
                    }}
                    label="Página web"
                    value={business.website}
                    href={getWebsiteUrl(business.website)}
                  />
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Productos</Text>

              {products.length === 0 ? (
                <Text style={styles.muted}>
                  Este comercio todavía no tiene productos publicados.
                </Text>
              ) : (
                <View style={styles.listCard}>
                  {products.map((product) => (
                    <View key={product.id} style={styles.productRow}>
                      {product.image_url ? (
                        <Image
                          accessibilityLabel={product.name}
                          source={{ uri: product.image_url }}
                          style={styles.productImage}
                        />
                      ) : null}
                      <View style={styles.productInfo}>
                        <Text style={styles.productName}>
                          {product.name}
                        </Text>
                        {product.description ? (
                          <Text style={styles.muted}>
                            {product.description}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={styles.price}>
                        {product.price == null
                          ? 'Consultar precio'
                          : Number(product.price).toLocaleString('es-ES', {
                              style: 'currency',
                              currency: 'EUR',
                            })}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ofertas</Text>

              {offers.length === 0 ? (
                <Text style={styles.muted}>
                  No hay ofertas publicadas actualmente.
                </Text>
              ) : (
                <View style={styles.listCard}>
                  {offers.map((offer) => (
                    <View key={offer.id} style={styles.offerCard}>
                      <SymbolView
                        name={{
                          ios: 'tag.fill',
                          android: 'local_offer',
                          web: 'local_offer',
                        }}
                        tintColor={colors.primary}
                        size={22}
                      />
                      <View style={styles.offerInfo}>
                        <Text style={styles.productName}>
                          {offer.title}
                        </Text>
                        {offer.description ? (
                          <Text style={styles.muted}>
                            {offer.description}
                          </Text>
                        ) : null}
                        {offer.discount_percentage != null && (
                          <Text style={styles.discount}>
                            {offer.discount_percentage}% de descuento
                          </Text>
                        )}
                        {(offer.start_date || offer.end_date) && (
                          <Text style={styles.muted}>
                            {formatOfferDate(
                              offer.start_date,
                              'Sin fecha de inicio',
                            )}
                            {' — '}
                            {formatOfferDate(
                              offer.end_date,
                              'Sin fecha de fin',
                            )}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  symbol,
  label,
  value,
  href,
}: {
  symbol: SymbolViewProps['name'];
  label: string;
  value: string;
  href?: string;
}) {
  const infoText = (
    <View style={styles.infoText}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, href && styles.infoLink]}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.infoRow}>
      <SymbolView
        name={symbol}
        tintColor={colors.primary}
        size={21}
      />
      {href ? (
        <Pressable
          accessibilityLabel={`${label}: ${value}`}
          accessibilityRole="link"
          onPress={() => void openContactLink(href)}
          style={({ pressed }) => [
            styles.infoText,
            pressed && styles.linkPressed,
          ]}
        >
          {infoText}
        </Pressable>
      ) : (
        infoText
      )}
    </View>
  );
}

async function openContactLink(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      'No se pudo abrir el enlace',
      'No hay una aplicación disponible para abrir este enlace.',
    );
  }
}

function getWebsiteUrl(website: string) {
  const url = website.trim();

  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function getPhoneUrl(phone: string) {
  const number = phone.trim().replace(/[^\d+]/g, '');

  return number ? `tel:${number}` : undefined;
}

function formatOfferDate(date: string | null, fallback: string) {
  if (!date) return fallback;

  const dateValue = new Date(`${date.slice(0, 10)}T00:00:00`);

  return Number.isNaN(dateValue.getTime())
    ? date
    : dateValue.toLocaleDateString('es-ES');
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    maxWidth: 188,
    paddingVertical: 8,
  },
  backButtonText: {
    color: colors.primary,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 36,
  },
  loader: {
    marginTop: 60,
  },
  hero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
  },
  heroHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  heroDetails: {
    flex: 1,
    gap: 10,
  },
  heroIcon: {
    alignItems: 'center',
    backgroundColor: colors.iconBackground,
    borderRadius: 18,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  businessName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    flexShrink: 1,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  tag: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  description: {
    color: colors.secondaryText,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 16,
  },
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 14,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  infoRow: {
    alignItems: 'flex-start',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    color: colors.secondaryText,
    fontSize: 12,
  },
  infoValue: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 3,
  },
  infoLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  linkPressed: {
    opacity: 0.6,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  productRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 16,
  },
  productImage: {
    borderRadius: 10,
    height: 72,
    width: 72,
  },
  productInfo: {
    flex: 1,
    gap: 4,
  },
  productName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  price: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  offerCard: {
    alignItems: 'flex-start',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 16,
  },
  offerInfo: {
    flex: 1,
    gap: 5,
  },
  discount: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  muted: {
    color: colors.secondaryText,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  messageCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 24,
  },
  heading: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
});
