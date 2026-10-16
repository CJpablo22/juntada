-- Juntada · inserts estables de ideas / gastos / puntos
-- Evita fallos silenciosos por RLS en group_members al hacer INSERT.

create or replace function public.insert_idea(p_idea jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_group uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  v_id := (p_idea->>'id')::uuid;
  v_group := (p_idea->>'group_id')::uuid;

  if v_id is null or v_group is null then
    raise exception 'invalid idea payload';
  end if;

  if not exists (
    select 1 from public.group_members m
    where m.group_id = v_group and m.user_id = auth.uid()
  ) then
    raise exception 'not a group member';
  end if;

  if (p_idea->>'proposed_by')::uuid is distinct from auth.uid() then
    raise exception 'proposed_by must be auth user';
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
    coalesce(p_idea->>'type', 'plan'),
    coalesce(p_idea->>'title', ''),
    coalesce(p_idea->>'notes', ''),
    p_idea->>'movie_venue',
    p_idea->>'celebrant_name',
    nullif(p_idea->>'celebrant_member_id', '')::uuid,
    p_idea->>'birthday_kind',
    coalesce(p_idea->'places', '[]'::jsonb),
    p_idea->>'address',
    p_idea->>'scheduled_date',
    p_idea->>'scheduled_time',
    nullif(p_idea->>'duration_minutes', '')::int,
    coalesce((p_idea->>'date_flexible')::boolean, false),
    p_idea->>'link',
    p_idea->>'budget_note',
    auth.uid(),
    coalesce(p_idea->>'status', 'pending'),
    coalesce(p_idea->>'timing', 'catalog'),
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
  on conflict (id) do nothing;

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
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  v_id := (p_expense->>'id')::uuid;
  v_group := (p_expense->>'group_id')::uuid;
  v_idea := nullif(p_expense->>'idea_id', '')::uuid;

  if v_id is null or v_group is null then
    raise exception 'invalid expense payload';
  end if;

  if not exists (
    select 1 from public.group_members m
    where m.group_id = v_group and m.user_id = auth.uid()
  ) then
    raise exception 'not a group member';
  end if;

  -- Mismo criterio que RLS: el festejado no carga gastos de su cumple
  if v_idea is not null and exists (
    select 1 from public.ideas i
    where i.id = v_idea
      and i.type = 'birthday'
      and i.celebrant_member_id = auth.uid()
  ) then
    raise exception 'celebrant cannot add birthday expense';
  end if;

  insert into public.expenses (
    id, group_id, idea_id, title, amount_cents, paid_by, split_between, created_at
  ) values (
    v_id,
    v_group,
    v_idea,
    coalesce(p_expense->>'title', ''),
    coalesce((p_expense->>'amount_cents')::int, 0),
    coalesce(nullif(p_expense->>'paid_by', '')::uuid, auth.uid()),
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

create or replace function public.insert_point_event(p_point jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_group uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  v_id := (p_point->>'id')::uuid;
  v_group := (p_point->>'group_id')::uuid;

  if v_id is null or v_group is null then
    raise exception 'invalid point payload';
  end if;

  if not exists (
    select 1 from public.group_members m
    where m.group_id = v_group and m.user_id = auth.uid()
  ) then
    raise exception 'not a group member';
  end if;

  insert into public.point_events (
    id, group_id, user_id, delta, reason, at
  ) values (
    v_id,
    v_group,
    coalesce(nullif(p_point->>'user_id', '')::uuid, auth.uid()),
    coalesce((p_point->>'delta')::int, 0),
    coalesce(p_point->>'reason', ''),
    coalesce((p_point->>'at')::timestamptz, now())
  )
  on conflict (id) do nothing;

  return v_id;
end;
$$;

revoke all on function public.insert_idea(jsonb) from public;
revoke all on function public.insert_expense(jsonb) from public;
revoke all on function public.insert_point_event(jsonb) from public;
grant execute on function public.insert_idea(jsonb) to authenticated;
grant execute on function public.insert_expense(jsonb) to authenticated;
grant execute on function public.insert_point_event(jsonb) to authenticated;
