-- Compás Academy · Nivel 4 · Evaluación formativa Módulo 2
-- 12 reactivos; aprobación recomendada 80% (10/12). No emite certificación.

do $m$
declare q jsonb;
begin
  if to_regclass('public.academy_level4_question_bank') is null then raise exception 'Nivel 4 question bank is required'; end if;
  for q in select * from jsonb_array_elements($j$[
    {"n":1,"q":"Un KPI bajo debe interpretarse primero como...","o":{"A":"prueba de falta de compromiso","B":"una señal que requiere diagnóstico","C":"motivo automático de sanción","D":"razón para aumentar todas las metas"},"a":"B","r":"El KPI muestra dónde mirar; no demuestra por sí solo la causa."},
    {"n":2,"q":"¿Qué significa DATO en el diagnóstico de desempeño?","o":{"A":"Definir, Abrir evidencia, Trazar hipótesis, Ordenar prueba","B":"Delegar, Acelerar, Terminar, Operar","C":"Diagnosticar, Autorizar, Transferir, Omitir","D":"Datos, Actividad, Tiempo, Objetivo"},"a":"A","r":"DATO convierte un resultado observado en una hipótesis comprobable."},
    {"n":3,"q":"Una agente tiene volumen suficiente pero pocas conversaciones llegan a diagnóstico. ¿Qué intervención es más razonable primero?","o":{"A":"Pedir el doble de contactos","B":"Revisar aperturas y habilidad de conversación","C":"Cambiar todas sus oportunidades a negociación","D":"Asignarle ventas ganadas"},"a":"B","r":"La caída está entre contacto y diagnóstico; primero se estudia esa etapa."},
    {"n":4,"q":"¿Por qué conviene probar una hipótesis principal por ciclo corto?","o":{"A":"Para evitar medir","B":"Para saber mejor qué cambio produjo la mejora o no","C":"Para eliminar el coaching","D":"Para ocultar otros datos"},"a":"B","r":"Cambiar muchas variables simultáneamente dificulta aprender de la evidencia."},
    {"n":5,"q":"¿Cuál es el propósito principal de un 1:1 de coaching?","o":{"A":"Repetir toda la revisión de pipeline","B":"Desarrollar criterio y una habilidad observable","C":"Comparar públicamente agentes","D":"Autorizar descuentos"},"a":"B","r":"El 1:1 se centra en aprendizaje y desarrollo, no en duplicar reuniones operativas."},
    {"n":6,"q":"¿Qué secuencia corresponde a CRECE?","o":{"A":"Contexto, Revisar, Escuchar, Construir, Ejecutar, Establecer seguimiento","B":"Cobrar, Renovar, Escalar, Cerrar, Eliminar","C":"Calificar, Registrar, Enviar, Cobrar, Esperar","D":"Controlar, Regañar, Exigir, Castigar, Evaluar"},"a":"A","r":"CRECE estructura el 1:1 desde contexto hasta práctica y seguimiento."},
    {"n":7,"q":"Un agente pierde propuestas porque no acuerda fecha de decisión. ¿Cuál es una práctica verificable?","o":{"A":"Decirle que sea más proactivo","B":"Usar una frase de cierre en cinco oportunidades y medir próximos pasos fechados","C":"Enviar más motivación","D":"Mover propuestas a ganado"},"a":"B","r":"La práctica define conducta, muestra y evidencia observable."},
    {"n":8,"q":"El feedback de calidad debe enfocarse principalmente en...","o":{"A":"rasgos personales","B":"conducta observable y su efecto","C":"rumores del equipo","D":"comparaciones con la vida personal"},"a":"B","r":"El feedback profesional evita etiquetas y trabaja con evidencia observable."},
    {"n":9,"q":"¿Qué significa VELO?","o":{"A":"Ver evidencia, Explicar impacto, Lanzar alternativa, Observar ejecución","B":"Vender, Escalar, Lograr, Operar","C":"Valorar, Esperar, Limitar, Ordenar","D":"Verificar, Eliminar, Liberar, Omitir"},"a":"A","r":"VELO convierte evidencia en alternativa practicada y observada."},
    {"n":10,"q":"¿Cuándo tiene sentido formalizar un PACTO de mejora?","o":{"A":"Ante cualquier error aislado","B":"Cuando una brecha persiste después de claridad, práctica y seguimiento proporcional","C":"Antes de enseñar el estándar","D":"Para sustituir toda conversación 1:1"},"a":"B","r":"El plan formal es proporcional a una brecha persistente, no la primera reacción."},
    {"n":11,"q":"¿Qué debe incluir un PACTO?","o":{"A":"Problema observable, Acción, Coaching, Tiempo, criterio verificable","B":"Opiniones personales y castigos","C":"Solo una fecha final","D":"Una meta sin soporte"},"a":"A","r":"El plan define brecha, conducta, soporte, plazo y criterio de revisión."},
    {"n":12,"q":"Al documentar coaching en Compás One, ¿qué práctica es correcta?","o":{"A":"Copiar datos sensibles innecesarios del cliente","B":"Registrar habilidad, compromiso, fecha y evidencia esperada con privacidad","C":"Modificar etapas para mejorar KPIs","D":"Escribir etiquetas personales sobre el agente"},"a":"B","r":"La documentación debe ser operativa, verificable y respetar privacidad."}
  ]$j$::jsonb) loop
    insert into public.academy_level4_question_bank(module_position,question_position,prompt,options,correct_option,rationale)
    values(2,(q->>'n')::int,q->>'q',q->'o',q->>'a',q->>'r')
    on conflict(module_position,question_position) do update set prompt=excluded.prompt,options=excluded.options,correct_option=excluded.correct_option,rationale=excluded.rationale;
  end loop;
end $m$;

-- QA esperado acumulado Nivel 4: M1 12 + M2 12 = 24 preguntas / 96 opciones.
-- Criterio formativo por módulo: 80%, mínimo 10/12.
