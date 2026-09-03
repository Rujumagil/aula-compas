-- Compás Academy · Nivel 5 · Evaluación Integradora
-- 30 reactivos / 120 opciones. Aprobación: 80% (mínimo 24/30).
-- Se crea en draft: no publica ni genera intentos/resultados.
begin;

do $block$
declare c_id uuid; a_id uuid; q_id uuid; r record;
begin
  select id into c_id from public.courses where slug='nivel-5-direccion-comercial-avanzada-compas' limit 1;
  if c_id is null then raise exception 'Curso Nivel 5 no encontrado'; end if;

  select id into a_id from public.assessments where course_id=c_id and module_id is null and title='Evaluación Integradora · Nivel 5' limit 1;
  if a_id is null then
    insert into public.assessments(course_id,module_id,title,description,assessment_type,passing_score,status,position)
    values(c_id,null,'Evaluación Integradora · Nivel 5','Examen transversal de dirección comercial avanzada. Requiere 80% para aprobar.', 'final_exam',80,'draft',99)
    returning id into a_id;
  else
    update public.assessments set passing_score=80,status='draft',assessment_type='final_exam',updated_at=now() where id=a_id;
    delete from public.assessment_questions where assessment_id=a_id;
  end if;

  for r in select * from (values
  (1,'Una dirección comercial detecta crecimiento de leads pero caída de capacidad y calidad. ¿Qué enfoque corresponde?','Aumentar volumen sin revisar restricciones','Analizar el sistema completo y sus interdependencias antes de decidir','Cambiar al supervisor con peor cifra','Prometer una meta mayor','B','La dirección sistémica evita optimizar una parte dañando capacidad o calidad.'),
  (2,'¿Qué convierte una meta estratégica en una prioridad ejecutable?','Una frase inspiradora','Restricciones, responsables, indicadores y renuncias explícitas','Más reuniones','Un forecast único','B','La estrategia necesita elecciones, límites y evidencia de ejecución.'),
  (3,'Una decisión rebasa la autoridad del supervisor. ¿Qué debe hacer el director?','Pedirle que la ejecute sin registro','Definir el nivel de autoridad y escalar formalmente lo que excede el rol','Compartir credenciales administrativas','Ignorar el caso','B','La gobernanza exige autoridad explícita y escalamiento trazable.'),
  (4,'Antes de invertir en un nuevo segmento, ¿qué debe validarse?','Solo tamaño de audiencia','Ajuste, potencial, economía, capacidad y evidencia','Solo entusiasmo comercial','Número de competidores','B','MAPEA evita expandirse por intuición aislada.'),
  (5,'¿Qué señal indica riesgo de capacidad?','Pipeline estable','Carga sostenida por encima de capacidad con deterioro de tiempos o calidad','Más documentación','Menos reuniones','B','CAPAZ conecta demanda con carga y límites operativos.'),
  (6,'¿Cómo debe tratarse un escenario favorable?','Como promesa de venta','Como posibilidad condicionada por supuestos explícitos','Como presupuesto obligatorio','Como dato histórico','B','Los escenarios no son garantías; dependen de supuestos verificables.'),
  (7,'¿Qué métrica aislada es insuficiente para evaluar economía comercial?','Ingresos','Margen de contribución','Costo de servir','Todas requieren contexto conjunto','D','La economía comercial requiere leer adquisición, conversión, costos, permanencia y contribución como sistema.'),
  (8,'Si faltan datos de permanencia para calcular retorno, ¿qué corresponde?','Inventar un promedio','Declarar incertidumbre y trabajar con rangos o conseguir evidencia','Eliminar el indicador','Usar el mejor caso','B','No deben fabricarse datos para cerrar un modelo.'),
  (9,'¿Qué hace robusto un forecast ejecutivo?','Una sola cifra sin supuestos','Escenarios, evidencia del pipeline, concentración, capacidad y riesgos','Optimismo del equipo','Promedio del mes anterior','B','PREVE separa hechos, supuestos y riesgo.'),
  (10,'Un tablero ejecutivo equilibrado debe incluir:','Solo ventas','Crecimiento, eficiencia, calidad, permanencia, capacidad y riesgo','Solo actividad','Solo CAC','B','BALIZA evita dirigir por una métrica aislada.'),
  (11,'Dirigir supervisores implica principalmente:','Resolver cada caso por ellos','Definir resultados, bordes de autoridad, indicadores y aprendizaje','Revisar cada mensaje del equipo','Eliminar autonomía','B','ORBITA desarrolla responsabilidad sin microgestión.'),
  (12,'Dos equipos tienen conversión distinta pero atienden segmentos diferentes. ¿Qué debe hacerse?','Premiar al mayor sin análisis','Calibrar contexto, proceso, evidencia y brechas comparables','Fusionarlos inmediatamente','Ignorar la diferencia','B','CALIBRA evita comparaciones injustas sin contexto.'),
  (13,'¿Qué evidencia desarrollo de criterio en un supervisor?','Escala todos los casos','Llega con evidencia, diagnóstico, decisión propuesta y límites claros','Pide autorización para todo','Evita documentar','B','ELEVA busca líderes capaces de razonar y proponer.'),
  (14,'¿Cuándo conviene abrir una nueva célula comercial?','Cuando hay entusiasmo','Cuando demanda, proceso, liderazgo, capacidad, economía y controles muestran readiness','Cuando el equipo actual está saturado sin plan','Siempre que exista presupuesto','B','EXPANDE exige preparación antes de multiplicar complejidad.'),
  (15,'Una célula nueva necesita primero:','Nombre y logo','Resultado esperado, responsable, límites, interfaces y métricas','Más canales','Acceso administrativo general','B','CELULA define diseño organizacional antes de escalar.'),
  (16,'¿Cuál es una implementación responsable del cambio?','Despliegue total irreversible','Piloto acotado con indicadores de adopción y criterios de ajuste/reversa','Cambio sin comunicar','Eliminar controles','B','CAMBIA reduce riesgo mediante aprendizaje controlado.'),
  (17,'¿Qué caracteriza una prioridad estratégica real de portafolio?','Mantener todo activo','Elegir y también pausar, secuenciar o detener','Evitar renuncias','Usar solo presupuesto','B','Priorizar consume capacidad y exige renuncias explícitas.'),
  (18,'Una iniciativa tiene baja evidencia pero alto potencial. ¿Qué procede?','Inventar ROI','Experimento limitado con hipótesis y criterio de revisión','Despliegue global','Declararla exitosa','B','CARTERA permite aprender sin convertir incertidumbre en certeza.'),
  (19,'¿Qué es costo de oportunidad?','Un gasto fijo','Valor de la alternativa sacrificada al asignar capacidad','Una comisión','Un error contable','B','La capacidad dedicada a una iniciativa deja de estar disponible para otra.'),
  (20,'¿Cuándo debe reasignarse capacidad?','Ante cualquier ruido','Cuando evidencia material cambia valor, riesgo, urgencia o capacidad','Nunca','Solo al cierre anual','B','PRIORIZA permite adaptación disciplinada.'),
  (21,'Seguir financiando algo solo por lo ya invertido es:','Diversificación','Sesgo de costo hundido','Gobernanza','Readiness','B','La inversión pasada no justifica consumo futuro.'),
  (22,'Ante indisponibilidad de un responsable crítico, un plan maduro activa:','Credenciales compartidas','Suplencia, operación mínima y escalamiento dentro de autoridad','Permisos totales','Suspensión indefinida','B','CONTINUA protege funciones críticas sin abandonar controles.'),
  (23,'¿Qué debe mantenerse durante una contingencia?','Mínimo privilegio y trazabilidad','Acceso irrestricto','Decisiones sin registro','Contraseñas compartidas','A','La urgencia no elimina seguridad ni responsabilidad.'),
  (24,'Después de recuperar una operación crítica corresponde:','Cerrar sin revisar','Retrospectiva y acciones preventivas','Ocultar el incidente','Eliminar el plan','B','La continuidad madura incorpora aprendizaje.'),
  (25,'Un director recibe presión para garantizar un forecast no sustentado. ¿Qué hace?','Lo garantiza para motivar','Expone supuestos, rango, riesgos y evidencia disponible','Aumenta la cifra','Oculta incertidumbre','B','La dirección responsable no convierte escenarios en promesas.'),
  (26,'Un supervisor preparado para más responsabilidad debe:','Recibir ascenso automático','Demostrar capacidad, pero seguir la ruta formal de rol y permisos','Obtener permisos antes del rol','Sustituir al director sin autorización','B','Preparación y promoción son procesos distintos.'),
  (27,'Si una expansión empeora calidad y tiempos, ¿qué señal es más útil?','Solo ingresos nuevos','Indicadores adelantados de capacidad, servicio y adopción junto con resultados','Cantidad de mensajes','Número de reuniones','B','La expansión debe vigilar salud operativa además del resultado.'),
  (28,'¿Qué decisión muestra gobierno de KPIs?','Cambiar métricas cuando no gustan','Definir dueño, frecuencia, umbral y acción asociada a cada indicador','Medir todo sin prioridad','Usar solo métricas rezagadas','B','Un KPI sirve para gobernar cuando conduce a una decisión explícita.'),
  (29,'Una reasignación estratégica debe quedar registrada con:','Solo la decisión final','Evidencia, supuesto, responsable, impacto, fecha y criterio de revisión','Solo presupuesto','Solo nombre del director','B','La trazabilidad permite aprender y auditar decisiones.'),
  (30,'¿Cuál es la responsabilidad central de un director comercial avanzado?','Maximizar actividad a cualquier costo','Orquestar crecimiento, economía, capacidad, liderazgo y riesgo como un sistema','Cerrar personalmente todas las ventas','Evitar delegar','B','Nivel 5 integra estrategia, economía, liderazgo y continuidad en un sistema gobernable.')
  ) as t(pos,prompt,a,b,c,d,correct,explanation)
  loop
    insert into public.assessment_questions(assessment_id,prompt,question_type,explanation,points,position)
    values(a_id,r.prompt,'single_choice',r.explanation,1,r.pos) returning id into q_id;
    insert into public.assessment_options(question_id,label,is_correct,position) values
      (q_id,r.a,r.correct='A',1),(q_id,r.b,r.correct='B',2),(q_id,r.c,r.correct='C',3),(q_id,r.d,r.correct='D',4);
  end loop;
end $block$;
commit;