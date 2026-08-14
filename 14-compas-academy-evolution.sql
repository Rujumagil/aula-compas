-- ============================================================
-- COMPÁS ACADEMY · EVOLUTION — MIGRACIÓN V7
-- No elimina datos existentes. Conserva cursos anteriores en borrador
-- y agrega la primera arquitectura de capacitación tecnológica.
-- Ejecutar después de 11-espacios-de-trabajo-carpetas.sql y 12-*.sql.
-- ============================================================

begin;

-- La carpeta/workspace conserva el slug histórico para no romper referencias.
update public.workspaces
set
  name = 'Compás Academy',
  description = 'Capacitación práctica del ecosistema Proyecto Compás Evolution.',
  accent_color = '#176A52',
  updated_at = now()
where slug = 'proyecto-compas';

-- El contenido legado se conserva pero deja de ser la portada de la academia.
update public.courses
set featured = false,
    status = case when status = 'published' then 'draft' else status end
where slug in (
  'el-compas-del-estratega',
  'despierta-tu-memoria',
  'legado-que-trasciende',
  'metodo-mes'
);

insert into public.courses
(id, title, slug, subtitle, description, cover_url, category, status, featured, instructor_name, duration_label, workspace_id)
values
(
  'a1111111-1111-4111-8111-111111111111',
  'Primeros pasos con Compás One',
  'primeros-pasos-compas-one',
  'Conoce la plataforma y empieza a operar con orden.',
  'Ruta de onboarding para comprender el panel, el CRM, las conversaciones y el flujo básico de seguimiento en Compás One.',
  'compas-academia.svg',
  'Compás One',
  'published',
  true,
  'Equipo Compás Evolution',
  '60–90 min',
  (select id from public.workspaces where slug='proyecto-compas' limit 1)
),
(
  'a2222222-2222-4222-8222-222222222222',
  'CRM y seguimiento comercial',
  'crm-seguimiento-comercial',
  'Convierte contactos en oportunidades con un proceso claro.',
  'Formación práctica para registrar prospectos, organizar prioridades, dar seguimiento y medir avances comerciales.',
  'compas-academia.svg',
  'Ventas',
  'published',
  false,
  'Equipo Compás Evolution',
  '2 h',
  (select id from public.workspaces where slug='proyecto-compas' limit 1)
),
(
  'a3333333-3333-4333-8333-333333333333',
  'Marketing digital con dirección',
  'marketing-digital-con-direccion',
  'Conecta contenido, campañas y objetivos de negocio.',
  'Ruta para planear contenido, campañas y métricas con un enfoque conectado al proceso comercial.',
  'compas-academia.svg',
  'Marketing',
  'published',
  false,
  'Equipo Compás Evolution',
  '2 h',
  (select id from public.workspaces where slug='proyecto-compas' limit 1)
),
(
  'a4444444-4444-4444-8444-444444444444',
  'Meta Ads: de campaña a oportunidad',
  'meta-ads-campana-oportunidad',
  'Captación con seguimiento, no campañas aisladas.',
  'Aprende a estructurar campañas para captar prospectos y llevarlos a un proceso de seguimiento dentro de Compás One.',
  'compas-academia.svg',
  'Meta Ads',
  'published',
  false,
  'Equipo Compás Evolution',
  '2–3 h',
  (select id from public.workspaces where slug='proyecto-compas' limit 1)
),
(
  'a5555555-5555-4555-8555-555555555555',
  'IA aplicada a negocios',
  'ia-aplicada-negocios',
  'Usa inteligencia artificial con contexto y propósito.',
  'Introducción práctica al uso de asistentes y agentes para atención, contenido, análisis y productividad.',
  'compas-academia.svg',
  'IA',
  'published',
  false,
  'Equipo Compás Evolution',
  '2 h',
  (select id from public.workspaces where slug='proyecto-compas' limit 1)
),
(
  'a6666666-6666-4666-8666-666666666666',
  'Automatización para equipos pequeños',
  'automatizacion-equipos-pequenos',
  'Convierte tareas repetitivas en flujos simples y medibles.',
  'Ruta para detectar tareas repetitivas, diseñar disparadores y construir automatizaciones sostenibles.',
  'compas-academia.svg',
  'Automatización',
  'published',
  false,
  'Equipo Compás Evolution',
  '2 h',
  (select id from public.workspaces where slug='proyecto-compas' limit 1)
)
on conflict (id) do update set
  title=excluded.title,
  slug=excluded.slug,
  subtitle=excluded.subtitle,
  description=excluded.description,
  cover_url=excluded.cover_url,
  category=excluded.category,
  status=excluded.status,
  featured=excluded.featured,
  instructor_name=excluded.instructor_name,
  duration_label=excluded.duration_label,
  workspace_id=excluded.workspace_id;

