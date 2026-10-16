-- Juntada · endurecer seguridad (perfiles, grupos, reviews, ideas, gastos, login)

-- ========== 1. Perfiles: no lectura global ==========
drop policy if exists "profiles_select_authenticated" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (id = auth.uid());

-- Pares del grupo: sin email/teléfono/redes; solo si comparten grupo
create or replace function public.get_peer_profiles(p_ids uuid[])
returns table (
  id uuid,
  name text,
  username text,
  country text,
  province text,
  city text,
  neighborhood text,
  address_line text,
  floor_unit text,
  postal_code text,
  group_location_visibility jsonb,
  group_name_visibility jsonb,
  profile_complete boolean,
  auth_provider text,
  avatar_hue int,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  return query
  select
    p.id,
    p.name,
    p.username,
    p.country,
    p.province,
    p.city,
    p.neighborhood,
    p.address_line,
    p.floor_unit,
    p.postal_code,
    p.group_location_visibility,
    coalesce(p.group_name_visibility, '{}'::jsonb),
    coalesce(p.profile_complete, false),
    p.auth_provider,
    p.avatar_hue,
    p.created_at
  from public.profiles p
  where p.id = any (p_ids)
    and p.id <> auth.uid()
    and exists (
      select 1
      from public.group_members mine
      join public.group_members peer
        on peer.group_id = mine.group_id
       and peer.user_id = p.id
      where mine.user_id = auth.uid()
    );
end;
$$;

revoke all on function public.get_peer_profiles(uuid[]) from public;
revoke all on function public.get_peer_profiles(uuid[]) from anon;
grant execute on function public.get_peer_profiles(uuid[]) to authenticated;

-- Login por username: solo service_role (API server). No filtrar email a anon.
revoke all on function public.login_email_for_username(text) from public;
revoke all on function public.login_email_for_username(text) from anon;
revoke all on function public.login_email_for_username(text) from authenticated;

-- ========== 2. Grupos: solo el dueño actualiza ==========
drop policy if exists "groups_update_member" on public.groups;

create policy "groups_update_owner"
  on public.groups for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- ========== 3. Reviews: miembro del grupo o públicas ==========
drop policy if exists "reviews_select" on public.reviews;

create policy "reviews_select_member_or_public"
  on public.reviews for select to authenticated
  using (
    public_visible = true
    or exists (
      select 1
      from public.ideas i
      join public.group_members m on m.group_id = i.group_id
      where i.id = reviews.idea_id
        and m.user_id = auth.uid()
    )
  );

-- ========== 4. Gastos: update/delete solo quien pagó o dueño del grupo ==========
-- (012 ya partió policies; re-creamos update/delete más estrictas)
drop policy if exists "expenses_update_member_hide_own_birthday" on public.expenses;
drop policy if exists "expenses_delete_member_hide_own_birthday" on public.expenses;

create policy "expenses_update_payer_or_owner"
  on public.expenses for update to authenticated
  using (
    exists (
      select 1 from public.group_members m
      where m.group_id = expenses.group_id and m.user_id = auth.uid()
    )
    and (
      expenses.idea_id is null
      or not exists (
        select 1 from public.ideas i
        where i.id = expenses.idea_id
          and i.type = 'birthday'
          and i.celebrant_member_id = auth.uid()
      )
    )
    and (
      paid_by = auth.uid()
      or exists (
        select 1 from public.groups g
        where g.id = expenses.group_id and g.created_by = auth.uid()
      )
    )
  )
  with check (
    exists (
      select 1 from public.group_members m
      where m.group_id = expenses.group_id and m.user_id = auth.uid()
    )
    and (
      expenses.idea_id is null
      or not exists (
        select 1 from public.ideas i
        where i.id = expenses.idea_id
          and i.type = 'birthday'
          and i.celebrant_member_id = auth.uid()
      )
    )
    and (
      paid_by = auth.uid()
      or exists (
        select 1 from public.groups g
        where g.id = expenses.group_id and g.created_by = auth.uid()
      )
    )
  );

create policy "expenses_delete_payer_or_owner"
  on public.expenses for delete to authenticated
  using (
    exists (
      select 1 from public.group_members m
      where m.group_id = expenses.group_id and m.user_id = auth.uid()
    )
    and (
      expenses.idea_id is null
      or not exists (
        select 1 from public.ideas i
        where i.id = expenses.idea_id
          and i.type = 'birthday'
          and i.celebrant_member_id = auth.uid()
      )
    )
    and (
      paid_by = auth.uid()
      or exists (
        select 1 from public.groups g
        where g.id = expenses.group_id and g.created_by = auth.uid()
      )
    )
  );

-- ========== 5. Ideas: proteger festejado / proposer; votos vía RPC ==========
create or replace function public.protect_idea_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rpc text := coalesce(current_setting('juntada.idea_rpc', true), '');
begin
  if TG_OP = 'UPDATE' then
    new.proposed_by := old.proposed_by;
    new.created_at := old.created_at;

    -- El festejado no puede tocar el vínculo de cumple
    if auth.uid() is not null
       and auth.uid() = old.celebrant_member_id
       and (
         new.celebrant_member_id is distinct from old.celebrant_member_id
         or new.type is distinct from old.type
         or new.celebrant_name is distinct from old.celebrant_name
       ) then
      raise exception 'celebrant cannot change birthday binding';
    end if;

    -- Solo el proposer puede cambiar celebrant_* una vez seteado
    if old.celebrant_member_id is not null
       and new.celebrant_member_id is distinct from old.celebrant_member_id
       and auth.uid() is distinct from old.proposed_by then
      raise exception 'only proposer can change celebrant';
    end if;

    -- Votos / revelado / veto solo por RPC dedicadas
    if new.votes is distinct from old.votes and v_rpc <> 'cast_vote' then
      raise exception 'use cast_vote rpc';
    end if;
    if new.revealed is distinct from old.revealed and v_rpc <> 'reveal_idea_votes' then
      raise exception 'use reveal_idea_votes rpc';
    end if;
    if new.soft_veto_user_ids is distinct from old.soft_veto_user_ids
       and v_rpc <> 'toggle_soft_veto' then
      raise exception 'use toggle_soft_veto rpc';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_idea_row on public.ideas;
create trigger trg_protect_idea_row
  before update on public.ideas
  for each row execute function public.protect_idea_row();

create or replace function public.cast_vote(p_idea_id uuid, p_score int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group uuid;
  v_timing text;
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_score < 1 or p_score > 5 then
    raise exception 'invalid score';
  end if;

  select group_id, timing, status into v_group, v_timing, v_status
  from public.ideas where id = p_idea_id;

  if v_group is null then
    raise exception 'idea not found';
  end if;
  if not exists (
    select 1 from public.group_members m
    where m.group_id = v_group and m.user_id = auth.uid()
  ) then
    raise exception 'not a group member';
  end if;
  if v_timing <> 'soon' or v_status in ('done', 'archived', 'in_progress') then
    raise exception 'voting not allowed';
  end if;

  perform set_config('juntada.idea_rpc', 'cast_vote', true);
  update public.ideas
  set votes = coalesce(votes, '{}'::jsonb) || jsonb_build_object(auth.uid()::text, p_score)
  where id = p_idea_id;
end;
$$;

create or replace function public.reveal_idea_votes(p_idea_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select group_id into v_group from public.ideas where id = p_idea_id;
  if v_group is null then
    raise exception 'idea not found';
  end if;
  if not exists (
    select 1 from public.group_members m
    where m.group_id = v_group and m.user_id = auth.uid()
  ) then
    raise exception 'not a group member';
  end if;

  perform set_config('juntada.idea_rpc', 'reveal_idea_votes', true);
  update public.ideas set revealed = true where id = p_idea_id;
end;
$$;

create or replace function public.toggle_soft_veto(p_idea_id uuid)
returns uuid[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group uuid;
  v_list uuid[];
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select group_id, soft_veto_user_ids into v_group, v_list
  from public.ideas where id = p_idea_id;

  if v_group is null then
    raise exception 'idea not found';
  end if;
  if not exists (
    select 1 from public.group_members m
    where m.group_id = v_group and m.user_id = v_uid
  ) then
    raise exception 'not a group member';
  end if;

  v_list := coalesce(v_list, '{}');
  if v_uid = any (v_list) then
    v_list := array_remove(v_list, v_uid);
  else
    v_list := array_append(v_list, v_uid);
  end if;

  perform set_config('juntada.idea_rpc', 'toggle_soft_veto', true);
  update public.ideas set soft_veto_user_ids = v_list where id = p_idea_id;
  return v_list;
end;
$$;

revoke all on function public.cast_vote(uuid, int) from public;
revoke all on function public.cast_vote(uuid, int) from anon;
grant execute on function public.cast_vote(uuid, int) to authenticated;

revoke all on function public.reveal_idea_votes(uuid) from public;
revoke all on function public.reveal_idea_votes(uuid) from anon;
grant execute on function public.reveal_idea_votes(uuid) to authenticated;

revoke all on function public.toggle_soft_veto(uuid) from public;
revoke all on function public.toggle_soft_veto(uuid) from anon;
grant execute on function public.toggle_soft_veto(uuid) to authenticated;

-- ========== 6. Rate limit avisos / peek invite ==========
create table if not exists public.security_rate_limits (
  bucket text not null,
  subject text not null,
  window_started timestamptz not null default now(),
  hit_count int not null default 1,
  primary key (bucket, subject)
);

alter table public.security_rate_limits enable row level security;
-- sin policies de acceso para authenticated: solo security definer

create or replace function public.check_rate_limit(
  p_bucket text,
  p_subject text,
  p_max int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.security_rate_limits%rowtype;
  v_now timestamptz := now();
begin
  select * into v_row
  from public.security_rate_limits
  where bucket = p_bucket and subject = p_subject
  for update;

  if not found then
    insert into public.security_rate_limits (bucket, subject, window_started, hit_count)
    values (p_bucket, p_subject, v_now, 1);
    return true;
  end if;

  if v_now - v_row.window_started > make_interval(secs => p_window_seconds) then
    update public.security_rate_limits
    set window_started = v_now, hit_count = 1
    where bucket = p_bucket and subject = p_subject;
    return true;
  end if;

  if v_row.hit_count >= p_max then
    return false;
  end if;

  update public.security_rate_limits
  set hit_count = hit_count + 1
  where bucket = p_bucket and subject = p_subject;
  return true;
end;
$$;

revoke all on function public.check_rate_limit(text, text, int, int) from public;
revoke all on function public.check_rate_limit(text, text, int, int) from anon;
grant execute on function public.check_rate_limit(text, text, int, int) to authenticated;

-- Wrap notify with rate limit (30 / 10 min por usuario+grupo)
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
declare
  v_idea_id uuid;
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

  if not public.check_rate_limit(
    'notify',
    auth.uid()::text || ':' || p_group_id::text,
    30,
    600
  ) then
    raise exception 'rate limited';
  end if;

  begin
    v_idea_id := nullif(p_payload->>'ideaId', '')::uuid;
  exception when others then
    v_idea_id := null;
  end;

  return query
  with targets as (
    select m.user_id, p.email
    from public.group_members m
    join public.profiles p on p.id = m.user_id
    where m.group_id = p_group_id
      and (not p_exclude_self or m.user_id <> auth.uid())
      and not (
        p_event_type = 'expense_added'
        and v_idea_id is not null
        and exists (
          select 1 from public.ideas i
          where i.id = v_idea_id
            and i.type = 'birthday'
            and i.celebrant_member_id = m.user_id
        )
      )
  ),
  inserted as (
    insert into public.notification_events (
      user_id, channel, event_type, title, body, payload, status
    )
    select
      t.user_id,
      'in_app',
      p_event_type,
      left(p_title, 200),
      left(coalesce(p_body, ''), 1000),
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

revoke all on function public.enqueue_group_notifications(uuid, text, text, text, jsonb, boolean) from public;
revoke all on function public.enqueue_group_notifications(uuid, text, text, text, jsonb, boolean) from anon;
grant execute on function public.enqueue_group_notifications(uuid, text, text, text, jsonb, boolean) to authenticated;

-- Rate limit peek / join (20 / 10 min)
create or replace function public.peek_group_by_code(code text)
returns table (id uuid, name text, kind text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not public.check_rate_limit('peek_invite', auth.uid()::text, 20, 600) then
    raise exception 'rate limited';
  end if;
  return query
  select g.id, g.name, g.kind
  from public.groups g
  where upper(g.invite_code) = upper(trim(code))
  limit 1;
end;
$$;

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
  if not public.check_rate_limit('join_invite', auth.uid()::text, 20, 600) then
    raise exception 'rate limited';
  end if;

  select g.id into gid
  from public.groups g
  where upper(g.invite_code) = upper(trim(code))
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

revoke all on function public.peek_group_by_code(text) from public;
revoke all on function public.peek_group_by_code(text) from anon;
grant execute on function public.peek_group_by_code(text) to authenticated;

revoke all on function public.join_group_by_code(text) from public;
revoke all on function public.join_group_by_code(text) from anon;
grant execute on function public.join_group_by_code(text) to authenticated;
