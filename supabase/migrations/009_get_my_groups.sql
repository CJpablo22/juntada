-- Por si ya corriste el 008 antes de get_my_groups: idempotente

create or replace function public.get_my_groups()
returns setof public.groups
language sql
security definer
set search_path = public
stable
as $$
  select g.*
  from public.groups g
  join public.group_members m on m.group_id = g.id
  where m.user_id = auth.uid()
  order by g.created_at desc;
$$;

revoke all on function public.get_my_groups() from public;
revoke all on function public.get_my_groups() from anon;
grant execute on function public.get_my_groups() to authenticated;

create or replace function public.my_group_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select group_id
  from public.group_members
  where user_id = auth.uid();
$$;

revoke all on function public.my_group_ids() from public;
revoke all on function public.my_group_ids() from anon;
grant execute on function public.my_group_ids() to authenticated;

create or replace function public.group_member_ids(p_group_id uuid)
returns setof uuid
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid()
  ) then
    raise exception 'not a member';
  end if;
  return query
    select user_id from public.group_members where group_id = p_group_id;
end;
$$;

revoke all on function public.group_member_ids(uuid) from public;
revoke all on function public.group_member_ids(uuid) from anon;
grant execute on function public.group_member_ids(uuid) to authenticated;
