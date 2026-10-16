-- Juntada · RSVP (asiste / no) + repartos de gasto a medida

-- ===== Ideas: asistencia =====
alter table public.ideas
  add column if not exists rsvps jsonb not null default '{}'::jsonb;

comment on column public.ideas.rsvps is
  'userId -> yes | no (asistencia al plan)';

-- Ampliar protect_idea_row: rsvps solo vía RPC set_rsvp
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

    if auth.uid() is not null
       and auth.uid() = old.celebrant_member_id
       and (
         new.celebrant_member_id is distinct from old.celebrant_member_id
         or new.type is distinct from old.type
         or new.celebrant_name is distinct from old.celebrant_name
       ) then
      raise exception 'celebrant cannot change birthday binding';
    end if;

    if old.celebrant_member_id is not null
       and new.celebrant_member_id is distinct from old.celebrant_member_id
       and auth.uid() is distinct from old.proposed_by then
      raise exception 'only proposer can change celebrant';
    end if;

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
    if new.rsvps is distinct from old.rsvps and v_rpc <> 'set_rsvp' then
      raise exception 'use set_rsvp rpc';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.set_rsvp(p_idea_id uuid, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group uuid;
  v_rsvps jsonb;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_status is null or p_status not in ('yes', 'no') then
    raise exception 'status must be yes or no';
  end if;

  select group_id, coalesce(rsvps, '{}'::jsonb)
    into v_group, v_rsvps
  from public.ideas
  where id = p_idea_id;

  if v_group is null then
    raise exception 'idea not found';
  end if;
  if not exists (
    select 1 from public.group_members m
    where m.group_id = v_group and m.user_id = auth.uid()
  ) then
    raise exception 'not a group member';
  end if;

  v_rsvps := coalesce(v_rsvps, '{}'::jsonb)
    || jsonb_build_object(auth.uid()::text, p_status);

  perform set_config('juntada.idea_rpc', 'set_rsvp', true);
  update public.ideas
  set rsvps = v_rsvps
  where id = p_idea_id;

  return v_rsvps;
end;
$$;

revoke all on function public.set_rsvp(uuid, text) from public;
grant execute on function public.set_rsvp(uuid, text) to authenticated;

-- ===== Gastos: shares por persona (cénts) =====
alter table public.expenses
  add column if not exists split_shares jsonb not null default '{}'::jsonb;

comment on column public.expenses.split_shares is
  'userId -> céntimos que le tocan; vacío = partes iguales entre split_between';

-- Actualizar insert_expense (017) para aceptar split_shares
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

  if v_idea is not null and exists (
    select 1 from public.ideas i
    where i.id = v_idea
      and i.type = 'birthday'
      and i.celebrant_member_id = auth.uid()
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
    coalesce(nullif(p_expense->>'paid_by', '')::uuid, auth.uid()),
    coalesce(
      array(
        select (jsonb_array_elements_text(coalesce(p_expense->'split_between', '[]'::jsonb)))::uuid
      ),
      '{}'::uuid[]
    ),
    coalesce(p_expense->'split_shares', '{}'::jsonb),
    coalesce((p_expense->>'created_at')::timestamptz, now())
  )
  on conflict (id) do nothing;

  return v_id;
end;
$$;
