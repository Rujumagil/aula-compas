-- Compás Academy · Nivel 3 · Cartera, Permanencia y Crecimiento
-- Curso en borrador con 6 módulos y 18 lecciones aplicadas.

do $m$
declare
  v_course uuid;
  v_workspace uuid;
  v_module uuid;
  jm jsonb;
  jl jsonb;
  curriculum jsonb := $c$
  [
    {"p":1,"t":"1. De la venta a una buena activación","d":"Aprende a proteger la confianza después del cierre y a convertir expectativas comerciales en un inicio ordenado.","l":[
      {"p":1,"t":"El cierre no termina la relación","d":"Distingue venta, activación y adopción para que el cliente sepa qué ocurrirá después de pagar.","m":22,"core":"La permanencia empieza en el momento del cierre. Una venta con expectativas infladas genera fricción aunque la implementación sea correcta.","method":"Resume problema, alcance contratado, límites, responsables y próximo hito. Entrega contexto al equipo que continuará la implementación.","case":"Un cliente compra Impulso esperando campañas administradas diariamente. Si el alcance real es CRM, agenda y automatización básica, esa diferencia debe aclararse antes de activar.","practice":"Crea un resumen de handoff para una venta real o simulada con cinco datos indispensables."},
      {"p":2,"t":"Handoff comercial sin pérdida de contexto","d":"Entrega al equipo operativo la información que necesita sin hacer que el cliente repita toda su historia.","m":24,"core":"El handoff conecta lo prometido con lo que se implementará. Debe conservar la necesidad original, decisiones y condiciones especiales autorizadas.","method":"Registra objetivo, situación actual, plan contratado, decisores, fechas, restricciones y cualquier alcance personalizado aprobado.","case":"Si durante el diagnóstico el cliente explicó que pierde citas fuera de horario, esa razón debe acompañar el handoff; no basta con registrar ‘compró Compás Impulso’.","practice":"Audita un expediente comercial y detecta qué información faltaría para iniciar sin volver a entrevistar al cliente."},
      {"p":3,"t":"Los primeros 30 días del cliente","d":"Define una ruta de adopción temprana con hitos simples y expectativas observables.","m":26,"core":"El cliente necesita experimentar progreso temprano, no una lista infinita de funciones. Los primeros 30 días deben concentrarse en el problema prioritario.","method":"Establece semana 1 acceso y configuración, semana 2 uso básico, semana 3 seguimiento de adopción y semana 4 revisión de resultados operativos.","case":"Para un negocio que perdía leads, un primer éxito puede ser que todos los contactos entren al CRM y tengan próximo paso, no aumentar ventas de inmediato.","practice":"Diseña un plan 30 días para Inicio, Impulso o Crece con un hito por semana."}
    ]},
    {"p":2,"t":"2. Gestiona una cartera saludable","d":"Organiza clientes por estado, riesgo y oportunidad para dar seguimiento sin depender de la memoria.","l":[
      {"p":1,"t":"Segmenta tu cartera por salud","d":"Clasifica clientes por adopción, satisfacción, riesgo y potencial de crecimiento.","m":24,"core":"No todos los clientes necesitan la misma atención. Una cartera sana distingue clientes estables, en adopción, en riesgo y con oportunidad de crecimiento.","method":"Usa un semáforo: verde si usa y recibe valor, amarillo si hay baja adopción o pendientes, rojo si existe riesgo explícito de cancelación.","case":"Un cliente que paga puntualmente pero no usa el sistema puede estar más en riesgo que uno que solicita mejoras y participa activamente.","practice":"Clasifica diez clientes o casos simulados y explica una acción para cada color."},
      {"p":2,"t":"Ritmo de seguimiento postventa","d":"Construye contactos útiles que revisen adopción y próximos pasos sin convertirse en mensajes invasivos.","m":22,"core":"El seguimiento postventa debe tener propósito. Preguntar ‘¿todo bien?’ rara vez descubre fricción; revisar un objetivo concreto sí.","method":"Define revisiones según etapa: activación frecuente, estabilización quincenal y cartera madura mensual o según necesidad.","case":"En vez de preguntar si le gusta el CRM, revisa cuántos contactos tienen próximo paso y qué parte del flujo no está usando el equipo.","practice":"Diseña tres preguntas para una revisión de adopción de 15 minutos."},
      {"p":3,"t":"Detecta riesgo antes de una cancelación","d":"Reconoce señales tempranas de abandono y activa una conversación de recuperación.","m":26,"core":"La cancelación suele estar precedida por señales: baja actividad, pendientes repetidos, falta de responsable, expectativa incumplida o silencio prolongado.","method":"Busca evidencia antes de asumir. Confirma qué cambió, identifica la barrera controlable y acuerda una acción corta de recuperación.","case":"Si el equipo dejó de registrar leads porque nadie fue responsable, el problema puede ser de adopción, no del producto. La acción es reasignar operación y acompañar el hábito.","practice":"Construye una lista de cinco señales de riesgo y la pregunta que usarías para investigar cada una."}
    ]},
    {"p":3,"t":"3. Demuestra valor y construye permanencia","d":"Aprende a documentar progreso operativo y preparar conversaciones de continuidad basadas en evidencia.","l":[
      {"p":1,"t":"Valor operativo antes que promesas","d":"Mide mejoras que sí dependen del sistema: organización, velocidad, seguimiento, adopción y visibilidad.","m":24,"core":"Compás no garantiza ventas. Sí puede ayudar a crear procesos más ordenados y medibles. La permanencia se fortalece cuando el cliente reconoce esas mejoras.","method":"Compara antes/después en métricas controlables: contactos registrados, oportunidades con siguiente paso, tareas vencidas, tiempos de respuesta o uso de automatizaciones.","case":"Pasar de conversaciones dispersas a un pipeline con 90% de oportunidades con próximo paso es un resultado operativo válido aunque las ventas dependan de más factores.","practice":"Elige cuatro métricas operativas para documentar valor en un cliente."},
      {"p":2,"t":"Revisión de valor con el cliente","d":"Conduce una conversación periódica que conecte objetivos, uso, resultados operativos y siguiente etapa.","m":25,"core":"Una revisión de valor no es una sesión para vender más. Primero confirma qué funciona, qué no y qué debe corregirse.","method":"Usa cuatro bloques: objetivo original, evidencia actual, fricciones y próximos 30 días. Solo después explora necesidades nuevas.","case":"Si el cliente ya centralizó leads pero sigue perdiendo seguimiento por tareas vencidas, la prioridad puede ser mejorar disciplina antes de agregar módulos.","practice":"Prepara una agenda de revisión de valor de 20 minutos para un cliente con tres meses de uso."},
      {"p":3,"t":"Renovación como decisión informada","d":"Prepara renovaciones sin presión y con claridad sobre continuidad, cambios y alcance.","m":24,"core":"Una renovación sana ocurre cuando el cliente entiende qué continúa, qué valor ha recibido y qué necesita para el siguiente periodo.","method":"Inicia la conversación con anticipación, presenta uso y avances, confirma necesidades futuras y comunica cualquier cambio autorizado de precio o alcance.","case":"Esperar al día del cobro para hablar de renovación aumenta fricción. Una revisión previa permite resolver dudas y ajustar el plan si la necesidad cambió.","practice":"Redacta una secuencia de renovación de tres momentos: preparación, conversación y confirmación."}
    ]},
    {"p":4,"t":"4. Crece con el cliente sin sobredimensionar","d":"Identifica señales reales para upgrades, add-ons y alcance especial conservando la filosofía Crece con Compás.","l":[
      {"p":1,"t":"Señales para subir de plan","d":"Diferencia crecimiento real de una oportunidad de venta forzada.","m":24,"core":"Un upgrade se justifica cuando el cliente ya usa el alcance actual y aparece una necesidad que el nivel superior resuelve de forma concreta.","method":"Busca capacidad agotada, nuevos procesos, más usuarios, automatización adicional o necesidad de reportes/operación que no caben en el plan actual.","case":"Un cliente Inicio que ya tiene flujo estable y necesita agenda, tareas y pipeline puede tener señal de Impulso. Si todavía no usa el CRM básico, quizá no es el momento.","practice":"Analiza seis situaciones y decide: mantener plan, mejorar adopción o recomendar upgrade."},
      {"p":2,"t":"Add-ons con propósito","d":"Ofrece IA, Academy, automatización, landing o workspace adicional solo cuando resuelven una necesidad confirmada.","m":23,"core":"Un add-on debe cerrar una brecha específica. Agregar herramientas por catálogo aumenta costo y complejidad sin garantizar valor.","method":"Formula la necesidad en una frase, explica qué cambia con el add-on y define cómo se sabrá si se está utilizando.","case":"IA básica tiene sentido si existe volumen de consultas repetitivas y un proceso claro; no debe venderse solo porque ‘suena moderno’.","practice":"Relaciona cada add-on vigente con dos señales válidas y una señal donde no sería recomendable."},
      {"p":3,"t":"Cuándo pasar a cotización personalizada","d":"Reconoce límites del catálogo estándar y escala solicitudes especiales sin improvisar precio o alcance.","m":22,"core":"Integraciones especiales, desarrollo a medida, ecommerce complejo o contenido fuera del estándar requieren evaluación administrativa.","method":"Documenta necesidad, resultado esperado, sistemas implicados, urgencia y restricciones. No prometas fecha, precio ni viabilidad antes de la revisión técnica/comercial.","case":"Un cliente pide integrar un ERP propietario. Aunque use Compás Negocio, el trabajo no debe incluirse automáticamente en la mensualidad.","practice":"Redacta un brief de escalamiento para una solicitud personalizada."}
    ]},
    {"p":5,"t":"5. Referidos, reputación y recuperación","d":"Convierte una buena experiencia en reputación y aprende a responder cuando la relación se deteriora.","l":[
      {"p":1,"t":"El momento correcto para pedir un referido","d":"Solicita presentaciones después de un hito de valor, sin convertir satisfacción en obligación.","m":21,"core":"Los mejores referidos aparecen cuando el cliente puede explicar qué mejoró. La solicitud debe ser específica y fácil de rechazar.","method":"Menciona el avance logrado, describe el tipo de negocio al que podrías ayudar y pide una presentación solo si alguien viene a la mente.","case":"Después de ordenar el seguimiento de una clínica, puedes preguntar si conoce otro negocio que reciba consultas y pierda continuidad.","practice":"Escribe dos solicitudes de referido basadas en un resultado operativo, no en un descuento."},
      {"p":2,"t":"Testimonios responsables","d":"Obtén evidencia social con consentimiento y sin exagerar resultados.","m":22,"core":"Un testimonio debe reflejar la experiencia real del cliente. No se editan afirmaciones para convertir organización operativa en promesas de ingresos.","method":"Pide permiso de uso, confirma nombre/marca autorizada y formula preguntas sobre situación anterior, cambio observado y experiencia.","case":"‘Ahora sabemos a quién dar seguimiento’ es más defendible que atribuir todas las ventas del mes a Compás sin evidencia.","practice":"Diseña cinco preguntas para obtener un testimonio breve y verificable."},
      {"p":3,"t":"Recuperar confianza cuando algo sale mal","d":"Gestiona una inconformidad sin ocultar errores, culpar al cliente o prometer compensaciones no autorizadas.","m":27,"core":"La recuperación empieza por entender el hecho, reconocer lo verificable y definir una solución dentro del alcance y autoridad disponible.","method":"Escucha, documenta, separa expectativa de incumplimiento real, escala cuando corresponde y acuerda una acción con fecha.","case":"Si una automatización no se configuró en la fecha prometida, reconoce el atraso y escala un plan de corrección. No inventes una bonificación para cerrar la conversación.","practice":"Resuelve tres escenarios de inconformidad y define cuándo debe intervenir administración."}
    ]},
    {"p":6,"t":"6. Métricas de cartera y crecimiento sostenible","d":"Lee recurrencia, retención, riesgo y expansión para decidir dónde actuar cada semana.","l":[
      {"p":1,"t":"KPIs de una cartera saludable","d":"Distingue clientes activos, recurrentes, en riesgo, renovados y expandidos.","m":26,"core":"El crecimiento sostenible no se mide solo por nuevas ventas. Una cartera que cancela rápido obliga a reemplazar constantemente lo perdido.","method":"Revisa clientes pagados, segundo pago, retención reciente, renovaciones, upgrades y riesgos abiertos. Interpreta tendencia, no un dato aislado.","case":"Diez ventas nuevas con seis cancelaciones tempranas pueden ser menos saludables que cinco ventas nuevas con alta permanencia.","practice":"Construye un tablero semanal de seis métricas de cartera y define qué pregunta responde cada una."},
      {"p":2,"t":"Comisiones recurrentes y conducta correcta","d":"Entiende por qué la recurrencia incentiva acompañamiento, sin convertir soporte en presión comercial.","m":22,"core":"La comisión recurrente reconoce cartera saludable según las reglas vigentes; nunca justifica manipular al cliente para mantener un plan que ya no necesita.","method":"Prioriza satisfacción, uso y ajuste correcto del alcance. La comisión es consecuencia de una relación sostenible y pagos elegibles confirmados.","case":"Si un cliente debe bajar de plan porque cambió su operación, recomendarlo puede reducir ingreso inmediato pero protege confianza y permanencia futura.","practice":"Analiza cuatro decisiones donde interés del cliente y comisión podrían parecer en tensión y elige la conducta correcta."},
      {"p":3,"t":"Tu revisión semanal de cartera","d":"Convierte datos de clientes en un plan de acción con prioridades concretas.","m":28,"core":"Una revisión semanal debe terminar con acciones, responsables y fechas. Ver números sin intervenir no mejora la cartera.","method":"Revisa en orden: riesgos rojos, activaciones incompletas, renovaciones próximas, oportunidades de valor y referidos. Limita las prioridades críticas de la semana.","case":"Si existen dos clientes en riesgo y tres posibles upgrades, primero protege las relaciones en riesgo antes de ampliar la cartera.","practice":"Crea tu agenda de revisión de viernes: métricas, preguntas, decisiones y cinco acciones máximas para la siguiente semana."}
    ]}
  ]$c$::jsonb;
