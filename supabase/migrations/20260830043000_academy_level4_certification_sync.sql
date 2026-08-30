-- Compás Academy · Certificación Nivel 4 → Compás Evolution
-- Requiere certificado Nivel 3 vigente. No promueve roles automáticamente.

create or replace function public.verify_freelance_level4_certification(
  p_email text,
  p_certificate_code text
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $f$
declare
  v_email text:=lower(btrim(coalesce(p_email,'')));
  v_code text:=upper(btrim(coalesce(p_certificate_code,'')));
  v_row record;
  v_score numeric;
begin
  if v_email='' or char_length(v_email)>320
     or v_code='' or char_length(v_code)>80
     or v_code !~ '^[A-Z0-9-]+$' then
    return jsonb_build_object('valid',false);
  end if;

  select cert.user_id,cert.course_id,cert.issued_at,cert.verification_code,
         course.slug,course.title
  into v_row
  from public.certificates cert
  join public.courses course on course.id=cert.course_id
  join public.profiles p on p.id=cert.user_id
  where cert.verification_code=v_code
    and cert.revoked_at is null
    and course.slug='nivel-4-liderazgo-supervision-comercial'
    and lower(coalesce(p.email,''))=v_email
  order by cert.issued_at desc
  limit 1;

  if not found then return jsonb_build_object('valid',false); end if;

  select max(a.score) into v_score
  from public.assessment_attempts a
  join public.assessments x on x.id=a.assessment_id
  where a.user_id=v_row.user_id
    and x.course_id=v_row.course_id
    and x.title='Evaluación integradora · Nivel 4'
    and x.status='published'
    and a.status='graded'
    and a.passed=true;

  if v_score is null then return jsonb_build_object('valid',false); end if;

  return jsonb_build_object(
    'valid',true,
    'certification_level',4,
    'course_slug',v_row.slug,
    'course_title',v_row.title,
    'certificate_code',v_row.verification_code,
    'score_pct',v_score,
    'issued_at',v_row.issued_at
  );
end $f$;

revoke all on function public.verify_freelance_level4_certification(text,text) from public,authenticated;
grant execute on function public.verify_freelance_level4_certification(text,text) to anon,service_role;

create or replace function private.enforce_freelance_level4_prerequisite()
returns trigger
language plpgsql
security definer
set search_path to ''
as $f$
declare v_slug text;
begin
  select c.slug into v_slug from public.courses c where c.id=new.course_id;
  if v_slug='nivel-4-liderazgo-supervision-comercial'
     and not exists(
       select 1 from public.certificates cert
       join public.courses course3 on course3.id=cert.course_id
       where cert.user_id=new.user_id
         and cert.revoked_at is null
         and course3.slug='nivel-3-cartera-permanencia-crecimiento-compas'
     ) then
    raise exception using errcode='22023',message='Nivel 3 certification is required before Nivel 4';
  end if;
  return new;
end $f$;

drop trigger if exists enforce_freelance_level4_prerequisite on public.certificates;
create trigger enforce_freelance_level4_prerequisite
before insert on public.certificates
for each row execute function private.enforce_freelance_level4_prerequisite();

create or replace function private.dispatch_freelance_level4_certification_event(p_event_id uuid)
returns bigint
language plpgsql
security definer
set search_path to ''
as $f$
declare
  v_event public.academy_outbox_events%rowtype;
  v_request_id bigint;
begin
  select * into v_event from public.academy_outbox_events where id=p_event_id for update;
  if not found then raise exception 'Certification outbox event not found'; end if;
  if v_event.event_type<>'freelance_level4_certified' then raise exception 'Unsupported certification event'; end if;

  select net.http_post(
    url:='https://qwxydjotwhniahaovrff.supabase.co/rest/v1/rpc/sync_evolution_commercial_academy_level4',
    body:=jsonb_build_object('p_source_event_id',v_event.id,'p_email',v_event.payload->>'email','p_certificate_code',v_event.payload->>'certificate_code'),
    headers:=jsonb_build_object('Content-Type','application/json','apikey','sb_publishable_17NekbDHp_ssL_Pf-CnqPg_v0acxqn3'),
    timeout_milliseconds:=10000
  ) into v_request_id;

  update public.academy_outbox_events
  set status='processing',attempts=attempts+1,last_error=null,next_attempt_at=null,
      payload=payload||jsonb_build_object('http_request_id',v_request_id)
  where id=p_event_id;
  return v_request_id;
end $f$;

create or replace function private.queue_freelance_level4_certification()
returns trigger
language plpgsql
security definer
set search_path to ''
as $f$
declare
  v_course public.courses%rowtype;
  v_email text;
  v_score numeric;
  v_event_id uuid;
begin
  select * into v_course from public.courses where id=new.course_id;
  if not found or v_course.slug<>'nivel-4-liderazgo-supervision-comercial' then return new; end if;

  select lower(coalesce(p.email,'')) into v_email from public.profiles p where p.id=new.user_id;

  select max(a.score) into v_score
  from public.assessment_attempts a
  join public.assessments x on x.id=a.assessment_id
  where a.user_id=new.user_id and x.course_id=new.course_id
    and x.title='Evaluación integradora · Nivel 4'
    and a.status='graded' and a.passed=true;

  if v_score is null then
    raise exception using errcode='22023',message='Passed Nivel 4 integrated assessment is required before certification';
  end if;

  insert into public.academy_outbox_events(
    workspace_id,event_type,aggregate_type,aggregate_id,dedupe_key,payload,status,attempts
  ) values(
    v_course.workspace_id,'freelance_level4_certified','certificate',new.id,
    'freelance-level4-certificate:'||new.id::text,
    jsonb_build_object(
      'academy_user_id',new.user_id,'email',v_email,'course_id',new.course_id,
      'course_slug',v_course.slug,'course_title',v_course.title,'certificate_id',new.id,
      'certificate_code',new.verification_code,'recipient_name',new.recipient_name,
      'score_pct',v_score,'issued_at',new.issued_at
    ),'queued',0
  ) on conflict(dedupe_key) do update set payload=excluded.payload
  returning id into v_event_id;

  begin
    perform private.dispatch_freelance_level4_certification_event(v_event_id);
  exception when others then
    update public.academy_outbox_events
    set status='failed',attempts=attempts+1,last_error=left(sqlerrm,1000),next_attempt_at=now()+interval '15 minutes'
    where id=v_event_id;
  end;
  return new;
end $f$;

drop trigger if exists sync_freelance_level4_certification on public.certificates;
create trigger sync_freelance_level4_certification
after insert on public.certificates
for each row execute function private.queue_freelance_level4_certification();
