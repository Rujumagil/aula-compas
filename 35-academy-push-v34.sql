-- Compás Academy V34 — Web Push + sonido en tiempo real
-- Depende de Compás Ecosystem Push V61.5 en el Supabase central.

begin;

create or replace function public.register_academy_push_v34(
  p_endpoint text,
  p_p256dh text,
  p_auth_key text,
  p_user_agent text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_workspace uuid;
  v_now timestamptz := now();
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.academy_profiles ap where ap.id = v_user
  ) then
    raise exception 'Academy profile required' using errcode = '42501';
  end if;

  if p_endpoint is null
     or length(btrim(p_endpoint)) < 20
     or length(p_endpoint) > 5000
     or left(lower(btrim(p_endpoint)), 8) <> 'https://' then
    raise exception 'Invalid Push endpoint' using errcode = '22023';
  end if;

  if p_p256dh is null or length(p_p256dh) < 20 or length(p_p256dh) > 1000
     or p_auth_key is null or length(p_auth_key) < 8 or length(p_auth_key) > 1000 then
    raise exception 'Invalid Push keys' using errcode = '22023';
  end if;

  select w.id into v_workspace
  from public.workspaces w
  where w.slug = 'proyecto-compas'
    and w.status = 'active'
  limit 1;

  if v_workspace is null then
    raise exception 'Internal workspace unavailable' using errcode = 'P0002';
  end if;

  update public.notification_push_subscriptions
  set active = false,
      updated_at = v_now
  where endpoint = btrim(p_endpoint)
    and user_id <> v_user;

  insert into public.notification_push_subscriptions (
    workspace_id,
    user_id,
    endpoint,
    p256dh,
    auth_key,
    app_scope,
    user_agent,
    device_label,
    active,
    failure_count,
    updated_at
  ) values (
    v_workspace,
    v_user,
    btrim(p_endpoint),
    btrim(p_p256dh),
    btrim(p_auth_key),
    'academy',
    nullif(left(coalesce(p_user_agent, ''), 1000), ''),
    'Compás Academy Web / PWA',
    true,
    0,
    v_now
  )
  on conflict (workspace_id, user_id, endpoint)
  do update set
    p256dh = excluded.p256dh,
    auth_key = excluded.auth_key,
    app_scope = 'academy',
    user_agent = excluded.user_agent,
    device_label = excluded.device_label,
    active = true,
    failure_count = 0,
    updated_at = v_now;

  insert into public.notification_delivery_preferences (
    workspace_id,
    user_id,
    sound_enabled,
    sound_minimum_priority,
    push_enabled,
    push_minimum_priority,
    push_configured_at,
    updated_at
  ) values (
    v_workspace,
    v_user,
    true,
    'normal',
    true,
    'normal',
    v_now,
    v_now
  )
  on conflict (workspace_id, user_id)
  do update set
    push_enabled = true,
    push_minimum_priority = coalesce(
      public.notification_delivery_preferences.push_minimum_priority,
      'normal'
    ),
    push_configured_at = coalesce(
      public.notification_delivery_preferences.push_configured_at,
      v_now
    ),
    updated_at = v_now;

  return true;
end;
$$;

revoke all on function public.register_academy_push_v34(text,text,text,text)
  from public, anon;
grant execute on function public.register_academy_push_v34(text,text,text,text)
  to authenticated, service_role;

create or replace function public.academy_notification_to_push_v34()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_workspace uuid;
  v_priority text;
  v_severity text;
  v_href text;
begin
  if not exists (select 1 from public.profiles p where p.id = new.user_id) then
    return new;
  end if;

  select w.id into v_workspace
  from public.workspaces w
  where w.slug = 'proyecto-compas'
    and w.status = 'active'
  limit 1;

  if v_workspace is null then
    raise warning 'ACADEMY_PUSH_V34: internal workspace unavailable';
    return new;
  end if;

  v_priority := case
    when new.notification_type in ('certificate_ready','inactivity','payment_issue') then 'important'
    else 'normal'
  end;

  v_severity := case
    when new.notification_type in ('certificate_ready') then 'success'
    when new.notification_type in ('inactivity','payment_issue') then 'warning'
    else 'info'
  end;

  v_href := case
    when new.target_path is null or btrim(new.target_path) = '' then '/'
    when left(new.target_path, 1) = '#' then '/' || new.target_path
    when left(new.target_path, 1) = '/' then new.target_path
    else '/' || new.target_path
  end;

  insert into public.notifications (
    workspace_id,
    user_id,
    category,
    event_type,
    severity,
    priority,
    title,
    body,
    href,
    entity_type,
    entity_id,
    metadata,
    dedupe_key
  ) values (
    v_workspace,
    new.user_id,
    'academy',
    left(new.notification_type, 100),
    v_severity,
    v_priority,
    left(new.title, 180),
    left(new.body, 1000),
    left(v_href, 500),
    coalesce(new.entity_type, 'academy_notification'),
    new.entity_id::text,
    jsonb_build_object(
      'app_scope', 'academy',
      'academy_notification_id', new.id,
      'academy_notification_type', new.notification_type,
      'target_path', new.target_path
    ),
    'academy:' || new.id::text
  )
  on conflict (user_id, dedupe_key) do nothing;

  return new;
exception
  when others then
    raise warning 'ACADEMY_PUSH_V34_ERROR: %', sqlerrm;
    return new;
end;
$$;

revoke execute on function public.academy_notification_to_push_v34()
  from public, anon, authenticated;

drop trigger if exists academy_notification_push_v34
  on public.academy_notifications;

create trigger academy_notification_push_v34
after insert on public.academy_notifications
for each row
execute function public.academy_notification_to_push_v34();

-- Permite que la app abierta reproduzca sonido al recibir un aviso nuevo.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'academy_notifications'
  ) then
    alter publication supabase_realtime add table public.academy_notifications;
  end if;
end;
$$;

comment on function public.register_academy_push_v34(text,text,text,text) is
  'V34: registra el navegador autenticado de Compás Academy en el motor central Push.';

comment on function public.academy_notification_to_push_v34() is
  'V34: convierte academy_notifications en notificaciones Push con app_scope=academy.';

notify pgrst, 'reload schema';

commit;
