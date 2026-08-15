-- ============================================================
-- COMPÁS ACADEMY · P0 SECURITY HARDENING
-- Revoca ejecución anónima de RPCs SECURITY DEFINER sensibles.
-- Mantiene acceso para usuarios autenticados y service_role;
-- las funciones administrativas conservan sus validaciones internas.
-- ============================================================

revoke execute on function public.admin_change_student_access_status(uuid,text) from public, anon;
revoke execute on function public.admin_grant_product_access(uuid,uuid,text,text,timestamptz) from public, anon;
revoke execute on function public.admin_set_user_role(uuid,text) from public, anon;
revoke execute on function public.delete_managed_course(uuid) from public, anon;
revoke execute on function public.is_aula_admin() from public, anon;
revoke execute on function public.is_super_admin() from public, anon;
revoke execute on function public.is_workspace_member(uuid) from public, anon;

grant execute on function public.admin_change_student_access_status(uuid,text) to authenticated, service_role;
grant execute on function public.admin_grant_product_access(uuid,uuid,text,text,timestamptz) to authenticated, service_role;
grant execute on function public.admin_set_user_role(uuid,text) to authenticated, service_role;
grant execute on function public.delete_managed_course(uuid) to authenticated, service_role;
grant execute on function public.is_aula_admin() to authenticated, service_role;
grant execute on function public.is_super_admin() to authenticated, service_role;
grant execute on function public.is_workspace_member(uuid) to authenticated, service_role;
