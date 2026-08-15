-- ============================================================
-- COMPÁS ACADEMY · ONBOARDING INTELIGENTE V19
-- Perfil académico propiedad del alumno, aditivo y no destructivo.
-- ============================================================

begin;

create table if not exists public.academy_onboarding_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  goal text not null check (goal in (
    'operate_compas_one','sell_more','marketing','meta_ads','ai','automation'
  )),
  experience_level text not null check (experience_level in ('beginner','intermediate','advanced')),
  weekly_minutes integer not null default 120 check (weekly_minutes between 30 and 600),
  focus_areas text[] not null default '{}'::text[] check (cardinality(focus_areas) <= 6),
  objective_text text check (objective_text is null or char_length(objective_text) <= 500),
  recommended_course_slug text not null check (recommended_course_slug in (
    'primeros-pasos-compas-one',
    'crm-seguimiento-comercial',
    'marketing-digital-con-direccion',
    'meta-ads-campana-oportunidad',
    'ia-aplicada-negocios',
    'automatizacion-equipos-pequenos'
  )),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.academy_onboarding_profiles enable row level security;

revoke all on table public.academy_onboarding_profiles from public, anon;
revoke all on table public.academy_onboarding_profiles from authenticated;
grant select, insert, update on table public.academy_onboarding_profiles to authenticated;

-- Cada alumno solo puede leer y mantener su propio diagnóstico.
drop policy if exists "academy_onboarding_select_own" on public.academy_onboarding_profiles;
create policy "academy_onboarding_select_own"
on public.academy_onboarding_profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "academy_onboarding_insert_own" on public.academy_onboarding_profiles;
create policy "academy_onboarding_insert_own"
on public.academy_onboarding_profiles
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "academy_onboarding_update_own" on public.academy_onboarding_profiles;
create policy "academy_onboarding_update_own"
on public.academy_onboarding_profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

comment on table public.academy_onboarding_profiles is
'Preferencias y diagnóstico inicial de aprendizaje del alumno de Compás Academy. RLS limita cada fila a su propietario.';

commit;
