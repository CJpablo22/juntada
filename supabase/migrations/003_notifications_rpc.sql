-- RPC para encolar avisos a miembros de un grupo (el caller debe ser miembro).
-- Luego la app manda el correo con Resend si hay API key.

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

  return query
  with targets as (
    select m.user_id, p.email
    from public.group_members m
    join public.profiles p on p.id = m.user_id
    where m.group_id = p_group_id
      and (not p_exclude_self or m.user_id <> auth.uid())
  ),
  inserted as (
    insert into public.notification_events (
      user_id, channel, event_type, title, body, payload, status
    )
    select
      t.user_id,
      'email',
      p_event_type,
      p_title,
      p_body,
      coalesce(p_payload, '{}'::jsonb),
      'pending'
    from targets t
    returning id, notification_events.user_id
  )
  select i.id, i.user_id, t.email
  from inserted i
  join targets t on t.user_id = i.user_id;
end;
$$;

grant execute on function public.enqueue_group_notifications(uuid, text, text, text, jsonb, boolean)
  to authenticated;

-- Marcar enviados / fallidos desde la app (solo propias filas; status update vía RPC)
create or replace function public.mark_notification_status(
  p_ids uuid[],
  p_status text,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_status not in ('sent', 'failed', 'skipped') then
    raise exception 'invalid status';
  end if;

  update public.notification_events n
  set
    status = p_status,
    error = p_error,
    sent_at = case when p_status = 'sent' then now() else n.sent_at end
  where n.id = any (p_ids)
    and exists (
      -- Solo si el caller está en algún grupo con el destinatario, o es el destinatario
      select 1 from public.group_members me
      join public.group_members them
        on them.group_id = me.group_id and them.user_id = n.user_id
      where me.user_id = auth.uid()
    );
end;
$$;

grant execute on function public.mark_notification_status(uuid[], text, text)
  to authenticated;
