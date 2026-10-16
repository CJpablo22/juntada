-- Juntada · Web Push (gratis: VAPID + suscripciones; iOS PWA + Android Chrome)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (endpoint)
);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_select_own" on public.push_subscriptions;
create policy "push_select_own"
  on public.push_subscriptions for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "push_insert_own" on public.push_subscriptions;
create policy "push_insert_own"
  on public.push_subscriptions for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "push_update_own" on public.push_subscriptions;
create policy "push_update_own"
  on public.push_subscriptions for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "push_delete_own" on public.push_subscriptions;
create policy "push_delete_own"
  on public.push_subscriptions for delete to authenticated
  using (user_id = auth.uid());

comment on table public.push_subscriptions is
  'Suscripciones Web Push (PWA). Envío server-side con service role.';
