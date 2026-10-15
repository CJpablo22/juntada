-- Carga estable de grupos + gestión (salir / renombrar / expulsar / borrar)

-- Lista mis grupos sin depender de RLS circular
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

-- Filas de groups sin depender de RLS de select
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

-- Miembros de un grupo (solo si sos miembro)
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

-- Salir del grupo
create or replace function public.leave_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining int;
  new_owner uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  delete from public.group_members
  where group_id = p_group_id and user_id = auth.uid();

  if not found then
    raise exception 'not a member';
  end if;

  select count(*) into remaining
  from public.group_members where group_id = p_group_id;

  if remaining = 0 then
    delete from public.groups where id = p_group_id;
    return;
  end if;

  -- Si el que salió era el creador, pasar ownership a otro miembro
  update public.groups g
  set created_by = (
    select m.user_id from public.group_members m
    where m.group_id = p_group_id
    order by m.joined_at asc
    limit 1
  )
  where g.id = p_group_id and g.created_by = auth.uid();
end;
$$;

revoke all on function public.leave_group(uuid) from public;
revoke all on function public.leave_group(uuid) from anon;
grant execute on function public.leave_group(uuid) to authenticated;

-- Renombrar (solo creador)
create or replace function public.rename_group(p_group_id uuid, p_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if length(trim(p_name)) < 1 then
    raise exception 'empty name';
  end if;
  update public.groups
  set name = trim(p_name)
  where id = p_group_id and created_by = auth.uid();
  if not found then
    raise exception 'not owner or missing';
  end if;
end;
$$;

revoke all on function public.rename_group(uuid, text) from public;
revoke all on function public.rename_group(uuid, text) from anon;
grant execute on function public.rename_group(uuid, text) to authenticated;

-- Expulsar (solo creador; no a vos mismo)
create or replace function public.kick_group_member(p_group_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'use leave_group';
  end if;
  if not exists (
    select 1 from public.groups
    where id = p_group_id and created_by = auth.uid()
  ) then
    raise exception 'not owner';
  end if;

  delete from public.group_members
  where group_id = p_group_id and user_id = p_user_id;

  if not found then
    raise exception 'member not found';
  end if;
end;
$$;

revoke all on function public.kick_group_member(uuid, uuid) from public;
revoke all on function public.kick_group_member(uuid, uuid) from anon;
grant execute on function public.kick_group_member(uuid, uuid) to authenticated;

-- Eliminar grupo (solo creador)
create or replace function public.delete_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from public.groups
  where id = p_group_id and created_by = auth.uid();
  if not found then
    raise exception 'not owner or missing';
  end if;
end;
$$;

revoke all on function public.delete_group(uuid) from public;
revoke all on function public.delete_group(uuid) from anon;
grant execute on function public.delete_group(uuid) to authenticated;

-- Permitir borrar la propia membresía vía API (además del RPC)
drop policy if exists "members_delete_self" on public.group_members;
create policy "members_delete_self"
  on public.group_members for delete to authenticated
  using (user_id = auth.uid());

-- Creador puede expulsar (delete fila ajena) si es owner del grupo
drop policy if exists "members_delete_as_owner" on public.group_members;
create policy "members_delete_as_owner"
  on public.group_members for delete to authenticated
  using (
    exists (
      select 1 from public.groups g
      where g.id = group_members.group_id and g.created_by = auth.uid()
    )
  );

-- Creador puede borrar el grupo
drop policy if exists "groups_delete_owner" on public.groups;
create policy "groups_delete_owner"
  on public.groups for delete to authenticated
  using (created_by = auth.uid());
