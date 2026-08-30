-- Compás Academy · Nivel 5 · Dirección Comercial Avanzada
-- Módulo 1: De supervisor a director comercial.
-- Curso y módulo permanecen en draft.

do $m$
declare
  v_course uuid;
  v_workspace uuid;
  v_module uuid;
  v_level4 uuid;
  jl jsonb;
  lessons jsonb := $c$
  [
    {"p":1,"t":"Pensar en sistema, no solo en resultados individuales","d":"Aprende a leer el área comercial como un sistema compuesto por mercado, capacidad, pipeline, conversión, recurrencia, talento y operación, evitando optimizar una métrica a costa del conjunto.","m":38,
     "html":"<h2>Objetivo</h2><p>Pasar de supervisar ejecución a dirigir un sistema comercial completo.</p><h3>Marco SISTEMA</h3><p><strong>S</strong>eñal: identifica el dato relevante. <strong>I</strong>nterdependencia: detecta qué otras variables se mueven con él. <strong>S</strong>egmentación: evita promedios que oculten problemas. <strong>T</strong>ensión: reconoce el intercambio entre velocidad, calidad, costo y capacidad. <strong>E</strong>xperimento: define una intervención controlada. <strong>M</strong>edición: establece qué cambiaría si la hipótesis es correcta. <strong>A</strong>prendizaje: documenta el resultado y decide si escalar, ajustar o detener.</p><h3>Contenido</h3><p>Un director no pregunta únicamente cuánto vendió el equipo. Pregunta qué parte del sistema produjo ese resultado, si es repetible, qué capacidad consumió y qué riesgo genera para el siguiente periodo. La dirección comercial conecta adquisición, avance, cierre, activación, permanencia y expansión. Una mejora aislada deja de ser mejora cuando deteriora calidad, margen, capacidad o confianza del cliente.</p><h3>Caso</h3><p>Un equipo aumenta cierres 22%, pero duplica incidencias de implementación y cancelaciones tempranas. La lectura superficial celebra ventas; la lectura de sistema detecta crecimiento no sostenible. Con SISTEMA se separa el efecto por canal, agente, plan y tiempo hasta localizar el origen.</p><h3>Ejercicio</h3><p>Elige un KPI que haya mejorado o empeorado. Dibuja cinco variables conectadas, formula una hipótesis causal y define un experimento de una semana que no comprometa clientes reales.</p><h3>Registro en Compás One</h3><p>Documenta señal, segmento afectado, hipótesis, intervención, responsable, fecha de revisión y criterio de éxito. No registres datos sensibles innecesarios.</p><h3>Guion de video</h3><p>Apertura: dirigir no es mirar un número más grande. Desarrollo: muestra un embudo donde un aumento de cierre provoca sobrecarga y churn. Explica SISTEMA paso a paso. Cierre: la dirección comercial protege el resultado de hoy sin hipotecar el de mañana.</p>"},
    {"p":2,"t":"Convertir estrategia en prioridades comerciales ejecutables","d":"Traduce objetivos de negocio en pocas prioridades, indicadores de resultado y señales adelantadas que el equipo pueda ejecutar y revisar.","m":40,
     "html":"<h2>Objetivo</h2><p>Transformar una intención estratégica en decisiones operativas medibles.</p><h3>Marco NORTE</h3><p><strong>N</strong>egocio: define el resultado que importa. <strong>O</strong>bstáculo: identifica la restricción principal. <strong>R</strong>esultado: fija el indicador final. <strong>T</strong>racción: selecciona señales adelantadas que puedan influirse semanalmente. <strong>E</strong>jecución: asigna responsables, límites y revisión.</p><h3>Contenido</h3><p>Una estrategia deja de ser útil cuando se convierte en una lista extensa de iniciativas. El director debe elegir. NORTE obliga a conectar cada prioridad con una restricción real y con señales que el equipo pueda mover antes de que termine el periodo. Las metas no deben convertirse en promesas comerciales ni justificar prácticas de presión.</p><h3>Caso</h3><p>La empresa quiere crecer 30%. En lugar de exigir 30% más cierres, el director identifica que la restricción está en oportunidades calificadas y seguimiento tardío. Define dos señales adelantadas: diagnósticos completos y oportunidades con próximo paso vigente.</p><h3>Ejercicio</h3><p>Convierte un objetivo amplio en una tarjeta NORTE: resultado de negocio, obstáculo, KPI final, dos señales adelantadas, responsable y cadencia de revisión.</p><h3>Registro en Compás One</h3><p>Crea la prioridad con propietario, métrica, baseline, objetivo interno, señales adelantadas y fecha de revisión. Diferencia objetivos internos de compromisos comunicados al cliente.</p><h3>Guion de video</h3><p>Apertura: una meta no es una estrategia. Desarrollo: muestra cómo un objetivo ambiguo se transforma con NORTE en una prioridad ejecutable. Cierre: el equipo debe saber qué mover esta semana y por qué importa.</p>"},
    {"p":3,"t":"Gobernanza de decisiones y ritmo de dirección","d":"Diseña una cadencia ejecutiva que diferencie monitoreo, decisiones, escalamiento y aprendizaje para evitar reuniones que solo reportan información.","m":42,
     "html":"<h2>Objetivo</h2><p>Crear un sistema de dirección donde cada reunión tenga propósito, evidencia y decisión.</p><h3>Marco GOBIERNA</h3><p><strong>G</strong>ap: identifica desviaciones significativas. <strong>O</strong>rigen: busca evidencia antes de atribuir causas. <strong>B</strong>loqueo: determina qué impide avanzar. <strong>I</strong>mpacto: prioriza por efecto y urgencia. <strong>E</strong>lección: define una decisión concreta. <strong>R</strong>esponsable: asigna propietario y autoridad. <strong>N</strong>ext step: fija el siguiente paso. <strong>A</strong>prendizaje: revisa el resultado en la cadencia siguiente.</p><h3>Contenido</h3><p>La gobernanza comercial separa cuatro conversaciones: salud del sistema, decisiones de corto plazo, riesgos que requieren escalamiento y aprendizajes que deben convertirse en estándar. Una reunión ejecutiva no debe consumir tiempo leyendo datos que ya están disponibles. Debe convertir evidencia en decisiones trazables.</p><h3>Caso</h3><p>En la reunión semanal cada supervisor presenta veinte números y nadie decide nada. Con GOBIERNA se seleccionan tres gaps, se documenta evidencia, se asigna una decisión por gap y se agenda la revisión del efecto.</p><h3>Ejercicio</h3><p>Diseña una agenda de 45 minutos: 10 minutos de señales, 20 de decisiones, 10 de riesgos y 5 de compromisos. Para cada decisión define dueño y fecha.</p><h3>Registro en Compás One</h3><p>Registra únicamente decisiones, responsables, evidencia mínima, riesgos y próximos pasos. Evita duplicar dashboards dentro de notas.</p><h3>Guion de video</h3><p>Apertura: una reunión sin decisión es solo una lectura colectiva de pantalla. Desarrollo: explica las cuatro conversaciones y aplica GOBIERNA a un caso. Cierre: toda reunión de dirección debe terminar con decisiones trazables y fechas.</p>"}
  ]$c$::jsonb;
