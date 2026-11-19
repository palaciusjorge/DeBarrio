# Supabase – Base de datos de DeBarrio

Esta carpeta contiene los scripts SQL para configurar la base de datos de **DeBarrio**, una aplicación móvil desarrollada con Expo y React Native para descubrir negocios locales, consultar sus productos y ofertas y conectar usuarios con comercios de proximidad.

La base de datos utiliza **PostgreSQL** y **Supabase Auth** para la autenticación.

## Estructura de archivos

| Archivo | Descripción |
|---|---|
| `001_initial_schema.sql` | Crea las seis tablas, relaciones, restricciones e índices. |
| `002_seed_data.sql` | Inserta las ocho categorías iniciales. |
| `003_rls_policies.sql` | Configura permisos SQL, políticas Row Level Security (RLS) y triggers de seguridad. |
| `004_restrict_user_profile_update.sql` | Limita las columnas de perfil que puede actualizar un usuario. |
| `005_business_management_role_policies.sql` | Exige propiedad y rol `business` para gestionar datos privados del comercio. |
| `006_self_service_business_registration.sql` | Permite que una cuenta autenticada dé de alta su propio comercio con una categoría y datos públicos opcionales. |

## Requisitos previos

- Proyecto creado en Supabase.
- Supabase Auth habilitado.
- Acceso al SQL Editor con permisos para crear tablas, funciones, triggers y políticas.

## Instalación desde cero

En un proyecto Supabase nuevo, ejecutar los archivos desde el **SQL Editor**, en este orden:

1. `001_initial_schema.sql`: crea las seis tablas principales, sus relaciones, restricciones e índices.
2. `002_seed_data.sql`: inserta las ocho categorías iniciales.
3. `003_rls_policies.sql`: activa RLS, concede los permisos mínimos necesarios y crea las políticas y triggers.
4. `004_restrict_user_profile_update.sql`: restringe las columnas editables del perfil.
5. `005_business_management_role_policies.sql`: limita la gestión privada al propietario cuyo perfil mantiene el rol `business`.
6. `006_self_service_business_registration.sql`: activa el alta de comercios desde la aplicación.

> **Importante:** `001_initial_schema.sql` está diseñado para una base de datos nueva. No debe ejecutarse sobre una base de datos que ya tenga estas tablas. El script de políticas puede volver a ejecutarse para aplicar o actualizar las políticas definidas en él.

## Modelo de datos

- **users:** perfil y rol de cada usuario, vinculado mediante UUID a Supabase Auth.
- **categories:** categorías disponibles para clasificar negocios.
- **businesses:** información de cada negocio y su propietario.
- **business_categories:** relación muchos a muchos entre negocios y categorías.
- **products:** productos asociados a cada negocio.
- **offers:** ofertas y descuentos publicados por los negocios.

Las relaciones se implementan mediante claves foráneas y eliminaciones en cascada cuando corresponde.

## Seguridad y control de acceso (RLS)

RLS está habilitado en las seis tablas. Los permisos SQL (`GRANT`) determinan qué operaciones puede solicitar cada rol de Supabase; las políticas RLS determinan sobre qué filas se permiten esas operaciones. Ambas capas son necesarias.

### Lectura pública

Los roles `anon` y `authenticated` pueden consultar:

- Todas las categorías.
- Todos los negocios registrados.
- Las asociaciones entre negocios y categorías.
- Solo los productos con `active = true`.
- Solo las ofertas activas cuya fecha de inicio ya haya llegado y cuya fecha de fin siga vigente. Una fecha `NULL` indica que ese extremo no tiene límite.

Esto permite mostrar el catálogo sin exigir una sesión. La política pública no permite consultar productos u ofertas inactivos.

### Perfiles de usuario

- Un usuario autenticado puede leer únicamente su propio perfil (`users.id = auth.uid()`).
- Puede actualizar su propio perfil, pero no insertar perfiles directamente desde la aplicación.
- Un trigger crea automáticamente el perfil en `public.users` al registrarse en Supabase Auth.
- El rol inicial asignado por el trigger es `user`.
- Los roles de la API tienen bloqueada la edición directa de `role`. La función `register_own_business` asigna el rol al crear una ficha propia tras autenticar la cuenta. Los metadatos del registro solo determinan la navegación de la app.
- Tras iniciar sesión, la app lee el perfil propio para obtener el rol y, si es `business`, busca un negocio asociado mediante `businesses.owner_id`. El acceso al panel desde Ajustes y la validación de la pantalla son controles de interfaz; no sustituyen las políticas RLS.

### Propiedad y gestión de negocios

- Las inserciones directas requieren el rol `business` y `owner_id = auth.uid()`. Para el alta inicial, `register_own_business` toma el propietario de la sesión y guarda la ficha, su categoría y el rol en una sola transacción.
- Solo un propietario cuyo perfil mantenga el rol `business` puede actualizar o eliminar su negocio.
- Los negocios se pueden leer públicamente; la lectura pública no concede permisos de modificación.

