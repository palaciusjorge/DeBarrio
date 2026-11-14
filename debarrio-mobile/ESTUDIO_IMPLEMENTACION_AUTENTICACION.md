# Estudio de implementación: autenticación

## Objetivo y conclusión

Preparar la autenticación de usuarios en DeBarrio sin alterar el catálogo
público. La base actual ya tiene los elementos de servidor necesarios para un
primer registro con correo y contraseña: cliente Supabase configurado, tabla de
perfiles vinculada a `auth.users`, creación automática del perfil y políticas
RLS para aislarlo. Lo que falta es el flujo de interfaz y la gestión central de
la sesión.

**Recomendación:** usar Supabase Auth como fuente de identidad y credenciales,
y `public.users` como perfil de la aplicación. Mantener el acceso al catálogo
sin iniciar sesión; pedir sesión solo para funciones que la necesiten.

## Estado actual comprobado

- [`src/lib/supabase/client.ts`](./src/lib/supabase/client.ts) crea un cliente
  con la URL y la clave publicable, mantiene la sesión y renueva tokens. En
  iOS y Android persiste con AsyncStorage; en web usa el almacenamiento
  predeterminado del cliente.
- [`src/app/_layout.tsx`](./src/app/_layout.tsx) inicia y detiene la renovación
  automática según el estado de la app en iOS y Android. No existe aún un
  proveedor de sesión, una escucha de cambios de autenticación ni una
  protección de rutas.
- [`src/app/(tabs)/settings.tsx`](./src/app/(tabs)/settings.tsx) es una pantalla
  provisional; no hay pantallas de registro, inicio de sesión o recuperación de
  contraseña.
- [`supabase/migrations/001_initial_schema.sql`](./supabase/migrations/001_initial_schema.sql)
  define `public.users.id` como UUID y clave foránea a `auth.users.id`, con
  borrado en cascada. El perfil contiene `name` obligatorio, `surname`,
  `phone`, ubicación y `role` (`user` o `business`).
- [`supabase/migrations/003_rls_policies.sql`](./supabase/migrations/003_rls_policies.sql)
  crea un perfil al insertar una identidad en `auth.users`. El trigger copia
  `name` y `surname` desde `raw_user_meta_data`, asigna `user` siempre y usa
  `"Usuario"` si falta el nombre. No copia teléfono.
- Las políticas permiten a cada persona leer y actualizar su perfil, pero no
  insertar perfiles desde la app. Un trigger impide cambiar `role` desde una
  sesión de usuario. El catálogo tiene políticas de lectura pública.
- [`app.json`](./app.json) ya declara el esquema de enlace `debarrio`, pero el
  cliente tiene `detectSessionInUrl: false` y no se encontró un manejador de
  callback de autenticación.
- El repositorio no permite confirmar si Supabase tiene activa la confirmación
  de correo ni qué plantillas, límites o proveedores están configurados en el
  Dashboard.

## Estructura recomendada

1. **Identidad y credenciales:** dejarlas en Supabase Auth (`auth.users`).
   Nunca almacenar contraseñas ni duplicar el correo como dato de perfil sin
   una necesidad de producto.
2. **Perfil de DeBarrio:** usar `public.users`, cuya clave `id` debe coincidir
   con `auth.users.id`. Consultar el perfil con la sesión actual; RLS ya limita
   la lectura al UUID autenticado.
3. **Datos de perfil en registro:** enviar `name` y, si el formulario lo
   solicita, `surname` como metadatos de Auth para que el trigger los copie.
   El teléfono puede seguir opcional, pero actualmente requeriría una
   actualización posterior del perfil o ampliar el trigger.
4. **Rol:** iniciar siempre como `user`. No aceptar ni enviar `role` desde el
   formulario. El alta o promoción a `business` necesita un proceso
   administrativo/controlado; hoy la app no puede autoasignarse ese rol.
5. **Sesión en la app:** exponer un estado compartido (`cargando`,
   `sin sesión`, `con sesión`) y el usuario actual. Inicializarlo desde la
   sesión persistida y mantenerlo sincronizado con los eventos de Supabase
   Auth. La navegación debe esperar a resolver el estado inicial para evitar
   mostrar por un instante la pantalla equivocada.

## Flujo propuesto

### Registro con correo y contraseña

1. Mostrar campos de nombre, apellido opcional, correo y contraseña; validar
   campos y coincidencia de contraseña en el cliente, sin sustituir la
   validación de Supabase.
2. Llamar a `supabase.auth.signUp` con correo, contraseña y metadatos `name` y
   `surname`. No insertar manualmente en `public.users`: el trigger ya lo hace.
3. Mostrar errores de Auth de forma comprensible (por ejemplo, correo ya
   registrado o contraseña no válida) sin indicar datos sensibles
   innecesariamente.
