-- ============================================================
-- COMPÁS ACADEMY · P1 — MOTOR SEGURO DE EVALUACIONES V14
-- La calificación se ejecuta únicamente en PostgreSQL.
-- ============================================================
begin;

-- El cliente no puede alterar puntajes, estado ni campos de corrección directamente.
revoke insert, update, delete on public.assessment_attempts from anon, authenticated;
revoke insert, update, delete on public.assessment_answers from anon, authenticated;
grant select on public.assessment_attempts to authenticated;
grant select on public.assessment_answers to authenticated;

create or replace function public.start_assessment_attempt(target_assessment uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $function$
declare
  uid uuid := auth.uid();
  a public.assessments%rowtype;
  existing public.assessment_attempts%rowtype;
  next_attempt integer;
begin
  if uid is null then raise exception 'Autenticación requerida'; end if;

  select * into a from public.assessments where id=target_assessment and status='published';
  if not found then raise exception 'Evaluación no disponible'; end if;

  if not exists (
    select 1 from public.enrollments e
    where e.course_id=a.course_id and e.user_id=uid and e.status='active'
  ) then raise exception 'No tienes acceso a este curso'; end if;

  select * into existing
  from public.assessment_attempts
  where assessment_id=a.id and user_id=uid and status='in_progress'
  order by started_at desc limit 1;

  if found then
    if a.time_limit_minutes is null or existing.started_at + make_interval(mins => a.time_limit_minutes) > now() then
      return existing.id;
    end if;
    update public.assessment_attempts set status='abandoned', submitted_at=now() where id=existing.id;
  end if;

  select coalesce(max(attempt_number),0)+1 into next_attempt
  from public.assessment_attempts where assessment_id=a.id and user_id=uid;

  if a.max_attempts is not null and next_attempt > a.max_attempts then
    raise exception 'Ya utilizaste el número máximo de intentos';
  end if;

  insert into public.assessment_attempts(assessment_id,user_id,attempt_number,status)
  values(a.id,uid,next_attempt,'in_progress')
  returning id into existing.id;

  return existing.id;
end;
$function$;

create or replace function public.save_assessment_answer(
  target_attempt uuid,
  target_question uuid,
  selected_options uuid[] default '{}',
  answer_text text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  uid uuid := auth.uid();
  at public.assessment_attempts%rowtype;
  a public.assessments%rowtype;
  q public.assessment_questions%rowtype;
  invalid_count integer;
begin
  if uid is null then raise exception 'Autenticación requerida'; end if;

  select * into at from public.assessment_attempts
  where id=target_attempt and user_id=uid and status='in_progress';
  if not found then raise exception 'Intento no disponible'; end if;

  select * into a from public.assessments where id=at.assessment_id;
  if a.time_limit_minutes is not null and at.started_at + make_interval(mins => a.time_limit_minutes) <= now() then
    update public.assessment_attempts set status='abandoned', submitted_at=now() where id=at.id;
    raise exception 'El tiempo de la evaluación terminó';
  end if;

  select * into q from public.assessment_questions
  where id=target_question and assessment_id=at.assessment_id;
  if not found then raise exception 'Pregunta inválida para este intento'; end if;

  select count(*) into invalid_count
  from unnest(coalesce(selected_options,'{}'::uuid[])) s(id)
  where not exists(select 1 from public.assessment_options o where o.id=s.id and o.question_id=q.id);
  if invalid_count>0 then raise exception 'Una opción seleccionada no pertenece a esta pregunta'; end if;

  insert into public.assessment_answers(attempt_id,question_id,selected_option_ids,text_answer,is_correct,points_awarded,answered_at)
  values(at.id,q.id,coalesce(selected_options,'{}'::uuid[]),nullif(trim(answer_text),''),null,null,now())
  on conflict(attempt_id,question_id) do update set
    selected_option_ids=excluded.selected_option_ids,
    text_answer=excluded.text_answer,
    is_correct=null,
    points_awarded=null,
    answered_at=now();
end;
$function$;

create or replace function public.submit_assessment_attempt(target_attempt uuid)
returns table(score numeric, passed boolean, result_status text)
language plpgsql
security definer
set search_path = public
as $function$
declare
  uid uuid := auth.uid();
  at public.assessment_attempts%rowtype;
  a public.assessments%rowtype;
  q record;
  answer_row public.assessment_answers%rowtype;
  correct_ids uuid[];
  selected_ids uuid[];
  exact_match boolean;
  total_points numeric := 0;
  earned_points numeric := 0;
  has_manual boolean := false;
  final_score numeric;
  final_passed boolean;
begin
  if uid is null then raise exception 'Autenticación requerida'; end if;

  select * into at from public.assessment_attempts
  where id=target_attempt and user_id=uid and status='in_progress';
  if not found then raise exception 'Intento no disponible para entregar'; end if;

  select * into a from public.assessments where id=at.assessment_id and status='published';
  if not found then raise exception 'Evaluación no disponible'; end if;

  if a.time_limit_minutes is not null and at.started_at + make_interval(mins => a.time_limit_minutes) < now() then
    update public.assessment_attempts set status='abandoned', submitted_at=now() where id=at.id;
    raise exception 'El tiempo de la evaluación terminó';
  end if;

  for q in
    select * from public.assessment_questions where assessment_id=a.id order by position,id
  loop
    total_points := total_points + q.points;

    select * into answer_row from public.assessment_answers
    where attempt_id=at.id and question_id=q.id;

    if q.question_type='short_text' then
      has_manual := true;
      if found then
        update public.assessment_answers set is_correct=null, points_awarded=null where id=answer_row.id;
      end if;
      continue;
    end if;

    select coalesce(array_agg(id order by id),'{}'::uuid[]) into correct_ids
    from public.assessment_options where question_id=q.id and is_correct=true;

    selected_ids := case when found then coalesce(answer_row.selected_option_ids,'{}'::uuid[]) else '{}'::uuid[] end;
    select (
      coalesce((select array_agg(x order by x) from unnest(selected_ids) x),'{}'::uuid[])
      = coalesce((select array_agg(x order by x) from unnest(correct_ids) x),'{}'::uuid[])
    ) into exact_match;

    if found then
      update public.assessment_answers
      set is_correct=exact_match, points_awarded=case when exact_match then q.points else 0 end
      where id=answer_row.id;
    end if;

    if exact_match then earned_points := earned_points + q.points; end if;
  end loop;

  if has_manual then
    update public.assessment_attempts
    set status='submitted', score=null, passed=null, submitted_at=now()
    where id=at.id;
    return query select null::numeric, null::boolean, 'submitted'::text;
    return;
  end if;

  final_score := case when total_points>0 then round((earned_points/total_points)*100,2) else 0 end;
  final_passed := final_score >= a.passing_score;

  update public.assessment_attempts
  set status='graded', score=final_score, passed=final_passed, submitted_at=now(), graded_at=now()
  where id=at.id;

  return query select final_score, final_passed, 'graded'::text;
end;
$function$;

revoke all on function public.start_assessment_attempt(uuid) from public, anon;
revoke all on function public.save_assessment_answer(uuid,uuid,uuid[],text) from public, anon;
revoke all on function public.submit_assessment_attempt(uuid) from public, anon;
grant execute on function public.start_assessment_attempt(uuid) to authenticated, service_role;
grant execute on function public.save_assessment_answer(uuid,uuid,uuid[],text) to authenticated, service_role;
grant execute on function public.submit_assessment_attempt(uuid) to authenticated, service_role;

commit;
