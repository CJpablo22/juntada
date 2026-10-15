-- El festejado (miembro del grupo) no ve ni carga gastos de su propio cumpleaños.

drop policy if exists "expenses_member_all" on public.expenses;

create policy "expenses_select_member_hide_own_birthday"
  on public.expenses for select to authenticated
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
  );

create policy "expenses_insert_member_hide_own_birthday"
  on public.expenses for insert to authenticated
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
  );

create policy "expenses_update_member_hide_own_birthday"
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
  );

create policy "expenses_delete_member_hide_own_birthday"
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
  );

-- No avisar al festejado cuando hay un gasto de su propio cumple
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
      p_title,
      p_body,
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
