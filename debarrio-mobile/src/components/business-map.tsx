import MapView, { Marker } from 'react-native-maps';
import { StyleSheet } from 'react-native';

import { colors } from '@/constants/theme';
import type { BusinessMapProps } from '@/components/business-map.types';

export function BusinessMap({
  businesses,
  center,
  userLocation,
  onSelectBusiness,
}: BusinessMapProps) {
  return (
    <MapView
      key={`${center.latitude},${center.longitude}`}
      initialRegion={{
        ...center,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      }}
      showsMyLocationButton={false}
      showsUserLocation={userLocation !== null}
      style={styles.map}
    >
      {businesses.map((business) => (
        <Marker
          key={business.id}
          coordinate={{
            latitude: business.latitude,
            longitude: business.longitude,
          }}
          description={
            [business.address, business.city].filter(Boolean).join(', ') ||
            'Toca para ver la ficha del comercio'
          }
          onPress={() => onSelectBusiness(business)}
          pinColor={colors.primary}
          title={business.name}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
