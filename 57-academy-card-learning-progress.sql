-- Compás Academy V35 · progreso por tarjeta/diapositiva
-- Cada alumno registra únicamente las tarjetas que realmente ha visitado.

create table if not exists public.lesson_slide_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  slide_index integer not null check (slide_index >= 0 and slide_index < 500),
  viewed_at timestamptz not null default now(),
  primary key (user_id, lesson_id, slide_index)
);

alter table public.lesson_slide_progress enable row level security;

revoke all on public.lesson_slide_progress from public, anon, authenticated;
grant select, insert on public.lesson_slide_progress to authenticated;
grant all on public.lesson_slide_progress to service_role;

drop policy if exists lesson_slide_progress_select_own on public.lesson_slide_progress;
create policy lesson_slide_progress_select_own
on public.lesson_slide_progress
for select
to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.lessons l
    join public.modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
    where l.id = lesson_slide_progress.lesson_id
      and (
        c.created_by = (select auth.uid())
        or exists (
          select 1 from public.profiles p
          where p.id = (select auth.uid()) and p.role = 'admin'
        )
        or exists (
          select 1 from public.enrollments e
          where e.course_id = c.id
            and e.user_id = (select auth.uid())
            and e.status <> 'cancelled'
        )
      )
  )
);

drop policy if exists lesson_slide_progress_insert_own on public.lesson_slide_progress;
create policy lesson_slide_progress_insert_own
on public.lesson_slide_progress
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.lessons l
    join public.modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
    where l.id = lesson_slide_progress.lesson_id
      and (
        c.created_by = (select auth.uid())
        or exists (
          select 1 from public.profiles p
          where p.id = (select auth.uid()) and p.role = 'admin'
        )
        or exists (
          select 1 from public.enrollments e
          where e.course_id = c.id
            and e.user_id = (select auth.uid())
            and e.status <> 'cancelled'
        )
      )
  )
);

create index if not exists lesson_slide_progress_lesson_user_idx
  on public.lesson_slide_progress(lesson_id, user_id, slide_index);
