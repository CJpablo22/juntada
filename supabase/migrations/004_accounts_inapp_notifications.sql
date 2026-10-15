-- Cuentas tipo Instagram + notificaciones solo in-app (sin mails de eventos)

-- Perfil ampliado
alter table public.profiles
  add column if not exists username text,
  add column if not exists profile_complete boolean not null default false,
  add column if not exists instagram text,
  add column if not exists tiktok text,
  add column if not exists group_name_visibility jsonb not null default '{}'::jsonb;

create unique index if not exists profiles_username_lower_uidx
  on public.profiles (lower(username))
  where username is not null and username <> '';

-- Notificaciones: leídas in-app
alter table public.notification_events
  add column if not exists read_at timestamptz;

-- Encolar solo canal in_app (ya no email)
create or replace function public.enqueue_group_notifications(
  p_group_id uuid,
  p_event_type text,
  p_title text,
  p_body text,
  p_payload jsonb default '{}'::jsonb,
  p_exclude_self boolean default true
)
returns table (
  notification_id uuid,
  user_id uuid,
  email text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if not exists (
    select 1 from public.group_members m
    where m.group_id = p_group_id and m.user_id = auth.uid()
  ) then
    raise exception 'not a group member';
  end if;

  return query
  with targets as (
    select m.user_id, p.email
    from public.group_members m
    join public.profiles p on p.id = m.user_id
    where m.group_id = p_group_id
      and (not p_exclude_self or m.user_id <> auth.uid())
  ),
  inserted as (
    insert into public.notification_events (
      user_id, channel, event_type, title, body, payload, status
    )
    select
      t.user_id,
      'in_app',
      p_event_type,
      p_title,
      p_body,
      coalesce(p_payload, '{}'::jsonb),
      'unread'
    from targets t
    returning id, notification_events.user_id
  )
  select i.id, i.user_id, t.email
  from inserted i
  join targets t on t.user_id = i.user_id;
end;
$$;

grant execute on function public.enqueue_group_notifications(uuid, text, text, text, jsonb, boolean)
  to authenticated;

-- Marcar leídas (solo propias)
create or replace function public.mark_notifications_read(p_ids uuid[] default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update public.notification_events
  set
    status = 'read',
    read_at = coalesce(read_at, now())
  where user_id = auth.uid()
    and status = 'unread'
    and (p_ids is null or id = any (p_ids));
end;
$$;

grant execute on function public.mark_notifications_read(uuid[]) to authenticated;

-- Username disponible
create or replace function public.is_username_available(p_username text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select length(trim(p_username)) >= 3
    and trim(p_username) ~ '^[a-zA-Z0-9._]+$'
    and not exists (
      select 1 from public.profiles
      where lower(username) = lower(trim(p_username))
        and (auth.uid() is null or id <> auth.uid())
    );
$$;

grant execute on function public.is_username_available(text) to anon, authenticated;

-- Login: resolver email desde @usuario
create or replace function public.login_email_for_username(p_username text)
returns text
language sql
security definer
set search_path = public
as $$
  select email
  from public.profiles
  where lower(username) = lower(trim(p_username))
    and email is not null
  limit 1;
$$;

grant execute on function public.login_email_for_username(text) to anon, authenticated;

-- Trigger nuevo usuario: aceptar username desde metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  provider text;
  display_name text;
  uname text;
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

  uname := nullif(lower(trim(coalesce(new.raw_user_meta_data->>'username', ''))), '');
  display_name := coalesce(
    nullif(new.raw_user_meta_data->>'name', ''),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    uname,
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Alguien'
  );

  insert into public.profiles (id, name, username, email, phone, auth_provider, profile_complete)
  values (
    new.id,
    display_name,
    uname,
    nullif(lower(new.email), ''),
    nullif(new.phone, ''),
    provider,
    false
  )
  on conflict (id) do update set
    email = coalesce(excluded.email, public.profiles.email),
    phone = coalesce(excluded.phone, public.profiles.phone),
    username = coalesce(excluded.username, public.profiles.username),
    auth_provider = excluded.auth_provider,
    updated_at = now();

  return new;
end;
$$;
