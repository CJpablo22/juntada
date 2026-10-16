-- Juntada · privilegio del #1: romper empate 1× por semana
alter table public.groups
  add column if not exists last_captain_tie_break_week text;

comment on column public.groups.last_captain_tie_break_week is
  'Clave ISO YYYY-Www de la última vez que el Capitán rompió un empate.';

create or replace function public.captain_break_tie(
  p_group_id uuid,
  p_idea_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_week text;
  v_last text;
  v_top_pts int;
  v_second_pts int;
  v_captain uuid;
  v_member boolean;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = v_uid
  ) into v_member;
  if not v_member then
    raise exception 'not a group member';
  end if;

  -- ISO week approx via to_char
  v_week := to_char(timezone('utc', now()), 'IYYY') || '-W' ||
    lpad(to_char(timezone('utc', now()), 'IW'), 2, '0');

  select last_captain_tie_break_week into v_last
  from public.groups where id = p_group_id;
  if v_last is not null and v_last = v_week then
    raise exception 'captain privilege already used this week';
  end if;

  -- Sole points leader
  select user_id, pts into v_captain, v_top_pts
  from (
    select gm.user_id,
      coalesce((
        select sum(pe.delta) from public.point_events pe
        where pe.group_id = p_group_id and pe.user_id = gm.user_id
      ), 0)::int as pts
    from public.group_members gm
    where gm.group_id = p_group_id
    order by pts desc, gm.user_id
  ) ranked
  limit 1;

  select pts into v_second_pts
  from (
    select coalesce((
      select sum(pe.delta) from public.point_events pe
      where pe.group_id = p_group_id and pe.user_id = gm.user_id
    ), 0)::int as pts
    from public.group_members gm
    where gm.group_id = p_group_id
    order by pts desc, gm.user_id
    offset 1
    limit 1
  ) s;

  if v_captain is null or v_top_pts <= 0 or v_captain <> v_uid then
    raise exception 'not the sole captain';
  end if;
  if v_second_pts is not null and v_second_pts = v_top_pts then
    raise exception 'points tie for captain';
  end if;

  if not exists (
    select 1 from public.ideas
    where id = p_idea_id
      and group_id = p_group_id
      and timing = 'soon'
      and status in ('pending', 'chosen')
  ) then
    raise exception 'idea not eligible';
  end if;

  update public.ideas
  set status = 'pending'
  where group_id = p_group_id
    and status = 'chosen'
    and id <> p_idea_id;

  update public.ideas
  set status = 'chosen', revealed = true, timing = 'soon'
  where id = p_idea_id;

  update public.groups
  set last_captain_tie_break_week = v_week
  where id = p_group_id;
end;
$$;

revoke all on function public.captain_break_tie(uuid, uuid) from public;
revoke all on function public.captain_break_tie(uuid, uuid) from anon;
grant execute on function public.captain_break_tie(uuid, uuid) to authenticated;
