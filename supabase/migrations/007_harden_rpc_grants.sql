-- Endurecer EXECUTE de funciones SECURITY DEFINER (Advisors WARN)
-- Postgres otorga EXECUTE a PUBLIC por defecto; acá lo cerramos.

-- Triggers internos: nadie las llama por RPC
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

revoke all on function public.handle_user_identity_updated() from public;
revoke all on function public.handle_user_identity_updated() from anon;
revoke all on function public.handle_user_identity_updated() from authenticated;

-- Solo usuarios logueados (la app las usa autenticada)
revoke all on function public.enqueue_group_notifications(uuid, text, text, text, jsonb, boolean) from public;
revoke all on function public.enqueue_group_notifications(uuid, text, text, text, jsonb, boolean) from anon;
grant execute on function public.enqueue_group_notifications(uuid, text, text, text, jsonb, boolean) to authenticated;

revoke all on function public.join_group_by_code(text) from public;
revoke all on function public.join_group_by_code(text) from anon;
grant execute on function public.join_group_by_code(text) to authenticated;

revoke all on function public.peek_group_by_code(text) from public;
revoke all on function public.peek_group_by_code(text) from anon;
grant execute on function public.peek_group_by_code(text) to authenticated;

revoke all on function public.mark_notification_status(uuid[], text, text) from public;
revoke all on function public.mark_notification_status(uuid[], text, text) from anon;
grant execute on function public.mark_notification_status(uuid[], text, text) to authenticated;

revoke all on function public.mark_notifications_read(uuid[]) from public;
revoke all on function public.mark_notifications_read(uuid[]) from anon;
grant execute on function public.mark_notifications_read(uuid[]) to authenticated;

-- Login / registro (antes de sesión): anon + authenticated
-- Siguen siendo SECURITY DEFINER a propósito: leen profiles sin abrir la tabla a anon.
revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;

revoke all on function public.login_email_for_username(text) from public;
grant execute on function public.login_email_for_username(text) to anon, authenticated;
