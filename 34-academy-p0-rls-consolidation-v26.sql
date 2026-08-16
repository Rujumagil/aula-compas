-- Compás Academy V26 — P0 consolidación de políticas RLS permisivas
-- Objetivo: conservar la unión exacta de permisos actuales con una sola política por acción.
-- No modifica datos de negocio ni desactiva RLS.

-- -----------------------------------------------------------------------------
-- Evaluaciones: separar ALL en INSERT/UPDATE/DELETE y conservar una sola lectura.
-- -----------------------------------------------------------------------------

drop policy if exists assessment_answers_write on public.assessment_answers;

create policy assessment_answers_insert
on public.assessment_answers
for insert to authenticated
with check (
  exists (
    select 1
    from public.assessment_attempts aa
    join public.assessment_questions q on q.assessment_id = aa.assessment_id
    where aa.id = assessment_answers.attempt_id
      and q.id = assessment_answers.question_id
      and (
        aa.user_id = (select auth.uid())
        or exists (
          select 1 from public.profiles p
          where p.id = (select auth.uid())
            and p.role = any (array['admin'::text, 'instructor'::text])
        )
      )
  )
);

create policy assessment_answers_update
on public.assessment_answers
for update to authenticated
using (
  exists (
    select 1
    from public.assessment_attempts aa
    join public.assessment_questions q on q.assessment_id = aa.assessment_id
    where aa.id = assessment_answers.attempt_id
      and q.id = assessment_answers.question_id
      and (
        aa.user_id = (select auth.uid())
        or exists (
          select 1 from public.profiles p
          where p.id = (select auth.uid())
            and p.role = any (array['admin'::text, 'instructor'::text])
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.assessment_attempts aa
    join public.assessment_questions q on q.assessment_id = aa.assessment_id
    where aa.id = assessment_answers.attempt_id
      and q.id = assessment_answers.question_id
      and (
        aa.user_id = (select auth.uid())
        or exists (
          select 1 from public.profiles p
          where p.id = (select auth.uid())
            and p.role = any (array['admin'::text, 'instructor'::text])
        )
      )
  )
);

create policy assessment_answers_delete
on public.assessment_answers
for delete to authenticated
using (
  exists (
    select 1
    from public.assessment_attempts aa
    join public.assessment_questions q on q.assessment_id = aa.assessment_id
    where aa.id = assessment_answers.attempt_id
      and q.id = assessment_answers.question_id
      and (
        aa.user_id = (select auth.uid())
        or exists (
          select 1 from public.profiles p
          where p.id = (select auth.uid())
            and p.role = any (array['admin'::text, 'instructor'::text])
        )
      )
  )
);

drop policy if exists assessment_options_manager_write on public.assessment_options;

create policy assessment_options_manager_insert
on public.assessment_options
for insert to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = any (array['admin'::text, 'instructor'::text])
  )
);

create policy assessment_options_manager_update
on public.assessment_options
for update to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = any (array['admin'::text, 'instructor'::text])
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = any (array['admin'::text, 'instructor'::text])
  )
);

create policy assessment_options_manager_delete
on public.assessment_options
for delete to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = any (array['admin'::text, 'instructor'::text])
  )
);

drop policy if exists assessment_questions_manager_write on public.assessment_questions;

create policy assessment_questions_manager_insert
on public.assessment_questions
for insert to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = any (array['admin'::text, 'instructor'::text])
  )
);

create policy assessment_questions_manager_update
on public.assessment_questions
for update to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = any (array['admin'::text, 'instructor'::text])
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = any (array['admin'::text, 'instructor'::text])
  )
);

create policy assessment_questions_manager_delete
on public.assessment_questions
for delete to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = any (array['admin'::text, 'instructor'::text])
  )
);

drop policy if exists assessments_manager_all on public.assessments;
drop policy if exists assessments_student_read on public.assessments;

create policy assessments_select
on public.assessments
for select to authenticated
using (
  (
    status = 'published'::text
    and exists (
      select 1 from public.enrollments e
      where e.course_id = assessments.course_id
        and e.user_id = (select auth.uid())
        and e.status = 'active'::text
    )
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = any (array['admin'::text, 'instructor'::text])
  )
);

create policy assessments_manager_insert
on public.assessments
for insert to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = any (array['admin'::text, 'instructor'::text])
  )
);

