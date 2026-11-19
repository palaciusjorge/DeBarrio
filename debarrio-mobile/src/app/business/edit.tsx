import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BusinessButton } from '@/components/business/BusinessButton';
import { BusinessPrivateScreen } from '@/components/business/BusinessPrivateScreen';
import { BusinessTextField } from '@/components/business/BusinessTextField';
import { colors } from '@/constants/theme';
import {
  ownedBusinessColumns,
  type OwnedBusiness,
  useAuth,
} from '@/contexts/AuthContext';
import { emailPattern } from '@/lib/auth/validation';
import { isValidLatitude, isValidLongitude } from '@/lib/coordinates';
import { supabase } from '@/lib/supabase/client';

function optionalValue(value: string) {
  return value.trim() || null;
}

function parseCoordinate(value: string) {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return null;
  return /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized)
    ? Number(normalized)
    : NaN;
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
  const savedContact = useRef({
    phone: optionalValue(business.phone ?? ''),
    email: optionalValue(business.email ?? ''),
  });
  const [website, setWebsite] = useState(business.website ?? '');
  const [latitude, setLatitude] = useState(String(business.latitude ?? ''));
  const [longitude, setLongitude] = useState(String(business.longitude ?? ''));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function saveBusiness() {
    if (saving) return;
    setSaved(false);

    const normalizedName = name.trim();
    const publicPhone = optionalValue(phone);
    const publicEmail = optionalValue(email);
    const phoneChanged = publicPhone !== savedContact.current.phone;
    const emailChanged = publicEmail !== savedContact.current.email;
    const coordinatesChanged =
      latitude.trim() !== String(business.latitude ?? '') ||
      longitude.trim() !== String(business.longitude ?? '');
    const parsedLatitude = parseCoordinate(latitude);
    const parsedLongitude = parseCoordinate(longitude);

    if (!normalizedName) {
      setError('El nombre del comercio es obligatorio.');
      return;
    }

    if (emailChanged && publicEmail && !emailPattern.test(publicEmail)) {
      setError('Introduce un correo público válido.');
      return;
    }

    if (
      coordinatesChanged &&
      (parsedLatitude !== null || parsedLongitude !== null) &&
      (!isValidLatitude(parsedLatitude) || !isValidLongitude(parsedLongitude))
    ) {
      setError(
        'Introduce una latitud entre −90 y 90 y una longitud entre −180 y 180.',
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('businesses')
        .update({
          name: normalizedName,
          description: optionalValue(description),
          address: optionalValue(address),
          city: optionalValue(city),
          postal_code: optionalValue(postalCode),
          ...(phoneChanged ? { phone: publicPhone } : {}),
          ...(emailChanged ? { email: publicEmail } : {}),
          website: optionalValue(website),
          ...(coordinatesChanged
            ? { latitude: parsedLatitude, longitude: parsedLongitude }
            : {}),
        })
        .eq('id', business.id)
        .select(ownedBusinessColumns)
        .single();

      if (updateError) throw updateError;

      if (!data) {
        throw new Error('No se recibieron los datos actualizados del comercio.');
      }

      updateOwnedBusiness(data);
      savedContact.current = {
        phone: optionalValue(data.phone ?? ''),
        email: optionalValue(data.email ?? ''),
      };
      setPhone(data.phone ?? '');
      setEmail(data.email ?? '');
      setLatitude(String(data.latitude ?? ''));
      setLongitude(String(data.longitude ?? ''));
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
        editable={!saving}
        label="Teléfono público"
        keyboardType="phone-pad"
        onChangeText={setPhone}
        value={phone}
      />
      <BusinessTextField
        autoCapitalize="none"
        editable={!saving}
        label="Correo público"
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
      <BusinessTextField
        editable={!saving}
        label="Latitud"
        onChangeText={setLatitude}
        value={latitude}
      />
      <BusinessTextField
        editable={!saving}
        label="Longitud"
        onChangeText={setLongitude}
        value={longitude}
      />
      <Text style={styles.help}>
        Actualiza ambas coordenadas si cambia la ubicación del comercio.
        Deja ambos campos vacíos para ocultarlo del mapa.
      </Text>

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
      {(business) => <BusinessProfileForm business={business} key={business.id} />}
    </BusinessPrivateScreen>
  );
}

const styles = StyleSheet.create({
  help: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
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
