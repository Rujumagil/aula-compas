-- ============================================================
-- COMPÁS ACADEMY · DASHBOARD ACADÉMICO ADMIN V18
-- Agregados de progreso, evaluaciones, certificados y riesgo.
-- No elimina ni modifica datos académicos existentes.
-- ============================================================

begin;

create or replace function private.get_academy_admin_dashboard(target_workspace uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Autenticación requerida';
  end if;

  if not exists (
    select 1
    from public.courses c
    where (target_workspace is null or c.workspace_id = target_workspace)
      and private.can_manage_course(c.id)
  ) then
    raise exception 'No autorizado para consultar este dashboard';
  end if;

  with managed_courses as (
    select c.id, c.title, c.category, c.status, c.workspace_id
    from public.courses c
    where (target_workspace is null or c.workspace_id = target_workspace)
      and private.can_manage_course(c.id)
  ),
  lesson_totals as (
    select mc.id as course_id, count(l.id)::int as total_lessons
    from managed_courses mc
    left join public.modules m on m.course_id = mc.id
    left join public.lessons l on l.module_id = m.id
    group by mc.id
  ),
  enrollment_progress as (
    select
      e.id as enrollment_id,
      e.user_id,
      e.course_id,
      e.status,
      e.enrolled_at,
      e.completed_at,
      lt.total_lessons,
      count(l.id) filter (where lp.completed is true)::int as completed_lessons,
      max(lp.updated_at) as last_lesson_activity
    from public.enrollments e
    join managed_courses mc on mc.id = e.course_id
    join lesson_totals lt on lt.course_id = e.course_id
    left join public.modules m on m.course_id = e.course_id
    left join public.lessons l on l.module_id = m.id
    left join public.lesson_progress lp on lp.lesson_id = l.id and lp.user_id = e.user_id
    group by e.id, e.user_id, e.course_id, e.status, e.enrolled_at, e.completed_at, lt.total_lessons
  ),
  assessment_activity as (
    select
      aa.user_id,
      a.course_id,
      max(coalesce(aa.graded_at, aa.submitted_at, aa.started_at)) as last_assessment_activity
    from public.assessment_attempts aa
    join public.assessments a on a.id = aa.assessment_id
    join managed_courses mc on mc.id = a.course_id
    group by aa.user_id, a.course_id
  ),
  assessment_stats as (
    select
      a.course_id,
      count(aa.id) filter (where aa.status = 'graded')::int as graded_attempts,
      count(aa.id) filter (where aa.status = 'graded' and aa.passed is true)::int as passed_attempts,
      round(avg(aa.score) filter (where aa.status = 'graded'), 1) as avg_score
    from public.assessments a
    join managed_courses mc on mc.id = a.course_id
    left join public.assessment_attempts aa on aa.assessment_id = a.id
    group by a.course_id
  ),
  certificate_stats as (
    select c.course_id, count(*) filter (where c.revoked_at is null)::int as certificates_issued
    from public.certificates c
    join managed_courses mc on mc.id = c.course_id
    group by c.course_id
  ),
  course_rows as (
    select
      mc.id,
      mc.title,
      mc.category,
      mc.status,
      lt.total_lessons,
      count(ep.enrollment_id) filter (where ep.status = 'active')::int as active_enrollments,
      count(ep.enrollment_id)::int as total_enrollments,
      count(ep.enrollment_id) filter (
        where ep.completed_at is not null
           or (ep.total_lessons > 0 and ep.completed_lessons >= ep.total_lessons)
      )::int as completed_enrollments,
      coalesce(round(avg(
        case
          when ep.total_lessons > 0 then (ep.completed_lessons::numeric / ep.total_lessons::numeric) * 100
          else 0
        end
      ),1),0) as avg_progress,
      coalesce(ast.graded_attempts,0) as graded_attempts,
      coalesce(ast.passed_attempts,0) as passed_attempts,
      coalesce(ast.avg_score,0) as avg_score,
      coalesce(cs.certificates_issued,0) as certificates_issued
    from managed_courses mc
    join lesson_totals lt on lt.course_id = mc.id
    left join enrollment_progress ep on ep.course_id = mc.id
    left join assessment_stats ast on ast.course_id = mc.id
    left join certificate_stats cs on cs.course_id = mc.id
    group by mc.id,mc.title,mc.category,mc.status,lt.total_lessons,ast.graded_attempts,ast.passed_attempts,ast.avg_score,cs.certificates_issued
  ),
  student_activity as (
    select
      ep.*,
      greatest(
        ep.enrolled_at,
        coalesce(ep.last_lesson_activity, ep.enrolled_at),
        coalesce(aa.last_assessment_activity, ep.enrolled_at)
      ) as last_activity
    from enrollment_progress ep
    left join assessment_activity aa on aa.user_id = ep.user_id and aa.course_id = ep.course_id
  ),
  at_risk as (
    select
      sa.user_id,
      p.full_name,
      p.email,
      sa.course_id,
      mc.title as course_title,
      sa.completed_lessons,
      sa.total_lessons,
      case when sa.total_lessons > 0 then round((sa.completed_lessons::numeric / sa.total_lessons::numeric) * 100,1) else 0 end as progress,
      sa.last_activity,
      greatest(0, floor(extract(epoch from (now() - sa.last_activity))/86400))::int as inactive_days
    from student_activity sa
    join managed_courses mc on mc.id = sa.course_id
    join public.profiles p on p.id = sa.user_id
    where sa.status = 'active'
      and (sa.total_lessons = 0 or sa.completed_lessons < sa.total_lessons)
      and sa.last_activity < now() - interval '7 days'
    order by sa.last_activity asc
    limit 30
  ),
  totals as (
    select
      count(distinct ep.user_id) filter (where ep.status = 'active')::int as active_students,
      count(ep.enrollment_id) filter (where ep.status = 'active')::int as active_enrollments,
      count(ep.enrollment_id)::int as total_enrollments,
      count(ep.enrollment_id) filter (
        where ep.completed_at is not null
           or (ep.total_lessons > 0 and ep.completed_lessons >= ep.total_lessons)
      )::int as completed_enrollments
    from enrollment_progress ep
  )
  select jsonb_build_object(
    'generated_at', now(),
    'summary', jsonb_build_object(
      'courses', (select count(*) from managed_courses),
      'active_students', coalesce(t.active_students,0),
      'active_enrollments', coalesce(t.active_enrollments,0),
      'total_enrollments', coalesce(t.total_enrollments,0),
      'completed_enrollments', coalesce(t.completed_enrollments,0),
      'completion_rate', case when coalesce(t.total_enrollments,0) > 0 then round((t.completed_enrollments::numeric / t.total_enrollments::numeric) * 100,1) else 0 end,
      'graded_attempts', coalesce((select sum(graded_attempts) from course_rows),0),
      'passed_attempts', coalesce((select sum(passed_attempts) from course_rows),0),
      'assessment_pass_rate', case when coalesce((select sum(graded_attempts) from course_rows),0) > 0 then round(((select sum(passed_attempts) from course_rows)::numeric / (select sum(graded_attempts) from course_rows)::numeric) * 100,1) else 0 end,
      'certificates', coalesce((select sum(certificates_issued) from course_rows),0),
      'at_risk_students', (select count(*) from at_risk)
    ),
    'courses', coalesce((select jsonb_agg(to_jsonb(cr) order by cr.title) from course_rows cr),'[]'::jsonb),
    'at_risk', coalesce((select jsonb_agg(to_jsonb(ar) order by ar.last_activity asc) from at_risk ar),'[]'::jsonb)
  ) into result
  from totals t;

  return coalesce(result, jsonb_build_object('summary','{}'::jsonb,'courses','[]'::jsonb,'at_risk','[]'::jsonb));
end;
$$;

revoke all on function private.get_academy_admin_dashboard(uuid) from public, anon, authenticated;
grant execute on function private.get_academy_admin_dashboard(uuid) to service_role;

create or replace function public.get_academy_admin_dashboard(target_workspace uuid default null)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.get_academy_admin_dashboard(target_workspace);
$$;

revoke all on function public.get_academy_admin_dashboard(uuid) from public, anon, authenticated;
grant execute on function public.get_academy_admin_dashboard(uuid) to authenticated, service_role;

commit;