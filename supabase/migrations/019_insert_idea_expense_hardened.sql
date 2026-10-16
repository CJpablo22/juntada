-- Juntada · inserts endurecidos (auth.uid, membresía security definer)
-- Reemplaza 017 si ya corriste ese script. Idempotente.

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

  -- Lectura de membresía sin RLS del caller
  if not exists (
    select 1 from public.group_members m
    where m.group_id = v_group and m.user_id = v_uid
  ) then
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

  if not exists (
    select 1 from public.group_members m
    where m.group_id = v_group and m.user_id = v_uid
  ) then
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

  return v_id;
exception
  when undefined_column then
    -- DB sin split_shares (018): insertar sin esa columna
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
    return v_id;
end;
$$;

revoke all on function public.insert_idea(jsonb) from public;
revoke all on function public.insert_expense(jsonb) from public;
grant execute on function public.insert_idea(jsonb) to authenticated;
grant execute on function public.insert_expense(jsonb) to authenticated;

-- Asegurar que ideas_member_all sigue permitiendo SELECT a miembros
-- (si alguien dropeó policies, recrear)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ideas' and policyname = 'ideas_member_all'
  ) then
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
  end if;
end $$;
