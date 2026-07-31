-- Aula Compás · Fase 3 · Editor profesional por bloques
create extension if not exists pgcrypto;

create table if not exists public.lesson_blocks (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  block_type text not null check (block_type in ('text','video','image','pdf','audio','activity','divider')),
  position integer not null default 1,
  content jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lesson_blocks_lesson_position_idx on public.lesson_blocks(lesson_id, position);

create table if not exists public.block_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  block_id uuid not null references public.lesson_blocks(id) on delete cascade,
  response jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique(user_id, block_id)
);

create table if not exists public.course_versions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  version_number integer not null,
  label text,
  snapshot jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(course_id, version_number)
);

alter table public.lesson_blocks enable row level security;
alter table public.block_responses enable row level security;
alter table public.course_versions enable row level security;

-- Lectura de bloques para usuarios autenticados con acceso al curso o responsables del contenido.
drop policy if exists "leer bloques de cursos autorizados" on public.lesson_blocks;
create policy "leer bloques de cursos autorizados" on public.lesson_blocks for select to authenticated using (
  exists (
    select 1 from public.lessons l
    join public.modules m on m.id=l.module_id
    join public.courses c on c.id=m.course_id
    where l.id=lesson_blocks.lesson_id and (
      c.created_by=auth.uid()
      or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')
      or exists(select 1 from public.enrollments e where e.course_id=c.id and e.user_id=auth.uid() and e.status<>'cancelled')
    )
  )
);

drop policy if exists "gestionar bloques propios" on public.lesson_blocks;
create policy "gestionar bloques propios" on public.lesson_blocks for all to authenticated using (
  exists (
    select 1 from public.lessons l join public.modules m on m.id=l.module_id join public.courses c on c.id=m.course_id
    where l.id=lesson_blocks.lesson_id and (c.created_by=auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'))
  )
) with check (
  exists (
    select 1 from public.lessons l join public.modules m on m.id=l.module_id join public.courses c on c.id=m.course_id
    where l.id=lesson_blocks.lesson_id and (c.created_by=auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'))
  )
);

drop policy if exists "alumno gestiona sus respuestas" on public.block_responses;
create policy "alumno gestiona sus respuestas" on public.block_responses for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

drop policy if exists "gestionar versiones de cursos propios" on public.course_versions;
create policy "gestionar versiones de cursos propios" on public.course_versions for all to authenticated using (
  exists(select 1 from public.courses c where c.id=course_versions.course_id and (c.created_by=auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')))
) with check (
  exists(select 1 from public.courses c where c.id=course_versions.course_id and (c.created_by=auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')))
);
