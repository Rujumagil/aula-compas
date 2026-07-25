# Aula Compás — versión con identidad oficial de Proyecto Compás

Esta versión utiliza la identidad visual aprobada:

- Fondo crema cálido.
- Acuarela azul suave.
- Azul marino para navegación y botones.
- Acentos dorados.
- Tarjetas claras con efecto cristal.
- Menú lateral en computadora.
- Menú inferior en celular.
- Diseño instalable como PWA.

## Acceso de demostración

Correo: `ruben@proyectocompas.com`

Contraseña: `compas2026`

Actualmente el formulario acepta cualquier correo válido y contraseña, porque todavía no está conectado a Supabase.

## Publicar en GitHub

1. Descomprime el archivo ZIP.
2. Crea un repositorio público llamado `aula-compas`.
3. Sube todos los archivos y la carpeta `assets`.
4. Ve a **Settings → Pages**.
5. Selecciona **Deploy from a branch**.
6. Elige la rama `main` y la carpeta `/(root)`.
7. Guarda y espera la publicación.

## Archivos

- `index.html`: entrada de la app.
- `styles.css`: diseño visual completo.
- `data.js`: cursos, módulos, recursos y usuario de demostración.
- `app.js`: navegación y funcionamiento.
- `manifest.json`: configuración instalable.
- `sw.js`: caché y funcionamiento básico sin conexión.
- `assets/`: imágenes e iconos.

## Funciones incluidas

- Inicio de sesión de demostración.
- Inicio con curso destacado.
- Cursos y filtros.
- Módulos y lecciones.
- Marcar lecciones como completadas.
- Notas personales.
- Progreso y logros.
- Recursos.
- Perfil.
- Instalación como app.
- Panel administrativo básico.
- Registro de alumnos y cursos de prueba con almacenamiento local.

## Siguiente etapa

Conectar Supabase para usuarios reales, cursos, inscripciones, progreso sincronizado, archivos privados y administración completa.


## Identidad oficial integrada

La aplicación ahora utiliza los archivos oficiales proporcionados:

- `assets/icono-oficial.png`: icono de brújula con pluma.
- `assets/logo-texto-oficial.png`: logotipo tipográfico de Proyecto Compás.
- `assets/logo-completo-oficial.png`: composición completa para acceso y presentación.
- `assets/icon-192.png` y `assets/icon-512.png`: iconos de instalación creados a partir del icono oficial.

No cambies los nombres de estos archivos después de subirlos a GitHub, porque la app y la configuración PWA los utilizan directamente.
