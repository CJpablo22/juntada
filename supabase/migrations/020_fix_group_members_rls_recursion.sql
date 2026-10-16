-- Juntada · cortar recursión infinita en RLS de group_members
-- Error típico: "infinite recursion detected in policy for relation group_members"
-- Al insertar/leer ideas la policy de ideas consulta group_members, y esa policy
-- volvía a consultar group_members → loop.

-- Helper security definer: lee membresía SIN pasar por RLS
create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = p_group_id
      and user_id = auth.uid()
  );
$$;

revoke all on function public.is_group_member(uuid) from public;
revoke all on function public.is_group_member(uuid) from anon;
grant execute on function public.is_group_member(uuid) to authenticated;

-- ===== group_members: ya no se auto-referencia =====
drop policy if exists "members_select_own_or_peers" on public.group_members;
drop policy if exists "members_select_same_group" on public.group_members;

create policy "members_select_own_or_peers"
  on public.group_members for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_group_member(group_id)
  );

-- ===== ideas =====
drop policy if exists "ideas_member_all" on public.ideas;
create policy "ideas_member_all"
  on public.ideas for all to authenticated
  using (public.is_group_member(group_id))
  with check (public.is_group_member(group_id));

-- ===== groups =====
drop policy if exists "groups_select_member" on public.groups;
create policy "groups_select_member"
  on public.groups for select to authenticated
  using (public.is_group_member(id));

drop policy if exists "groups_update_member" on public.groups;
create policy "groups_update_member"
  on public.groups for update to authenticated
  using (public.is_group_member(id));

-- ===== point_events =====
drop policy if exists "points_member_select" on public.point_events;
create policy "points_member_select"
  on public.point_events for select to authenticated
  using (public.is_group_member(group_id));

drop policy if exists "points_member_insert" on public.point_events;
create policy "points_member_insert"
  on public.point_events for insert to authenticated
  with check (public.is_group_member(group_id));

-- ===== expenses: reescribir usando is_group_member (conserva privacidad cumple) =====
drop policy if exists "expenses_member_all" on public.expenses;
drop policy if exists "expenses_select_member_hide_own_birthday" on public.expenses;
drop policy if exists "expenses_insert_member_hide_own_birthday" on public.expenses;
drop policy if exists "expenses_update_payer_or_owner" on public.expenses;
drop policy if exists "expenses_delete_payer_or_owner" on public.expenses;
drop policy if exists "expenses_update_member_hide_own_birthday" on public.expenses;
drop policy if exists "expenses_delete_member_hide_own_birthday" on public.expenses;

create policy "expenses_select_member_hide_own_birthday"
  on public.expenses for select to authenticated
  using (
    public.is_group_member(group_id)
    and (
      idea_id is null
      or not exists (
        select 1 from public.ideas i
        where i.id = expenses.idea_id
          and i.type = 'birthday'
          and i.celebrant_member_id = auth.uid()
      )
    )
  );

create policy "expenses_insert_member_hide_own_birthday"
  on public.expenses for insert to authenticated
  with check (
    public.is_group_member(group_id)
    and (
      idea_id is null
      or not exists (
        select 1 from public.ideas i
        where i.id = expenses.idea_id
          and i.type = 'birthday'
          and i.celebrant_member_id = auth.uid()
      )
    )
  );

create policy "expenses_update_payer_or_owner"
  on public.expenses for update to authenticated
  using (
    public.is_group_member(group_id)
    and (
      paid_by = auth.uid()
      or exists (
        select 1 from public.groups g
        where g.id = expenses.group_id and g.created_by = auth.uid()
      )
    )
    and (
      idea_id is null
      or not exists (
        select 1 from public.ideas i
        where i.id = expenses.idea_id
          and i.type = 'birthday'
          and i.celebrant_member_id = auth.uid()
      )
    )
  )
  with check (
    public.is_group_member(group_id)
    and (
      idea_id is null
      or not exists (
        select 1 from public.ideas i
        where i.id = expenses.idea_id
          and i.type = 'birthday'
          and i.celebrant_member_id = auth.uid()
      )
    )
  );

create policy "expenses_delete_payer_or_owner"
  on public.expenses for delete to authenticated
  using (
    public.is_group_member(group_id)
    and (
      paid_by = auth.uid()
      or exists (
        select 1 from public.groups g
        where g.id = expenses.group_id and g.created_by = auth.uid()
      )
    )
    and (
      idea_id is null
      or not exists (
        select 1 from public.ideas i
        where i.id = expenses.idea_id
          and i.type = 'birthday'
          and i.celebrant_member_id = auth.uid()
      )
    )
  );

