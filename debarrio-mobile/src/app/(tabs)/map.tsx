import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BusinessMap } from '@/components/business-map';
import type {
  Coordinate,
  MappableBusiness,
} from '@/components/business-map.types';
import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase/client';

type Business = {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
};

type LocationStatus = 'loading' | 'ready' | 'denied' | 'error';

function isValidCoordinate(
  latitude: number | null,
  longitude: number | null,
): latitude is number {
  return (
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function averageCoordinate(coordinates: Coordinate[]): Coordinate | null {
  if (coordinates.length === 0) return null;

  const total = coordinates.reduce(
    (sum, coordinate) => ({
      latitude: sum.latitude + coordinate.latitude,
      longitude: sum.longitude + coordinate.longitude,
    }),
    { latitude: 0, longitude: 0 },
  );

  return {
    latitude: total.latitude / coordinates.length,
    longitude: total.longitude / coordinates.length,
  };
}

async function fetchBusinesses(): Promise<Business[]> {
  const { data, error } = await supabase
    .from('businesses')
    .select('id, name, address, city, latitude, longitude')
    .order('name');

  if (error) throw error;
  return data ?? [];
}

async function getCurrentLocation(): Promise<Coordinate | null> {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (!permission.granted) return null;

  const currentPosition = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const { latitude, longitude } = currentPosition.coords;

  if (!isValidCoordinate(latitude, longitude)) {
    throw new Error('El dispositivo no ha devuelto una ubicación válida.');
  }

  return { latitude, longitude };
}

export default function MapScreen() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessesLoading, setBusinessesLoading] = useState(true);
  const [businessesError, setBusinessesError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [locationStatus, setLocationStatus] =
    useState<LocationStatus>('loading');
  const [locationError, setLocationError] = useState<string | null>(null);

  const loadBusinesses = useCallback(async () => {
    setBusinessesLoading(true);
    setBusinessesError(null);

    try {
      setBusinesses(await fetchBusinesses());
    } catch (error) {
      setBusinessesError(
        error instanceof Error
          ? error.message
          : 'No se han podido cargar los comercios.',
      );
    } finally {
      setBusinessesLoading(false);
    }
  }, []);

  const requestLocation = useCallback(async () => {
    setLocationStatus('loading');
    setLocationError(null);

    try {
      const location = await getCurrentLocation();
      if (!location) {
        setUserLocation(null);
        setLocationStatus('denied');
        return;
      }

      setUserLocation(location);
      setLocationStatus('ready');
    } catch (error) {
      setUserLocation(null);
      setLocationError(
        error instanceof Error
          ? error.message
          : 'No se ha podido obtener tu ubicación.',
      );
      setLocationStatus('error');
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadInitialBusinesses() {
      try {
        const data = await fetchBusinesses();
        if (active) {
          setBusinesses(data);
          setBusinessesError(null);
        }
      } catch (error) {
        if (active) {
          setBusinessesError(
            error instanceof Error
              ? error.message
              : 'No se han podido cargar los comercios.',
          );
        }
      } finally {
        if (active) setBusinessesLoading(false);
      }
    }

    void loadInitialBusinesses();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadInitialLocation() {
      try {
        const location = await getCurrentLocation();
        if (!active) return;

        if (!location) {
          setUserLocation(null);
          setLocationStatus('denied');
          return;
        }

        setUserLocation(location);
        setLocationStatus('ready');
      } catch (error) {
        if (active) {
          setUserLocation(null);
          setLocationError(
            error instanceof Error
              ? error.message
              : 'No se ha podido obtener tu ubicación.',
          );
          setLocationStatus('error');
        }
      }
    }

    void loadInitialLocation();
    return () => {
      active = false;
    };
  }, []);

  const locatedBusinesses = useMemo<MappableBusiness[]>(
    () =>
      businesses.filter(
        (business): business is MappableBusiness =>
          isValidCoordinate(business.latitude, business.longitude),
      ),
    [businesses],
  );
  const center =
    userLocation ??
    averageCoordinate(
      locatedBusinesses.map(({ latitude, longitude }) => ({
        latitude,
        longitude,
      })),
    );
  const mapCanRender = center !== null;

  const openBusiness = useCallback((business: MappableBusiness) => {
    router.push({
      pathname: '/business/[id]',
      params: { id: String(business.id) },
    });
  }, []);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Mapa</Text>
        <Text style={styles.subtitle}>
          {locatedBusinesses.length} de {businesses.length} comercios con
          ubicación
        </Text>
      </View>

      {locationStatus === 'denied' ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            No tenemos permiso para usar tu ubicación. El mapa se centra en los
            comercios disponibles.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void requestLocation()}
            style={styles.noticeAction}
          >
            <Text style={styles.noticeActionText}>Volver a solicitar</Text>
          </Pressable>
        </View>
      ) : null}

      {locationStatus === 'error' ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            {locationError ?? 'No se ha podido obtener tu ubicación.'} El mapa
            se centra en los comercios disponibles.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void requestLocation()}
            style={styles.noticeAction}
          >
            <Text style={styles.noticeActionText}>Intentar de nuevo</Text>
          </Pressable>
        </View>
      ) : null}

      {businessesError ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            No se han podido cargar los comercios: {businessesError}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void loadBusinesses()}
            style={styles.noticeAction}
          >
            <Text style={styles.noticeActionText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

      {businesses.length > locatedBusinesses.length ? (
        <View style={styles.coordinatesNotice}>
          <Text style={styles.coordinatesNoticeText}>
            {businesses.length - locatedBusinesses.length}{' '}
            {businesses.length - locatedBusinesses.length === 1
              ? 'comercio no tiene coordenadas válidas'
              : 'comercios no tienen coordenadas válidas'}{' '}
            y no aparece en el mapa.
          </Text>
        </View>
      ) : null}

      <View style={styles.mapContainer}>
        {businessesLoading && businesses.length === 0 ? (
          <View style={styles.message}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.messageText}>Cargando comercios...</Text>
          </View>
        ) : businessesError && businesses.length === 0 ? (
          <View style={styles.message}>
            <Text style={styles.messageTitle}>
              No se ha podido cargar el mapa
            </Text>
            <Text style={styles.messageText}>
              Comprueba tu conexión e inténtalo de nuevo.
            </Text>
          </View>
        ) : mapCanRender ? (
          <>
            <BusinessMap
              businesses={locatedBusinesses}
              center={center}
              onSelectBusiness={openBusiness}
              userLocation={userLocation}
            />
            {businessesLoading && businesses.length === 0 ? (
              <View style={styles.emptyMapNotice}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={styles.emptyMapText}>
                  Cargando comercios...
                </Text>
              </View>
            ) : null}
            {!businessesLoading &&
            !businessesError &&
            locatedBusinesses.length === 0 ? (
              <View style={styles.emptyMapNotice}>
                <Text style={styles.emptyMapTitle}>
                  Todavía no hay comercios ubicados
                </Text>
                <Text style={styles.emptyMapText}>
                  Cuando un comercio añada sus coordenadas, aparecerá aquí.
                </Text>
              </View>
            ) : null}
          </>
        ) : locationStatus === 'loading' || businessesLoading ? (
          <View style={styles.message}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.messageText}>
              Buscando comercios y tu ubicación...
            </Text>
          </View>
        ) : (
          <View style={styles.message}>
            <Text style={styles.messageTitle}>
              No hay ubicaciones disponibles
            </Text>
            <Text style={styles.messageText}>
              No hay comercios con coordenadas y no hemos podido centrar el
              mapa en tu posición.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void requestLocation()}
              style={styles.primaryAction}
            >
              <Text style={styles.primaryActionText}>
                Intentar obtener mi ubicación
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  coordinatesNotice: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  coordinatesNoticeText: {
    color: colors.muted,
    fontSize: 13,
  },
  emptyMapNotice: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    left: 16,
    padding: 16,
    position: 'absolute',
    right: 16,
    top: 16,
  },
  emptyMapText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  emptyMapTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingBottom: 14,
    paddingTop: 10,
  },
  mapContainer: {
    backgroundColor: colors.surfaceMuted,
    flex: 1,
    overflow: 'hidden',
  },
  message: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  messageText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 10,
    textAlign: 'center',
  },
  messageTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  notice: {
    backgroundColor: colors.selected,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  noticeAction: {
    alignSelf: 'flex-start',
    marginTop: 7,
    paddingVertical: 3,
  },
  noticeActionText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  noticeText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  primaryAction: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryActionText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 4,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
  },
});
