-- Evaluación formativa Nivel 4 · Módulo 4. 12 reactivos, 80% recomendado (10/12).
-- Banco interno protegido; no crea intentos/resultados.
create table if not exists public.academy_level4_module4_questions (
 id bigserial primary key, position int not null unique, question text not null,
 options jsonb not null check(jsonb_typeof(options)='array' and jsonb_array_length(options)=4),
 correct_index int not null check(correct_index between 0 and 3), explanation text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.academy_level4_module4_questions enable row level security;
revoke all on public.academy_level4_module4_questions from anon, authenticated;
insert into public.academy_level4_module4_questions(position,question,options,correct_index,explanation) values
(1,'¿Qué debe hacer un supervisor antes de concluir que existe un problema de actitud?','["Revisar estándar, evidencia, contexto e impacto","Preguntar al resto del equipo","Reducir inmediatamente la cartera","Emitir una advertencia automática"]',0,'HECHO exige partir de evidencia observable y contexto, no de etiquetas.'),
(2,'Un solo seguimiento vencido debería interpretarse primero como:','["Prueba definitiva de bajo desempeño","Un dato que abre una pregunta y requiere contexto","Motivo de escalamiento formal","Razón para reasignar al cliente"]',1,'Un evento aislado no basta para inferir un patrón.'),
(3,'En HECHO, la H representa:','["Hipótesis del supervisor","Hito o estándar esperado","Historial personal","Hora de la reunión"]',1,'La comparación comienza por el estándar previamente esperado.'),
(4,'¿Cuál redacción es más objetiva?','["No le importa el cliente","Tiene mala actitud","7 de 12 seguimientos comprometidos vencieron esta semana","Siempre falla"]',2,'Describe una conducta cuantificable sin atribuir intención.'),
(5,'¿Cuál es el propósito central de CLARO?','["Ganar la discusión","Corregir una desviación con evidencia, escucha y acuerdo verificable","Evitar hablar de estándares","Automatizar sanciones"]',1,'CLARO combina claridad, escucha, responsabilidad y revisión.'),
(6,'Durante una conversación correctiva, una consecuencia debe comunicarse:','["Aunque no exista, para generar urgencia","Solo si corresponde a política y autoridad vigentes","Siempre en la primera conversación","Únicamente por mensaje automático"]',1,'No deben inventarse consecuencias como herramienta de presión.'),
(7,'Un acuerdo correctivo de calidad debe incluir:','["Una intención general de mejorar","Conducta específica y fecha o criterio de revisión","Una comparación con otros agentes","Información personal del colaborador"]',1,'El acuerdo necesita ser verificable.'),
(8,'¿Qué información conviene registrar en Compás One después de la conversación?','["Juicios sobre personalidad","Rumores del equipo","Acuerdo operativo, responsable, fecha y evidencia de cumplimiento","Datos sensibles sin relación con el trabajo"]',2,'La trazabilidad debe limitarse a información laboral necesaria.'),
(9,'Si existe mejora parcial, RECUPERA indica primero:','["Ignorarla hasta que sea perfecta","Revisar evidencia y evaluar el avance antes de ajustar soporte","Escalar automáticamente","Cancelar todo apoyo"]',1,'El seguimiento distingue progreso y causa antes de decidir.'),
(10,'¿Cuándo es apropiado escalar una situación persistente?','["Cuando el supervisor está molesto","Cuando evidencia y política aplicable justifican un paso proporcional dentro de la autoridad correspondiente","Después de cualquier error","Cuando otro agente lo solicita"]',1,'El escalamiento debe ser proporcional, documentado y sujeto a política.'),
(11,'El reconocimiento de buen desempeño funciona mejor cuando:','["Premia favoritismos","Describe una conducta replicable y sostenida","Se basa solo en un resultado aislado","Evita explicar qué salió bien"]',1,'El reconocimiento específico refuerza comportamientos que pueden repetirse.'),
(12,'¿Cuál práctica debe evitarse en automatizaciones comerciales?','["Crear una tarea de revisión","Registrar un compromiso operativo","Automatizar una sanción disciplinaria formal sin política ni intervención autorizada","Consultar el pipeline"]',2,'Los procesos disciplinarios formales no deben convertirse en automatizaciones comerciales autónomas.')
on conflict(position) do update set question=excluded.question,options=excluded.options,correct_index=excluded.correct_index,explanation=excluded.explanation,updated_at=now();
comment on table public.academy_level4_module4_questions is 'Evaluación formativa Nivel 4 M4: 12 preguntas; aprobación recomendada 80%, mínimo 10/12.';