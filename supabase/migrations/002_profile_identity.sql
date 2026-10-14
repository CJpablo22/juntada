-- Identidad de login en profiles (email / teléfono / Apple) + insert propio
-- Ejecutar en SQL Editor si ya corriste 001_init.sql.

-- Permitir que el usuario cree su fila si el trigger no alcanzó
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check (id = auth.uid());

-- Al crear usuario en Auth: guardar email, teléfono y proveedor real
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  provider text;
  display_name text;
begin
  provider := coalesce(
    nullif(new.raw_app_meta_data->>'provider', ''),
    case
      when new.phone is not null and (new.email is null or new.email = '') then 'phone'
      else 'email'
    end
  );

  if provider = 'apple' then
    provider := 'apple';
  elsif provider in ('phone', 'sms') then
    provider := 'phone';
  else
    provider := 'email';
  end if;

  display_name := coalesce(
    nullif(new.raw_user_meta_data->>'name', ''),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    case when new.phone is not null then 'User ' || right(regexp_replace(new.phone, '\D', '', 'g'), 4) end,
    'Alguien'
  );

  insert into public.profiles (id, name, email, phone, auth_provider)
  values (
    new.id,
    display_name,
    nullif(lower(new.email), ''),
    nullif(new.phone, ''),
    provider
  )
  on conflict (id) do update set
    email = coalesce(excluded.email, public.profiles.email),
    phone = coalesce(excluded.phone, public.profiles.phone),
    auth_provider = excluded.auth_provider,
    updated_at = now();

  return new;
end;
$$;

-- Si el usuario cambia email/teléfono en Auth, reflejarlo en el perfil
create or replace function public.handle_user_identity_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  provider text;
begin
  provider := coalesce(
    nullif(new.raw_app_meta_data->>'provider', ''),
    case
      when new.phone is not null and (new.email is null or new.email = '') then 'phone'
      else 'email'
    end
  );

  if provider = 'apple' then
    provider := 'apple';
  elsif provider in ('phone', 'sms') then
    provider := 'phone';
  else
    provider := 'email';
  end if;

  update public.profiles
  set
    email = coalesce(nullif(lower(new.email), ''), email),
    phone = coalesce(nullif(new.phone, ''), phone),
    auth_provider = provider,
    updated_at = now()
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email, phone, raw_app_meta_data on auth.users
  for each row execute function public.handle_user_identity_updated();
