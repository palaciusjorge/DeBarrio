import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

import type { BusinessMapProps } from '@/components/business-map.types';

const leafletCssUrl =
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const leafletJsUrl = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const openStreetMapTiles =
  'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const openStreetMapAttribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function createMapHtml({
  businesses,
  centerLatitude,
  centerLongitude,
  userLocation,
}: Pick<BusinessMapProps, 'businesses' | 'userLocation'> & {
  centerLatitude: number;
  centerLongitude: number;
}) {
  const businessesJson = JSON.stringify(businesses).replace(/</g, '\\u003c');
  const userLocationJson = JSON.stringify(userLocation);

  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="${leafletCssUrl}" />
    <style>
      html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; }
      .business-marker {
        width: 22px;
        height: 22px;
        background: #315C45;
        border: 3px solid #fff;
        border-radius: 50% 50% 50% 0;
        box-shadow: 0 2px 5px rgba(0, 0, 0, .35);
        transform: rotate(-45deg);
      }
      .user-marker {
        width: 18px;
        height: 18px;
        background: #208AEF;
        border: 3px solid #fff;
        border-radius: 50%;
        box-shadow: 0 1px 5px rgba(0, 0, 0, .45);
      }
      .leaflet-control-attribution { font-size: 10px !important; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="${leafletJsUrl}"></script>
    <script>
      const businesses = ${businessesJson};
      const userLocation = ${userLocationJson};
      const map = L.map('map', { zoomControl: true }).setView(
        [${centerLatitude}, ${centerLongitude}],
        14
      );

      L.tileLayer('${openStreetMapTiles}', {
        attribution: '${openStreetMapAttribution}',
        maxZoom: 19,
        tileSize: 256
      }).addTo(map);

      const businessIcon = L.divIcon({
        className: '',
        html: '<div class="business-marker"></div>',
        iconSize: [28, 34],
        iconAnchor: [14, 30]
      });

      businesses.forEach((business) => {
        const marker = L.marker(
          [business.latitude, business.longitude],
          { icon: businessIcon }
        ).addTo(map);

        const label = document.createElement('span');
        label.textContent = business.name;
        marker.bindPopup(label);
        marker.on('click', () => {
          window.ReactNativeWebView.postMessage(String(business.id));
        });
      });

      if (userLocation) {
        L.marker([userLocation.latitude, userLocation.longitude], {
          icon: L.divIcon({
            className: '',
            html: '<div class="user-marker"></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          }),
          zIndexOffset: 1000
        }).addTo(map).bindPopup('Tu ubicación');
      }
    </script>
  </body>
</html>`;
}

export function BusinessMap({
  businesses,
  center,
  userLocation,
  onSelectBusiness,
}: BusinessMapProps) {
  const centerLatitude = center.latitude;
  const centerLongitude = center.longitude;
  const html = useMemo(
    () =>
      createMapHtml({
        businesses,
        centerLatitude,
        centerLongitude,
        userLocation,
      }),
    [
      businesses,
      centerLatitude,
      centerLongitude,
      userLocation,
    ],
  );

  return (
    <WebView
      bounces={false}
      javaScriptEnabled
      originWhitelist={['*']}
      onMessage={(event) => {
        const businessId = Number(event.nativeEvent.data);
        if (!Number.isSafeInteger(businessId)) return;

        const business = businesses.find((item) => item.id === businessId);
        if (business) onSelectBusiness(business);
      }}
      scrollEnabled={false}
      source={{ html }}
      style={styles.map}
    />
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
