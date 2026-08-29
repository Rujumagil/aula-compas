-- Compás Academy · Nivel 2 · Captación y Ventas Compás
-- Crea el curso en borrador con 6 módulos y 18 lecciones.

do $m$
declare
  v_course uuid;
  v_workspace uuid;
  v_module uuid;
  jm jsonb;
  jl jsonb;
  curriculum jsonb := $c$
  [
    {"p":1,"t":"1. Construye tu mercado objetivo","d":"Define con quién hablar, por qué puede necesitar Compás y cómo convertir un mercado amplio en una lista concreta de oportunidades.","l":[
      {"p":1,"t":"Tu mercado antes de prospectar","d":"Aprende a elegir segmentos donde puedas generar conversaciones relevantes en lugar de contactar personas al azar.","m":12},
      {"p":2,"t":"Perfil de cliente ideal Compás","d":"Identifica las características que hacen que un prospecto tenga una necesidad real y pueda avanzar con una solución gradual.","m":14},
      {"p":3,"t":"Construye tu lista de 50 prospectos","d":"Convierte tu mercado objetivo en una lista de trabajo priorizada para los siguientes 30 días.","m":18}
    ]},
    {"p":2,"t":"2. Captación multicanal","d":"Aprende a generar conversaciones desde relaciones, redes sociales, presencia local y alianzas sin depender de un solo canal.","l":[
      {"p":1,"t":"Prospección por red personal y referidos","d":"Usa tu red existente de forma profesional, sin convertir cada conversación personal en una venta forzada.","m":14},
      {"p":2,"t":"Prospección por redes sociales","d":"Detecta oportunidades en perfiles de negocios y crea conversaciones basadas en observaciones concretas.","m":16},
      {"p":3,"t":"Prospección local y alianzas","d":"Genera oportunidades con visitas, eventos y aliados que atienden al mismo tipo de cliente.","m":15}
    ]},
    {"p":3,"t":"3. Primer contacto que abre conversación","d":"Convierte un prospecto identificado en una conversación natural que permita explorar la necesidad sin lanzar una presentación prematura.","l":[
      {"p":1,"t":"Mensaje de apertura sin vender de golpe","d":"Construye aperturas breves que tengan contexto, relevancia y una pregunta sencilla.","m":13},
      {"p":2,"t":"Cómo despertar interés con una observación útil","d":"Aprende a señalar oportunidades de mejora sin criticar ni asumir problemas que el prospecto no ha confirmado.","m":14},
      {"p":3,"t":"Cadencia de contacto y cuándo detenerse","d":"Da seguimiento con disciplina sin acosar al prospecto ni quemar la relación.","m":13}
    ]},
    {"p":4,"t":"4. Diagnóstico y calificación","d":"Aprende a descubrir qué está ocurriendo en el negocio, qué impacto tiene y qué solución mínima puede ser suficiente.","l":[
      {"p":1,"t":"Preguntas de diagnóstico Compás","d":"Usa preguntas abiertas para entender captación, seguimiento, operación y objetivos antes de recomendar.","m":18},
      {"p":2,"t":"Dolor, urgencia, capacidad y decisión","d":"Califica si existe un problema relevante, prioridad para resolverlo y capacidad real para avanzar.","m":16},
      {"p":3,"t":"Traducir la necesidad al plan correcto","d":"Relaciona el diagnóstico con Inicio, Impulso, Crece o Negocio sin sobredimensionar la propuesta.","m":17}
    ]},
    {"p":5,"t":"5. Presentación, objeciones y cierre","d":"Presenta una recomendación clara, responde dudas sin pelear y guía al prospecto hacia una decisión concreta.","l":[
      {"p":1,"t":"Presentar valor antes que precio","d":"Estructura una propuesta corta conectando problema, solución, alcance y siguiente paso.","m":15},
      {"p":2,"t":"Manejo de objeciones frecuentes","d":"Responde a precio, tiempo, comparación y dudas sin prometer resultados ni entrar en confrontación.","m":18},
      {"p":3,"t":"Cierre claro sin presión","d":"Pide una decisión o un siguiente paso concreto manteniendo la confianza y las reglas comerciales.","m":15}
    ]},
    {"p":6,"t":"6. Seguimiento y disciplina comercial","d":"Convierte la prospección en un sistema medible usando pipeline, próximos pasos y revisión semanal.","l":[
      {"p":1,"t":"Pipeline en Compás One","d":"Usa las etapas comerciales y los próximos pasos para saber exactamente qué requiere atención.","m":17},
      {"p":2,"t":"Seguimiento después de la propuesta","d":"Mantén viva una propuesta con contexto, preguntas y acuerdos concretos en lugar de mensajes genéricos.","m":15},
      {"p":3,"t":"Métricas semanales y mejora continua","d":"Lee tus KPIs para detectar si necesitas más actividad, mejor diagnóstico, mejor propuesta o mejor seguimiento.","m":18}
    ]}
  ]$c$::jsonb;
