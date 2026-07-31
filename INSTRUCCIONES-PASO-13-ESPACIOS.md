# Paso 13 · Espacios de trabajo y carpetas

Esta actualización organiza el panel del administrador por carpetas de marca o proyecto.

## Antes de subir a GitHub

1. Abre Supabase > SQL Editor.
2. Ejecuta `11-espacios-de-trabajo-carpetas.sql`.
3. Confirma que existan las tablas `workspaces` y `workspace_members`.
4. El script crea la carpeta inicial **Proyecto Compás** y mueve a ella los cursos y recursos existentes.
5. Sube todos los archivos del paquete al repositorio.
6. Abre `limpiar-cache.html` y vuelve a entrar.

## Resultado

En Administrar aparecerán carpetas. Al abrir una carpeta se mostrarán solamente sus cursos, libros, manuales, recursos y alumnos. Los cursos nuevos quedan asociados automáticamente a la carpeta abierta.

## Seguridad

Los administradores ven todos los espacios. Los instructores sólo ven los espacios donde están registrados en `workspace_members`.
