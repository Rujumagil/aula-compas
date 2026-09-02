-- Compás Academy · Catálogo exclusivo de capacitación Freelance
-- Publica la ruta comercial Nivel 1–5 y retira del catálogo los cursos ajenos o heredados.
-- Los cursos archivados se conservan para historial y no se eliminan físicamente.

begin;

update public.courses
set status = 'archived',
    featured = false,
    updated_at = now()
where slug not in (
  'nivel-1-inicio-comercial-compas',
  'nivel-2-captacion-y-ventas-compas',
  'nivel-3-cartera-permanencia-crecimiento-compas',
  'nivel-4-liderazgo-supervision-comercial',
  'nivel-5-direccion-comercial-avanzada-compas'
);

update public.courses
set status = 'published',
    category = 'Freelance Comercial',
    featured = (slug = 'nivel-1-inicio-comercial-compas'),
    updated_at = now()
where slug in (
  'nivel-1-inicio-comercial-compas',
  'nivel-2-captacion-y-ventas-compas',
  'nivel-3-cartera-permanencia-crecimiento-compas',
  'nivel-4-liderazgo-supervision-comercial',
  'nivel-5-direccion-comercial-avanzada-compas'
);

commit;
