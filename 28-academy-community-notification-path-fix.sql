-- COMPÁS ACADEMY · COMUNIDAD V21.1
-- Corrige el destino de notificaciones cuando la conversación es general del curso.

create or replace function private.notify_academy_community_reply()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  t public.academy_community_threads%rowtype;
  destination text;
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
