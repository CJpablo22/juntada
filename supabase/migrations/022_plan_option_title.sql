-- Opciones: también se puede proponer otro título (otra serie/peli/plan)
-- dentro de la misma idea — no hace falta crear una idea nueva.

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
      'title', nullif(p_option->>'title', ''),
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

comment on column public.ideas.plan_options is
  'Array de {id, proposedBy, title, placeName, placeAddress, memberHomeId, scheduledDate, scheduledTime, createdAt, preferVotes[]}';
