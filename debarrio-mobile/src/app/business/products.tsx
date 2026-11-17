import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BusinessButton } from '@/components/business/BusinessButton';
import { BusinessPrivateScreen } from '@/components/business/BusinessPrivateScreen';
import { BusinessTextField } from '@/components/business/BusinessTextField';
import { colors } from '@/constants/theme';
import type { OwnedBusiness } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  active: boolean;
};

function ProductManager({ business }: { business: OwnedBusiness }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingProductId, setChangingProductId] = useState<number | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: loadError } = await supabase
          .from('products')
          .select('id, name, description, price, image_url, active')
          .eq('business_id', business.id)
          .order('created_at', { ascending: false });

        if (loadError) throw loadError;
        if (active) setProducts(data ?? []);
      } catch (loadError) {
        console.error('Error al cargar los productos del comercio:', loadError);
        if (active) {
          setError(
            'No se pudieron cargar los productos. Comprueba tu conexión e inténtalo de nuevo.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProducts();

    return () => {
      active = false;
    };
  }, [business.id]);

  function startNewProduct() {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice('');
    setImageUrl('');
    setError(null);
    setFormVisible(true);
  }

  function startEditingProduct(product: Product) {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description ?? '');
    setPrice(product.price === null ? '' : String(product.price));
    setImageUrl(product.image_url ?? '');
    setError(null);
    setFormVisible(true);
  }

  async function saveProduct() {
    if (saving) return;

    const normalizedName = name.trim();
    const normalizedPrice = price.trim().replace(',', '.');
    const parsedPrice =
      normalizedPrice.length > 0 ? Number(normalizedPrice) : null;

    if (!normalizedName) {
      setError('El nombre del producto es obligatorio.');
      return;
    }

    if (
      parsedPrice !== null &&
      (!Number.isFinite(parsedPrice) || parsedPrice < 0)
    ) {
      setError('Introduce un precio válido, igual o superior a cero.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const values = {
        name: normalizedName,
        description: description.trim() || null,
        price: parsedPrice,
        image_url: imageUrl.trim() || null,
      };

      if (editingProduct) {
        const { data, error: updateError } = await supabase
          .from('products')
          .update(values)
          .eq('id', editingProduct.id)
          .eq('business_id', business.id)
          .select('id, name, description, price, image_url, active')
          .single();

        if (updateError) throw updateError;
        if (!data) throw new Error('No se recibieron los datos actualizados.');
        setProducts((current) =>
          current.map((product) => (product.id === data.id ? data : product)),
        );
      } else {
        const { data, error: insertError } = await supabase
          .from('products')
          .insert({ ...values, business_id: business.id })
          .select('id, name, description, price, image_url, active')
          .single();

        if (insertError) throw insertError;
        if (!data) throw new Error('No se recibieron los datos del producto.');
        setProducts((current) => [data, ...current]);
      }

      setFormVisible(false);
      setEditingProduct(null);
    } catch (saveError) {
      console.error('Error al guardar el producto:', saveError);
      setError(
        'No se pudo guardar el producto. Comprueba tus permisos y vuelve a intentarlo.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleProduct(product: Product) {
    setChangingProductId(product.id);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('products')
        .update({ active: !product.active })
        .eq('id', product.id)
        .eq('business_id', business.id)
        .select('id, name, description, price, image_url, active')
        .single();

      if (updateError) throw updateError;
      if (!data) throw new Error('No se recibió el estado actualizado.');

      setProducts((current) =>
        current.map((item) => (item.id === data.id ? data : item)),
      );
    } catch (toggleError) {
      console.error('Error al cambiar el estado del producto:', toggleError);
      setError(
        'No se pudo cambiar el estado del producto. Comprueba tus permisos e inténtalo de nuevo.',
      );
    } finally {
      setChangingProductId(null);
    }
  }

  return (
    <View style={styles.content}>
      <BusinessButton
        label={formVisible ? 'Cancelar' : 'Añadir producto'}
        onPress={() => {
          if (formVisible) {
            setFormVisible(false);
            setEditingProduct(null);
            setError(null);
          } else {
            startNewProduct();
          }
        }}
        variant={formVisible ? 'secondary' : 'primary'}
      />

      {formVisible ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {editingProduct ? 'Editar producto' : 'Nuevo producto'}
          </Text>
          <View style={styles.form}>
            <BusinessTextField
              label="Nombre *"
              onChangeText={setName}
              value={name}
            />
            <BusinessTextField
              label="Descripción"
              multiline
              onChangeText={setDescription}
              value={description}
            />
            <BusinessTextField
              label="Precio (€)"
              keyboardType="decimal-pad"
              onChangeText={setPrice}
              placeholder="Por ejemplo, 12,50"
              value={price}
            />
            <BusinessTextField
              autoCapitalize="none"
              label="URL de imagen"
              keyboardType="url"
              onChangeText={setImageUrl}
              value={imageUrl}
            />
            <BusinessButton
              label={editingProduct ? 'Guardar producto' : 'Crear producto'}
              loading={saving}
              onPress={() => void saveProduct()}
            />
          </View>
        </View>
      ) : null}

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : products.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.emptyText}>Todavía no tienes productos.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {products.map((product) => (
            <View key={product.id} style={styles.card}>
              <View style={styles.productHeading}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text
                  style={[
                    styles.status,
                    product.active ? styles.active : styles.inactive,
                  ]}
                >
                  {product.active ? 'Activo' : 'Inactivo'}
                </Text>
              </View>
              {product.price !== null ? (
                <Text style={styles.detail}>{product.price} €</Text>
              ) : null}
              {product.description ? (
                <Text style={styles.detail}>{product.description}</Text>
              ) : null}
              <View style={styles.cardActions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={changingProductId !== null}
                  onPress={() => startEditingProduct(product)}
                  style={({ pressed }) => [
                    styles.textButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.textButtonLabel}>Editar</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={changingProductId !== null}
                  onPress={() => void toggleProduct(product)}
                  style={({ pressed }) => [
                    styles.textButton,
                    pressed && styles.pressed,
                  ]}
                >
                  {changingProductId === product.id ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Text style={styles.textButtonLabel}>
                      {product.active ? 'Desactivar' : 'Activar'}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function BusinessProductsScreen() {
  return (
    <BusinessPrivateScreen title="Productos">
      {(business) => <ProductManager business={business} />}
    </BusinessPrivateScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
  },
  form: {
    gap: 14,
  },
  error: {
    color: '#B42318',
    fontSize: 14,
    lineHeight: 20,
  },
  emptyText: {
    color: colors.secondaryText,
    fontSize: 14,
  },
  list: {
    gap: 12,
  },
  productHeading: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  productName: {
    color: colors.text,
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
  },
  status: {
    fontSize: 12,
    fontWeight: '700',
  },
  active: {
    color: colors.primary,
  },
  inactive: {
    color: colors.muted,
  },
  detail: {
    color: colors.secondaryText,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  cardActions: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 24,
    marginTop: 14,
    paddingTop: 12,
  },
  textButton: {
    minHeight: 36,
    justifyContent: 'center',
  },
  textButtonLabel: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