### Productos, ofertas y categorías de negocio

- Un propietario con rol `business` puede consultar todos los productos y ofertas de sus negocios, incluidos los inactivos o fuera de fecha.
- Puede insertar, actualizar y eliminar productos y ofertas únicamente si pertenecen a uno de sus negocios y conserva el rol `business`.
- Puede asignar o retirar categorías únicamente de sus propios negocios mientras conserve ese rol.
- Los usuarios públicos solo ven los productos activos y las ofertas activas y vigentes, según las reglas indicadas anteriormente.

Las políticas de lectura pública y las políticas de lectura del propietario son permisivas y se combinan mediante OR: el propietario con rol `business` conserva acceso a sus elementos inactivos sin hacerlos públicos. Las operaciones de escritura siguen sujetas a sus políticas de propiedad y rol.

## Matriz resumida de acceso

| Tabla | Anónimo (`anon`) | Usuario autenticado (`authenticated`) |
|---|---|---|
| `users` | Sin acceso | Leer y actualizar solo su perfil |
| `categories` | Leer todas | Leer todas |
| `businesses` | Leer todos | Leer todos; gestionar solo los propios si tiene rol `business` |
| `business_categories` | Leer todas | Leer todas; asignar/eliminar solo en negocios propios con rol `business` |
| `products` | Leer activos | Leer activos; consultar todos y gestionar los propios con rol `business` |
| `offers` | Leer activas y vigentes | Leer activas/vigentes; consultar todas y gestionar las propias con rol `business` |

## Verificación recomendada

Después de ejecutar `003_rls_policies.sql`, `004_restrict_user_profile_update.sql` y `005_business_management_role_policies.sql`, comprobar en Supabase:

1. En **Authentication / Policies** o en el editor SQL, que RLS está habilitado en las seis tablas.
2. Que existen las políticas de lectura pública para categorías, negocios, relaciones, productos activos y ofertas vigentes.
3. Que las políticas de gestión exigen la propiedad del negocio y el rol `business`.
4. Probar las consultas desde una sesión sin autenticar y desde dos cuentas autenticadas distintas.
5. Confirmar que una cuenta propietaria no puede modificar datos de un negocio que pertenece a la otra cuenta.

### Confirmación de correo en la aplicación

Si la confirmación por correo está habilitada, el registro pide al usuario
que abra el enlace enviado por Supabase. Añade `debarrio://auth/callback` a
**Redirect URLs** en Authentication para los builds de desarrollo y
producción. Para Expo Go o web, permite también la URL de retorno
`/auth/callback` generada para ese entorno. Si el proyecto permite el alta
sin confirmación, la app continúa con la sesión devuelta por Supabase.

La pantalla `/auth/callback` intercambia el código o los tokens recibidos,
activa la sesión y muestra el resultado. El trigger `on_auth_user_created`
crea el perfil en `public.users` al insertar el registro en `auth.users`; la
app no inserta una segunda fila.

La existencia de las políticas no sustituye estas pruebas funcionales con los roles reales de la aplicación.

## Datos de prueba

Los negocios, productos y ofertas utilizados durante el desarrollo se mantienen separados de los datos iniciales de instalación, para evitar que información ficticia se confunda con datos reales.

Con la migración `006` aplicada, elige **Comercio** al crear la cuenta o ve a
**Ajustes → Dar de alta mi comercio** desde una cuenta existente. Introduce el
nombre y la categoría. Puedes añadir el teléfono y el correo que quieras
publicar en la ficha. Después encontrarás el panel en **Ajustes → Mi negocio**.
Si el comercio ya está creado, su titular puede editar sus datos desde el
panel. Las vinculaciones de fichas existentes se gestionan desde el Dashboard.

Desde el panel, guarda un cambio de perfil con latitud y longitud válidas,
y crea un producto y una oferta vigente. Comprueba desde una sesión
anónima o de usuario normal que la ficha y el mapa reflejan los cambios,
y que el producto y la oferta desaparecen de la ficha tras desactivarlos
desde la cuenta propietaria.

## Mantenimiento

- Mantener estos scripts sincronizados con el esquema y las políticas desplegadas en Supabase.
- Documentar cambios posteriores mediante nuevas migraciones o scripts SQL numerados.
- No incluir credenciales privadas en el repositorio. La clave publicable de Supabase puede utilizarse en el cliente, siempre acompañada de políticas RLS correctas; la clave `service_role` nunca debe exponerse en la aplicación.
- Revisar las políticas RLS al incorporar nuevas tablas, campos o funcionalidades.
- Las columnas `updated_at` tienen valor inicial por defecto; si se necesita que se actualicen automáticamente en cada modificación, habrá que añadir triggers específicos o actualizar el campo desde la aplicación.

---

**Proyecto:** DeBarrio  
**Tecnologías:** Supabase, PostgreSQL y Supabase Auth  
**Ubicación:** `debarrio-mobile/supabase/`
