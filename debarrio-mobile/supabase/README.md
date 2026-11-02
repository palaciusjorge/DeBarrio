# Supabase – Base de datos de DeBarrio

Esta carpeta contiene los scripts SQL necesarios para configurar e inicializar la base de datos de **DeBarrio**, una aplicación móvil desarrollada con Expo y React Native que permite descubrir negocios locales, consultar sus productos y ofertas, y facilitar la conexión entre usuarios y comercios de proximidad.

La base de datos utiliza **PostgreSQL**, gestionado a través de **Supabase**, que también proporciona los servicios de autenticación.

## Estructura de archivos

| Archivo | Descripción |
|---|---|
| `001_initial_schema.sql` | Crea las tablas, relaciones, restricciones e índices de la base de datos. |
| `002_seed_data.sql` | Inserta los datos iniciales necesarios, principalmente las categorías de negocios. |
| `003_rls_policies.sql` | Configura la seguridad mediante Row Level Security (RLS), permisos, políticas de acceso y triggers. |

## Requisitos previos

Antes de ejecutar los scripts es necesario disponer de:

- Un proyecto creado en Supabase.
- Supabase Auth habilitado.
- Acceso al SQL Editor del proyecto.

## Instalación desde cero

Para reproducir la estructura de la base de datos en un proyecto Supabase nuevo, los archivos deben ejecutarse desde el **SQL Editor**, respetando el siguiente orden:

1. **`001_initial_schema.sql`**: crea las seis tablas principales, sus claves primarias y foráneas, restricciones e índices.
2. **`002_seed_data.sql`**: introduce las ocho categorías iniciales de DeBarrio.
3. **`003_rls_policies.sql`**: establece los permisos, políticas RLS y triggers necesarios para controlar el acceso a los datos.

Los scripts deben ejecutarse en este orden porque cada fase depende de los elementos creados en la anterior.

> **Importante:** `001_initial_schema.sql` está diseñado para una base de datos nueva. No debe ejecutarse sobre una base de datos que ya tenga creadas estas tablas.

## Modelo de datos

La base de datos está organizada en seis tablas principales:

- **users:** almacena los perfiles de usuario y su rol dentro de la aplicación. Los identificadores están vinculados a Supabase Auth.
- **categories:** contiene las categorías disponibles para clasificar los negocios.
- **businesses:** almacena la información de los negocios registrados y su propietario.
- **business_categories:** establece la relación muchos a muchos entre negocios y categorías.
- **products:** contiene los productos asociados a cada negocio.
- **offers:** almacena las ofertas y descuentos publicados por los negocios.

Las relaciones entre las tablas utilizan claves foráneas y eliminación en cascada (`ON DELETE CASCADE`) cuando corresponde.

## Seguridad y control de acceso

La seguridad de la base de datos se configura mediante **Row Level Security (RLS)**.

El archivo `003_rls_policies.sql` establece las reglas de acceso para los distintos tipos de usuarios:

- Los usuarios pueden consultar su propio perfil y actualizar sus datos, sin modificar su rol desde la aplicación.
- Los negocios registrados pueden gestionar sus propios establecimientos.
- Los propietarios pueden crear, modificar y eliminar los productos y ofertas asociados a sus negocios.
- Los usuarios pueden consultar las categorías, los negocios y los contenidos públicos permitidos.
- Las operaciones sobre los datos privados quedan sujetas a las políticas de seguridad correspondientes.

Además, se incluye un trigger que crea automáticamente el perfil correspondiente en `public.users` cuando se registra un nuevo usuario mediante Supabase Auth.

## Datos de prueba

Los datos utilizados durante el desarrollo y las pruebas funcionales, como negocios de ejemplo, productos y ofertas, se mantienen separados de los datos iniciales de instalación.

De esta forma, la instalación de DeBarrio no incorpora información ficticia que pueda confundirse con datos reales.

## Notas de mantenimiento

- Los scripts SQL deben mantenerse sincronizados con la estructura real de la base de datos.
- Los cambios futuros en el modelo de datos deben documentarse mediante nuevas migraciones o scripts SQL numerados.
- Las claves y credenciales de Supabase no deben incluirse en estos archivos ni publicarse en el repositorio.
- Las políticas RLS deben revisarse cada vez que se incorporen nuevas funcionalidades o permisos.

---

**Proyecto:** DeBarrio  
**Tecnologías:** Supabase, PostgreSQL y Supabase Auth  
**Carpeta:** `supabase/`