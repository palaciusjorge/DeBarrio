-- Require both business ownership and the business role for private
-- management access. Public catalog policies remain unchanged.

DROP POLICY IF EXISTS "Owners can update own businesses"
ON public.businesses;

CREATE POLICY "Owners can update own businesses"
ON public.businesses
FOR UPDATE
TO authenticated
USING (
    owner_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = auth.uid()
          AND role = 'business'
    )
)
WITH CHECK (
    owner_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = auth.uid()
          AND role = 'business'
    )
);

DROP POLICY IF EXISTS "Owners can delete own businesses"
ON public.businesses;

CREATE POLICY "Owners can delete own businesses"
ON public.businesses
FOR DELETE
TO authenticated
USING (
    owner_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = auth.uid()
          AND role = 'business'
    )
);

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
        JOIN public.users ON users.id = businesses.owner_id
        WHERE businesses.id = products.business_id
          AND businesses.owner_id = auth.uid()
          AND users.role = 'business'
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
        JOIN public.users ON users.id = businesses.owner_id
        WHERE businesses.id = products.business_id
          AND businesses.owner_id = auth.uid()
          AND users.role = 'business'
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
        JOIN public.users ON users.id = businesses.owner_id
        WHERE businesses.id = products.business_id
          AND businesses.owner_id = auth.uid()
          AND users.role = 'business'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.businesses
        JOIN public.users ON users.id = businesses.owner_id
        WHERE businesses.id = products.business_id
          AND businesses.owner_id = auth.uid()
          AND users.role = 'business'
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
        JOIN public.users ON users.id = businesses.owner_id
        WHERE businesses.id = products.business_id
          AND businesses.owner_id = auth.uid()
          AND users.role = 'business'
    )
);

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
        JOIN public.users ON users.id = businesses.owner_id
        WHERE businesses.id = offers.business_id
          AND businesses.owner_id = auth.uid()
          AND users.role = 'business'
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
        JOIN public.users ON users.id = businesses.owner_id
        WHERE businesses.id = offers.business_id
          AND businesses.owner_id = auth.uid()
          AND users.role = 'business'
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
        JOIN public.users ON users.id = businesses.owner_id
        WHERE businesses.id = offers.business_id
          AND businesses.owner_id = auth.uid()
          AND users.role = 'business'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.businesses
        JOIN public.users ON users.id = businesses.owner_id
        WHERE businesses.id = offers.business_id
          AND businesses.owner_id = auth.uid()
          AND users.role = 'business'
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
        JOIN public.users ON users.id = businesses.owner_id
        WHERE businesses.id = offers.business_id
          AND businesses.owner_id = auth.uid()
          AND users.role = 'business'
    )
);

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
        JOIN public.users ON users.id = businesses.owner_id
        WHERE businesses.id = business_categories.business_id
          AND businesses.owner_id = auth.uid()
          AND users.role = 'business'
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
        JOIN public.users ON users.id = businesses.owner_id
        WHERE businesses.id = business_categories.business_id
          AND businesses.owner_id = auth.uid()
          AND users.role = 'business'
    )
);