4. Tratar explícitamente ambos resultados: puede haber sesión inmediata o
   quedar pendiente de confirmación, según la configuración del proyecto. En
   el segundo caso, indicar que se revise el correo y ofrecer reenviar la
   confirmación.
5. Tras confirmarse/iniciarse sesión, obtener el usuario de Auth y cargar su
   perfil. Si falta el perfil, mostrar un error recuperable y registrar el
   problema; no crear un perfil alternativo en el cliente para ocultar el
   fallo del trigger.

### Inicio, cierre y recuperación

- El inicio de sesión utiliza correo y contraseña de Auth; al terminar se
  actualiza el estado compartido de sesión.
- El cierre llama a `supabase.auth.signOut`; la navegación vuelve al acceso
  público y cualquier estado de usuario se limpia.
- La recuperación de contraseña debe solicitarse con el flujo de Auth de
  Supabase. Antes de implementarla, configurar el enlace de retorno y su
  allow-list en Supabase.
- La confirmación de correo y la recuperación requieren decidir y probar el
  destino de los enlaces. El esquema `debarrio` existe, pero falta conectar y
  verificar el manejo de esos enlaces en la app. No asumir que `detectSessionInUrl`
  resuelve el flujo móvil.

## Navegación sugerida

- Mantener `(tabs)` y las pantallas del catálogo accesibles como invitado.
- Añadir pantallas de acceso/registro bajo un grupo de rutas de autenticación
  y presentar el acceso desde Ajustes o desde acciones que requieran cuenta.
- Proteger solo las rutas y operaciones que realmente requieran sesión. Si una
  persona sin sesión intenta abrir una de ellas, llevarla al acceso y devolverla
  a la acción original después de autenticarse.
- No ocultar la seguridad en la UI: las políticas RLS deben seguir siendo la
  autoridad para cada consulta y escritura.

## Puntos por resolver antes de implementar

1. **Confirmación de correo:** verificar en Supabase Dashboard si está activa.
   Diseñar y probar el estado pendiente, la plantilla y el enlace de retorno
   para desarrollo y producción.
2. **Metadatos y validación:** acordar si apellido es opcional, límites de
   contraseña y reglas de nombre. El trigger actual ya evita un perfil sin
   nombre, pero reemplaza un nombre omitido por `"Usuario"`.
3. **Permisos del perfil:** el `GRANT UPDATE` actual abarca todas las columnas.
   El trigger evita cambiar `role`, pero conviene restringir el permiso a
   columnas editables por el usuario (por ejemplo, nombre, apellido, teléfono
   y ubicación) o proteger también campos de sistema como `created_at`.
4. **Cuenta de negocio:** definir cómo se solicita y aprueba el rol
   `business`; no habilitar una selección de rol en el registro general.
5. **Borrado de cuenta:** el borrado en cascada de `auth.users` puede eliminar
   perfil, negocios y su contenido asociado. Definir consecuencias y
   confirmación antes de ofrecer esta función; no intentar borrar identidades
   de Auth directamente desde el cliente público.
6. **Pruebas con el proyecto Supabase:** comprobar registro, duplicados,
   correo pendiente/confirmado, persistencia tras reiniciar la app, cierre de
   sesión y aislamiento del perfil entre dos cuentas.

## Secuencia de implementación recomendada

1. Confirmar configuración de Auth y enlaces de retorno en Supabase.
2. Implementar proveedor/hook de sesión y estados de carga/error.
3. Añadir registro e inicio de sesión, enlazados con Auth y los metadatos que
   espera el trigger.
4. Conectar cierre de sesión, recuperación de contraseña y callbacks de
   confirmación según el alcance acordado.
5. Integrar acceso desde Ajustes y proteger únicamente las rutas privadas.
6. Ajustar el permiso de actualización del perfil en una migración nueva y
   probar RLS con cuentas distintas.

## Criterios de aceptación

- El catálogo público sigue funcionando sin sesión.
- Un registro válido crea una identidad en Auth y exactamente un perfil con el
  mismo UUID; el rol inicial es `user`.
- El resultado de registro informa correctamente si requiere confirmar el
  correo o si ya hay sesión.
- Al reiniciar la app, una sesión válida se restaura; al cerrar sesión deja de
  estar disponible.
- Una cuenta no puede leer ni modificar el perfil de otra, ni cambiar su rol.
- Los errores de Auth, de carga de perfil y de red se muestran; no se convierten
  en éxito ni en un perfil ficticio.
- No se expone una clave `service_role` en el cliente.

## Referencias

- [Supabase JS: sign up](https://supabase.com/docs/reference/javascript/auth-signup)
- [Supabase: React Native Auth](https://supabase.com/docs/guides/auth/quickstarts/react-native)
- [Supabase: sesiones](https://supabase.com/docs/guides/auth/sessions)
- [Supabase: URL de redirección](https://supabase.com/docs/guides/auth/redirect-urls)
