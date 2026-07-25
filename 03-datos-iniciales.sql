-- ============================================================
-- AULA COMPÁS — DATOS INICIALES
-- Ejecuta después del parche de seguridad.
-- Puedes ejecutar este archivo más de una vez sin duplicar datos.
-- ============================================================

begin;

insert into public.courses
(id, title, slug, subtitle, description, cover_url, category, status, featured)
values
('11111111-1111-4111-8111-111111111111','El Compás del Estratega','el-compas-del-estratega','Tus ideas no necesitan más presión. Necesitan dirección.','Una ruta práctica para ordenar ideas, aprovechar la experiencia y construir un proyecto real.','assets/curso-compas.webp','Estrategia','published',true),
('22222222-2222-4222-8222-222222222222','Despierta tu memoria','despierta-tu-memoria','Recupera recuerdos valiosos y comienza a construir tu legado.','Curso inicial de memoria, reflexión y escritura de legado.','assets/curso-memoria.webp','Legado','published',false),
('33333333-3333-4333-8333-333333333333','Legado que Trasciende','legado-que-trasciende','Convierte tus recuerdos en un relato o libro para quienes amas.','Programa de acompañamiento humano y dirección editorial.','assets/curso-legado.webp','Escritura','published',false),
('44444444-4444-4444-8444-444444444444','Método MES®','metodo-mes','Mindfulness, escritura y serenidad para crear un sistema personal.','Programa de presencia, expresión segura y liberación.','assets/curso-mes.webp','Bienestar','published',false)
on conflict (id) do update set
  title=excluded.title,
  subtitle=excluded.subtitle,
  description=excluded.description,
  cover_url=excluded.cover_url,
  category=excluded.category,
  status=excluded.status,
  featured=excluded.featured;

insert into public.modules (id, course_id, title, position)
values
('11111111-aaaa-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','Claridad estratégica',1),
('11111111-bbbb-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','Ordenar ideas',2),
('11111111-cccc-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','Modelar tu proyecto',3),
('22222222-aaaa-4222-8222-222222222222','22222222-2222-4222-8222-222222222222','El valor de recordar',1),
('22222222-bbbb-4222-8222-222222222222','22222222-2222-4222-8222-222222222222','Los lugares de mi memoria',2),
('33333333-aaaa-4333-8333-333333333333','33333333-3333-4333-8333-333333333333','Elegir la historia',1),
('33333333-bbbb-4333-8333-333333333333','33333333-3333-4333-8333-333333333333','Dar forma al legado',2),
('44444444-aaaa-4444-8444-444444444444','44444444-4444-4444-8444-444444444444','Presencia',1),
('44444444-bbbb-4444-8444-444444444444','44444444-4444-4444-8444-444444444444','Expresión segura',2)
on conflict (id) do update set
  course_id=excluded.course_id,
  title=excluded.title,
  position=excluded.position;

insert into public.lessons
(id,module_id,title,lesson_type,duration_minutes,position,content_html)
values
('11111111-0001-4111-8111-111111111111','11111111-aaaa-4111-8111-111111111111','Tu experiencia tiene valor','video',13,1,'<h2>Tu experiencia es materia prima</h2><p>Reconoce los aprendizajes, habilidades e historias que pueden convertirse en un proyecto.</p>'),
('11111111-0002-4111-8111-111111111111','11111111-aaaa-4111-8111-111111111111','El problema no es la falta de ideas','video',15,2,'<h2>Muchas ideas también pueden detenerte</h2><p>El objetivo no es producir más ideas, sino elegir una dirección.</p>'),
('11111111-0003-4111-8111-111111111111','11111111-bbbb-4111-8111-111111111111','Captura todo lo que sabes','video',17,1,'<h2>Captura antes de ordenar</h2><p>Reúne conocimientos, experiencias, preguntas e historias sin juzgarlas.</p>'),
('11111111-0004-4111-8111-111111111111','11111111-bbbb-4111-8111-111111111111','Agrupa y prioriza','video',14,2,'<h2>Encuentra patrones</h2><p>Agrupa las ideas relacionadas y distingue lo importante de lo urgente.</p>'),
('11111111-0005-4111-8111-111111111111','11111111-cccc-4111-8111-111111111111','Convierte conocimiento en propuesta','video',19,1,'<h2>Diseña una transformación</h2><p>Define a quién ayudas, qué problema atiendes y qué resultado puedes facilitar.</p>'),
('22222222-0001-4222-8222-222222222222','22222222-aaaa-4222-8222-222222222222','¿Por qué vale la pena recordar?','video',11,1,'<h2>Recordar también es honrar</h2><p>La memoria permite reconocer lo vivido y compartirlo con quienes amas.</p>'),
('22222222-0002-4222-8222-222222222222','22222222-aaaa-4222-8222-222222222222','Tu historia no tiene que ser perfecta','video',13,2,'<h2>Lo verdadero tiene valor</h2><p>No necesitas una vida perfecta para dejar una enseñanza.</p>'),
('22222222-0003-4222-8222-222222222222','22222222-bbbb-4222-8222-222222222222','La casa donde empezó todo','video',14,1,'<h2>Los lugares guardan historias</h2><p>Recorre mentalmente los espacios que marcaron tus primeros años.</p>'),
('33333333-0001-4333-8333-333333333333','33333333-aaaa-4333-8333-333333333333','Lo que merece ser recordado','video',14,1,'<h2>Elige desde la emoción y la enseñanza</h2><p>Una historia valiosa no siempre es la más extraordinaria.</p>'),
('33333333-0002-4333-8333-333333333333','33333333-bbbb-4333-8333-333333333333','Construye tu primer capítulo','video',20,1,'<h2>Comienza con una escena</h2><p>Ubica al lector en un momento concreto y permite que la historia avance.</p>'),
('44444444-0001-4444-8444-444444444444','44444444-aaaa-4444-8444-444444444444','El piloto automático','video',15,1,'<h2>Reconoce tus patrones</h2><p>La presencia comienza cuando observas sin juicio aquello que repites.</p>'),
('44444444-0002-4444-8444-444444444444','44444444-bbbb-4444-8444-444444444444','Escribir para soltar','video',18,1,'<h2>Expresión segura</h2><p>La escritura puede ayudarte a reconocer, nombrar y procesar lo que sientes.</p>')
on conflict (id) do update set
  module_id=excluded.module_id,
  title=excluded.title,
  lesson_type=excluded.lesson_type,
  duration_minutes=excluded.duration_minutes,
  position=excluded.position,
  content_html=excluded.content_html;

insert into public.resources
(id,course_id,title,resource_type,external_url,is_public)
values
('aaaaaaaa-0001-4000-8000-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','Mapa Estratégico','template',null,false),
('aaaaaaaa-0002-4000-8000-aaaaaaaaaaaa','22222222-2222-4222-8222-222222222222','Cuaderno de memoria','pdf',null,false),
('aaaaaaaa-0003-4000-8000-aaaaaaaaaaaa',null,'Guía inicial de Aula Compás','pdf',null,true)
on conflict (id) do update set
  course_id=excluded.course_id,
  title=excluded.title,
  resource_type=excluded.resource_type,
  external_url=excluded.external_url,
  is_public=excluded.is_public;

commit;
