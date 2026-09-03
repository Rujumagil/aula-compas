-- Evaluación formativa Nivel 4 · Módulo 6. 12 reactivos, 80% recomendado (10/12).
CREATE TABLE IF NOT EXISTS academy_level4_m6_questions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question text NOT NULL,
  options jsonb NOT NULL CHECK (jsonb_array_length(options)=4),
  correct_index smallint NOT NULL CHECK (correct_index BETWEEN 0 AND 3),
  explanation text NOT NULL
);
ALTER TABLE academy_level4_m6_questions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON academy_level4_m6_questions FROM anon, authenticated;

INSERT INTO academy_level4_m6_questions (question, options, correct_index, explanation) VALUES
('¿Qué diferencia principal establece MAPA entre desempeño y preparación?', '["Un resultado alto garantiza liderazgo","La preparación requiere evidencia de aptitud, práctica y autonomía además de métricas","La antigüedad sustituye la evidencia","El potencial se decide por intuición"]', 1, 'MAPA exige evidencia más amplia que un resultado aislado.'),
('Una persona supera meta pero registra mal el pipeline. ¿Qué corresponde?', '["Ascenderla de inmediato","Ignorar el registro","Reconocer la fortaleza y trabajar la brecha operativa antes de ampliar responsabilidad","Reducirle oportunidades"]', 2, 'El desarrollo reconoce capacidad y corrige brechas verificables.'),
('¿Qué debe tener una práctica deliberada?', '["Una intención general","Actividad, periodo y criterio observable de éxito","Solo una fecha","Una recompensa"]', 1, 'La práctica debe poder ejecutarse y evaluarse.'),
('¿Qué NO debe registrarse para un plan de desarrollo?', '["Meta de habilidad","Fecha de revisión","Diagnósticos personales innecesarios","Evidencia observable"]', 2, 'Se minimizan datos y se trabaja con evidencia profesional pertinente.'),
('En DELEGA, definir autoridad significa:', '["Dar permisos ilimitados","Aclarar qué puede decidir y qué requiere autorización","Eliminar checkpoints","Transferir la responsabilidad del supervisor"]', 1, 'La autoridad delegada tiene alcance explícito.'),
('¿Cuál es un ejemplo correcto de límite de delegación?', '["Puede cambiar precios sin autorización","Puede priorizar seguimiento, pero descuentos requieren aprobación","Puede borrar registros","Puede prometer cualquier fecha"]', 1, 'Los límites protegen decisiones reservadas y riesgos.'),
('¿Para qué sirven los checkpoints?', '["Microgestionar cada movimiento","Revisar evidencia y ajustar apoyo mientras se desarrolla autonomía","Reemplazar el resultado esperado","Evitar delegar"]', 1, 'Son puntos de control proporcionales al nivel de autonomía.'),
('Si la evidencia muestra autonomía sostenida, los checkpoints deberían:', '["Aumentar indefinidamente","Reducirse de forma proporcional sin eliminar trazabilidad necesaria","Desaparecer siempre","Convertirse en sanciones"]', 1, 'El control se adapta a la autonomía demostrada.'),
('¿Cuál es el propósito de RELEVO?', '["Prometer un ascenso","Reducir dependencia y probar continuidad operativa","Duplicar puestos","Evitar documentación"]', 1, 'RELEVO prepara respaldo y continuidad; no concede promociones.'),
('Antes de una prueba autónoma de sucesión debe existir:', '["Solo confianza personal","Proceso y límites documentados más un ensayo acompañado","Cambio de puesto","Acceso administrativo total"]', 1, 'La autonomía se prueba después de transferencia y ensayo.'),
('Una persona realiza correctamente una función durante una ausencia. Esto significa:', '["Ascenso automático","Evidencia útil de preparación, sujeta a la ruta formal de carrera","Cambio salarial automático","Permisos permanentes"]', 1, 'Una prueba aporta evidencia pero no sustituye reglas de promoción.'),
('¿Qué combinación representa mejor desarrollo responsable?', '["Intuición + urgencia + permisos","Evidencia + práctica + límites + validación","Meta + presión + ascenso","Antigüedad + confianza"]', 1, 'El desarrollo responsable combina evidencia, práctica deliberada, límites y validación.');
