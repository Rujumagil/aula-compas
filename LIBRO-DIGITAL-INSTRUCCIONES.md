# Publicar El Compás del Estratega de forma privada

El libro entregado contiene 106 páginas y todos sus recursos dentro de un solo
archivo HTML. Su tamaño aproximado es de 19 MB.

## Preparación

1. Ejecuta en Supabase, en este orden:
   - `02-parche-seguridad-y-permisos.sql`
   - `03-datos-iniciales.sql`
   - `05-acceso-privado-libros-y-roles.sql`
2. Publica la versión 5.4 del aula.
3. Inicia sesión con la cuenta administradora.

## Cargar el libro

1. Abre **Administrar**.
2. Busca **Agregar libro o recurso privado**.
3. Selecciona el curso **El Compás del Estratega**.
4. Escribe como título **El Compás del Estratega · Libro digital**.
5. Elige el tipo **Libro digital**.
6. Selecciona el archivo HTML del libro.
7. Pulsa **Guardar recurso** y espera la confirmación.

El archivo se guarda en el bucket privado `digital-products`. No se publica una
URL permanente.

## Dar acceso a una compra

Mientras Mercado Pago no esté automatizado:

1. Verifica el pago.
2. Confirma que la persona utilizó en Aula Compás el mismo correo de la compra.
3. En **Administrar → Asignar curso**, selecciona a la persona.
4. Asigna **El Compás del Estratega**.
5. Pide a la persona actualizar el aula y abrir **Recursos**.

## Automatización pendiente

Para inscribir automáticamente después de pagar se necesita una función segura
en Supabase y credenciales privadas de Mercado Pago. El token de acceso y la
clave de la función deben configurarse como secretos; nunca deben guardarse en
GitHub ni en `supabase-config.js`.