insert into public.modules (id, course_id, title, position)
values
('a1111111-aaaa-4111-8111-111111111111','a1111111-1111-4111-8111-111111111111','Conoce Compás One',1),
('a1111111-bbbb-4111-8111-111111111111','a1111111-1111-4111-8111-111111111111','Tu primer flujo de trabajo',2),
('a2222222-aaaa-4222-8222-222222222222','a2222222-2222-4222-8222-222222222222','Fundamentos de CRM',1),
('a2222222-bbbb-4222-8222-222222222222','a2222222-2222-4222-8222-222222222222','Seguimiento comercial',2),
('a3333333-aaaa-4333-8333-333333333333','a3333333-3333-4333-8333-333333333333','Estrategia antes que contenido',1),
('a4444444-aaaa-4444-8444-444444444444','a4444444-4444-4444-8444-444444444444','Campañas que alimentan el CRM',1),
('a5555555-aaaa-4555-8555-555555555555','a5555555-5555-4555-8555-555555555555','IA con contexto',1),
('a6666666-aaaa-4666-8666-666666666666','a6666666-6666-4666-8666-666666666666','Detectar qué automatizar',1)
on conflict (id) do update set
  course_id=excluded.course_id,
  title=excluded.title,
  position=excluded.position;

insert into public.lessons
(id,module_id,title,lesson_type,duration_minutes,position,content_html)
values
('a1111111-0001-4111-8111-111111111111','a1111111-aaaa-4111-8111-111111111111','Qué es Compás One y cómo se organiza','video',12,1,'<h2>Tu centro operativo</h2><p>Conoce la lógica de trabajo de Compás One y cómo conecta contactos, conversaciones y seguimiento.</p>'),
('a1111111-0002-4111-8111-111111111111','a1111111-aaaa-4111-8111-111111111111','Navegación, workspace y permisos','video',14,2,'<h2>Trabaja dentro del espacio correcto</h2><p>Identifica tu workspace, tus permisos y las áreas principales de la plataforma.</p>'),
('a1111111-0003-4111-8111-111111111111','a1111111-bbbb-4111-8111-111111111111','Registrar y seguir un prospecto','video',18,1,'<h2>De contacto a siguiente acción</h2><p>Practica un flujo básico: registrar, clasificar y definir el siguiente paso de un prospecto.</p>'),
('a2222222-0001-4222-8222-222222222222','a2222222-aaaa-4222-8222-222222222222','Qué debe resolver un CRM','video',15,1,'<h2>Orden antes que volumen</h2><p>Un CRM sirve para que cada oportunidad tenga contexto, responsable y siguiente acción.</p>'),
('a2222222-0002-4222-8222-222222222222','a2222222-bbbb-4222-8222-222222222222','Cadencia de seguimiento','video',18,1,'<h2>Seguimiento sin improvisación</h2><p>Diseña una cadencia sencilla y medible para evitar que los prospectos se pierdan.</p>'),
('a3333333-0001-4333-8333-333333333333','a3333333-aaaa-4333-8333-333333333333','Objetivo, audiencia y propuesta','video',18,1,'<h2>Antes de publicar, define dirección</h2><p>Conecta cada contenido con una audiencia, un problema y una siguiente acción.</p>'),
('a4444444-0001-4444-8444-444444444444','a4444444-aaaa-4444-8444-444444444444','Del anuncio al seguimiento','video',20,1,'<h2>Una campaña no termina en el formulario</h2><p>Diseña desde el inicio qué ocurrirá cuando un prospecto deje sus datos.</p>'),
('a5555555-0001-4555-8555-555555555555','a5555555-aaaa-4555-8555-555555555555','Prompts con contexto de negocio','video',18,1,'<h2>Contexto antes que instrucciones largas</h2><p>Aprende a dar a la IA objetivo, audiencia, restricciones y criterios de calidad.</p>'),
('a6666666-0001-4666-8666-666666666666','a6666666-aaaa-4666-8666-666666666666','Mapa de tareas repetitivas','video',18,1,'<h2>Automatiza lo repetible</h2><p>Identifica tareas frecuentes, entradas, decisiones y resultados antes de construir un flujo.</p>')
on conflict (id) do update set
  module_id=excluded.module_id,
  title=excluded.title,
  lesson_type=excluded.lesson_type,
  duration_minutes=excluded.duration_minutes,
  position=excluded.position,
  content_html=excluded.content_html;

insert into public.resources
(id, course_id, title, resource_type, external_url, is_public)
values
('b1111111-0001-4111-8111-111111111111','a1111111-1111-4111-8111-111111111111','Checklist de inicio en Compás One','template',null,false),
('b2222222-0001-4222-8222-222222222222','a2222222-2222-4222-8222-222222222222','Plantilla de seguimiento comercial','template',null,false),
('b3333333-0001-4333-8333-333333333333',null,'Guía de inicio · Compás Academy','pdf',null,true)
on conflict (id) do update set
  course_id=excluded.course_id,
  title=excluded.title,
  resource_type=excluded.resource_type,
  external_url=excluded.external_url,
  is_public=excluded.is_public;

commit;