-- ===== insert_idea / insert_expense: usar helper =====
create or replace function public.insert_idea(p_idea jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_group uuid;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  v_id := nullif(p_idea->>'id', '')::uuid;
  v_group := nullif(p_idea->>'group_id', '')::uuid;

  if v_id is null then
    v_id := gen_random_uuid();
  end if;
  if v_group is null then
    raise exception 'invalid group_id';
  end if;

  if not public.is_group_member(v_group) then
    raise exception 'not a group member';
  end if;

  insert into public.ideas (
    id, group_id, type, title, notes, movie_venue,
    celebrant_name, celebrant_member_id, birthday_kind,
    places, address,
    scheduled_date, scheduled_time, duration_minutes, date_flexible,
    link, budget_note,
    proposed_by, status, timing, tags, votes, revealed,
    soft_veto_user_ids, created_at
  ) values (
    v_id,
    v_group,
    coalesce(nullif(p_idea->>'type', ''), 'plan'),
    coalesce(p_idea->>'title', ''),
    coalesce(p_idea->>'notes', ''),
    nullif(p_idea->>'movie_venue', ''),
    nullif(p_idea->>'celebrant_name', ''),
    nullif(p_idea->>'celebrant_member_id', '')::uuid,
    nullif(p_idea->>'birthday_kind', ''),
    coalesce(p_idea->'places', '[]'::jsonb),
    nullif(p_idea->>'address', ''),
    nullif(p_idea->>'scheduled_date', ''),
    nullif(p_idea->>'scheduled_time', ''),
    nullif(p_idea->>'duration_minutes', '')::int,
    coalesce((p_idea->>'date_flexible')::boolean, false),
    nullif(p_idea->>'link', ''),
    nullif(p_idea->>'budget_note', ''),
    v_uid,
    coalesce(nullif(p_idea->>'status', ''), 'pending'),
    coalesce(nullif(p_idea->>'timing', ''), 'catalog'),
    coalesce(
      array(select jsonb_array_elements_text(coalesce(p_idea->'tags', '[]'::jsonb))),
      '{}'::text[]
    ),
    coalesce(p_idea->'votes', '{}'::jsonb),
    coalesce((p_idea->>'revealed')::boolean, false),
    coalesce(
      array(
        select (jsonb_array_elements_text(coalesce(p_idea->'soft_veto_user_ids', '[]'::jsonb)))::uuid
      ),
      '{}'::uuid[]
    ),
    coalesce((p_idea->>'created_at')::timestamptz, now())
  )
  on conflict (id) do update set
    title = excluded.title,
    notes = excluded.notes,
    places = excluded.places,
    address = excluded.address,
    status = excluded.status,
    timing = excluded.timing,
    tags = excluded.tags,
    movie_venue = excluded.movie_venue,
    celebrant_name = excluded.celebrant_name,
    celebrant_member_id = excluded.celebrant_member_id,
    birthday_kind = excluded.birthday_kind,
    scheduled_date = excluded.scheduled_date,
    scheduled_time = excluded.scheduled_time,
    duration_minutes = excluded.duration_minutes,
    date_flexible = excluded.date_flexible,
    link = excluded.link,
    budget_note = excluded.budget_note
  where public.ideas.proposed_by = v_uid;

  return v_id;
end;
$$;

create or replace function public.insert_expense(p_expense jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_group uuid;
  v_idea uuid;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  v_id := nullif(p_expense->>'id', '')::uuid;
  v_group := nullif(p_expense->>'group_id', '')::uuid;
  v_idea := nullif(p_expense->>'idea_id', '')::uuid;

  if v_id is null then
    v_id := gen_random_uuid();
  end if;
  if v_group is null then
    raise exception 'invalid group_id';
  end if;

  if not public.is_group_member(v_group) then
    raise exception 'not a group member';
  end if;

  if v_idea is not null and exists (
    select 1 from public.ideas i
    where i.id = v_idea
      and i.type = 'birthday'
      and i.celebrant_member_id = v_uid
  ) then
    raise exception 'celebrant cannot add birthday expense';
  end if;

  begin
    insert into public.expenses (
      id, group_id, idea_id, title, amount_cents, paid_by, split_between, split_shares, created_at
    ) values (
      v_id,
      v_group,
      v_idea,
      coalesce(p_expense->>'title', ''),
      coalesce((p_expense->>'amount_cents')::int, 0),
      coalesce(nullif(p_expense->>'paid_by', '')::uuid, v_uid),
      coalesce(
        array(
          select (jsonb_array_elements_text(coalesce(p_expense->'split_between', '[]'::jsonb)))::uuid
        ),
        '{}'::uuid[]
      ),
      coalesce(p_expense->'split_shares', '{}'::jsonb),
      coalesce((p_expense->>'created_at')::timestamptz, now())
    )
    on conflict (id) do update set
      title = excluded.title,
      amount_cents = excluded.amount_cents,
      paid_by = excluded.paid_by,
      split_between = excluded.split_between,
      split_shares = excluded.split_shares,
      idea_id = excluded.idea_id;
  exception
    when undefined_column then
      insert into public.expenses (
        id, group_id, idea_id, title, amount_cents, paid_by, split_between, created_at
      ) values (
        v_id,
        v_group,
        v_idea,
        coalesce(p_expense->>'title', ''),
        coalesce((p_expense->>'amount_cents')::int, 0),
        coalesce(nullif(p_expense->>'paid_by', '')::uuid, v_uid),
        coalesce(
          array(
            select (jsonb_array_elements_text(coalesce(p_expense->'split_between', '[]'::jsonb)))::uuid
          ),
          '{}'::uuid[]
        ),
        coalesce((p_expense->>'created_at')::timestamptz, now())
      )
      on conflict (id) do nothing;
  end;

  return v_id;
end;
$$;

revoke all on function public.insert_idea(jsonb) from public;
revoke all on function public.insert_expense(jsonb) from public;
grant execute on function public.insert_idea(jsonb) to authenticated;
grant execute on function public.insert_expense(jsonb) to authenticated;
