-- COMPÁS ACADEMY · P1 — CORRECCIÓN DE SEGURIDAD DE OPCIONES
-- Aplicar después de 16-academy-assessments.sql.
begin;

drop view if exists public.assessment_options_public;
drop policy if exists assessment_options_student_read on public.assessment_options;

create policy assessment_options_student_read on public.assessment_options
for select to authenticated
using (
  exists (
    select 1
    from public.assessment_questions q
    join public.assessments a on a.id=q.assessment_id
    where q.id=assessment_options.question_id
      and a.status='published'
      and exists (
        select 1 from public.enrollments e
        where e.course_id=a.course_id
          and e.user_id=(select auth.uid())
          and e.status='active'
      )
  )
  or exists (
    select 1 from public.profiles p
    where p.id=(select auth.uid()) and p.role in ('admin','instructor')
  )
);

-- El cliente autenticado puede leer únicamente columnas que no revelan la solución.
revoke all on public.assessment_options from anon, authenticated;
grant select(id,question_id,label,position,created_at) on public.assessment_options to authenticated;
grant insert,update,delete on public.assessment_options to authenticated;

commit;
