-- ============================================================
-- COMPÁS ACADEMY · P0 SECURITY V23
-- Cierra avisos authenticated_security_definer_function_executable
-- usando el patrón: RPC pública SECURITY INVOKER -> implementación private.
-- No elimina datos ni cambia firmas públicas.
-- ============================================================

begin;

-- Helpers privilegiados fuera del esquema expuesto.
create or replace function private.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and platform_role = 'super_admin'
      and status = 'active'
  );
$$;

create or replace function private.is_workspace_member(requested_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = requested_workspace_id
      and user_id = (select auth.uid())
      and status = 'active'
  );
$$;

create or replace function private.admin_change_student_access_status_impl(
  target_access uuid,
  new_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.student_access%rowtype;
  row record;
  old text;
begin
  if not (select private.is_aula_admin()) then
    raise exception 'Acceso denegado';
  end if;

  select * into a
  from public.student_access
  where id = target_access;

  if not found then
    raise exception 'Acceso no encontrado';
  end if;

  old := a.status;

  update public.student_access
  set status = new_status,
      updated_at = now()
  where id = target_access;

  for row in
    select * from public.product_contents where product_id = a.product_id
  loop
    if row.content_type = 'course' then
      update public.enrollments
      set status = case when new_status = 'active' then 'active' else 'cancelled' end
      where user_id = a.user_id
        and course_id = row.course_id;
    elsif row.content_type = 'resource' then
      update public.resource_access
      set status = new_status
      where user_id = a.user_id
        and resource_id = row.resource_id
        and product_id = a.product_id;
    end if;
  end loop;

  insert into public.access_history(
    access_id,user_id,product_id,action,previous_status,new_status,performed_by
  ) values (
    a.id,a.user_id,a.product_id,new_status,old,new_status,(select auth.uid())
  );
end;
$$;

create or replace function private.admin_grant_product_access_impl(
  target_user uuid,
  target_product uuid,
  access_source text default 'manual',
  access_reference text default null,
  access_expires_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  aid uuid;
  row record;
begin
  if not (select private.is_aula_admin()) then
    raise exception 'Acceso denegado';
  end if;

  insert into public.student_access(
    user_id,product_id,status,source,reference,granted_by,granted_at,expires_at,updated_at
  ) values (
    target_user,target_product,'active',coalesce(access_source,'manual'),access_reference,
    (select auth.uid()),now(),access_expires_at,now()
  )
  on conflict(user_id,product_id) do update
  set status='active',
      source=excluded.source,
      reference=excluded.reference,
      granted_by=(select auth.uid()),
      granted_at=now(),
      expires_at=excluded.expires_at,
      updated_at=now()
  returning id into aid;

  for row in
    select * from public.product_contents where product_id = target_product
  loop
    if row.content_type = 'course' then
      insert into public.enrollments(user_id,course_id,status,enrolled_at)
      values(target_user,row.course_id,'active',now())
      on conflict(user_id,course_id) do update
      set status='active', enrolled_at=now();
    elsif row.content_type = 'resource' then
      insert into public.resource_access(user_id,resource_id,product_id,status,granted_at,expires_at)
      values(target_user,row.resource_id,target_product,'active',now(),access_expires_at)
      on conflict(user_id,resource_id,product_id) do update
      set status='active', granted_at=now(), expires_at=excluded.expires_at;
    end if;
  end loop;

  insert into public.access_history(
    access_id,user_id,product_id,action,new_status,reference,performed_by
  ) values (
    aid,target_user,target_product,'granted','active',access_reference,(select auth.uid())
  );

  return aid;
end;
$$;

create or replace function private.admin_set_user_role_impl(
  target_user uuid,
  new_role text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_admin()) then
    raise exception 'No autorizado';
  end if;

  if new_role not in ('student', 'instructor', 'admin') then
    raise exception 'Rol inválido';
  end if;

  update public.profiles
  set role = new_role
  where id = target_user;
end;
$$;

create or replace function private.delete_managed_course_impl(target_course uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.can_manage_course(target_course)) then
    raise exception 'No autorizado para eliminar este curso';
  end if;

  if to_regclass('public.lesson_progress') is not null then
    execute $sql$
      delete from public.lesson_progress lp
      using public.lessons l, public.modules m
      where lp.lesson_id = l.id
        and l.module_id = m.id
        and m.course_id = $1
    $sql$ using target_course;
  end if;

  if to_regclass('public.certificates') is not null then
    execute 'delete from public.certificates where course_id = $1' using target_course;
  end if;

  if to_regclass('public.events') is not null then
    execute 'delete from public.events where course_id = $1' using target_course;
  end if;

  delete from public.enrollments where course_id = target_course;
  delete from public.resources where course_id = target_course;
  delete from public.lessons
  where module_id in (select id from public.modules where course_id = target_course);
  delete from public.modules where course_id = target_course;
  delete from public.courses where id = target_course;
end;
$$;

-- Fachadas públicas: mismas firmas, sin SECURITY DEFINER.
create or replace function public.is_aula_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select private.is_aula_admin(); $$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select private.is_super_admin(); $$;

create or replace function public.is_workspace_member(requested_workspace_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select private.is_workspace_member(requested_workspace_id); $$;

create or replace function public.admin_change_student_access_status(
  target_access uuid,
  new_status text
)
returns void
language sql
security invoker
set search_path = ''
as $$ select private.admin_change_student_access_status_impl(target_access,new_status); $$;

create or replace function public.admin_grant_product_access(
  target_user uuid,
  target_product uuid,
  access_source text default 'manual',
  access_reference text default null,
  access_expires_at timestamptz default null
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.admin_grant_product_access_impl(
    target_user,target_product,access_source,access_reference,access_expires_at
  );
$$;

create or replace function public.admin_set_user_role(
  target_user uuid,
  new_role text
)
returns void
language sql
security invoker
set search_path = ''
as $$ select private.admin_set_user_role_impl(target_user,new_role); $$;

create or replace function public.delete_managed_course(target_course uuid)
returns void
language sql
security invoker
set search_path = ''
as $$ select private.delete_managed_course_impl(target_course); $$;

-- Mínimo privilegio: nada para PUBLIC/anon; authenticated y service_role
-- solo pueden entrar por las fachadas públicas y helpers privados validados.
revoke all on function private.is_super_admin() from public, anon;
revoke all on function private.is_workspace_member(uuid) from public, anon;
revoke all on function private.admin_change_student_access_status_impl(uuid,text) from public, anon;
revoke all on function private.admin_grant_product_access_impl(uuid,uuid,text,text,timestamptz) from public, anon;
revoke all on function private.admin_set_user_role_impl(uuid,text) from public, anon;
revoke all on function private.delete_managed_course_impl(uuid) from public, anon;

grant execute on function private.is_super_admin() to authenticated, service_role;
grant execute on function private.is_workspace_member(uuid) to authenticated, service_role;
grant execute on function private.admin_change_student_access_status_impl(uuid,text) to authenticated, service_role;
grant execute on function private.admin_grant_product_access_impl(uuid,uuid,text,text,timestamptz) to authenticated, service_role;
grant execute on function private.admin_set_user_role_impl(uuid,text) to authenticated, service_role;
grant execute on function private.delete_managed_course_impl(uuid) to authenticated, service_role;

revoke all on function public.is_aula_admin() from public, anon;
revoke all on function public.is_super_admin() from public, anon;
revoke all on function public.is_workspace_member(uuid) from public, anon;
revoke all on function public.admin_change_student_access_status(uuid,text) from public, anon;
revoke all on function public.admin_grant_product_access(uuid,uuid,text,text,timestamptz) from public, anon;
revoke all on function public.admin_set_user_role(uuid,text) from public, anon;
revoke all on function public.delete_managed_course(uuid) from public, anon;

grant execute on function public.is_aula_admin() to authenticated, service_role;
grant execute on function public.is_super_admin() to authenticated, service_role;
grant execute on function public.is_workspace_member(uuid) to authenticated, service_role;
grant execute on function public.admin_change_student_access_status(uuid,text) to authenticated, service_role;
grant execute on function public.admin_grant_product_access(uuid,uuid,text,text,timestamptz) to authenticated, service_role;
grant execute on function public.admin_set_user_role(uuid,text) to authenticated, service_role;
grant execute on function public.delete_managed_course(uuid) to authenticated, service_role;

commit;
