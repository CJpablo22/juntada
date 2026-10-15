-- Un correo = una cuenta (además de Auth)
create unique index if not exists profiles_email_lower_uidx
  on public.profiles (lower(email))
  where email is not null and email <> '';

-- status text ya admite 'in_progress' (sin check constraint en ideas)
comment on column public.ideas.status is
  'pending | chosen | in_progress | done | archived';
