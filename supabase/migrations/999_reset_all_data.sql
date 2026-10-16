-- Juntada · RESET TOTAL de datos (grupos, ideas, usuarios)
-- ⚠️ BORRA TODO. Solo para empezar de cero en tu proyecto.
-- Cómo usarlo: Supabase → SQL Editor → pegar → Run.
--
-- Después: volvé a registrarte / crear grupos desde la app.

begin;

-- App data (orden seguro por FKs; cascade cubre la mayoría)
truncate table public.push_subscriptions restart identity cascade;
truncate table public.notification_events restart identity cascade;
truncate table public.point_events restart identity cascade;
truncate table public.expenses restart identity cascade;
truncate table public.reviews restart identity cascade;
truncate table public.ideas restart identity cascade;
truncate table public.group_members restart identity cascade;
truncate table public.groups restart identity cascade;
truncate table public.security_rate_limits restart identity cascade;

-- Perfiles de la app
truncate table public.profiles restart identity cascade;

-- Cuentas de Auth (login). Sin esto quedan usuarios huérfanos en Authentication.
-- Requiere permiso en el schema auth (SQL Editor del owner del proyecto OK).
delete from auth.users;

commit;