begin
  select c.workspace_id into v_workspace
  from public.courses c
  where c.slug='nivel-1-inicio-comercial-compas'
  limit 1;

  if v_workspace is null then
    raise exception 'Nivel 1 course is required';
  end if;

  select c.id into v_course
  from public.courses c
  where c.slug='nivel-2-captacion-y-ventas-compas'
  limit 1;

  if v_course is null then
    insert into public.courses(
      title,slug,subtitle,description,category,status,featured,instructor_name,duration_label,workspace_id
    ) values(
      'Nivel 2 · Captación y Ventas Compás',
      'nivel-2-captacion-y-ventas-compas',
      'De prospectar a cerrar con método',
      'Ruta práctica para convertir mercado, captación, diagnóstico, propuesta, cierre y seguimiento en un proceso comercial medible.',
      'Freelance Comercial',
      'draft',
      false,
      'Equipo Compás Evolution',
      '4–5 h',
      v_workspace
    ) returning id into v_course;
  else
    update public.courses
    set title='Nivel 2 · Captación y Ventas Compás',
        subtitle='De prospectar a cerrar con método',
        description='Ruta práctica para convertir mercado, captación, diagnóstico, propuesta, cierre y seguimiento en un proceso comercial medible.',
        category='Freelance Comercial',
        instructor_name='Equipo Compás Evolution',
        duration_label='4–5 h',
        workspace_id=v_workspace,
        updated_at=now()
    where id=v_course;
  end if;

  for jm in select value from jsonb_array_elements(curriculum) loop
    v_module:=null;
    select m.id into v_module
    from public.modules m
    where m.course_id=v_course and m.position=(jm->>'p')::int
    limit 1;

    if v_module is null then
      insert into public.modules(course_id,title,description,position)
      values(v_course,jm->>'t',jm->>'d',(jm->>'p')::int)
      returning id into v_module;
    else
      update public.modules
      set title=jm->>'t',description=jm->>'d'
      where id=v_module;
    end if;

    for jl in select value from jsonb_array_elements(jm->'l') loop
      if exists(
        select 1 from public.lessons l
        where l.module_id=v_module and l.position=(jl->>'p')::int
      ) then
        update public.lessons
        set title=jl->>'t',
            description=jl->>'d',
            lesson_type='text',
            content_html='<h2>'||(jl->>'t')||'</h2><p>'||(jl->>'d')||'</p><h3>Aplicación práctica</h3><p>Aplica este concepto a una oportunidad real, registra lo observado en tu Centro de Operaciones y define un próximo paso con fecha.</p>',
            duration_minutes=(jl->>'m')::int,
            is_preview=false,
            updated_at=now()
        where module_id=v_module and position=(jl->>'p')::int;
      else
        insert into public.lessons(
          module_id,title,description,lesson_type,content_html,duration_minutes,position,is_preview
        ) values(
          v_module,jl->>'t',jl->>'d','text',
          '<h2>'||(jl->>'t')||'</h2><p>'||(jl->>'d')||'</p><h3>Aplicación práctica</h3><p>Aplica este concepto a una oportunidad real, registra lo observado en tu Centro de Operaciones y define un próximo paso con fecha.</p>',
          (jl->>'m')::int,(jl->>'p')::int,false
        );
      end if;
    end loop;
  end loop;
end $m$;
