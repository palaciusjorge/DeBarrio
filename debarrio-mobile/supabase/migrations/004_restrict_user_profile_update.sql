-- Restrict authenticated users to editable profile fields.
-- Users can update their own profile, but cannot change created_at.

REVOKE UPDATE ON TABLE public.users FROM authenticated;

GRANT UPDATE (
  name,
  surname,
  phone,
  location_city,
  location_latitude,
  location_longitude
)
ON TABLE public.users
TO authenticated;
