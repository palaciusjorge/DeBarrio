
-- =====================================================
-- 003_rls_policies.sql
-- Seguridad y permisos de acceso de DeBarrio
-- =====================================================


-- =====================================================
-- 1. ACTIVAR ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;


-- =====================================================
-- 2. PERMISOS DE LA DATA API
-- Principio de minimo privilegio
-- =====================================================

-- Retirar permisos anteriores de anon y authenticated.
REVOKE ALL PRIVILEGES ON TABLE
    public.users,
    public.categories,
    public.businesses,
    public.business_categories,
    public.products,
    public.offers
FROM anon, authenticated;

-- Lectura publica del contenido de DeBarrio.
GRANT SELECT ON TABLE
    public.categories,
    public.businesses,
    public.business_categories,
    public.products,
    public.offers
TO anon, authenticated;

-- Los usuarios autenticados pueden consultar y actualizar
-- exclusivamente su propio perfil mediante las politicas RLS.
GRANT SELECT, UPDATE
ON TABLE public.users
TO authenticated;

-- Gestion de negocios propios.
GRANT INSERT, UPDATE, DELETE
ON TABLE public.businesses
TO authenticated;

-- Gestion de productos propios.
GRANT INSERT, UPDATE, DELETE
ON TABLE public.products
TO authenticated;

-- Gestion de ofertas propias.
GRANT INSERT, UPDATE, DELETE
ON TABLE public.offers
TO authenticated;

-- Asignar y retirar categorias de negocios propios.
GRANT INSERT, DELETE
ON TABLE public.business_categories
TO authenticated;


-- =====================================================
-- 3. CREACION AUTOMATICA DE PERFILES
-- Cada nuevo registro en Supabase Auth genera
-- automaticamente un perfil en public.users.
-- El rol inicial siempre sera 'user'.
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.users (
        id,
        name,
        surname,
        role
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'name', 'Usuario'),
        NEW.raw_user_meta_data ->> 'surname',
        'user'
    );

    RETURN NEW;
END;
$$;

-- Evitar que la funcion pueda invocarse directamente
-- desde los roles publicos de la aplicacion.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- Crear el trigger de registro automatico.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();


-- =====================================================
-- 4. SEGURIDAD DE LA TABLA USERS
-- =====================================================

-- Cada usuario puede consultar unicamente su perfil.
DROP POLICY IF EXISTS "Users can read own profile"
ON public.users;

CREATE POLICY "Users can read own profile"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());


-- Cada usuario puede modificar unicamente su perfil.
DROP POLICY IF EXISTS "Users can update own profile"
ON public.users;

CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());


-- Impedir que un usuario autenticado cambie el rol
-- de cualquier perfil mediante la aplicacion.
CREATE OR REPLACE FUNCTION public.prevent_user_role_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.role IS DISTINCT FROM OLD.role
       AND auth.uid() IS NOT NULL THEN
        RAISE EXCEPTION 'Users cannot change their own role';
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_user_role_change() FROM PUBLIC;

DROP TRIGGER IF EXISTS prevent_user_role_change_trigger
ON public.users;

CREATE TRIGGER prevent_user_role_change_trigger
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.prevent_user_role_change();


-- =====================================================
-- 5. SEGURIDAD DE LA TABLA BUSINESSES
-- Solo los propietarios con rol 'business'
-- pueden registrar negocios.
-- =====================================================

DROP POLICY IF EXISTS "Owners can insert own businesses"
ON public.businesses;

CREATE POLICY "Owners can insert own businesses"
ON public.businesses
FOR INSERT
TO authenticated
WITH CHECK (
    owner_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = auth.uid()
          AND role = 'business'
    )
);


DROP POLICY IF EXISTS "Owners can update own businesses"
ON public.businesses;

CREATE POLICY "Owners can update own businesses"
ON public.businesses
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());


DROP POLICY IF EXISTS "Owners can delete own businesses"
ON public.businesses;

