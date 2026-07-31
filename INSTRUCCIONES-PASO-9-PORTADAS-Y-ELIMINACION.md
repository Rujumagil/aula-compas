# Paso 9 — Portadas y eliminación de contenido

## 1. Ejecutar SQL

En Supabase abre **SQL Editor**, copia el contenido de:

`08-portadas-y-eliminacion-contenido.sql`

y presiona **Run**.

Confirma en Storage que exista el bucket público:

`course-media`

## 2. Publicar el proyecto

Reemplaza los archivos del repositorio con los de este paquete y confirma los cambios en GitHub.

## 3. Limpiar caché

Abre `limpiar-cache.html` o usa `Ctrl + F5`.

## Funciones agregadas

- Subir imagen de curso en JPG, PNG o WebP.
- Subir portada de libro o manual.
- Límite de 5 MB por imagen.
- Eliminar portada sin borrar el contenido.
- Eliminar libros, manuales y recursos junto con su archivo privado.
- Eliminar un curso completo mediante confirmación escrita.
- Solo administradores o instructores propietarios pueden modificar o eliminar contenido.

## Recomendaciones de imagen

- Curso horizontal: 1600 × 900 px.
- Libro o manual vertical: 1200 × 1800 px.
