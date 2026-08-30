-- Compás Academy · Nivel 4 · Liderazgo y Supervisión Comercial
-- Curso en borrador. Primer bloque completo: Módulo 1 · De productor individual a líder de operación.
-- No publica el curso ni emite certificados.

do $m$
declare
  v_course uuid;
  v_workspace uuid;
  v_module uuid;
  jm jsonb;
  jl jsonb;
  curriculum jsonb := $c$
  [
    {"p":1,"t":"1. De productor individual a líder de operación","d":"Cambia el foco de vender personalmente a crear claridad, ritmo y responsabilidad en un equipo comercial.","l":[
      {"p":1,"t":"El cambio de rol: de hacer a habilitar","d":"Distingue el desempeño individual del liderazgo que hace posible el desempeño de otros.","m":28,"objective":"Al terminar, el participante podrá separar tareas de productor, líder y administrador, y decidir dónde debe intervenir sin absorber el trabajo del equipo.","core":"Un buen vendedor no se convierte automáticamente en buen supervisor. El supervisor deja de medir su valor por cuántas conversaciones resuelve personalmente y empieza a medirlo por la claridad del sistema, la calidad de las decisiones y la capacidad del equipo para ejecutar sin dependencia constante. Liderar no significa rescatar cada oportunidad ni convertirse en cuello de botella.","method":"Marco HABILITA: Hacer visible el objetivo; Aclarar estándar; Brindar contexto; Identificar responsable; Limitar la intervención; Inspeccionar evidencia; Transferir aprendizaje; Acordar siguiente paso.","case":"Un agente pide al supervisor que cierre una oportunidad difícil. Si el supervisor toma la conversación cada vez, obtiene una posible venta pero mantiene dependencia. Con HABILITA revisa el diagnóstico, pregunta qué objeción existe, ayuda a preparar dos rutas de respuesta, observa la ejecución y después retroalimenta.","practice":"Toma diez tareas habituales de un supervisor y clasifícalas en: debo hacer, debo enseñar, debo delegar o debo escalar. Justifica tres decisiones.","platform":"Registrar en Compás One una tarea de coaching con responsable, evidencia esperada y fecha; no registrar una venta ficticia.","video":"Apertura: el ascenso cambia el trabajo. Explicar diferencia entre ser el mejor ejecutor y construir capacidad. Mostrar un ejemplo de rescate frente a coaching. Recorrer HABILITA paso a paso. Cierre: antes de intervenir, pregunta si el equipo necesita una decisión, una habilidad o simplemente claridad."},
      {"p":2,"t":"Estándares claros antes de exigir resultados","d":"Convierte expectativas vagas en comportamientos y evidencias observables.","m":30,"objective":"Definir estándares comerciales verificables para seguimiento, calidad de CRM, diagnóstico, propuestas y escalamiento.","core":"No es justo corregir a una persona por un estándar que nunca fue definido. ‘Da mejor seguimiento’ no describe qué hacer. Un estándar útil especifica conducta, evidencia, frecuencia y condición de escalamiento. Los resultados finales dependen de factores externos; el supervisor debe gestionar con especial atención las conductas controlables.","method":"Matriz CAFE: Conducta esperada; Artefacto o evidencia; Frecuencia; Escalamiento. Ejemplo: toda oportunidad activa debe tener siguiente paso registrado, evidencia en CRM, revisión diaria y escalamiento cuando permanezca bloqueada más allá del umbral definido por operación.","case":"Dos agentes tienen pocas ventas. Uno mantiene diagnóstico, próximos pasos y seguimiento correcto; el otro deja conversaciones sin registrar. El supervisor no debe tratarlos como el mismo problema: el primero requiere análisis de conversión; el segundo requiere disciplina operativa.","practice":"Escribe cinco estándares CAFE para un equipo Compás: registro de lead, diagnóstico, seguimiento, propuesta y handoff postventa. Elimina cualquier frase que no pueda comprobarse.","platform":"Crear o revisar una vista de control con oportunidades sin siguiente paso, tareas vencidas y expedientes incompletos; usar datos reales únicamente cuando existan.","video":"Abrir con tres frases vagas: ‘échale ganas’, ‘vende más’, ‘sé más ordenado’. Explicar por qué no sirven para dirigir. Construir un estándar CAFE en pantalla. Contrastar resultado con conducta controlable. Cerrar con la regla: primero claridad, después responsabilidad."},
      {"p":3,"t":"Cadencia de supervisión sin microgestión","d":"Diseña un ritmo semanal de dirección que detecte bloqueos sin perseguir a cada persona todo el día.","m":32,"objective":"Construir una cadencia mínima de supervisión con revisión de pipeline, coaching, compromisos y escalamiento.","core":"La ausencia de seguimiento crea sorpresas; el exceso de seguimiento crea dependencia. Una cadencia saludable establece momentos conocidos para revisar evidencia y deja espacio para ejecutar. El supervisor interviene antes cuando existe riesgo de cliente, cumplimiento, reputación o una decisión fuera de autoridad.","method":"Ritmo 4R: Radar diario de excepciones; Revisión semanal de pipeline; Retroalimentación individual breve; Resumen de compromisos. Cada reunión termina con responsable, fecha y evidencia, no con intenciones.","case":"Un supervisor pregunta cada dos horas cuántos mensajes envió el agente. Eso consume atención y no mejora criterio. Con 4R observa excepciones diarias, revisa pipeline una vez por semana y usa el 1:1 para una habilidad concreta.","practice":"Diseña una semana de supervisión para cinco agentes. Limita reuniones recurrentes, define qué se revisa en cada una y especifica qué eventos justifican interrumpir la cadencia.","platform":"Usar tareas y pipeline de Compás One como fuente de evidencia para la revisión. Documentar acuerdos de coaching sin datos sensibles innecesarios.","video":"Mostrar dos extremos: abandono y microgestión. Presentar el Ritmo 4R. Explicar qué pertenece al radar diario y qué puede esperar a la revisión semanal. Cerrar con una agenda de 20 minutos para pipeline y una de 15 minutos para coaching."}
    ]}
  ]$c$::jsonb;
