-- Juntada · schema inicial (Supabase / Postgres)
-- Ejecutar en SQL Editor del proyecto free. Idempotente a nivel de create if not exists.

create extension if not exists "pgcrypto";

-- Perfil de app (1:1 con auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  country text not null default 'ES',
  province text not null default '',
  city text not null default '',
  neighborhood text,
  address_line text,
  floor_unit text,
  postal_code text,
  group_location_visibility jsonb not null default '{}'::jsonb,
  email text,
  phone text,
  auth_provider text not null default 'email',
  avatar_hue int not null default 180,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'friends',
  invite_code text not null unique,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  type text not null,
  title text not null,
  notes text not null default '',
  movie_venue text,
  places jsonb not null default '[]'::jsonb,
  address text,
  proposed_by uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending',
  timing text not null default 'catalog',
  tags text[] not null default '{}',
  votes jsonb not null default '{}'::jsonb,
  revealed boolean not null default false,
  soft_veto_user_ids uuid[] not null default '{}',
  done_rating int,
  done_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text not null default '',
  public_visible boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  idea_id uuid references public.ideas (id) on delete set null,
  title text not null,
  amount_cents int not null check (amount_cents >= 0),
  paid_by uuid not null references public.profiles (id) on delete cascade,
  split_between uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.point_events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta int not null,
  reason text not null default '',
  at timestamptz not null default now()
);

-- Cola de notificaciones: email ahora; WhatsApp / push = canales futuros
create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  channel text not null default 'email', -- email | whatsapp | push (pendientes)
  event_type text not null,
  title text not null,
  body text not null default '',
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending', -- pending | sent | failed | skipped
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists ideas_group_id_idx on public.ideas (group_id);
create index if not exists expenses_group_id_idx on public.expenses (group_id);
create index if not exists notification_events_status_idx on public.notification_events (status);

-- Perfil automático al registrarse (email / teléfono / Apple)
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.ideas enable row level security;
alter table public.reviews enable row level security;
alter table public.expenses enable row level security;
alter table public.point_events enable row level security;
alter table public.notification_events enable row level security;

-- Policies básicas: miembro del grupo ve/escribe lo del grupo; cada uno su perfil
create policy "profiles_select_authenticated"
  on public.profiles for select to authenticated using (true);
create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "groups_select_member"
  on public.groups for select to authenticated
  using (
    exists (
      select 1 from public.group_members m
      where m.group_id = id and m.user_id = auth.uid()
    )
  );
create policy "groups_insert_auth"
  on public.groups for insert to authenticated
  with check (created_by = auth.uid());
create policy "groups_update_member"
  on public.groups for update to authenticated
  using (
    exists (
      select 1 from public.group_members m
      where m.group_id = id and m.user_id = auth.uid()
    )
  );

create policy "members_select_same_group"
  on public.group_members for select to authenticated
  using (
    exists (
      select 1 from public.group_members m
      where m.group_id = group_members.group_id and m.user_id = auth.uid()
    )
  );
create policy "members_insert_self_or_creator"
  on public.group_members for insert to authenticated
  with check (user_id = auth.uid());

create policy "ideas_member_all"
  on public.ideas for all to authenticated
  using (
    exists (
      select 1 from public.group_members m
      where m.group_id = ideas.group_id and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.group_members m
      where m.group_id = ideas.group_id and m.user_id = auth.uid()
    )
  );

create policy "reviews_select"
  on public.reviews for select to authenticated using (true);
create policy "reviews_insert_own"
  on public.reviews for insert to authenticated
  with check (user_id = auth.uid());

create policy "expenses_member_all"
  on public.expenses for all to authenticated
  using (
    exists (
      select 1 from public.group_members m
      where m.group_id = expenses.group_id and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.group_members m
      where m.group_id = expenses.group_id and m.user_id = auth.uid()
    )
  );

create policy "points_member_select"
  on public.point_events for select to authenticated
  using (
    exists (
      select 1 from public.group_members m
      where m.group_id = point_events.group_id and m.user_id = auth.uid()
    )
  );
create policy "points_member_insert"
  on public.point_events for insert to authenticated
  with check (
    exists (
      select 1 from public.group_members m
      where m.group_id = point_events.group_id and m.user_id = auth.uid()
    )
  );

create policy "notifications_own"
  on public.notification_events for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Unirse por código (aunque aún no seas miembro)
create or replace function public.join_group_by_code(code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  select id into gid from public.groups
  where upper(invite_code) = upper(trim(code))
  limit 1;
  if gid is null then
    raise exception 'invalid code';
  end if;
  insert into public.group_members (group_id, user_id)
  values (gid, auth.uid())
  on conflict do nothing;
  return gid;
end;
$$;

grant execute on function public.join_group_by_code(text) to authenticated;

-- Lectura de grupo por invite (solo metadatos mínimos vía RPC si hace falta)
create or replace function public.peek_group_by_code(code text)
returns table (id uuid, name text, kind text)
language sql
security definer
set search_path = public
as $$
  select g.id, g.name, g.kind
  from public.groups g
  where upper(g.invite_code) = upper(trim(code))
  limit 1;
$$;

grant execute on function public.peek_group_by_code(text) to authenticated;
