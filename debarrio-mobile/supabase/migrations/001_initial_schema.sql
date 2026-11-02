
-- =====================================================
-- 001_initial_schema.sql
-- Esquema inicial de la base de datos de DeBarrio
-- Requiere un proyecto Supabase con Supabase Auth activo.
-- =====================================================


-- =====================================================
-- 1. TABLA USERS
-- Perfiles de usuario vinculados a Supabase Auth.
-- =====================================================

CREATE TABLE public.users (
    id uuid NOT NULL,
    name text NOT NULL,
    surname text,
    phone text,
    role text NOT NULL DEFAULT 'user',
    location_city text,
    location_latitude double precision,
    location_longitude double precision,
    created_at timestamp with time zone NOT NULL DEFAULT now(),

    CONSTRAINT users_pkey
        PRIMARY KEY (id),

    CONSTRAINT users_id_fkey
        FOREIGN KEY (id)
        REFERENCES auth.users (id)
        ON DELETE CASCADE,

    CONSTRAINT users_role_check
        CHECK (role IN ('user', 'business'))
);


-- =====================================================
-- 2. TABLA CATEGORIES
-- Categorías disponibles para clasificar negocios.
-- =====================================================

CREATE TABLE public.categories (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),

    CONSTRAINT categories_pkey
        PRIMARY KEY (id),

    CONSTRAINT categories_name_key
        UNIQUE (name)
);


-- =====================================================
-- 3. TABLA BUSINESSES
-- Información de los negocios registrados.
-- Cada negocio tiene un propietario.
-- =====================================================

CREATE TABLE public.businesses (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    owner_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    address text,
    city text,
    postal_code text,
    phone text,
    email text,
    website text,
    latitude double precision,
    longitude double precision,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),

    CONSTRAINT businesses_pkey
        PRIMARY KEY (id),

    CONSTRAINT businesses_owner_id_fkey
        FOREIGN KEY (owner_id)
        REFERENCES public.users (id)
        ON DELETE CASCADE
);


-- =====================================================
-- 4. TABLA BUSINESS_CATEGORIES
-- Relación muchos a muchos entre negocios y categorías.
-- Un negocio puede tener varias categorías y una
-- categoría puede estar asociada a varios negocios.
-- =====================================================

CREATE TABLE public.business_categories (
    business_id bigint NOT NULL,
    category_id bigint NOT NULL,

    CONSTRAINT business_categories_pkey
        PRIMARY KEY (business_id, category_id),

    CONSTRAINT business_categories_business_id_fkey
        FOREIGN KEY (business_id)
        REFERENCES public.businesses (id)
        ON DELETE CASCADE,

    CONSTRAINT business_categories_category_id_fkey
        FOREIGN KEY (category_id)
        REFERENCES public.categories (id)
        ON DELETE CASCADE
);


-- =====================================================
-- 5. TABLA PRODUCTS
-- Productos pertenecientes a cada negocio.
-- =====================================================

CREATE TABLE public.products (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    business_id bigint NOT NULL,
    name text NOT NULL,
    description text,
    price numeric,
    image_url text,
    active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),

    CONSTRAINT products_pkey
        PRIMARY KEY (id),

    CONSTRAINT products_business_id_fkey
        FOREIGN KEY (business_id)
        REFERENCES public.businesses (id)
        ON DELETE CASCADE
);


-- =====================================================
-- 6. TABLA OFFERS
-- Ofertas y descuentos publicados por los negocios.
-- =====================================================

CREATE TABLE public.offers (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    business_id bigint NOT NULL,
    title text NOT NULL,
    description text,
    discount_percentage numeric,
    start_date date,
    end_date date,
    active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),

    CONSTRAINT offers_pkey
        PRIMARY KEY (id),

    CONSTRAINT offers_business_id_fkey
        FOREIGN KEY (business_id)
        REFERENCES public.businesses (id)
        ON DELETE CASCADE,

    CONSTRAINT valid_discount
        CHECK (
            discount_percentage IS NULL
            OR (
                discount_percentage >= 0
                AND discount_percentage <= 100
            )
        ),

    CONSTRAINT valid_offer_dates
        CHECK (
            end_date IS NULL
            OR start_date IS NULL
            OR end_date >= start_date
        )
);


-- =====================================================
-- 7. INDICES
-- Mejoran el rendimiento de las consultas y relaciones.
-- =====================================================

CREATE INDEX businesses_owner_id_idx
    ON public.businesses (owner_id);

CREATE INDEX business_categories_category_id_idx
    ON public.business_categories (category_id);

CREATE INDEX products_business_id_idx
    ON public.products (business_id);

CREATE INDEX offers_business_id_idx
    ON public.offers (business_id);


-- =====================================================
-- FIN DEL ESQUEMA INICIAL DE DEBARRIO
-- =====================================================
