# Aula Compás conectada con Supabase

Esta versión ya contiene la URL del proyecto y la publishable key proporcionadas.

## Antes de subirla a GitHub

Ejecuta en Supabase, en este orden:

1. `02-parche-seguridad-y-permisos.sql`
2. `03-datos-iniciales.sql`
3. `05-acceso-privado-libros-y-roles.sql`

El primer archivo:

- Revisa perfiles existentes.
- Convierte `proyectocompas.info@gmail.com` en administrador.
- Impide que un alumno se otorgue a sí mismo el rol de administrador.
- Concede al navegador únicamente los permisos necesarios.

El segundo archivo:

- Crea cuatro cursos iniciales.
- Crea módulos y lecciones.
- Agrega recursos de ejemplo.
- Puede ejecutarse otra vez sin duplicar los registros.

## Publicación en GitHub Pages

1. Descomprime este paquete.
2. Reemplaza todos los archivos del repositorio `aula-compas`.
3. Conserva la carpeta `assets`.
4. Presiona **Commit changes**.
5. Espera la publicación de GitHub Pages.
6. Abre la página con `Ctrl + F5`.

## Configuración de Supabase Auth

En Supabase revisa:

**Authentication → URL Configuration**

Agrega como Site URL la dirección pública de tu aula, por ejemplo:

```text
https://TU-USUARIO.github.io/aula-compas/
```

Agrega la misma dirección en **Redirect URLs**.

Esto es necesario para confirmación de correo y recuperación de contraseña.

## Flujo de alumnos

1. El alumno abre Aula Compás.
2. Selecciona **Crear una cuenta**.
3. Registra su nombre, correo y contraseña.
4. Confirma el correo cuando Supabase lo solicite.
5. El administrador abre **Administrar**.
6. Selecciona al alumno y le asigna un curso.
7. El alumno actualiza la app y ve el curso.

## Funciones conectadas

- Inicio de sesión real.
- Registro de alumnos.
- Recuperación de contraseña.
- Sesión persistente.
- Perfil.
- Cursos según inscripción.
- Módulos y lecciones.
- Progreso sincronizado.
- Notas privadas.
- Recursos autorizados.
- Creación de cursos y módulos por administrador.
- Asignación de cursos.
- Panel de usuarios e inscripciones.
- Recuperación completa de contraseña.
- Recursos y libros digitales en almacenamiento privado.
- Enlaces temporales para alumnos autorizados.
- Rol de instructor separado del administrador.

## Entrega privada del libro digital

No subas el HTML del libro al repositorio público. Después de ejecutar
`05-acceso-privado-libros-y-roles.sql`, abre **Administrar → Agregar libro o
recurso privado**, selecciona el curso **El Compás del Estratega** y carga el
archivo HTML. El aula lo guardará en el bucket privado `digital-products`.

Un alumno solamente podrá obtener un enlace temporal cuando tenga una
inscripción activa en el curso. Consulta `LIBRO-DIGITAL-INSTRUCCIONES.md` para
el procedimiento de publicación y prueba.

## Plataforma profesional 6.0

La versión 6.0 incorpora:

- catálogo público de cursos y libros;
- biblioteca privada diferenciada de los cursos;
- agenda de lanzamientos y webinars;
- buscador global de cursos, lecciones, libros y ayuda;
- centro de ayuda con preguntas frecuentes;
- notificaciones dentro del aula;
- certificados imprimibles para cursos completados;
- panel administrativo con estados de publicación;
- asignación de roles de alumno, instructor y administrador;
- información comercial por curso: instructor, duración, precio y enlace de pago;
- permisos para que cada instructor administre únicamente los cursos que creó.

Antes de publicar esta versión, ejecuta en Supabase:

1. `05-acceso-privado-libros-y-roles.sql`
2. `06-plataforma-profesional-e-instructores.sql`

## Seguridad

La publishable key puede estar en el navegador porque las tablas utilizan Row Level Security.

No agregues al proyecto:

- `service_role`
- `sb_secret_...`
- contraseña de la base de datos
- tokens personales
