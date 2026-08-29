-- Compás Academy · Evaluación final Nivel 3
-- 24 preguntas, opción única, aprobación mínima 80%.

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
    {"p":"¿Cuándo comienza realmente la permanencia del cliente?","o":["Cuando solicita cancelar","Después del sexto pago","Desde el cierre, cuando se fijan expectativas y siguiente paso","Solo cuando recibe soporte"],"c":3,"e":"La permanencia empieza con expectativas correctas desde el cierre."},
    {"p":"¿Qué debe contener un handoff comercial útil?","o":["Solo el plan comprado","Necesidad, alcance, responsables, decisiones y restricciones relevantes","Las contraseñas del cliente","Una lista de competidores"],"c":2,"e":"El handoff conserva el contexto necesario para implementar sin hacer repetir toda la historia."},
    {"p":"Un buen objetivo para los primeros 30 días es:","o":["Garantizar aumento de ventas","Activar el problema prioritario y lograr adopción observable","Vender todos los add-ons","Cambiar de plan cada semana"],"c":2,"e":"Los primeros días deben concentrarse en adopción y progreso operativo controlable."},
    {"p":"¿Cuál cliente puede estar en mayor riesgo aunque pague puntualmente?","o":["El que usa el sistema y pide mejoras","El que no utiliza el sistema ni participa en revisiones","El que refiere a otros clientes","El que documenta procesos"],"c":2,"e":"Baja adopción puede anticipar cancelación aunque el pago todavía esté al día."},
    {"p":"El semáforo de cartera sirve para:","o":["Manipular comisiones","Clasificar salud, riesgo y necesidad de intervención","Ocultar clientes problemáticos","Reemplazar el CRM"],"c":2,"e":"La clasificación ayuda a priorizar acciones sobre la cartera."},
    {"p":"¿Qué seguimiento postventa aporta más valor?","o":["¿Todo bien?","Revisar un objetivo concreto, uso y fricción actual","Enviar promociones diarias","Pedir un referido en cada mensaje"],"c":2,"e":"El seguimiento útil revisa evidencia y próximos pasos."},
    {"p":"Una señal temprana de riesgo es:","o":["Uso estable y objetivos claros","Baja actividad y pendientes repetidos","Pago renovado y buena adopción","Referidos recientes"],"c":2,"e":"La caída de actividad y pendientes repetidos son señales que deben investigarse."},
    {"p":"¿Qué tipo de valor es responsable documentar?","o":["Ventas garantizadas","Mejoras operativas medibles como seguimiento, adopción o tiempos de respuesta","Ingresos atribuidos sin evidencia","Resultados de competidores"],"c":2,"e":"Compás puede documentar cambios operativos verificables sin prometer resultados comerciales garantizados."},
    {"p":"Una revisión de valor debe comenzar por:","o":["Vender un upgrade","Recordar el objetivo original y revisar evidencia actual","Solicitar un testimonio","Mostrar el plan más caro"],"c":2,"e":"Primero se confirma valor, fricción y objetivos; después se explora crecimiento."},
    {"p":"¿Cuándo conviene iniciar una conversación de renovación?","o":["Únicamente el día del cobro","Con anticipación suficiente para revisar valor, dudas y necesidades futuras","Después de cancelar","Nunca"],"c":2,"e":"La anticipación reduce fricción y permite una decisión informada."},
    {"p":"¿Cuál es una señal válida para subir de plan?","o":["El Freelance quiere más comisión","El cliente ya usa el alcance actual y aparece una necesidad que el nivel superior resuelve","El cliente no ha utilizado el plan actual","El plan superior está en promoción no autorizada"],"c":2,"e":"El upgrade se justifica por necesidad y adopción, no por interés del vendedor."},
    {"p":"Si un cliente todavía no utiliza el CRM básico, antes de recomendar un plan superior conviene:","o":["Duplicar el precio","Mejorar adopción y entender la barrera","Cancelar la cuenta","Agregar IA automáticamente"],"c":2,"e":"Subir complejidad sin adopción previa puede empeorar la experiencia."},
    {"p":"Un add-on debe ofrecerse cuando:","o":["Suena moderno","Resuelve una brecha confirmada y existe una forma de utilizarlo","Aumenta la comisión","El cliente no sabe qué incluye"],"c":2,"e":"Los add-ons deben tener propósito y uso esperado."},
    {"p":"¿Cuándo se debe solicitar cotización personalizada?","o":["Para toda venta","Cuando el alcance requiere desarrollo o integración fuera del estándar","Nunca","Solo después de una cancelación"],"c":2,"e":"El trabajo especial debe evaluarse sin improvisar precio o viabilidad."},
    {"p":"Ante una integración especial, el Freelance debe:","o":["Prometer precio y fecha","Documentar necesidad y escalar para evaluación","Asegurar que está incluida en Negocio","Cobrar por su cuenta"],"c":2,"e":"La evaluación técnica/comercial debe ocurrir antes de comprometer alcance."},
    {"p":"El mejor momento para pedir un referido suele ser:","o":["Antes de entregar cualquier valor","Después de un hito que el cliente reconoce como útil","Durante una inconformidad","Solo al cancelar"],"c":2,"e":"Un hito de valor facilita una presentación auténtica."},
    {"p":"Un testimonio responsable debe:","o":["Exagerar resultados","Contar experiencia real con consentimiento de uso","Inventar cifras","Omitir autorización"],"c":2,"e":"La evidencia social debe ser verificable y autorizada."},
    {"p":"Si una implementación se retrasó, lo correcto es:","o":["Ocultarlo","Reconocer lo verificable, documentar y acordar corrección dentro de autoridad","Culpar al cliente","Prometer una bonificación no autorizada"],"c":2,"e":"La recuperación de confianza exige claridad y acciones autorizadas."},
    {"p":"¿Qué debe ocurrir si una inconformidad excede la autoridad del Freelance?","o":["Improvisar una solución económica","Escalarla a administración con contexto documentado","Ignorarla","Cerrar el cliente como perdido sin avisar"],"c":2,"e":"Las decisiones fuera de autoridad deben escalarse."},
    {"p":"¿Por qué no basta medir solo ventas nuevas?","o":["Porque las ventas no importan","Porque alta cancelación puede neutralizar el crecimiento y deteriorar la cartera","Porque no existe recurrencia","Porque todos los clientes son iguales"],"c":2,"e":"El crecimiento sostenible combina adquisición y permanencia."},
    {"p":"¿Qué refleja mejor una cartera saludable?","o":["Muchos clientes nuevos y muchas cancelaciones","Clientes activos, recurrentes, con riesgos atendidos y renovaciones","Solo oportunidades abiertas","Solo seguidores en redes"],"c":2,"e":"La salud combina permanencia, recurrencia y control de riesgo."},
    {"p":"La comisión recurrente debe incentivar principalmente:","o":["Mantener cualquier plan aunque no convenga","Acompañar una cartera sana dentro de las reglas vigentes","Ocultar cancelaciones","Prometer resultados"],"c":2,"e":"La recurrencia debe ser consecuencia de relaciones sostenibles y pagos elegibles."},
    {"p":"Si un cliente realmente necesita bajar de plan, la conducta correcta es:","o":["Impedirlo para proteger comisión","Recomendar el ajuste adecuado y proteger confianza","Añadir un cargo no autorizado","Dejar de responder"],"c":2,"e":"El interés del cliente y el ajuste correcto del alcance tienen prioridad."},
    {"p":"Una revisión semanal de cartera debe terminar con:","o":["Solo una gráfica","Acciones, responsables y fechas priorizadas","Más funciones activadas automáticamente","Mensajes masivos a todos los clientes"],"c":2,"e":"La lectura de datos debe convertirse en intervención concreta."}
  ]$q$::jsonb;
