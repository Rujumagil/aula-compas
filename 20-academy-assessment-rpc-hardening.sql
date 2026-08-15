-- ============================================================
-- COMPÁS ACADEMY · P1 — HARDENING RPC V14
-- La API pública queda SECURITY INVOKER; privilegios en esquema private.
-- ============================================================
begin;

create schema if not exists private;
grant usage on schema private to authenticated, service_role;

create or replace function private.start_assessment_attempt_impl(target_assessment uuid)
returns uuid
language plpgsql security definer set search_path=public
as $function$
declare uid uuid:=auth.uid(); a public.assessments%rowtype; existing public.assessment_attempts%rowtype; next_attempt integer;
begin
 if uid is null then raise exception 'Autenticación requerida'; end if;
 select * into a from public.assessments where id=target_assessment and status='published';
 if not found then raise exception 'Evaluación no disponible'; end if;
 if not exists(select 1 from public.enrollments e where e.course_id=a.course_id and e.user_id=uid and e.status='active') then raise exception 'No tienes acceso a este curso'; end if;
 select * into existing from public.assessment_attempts where assessment_id=a.id and user_id=uid and status='in_progress' order by started_at desc limit 1;
 if found then
  if a.time_limit_minutes is null or existing.started_at+make_interval(mins=>a.time_limit_minutes)>now() then return existing.id; end if;
  update public.assessment_attempts set status='abandoned',submitted_at=now() where id=existing.id;
 end if;
 select coalesce(max(attempt_number),0)+1 into next_attempt from public.assessment_attempts where assessment_id=a.id and user_id=uid;
 if a.max_attempts is not null and next_attempt>a.max_attempts then raise exception 'Ya utilizaste el número máximo de intentos'; end if;
 insert into public.assessment_attempts(assessment_id,user_id,attempt_number,status) values(a.id,uid,next_attempt,'in_progress') returning id into existing.id;
 return existing.id;
end $function$;

create or replace function private.save_assessment_answer_impl(target_attempt uuid,target_question uuid,selected_options uuid[] default '{}',answer_text text default null)
returns void
language plpgsql security definer set search_path=public
as $function$
declare uid uuid:=auth.uid(); at public.assessment_attempts%rowtype; a public.assessments%rowtype; q public.assessment_questions%rowtype; invalid_count integer;
begin
 if uid is null then raise exception 'Autenticación requerida'; end if;
 select * into at from public.assessment_attempts where id=target_attempt and user_id=uid and status='in_progress';
 if not found then raise exception 'Intento no disponible'; end if;
 select * into a from public.assessments where id=at.assessment_id;
 if a.time_limit_minutes is not null and at.started_at+make_interval(mins=>a.time_limit_minutes)<=now() then update public.assessment_attempts set status='abandoned',submitted_at=now() where id=at.id; raise exception 'El tiempo de la evaluación terminó'; end if;
 select * into q from public.assessment_questions where id=target_question and assessment_id=at.assessment_id;
 if not found then raise exception 'Pregunta inválida para este intento'; end if;
 select count(*) into invalid_count from unnest(coalesce(selected_options,'{}'::uuid[])) s(id) where not exists(select 1 from public.assessment_options o where o.id=s.id and o.question_id=q.id);
 if invalid_count>0 then raise exception 'Una opción seleccionada no pertenece a esta pregunta'; end if;
 insert into public.assessment_answers(attempt_id,question_id,selected_option_ids,text_answer,is_correct,points_awarded,answered_at)
 values(at.id,q.id,coalesce(selected_options,'{}'::uuid[]),nullif(trim(answer_text),''),null,null,now())
 on conflict(attempt_id,question_id) do update set selected_option_ids=excluded.selected_option_ids,text_answer=excluded.text_answer,is_correct=null,points_awarded=null,answered_at=now();
end $function$;

