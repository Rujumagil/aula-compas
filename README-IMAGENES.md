# Aula Compás V5.2 — imágenes sin carpetas

Esta versión coloca todas las imágenes en la raíz del repositorio. Así se evita el problema más común al subir archivos manualmente a GitHub: que la carpeta `assets` no se cargue o quede en una ubicación incorrecta.

## Cómo actualizar GitHub

1. Descomprime el ZIP.
2. Entra al repositorio `aula-compas`.
3. Elimina la versión anterior o reemplaza todos sus archivos.
4. Selecciona **Add file → Upload files**.
5. Selecciona todos los archivos descomprimidos.
6. No necesitas crear ninguna carpeta.
7. Presiona **Commit changes**.
8. Espera a que GitHub Pages publique los cambios.
9. Abre `limpiar-cache.html`.

Ejemplo:

```text
https://TU-USUARIO.github.io/aula-compas/limpiar-cache.html
```

## Verificación

Después abre:

```text
https://TU-USUARIO.github.io/aula-compas/verificar-imagenes.html
```

Cada archivo debe mostrar el mensaje:

```text
Imagen cargada correctamente
```

## Supabase

Ejecuta también:

```text
04-corregir-rutas-imagenes.sql
```

Esto elimina `assets/` de las portadas guardadas anteriormente en la base de datos.

La aplicación también corrige esas rutas automáticamente, pero el SQL deja la base de datos limpia para futuras versiones.
