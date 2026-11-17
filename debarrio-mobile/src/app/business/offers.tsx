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

type Offer = {
  id: number;
  title: string;
  description: string | null;
  discount_percentage: number | null;
  start_date: string | null;
  end_date: string | null;
  active: boolean;
};

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function formatOfferDates(offer: Offer) {
  if (offer.start_date && offer.end_date) {
    return `${offer.start_date} – ${offer.end_date}`;
  }

  if (offer.start_date) return `Desde ${offer.start_date}`;
  if (offer.end_date) return `Hasta ${offer.end_date}`;
  return 'Sin límite de fechas';
}

function OfferManager({ business }: { business: OwnedBusiness }) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingOfferId, setChangingOfferId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    let active = true;

    async function loadOffers() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: loadError } = await supabase
          .from('offers')
          .select(
            'id, title, description, discount_percentage, start_date, end_date, active',
          )
          .eq('business_id', business.id)
          .order('created_at', { ascending: false });

        if (loadError) throw loadError;
        if (active) setOffers(data ?? []);
      } catch (loadError) {
        console.error('Error al cargar las ofertas del comercio:', loadError);
        if (active) {
          setError(
            'No se pudieron cargar las ofertas. Comprueba tu conexión e inténtalo de nuevo.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadOffers();

    return () => {
      active = false;
    };
  }, [business.id]);

  function startNewOffer() {
    setEditingOffer(null);
    setTitle('');
    setDescription('');
    setDiscountPercentage('');
    setStartDate('');
    setEndDate('');
    setError(null);
    setFormVisible(true);
  }

  function startEditingOffer(offer: Offer) {
    setEditingOffer(offer);
    setTitle(offer.title);
    setDescription(offer.description ?? '');
    setDiscountPercentage(
      offer.discount_percentage === null
        ? ''
        : String(offer.discount_percentage),
    );
    setStartDate(offer.start_date ?? '');
    setEndDate(offer.end_date ?? '');
    setError(null);
    setFormVisible(true);
  }

  async function saveOffer() {
    if (saving) return;

    const normalizedTitle = title.trim();
    const normalizedDiscount = discountPercentage.trim().replace(',', '.');
    const parsedDiscount =
      normalizedDiscount.length > 0 ? Number(normalizedDiscount) : null;
    const normalizedStartDate = startDate.trim();
    const normalizedEndDate = endDate.trim();

    if (!normalizedTitle) {
      setError('El título de la oferta es obligatorio.');
      return;
    }

    if (
      parsedDiscount !== null &&
      (!Number.isFinite(parsedDiscount) ||
        parsedDiscount < 0 ||
        parsedDiscount > 100)
    ) {
      setError('El descuento debe estar entre 0 y 100.');
      return;
    }

    if (
      (normalizedStartDate && !isValidDate(normalizedStartDate)) ||
      (normalizedEndDate && !isValidDate(normalizedEndDate))
    ) {
      setError('Introduce las fechas con el formato AAAA-MM-DD.');
      return;
    }

    if (
      normalizedStartDate &&
      normalizedEndDate &&
      normalizedEndDate < normalizedStartDate
    ) {
      setError('La fecha de fin no puede ser anterior a la fecha de inicio.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const values = {
        title: normalizedTitle,
        description: description.trim() || null,
        discount_percentage: parsedDiscount,
        start_date: normalizedStartDate || null,
        end_date: normalizedEndDate || null,
      };

      if (editingOffer) {
        const { data, error: updateError } = await supabase
          .from('offers')
          .update(values)
          .eq('id', editingOffer.id)
          .eq('business_id', business.id)
          .select(
            'id, title, description, discount_percentage, start_date, end_date, active',
          )
          .single();

        if (updateError) throw updateError;
        if (!data) throw new Error('No se recibieron los datos actualizados.');
        setOffers((current) =>
          current.map((offer) => (offer.id === data.id ? data : offer)),
        );
      } else {
        const { data, error: insertError } = await supabase
          .from('offers')
          .insert({ ...values, business_id: business.id })
          .select(
            'id, title, description, discount_percentage, start_date, end_date, active',
          )
          .single();

        if (insertError) throw insertError;
        if (!data) throw new Error('No se recibieron los datos de la oferta.');
        setOffers((current) => [data, ...current]);
      }

      setFormVisible(false);
      setEditingOffer(null);
    } catch (saveError) {
      console.error('Error al guardar la oferta:', saveError);
      setError(
        'No se pudo guardar la oferta. Comprueba tus permisos y vuelve a intentarlo.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleOffer(offer: Offer) {
    setChangingOfferId(offer.id);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('offers')
        .update({ active: !offer.active })
        .eq('id', offer.id)
        .eq('business_id', business.id)
        .select(
          'id, title, description, discount_percentage, start_date, end_date, active',
        )
        .single();

      if (updateError) throw updateError;
      if (!data) throw new Error('No se recibió el estado actualizado.');

      setOffers((current) =>
        current.map((item) => (item.id === data.id ? data : item)),
      );
    } catch (toggleError) {
      console.error('Error al cambiar el estado de la oferta:', toggleError);
      setError(
        'No se pudo cambiar el estado de la oferta. Comprueba tus permisos e inténtalo de nuevo.',
      );
    } finally {
      setChangingOfferId(null);
    }
  }

  return (
    <View style={styles.content}>
      <BusinessButton
        label={formVisible ? 'Cancelar' : 'Añadir oferta'}
        onPress={() => {
          if (formVisible) {
            setFormVisible(false);
            setEditingOffer(null);
            setError(null);
          } else {
            startNewOffer();
          }
        }}
        variant={formVisible ? 'secondary' : 'primary'}
      />

      {formVisible ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {editingOffer ? 'Editar oferta' : 'Nueva oferta'}
          </Text>
          <View style={styles.form}>
            <BusinessTextField
              label="Título *"
              onChangeText={setTitle}
              value={title}
            />
            <BusinessTextField
              label="Descripción"
              multiline
              onChangeText={setDescription}
              value={description}
            />
            <BusinessTextField
              label="Descuento (%)"
              keyboardType="decimal-pad"
              onChangeText={setDiscountPercentage}
              placeholder="Entre 0 y 100"
              value={discountPercentage}
            />
            <BusinessTextField
              label="Fecha de inicio"
              onChangeText={setStartDate}
              placeholder="AAAA-MM-DD"
              value={startDate}
            />
            <BusinessTextField
              label="Fecha de fin"
              onChangeText={setEndDate}
              placeholder="AAAA-MM-DD"
              value={endDate}
            />
            <BusinessButton
              label={editingOffer ? 'Guardar oferta' : 'Crear oferta'}
              loading={saving}
              onPress={() => void saveOffer()}
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
      ) : offers.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.emptyText}>Todavía no tienes ofertas.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {offers.map((offer) => (
            <View key={offer.id} style={styles.card}>
              <View style={styles.offerHeading}>
                <Text style={styles.offerTitle}>{offer.title}</Text>
                <Text
                  style={[
                    styles.status,
                    offer.active ? styles.active : styles.inactive,
                  ]}
                >
                  {offer.active ? 'Activa' : 'Inactiva'}
                </Text>
              </View>
              {offer.discount_percentage !== null ? (
                <Text style={styles.detail}>
                  {offer.discount_percentage}% de descuento
                </Text>
              ) : null}
              {offer.description ? (
                <Text style={styles.detail}>{offer.description}</Text>
              ) : null}
              <Text style={styles.detail}>{formatOfferDates(offer)}</Text>
              <View style={styles.cardActions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={changingOfferId !== null}
                  onPress={() => startEditingOffer(offer)}
                  style={({ pressed }) => [
                    styles.textButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.textButtonLabel}>Editar</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={changingOfferId !== null}
                  onPress={() => void toggleOffer(offer)}
                  style={({ pressed }) => [
                    styles.textButton,
                    pressed && styles.pressed,
                  ]}
                >
                  {changingOfferId === offer.id ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Text style={styles.textButtonLabel}>
                      {offer.active ? 'Desactivar' : 'Activar'}
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

export default function BusinessOffersScreen() {
  return (
    <BusinessPrivateScreen title="Ofertas">
      {(business) => <OfferManager business={business} />}
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
  offerHeading: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  offerTitle: {
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
