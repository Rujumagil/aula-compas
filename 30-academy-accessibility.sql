-- ============================================================
-- COMPÁS ACADEMY · ACCESIBILIDAD V22
-- Base aditiva para transcripciones, subtítulos y notas accesibles.
-- No elimina ni transforma contenido existente.
-- ============================================================

begin;

alter table public.lessons
  add column if not exists transcript_text text,
  add column if not exists captions_url text,
  add column if not exists accessibility_notes text;

comment on column public.lessons.transcript_text is
  'Transcripción textual accesible de la lección. Puede mostrarse debajo del contenido multimedia.';

comment on column public.lessons.captions_url is
  'URL HTTPS o ruta relativa a un archivo WebVTT de subtítulos/captions para el video de la lección.';

comment on column public.lessons.accessibility_notes is
  'Notas opcionales de accesibilidad para describir apoyos, recursos alternativos o adaptaciones de la lección.';

commit;
