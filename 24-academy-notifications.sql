-- ============================================================
-- COMPÁS ACADEMY · NOTIFICACIONES ACADÉMICAS V17
-- Aditiva, idempotente y sin borrar datos existentes.
-- ============================================================

begin;

create table if not exists public.academy_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_type text not null check (notification_type in (
    'course_assigned','assessment_available','assessment_passed','assessment_failed',
    'certificate_ready','inactivity','system'
  )),
  title text not null,
  body text not null,
  target_path text,
  entity_type text,
  entity_id uuid,
  dedupe_key text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint academy_notifications_user_dedupe_key unique (user_id, dedupe_key)
);

create index if not exists academy_notifications_user_created_idx
  on public.academy_notifications(user_id, created_at desc);
create index if not exists academy_notifications_user_unread_idx
  on public.academy_notifications(user_id, read_at)
  where read_at is null;

alter table public.academy_notifications enable row level security;

revoke all on table public.academy_notifications from public, anon, authenticated;
grant select on table public.academy_notifications to authenticated;
grant update (read_at) on table public.academy_notifications to authenticated;
grant all on table public.academy_notifications to service_role;

drop policy if exists "academy_notifications_select_own" on public.academy_notifications;
create policy "academy_notifications_select_own"
on public.academy_notifications
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "academy_notifications_update_own" on public.academy_notifications;
create policy "academy_notifications_update_own"
on public.academy_notifications
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create schema if not exists private;

