-- ============================================================
-- COMPÁS ACADEMY · P1 — PRIMERA EVALUACIÓN PUBLICADA
-- Semilla aditiva para probar el flujo real del alumno.
-- ============================================================
begin;

do $block$
declare
  cid uuid;
  aid uuid;
  qid uuid;
begin
  select id into cid from public.courses where slug='primeros-pasos-compas-one' limit 1;
  if cid is null then return; end if;

  select id into aid from public.assessments
  where course_id=cid and title='Checkpoint · Primeros pasos con Compás One'
  limit 1;

  if aid is null then
    insert into public.assessments(course_id,title,description,assessment_type,passing_score,max_attempts,time_limit_minutes,status,position)
    values(cid,'Checkpoint · Primeros pasos con Compás One','Comprueba que reconoces la lógica básica de Compás One antes de avanzar.','quiz',70,3,10,'published',1)
    returning id into aid;

    insert into public.assessment_questions(assessment_id,prompt,question_type,points,position)
    values(aid,'¿Cuál es el propósito principal de Compás One en la operación de un negocio?','single_choice',1,1)
    returning id into qid;
    insert into public.assessment_options(question_id,label,is_correct,position) values
      (qid,'Centralizar contactos, conversaciones y seguimiento comercial.',true,1),
      (qid,'Sustituir por completo todas las redes sociales.',false,2),
      (qid,'Funcionar únicamente como almacenamiento de archivos.',false,3);

    insert into public.assessment_questions(assessment_id,prompt,question_type,points,position)
    values(aid,'¿Para qué sirve trabajar dentro del workspace correcto?','single_choice',1,2)
    returning id into qid;
    insert into public.assessment_options(question_id,label,is_correct,position) values
      (qid,'Para separar clientes, datos, permisos y operación de cada espacio.',true,1),
      (qid,'Solo para cambiar el color del panel.',false,2),
      (qid,'Para que todos los clientes compartan los mismos contactos.',false,3);

    insert into public.assessment_questions(assessment_id,prompt,question_type,points,position)
    values(aid,'En un flujo básico de seguimiento, ¿qué debería quedar definido después de registrar un prospecto?','single_choice',1,3)
    returning id into qid;
    insert into public.assessment_options(question_id,label,is_correct,position) values
      (qid,'Su clasificación y la siguiente acción concreta.',true,1),
      (qid,'Solamente una nota sin responsable.',false,2),
      (qid,'Eliminarlo del CRM hasta que vuelva a escribir.',false,3);
  end if;
end;
$block$;

commit;
