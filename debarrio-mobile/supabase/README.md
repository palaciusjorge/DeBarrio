# Supabase – Base de datos de DeBarrio

Esta carpeta contiene los scripts SQL para configurar la base de datos de **DeBarrio**, una aplicación móvil desarrollada con Expo y React Native para descubrir negocios locales, consultar sus productos y ofertas y conectar usuarios con comercios de proximidad.

La base de datos utiliza **PostgreSQL** y **Supabase Auth** para la autenticación.

## Estructura de archivos

| Archivo | Descripción |
|---|---|
| `001_initial_schema.sql` | Crea las seis tablas, relaciones, restricciones e índices. |
| `002_seed_data.sql` | Inserta las ocho categorías iniciales. |
| `003_rls_policies.sql` | Configura permisos SQL, políticas Row Level Security (RLS) y triggers de seguridad. |

## Requisitos previos

- Proyecto creado en Supabase.
- Supabase Auth habilitado.
- Acceso al SQL Editor con permisos para crear tablas, funciones, triggers y políticas.

## Instalación desde cero

En un proyecto Supabase nuevo, ejecutar los archivos desde el **SQL Editor**, en este orden:

1. `001_initial_schema.sql`: crea las seis tablas principales, sus relaciones, restricciones e índices.
2. `002_seed_data.sql`: inserta las ocho categorías iniciales.
3. `003_rls_policies.sql`: activa RLS, concede los permisos mínimos necesarios y crea las políticas y triggers.

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
- Solo las ofertas activas cuya fecha de inicio no haya llegado y cuya fecha de fin no haya pasado. Si una fecha es `NULL`, se interpreta como que no existe límite para ese extremo.

Esto permite mostrar el catálogo sin exigir una sesión. La política pública no permite consultar productos u ofertas inactivos.

### Perfiles de usuario

- Un usuario autenticado puede leer únicamente su propio perfil (`users.id = auth.uid()`).
- Puede actualizar su propio perfil, pero no insertar perfiles directamente desde la aplicación.
- Un trigger crea automáticamente el perfil en `public.users` al registrarse en Supabase Auth.
- El rol inicial asignado por el trigger es `user`.
- Un trigger impide que una sesión autenticada cambie el campo `role`. La promoción a rol `business` debe realizarse mediante un proceso administrativo o controlado, nunca confiando en un valor enviado libremente por el cliente.

### Propiedad y gestión de negocios

- Solo un usuario con rol `business` puede insertar un negocio y debe establecer `owner_id = auth.uid()`.
- Un propietario puede actualizar o eliminar únicamente los negocios cuyo `owner_id` coincida con su UUID.
- Los negocios se pueden leer públicamente; la lectura pública no concede permisos de modificación.

### Productos, ofertas y categorías de negocio

- Un propietario puede consultar todos los productos y ofertas de sus negocios, incluidos los inactivos o fuera de fecha.
- Puede insertar, actualizar y eliminar productos y ofertas únicamente si pertenecen a uno de sus negocios.
- Puede asignar o retirar categorías únicamente de sus propios negocios.
- Los usuarios públicos solo ven los productos activos y las ofertas activas y vigentes, según las reglas indicadas anteriormente.

Las políticas de lectura pública y las políticas de lectura del propietario son permisivas y se combinan mediante OR: el propietario conserva acceso a sus elementos inactivos sin hacerlos públicos. Las operaciones de escritura siguen sujetas a sus políticas de propiedad.

## Matriz resumida de acceso

| Tabla | Anónimo (`anon`) | Usuario autenticado (`authenticated`) |
|---|---|---|
| `users` | Sin acceso | Leer y actualizar solo su perfil |
| `categories` | Leer todas | Leer todas |
| `businesses` | Leer todos | Leer todos; gestionar solo los propios si tiene rol `business` |
| `business_categories` | Leer todas | Leer todas; asignar/eliminar solo en negocios propios |
| `products` | Leer activos | Leer activos y todos los propios; gestionar solo los propios |
| `offers` | Leer activas y vigentes | Leer activas/vigentes y todas las propias; gestionar solo las propias |

## Verificación recomendada

Después de ejecutar `003_rls_policies.sql`, comprobar en Supabase:

1. En **Authentication / Policies** o en el editor SQL, que RLS está habilitado en las seis tablas.
2. Que existen las políticas de lectura pública para categorías, negocios, relaciones, productos activos y ofertas vigentes.
3. Que existen las políticas de propiedad para perfiles, negocios, productos, ofertas y asociaciones de categorías.
4. Probar las consultas desde una sesión sin autenticar y desde dos cuentas autenticadas distintas.
5. Confirmar que una cuenta propietaria no puede modificar datos de un negocio que pertenece a la otra cuenta.

### Confirmación de correo en la aplicación

El registro de la app envía como URL de retorno `debarrio://auth/callback` en
builds de desarrollo y producción. Añade esa dirección a la lista **Redirect
URLs** de Authentication en el Dashboard de Supabase y confirma que la
confirmación de correo está habilitada. Si se prueba desde Expo Go, la URL de
retorno generada para esa sesión de desarrollo también debe estar permitida;
puede cambiar entre sesiones.

La pantalla `/auth/callback` intercambia el código o los tokens recibidos,
activa la sesión y muestra el resultado. El trigger `on_auth_user_created`
crea el perfil en `public.users` al insertar el registro en `auth.users`; la
app no inserta una segunda fila.

La existencia de las políticas no sustituye estas pruebas funcionales con los roles reales de la aplicación.

## Datos de prueba

Los negocios, productos y ofertas utilizados durante el desarrollo se mantienen separados de los datos iniciales de instalación, para evitar que información ficticia se confunda con datos reales.

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
