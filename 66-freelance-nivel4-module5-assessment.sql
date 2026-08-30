-- Compás Academy · Nivel 4 · Evaluación formativa Módulo 5
-- 12 reactivos; aprobación recomendada 80% (10/12). No emite certificación.

do $m$
declare q jsonb;
begin
  if to_regclass('public.academy_level4_question_bank') is null then raise exception 'Nivel 4 question bank is required'; end if;
  for q in select * from jsonb_array_elements($j$[
    {"n":1,"q":"¿Cuál es el propósito principal de PULSO?","o":{"A":"Prometer tiempos al cliente","B":"Hacer visible prioridad, responsabilidad y excepciones operativas","C":"Medir únicamente ventas","D":"Sustituir políticas de servicio"},"a":"B","r":"PULSO organiza el control interno; no crea garantías externas."},
    {"n":2,"q":"¿Qué diferencia clave existe entre un tiempo objetivo interno y una promesa al cliente?","o":{"A":"Ninguna","B":"El interno guía operación; comunicarlo como compromiso externo puede requerir política o autorización","C":"El interno siempre es más corto","D":"La promesa no debe documentarse"},"a":"B","r":"Un objetivo operativo no debe convertirse automáticamente en garantía comercial."},
    {"n":3,"q":"Una oportunidad está detenida porque dos áreas creen que la otra es responsable. ¿Qué debe aclararse primero?","o":{"A":"Quién tuvo la culpa","B":"Quién es responsable ahora y qué evidencia demuestra avance","C":"Cuántos mensajes se enviaron","D":"Qué descuento ofrecer"},"a":"B","r":"La continuidad requiere titular actual y evidencia de siguiente paso."},
    {"n":4,"q":"¿Qué elemento NO pertenece a PUENTE?","o":{"A":"Propósito del cliente","B":"Necesidad pendiente","C":"Titular que recibe","D":"Toda la historia personal del cliente"},"a":"D","r":"El handoff conserva contexto necesario y minimiza datos irrelevantes."},
    {"n":5,"q":"¿Cuándo cambia efectivamente la responsabilidad en un handoff?","o":{"A":"Al reenviar el mensaje","B":"Cuando el receptor acepta el caso según el proceso","C":"Cuando el cliente vuelve a explicar todo","D":"Al cerrar la tarea del emisor aunque nadie reciba"},"a":"B","r":"Transferencia sin aceptación puede producir abandono operativo."},
    {"n":6,"q":"¿Cuál es el mejor handoff de ventas a onboarding?","o":{"A":"Ya pagó, ayúdenlo","B":"Enviar capturas sin explicación","C":"Propósito, alcance confirmado, evidencia necesaria, pendiente, responsable y siguiente acción","D":"Pedir al cliente que vuelva a empezar"},"a":"C","r":"PUENTE conserva contexto y continuidad sin ruido innecesario."},
    {"n":7,"q":"Ante un incidente, ¿qué debe evitar el supervisor?","o":{"A":"Registrar hechos","B":"Contener impacto","C":"Prometer compensaciones fuera de su autoridad","D":"Definir siguiente actualización"},"a":"C","r":"Las soluciones extraordinarias deben seguir autoridad y política aplicable."},
    {"n":8,"q":"¿Cuál es el primer paso de RESTAURA?","o":{"A":"Registrar el hecho","B":"Buscar culpable","C":"Ofrecer reembolso","D":"Cerrar el caso"},"a":"A","r":"La respuesta comienza con hechos verificables, no con conclusiones prematuras."},
    {"n":9,"q":"¿Qué acción representa mejor una contención segura?","o":{"A":"Seguir haciendo cambios mientras se investiga","B":"Detener temporalmente la acción que puede ampliar el impacto cuando corresponde","C":"Borrar el historial","D":"Prometer que nunca volverá a pasar"},"a":"B","r":"Contener limita impacto mientras se confirma causa y solución."},
    {"n":10,"q":"¿Cuándo debe escalar un supervisor un incidente?","o":{"A":"Solo cuando el cliente insiste tres veces","B":"Cuando impacto o decisión exceden su autoridad o involucran áreas sujetas a controles específicos","C":"Nunca","D":"Siempre antes de registrar hechos"},"a":"B","r":"El escalamiento se basa en impacto, riesgo y autoridad, no en presión informal."},
    {"n":11,"q":"¿Qué convierte el cierre de un incidente en aprendizaje operativo?","o":{"A":"Eliminar el registro","B":"Una acción preventiva verificable basada en lo ocurrido","C":"Cambiar de agente","D":"Evitar hablar del caso"},"a":"B","r":"El cierre maduro incorpora prevención medible, no solo resolución inmediata."},
    {"n":12,"q":"¿Cuál práctica combina mejor calidad y privacidad?","o":{"A":"Copiar toda información disponible en cada handoff","B":"Compartir solo contexto necesario y registrar hechos pertinentes","C":"No documentar nada","D":"Usar chats personales para incidentes"},"a":"B","r":"La continuidad requiere evidencia suficiente sin replicar datos innecesarios."}
  ]$j$::jsonb) loop
    insert into public.academy_level4_question_bank(module_position,question_position,prompt,options,correct_option,rationale)
    values(5,(q->>'n')::int,q->>'q',q->'o',q->>'a',q->>'r')
    on conflict(module_position,question_position) do update set prompt=excluded.prompt,options=excluded.options,correct_option=excluded.correct_option,rationale=excluded.rationale;
  end loop;
end $m$;