begin
  select c.workspace_id into v_workspace
  from public.courses c
  where c.slug='nivel-2-captacion-y-ventas-compas'
  limit 1;

  if v_workspace is null then
    raise exception 'Nivel 2 course is required';
  end if;

  select c.id into v_course
  from public.courses c
  where c.slug='nivel-3-cartera-permanencia-crecimiento-compas'
  limit 1;

  if v_course is null then
    insert into public.courses(
      title,slug,subtitle,description,category,status,featured,instructor_name,duration_label,workspace_id
    ) values(
      'Nivel 3 · Cartera, Permanencia y Crecimiento',
      'nivel-3-cartera-permanencia-crecimiento-compas',
      'De la primera venta a una cartera saludable',
      'Ruta aplicada para acompañar activación, adopción, permanencia, renovaciones, crecimiento responsable, referidos y métricas de cartera.',
      'Freelance Comercial',
      'draft',
      false,
      'Equipo Compás Evolution',
      '7–8 h',
      v_workspace
    ) returning id into v_course;
  else
    update public.courses
    set title='Nivel 3 · Cartera, Permanencia y Crecimiento',
        subtitle='De la primera venta a una cartera saludable',
        description='Ruta aplicada para acompañar activación, adopción, permanencia, renovaciones, crecimiento responsable, referidos y métricas de cartera.',
        category='Freelance Comercial',
        instructor_name='Equipo Compás Evolution',
        duration_label='7–8 h',
        workspace_id=v_workspace,
        updated_at=now()
    where id=v_course;
  end if;

  if exists(select 1 from public.courses where id=v_course and status<>'draft') then
    raise exception 'Nivel 3 must remain draft during curriculum preparation';
  end if;

  for jm in select value from jsonb_array_elements(curriculum) loop
    v_module:=null;
    select id into v_module
    from public.modules
    where course_id=v_course and position=(jm->>'p')::int
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
      if exists(select 1 from public.lessons where module_id=v_module and position=(jl->>'p')::int) then
        update public.lessons l
        set title=jl->>'t',
            description=jl->>'d',
            lesson_type='text',
            content_html='<h2>'||(jl->>'t')||'</h2>'||
              '<p><strong>Objetivo:</strong> '||(jl->>'d')||'</p>'||
              '<h3>Idea central</h3><p>'||(jl->>'core')||'</p>'||
              '<h3>Método de trabajo</h3><p>'||(jl->>'method')||'</p>'||
              '<h3>Caso práctico</h3><p>'||(jl->>'case')||'</p>'||
              '<h3>Ejercicio aplicado</h3><p>'||(jl->>'practice')||'</p>'||
              '<blockquote>Crecer con Compás significa proteger el valor del cliente antes de buscar ampliar la venta.</blockquote>',
            duration_minutes=(jl->>'m')::int,
            is_preview=false,
            updated_at=now()
        where l.module_id=v_module and l.position=(jl->>'p')::int;
      else
        insert into public.lessons(
          module_id,title,description,lesson_type,content_html,duration_minutes,position,is_preview
        ) values(
          v_module,jl->>'t',jl->>'d','text',
          '<h2>'||(jl->>'t')||'</h2>'||
          '<p><strong>Objetivo:</strong> '||(jl->>'d')||'</p>'||
          '<h3>Idea central</h3><p>'||(jl->>'core')||'</p>'||
          '<h3>Método de trabajo</h3><p>'||(jl->>'method')||'</p>'||
          '<h3>Caso práctico</h3><p>'||(jl->>'case')||'</p>'||
          '<h3>Ejercicio aplicado</h3><p>'||(jl->>'practice')||'</p>'||
          '<blockquote>Crecer con Compás significa proteger el valor del cliente antes de buscar ampliar la venta.</blockquote>',
          (jl->>'m')::int,(jl->>'p')::int,false
        );
      end if;
    end loop;
  end loop;
end $m$;
