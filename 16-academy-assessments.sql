-- ============================================================
-- COMPÁS ACADEMY · P1 — EVALUACIONES V13
-- Esquema aditivo: evaluaciones, preguntas, opciones, intentos y respuestas.
-- No elimina ni modifica progreso histórico.
-- ============================================================

begin;

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  module_id uuid references public.modules(id) on delete cascade,
  title text not null,
  description text,
  assessment_type text not null default 'quiz' check (assessment_type in ('quiz','module_exam','final_exam')),
  passing_score numeric(5,2) not null default 70 check (passing_score between 0 and 100),
  max_attempts integer check (max_attempts is null or max_attempts > 0),
  time_limit_minutes integer check (time_limit_minutes is null or time_limit_minutes > 0),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  position integer not null default 1,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assessment_questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  prompt text not null,
  question_type text not null default 'single_choice' check (question_type in ('single_choice','multiple_choice','true_false','short_text')),
  explanation text,
  points numeric(8,2) not null default 1 check (points > 0),
  position integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.assessment_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.assessment_questions(id) on delete cascade,
  label text not null,
  is_correct boolean not null default false,
  position integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_number integer not null check (attempt_number > 0),
  status text not null default 'in_progress' check (status in ('in_progress','submitted','graded','abandoned')),
  score numeric(5,2) check (score is null or score between 0 and 100),
  passed boolean,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  graded_at timestamptz,
  unique (assessment_id, user_id, attempt_number)
);

create table if not exists public.assessment_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.assessment_attempts(id) on delete cascade,
  question_id uuid not null references public.assessment_questions(id) on delete cascade,
  selected_option_ids uuid[] not null default '{}',
  text_answer text,
  is_correct boolean,
  points_awarded numeric(8,2),
  answered_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create index if not exists assessments_course_idx on public.assessments(course_id, status, position);
create index if not exists assessments_module_idx on public.assessments(module_id, position) where module_id is not null;
create index if not exists assessment_questions_assessment_idx on public.assessment_questions(assessment_id, position);
create index if not exists assessment_options_question_idx on public.assessment_options(question_id, position);
create index if not exists assessment_attempts_user_idx on public.assessment_attempts(user_id, assessment_id, started_at desc);
create index if not exists assessment_answers_attempt_idx on public.assessment_answers(attempt_id, question_id);

alter table public.assessments enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.assessment_options enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.assessment_answers enable row level security;

-- Evaluaciones: alumnos ven únicamente evaluaciones publicadas de cursos inscritos.
drop policy if exists assessments_student_read on public.assessments;
create policy assessments_student_read on public.assessments
for select to authenticated
using (
  status = 'published'
  and exists (
    select 1 from public.enrollments e
    where e.course_id = assessments.course_id
      and e.user_id = (select auth.uid())
      and e.status = 'active'
  )
);

-- Administradores e instructores pueden gestionar evaluaciones de cursos que ya pueden gestionar.
drop policy if exists assessments_manager_all on public.assessments;
create policy assessments_manager_all on public.assessments
for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('admin','instructor')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('admin','instructor')
  )
);

-- Preguntas visibles solo si la evaluación es visible; gestores tienen acceso total.
drop policy if exists assessment_questions_read on public.assessment_questions;
create policy assessment_questions_read on public.assessment_questions
for select to authenticated
using (
  exists (
    select 1 from public.assessments a
    where a.id = assessment_questions.assessment_id
      and (
        (a.status = 'published' and exists (
          select 1 from public.enrollments e
          where e.course_id = a.course_id
            and e.user_id = (select auth.uid())
            and e.status = 'active'
        ))
        or exists (
          select 1 from public.profiles p
          where p.id = (select auth.uid()) and p.role in ('admin','instructor')
        )
      )
  )
);

drop policy if exists assessment_questions_manager_write on public.assessment_questions;
create policy assessment_questions_manager_write on public.assessment_questions
for all to authenticated
using (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','instructor')))
with check (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','instructor')));

-- Opciones: no exponemos is_correct al alumno mediante vistas; RLS limita por evaluación accesible.
drop policy if exists assessment_options_read on public.assessment_options;
create policy assessment_options_read on public.assessment_options
for select to authenticated
using (
  exists (
    select 1
    from public.assessment_questions q
    join public.assessments a on a.id=q.assessment_id
    where q.id=assessment_options.question_id
      and (
        (a.status='published' and exists (
          select 1 from public.enrollments e
          where e.course_id=a.course_id and e.user_id=(select auth.uid()) and e.status='active'
        ))
        or exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','instructor'))
      )
  )
);

drop policy if exists assessment_options_manager_write on public.assessment_options;
create policy assessment_options_manager_write on public.assessment_options
for all to authenticated
using (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','instructor')))
with check (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','instructor')));

-- Intentos y respuestas: cada alumno únicamente sus registros; gestores pueden auditar.
drop policy if exists assessment_attempts_own on public.assessment_attempts;
create policy assessment_attempts_own on public.assessment_attempts
for all to authenticated
using (user_id=(select auth.uid()) or exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','instructor')))
with check (user_id=(select auth.uid()) or exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','instructor')));

drop policy if exists assessment_answers_own on public.assessment_answers;
create policy assessment_answers_own on public.assessment_answers
for all to authenticated
using (
  exists (
    select 1 from public.assessment_attempts aa
    where aa.id=assessment_answers.attempt_id
      and (aa.user_id=(select auth.uid()) or exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','instructor')))
  )
)
with check (
  exists (
    select 1 from public.assessment_attempts aa
    where aa.id=assessment_answers.attempt_id
      and (aa.user_id=(select auth.uid()) or exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','instructor')))
  )
);

-- Vista segura para alumnos: deliberadamente omite is_correct.
create or replace view public.assessment_options_public
with (security_invoker=true)
as
select id, question_id, label, position
from public.assessment_options;

grant select on public.assessment_options_public to authenticated;

commit;
