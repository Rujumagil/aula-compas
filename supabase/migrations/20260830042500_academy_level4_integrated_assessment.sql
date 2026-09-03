-- Compás Academy · Nivel 4 · Evaluación integradora de Liderazgo y Supervisión
-- 30 preguntas de opción única. Aprobación mínima: 80% (24/30).
-- El curso permanece draft; la evaluación puede existir publicada para QA sin emitir certificados.

do $m$
declare
  v_course uuid;
  v_assessment uuid;
  v_question uuid;
  jq jsonb;
  option_label text;
  option_pos int;
  question_pos int:=0;
  questions jsonb := $q$
  [
    {"p":"Un supervisor recibe una oportunidad compleja y el agente le pide que la cierre por él. ¿Cuál es la mejor primera intervención?","o":["Tomar la oportunidad para asegurar el resultado","Revisar diagnóstico, aclarar criterio, preparar rutas y observar al agente ejecutar","Transferirla a otro agente sin explicación","Autorizar un descuento"],"c":2,"e":"HABILITA busca desarrollar capacidad sin convertir al supervisor en cuello de botella."},
    {"p":"¿Cuál es un estándar CAFE correctamente definido?","o":["Sé más responsable","Vende más esta semana","Toda oportunidad activa debe tener siguiente paso registrado, evidencia y fecha de revisión","Pon más actitud"],"c":3,"e":"CAFE convierte expectativas en conducta, artefacto, frecuencia y escalamiento verificables."},
    {"p":"¿Qué práctica representa microgestión?","o":["Radar diario de excepciones","Revisión semanal de pipeline","Preguntar cada dos horas cuántos mensajes envió cada agente","Un 1:1 de coaching con evidencia"],"c":3,"e":"La vigilancia continua de actividad sin propósito crea dependencia y consume atención."},
    {"p":"En el marco DATO, ¿qué debe ocurrir antes de concluir que un agente tiene un problema de habilidad?","o":["Aplicar una sanción","Separar dato, evidencia observable, hipótesis y prueba","Compararlo con el mejor vendedor","Cambiarle la cartera"],"c":2,"e":"DATO obliga a distinguir hechos de interpretaciones antes de intervenir."},
    {"p":"Un buen 1:1 de coaching debería terminar con:","o":["Consejos generales","Un compromiso observable, fecha y evidencia esperada","Una promesa de venta","Más reuniones sin objetivo"],"c":2,"e":"CRECE convierte conversación en aprendizaje y siguiente acción verificable."},
    {"p":"¿Qué hace que una retroalimentación VELO sea útil?","o":["Etiquetar a la persona","Describir conducta observable, efecto y alternativa concreta","Hablar solo de personalidad","Evitar evidencia para no incomodar"],"c":2,"e":"El feedback efectivo se centra en conductas observables y alternativas practicables."},
    {"p":"Cuando una brecha persiste después del coaching, PACTO sirve para:","o":["Automatizar una sanción","Formalizar problema, acción, soporte, criterio y tiempo de revisión","Eliminar al agente del CRM","Prometer mejores leads"],"c":2,"e":"PACTO crea un plan de mejora verificable sin sustituir procesos administrativos formales."},
    {"p":"En FARO, ¿qué debe hacer el supervisor si hay mucha actividad pero poco avance entre etapas?","o":["Exigir más mensajes","Diagnosticar el punto de conversión que está bloqueando el flujo","Aumentar el forecast","Cerrar oportunidades viejas sin revisar"],"c":2,"e":"El volumen no corrige un cuello de botella de conversión; FARO busca localizarlo."},
    {"p":"¿Cuál decisión refleja mejor CARGA?","o":["Dar más oportunidades al agente con más cartera","Distribuir trabajo considerando capacidad, prioridad, riesgo y próximos pasos","Repartir leads por igual sin contexto","Ocultar tareas vencidas"],"c":2,"e":"CARGA combina capacidad real con prioridad operativa."},
    {"p":"Un forecast PRISMA responsable debe tratar una oportunidad como:","o":["Ingreso garantizado","Estimación basada en evidencia, probabilidad, riesgo y siguiente paso","Comisión futura asegurada","Venta ganada si el cliente mostró interés"],"c":2,"e":"El forecast orienta decisiones; no es una promesa de resultado."},
    {"p":"Dos agentes tienen el mismo resultado bajo. Uno cumple procesos y otro deja seguimientos sin registrar. ¿Qué corresponde?","o":["La misma corrección para ambos","Distinguir una posible brecha de conversión de una brecha de disciplina operativa","Sancionar a ambos","Cambiar los KPIs"],"c":2,"e":"HECHO exige diagnosticar evidencia y contexto antes de intervenir."},
    {"p":"¿Cuál apertura es más adecuada para una conversación CLARO?","o":["Siempre haces todo mal","Quiero revisar este estándar, la evidencia observada y acordar qué debe cambiar","Si no vendes hoy habrá consecuencias","Todos dicen que tienes mala actitud"],"c":2,"e":"CLARO parte de estándar y hechos, no de etiquetas o amenazas."},
    {"p":"RECUPERA debe utilizarse principalmente para:","o":["Decidir seguimiento, soporte, escalamiento proporcional y reconocimiento","Calcular comisiones","Crear descuentos","Publicar rankings"],"c":1,"e":"RECUPERA estructura la recuperación del desempeño y el escalamiento proporcional."},
    {"p":"¿Qué situación requiere escalar una decisión fuera de la autoridad comercial?","o":["Definir una tarea de seguimiento","Aprobar una compensación o reembolso no autorizado","Revisar una oportunidad","Dar coaching"],"c":2,"e":"Las decisiones económicas o administrativas fuera de autoridad deben escalarse."},
    {"p":"En PULSO, un acuerdo interno de servicio sirve para:","o":["Prometer al cliente tiempos garantizados","Alinear prioridad, responsable, tiempo interno, evidencia y excepciones","Eliminar handoffs","Sustituir contratos"],"c":2,"e":"Los acuerdos internos ordenan operación sin convertirse automáticamente en promesas externas."},
    {"p":"Un handoff PUENTE de calidad debe incluir:","o":["Toda la información disponible aunque sea innecesaria","Contexto mínimo necesario, responsable receptor, límites, estado y siguiente paso","Contraseñas del cliente","Solo el nombre del cliente"],"c":2,"e":"PUENTE protege continuidad y minimiza datos innecesarios."},
    {"p":"Ante un incidente de servicio, RESTAURA comienza por:","o":["Ofrecer una compensación","Registrar el hecho verificable y contener el impacto","Buscar culpables","Cerrar el ticket"],"c":2,"e":"La recuperación comienza por hechos y contención antes de resolver o prevenir."},
    {"p":"¿Cuál es la mejor evidencia de potencial en MAPA?","o":["Antigüedad solamente","Desempeño, aptitud, práctica deliberada y autonomía demostrada","Ser amigo del supervisor","Pedir un ascenso"],"c":2,"e":"MAPA diferencia rendimiento actual de preparación y autonomía."},
    {"p":"En DELEGA, antes de transferir una responsabilidad el supervisor debe definir:","o":["Solo la fecha","Resultado, autoridad, límites, evidencia y checkpoints","Una comisión extra","Quién será promovido"],"c":2,"e":"La delegación segura combina resultado esperado con límites y verificación."},
    {"p":"RELEVO busca principalmente:","o":["Prometer una promoción","Reducir dependencia de una sola persona mediante transferencia y prueba de continuidad","Duplicar puestos","Eliminar al responsable actual"],"c":2,"e":"La sucesión operativa no equivale a ascenso; busca continuidad verificable."},
    {"p":"Un agente muestra buena actividad pero muchas oportunidades sin siguiente paso. ¿Cuál intervención es más precisa?","o":["Pedir más actividad","Corregir disciplina de pipeline y estándar de siguiente paso","Cambiar todo el equipo","Aumentar presupuesto de anuncios"],"c":2,"e":"El dato apunta a una brecha operativa específica, no necesariamente a falta de actividad."},
    {"p":"Un supervisor descubre que su forecast depende de tres oportunidades sin fecha ni decisor identificado. ¿Qué debe hacer?","o":["Mantenerlas como seguras","Reducir certeza, actualizar riesgo y exigir siguiente evidencia","Marcar las tres como ganadas","Prometer cierre al equipo"],"c":2,"e":"PRISMA obliga a ajustar la proyección a la evidencia disponible."},
    {"p":"Después de una conversación correctiva, el agente cumple durante una semana y luego reincide. ¿Cuál es el siguiente paso responsable?","o":["Ignorar la reincidencia","Revisar el acuerdo, evidencia, soporte y escalar proporcionalmente según proceso","Despedirlo automáticamente","Quitarle todos los clientes"],"c":2,"e":"La reincidencia requiere revisar el plan y escalar según evidencia y reglas, no automatizar sanciones."},
    {"p":"Un cliente reporta una falla y el agente desconoce si corresponde compensación. ¿Qué debe hacer?","o":["Prometer un mes gratis","Contener, documentar, escalar la decisión y mantener informado al cliente","Culpar al sistema","Cerrar el caso"],"c":2,"e":"RESTAURA combina contención y escalamiento cuando la decisión supera autoridad."},
    {"p":"¿Qué diferencia una delegación real de simplemente pasar trabajo?","o":["La delegación define autoridad, resultado, evidencia y seguimiento","La delegación elimina responsabilidad del supervisor","La delegación siempre incluye ascenso","No existe diferencia"],"c":1,"e":"Delegar desarrolla autonomía dentro de límites explícitos."},
    {"p":"¿Cuál es la mejor señal de que un plan de sucesión está funcionando?","o":["El sucesor dice sentirse listo","El proceso puede ejecutarse con evidencia y criterios durante una prueba autónoma","El supervisor se ausenta sin avisar","Se cambia el rol en el sistema"],"c":2,"e":"RELEVO valida continuidad mediante ensayo y autonomía demostrada."},
    {"p":"¿Cuándo debe un supervisor reconocer desempeño positivo?","o":["Solo cuando hay ventas","Cuando existe conducta o resultado verificable alineado con el estándar","Solo al final del año","Nunca para evitar favoritismo"],"c":2,"e":"El reconocimiento específico refuerza conductas valiosas y debe basarse en evidencia."},
    {"p":"¿Cuál combinación resume mejor una supervisión madura?","o":["Presión, intuición y rescate","Estándares, evidencia, coaching, decisiones y seguimiento","Más reuniones y mensajes","Descuentos y promociones"],"c":2,"e":"Nivel 4 integra dirección por estándares, evidencia, desarrollo y operación."},
    {"p":"Un agente está preparado para asumir más responsabilidad según MAPA y RELEVO. ¿Qué significa eso respecto a su promoción formal?","o":["Debe ascender automáticamente","La preparación es evidencia de desarrollo, pero el ascenso sigue la ruta y requisitos vigentes","Puede cambiar sus permisos","Puede presentarse como supervisor"],"c":2,"e":"Preparación y promoción son conceptos distintos; los permisos siguen el rol real."},
    {"p":"¿Cuál es el principio final del Nivel 4?","o":["El supervisor debe ser quien más vende","El liderazgo crea un sistema donde la gente puede ejecutar, aprender, escalar riesgos y mejorar con evidencia","La mejor operación depende de una sola persona","Los KPIs sustituyen conversaciones"],"c":2,"e":"El objetivo de la supervisión es construir capacidad sostenible, no dependencia."}
  ]$q$::jsonb;
