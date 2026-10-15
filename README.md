# DeBarrio

DeBarrio mantiene dos proyectos separados:

- `debarrio-mobile/`: aplicación nativa para iOS y Android, construida con Expo.
- `app/`: vista previa web independiente de la experiencia móvil.

## Aplicación móvil

```bash
cd debarrio-mobile
npm install
npx expo start
```

Escanea el código QR con Expo Go o abre la app en un simulador desde el menú de
Expo. Las instrucciones específicas están en
[`debarrio-mobile/README.md`](./debarrio-mobile/README.md).

## Vista previa web

```bash
npm install
npm run dev
```

La vista previa se sirve en [http://localhost:3000](http://localhost:3000).
