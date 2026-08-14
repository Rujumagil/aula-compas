# Compás Academy · Evolution V7

Esta versión convierte la base de Aula Compás en **Compás Academy**, el brazo de capacitación práctica de **Proyecto Compás Evolution**.

## Qué conserva

- Autenticación y recuperación con Supabase.
- Cursos, módulos, lecciones y progreso.
- Biblioteca privada y recursos.
- Certificados.
- Calendario y notificaciones.
- Roles de alumno, instructor y administrador.
- Workspaces y control de accesos.
- PWA instalable.

## Qué cambia

- Identidad visual oficial de Compás Academy.
- Paleta y jerarquía de Proyecto Compás Evolution.
- Catálogo público enfocado en Compás One, CRM, marketing, Meta Ads, IA y automatización.
- Mensaje rector: **Aprender haciendo**.
- Eliminación de fechas promocionales antiguas de la portada.
- Nueva migración `14-compas-academy-evolution.sql` para agregar las rutas iniciales sin borrar los datos anteriores.

## Base de datos

En una instalación existente, ejecutar solamente la migración nueva después de las anteriores:

`14-compas-academy-evolution.sql`

La migración conserva los cursos antiguos y los pasa a borrador; no elimina compras, progreso ni registros.

## Dominio

El archivo `CNAME` permanece en `aula.proyectocompas.com` para no romper el despliegue actual. El dominio puede migrarse después a otro subdominio (por ejemplo `academy.proyectocompas.com`) cuando se defina y configure DNS.
