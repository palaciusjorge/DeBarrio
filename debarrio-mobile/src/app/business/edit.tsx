import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BusinessButton } from '@/components/business/BusinessButton';
import { BusinessPrivateScreen } from '@/components/business/BusinessPrivateScreen';
import { BusinessTextField } from '@/components/business/BusinessTextField';
import { colors } from '@/constants/theme';
import {
  type OwnedBusiness,
  useAuth,
} from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';

function optionalValue(value: string) {
  return value.trim() || null;
}

function BusinessProfileForm({ business }: { business: OwnedBusiness }) {
  const { updateOwnedBusiness } = useAuth();
  const [name, setName] = useState(business.name);
  const [description, setDescription] = useState(business.description ?? '');
  const [address, setAddress] = useState(business.address ?? '');
  const [city, setCity] = useState(business.city ?? '');
  const [postalCode, setPostalCode] = useState(business.postal_code ?? '');
  const [phone, setPhone] = useState(business.phone ?? '');
  const [email, setEmail] = useState(business.email ?? '');
  const [website, setWebsite] = useState(business.website ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function saveBusiness() {
    if (saving) return;

    const normalizedName = name.trim();
    const normalizedEmail = email.trim();

    if (!normalizedName) {
      setError('El nombre del comercio es obligatorio.');
      setSaved(false);
      return;
    }

    if (
      normalizedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      setError('Introduce un correo electrónico válido.');
      setSaved(false);
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const { data, error: updateError } = await supabase
        .from('businesses')
        .update({
          name: normalizedName,
          description: optionalValue(description),
          address: optionalValue(address),
          city: optionalValue(city),
          postal_code: optionalValue(postalCode),
          phone: optionalValue(phone),
          email: optionalValue(normalizedEmail),
          website: optionalValue(website),
        })
        .eq('id', business.id)
        .select(
          'id, name, description, address, city, postal_code, phone, email, website',
        )
        .single();

      if (updateError) throw updateError;

      if (!data) {
        throw new Error('No se recibieron los datos actualizados del comercio.');
      }

      updateOwnedBusiness(data);
      setSaved(true);
    } catch (saveError) {
      console.error('Error al actualizar el comercio:', saveError);
      setError(
        'No se pudieron guardar los cambios. Comprueba tu conexión e inténtalo de nuevo.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.form}>
      <BusinessTextField
        label="Nombre del comercio *"
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
        label="Dirección"
        onChangeText={setAddress}
        value={address}
      />
      <BusinessTextField label="Ciudad" onChangeText={setCity} value={city} />
      <BusinessTextField
        label="Código postal"
        keyboardType="number-pad"
        onChangeText={setPostalCode}
        value={postalCode}
      />
      <BusinessTextField
        label="Teléfono"
        keyboardType="phone-pad"
        onChangeText={setPhone}
        value={phone}
      />
      <BusinessTextField
        autoCapitalize="none"
        label="Correo electrónico"
        keyboardType="email-address"
        onChangeText={setEmail}
        value={email}
      />
      <BusinessTextField
        autoCapitalize="none"
        label="Sitio web"
        keyboardType="url"
        onChangeText={setWebsite}
        value={website}
      />

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : saved ? (
        <Text accessibilityRole="text" style={styles.success}>
          Cambios guardados.
        </Text>
      ) : null}
      <BusinessButton
        label="Guardar cambios"
        loading={saving}
        onPress={() => void saveBusiness()}
      />
    </View>
  );
}

export default function EditBusinessScreen() {
  return (
    <BusinessPrivateScreen title="Editar perfil del comercio">
      {(business) => <BusinessProfileForm business={business} />}
    </BusinessPrivateScreen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  error: {
    color: '#B42318',
    fontSize: 14,
    lineHeight: 20,
  },
  success: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
