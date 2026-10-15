-- Cumpleaños: festejado y tipo de festejo
alter table public.ideas
  add column if not exists celebrant_name text,
  add column if not exists celebrant_member_id uuid references public.profiles (id) on delete set null,
  add column if not exists birthday_kind text;

comment on column public.ideas.celebrant_name is 'Nombre de quien cumple';
comment on column public.ideas.celebrant_member_id is 'Si el festejado es miembro del grupo';
comment on column public.ideas.birthday_kind is 'meal | party | other';