create or replace function private.submit_assessment_attempt_impl(target_attempt uuid)
returns table(score numeric,passed boolean,result_status text)
language plpgsql security definer set search_path=public
as $function$
declare uid uuid:=auth.uid(); at public.assessment_attempts%rowtype; a public.assessments%rowtype; q record; answer_row public.assessment_answers%rowtype; correct_ids uuid[]; selected_ids uuid[]; exact_match boolean; has_answer boolean; total_points numeric:=0; earned_points numeric:=0; has_manual boolean:=false; final_score numeric; final_passed boolean;
begin
 if uid is null then raise exception 'Autenticación requerida'; end if;
 select * into at from public.assessment_attempts where id=target_attempt and user_id=uid and status='in_progress';
 if not found then raise exception 'Intento no disponible para entregar'; end if;
 select * into a from public.assessments where id=at.assessment_id and status='published';
 if not found then raise exception 'Evaluación no disponible'; end if;
 if a.time_limit_minutes is not null and at.started_at+make_interval(mins=>a.time_limit_minutes)<now() then update public.assessment_attempts set status='abandoned',submitted_at=now() where id=at.id; raise exception 'El tiempo de la evaluación terminó'; end if;
 for q in select * from public.assessment_questions where assessment_id=a.id order by position,id loop
  total_points:=total_points+q.points;
  select * into answer_row from public.assessment_answers where attempt_id=at.id and question_id=q.id; has_answer:=found;
  if q.question_type='short_text' then has_manual:=true; if has_answer then update public.assessment_answers set is_correct=null,points_awarded=null where id=answer_row.id; end if; continue; end if;
  select coalesce(array_agg(id order by id),'{}'::uuid[]) into correct_ids from public.assessment_options where question_id=q.id and is_correct=true;
  selected_ids:=case when has_answer then coalesce(answer_row.selected_option_ids,'{}'::uuid[]) else '{}'::uuid[] end;
  exact_match:=has_answer and cardinality(correct_ids)>0 and coalesce((select array_agg(x order by x) from unnest(selected_ids) x),'{}'::uuid[])=coalesce((select array_agg(x order by x) from unnest(correct_ids) x),'{}'::uuid[]);
  if has_answer then update public.assessment_answers set is_correct=exact_match,points_awarded=case when exact_match then q.points else 0 end where id=answer_row.id; end if;
  if exact_match then earned_points:=earned_points+q.points; end if;
 end loop;
 if has_manual then update public.assessment_attempts set status='submitted',score=null,passed=null,submitted_at=now() where id=at.id; return query select null::numeric,null::boolean,'submitted'::text; return; end if;
 final_score:=case when total_points>0 then round((earned_points/total_points)*100,2) else 0 end; final_passed:=final_score>=a.passing_score;
 update public.assessment_attempts set status='graded',score=final_score,passed=final_passed,submitted_at=now(),graded_at=now() where id=at.id;
 return query select final_score,final_passed,'graded'::text;
end $function$;

revoke all on function private.start_assessment_attempt_impl(uuid) from public,anon;
revoke all on function private.save_assessment_answer_impl(uuid,uuid,uuid[],text) from public,anon;
revoke all on function private.submit_assessment_attempt_impl(uuid) from public,anon;
grant execute on function private.start_assessment_attempt_impl(uuid) to authenticated,service_role;
grant execute on function private.save_assessment_answer_impl(uuid,uuid,uuid[],text) to authenticated,service_role;
grant execute on function private.submit_assessment_attempt_impl(uuid) to authenticated,service_role;

create or replace function public.start_assessment_attempt(target_assessment uuid)
returns uuid language sql security invoker set search_path='' as $$ select private.start_assessment_attempt_impl(target_assessment); $$;
create or replace function public.save_assessment_answer(target_attempt uuid,target_question uuid,selected_options uuid[] default '{}',answer_text text default null)
returns void language sql security invoker set search_path='' as $$ select private.save_assessment_answer_impl(target_attempt,target_question,selected_options,answer_text); $$;
create or replace function public.submit_assessment_attempt(target_attempt uuid)
returns table(score numeric,passed boolean,result_status text) language sql security invoker set search_path='' as $$ select * from private.submit_assessment_attempt_impl(target_attempt); $$;

revoke all on function public.start_assessment_attempt(uuid) from public,anon;
revoke all on function public.save_assessment_answer(uuid,uuid,uuid[],text) from public,anon;
revoke all on function public.submit_assessment_attempt(uuid) from public,anon;
grant execute on function public.start_assessment_attempt(uuid) to authenticated,service_role;
grant execute on function public.save_assessment_answer(uuid,uuid,uuid[],text) to authenticated,service_role;
grant execute on function public.submit_assessment_attempt(uuid) to authenticated,service_role;

commit;
