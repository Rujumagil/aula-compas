-- ============================================================
-- COMPÁS ACADEMY · P0 RLS PERFORMANCE V25
-- Evita reevaluar auth.uid() por fila usando (select auth.uid()).
-- Conserva las reglas de autorización existentes y corrige dos joins
-- históricos de workspaces que comparaban wm.workspace_id = wm.id.
-- ============================================================

begin;

-- block_responses -----------------------------------------------------------
drop policy if exists "alumno gestiona sus respuestas" on public.block_responses;
create policy "alumno gestiona sus respuestas"
on public.block_responses
for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

-- contact_notes -------------------------------------------------------------
drop policy if exists "contact_notes_delete_own_or_super_admin" on public.contact_notes;
create policy "contact_notes_delete_own_or_super_admin"
on public.contact_notes
for delete
to authenticated
using (
  (select public.is_super_admin())
  or (
    public.is_workspace_member(workspace_id)
    and user_id = (select auth.uid())
  )
);

drop policy if exists "contact_notes_insert_workspace_member" on public.contact_notes;
create policy "contact_notes_insert_workspace_member"
on public.contact_notes
for insert
to authenticated
with check (
  ((select public.is_super_admin()) or public.is_workspace_member(workspace_id))
  and (
    user_id is null
    or user_id = (select auth.uid())
    or (select public.is_super_admin())
  )
);

drop policy if exists "contact_notes_update_own_or_super_admin" on public.contact_notes;
create policy "contact_notes_update_own_or_super_admin"
on public.contact_notes
for update
to authenticated
using (
  (select public.is_super_admin())
  or (
    public.is_workspace_member(workspace_id)
    and user_id = (select auth.uid())
  )
)
with check (
  (select public.is_super_admin())
  or (
    public.is_workspace_member(workspace_id)
    and user_id = (select auth.uid())
  )
);

-- contacts ------------------------------------------------------------------
drop policy if exists "contacts_delete_workspace_admin" on public.contacts;
create policy "contacts_delete_workspace_admin"
on public.contacts
for delete
to authenticated
using (
  (select public.is_super_admin())
  or exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = contacts.workspace_id
      and wm.user_id = (select auth.uid())
      and wm.status = 'active'
      and wm.role in ('owner','admin','manager')
  )
);

-- course_versions -----------------------------------------------------------
drop policy if exists "gestionar versiones de cursos propios" on public.course_versions;
create policy "gestionar versiones de cursos propios"
on public.course_versions
for all
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = course_versions.course_id
      and (
        c.created_by = (select auth.uid())
        or exists (
          select 1
          from public.profiles p
          where p.id = (select auth.uid())
            and p.role = 'admin'
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.courses c
    where c.id = course_versions.course_id
      and (
        c.created_by = (select auth.uid())
        or exists (
          select 1
          from public.profiles p
          where p.id = (select auth.uid())
            and p.role = 'admin'
        )
      )
  )
);

-- courses -------------------------------------------------------------------
drop policy if exists "workspace_courses_delete" on public.courses;
create policy "workspace_courses_delete"
on public.courses
for delete
to authenticated
using (
  workspace_id is not null
  and exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = courses.workspace_id
      and wm.user_id = (select auth.uid())
  )
);

drop policy if exists "workspace_courses_insert" on public.courses;
create policy "workspace_courses_insert"
on public.courses
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and workspace_id is not null
  and exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = courses.workspace_id
      and wm.user_id = (select auth.uid())
  )
);

drop policy if exists "workspace_courses_select" on public.courses;
create policy "workspace_courses_select"
on public.courses
for select
to authenticated
using (
  workspace_id is not null
  and exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = courses.workspace_id
      and wm.user_id = (select auth.uid())
  )
);

drop policy if exists "workspace_courses_update" on public.courses;
create policy "workspace_courses_update"
on public.courses
for update
to authenticated
using (
  workspace_id is not null
  and exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = courses.workspace_id
      and wm.user_id = (select auth.uid())
  )
)
with check (
  workspace_id is not null
  and exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = courses.workspace_id
      and wm.user_id = (select auth.uid())
  )
);

-- lesson_blocks -------------------------------------------------------------
drop policy if exists "gestionar bloques propios" on public.lesson_blocks;
create policy "gestionar bloques propios"
on public.lesson_blocks
for all
to authenticated
using (
  exists (
    select 1
    from public.lessons l
    join public.modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
    where l.id = lesson_blocks.lesson_id
      and (
        c.created_by = (select auth.uid())
        or exists (
          select 1 from public.profiles p
          where p.id = (select auth.uid()) and p.role = 'admin'
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.lessons l
    join public.modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
    where l.id = lesson_blocks.lesson_id
      and (
        c.created_by = (select auth.uid())
        or exists (
          select 1 from public.profiles p
          where p.id = (select auth.uid()) and p.role = 'admin'
        )
      )
  )
);

drop policy if exists "leer bloques de cursos autorizados" on public.lesson_blocks;
create policy "leer bloques de cursos autorizados"
on public.lesson_blocks
for select
to authenticated
using (
  exists (
    select 1
    from public.lessons l
    join public.modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
    where l.id = lesson_blocks.lesson_id
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

-- resources -----------------------------------------------------------------
drop policy if exists "resources_authorized_read" on public.resources;
create policy "resources_authorized_read"
on public.resources
for select
to authenticated
using (
  is_public
  or (select private.is_admin())
  or (
    course_id is not null
    and exists (
      select 1
      from public.enrollments e
      where e.user_id = (select auth.uid())
        and e.course_id = resources.course_id
        and e.status in ('active','completed')
    )
  )
  or (
    course_id is not null
    and (select private.can_manage_course(resources.course_id))
  )
);

-- student/resource access ---------------------------------------------------
drop policy if exists "own student access" on public.student_access;
create policy "own student access"
on public.student_access
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "own resource access" on public.resource_access;
create policy "own resource access"
on public.resource_access
for select
to authenticated
using (user_id = (select auth.uid()));

-- workspaces ----------------------------------------------------------------
drop policy if exists "workspace_delete_manager" on public.workspaces;
create policy "workspace_delete_manager"
on public.workspaces
for delete
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
  or created_by = (select auth.uid())
);

drop policy if exists "workspace_insert_admin" on public.workspaces;
create policy "workspace_insert_admin"
on public.workspaces
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

drop policy if exists "workspace_select_member_or_admin" on public.workspaces;
create policy "workspace_select_member_or_admin"
on public.workspaces
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
  or created_by = (select auth.uid())
  or exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = workspaces.id
      and wm.user_id = (select auth.uid())
  )
);

drop policy if exists "workspace_update_manager" on public.workspaces;
create policy "workspace_update_manager"
on public.workspaces
for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
  or created_by = (select auth.uid())
  or exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = workspaces.id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner','admin')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
  or created_by = (select auth.uid())
  or exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = workspaces.id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner','admin')
  )
);

commit;
