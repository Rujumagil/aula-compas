# Aula Compás V5.1 — corrección de pantalla en blanco

Esta versión corrige los puntos más comunes que dejan una página vacía en GitHub Pages:

- Muestra una pantalla de carga desde el propio HTML.
- Carga Supabase con dos proveedores CDN de respaldo.
- Muestra un error visible cuando la librería no carga.
- Incluye `diagnostico.html`.
- Incluye `limpiar-cache.html`.
- Actualiza el service worker con estrategia network-first.
- Agrega identificadores de versión para evitar archivos antiguos.
- Incluye `404.html` para GitHub Pages.

## Reemplazo en GitHub

1. Descomprime el ZIP.
2. Reemplaza todos los archivos del repositorio.
3. Sube también `bootstrap.js`, `diagnostico.html`, `limpiar-cache.html` y `404.html`.
4. Haz Commit.
5. Espera a que GitHub Pages finalice.
6. Abre primero:

```text
https://TU-USUARIO.github.io/aula-compas/limpiar-cache.html
```

7. La página regresará automáticamente al aula.

## Si continúa el problema

Abre:

```text
https://TU-USUARIO.github.io/aula-compas/diagnostico.html
```

La pantalla indicará cuál de estos puntos falla:

- Configuración pública.
- Librería Supabase.
- Proyecto Supabase.
- Service worker.