begin
  select id,workspace_id into v_level4,v_workspace
  from public.courses
  where slug='nivel-4-liderazgo-supervision-comercial-compas'
  limit 1;

  if v_level4 is null then
    raise exception 'Nivel 4 course is required before Nivel 5';
  end if;

  select id into v_course from public.courses
  where slug='nivel-5-direccion-comercial-avanzada-compas' limit 1;

  if v_course is null then
    insert into public.courses(title,slug,subtitle,description,category,status,featured,instructor_name,duration_label,workspace_id)
    values(
      'Nivel 5 · Dirección Comercial Avanzada',
      'nivel-5-direccion-comercial-avanzada-compas',
      'De supervisar equipos a dirigir el sistema comercial',
      'Formación avanzada para convertir estrategia, capacidad, talento, pipeline y permanencia en un sistema comercial gobernable y escalable.',
      'Dirección Comercial',
      'draft',false,'Equipo Compás Evolution','12–14 h',v_workspace
    ) returning id into v_course;
  end if;

  select id into v_module from public.modules where course_id=v_course and position=1 limit 1;
  if v_module is null then
    insert into public.modules(course_id,title,description,position)
    values(v_course,'1. De supervisor a director comercial','Pensamiento sistémico, prioridades estratégicas y gobernanza de decisiones.',1)
    returning id into v_module;
  else
    update public.modules set title='1. De supervisor a director comercial',description='Pensamiento sistémico, prioridades estratégicas y gobernanza de decisiones.' where id=v_module;
  end if;

  for jl in select value from jsonb_array_elements(lessons) loop
    if exists(select 1 from public.lessons where module_id=v_module and position=(jl->>'p')::int) then
      update public.lessons
      set title=jl->>'t',description=jl->>'d',lesson_type='text',content_html=jl->>'html',duration_minutes=(jl->>'m')::int,is_preview=false,updated_at=now()
      where module_id=v_module and position=(jl->>'p')::int;
    else
      insert into public.lessons(module_id,title,description,lesson_type,content_html,duration_minutes,position,is_preview)
      values(v_module,jl->>'t',jl->>'d','text',jl->>'html',(jl->>'m')::int,(jl->>'p')::int,false);
    end if;
  end loop;
end $m$;