create policy assessments_manager_update
on public.assessments
for update to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = any (array['admin'::text, 'instructor'::text])
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = any (array['admin'::text, 'instructor'::text])
  )
);

create policy assessments_manager_delete
on public.assessments
for delete to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = any (array['admin'::text, 'instructor'::text])
  )
);

-- -----------------------------------------------------------------------------
-- Cursos: una política por acción que conserva admin + alumno + instructor + workspace.
-- -----------------------------------------------------------------------------

drop policy if exists "Administradores gestionan cursos" on public.courses;
drop policy if exists "Alumnos ven cursos inscritos" on public.courses;
drop policy if exists instructor_courses_select on public.courses;
drop policy if exists instructor_courses_insert on public.courses;
drop policy if exists instructor_courses_update on public.courses;
drop policy if exists instructor_courses_delete on public.courses;
drop policy if exists workspace_courses_select on public.courses;
drop policy if exists workspace_courses_insert on public.courses;
drop policy if exists workspace_courses_update on public.courses;
drop policy if exists workspace_courses_delete on public.courses;

create policy courses_select_consolidated
on public.courses
for select to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1 from public.enrollments e
    where e.course_id = courses.id
      and e.user_id = (select auth.uid())
      and e.status = any (array['active'::text, 'completed'::text])
  )
  or (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'instructor'::text
    )
  )
  or (
    workspace_id is not null
    and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = courses.workspace_id
        and wm.user_id = (select auth.uid())
    )
  )
);

create policy courses_insert_consolidated
on public.courses
for insert to authenticated
with check (
  (select private.is_admin())
  or (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'instructor'::text
    )
  )
  or (
    created_by = (select auth.uid())
    and workspace_id is not null
    and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = courses.workspace_id
        and wm.user_id = (select auth.uid())
    )
  )
);

create policy courses_update_consolidated
on public.courses
for update to authenticated
using (
  (select private.is_admin())
  or (select private.can_manage_course(courses.id))
  or (
    workspace_id is not null
    and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = courses.workspace_id
        and wm.user_id = (select auth.uid())
    )
  )
)
with check (
  (select private.is_admin())
  or (select private.can_manage_course(courses.id))
  or (
    workspace_id is not null
    and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = courses.workspace_id
        and wm.user_id = (select auth.uid())
    )
  )
);

create policy courses_delete_consolidated
on public.courses
for delete to authenticated
using (
  (select private.is_admin())
  or (select private.can_manage_course(courses.id))
  or (
    workspace_id is not null
    and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = courses.workspace_id
        and wm.user_id = (select auth.uid())
    )
  )
);

-- -----------------------------------------------------------------------------
-- Inscripciones: la lectura existente ya incluye alumno + admin; separar escrituras.
-- -----------------------------------------------------------------------------

drop policy if exists "Administradores gestionan inscripciones" on public.enrollments;

create policy enrollments_admin_insert
on public.enrollments
for insert to authenticated
with check ((select private.is_admin()));

create policy enrollments_admin_update
on public.enrollments
for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy enrollments_admin_delete
on public.enrollments
for delete to authenticated
using ((select private.is_admin()));

-- -----------------------------------------------------------------------------
-- Bloques de lección: lectura autorizada ya subsume creador/admin; separar escrituras.
-- -----------------------------------------------------------------------------

drop policy if exists "gestionar bloques propios" on public.lesson_blocks;

create policy lesson_blocks_manager_insert
on public.lesson_blocks
for insert to authenticated
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
          where p.id = (select auth.uid()) and p.role = 'admin'::text
        )
      )
  )
);

create policy lesson_blocks_manager_update
on public.lesson_blocks
for update to authenticated
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
          where p.id = (select auth.uid()) and p.role = 'admin'::text
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
          where p.id = (select auth.uid()) and p.role = 'admin'::text
        )
      )
  )
);

create policy lesson_blocks_manager_delete
on public.lesson_blocks
for delete to authenticated
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
          where p.id = (select auth.uid()) and p.role = 'admin'::text
        )
      )
  )
);

-- -----------------------------------------------------------------------------
-- Lecciones: una política por acción.
-- -----------------------------------------------------------------------------

drop policy if exists "Administradores gestionan lecciones" on public.lessons;
drop policy if exists "Alumnos ven lecciones inscritas" on public.lessons;
drop policy if exists instructor_lessons_select on public.lessons;
drop policy if exists instructor_lessons_insert on public.lessons;
drop policy if exists instructor_lessons_update on public.lessons;
drop policy if exists instructor_lessons_delete on public.lessons;

