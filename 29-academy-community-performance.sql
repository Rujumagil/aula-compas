-- COMPÁS ACADEMY · COMUNIDAD V21.2
-- Índices FK y RLS optimizado para evitar reevaluar auth.uid() por fila.

begin;

create index if not exists academy_community_threads_lesson_idx
on public.academy_community_threads(lesson_id) where lesson_id is not null;

create index if not exists academy_community_replies_user_idx
on public.academy_community_replies(user_id);

drop policy if exists academy_community_threads_insert on public.academy_community_threads;
create policy academy_community_threads_insert on public.academy_community_threads
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and private.can_access_academy_community(course_id)
  and (lesson_id is null or exists (
    select 1 from public.lessons l join public.modules m on m.id = l.module_id
    where l.id = lesson_id and m.course_id = course_id
  ))
);

drop policy if exists academy_community_replies_insert on public.academy_community_replies;
create policy academy_community_replies_insert on public.academy_community_replies
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.academy_community_threads t
    where t.id = thread_id and t.status <> 'hidden'
      and private.can_access_academy_community(t.course_id)
  )
);

commit;
