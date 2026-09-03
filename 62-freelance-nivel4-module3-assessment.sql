-- Compás Academy · Nivel 4 · Evaluación formativa Módulo 3
-- 12 reactivos; aprobación recomendada 80% (10/12). No emite certificación.

do $m$
declare q jsonb;
begin
  if to_regclass('public.academy_level4_question_bank') is null then raise exception 'Nivel 4 question bank is required'; end if;
  for q in select * from jsonb_array_elements($j$[
    {"n":1,"q":"¿Qué debe hacer primero un supervisor cuando caen las ventas del equipo?","o":{"A":"Aumentar todas las metas","B":"Localizar la primera ruptura comprobable del embudo","C":"Mover oportunidades a negociación","D":"Repartir más leads a todos"},"a":"B","r":"La venta final es un resultado; la intervención comienza en la primera etapa donde el flujo se deteriora."},
    {"n":2,"q":"¿Qué significa FARO para leer el embudo?","o":{"A":"Flujo, Avance, Ritmo, Origen","B":"Forecast, Acción, Retorno, Objetivo","C":"Fuerza, Actividad, Resultado, Orden","D":"Fecha, Acuerdo, Riesgo, Oportunidad"},"a":"A","r":"FARO revisa volumen del flujo, conversión entre etapas, velocidad y origen/calidad."},
    {"n":3,"q":"Contactos y diagnósticos se mantienen, pero bajan las propuestas. ¿Dónde conviene investigar primero?","o":{"A":"En la prospección inicial","B":"En la transición de diagnóstico a propuesta","C":"En el número de empleados","D":"En el color del dashboard"},"a":"B","r":"La primera ruptura está después del diagnóstico y antes de la propuesta."},
    {"n":4,"q":"¿Cuál práctica distorsiona el análisis de KPIs?","o":{"A":"Comparar etapas equivalentes","B":"Registrar una hipótesis de siete días","C":"Mover oportunidades de etapa solo para mejorar el tablero","D":"Revisar tiempo promedio por etapa"},"a":"C","r":"El pipeline debe representar la realidad; maquillarlo destruye la calidad de decisión."},
    {"n":5,"q":"¿Qué problema intenta resolver el marco CARGA?","o":{"A":"Diseño gráfico de campañas","B":"Equilibrar compromisos, urgencia y capacidad real del equipo","C":"Crear descuentos","D":"Eliminar oportunidades antiguas sin revisión"},"a":"B","r":"CARGA evita saturación o capacidad ociosa al ordenar carga y prioridades."},
    {"n":6,"q":"Una agente tiene 42 oportunidades y 18 seguimientos vencidos. Antes de asignarle más leads, lo correcto es...","o":{"A":"Revisar y ordenar carga, próximos pasos y oportunidades válidas","B":"Duplicar su cartera","C":"Marcar todo como perdido","D":"Ocultar los seguimientos vencidos"},"a":"A","r":"La capacidad debe protegerse antes de añadir más trabajo."},
    {"n":7,"q":"¿Qué debe tener una prioridad semanal bien definida?","o":{"A":"Solo una frase motivacional","B":"Resultado esperado, actividad crítica y señal verificable de cierre","C":"Una meta sin responsable","D":"Solo el número de llamadas"},"a":"B","r":"Una prioridad útil conecta actividad con resultado y evidencia de terminación."},
    {"n":8,"q":"¿Qué principio debe respetarse al redistribuir oportunidades?","o":{"A":"Borrar el historial anterior","B":"Conservar origen, historial y responsable de la reasignación","C":"Cambiar la fuente para simplificar","D":"Repartir siempre en partes iguales"},"a":"B","r":"La trazabilidad es necesaria para entender operación, atribución y seguimiento."},
    {"n":9,"q":"¿Cuál es la diferencia principal entre pipeline y forecast?","o":{"A":"No existe diferencia","B":"El pipeline contiene oportunidades abiertas; el forecast estima resultados con evidencia y probabilidad","C":"El forecast siempre es mayor","D":"El pipeline solo contiene ventas ganadas"},"a":"B","r":"El forecast interpreta la probabilidad y el riesgo del pipeline, no suma todo indiscriminadamente."},
    {"n":10,"q":"¿Qué significa PRISMA?","o":{"A":"Probabilidad, Riesgo, Impacto, Siguiente paso, Momento, Acción","B":"Precio, Retención, Ingreso, Sistema, Meta, Automatización","C":"Proceso, Ritmo, Inventario, Seguimiento, Mercado, Anuncio","D":"Prioridad, Resultado, Información, Servicio, Método, Actividad"},"a":"A","r":"PRISMA estructura un forecast mediante evidencia, riesgo, valor, próximo paso, fecha y acción supervisora."},
    {"n":11,"q":"El equipo tiene $120,000 en pipeline, pero solo $35,000 con decisión y próximo paso fechado. ¿Qué es más responsable?","o":{"A":"Prometer $120,000","B":"Construir escenarios y explicar qué evidencia falta para mover oportunidades","C":"Eliminar las oportunidades inciertas","D":"Subir probabilidades hasta alcanzar la meta"},"a":"B","r":"Un forecast responsable expresa incertidumbre mediante escenarios sustentados."},
    {"n":12,"q":"¿Para qué debe usar principalmente el supervisor el forecast?","o":{"A":"Para presionar a convertir números inciertos en compromisos","B":"Para decidir coaching, desbloqueo, priorización o no intervención","C":"Para sustituir el CRM","D":"Para modificar ventas históricas"},"a":"B","r":"El forecast es una herramienta de decisión y asignación de atención, no una promesa comercial."}
  ]$j$::jsonb) loop
    insert into public.academy_level4_question_bank(module_position,question_position,prompt,options,correct_option,rationale)
    values(3,(q->>'n')::int,q->>'q',q->'o',q->>'a',q->>'r')
    on conflict(module_position,question_position) do update set prompt=excluded.prompt,options=excluded.options,correct_option=excluded.correct_option,rationale=excluded.rationale;
  end loop;
end $m$;

-- QA esperado acumulado Nivel 4: M1 12 + M2 12 + M3 12 = 36 preguntas / 144 opciones.
-- Criterio formativo por módulo: 80%, mínimo 10/12.