create or replace function private.enqueue_academy_notification(
  target_user uuid,
  kind text,
  heading text,
  message text,
  path text,
  related_type text,
  related_id uuid,
  unique_key text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target_user is null or unique_key is null or btrim(unique_key) = '' then
    return false;
  end if;

  insert into public.academy_notifications(
    user_id, notification_type, title, body, target_path, entity_type, entity_id, dedupe_key
  )
  values (
    target_user, kind, heading, message, path, related_type, related_id, unique_key
  )
  on conflict (user_id, dedupe_key) do nothing;

  return found;
end;
$$;

revoke all on function private.enqueue_academy_notification(uuid,text,text,text,text,text,uuid,text) from public, anon, authenticated;

create or replace function private.notify_academy_enrollment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  course_title text;
begin
  if new.status = 'active' and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    select c.title into course_title from public.courses c where c.id = new.course_id;
    perform private.enqueue_academy_notification(
      new.user_id,
      'course_assigned',
      'Nuevo curso en tu ruta',
      coalesce(course_title, 'Tu nuevo curso') || ' ya está disponible en Compás Academy.',
      '#course/' || new.course_id::text,
      'course',
      new.course_id,
      'enrollment:' || new.id::text || ':active'
    );
  end if;
  return new;
end;
$$;

revoke all on function private.notify_academy_enrollment() from public, anon, authenticated;

drop trigger if exists academy_enrollment_notification on public.enrollments;
create trigger academy_enrollment_notification
after insert or update of status on public.enrollments
for each row execute function private.notify_academy_enrollment();

create or replace function private.notify_academy_assessment_result()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  assessment_title text;
  course_id_value uuid;
begin
  if new.graded_at is not null
     and (tg_op = 'INSERT' or old.graded_at is distinct from new.graded_at or old.passed is distinct from new.passed) then
    select a.title, a.course_id into assessment_title, course_id_value
      from public.assessments a where a.id = new.assessment_id;

    perform private.enqueue_academy_notification(
      new.user_id,
      case when new.passed then 'assessment_passed' else 'assessment_failed' end,
      case when new.passed then 'Evaluación aprobada' else 'Evaluación por reforzar' end,
      coalesce(assessment_title, 'Tu evaluación') ||
        case when new.passed then ' fue aprobada. Sigue avanzando.' else ' necesita otro intento para alcanzar el mínimo.' end,
      '#course/' || course_id_value::text,
      'assessment',
      new.assessment_id,
      'attempt:' || new.id::text || ':graded:' || coalesce(new.passed::text,'pending')
    );
  end if;
  return new;
end;
$$;

revoke all on function private.notify_academy_assessment_result() from public, anon, authenticated;

drop trigger if exists academy_assessment_result_notification on public.assessment_attempts;
create trigger academy_assessment_result_notification
after insert or update of graded_at, passed on public.assessment_attempts
for each row execute function private.notify_academy_assessment_result();

create or replace function private.notify_academy_certificate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  course_title text;
begin
  select c.title into course_title from public.courses c where c.id = new.course_id;
  perform private.enqueue_academy_notification(
    new.user_id,
    'certificate_ready',
    'Tu certificado está listo',
    'Completaste ' || coalesce(course_title, 'tu programa') || '. Ya puedes abrir tu certificado verificable.',
    '#certificate/' || new.course_id::text,
    'certificate',
    new.id,
    'certificate:' || new.id::text || ':ready'
  );
  return new;
end;
$$;

revoke all on function private.notify_academy_certificate() from public, anon, authenticated;

drop trigger if exists academy_certificate_notification on public.certificates;
create trigger academy_certificate_notification
after insert on public.certificates
for each row execute function private.notify_academy_certificate();

create or replace function private.notify_academy_assessment_published()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  enrollment_row record;
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    for enrollment_row in
      select e.user_id
      from public.enrollments e
      where e.course_id = new.course_id and e.status = 'active'
    loop
      perform private.enqueue_academy_notification(
        enrollment_row.user_id,
        'assessment_available',
        'Nueva evaluación disponible',
        new.title || ' ya está disponible dentro de tu curso.',
        '#assessment/' || new.id::text,
        'assessment',
        new.id,
        'assessment:' || new.id::text || ':published'
      );
    end loop;
  end if;
  return new;
end;
$$;

revoke all on function private.notify_academy_assessment_published() from public, anon, authenticated;

drop trigger if exists academy_assessment_published_notification on public.assessments;
create trigger academy_assessment_published_notification
after insert or update of status on public.assessments
for each row execute function private.notify_academy_assessment_published();

create or replace function private.refresh_academy_notifications_for_user(target_user uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_item record;
  inserted_count integer := 0;
  was_inserted boolean;
  last_activity timestamptz;
  iso_week text := to_char(now(), 'IYYY-IW');
begin
  if target_user is null or target_user <> auth.uid() then
    raise exception 'No autorizado';
  end if;

  for row_item in
    select e.id enrollment_id, e.course_id, e.enrolled_at, c.title course_title
    from public.enrollments e
    join public.courses c on c.id = e.course_id
    where e.user_id = target_user and e.status = 'active'
  loop
    select private.enqueue_academy_notification(
      target_user, 'course_assigned', 'Curso disponible en tu ruta',
      row_item.course_title || ' está disponible en Compás Academy.',
      '#course/' || row_item.course_id::text, 'course', row_item.course_id,
      'enrollment:' || row_item.enrollment_id::text || ':active'
    ) into was_inserted;
    if was_inserted then inserted_count := inserted_count + 1; end if;

    for row_item in
      select a.id assessment_id, a.title assessment_title, a.course_id
      from public.assessments a
      where a.course_id = row_item.course_id and a.status = 'published'
    loop
      select private.enqueue_academy_notification(
        target_user, 'assessment_available', 'Evaluación disponible',
        row_item.assessment_title || ' está lista para responder.',
        '#assessment/' || row_item.assessment_id::text, 'assessment', row_item.assessment_id,
        'assessment:' || row_item.assessment_id::text || ':published'
      ) into was_inserted;
      if was_inserted then inserted_count := inserted_count + 1; end if;
    end loop;
  end loop;

  for row_item in
    select cert.id certificate_id, cert.course_id, c.title course_title
    from public.certificates cert
    join public.courses c on c.id = cert.course_id
    where cert.user_id = target_user and cert.revoked_at is null
  loop
    select private.enqueue_academy_notification(
      target_user, 'certificate_ready', 'Tu certificado está listo',
      'Ya puedes validar y descargar tu certificado de ' || row_item.course_title || '.',
      '#certificate/' || row_item.course_id::text, 'certificate', row_item.certificate_id,
      'certificate:' || row_item.certificate_id::text || ':ready'
    ) into was_inserted;
    if was_inserted then inserted_count := inserted_count + 1; end if;
  end loop;

  for row_item in
    select e.id enrollment_id, e.course_id, e.enrolled_at, c.title course_title
    from public.enrollments e
    join public.courses c on c.id = e.course_id
    where e.user_id = target_user
      and e.status = 'active'
      and exists (
        select 1
        from public.modules m
        join public.lessons l on l.module_id = m.id
        where m.course_id = e.course_id
          and not exists (
            select 1 from public.lesson_progress lp
            where lp.lesson_id = l.id and lp.user_id = target_user and lp.completed = true
          )
      )
  loop
    select greatest(
      row_item.enrolled_at,
      coalesce((select max(lp.updated_at)
        from public.lesson_progress lp
        join public.lessons l on l.id = lp.lesson_id
        join public.modules m on m.id = l.module_id
        where lp.user_id = target_user and m.course_id = row_item.course_id), row_item.enrolled_at)
    ) into last_activity;

    if last_activity < now() - interval '7 days' then
      select private.enqueue_academy_notification(
        target_user, 'inactivity', 'Retoma tu ruta de aprendizaje',
        'Han pasado varios días desde tu última actividad en ' || row_item.course_title || '.',
        '#course/' || row_item.course_id::text, 'course', row_item.course_id,
        'inactivity:' || row_item.enrollment_id::text || ':' || iso_week
      ) into was_inserted;
      if was_inserted then inserted_count := inserted_count + 1; end if;
    end if;
  end loop;

  return inserted_count;
end;
$$;

revoke all on function private.refresh_academy_notifications_for_user(uuid) from public, anon;
grant execute on function private.refresh_academy_notifications_for_user(uuid) to authenticated;

create or replace function public.refresh_academy_notifications()
returns integer
language sql
security invoker
set search_path = ''
as $$
  select private.refresh_academy_notifications_for_user(auth.uid());
$$;

revoke all on function public.refresh_academy_notifications() from public, anon;
grant execute on function public.refresh_academy_notifications() to authenticated;

commit;
