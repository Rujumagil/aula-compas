# Aula Compás · Fase 3 · Paso 12
## Subida directa de imágenes, PDF, audio y video en el editor por bloques

### 1. Ejecuta el SQL
En Supabase abre **SQL Editor**, copia el contenido de:

`10-archivos-directos-editor-bloques.sql`

y presiona **Run**.

Después confirma en **Storage** que exista el bucket privado:

`lesson-media`

### 2. Sube el proyecto a GitHub
Reemplaza los archivos actuales con el contenido de este paquete.

### 3. Limpia la caché
Abre:

`https://aula.proyectocompas.com/limpiar-cache.html`

y después recarga con `Ctrl + F5`.

### 4. Cómo probarlo
1. Inicia sesión como administrador o instructor.
2. Abre **Administrar**.
3. Entra al **Editor por bloques**.
4. Agrega un bloque de imagen, video, documento o audio.
5. Presiona **Subir archivo**.
6. Comprueba la vista previa.
7. Abre **Vista alumno** y confirma que el material se vea correctamente.

### Límites configurados
- Imagen: 8 MB. Se convierte a WebP y se redimensiona hasta 1920 px.
- PDF: 25 MB.
- Audio: 80 MB.
- Video: 250 MB.

### Seguridad
Los archivos están en un bucket privado. Los enlaces son temporales y sólo se generan para:
- administradores;
- instructores responsables del curso;
- alumnos con inscripción activa.

No coloques la service role key dentro de GitHub.
