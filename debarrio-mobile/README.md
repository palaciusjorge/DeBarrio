# DeBarrio

Aplicación para iOS y Android creada con Expo y Expo Router.

## Empezar

Configura las variables de Supabase antes de iniciar la app. Copia los valores
de `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en
`debarrio-mobile/.env.local`. Puedes usar `.env.example` como plantilla. La URL
debe ser la URL base del proyecto Supabase. No uses una `service_role` key en
la app móvil.

```bash
npm install
npx expo start
```

Abre el proyecto con Expo Go o un development build. Desde el menú de Expo
también se puede ejecutar la versión web con `w`.

## Mapa

En iOS y Android, la pestaña Mapa solicita permiso de ubicación en primer
plano, centra el mapa en la posición actual y muestra los comercios con
coordenadas válidas. Si se deniega el permiso, se centra en los comercios
disponibles. En web se muestra la lista de comercios en lugar del mapa nativo.

Expo Go no requiere configuración adicional. Para distribuir una build de
Android, configura una clave de Google Maps en
`android.config.googleMaps.apiKey` y restringe su uso a la aplicación. iOS usa
Apple Maps sin configuración adicional.

## Scripts

- `npm run android`: inicia Expo y abre Android.
- `npm run ios`: inicia Expo y abre iOS.
- `npm run web`: inicia la versión web de Expo.
- `npm run lint`: ejecuta ESLint mediante Expo.

Las pantallas y la navegación están en `src/app`; los componentes compartidos
están en `src/components`. El cliente de Supabase está en
`src/lib/supabase/client.ts`.