CREATE POLICY "Owners can delete own businesses"
ON public.businesses
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());


-- =====================================================
-- 6. SEGURIDAD DE LA TABLA PRODUCTS
-- Los propietarios solo pueden gestionar productos
-- pertenecientes a sus propios negocios.
-- =====================================================

-- Permitir al propietario consultar tambien sus
-- productos inactivos.
DROP POLICY IF EXISTS "Owners can read own products"
ON public.products;

CREATE POLICY "Owners can read own products"
ON public.products
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.businesses
        WHERE businesses.id = products.business_id
          AND businesses.owner_id = auth.uid()
    )
);


DROP POLICY IF EXISTS "Owners can insert own products"
ON public.products;

CREATE POLICY "Owners can insert own products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.businesses
        WHERE businesses.id = products.business_id
          AND businesses.owner_id = auth.uid()
    )
);


DROP POLICY IF EXISTS "Owners can update own products"
ON public.products;

CREATE POLICY "Owners can update own products"
ON public.products
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.businesses
        WHERE businesses.id = products.business_id
          AND businesses.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.businesses
        WHERE businesses.id = products.business_id
          AND businesses.owner_id = auth.uid()
    )
);


DROP POLICY IF EXISTS "Owners can delete own products"
ON public.products;

CREATE POLICY "Owners can delete own products"
ON public.products
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.businesses
        WHERE businesses.id = products.business_id
          AND businesses.owner_id = auth.uid()
    )
);


-- =====================================================
-- 7. SEGURIDAD DE LA TABLA OFFERS
-- Los propietarios solo pueden gestionar ofertas
-- pertenecientes a sus propios negocios.
-- =====================================================

-- Permitir al propietario consultar tambien sus
-- ofertas inactivas.
DROP POLICY IF EXISTS "Owners can read own offers"
ON public.offers;

CREATE POLICY "Owners can read own offers"
ON public.offers
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.businesses
        WHERE businesses.id = offers.business_id
          AND businesses.owner_id = auth.uid()
    )
);


DROP POLICY IF EXISTS "Owners can insert own offers"
ON public.offers;

CREATE POLICY "Owners can insert own offers"
ON public.offers
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.businesses
        WHERE businesses.id = offers.business_id
          AND businesses.owner_id = auth.uid()
    )
);


DROP POLICY IF EXISTS "Owners can update own offers"
ON public.offers;

CREATE POLICY "Owners can update own offers"
ON public.offers
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.businesses
        WHERE businesses.id = offers.business_id
          AND businesses.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.businesses
        WHERE businesses.id = offers.business_id
          AND businesses.owner_id = auth.uid()
    )
);


DROP POLICY IF EXISTS "Owners can delete own offers"
ON public.offers;

CREATE POLICY "Owners can delete own offers"
ON public.offers
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.businesses
        WHERE businesses.id = offers.business_id
          AND businesses.owner_id = auth.uid()
    )
);


-- =====================================================
-- 8. SEGURIDAD DE BUSINESS_CATEGORIES
-- Los propietarios solo pueden asignar o retirar
-- categorias de sus propios negocios.
-- =====================================================

DROP POLICY IF EXISTS "Owners can insert own business categories"
ON public.business_categories;

CREATE POLICY "Owners can insert own business categories"
ON public.business_categories
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.businesses
        WHERE businesses.id = business_categories.business_id
          AND businesses.owner_id = auth.uid()
    )
);


DROP POLICY IF EXISTS "Owners can delete own business categories"
ON public.business_categories;

CREATE POLICY "Owners can delete own business categories"
ON public.business_categories
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.businesses
        WHERE businesses.id = business_categories.business_id
          AND businesses.owner_id = auth.uid()
    )
);


-- =====================================================
-- FIN DE LAS POLITICAS DE SEGURIDAD DE DEBARRIO
-- =====================================================
