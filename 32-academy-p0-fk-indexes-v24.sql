-- ============================================================
-- COMPÁS ACADEMY · P0 PERFORMANCE V24
-- Índices de cobertura para foreign keys detectadas por Supabase Advisor.
-- Cambio aditivo: no elimina datos, no modifica RLS ni cambia constraints.
-- ============================================================

begin;

create index if not exists academy_contact_links_contact_id_idx
  on public.academy_contact_links(contact_id);

create index if not exists academy_integration_events_contact_id_idx
  on public.academy_integration_events(contact_id);

create index if not exists access_history_access_id_idx
  on public.access_history(access_id);

create index if not exists access_history_performed_by_idx
  on public.access_history(performed_by);

create index if not exists access_history_product_id_idx
  on public.access_history(product_id);

create index if not exists access_history_user_id_idx
  on public.access_history(user_id);

create index if not exists assessment_answers_question_id_idx
  on public.assessment_answers(question_id);

create index if not exists assessments_created_by_idx
  on public.assessments(created_by);

create index if not exists block_responses_block_id_idx
  on public.block_responses(block_id);

create index if not exists certificates_course_id_idx
  on public.certificates(course_id);

create index if not exists contact_notes_user_id_idx
  on public.contact_notes(user_id);

create index if not exists course_versions_created_by_idx
  on public.course_versions(created_by);

create index if not exists courses_created_by_idx
  on public.courses(created_by);

create index if not exists lesson_blocks_created_by_idx
  on public.lesson_blocks(created_by);

create index if not exists lesson_notes_lesson_id_idx
  on public.lesson_notes(lesson_id);

create index if not exists orders_product_id_idx
  on public.orders(product_id);

create index if not exists orders_user_id_idx
  on public.orders(user_id);

create index if not exists orders_workspace_id_idx
  on public.orders(workspace_id);

create index if not exists product_contents_course_id_idx
  on public.product_contents(course_id);

create index if not exists product_contents_resource_id_idx
  on public.product_contents(resource_id);

create index if not exists products_created_by_idx
  on public.products(created_by);

create index if not exists resource_access_product_id_idx
  on public.resource_access(product_id);

create index if not exists resource_access_resource_id_idx
  on public.resource_access(resource_id);

create index if not exists resources_course_id_idx
  on public.resources(course_id);

create index if not exists student_access_granted_by_idx
  on public.student_access(granted_by);

create index if not exists workspaces_created_by_idx
  on public.workspaces(created_by);

commit;
