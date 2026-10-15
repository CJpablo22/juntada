-- Fecha, hora y extras de planificación en ideas
alter table public.ideas
  add column if not exists scheduled_date date,
  add column if not exists scheduled_time text,
  add column if not exists duration_minutes int,
  add column if not exists date_flexible boolean not null default false,
  add column if not exists link text,
  add column if not exists budget_note text;

comment on column public.ideas.scheduled_date is 'Día propuesto (YYYY-MM-DD)';
comment on column public.ideas.scheduled_time is 'Hora propuesta HH:mm (24h)';
comment on column public.ideas.duration_minutes is 'Duración aproximada en minutos';
comment on column public.ideas.date_flexible is 'Fecha/hora a confirmar';
comment on column public.ideas.link is 'Trailer, reserva, mapa o entradas';
comment on column public.ideas.budget_note is 'Presupuesto orientativo libre';
