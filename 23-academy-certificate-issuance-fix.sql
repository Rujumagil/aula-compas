-- ============================================================
-- COMPÁS ACADEMY · P1 — CERTIFICADOS V16.1
-- Corrige la detección de certificado existente sin modificar datos.
-- ============================================================
begin;

create or replace function private.issue_academy_certificate_impl(target_course uuid)
returns table(
  certificate_id uuid,
  verification_code text,
  recipient_name text,
  course_title text,
  issued_at timestamptz
)
language plpgsql security definer set search_path=public
as $function$
declare
  uid uuid := auth.uid();
  c public.courses%rowtype;
  cert public.certificates%rowtype;
  elig record;
  display_name text;
  code text;
  cert_found boolean := false;
begin
  if uid is null then raise exception 'Autenticación requerida'; end if;

  select * into c from public.courses where id=target_course and status <> 'archived';
  if not found then raise exception 'Curso no disponible'; end if;

  if not exists (
    select 1 from public.enrollments e
    where e.course_id=c.id and e.user_id=uid and e.status='active'
  ) then raise exception 'No tienes acceso activo a este curso'; end if;

  select * into elig from private.certificate_eligibility_impl(c.id);
  if not elig.eligible then
    raise exception 'Aún no cumples los requisitos del certificado: %/% lecciones y %/% evaluaciones aprobadas',
      elig.completed_lessons, elig.total_lessons, elig.passed_assessments, elig.required_assessments;
  end if;

  perform pg_advisory_xact_lock(hashtext(uid::text || ':' || c.id::text));

  select * into cert
  from public.certificates
  where user_id=uid and course_id=c.id and revoked_at is null
  order by issued_at desc
  limit 1;
  cert_found := found;

  select coalesce(nullif(trim(p.full_name),''), nullif(trim(p.email),''), 'Alumno Compás Academy')
  into display_name
  from public.profiles p where p.id=uid;
  display_name := coalesce(display_name, 'Alumno Compás Academy');

  if not cert_found then
    loop
      code := 'CA-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,16));
      exit when not exists(select 1 from public.certificates x where x.verification_code=code);
    end loop;

    insert into public.certificates(
      user_id, course_id, issued_at, verification_code, recipient_name,
      requirements_snapshot, revoked_at, updated_at
    ) values (
      uid, c.id, now(), code, display_name,
      jsonb_build_object(
        'total_lessons', elig.total_lessons,
        'completed_lessons', elig.completed_lessons,
        'required_assessments', elig.required_assessments,
        'passed_assessments', elig.passed_assessments,
        'issued_under', 'academy-v16.1'
      ), null, now()
    ) returning * into cert;
  elsif cert.verification_code is null then
    loop
      code := 'CA-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,16));
      exit when not exists(select 1 from public.certificates x where x.verification_code=code);
    end loop;

    update public.certificates
    set verification_code=code,
        recipient_name=coalesce(recipient_name,display_name),
        requirements_snapshot=jsonb_build_object(
          'total_lessons', elig.total_lessons,
          'completed_lessons', elig.completed_lessons,
          'required_assessments', elig.required_assessments,
          'passed_assessments', elig.passed_assessments,
          'issued_under', 'academy-v16.1'
        ),
        updated_at=now()
    where id=cert.id
    returning * into cert;
  end if;

  insert into public.certificate_public_registry(
    certificate_id, verification_code, recipient_name, course_title, issued_at, status, updated_at
  ) values (
    cert.id, cert.verification_code, coalesce(cert.recipient_name,display_name), c.title,
    cert.issued_at, case when cert.revoked_at is null then 'valid' else 'revoked' end, now()
  )
  on conflict(certificate_id) do update set
    verification_code=excluded.verification_code,
    recipient_name=excluded.recipient_name,
    course_title=excluded.course_title,
    issued_at=excluded.issued_at,
    status=excluded.status,
    updated_at=now();

  return query select cert.id, cert.verification_code, coalesce(cert.recipient_name,display_name), c.title, cert.issued_at;
end $function$;

revoke all on function private.issue_academy_certificate_impl(uuid) from public, anon;
grant execute on function private.issue_academy_certificate_impl(uuid) to authenticated, service_role;

commit;
