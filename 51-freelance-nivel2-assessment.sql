-- Compás Academy · Evaluación final Nivel 2
-- El guard de contenido exige editar preguntas mientras la evaluación está en draft.

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
    {"p":"¿Cuál es el objetivo principal al elegir un mercado antes de prospectar?","o":["Contactar al mayor número posible de personas","Concentrarse en segmentos donde puedas reconocer necesidades y llegar a decisiones","Evitar registrar prospectos","Vender únicamente el plan más caro"],"c":2,"e":"La segmentación mejora relevancia y permite diagnosticar necesidades reales."},
    {"p":"¿Cuál es una señal positiva de cliente ideal para Compás?","o":["No desea cambiar ningún proceso","Busca una promesa de ventas garantizadas","Recibe prospectos pero no lleva seguimiento consistente","No tiene tiempo ni intención de implementar"],"c":3,"e":"La falta de seguimiento consistente es una necesidad que Compás puede ayudar a ordenar."},
    {"p":"¿Qué debe incluir como mínimo una lista de prospección operativa?","o":["Solo el nombre del negocio","Nombre, contacto, canal, necesidad observada y próximo paso","Contraseña de redes sociales","Datos bancarios del prospecto"],"c":2,"e":"Una oportunidad necesita información suficiente para dar seguimiento."},
    {"p":"Al pedir referidos, la mejor práctica es:","o":["Exigir que compren","Pedir una presentación a alguien con una necesidad relevante","Prometer un descuento no autorizado","Enviar el catálogo completo sin contexto"],"c":2,"e":"El referido debe abrir una conversación, no presionar una compra."},
    {"p":"En redes sociales, ¿qué debe ocurrir antes de ofrecer una revisión?","o":["Enviar precios inmediatamente","Hacer una observación real y preguntar si ese punto también genera dificultad","Criticar públicamente al negocio","Crear una cuenta falsa"],"c":2,"e":"La prospección personalizada parte de una observación verificable y una pregunta."},
    {"p":"¿Qué regla aplica a alianzas comerciales?","o":["Puedes inventar comisiones si ayudan a cerrar","Toda alianza debe respetar condiciones autorizadas de Compás","No hace falta registrar origen","Siempre debe ser exclusiva"],"c":2,"e":"No se prometen condiciones fuera del esquema autorizado."},
    {"p":"La fórmula C-O-P significa:","o":["Cliente, Oferta, Precio","Contexto, Observación, Pregunta","Costo, Operación, Pago","Conversión, Objetivo, Propuesta"],"c":2,"e":"C-O-P estructura un primer contacto breve y relevante."},
    {"p":"¿Cuál es el primer objetivo de un mensaje de apertura?","o":["Cerrar la venta","Obtener permiso para conversar","Enviar contrato","Cobrar implementación"],"c":2,"e":"El primer contacto busca abrir la conversación."},
    {"p":"Una observación útil debe ser:","o":["Específica, respetuosa y abierta a corrección","Alarmista y exagerada","Genérica para poder copiarse masivamente","Una acusación sobre pérdidas económicas"],"c":1,"e":"La observación crea relevancia sin asumir datos que no conoces."},
    {"p":"Si un prospecto pide no ser contactado, debes:","o":["Escribir todos los días","Cambiar de número","Detener la secuencia","Pasarlo a negociación"],"c":3,"e":"El respeto a la solicitud del prospecto es obligatorio."},
    {"p":"¿Qué busca descubrir un diagnóstico Compás?","o":["Solo cuánto dinero tiene el cliente","El proceso actual y el cuello de botella principal","Qué competidor odia","Su contraseña de WhatsApp"],"c":2,"e":"El diagnóstico entiende captación, seguimiento y operación antes de recomendar."},
    {"p":"¿Cuáles son las cuatro dimensiones de calificación presentadas en el curso?","o":["Dolor, urgencia, capacidad y decisión","Likes, seguidores, alcance y comentarios","Logo, color, dominio y correo","Precio, descuento, comisión y bono"],"c":1,"e":"Estas dimensiones ayudan a priorizar oportunidades reales."},
    {"p":"Si hay necesidad fuerte pero capacidad limitada, lo correcto es:","o":["Forzar el plan más alto","Evaluar una solución de entrada que resuelva lo esencial","Prometer financiamiento no autorizado","Cerrar la oportunidad automáticamente"],"c":2,"e":"Crece con Compás busca empezar con el nivel mínimo útil."},
    {"p":"¿Qué plan corresponde mejor a presencia, captación básica, WhatsApp y CRM esencial?","o":["Compás Inicio","Compás Negocio","Cotización especial obligatoria","Supervisor"],"c":1,"e":"Inicio es el nivel de entrada del catálogo vigente."},
    {"p":"¿Cuándo debes solicitar cotización personalizada?","o":["Siempre","Cuando el diagnóstico requiere desarrollo especial o alcance no estándar","Nunca","Solo cuando el cliente no responde"],"c":2,"e":"Los desarrollos e integraciones especiales no deben improvisarse con precios del catálogo."},
    {"p":"Antes de decir el precio, debes:","o":["Ocultar el alcance","Conectar la recomendación con el problema diagnosticado","Garantizar ventas","Comparar negativamente a todos los competidores"],"c":2,"e":"El precio se entiende mejor cuando la solución está conectada con una necesidad real."},
    {"p":"Si el prospecto dice “está caro”, una respuesta útil es:","o":["Discutir","Preguntar con qué lo está comparando o qué presupuesto tenía pensado","Inventar un descuento","Prometer retorno garantizado"],"c":2,"e":"La objeción debe explorarse antes de responder."},
    {"p":"Ante “lo voy a pensar”, conviene preguntar:","o":["¿Qué parte necesitas evaluar para tomar la decisión?","¿Por qué no compras ya?","¿Te puedo cobrar sin autorización?","¿Quieres que borre tu información?"],"c":1,"e":"La pregunta identifica la duda real detrás de la objeción."},
    {"p":"Si el prospecto ya usa otra herramienta, debes:","o":["Atacar al competidor","Preguntar qué funciona y qué falta para evaluar si Compás aporta valor","Decir que todo lo demás es malo","Prometer migración gratis"],"c":2,"e":"La recomendación debe basarse en brechas reales, no en descalificar."},
    {"p":"¿Qué debes responder si preguntan si Compás garantiza clientes?","o":["Sí, siempre","Solo si pagan anual","No; Compás ofrece herramientas y procesos, pero no garantiza ventas o leads","Sí, si lo dice el Freelance"],"c":3,"e":"Las ventas responsables no prometen resultados garantizados."},
    {"p":"Un cierre profesional busca:","o":["Presionar hasta obtener un sí","Convertir la conversación en una acción o decisión definida","Evitar hablar del alcance","Dejar todo sin fecha"],"c":2,"e":"Cerrar significa acordar un siguiente paso claro."},
    {"p":"Si el prospecto no está listo, debes:","o":["Eliminarlo siempre","Acordar una fecha concreta de seguimiento","Mandar mensajes cada hora","Marcarlo como ganado"],"c":2,"e":"Una fecha concreta mantiene el seguimiento ordenado."},
    {"p":"¿Cuándo se mueve una oportunidad de etapa?","o":["Cuando la realidad de la conversación cambia","Cada mañana automáticamente","Para que el dashboard se vea mejor","Cuando el Freelance quiera subir su conversión"],"c":1,"e":"El pipeline debe reflejar la situación real."},
    {"p":"¿Qué debe tener toda oportunidad abierta?","o":["Un próximo paso","Un descuento","Un contrato firmado","Una campaña pagada"],"c":1,"e":"Sin próximo paso no existe seguimiento operativo."}
  ]$q$::jsonb;
begin
  select c.id into v_course
  from public.courses c
  where c.slug='nivel-2-captacion-y-ventas-compas'
  limit 1;

  if v_course is null then
    raise exception 'Nivel 2 course is required';
  end if;

  select a.id into v_assessment
  from public.assessments a
  where a.course_id=v_course and a.title='Evaluación final · Nivel 2'
  limit 1;

  if v_assessment is null then
    insert into public.assessments(
      course_id,title,description,assessment_type,passing_score,status,position
    ) values(
      v_course,
      'Evaluación final · Nivel 2',
      'Evalúa captación, primer contacto, diagnóstico, propuesta, objeciones, cierre y seguimiento. Requiere 80%.',
      'quiz',80,'draft',1
    ) returning id into v_assessment;
  else
    update public.assessments
    set status='draft',
        passing_score=80,
        description='Evalúa captación, primer contacto, diagnóstico, propuesta, objeciones, cierre y seguimiento. Requiere 80%.',
        updated_at=now()
    where id=v_assessment;
  end if;

  if not exists(
    select 1 from public.assessment_questions q where q.assessment_id=v_assessment
  ) then
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
