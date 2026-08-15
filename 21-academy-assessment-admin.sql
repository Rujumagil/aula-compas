-- ============================================================
-- COMPÁS ACADEMY · P1 — ADMINISTRACIÓN DE EVALUACIONES V15
-- Lectura de respuestas correctas solo para gestores y calificación manual segura.
-- ============================================================
begin;

create schema if not exists private;
grant usage on schema private to authenticated, service_role;

create or replace function private.get_assessment_manager_options_impl(target_assessment uuid)
returns table(id uuid, question_id uuid, label text, is_correct boolean, option_position integer)
language plpgsql security definer set search_path=public
as $function$
declare target_course uuid;
begin
  select a.course_id into target_course from public.assessments a where a.id=target_assessment;
  if target_course is null or not private.can_manage_course(target_course) then
    raise exception 'No autorizado para administrar esta evaluación';
  end if;

  return query
  select o.id,o.question_id,o.label,o.is_correct,o.position
  from public.assessment_options o
  join public.assessment_questions q on q.id=o.question_id
  where q.assessment_id=target_assessment
  order by q.position,o.position,o.id;
end $function$;

create or replace function private.grade_assessment_attempt_impl(target_attempt uuid, manual_grades jsonb default '[]'::jsonb)
returns table(final_score numeric, final_passed boolean)
language plpgsql security definer set search_path=public
as $function$
declare
  at public.assessment_attempts%rowtype;
  a public.assessments%rowtype;
  q record;
  grade jsonb;
  awarded numeric;
  correct_flag boolean;
  total_points numeric:=0;
  earned_points numeric:=0;
  computed_score numeric;
  computed_passed boolean;
begin
  select * into at from public.assessment_attempts where id=target_attempt and status='submitted';
  if not found then raise exception 'El intento no está pendiente de revisión'; end if;

  select * into a from public.assessments where id=at.assessment_id;
  if not found or not private.can_manage_course(a.course_id) then
    raise exception 'No autorizado para calificar este intento';
  end if;

  for q in select * from public.assessment_questions where assessment_id=a.id order by position,id loop
    total_points:=total_points+q.points;

    if q.question_type='short_text' then
      grade:=null;
      select value into grade
      from jsonb_array_elements(coalesce(manual_grades,'[]'::jsonb)) value
      where value->>'question_id'=q.id::text
      limit 1;

      awarded:=coalesce((grade->>'points')::numeric,0);
      correct_flag:=coalesce((grade->>'correct')::boolean,false);
      if awarded<0 or awarded>q.points then
        raise exception 'Puntaje inválido para la pregunta %',q.id;
      end if;

      insert into public.assessment_answers(attempt_id,question_id,selected_option_ids,text_answer,is_correct,points_awarded,answered_at)
      values(at.id,q.id,'{}'::uuid[],null,correct_flag,awarded,now())
      on conflict(attempt_id,question_id) do update
      set is_correct=excluded.is_correct,points_awarded=excluded.points_awarded;

      earned_points:=earned_points+awarded;
    else
      earned_points:=earned_points+coalesce((
        select ans.points_awarded
        from public.assessment_answers ans
        where ans.attempt_id=at.id and ans.question_id=q.id
      ),0);
    end if;
  end loop;

  computed_score:=case when total_points>0 then round((earned_points/total_points)*100,2) else 0 end;
  computed_passed:=computed_score>=a.passing_score;

  update public.assessment_attempts
  set status='graded',score=computed_score,passed=computed_passed,graded_at=now()
  where id=at.id;

  return query select computed_score,computed_passed;
end $function$;

revoke all on function private.get_assessment_manager_options_impl(uuid) from public,anon;
revoke all on function private.grade_assessment_attempt_impl(uuid,jsonb) from public,anon;
grant execute on function private.get_assessment_manager_options_impl(uuid) to authenticated,service_role;
grant execute on function private.grade_assessment_attempt_impl(uuid,jsonb) to authenticated,service_role;

create or replace function public.get_assessment_manager_options(target_assessment uuid)
returns table(id uuid, question_id uuid, label text, is_correct boolean, option_position integer)
language sql security invoker set search_path=''
as $$ select * from private.get_assessment_manager_options_impl(target_assessment); $$;

create or replace function public.grade_assessment_attempt(target_attempt uuid, manual_grades jsonb default '[]'::jsonb)
returns table(final_score numeric, final_passed boolean)
language sql security invoker set search_path=''
as $$ select * from private.grade_assessment_attempt_impl(target_attempt,manual_grades); $$;

revoke all on function public.get_assessment_manager_options(uuid) from public,anon;
revoke all on function public.grade_assessment_attempt(uuid,jsonb) from public,anon;
grant execute on function public.get_assessment_manager_options(uuid) to authenticated,service_role;
grant execute on function public.grade_assessment_attempt(uuid,jsonb) to authenticated,service_role;

commit;
