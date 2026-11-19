begin;

-- The API roles may edit profile fields but may not assign their own role.
-- A trusted database function can assign it as part of creating a business.
create or replace function public.prevent_user_role_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if new.role is distinct from old.role
       and current_user in ('anon', 'authenticated') then
        raise exception 'Users cannot change their own role';
    end if;
    return new;
end;
$$;

create or replace function public.register_own_business(
    p_name text,
    p_category_id bigint,
    p_phone text default null,
    p_email text default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
    account_id uuid := auth.uid();
    account_role text;
    business_id bigint;
    business_name text := nullif(btrim(p_name), '');
    public_phone text := nullif(btrim(p_phone), '');
    public_email text := nullif(btrim(p_email), '');
begin
    if account_id is null then
        raise exception using errcode = '42501',
            message = 'Inicia sesión para dar de alta tu comercio.';
    end if;

    -- Serialize simultaneous submissions by the same account.
    select role into account_role
      from public.users
      where id = account_id
      for update;

    if not found then
        raise exception using errcode = '42501',
            message = 'No se ha encontrado tu perfil. Vuelve a iniciar sesión.';
    end if;

    select id into business_id
      from public.businesses
      where owner_id = account_id
      order by id
      limit 1;

    if found then
        if account_role = 'business' then
            return business_id;
        end if;

        raise exception using errcode = '42501',
            message = 'Ya tienes un comercio vinculado. Revisa el acceso a esa ficha antes de crear otra.';
    end if;

    if business_name is null then
        raise exception using errcode = '22023',
            message = 'Introduce el nombre del comercio.';
    end if;

    if not exists (select 1 from public.categories where id = p_category_id) then
        raise exception using errcode = '22023',
            message = 'Selecciona una categoría disponible.';
    end if;

    if public_email is not null and public_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
        raise exception using errcode = '22023',
            message = 'Introduce un correo público válido.';
    end if;

    insert into public.businesses (owner_id, name, phone, email)
      values (account_id, business_name, public_phone, public_email)
      returning id into business_id;

    insert into public.business_categories (business_id, category_id)
      values (business_id, p_category_id);

    update public.users set role = 'business'
      where id = account_id and role = 'user';

    return business_id;
end;
$$;

revoke all on function public.register_own_business(text, bigint, text, text)
    from public, anon, authenticated;
grant execute on function public.register_own_business(text, bigint, text, text)
    to authenticated;

notify pgrst, 'reload schema';

commit;
