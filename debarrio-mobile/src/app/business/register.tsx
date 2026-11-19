import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BusinessButton } from '@/components/business/BusinessButton';
import { BusinessTextField } from '@/components/business/BusinessTextField';
import { colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { emailPattern } from '@/lib/auth/validation';
import { supabase } from '@/lib/supabase/client';

type Category = { id: number; name: string };

function BusinessRegistrationForm({ onRegistered }: { onRegistered: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadCategories() {
      try {
        const { data, error: loadError } = await supabase
          .from('categories')
          .select('id, name')
          .order('name');
        if (loadError) throw loadError;
        if (active) setCategories(data ?? []);
      } catch {
        if (active) setCategoryError(true);
      } finally {
        if (active) setLoadingCategories(false);
      }
    }

    void loadCategories();
    return () => {
      active = false;
    };
  }, [retry]);

  async function registerBusiness() {
    if (saving) return;

    const businessName = name.trim();
    const publicEmail = email.trim();
    if (!businessName || categoryId === null) {
      setError('Introduce el nombre del comercio y selecciona una categoría.');
      return;
    }
    if (publicEmail && !emailPattern.test(publicEmail)) {
      setError('Introduce un correo público válido.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const { error: registrationError } = await supabase.rpc('register_own_business', {
        p_name: businessName,
        p_category_id: categoryId,
        p_phone: phone.trim() || null,
        p_email: publicEmail || null,
      });
      if (registrationError) {
        switch (registrationError.code) {
          case 'PGRST202':
            setError('El alta de comercios aún no está habilitada en Supabase.');
            break;
          case '22023':
          case '42501':
            setError(registrationError.message);
            break;
          default:
            throw registrationError;
        }
        return;
      }

      onRegistered();
    } catch {
      setError('No se pudo dar de alta el comercio. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <BusinessTextField
        editable={!saving}
        label="Nombre del comercio"
        onChangeText={setName}
        value={name}
      />
      <View style={styles.categoryGroup}>
        <Text style={styles.label}>Categoría</Text>
        {loadingCategories ? (
          <ActivityIndicator color={colors.primary} />
        ) : categoryError || categories.length === 0 ? (
          <>
            <Text style={styles.help}>
              {categoryError ? 'No se pudieron cargar las categorías.' : 'Aún no hay categorías disponibles.'}
            </Text>
            <BusinessButton
              label="Reintentar"
              onPress={() => {
                setCategoryError(false);
                setLoadingCategories(true);
                setRetry((value) => value + 1);
              }}
              variant="secondary"
            />
          </>
        ) : (
          <View style={styles.categories}>
            {categories.map((category) => (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: category.id === categoryId, disabled: saving }}
                disabled={saving}
                key={category.id}
                onPress={() => setCategoryId(category.id)}
                style={[styles.category, category.id === categoryId && styles.selected]}
              >
                <Text style={styles.categoryLabel}>{category.name}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
      <Text style={styles.help}>
        El teléfono y el correo son opcionales y aparecerán en la ficha pública.
      </Text>
      <BusinessTextField
        editable={!saving}
        keyboardType="phone-pad"
        label="Teléfono público"
        onChangeText={setPhone}
        value={phone}
      />
      <BusinessTextField
        autoCapitalize="none"
        editable={!saving}
        keyboardType="email-address"
        label="Correo público"
        onChangeText={setEmail}
        value={email}
      />
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
      ) : null}
      <BusinessButton
        disabled={loadingCategories || categoryError || categories.length === 0}
        label="Dar de alta comercio"
        loading={saving}
        onPress={() => void registerBusiness()}
      />
    </>
  );
}

export default function RegisterBusinessScreen() {
  const { user, loading, profile, profileLoading, business, reloadProfile } = useAuth();

  if (!loading && !user) {
    return <Redirect href={{ pathname: '/login', params: { next: 'business' } }} />;
  }
  if (!loading && !profileLoading && business && profile?.id === user?.id) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.fill}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Dar de alta mi comercio</Text>
          {loading || profileLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : user && profile?.id === user.id ? (
            <BusinessRegistrationForm
              key={user.id}
              onRegistered={() => {
                reloadProfile();
                router.dismissTo('/(tabs)');
              }}
            />
          ) : (
            <>
              <Text accessibilityRole="alert" style={styles.error}>
                No se pudo cargar tu perfil.
              </Text>
              <BusinessButton label="Reintentar" onPress={reloadProfile} variant="secondary" />
            </>
          )}
          <BusinessButton
            label="Volver a Ajustes"
            variant="secondary"
            onPress={() => router.replace('/(tabs)/settings')}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  fill: { flex: 1 },
  content: { gap: 16, padding: 20 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  label: { color: colors.text, fontSize: 14, fontWeight: '600' },
  categoryGroup: { gap: 8 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  category: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
  },
  selected: { backgroundColor: colors.selected, borderColor: colors.primary },
  categoryLabel: { color: colors.text, fontSize: 14 },
  help: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  error: { color: '#B42318', fontSize: 14, lineHeight: 20 },
});
