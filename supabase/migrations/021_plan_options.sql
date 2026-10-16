-- Juntada · opciones de plan (lugar/fecha/hora) + preferencia
-- Evita que todos editen el mismo campo: cada uno propone una opción y se vota.

alter table public.ideas
  add column if not exists plan_options jsonb not null default '[]'::jsonb;

comment on column public.ideas.plan_options is
  'Array de {id, proposedBy, placeName, placeAddress, memberHomeId, scheduledDate, scheduledTime, createdAt, preferVotes[]}';

-- Ampliar protect_idea_row: plan_options solo vía RPC
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
    if new.plan_options is distinct from old.plan_options
       and v_rpc not in ('add_plan_option', 'vote_plan_option', 'remove_plan_option', 'seed_plan_options') then
      raise exception 'use plan option rpcs';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.add_plan_option(p_idea_id uuid, p_option jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group uuid;
  v_opts jsonb;
  v_uid uuid := auth.uid();
  v_count int;
  v_mine int;
  v_id text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  select group_id, coalesce(plan_options, '[]'::jsonb)
    into v_group, v_opts
  from public.ideas where id = p_idea_id;

  if v_group is null then raise exception 'idea not found'; end if;
  if not public.is_group_member(v_group) then raise exception 'not a group member'; end if;

  v_count := jsonb_array_length(v_opts);
  if v_count >= 4 then
    raise exception 'max 4 options';
  end if;

  select count(*)::int into v_mine
  from jsonb_array_elements(v_opts) o
  where o->>'proposedBy' = v_uid::text;
  if v_mine >= 1 then
    raise exception 'already proposed an option';
  end if;

  v_id := coalesce(nullif(p_option->>'id', ''), gen_random_uuid()::text);

  v_opts := v_opts || jsonb_build_array(
    jsonb_build_object(
      'id', v_id,
      'proposedBy', v_uid::text,
      'placeName', nullif(p_option->>'placeName', ''),
      'placeAddress', nullif(p_option->>'placeAddress', ''),
      'memberHomeId', nullif(p_option->>'memberHomeId', ''),
      'scheduledDate', nullif(p_option->>'scheduledDate', ''),
      'scheduledTime', nullif(p_option->>'scheduledTime', ''),
      'createdAt', coalesce(p_option->>'createdAt', now()::text),
      'preferVotes', '[]'::jsonb
    )
  );

  perform set_config('juntada.idea_rpc', 'add_plan_option', true);
  update public.ideas set plan_options = v_opts where id = p_idea_id;
  return v_opts;
end;
$$;

create or replace function public.vote_plan_option(p_idea_id uuid, p_option_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group uuid;
  v_opts jsonb;
  v_uid uuid := auth.uid();
  v_new jsonb := '[]'::jsonb;
  v_el jsonb;
  v_votes jsonb;
  v_found boolean := false;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  select group_id, coalesce(plan_options, '[]'::jsonb)
    into v_group, v_opts
  from public.ideas where id = p_idea_id;

  if v_group is null then raise exception 'idea not found'; end if;
  if not public.is_group_member(v_group) then raise exception 'not a group member'; end if;

  for v_el in select * from jsonb_array_elements(v_opts)
  loop
    if v_el->>'id' = p_option_id then
      v_found := true;
    end if;
    -- sacar el voto del user de todas
    select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
      into v_votes
    from jsonb_array_elements_text(coalesce(v_el->'preferVotes', '[]'::jsonb)) x
    where x <> v_uid::text;

    if v_el->>'id' = p_option_id then
      v_votes := v_votes || to_jsonb(v_uid::text);
    end if;

    v_new := v_new || jsonb_build_array(v_el || jsonb_build_object('preferVotes', v_votes));
  end loop;

  if not v_found then raise exception 'option not found'; end if;

  perform set_config('juntada.idea_rpc', 'vote_plan_option', true);
  update public.ideas set plan_options = v_new where id = p_idea_id;
  return v_new;
end;
$$;

create or replace function public.remove_plan_option(p_idea_id uuid, p_option_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group uuid;
  v_opts jsonb;
  v_proposer uuid;
  v_uid uuid := auth.uid();
  v_new jsonb;
  v_el jsonb;
  v_owner text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  select group_id, coalesce(plan_options, '[]'::jsonb), proposed_by
    into v_group, v_opts, v_proposer
  from public.ideas where id = p_idea_id;

  if v_group is null then raise exception 'idea not found'; end if;
  if not public.is_group_member(v_group) then raise exception 'not a group member'; end if;

  select o->>'proposedBy' into v_owner
  from jsonb_array_elements(v_opts) o
  where o->>'id' = p_option_id;

  if v_owner is null then raise exception 'option not found'; end if;
  if v_owner <> v_uid::text and v_proposer is distinct from v_uid then
    raise exception 'only owner or idea proposer can remove';
  end if;

  select coalesce(jsonb_agg(o), '[]'::jsonb) into v_new
  from jsonb_array_elements(v_opts) o
  where o->>'id' <> p_option_id;

  perform set_config('juntada.idea_rpc', 'remove_plan_option', true);
  update public.ideas set plan_options = v_new where id = p_idea_id;
  return coalesce(v_new, '[]'::jsonb);
end;
$$;

-- Quién tiene push activo en el grupo (para UI)
create or replace function public.group_push_user_ids(p_group_id uuid)
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select distinct s.user_id
  from public.push_subscriptions s
  where s.user_id in (
    select m.user_id from public.group_members m where m.group_id = p_group_id
  )
  and public.is_group_member(p_group_id);
$$;

revoke all on function public.add_plan_option(uuid, jsonb) from public;
revoke all on function public.vote_plan_option(uuid, text) from public;
revoke all on function public.remove_plan_option(uuid, text) from public;
revoke all on function public.group_push_user_ids(uuid) from public;
grant execute on function public.add_plan_option(uuid, jsonb) to authenticated;
grant execute on function public.vote_plan_option(uuid, text) to authenticated;
grant execute on function public.remove_plan_option(uuid, text) to authenticated;
grant execute on function public.group_push_user_ids(uuid) to authenticated;