begin
  select c.workspace_id into v_workspace from public.courses c where c.slug='nivel-3-cartera-permanencia-crecimiento-compas' limit 1;
  if v_workspace is null then raise exception 'Nivel 3 course is required'; end if;

  select c.id into v_course from public.courses c where c.slug='nivel-4-liderazgo-supervision-comercial' limit 1;
  if v_course is null then
    insert into public.courses(workspace_id,title,slug,description,status)
    values(v_workspace,'Nivel 4 · Liderazgo y Supervisión Comercial','nivel-4-liderazgo-supervision-comercial','Forma supervisores capaces de dirigir con estándares, coaching, evidencia y responsabilidad sin microgestión.','draft')
    returning id into v_course;
  else
    update public.courses set title='Nivel 4 · Liderazgo y Supervisión Comercial',description='Forma supervisores capaces de dirigir con estándares, coaching, evidencia y responsabilidad sin microgestión.',status='draft' where id=v_course;
  end if;

  for jm in select * from jsonb_array_elements(curriculum) loop
    select id into v_module from public.modules where course_id=v_course and position=(jm->>'p')::int limit 1;
    if v_module is null then
      insert into public.modules(course_id,title,description,position) values(v_course,jm->>'t',jm->>'d',(jm->>'p')::int) returning id into v_module;
    else
      update public.modules set title=jm->>'t',description=jm->>'d' where id=v_module;
    end if;

    for jl in select * from jsonb_array_elements(jm->'l') loop
      if exists(select 1 from public.lessons where module_id=v_module and position=(jl->>'p')::int) then
        update public.lessons set title=jl->>'t',description=jl->>'d',duration_minutes=(jl->>'m')::int,content=jsonb_build_object('objective',jl->>'objective','core',jl->>'core','method',jl->>'method','case',jl->>'case','practice',jl->>'practice','platform',jl->>'platform','video',jl->>'video') where module_id=v_module and position=(jl->>'p')::int;
      else
        insert into public.lessons(module_id,title,description,position,duration_minutes,content) values(v_module,jl->>'t',jl->>'d',(jl->>'p')::int,(jl->>'m')::int,jsonb_build_object('objective',jl->>'objective','core',jl->>'core','method',jl->>'method','case',jl->>'case','practice',jl->>'practice','platform',jl->>'platform','video',jl->>'video'));
      end if;
    end loop;
  end loop;
end $m$;