begin
  select id into v_course from public.courses where slug='nivel-4-liderazgo-supervision-comercial' limit 1;
  if v_course is null then raise exception 'Nivel 4 course is required'; end if;

  select id into v_assessment from public.assessments
  where course_id=v_course and title='Evaluación integradora · Nivel 4' limit 1;

  if v_assessment is null then
    insert into public.assessments(course_id,title,description,assessment_type,passing_score,status,position)
    values(v_course,'Evaluación integradora · Nivel 4','Evalúa liderazgo, coaching, KPIs, desempeño, calidad operativa, delegación y sucesión. Requiere 80% (24/30).','quiz',80,'draft',1)
    returning id into v_assessment;
  else
    update public.assessments set status='draft',passing_score=80,
      description='Evalúa liderazgo, coaching, KPIs, desempeño, calidad operativa, delegación y sucesión. Requiere 80% (24/30).',updated_at=now()
    where id=v_assessment;
  end if;

  if not exists(select 1 from public.assessment_questions where assessment_id=v_assessment) then
    for jq in select value from jsonb_array_elements(questions) loop
      question_pos:=question_pos+1;
      insert into public.assessment_questions(assessment_id,prompt,question_type,explanation,points,position)
      values(v_assessment,jq->>'p','single_choice',jq->>'e',1,question_pos)
      returning id into v_question;

      option_pos:=0;
      for option_label in select value #>> '{}' from jsonb_array_elements(jq->'o') loop
        option_pos:=option_pos+1;
        insert into public.assessment_options(question_id,label,is_correct,position)
        values(v_question,option_label,option_pos=(jq->>'c')::int,option_pos);
      end loop;
    end loop;
  end if;

  update public.assessments set status='published',updated_at=now() where id=v_assessment;
end $m$;