create policy lessons_select_consolidated
on public.lessons
for select to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.modules m
    join public.enrollments e on e.course_id = m.course_id
    where m.id = lessons.module_id
      and e.user_id = (select auth.uid())
      and e.status = any (array['active'::text, 'completed'::text])
  )
  or exists (
    select 1 from public.modules m
    where m.id = lessons.module_id
      and (select private.can_manage_course(m.course_id))
  )
);

create policy lessons_insert_consolidated
on public.lessons
for insert to authenticated
with check (
  (select private.is_admin())
  or exists (
    select 1 from public.modules m
    where m.id = lessons.module_id
      and (select private.can_manage_course(m.course_id))
  )
);

create policy lessons_update_consolidated
on public.lessons
for update to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1 from public.modules m
    where m.id = lessons.module_id
      and (select private.can_manage_course(m.course_id))
  )
)
with check (
  (select private.is_admin())
  or exists (
    select 1 from public.modules m
    where m.id = lessons.module_id
      and (select private.can_manage_course(m.course_id))
  )
);

create policy lessons_delete_consolidated
on public.lessons
for delete to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1 from public.modules m
    where m.id = lessons.module_id
      and (select private.can_manage_course(m.course_id))
  )
);

-- -----------------------------------------------------------------------------
-- Módulos: eliminar nombres históricos con mojibake y crear reglas ASCII estables.
-- -----------------------------------------------------------------------------

do $$
declare
  p text;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'modules'
      and (
        policyname like 'Administradores gestionan m%'
        or policyname like 'Alumnos ven m%'
        or policyname like 'instructor_modules_%'
      )
  loop
    execute format('drop policy if exists %I on public.modules', p);
  end loop;
end
$$;

create policy modules_select_consolidated
on public.modules
for select to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1 from public.enrollments e
    where e.course_id = modules.course_id
      and e.user_id = (select auth.uid())
      and e.status = any (array['active'::text, 'completed'::text])
  )
  or (select private.can_manage_course(modules.course_id))
);

create policy modules_insert_consolidated
on public.modules
for insert to authenticated
with check (
  (select private.is_admin())
  or (select private.can_manage_course(modules.course_id))
);

create policy modules_update_consolidated
on public.modules
for update to authenticated
using (
  (select private.is_admin())
  or (select private.can_manage_course(modules.course_id))
)
with check (
  (select private.is_admin())
  or (select private.can_manage_course(modules.course_id))
);

create policy modules_delete_consolidated
on public.modules
for delete to authenticated
using (
  (select private.is_admin())
  or (select private.can_manage_course(modules.course_id))
);

-- -----------------------------------------------------------------------------
-- Recursos: resources_authorized_read ya contiene público + admin + alumno + gestor.
-- Las políticas managers_* ya contienen admin + gestor para escritura.
-- -----------------------------------------------------------------------------

drop policy if exists "Administradores gestionan recursos" on public.resources;
drop policy if exists "Alumnos ven recursos autorizados" on public.resources;

-- -----------------------------------------------------------------------------
-- Accesos: separar ALL administrativo y consolidar SELECT admin + propietario.
-- -----------------------------------------------------------------------------

drop policy if exists "admin resource access" on public.resource_access;
drop policy if exists "own resource access" on public.resource_access;

create policy resource_access_select
on public.resource_access
for select to authenticated
using (
  is_aula_admin()
  or user_id = (select auth.uid())
);

create policy resource_access_admin_insert
on public.resource_access
for insert to authenticated
with check (is_aula_admin());

create policy resource_access_admin_update
on public.resource_access
for update to authenticated
using (is_aula_admin())
with check (is_aula_admin());

create policy resource_access_admin_delete
on public.resource_access
for delete to authenticated
using (is_aula_admin());

drop policy if exists "admin student access" on public.student_access;
drop policy if exists "own student access" on public.student_access;

create policy student_access_select
on public.student_access
for select to authenticated
using (
  is_aula_admin()
  or user_id = (select auth.uid())
);

create policy student_access_admin_insert
on public.student_access
for insert to authenticated
with check (is_aula_admin());

create policy student_access_admin_update
on public.student_access
for update to authenticated
using (is_aula_admin())
with check (is_aula_admin());

create policy student_access_admin_delete
on public.student_access
for delete to authenticated
using (is_aula_admin());
