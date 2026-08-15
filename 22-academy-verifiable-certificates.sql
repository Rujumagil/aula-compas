-- ============================================================
-- COMPÁS ACADEMY · P1 — CERTIFICADOS VERIFICABLES V16
-- Aditivo: conserva certificados existentes y no modifica progreso.
-- ============================================================
begin;

create schema if not exists private;
grant usage on schema private to authenticated, service_role;

-- Compatibilidad con instalaciones que todavía no tengan tabla de certificados.
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  issued_at timestamptz not null default now()
);

alter table public.certificates add column if not exists verification_code text;
alter table public.certificates add column if not exists recipient_name text;
alter table public.certificates add column if not exists requirements_snapshot jsonb not null default '{}'::jsonb;
alter table public.certificates add column if not exists revoked_at timestamptz;
alter table public.certificates add column if not exists updated_at timestamptz not null default now();

create unique index if not exists certificates_verification_code_uidx
  on public.certificates(verification_code)
  where verification_code is not null;
create index if not exists certificates_user_course_idx
  on public.certificates(user_id, course_id, issued_at desc);

alter table public.certificates enable row level security;
drop policy if exists certificates_owner_read on public.certificates;
create policy certificates_owner_read
on public.certificates for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.can_manage_course(course_id))
);

-- La emisión/revocación nunca se hace con INSERT/UPDATE directo desde el navegador.
revoke insert, update, delete on public.certificates from anon, authenticated;
grant select on public.certificates to authenticated;

-- Registro público deliberadamente mínimo: no contiene email, UUID de usuario ni respuestas.
create table if not exists public.certificate_public_registry (
  certificate_id uuid primary key references public.certificates(id) on delete cascade,
  verification_code text not null unique,
  recipient_name text not null,
  course_title text not null,
  issued_at timestamptz not null,
  status text not null default 'valid' check (status in ('valid','revoked')),
  updated_at timestamptz not null default now()
);

alter table public.certificate_public_registry enable row level security;
drop policy if exists certificate_registry_public_read on public.certificate_public_registry;
create policy certificate_registry_public_read
on public.certificate_public_registry for select
to anon, authenticated
using (true);
revoke insert, update, delete on public.certificate_public_registry from public, anon, authenticated;
grant select on public.certificate_public_registry to anon, authenticated;

create or replace function private.certificate_eligibility_impl(target_course uuid)
returns table(
  total_lessons integer,
  completed_lessons integer,
  required_assessments integer,
  passed_assessments integer,
  eligible boolean
)
language plpgsql security definer set search_path=public
as $function$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Autenticación requerida'; end if;
  if not exists (
    select 1 from public.enrollments e
    where e.course_id=target_course and e.user_id=uid and e.status='active'
  ) and not private.can_manage_course(target_course) then
    raise exception 'No tienes acceso a este curso';
  end if;

  select count(*)::integer
  into total_lessons
  from public.lessons l
  join public.modules m on m.id=l.module_id
  where m.course_id=target_course;

  select count(distinct lp.lesson_id)::integer
  into completed_lessons
  from public.lesson_progress lp
  join public.lessons l on l.id=lp.lesson_id
  join public.modules m on m.id=l.module_id
  where m.course_id=target_course
    and lp.user_id=uid
    and lp.completed=true;

  select count(*)::integer
  into required_assessments
  from public.assessments a
  where a.course_id=target_course and a.status='published';

  select count(*)::integer
  into passed_assessments
  from public.assessments a
  where a.course_id=target_course
    and a.status='published'
    and exists (
      select 1 from public.assessment_attempts aa
      where aa.assessment_id=a.id
        and aa.user_id=uid
        and aa.status='graded'
        and aa.passed=true
    );

  eligible := total_lessons > 0
    and completed_lessons >= total_lessons
    and passed_assessments >= required_assessments;

  return next;
end $function$;

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

  select coalesce(nullif(trim(p.full_name),''), nullif(trim(p.email),''), 'Alumno Compás Academy')
  into display_name
  from public.profiles p where p.id=uid;
  display_name := coalesce(display_name, 'Alumno Compás Academy');

  if not found then
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
        'issued_under', 'academy-v16'
      ), null, now()
    ) returning * into cert;
  else
    code := cert.verification_code;
    if code is null then
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
            'issued_under', 'academy-v16'
          ),
          updated_at=now()
      where id=cert.id
      returning * into cert;
    end if;
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

revoke all on function private.certificate_eligibility_impl(uuid) from public, anon;
revoke all on function private.issue_academy_certificate_impl(uuid) from public, anon;
grant execute on function private.certificate_eligibility_impl(uuid) to authenticated, service_role;
grant execute on function private.issue_academy_certificate_impl(uuid) to authenticated, service_role;

create or replace function public.get_certificate_eligibility(target_course uuid)
returns table(
  total_lessons integer,
  completed_lessons integer,
  required_assessments integer,
  passed_assessments integer,
  eligible boolean
)
language sql security invoker set search_path=''
as $$ select * from private.certificate_eligibility_impl(target_course); $$;

create or replace function public.issue_academy_certificate(target_course uuid)
returns table(
  certificate_id uuid,
  verification_code text,
  recipient_name text,
  course_title text,
  issued_at timestamptz
)
language sql security invoker set search_path=''
as $$ select * from private.issue_academy_certificate_impl(target_course); $$;

revoke all on function public.get_certificate_eligibility(uuid) from public, anon;
revoke all on function public.issue_academy_certificate(uuid) from public, anon;
grant execute on function public.get_certificate_eligibility(uuid) to authenticated, service_role;
grant execute on function public.issue_academy_certificate(uuid) to authenticated, service_role;

commit;
