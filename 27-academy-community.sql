-- COMPÁS ACADEMY · COMUNIDAD / Q&A V21
-- Conversaciones por curso/lección, RLS por inscripción/gestión y moderación controlada.

begin;

create table if not exists public.academy_community_threads (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid null references public.lessons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  author_role text not null default 'student',
  title text not null check (char_length(btrim(title)) between 4 and 180),
  body text not null check (char_length(btrim(body)) between 4 and 4000),
  status text not null default 'open' check (status in ('open','resolved','hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academy_community_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.academy_community_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  author_role text not null default 'student',
  body text not null check (char_length(btrim(body)) between 2 and 3000),
  created_at timestamptz not null default now()
);

create index if not exists academy_community_threads_course_lesson_idx on public.academy_community_threads(course_id, lesson_id, created_at desc);
create index if not exists academy_community_threads_user_idx on public.academy_community_threads(user_id, created_at desc);
create index if not exists academy_community_replies_thread_idx on public.academy_community_replies(thread_id, created_at asc);

alter table public.academy_community_threads enable row level security;
alter table public.academy_community_replies enable row level security;

create or replace function private.can_access_academy_community(target_course uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select auth.uid() is not null and (
    exists (
      select 1 from public.enrollments e
      where e.user_id = auth.uid()
        and e.course_id = target_course
        and e.status = 'active'
    )
    or private.can_manage_course(target_course)
  );
$$;
revoke all on function private.can_access_academy_community(uuid) from public, anon;
grant execute on function private.can_access_academy_community(uuid) to authenticated, service_role;

create or replace function private.prepare_academy_community_author()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare p public.profiles%rowtype;
begin
  if auth.uid() is null then raise exception 'Autenticación requerida'; end if;
  new.user_id := auth.uid();
  select * into p from public.profiles where id = auth.uid();
  new.author_name := coalesce(nullif(btrim(p.full_name),''), 'Alumno Compás');
  new.author_role := coalesce(nullif(p.role,''), 'student');
  return new;
end;
$$;
revoke all on function private.prepare_academy_community_author() from public, anon, authenticated;
grant execute on function private.prepare_academy_community_author() to service_role;

drop trigger if exists academy_community_thread_author on public.academy_community_threads;
create trigger academy_community_thread_author before insert on public.academy_community_threads
for each row execute function private.prepare_academy_community_author();

drop trigger if exists academy_community_reply_author on public.academy_community_replies;
create trigger academy_community_reply_author before insert on public.academy_community_replies
for each row execute function private.prepare_academy_community_author();

create or replace function private.set_academy_community_thread_status(target_thread uuid, new_status text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare t public.academy_community_threads%rowtype; manager boolean;
begin
  if auth.uid() is null then raise exception 'Autenticación requerida'; end if;
  if new_status not in ('open','resolved','hidden') then raise exception 'Estado inválido'; end if;
  select * into t from public.academy_community_threads where id = target_thread;
  if not found then raise exception 'Conversación no encontrada'; end if;
  manager := private.can_manage_course(t.course_id);
  if new_status = 'hidden' and not manager then raise exception 'No autorizado'; end if;
  if new_status in ('open','resolved') and not (manager or t.user_id = auth.uid()) then raise exception 'No autorizado'; end if;
  update public.academy_community_threads set status = new_status, updated_at = now() where id = target_thread;
end;
$$;
revoke all on function private.set_academy_community_thread_status(uuid,text) from public, anon;
grant execute on function private.set_academy_community_thread_status(uuid,text) to authenticated, service_role;

create or replace function public.set_academy_community_thread_status(target_thread uuid, new_status text)
returns void
language sql security invoker
set search_path = ''
as $$ select private.set_academy_community_thread_status(target_thread, new_status); $$;
revoke all on function public.set_academy_community_thread_status(uuid,text) from public, anon;
grant execute on function public.set_academy_community_thread_status(uuid,text) to authenticated, service_role;

create or replace function private.notify_academy_community_reply()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare t public.academy_community_threads%rowtype; destination text;
begin
  select * into t from public.academy_community_threads where id = new.thread_id;
  if found and t.user_id <> new.user_id and to_regclass('public.academy_notifications') is not null then
    destination := case when t.lesson_id is null
      then '#course/' || t.course_id::text
      else '#lesson/' || t.course_id::text || '/' || t.lesson_id::text end;
    insert into public.academy_notifications(user_id, notification_type, title, body, target_path, entity_type, entity_id, dedupe_key)
    values(t.user_id, 'community_reply', 'Nueva respuesta en tu pregunta', left(new.author_name || ' respondió: ' || new.body, 280), destination, 'community_thread', t.id, 'community-reply:' || new.id::text)
    on conflict (dedupe_key) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function private.notify_academy_community_reply() from public, anon, authenticated;
grant execute on function private.notify_academy_community_reply() to service_role;

drop trigger if exists academy_community_reply_notification on public.academy_community_replies;
create trigger academy_community_reply_notification after insert on public.academy_community_replies
for each row execute function private.notify_academy_community_reply();

create policy academy_community_threads_select on public.academy_community_threads
for select to authenticated
using (private.can_access_academy_community(course_id) and (status <> 'hidden' or private.can_manage_course(course_id)));

create policy academy_community_threads_insert on public.academy_community_threads
for insert to authenticated
with check (
  user_id = auth.uid()
  and private.can_access_academy_community(course_id)
  and (lesson_id is null or exists (
    select 1 from public.lessons l join public.modules m on m.id = l.module_id
    where l.id = lesson_id and m.course_id = course_id
  ))
);

create policy academy_community_replies_select on public.academy_community_replies
for select to authenticated
using (exists (
  select 1 from public.academy_community_threads t
  where t.id = thread_id
    and private.can_access_academy_community(t.course_id)
    and (t.status <> 'hidden' or private.can_manage_course(t.course_id))
));

create policy academy_community_replies_insert on public.academy_community_replies
for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.academy_community_threads t
    where t.id = thread_id and t.status <> 'hidden'
      and private.can_access_academy_community(t.course_id)
  )
);

revoke all on public.academy_community_threads from anon;
revoke all on public.academy_community_replies from anon;
revoke all on public.academy_community_threads from authenticated;
revoke all on public.academy_community_replies from authenticated;
grant select, insert on public.academy_community_threads to authenticated;
grant select, insert on public.academy_community_replies to authenticated;
grant all on public.academy_community_threads to service_role;
grant all on public.academy_community_replies to service_role;

alter table public.academy_community_threads replica identity full;
alter table public.academy_community_replies replica identity full;
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='academy_community_threads') then alter publication supabase_realtime add table public.academy_community_threads; end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='academy_community_replies') then alter publication supabase_realtime add table public.academy_community_replies; end if;
end $$;

commit;
