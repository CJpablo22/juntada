-- Juntada · fotos en recuerdos (data URL o URL futura; gratis, sin Storage obligatorio)
alter table public.ideas
  add column if not exists done_photo_url text;

alter table public.reviews
  add column if not exists photo_url text;

comment on column public.ideas.done_photo_url is
  'Foto del recuerdo al marcar hecho (JPEG data URL comprimido o URL de Storage).';
comment on column public.reviews.photo_url is
  'Foto opcional en la valoración.';
