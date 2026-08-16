# Compás Academy — Blueprint curricular V28

Estado: **preparación editorial**. Este documento no implica que el contenido esté publicado ni listo para alumnos.

## Objetivo

Convertir las seis rutas principales de Compás Academy en programas completos y consistentes antes de ampliar inscripciones. El archivo `academy-curriculum-v28.json` contiene la estructura propuesta por curso, módulos, lecciones y duración estimada.

## Regla de seguridad editorial

Actualmente `modules` y `lessons` no tienen un estado `draft`. Insertar contenido incompleto en Supabase haría que pudiera quedar visible para usuarios con acceso al curso. Por eso V28 se mantiene únicamente en GitHub hasta que ocurra una de estas dos condiciones:

1. exista soporte de borrador para módulos y lecciones y la aplicación filtre correctamente por rol/estado, o
2. cada bloque que se vaya a insertar tenga contenido final listo para producción.

## Criterio de terminado por lección

Una lección no se considera lista solo por tener título. Antes de publicarla debe incluir:

- objetivo de aprendizaje concreto;
- contenido principal final: video, texto o actividad;
- duración realista;
- resumen o puntos clave;
- transcripción cuando exista video o audio;
- subtítulos o referencia de captions cuando corresponda;
- recurso descargable si la lección lo necesita;
- actividad o ejercicio cuando aplique;
- contexto suficiente para que el Tutor IA pueda acompañar al alumno;
- revisión de accesibilidad;
- revisión ortográfica y de marca;
- vínculo con evaluación cuando el módulo lo requiera.

## Rutas objetivo

### 1. Primeros pasos con Compás One

Objetivo: que un usuario nuevo comprenda el panel, CRM, conversaciones, seguimiento y rutina básica de operación.

Estructura objetivo: 4 módulos, 9 lecciones, aproximadamente 90 minutos.

### 2. CRM y seguimiento comercial

Objetivo: convertir contactos en oportunidades mediante pipeline, prioridades, cadencia de seguimiento y métricas básicas.

Estructura objetivo: 4 módulos, 8 lecciones, aproximadamente 120 minutos.

### 3. Marketing digital con dirección

Objetivo: conectar objetivos de negocio, propuesta de valor, contenido, captación y medición.

Estructura objetivo: 4 módulos, 8 lecciones, aproximadamente 120 minutos.

### 4. Meta Ads: de campaña a oportunidad

Objetivo: diseñar campañas que terminen en un proceso real de seguimiento dentro de Compás One, no solo en generación de clics o leads aislados.

Estructura objetivo: 5 módulos, 10 lecciones, aproximadamente 150 minutos.

### 5. IA aplicada a negocios

Objetivo: utilizar asistentes y agentes con contexto, controles claros y criterios de escalamiento humano.

Estructura objetivo: 4 módulos, 8 lecciones, aproximadamente 120 minutos.

### 6. Automatización para equipos pequeños

Objetivo: identificar procesos repetitivos, diseñar flujos simples, manejar excepciones y medir resultados.

Estructura objetivo: 4 módulos, 8 lecciones, aproximadamente 120 minutos.

## Orden recomendado de producción

1. Terminar **Primeros pasos con Compás One** como curso insignia y estándar de calidad.
2. Completar **CRM y seguimiento comercial**.
3. Completar **Marketing digital con dirección**.
4. Completar **Meta Ads: de campaña a oportunidad**.
5. Completar **IA aplicada a negocios**.
6. Completar **Automatización para equipos pequeños**.

Este orden permite que Academy enseñe primero el uso de Compás One y después incorpore adquisición, seguimiento, IA y automatización sobre una misma lógica operativa.

## Antes de llevar V28 a Supabase

- ejecutar las pruebas E2E de alumno y administrador;
- confirmar si se implementará soporte `draft/published/archived` en módulos y lecciones;
- validar el contenido del primer curso completo;
- cargar transcripciones y captions donde correspondan;
- preparar evaluaciones por módulo y evaluación final;
- verificar que certificados y notificaciones reaccionen correctamente al nuevo contenido;
- revisar el Tutor IA con el contexto actualizado del curso.

## Alcance de V28

V28 es deliberadamente no destructivo: **no modifica Supabase, no cambia autenticación, no altera progreso y no publica contenido**. Sirve como fuente estructurada para producir y aprobar el contenido académico antes del siguiente despliegue.
