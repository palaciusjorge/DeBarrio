# DeBarrio para móvil

Aplicación nativa para iOS y Android creada con Expo y Expo Router. La web que
vive en la raíz del repositorio sigue siendo una vista previa independiente.

## Empezar

Configura las variables de Supabase antes de iniciar la app. Copia los valores
de `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` del
`.env.local` de la raíz a `debarrio-mobile/.env.local`, con los nombres
`EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Puedes usar
`.env.example` como plantilla. No uses una `service_role` key en la app móvil.
El cliente utiliza el origen del proyecto, aunque la URL de origen incluya una
ruta como `/rest/v1/`.

```bash
npm install
npx expo start
```

Abre el proyecto con Expo Go o un development build. Desde el menú de Expo
también se puede ejecutar la versión web con `w`.

## Scripts

- `npm run android`: inicia Expo y abre Android.
- `npm run ios`: inicia Expo y abre iOS.
- `npm run web`: inicia la versión web de Expo.
- `npm run lint`: ejecuta ESLint mediante Expo.

Las pantallas y la navegación están en `src/app`; los componentes compartidos
están en `src/components`. El cliente de Supabase está en
`src/lib/supabase/client.ts` y comparte el proyecto y el esquema existentes con
la aplicación web.