begin
  select id into v_course
  from public.courses
  where slug='nivel-3-cartera-permanencia-crecimiento-compas'
  limit 1;

  if v_course is null then
    raise exception 'Nivel 3 course is required';
  end if;

  select id into v_assessment
  from public.assessments
  where course_id=v_course and title='Evaluación final · Nivel 3'
  limit 1;

  if v_assessment is null then
    insert into public.assessments(
      course_id,title,description,assessment_type,passing_score,status,position
    ) values(
      v_course,
      'Evaluación final · Nivel 3',
      'Evalúa activación, cartera, permanencia, renovación, crecimiento responsable, referidos, recuperación y KPIs. Requiere 80%.',
      'quiz',80,'draft',1
    ) returning id into v_assessment;
  else
    update public.assessments
    set status='draft',
        passing_score=80,
        description='Evalúa activación, cartera, permanencia, renovación, crecimiento responsable, referidos, recuperación y KPIs. Requiere 80%.',
        updated_at=now()
    where id=v_assessment;
  end if;

  if not exists(select 1 from public.assessment_questions where assessment_id=v_assessment) then
    for jq in select value from jsonb_array_elements(questions) loop
      question_pos:=question_pos+1;
      insert into public.assessment_questions(
        assessment_id,prompt,question_type,explanation,points,position
      ) values(
        v_assessment,jq->>'p','single_choice',jq->>'e',1,question_pos
      ) returning id into v_question;

      option_pos:=0;
      for option_label in select value #>> '{}' from jsonb_array_elements(jq->'o') loop
        option_pos:=option_pos+1;
        insert into public.assessment_options(question_id,label,is_correct,position)
        values(v_question,option_label,option_pos=(jq->>'c')::int,option_pos);
      end loop;
    end loop;
  end if;

  update public.assessments
  set status='published',updated_at=now()
  where id=v_assessment;
end $m$;
