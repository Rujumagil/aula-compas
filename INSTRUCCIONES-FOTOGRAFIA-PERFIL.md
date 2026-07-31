# Fotografía de perfil · Aula Compás

## 1. Configurar Supabase

1. Abre Supabase.
2. Entra a **SQL Editor**.
3. Abre el archivo `07-fotografias-perfil-storage.sql`.
4. Copia todo su contenido, ejecútalo y confirma que finalice sin errores.
5. En **Storage** debe aparecer el bucket público `avatars`.

## 2. Publicar en GitHub

Sube todos los archivos de este paquete reemplazando los existentes.

## 3. Limpiar caché

Abre `limpiar-cache.html` o usa Ctrl + F5.

## Funcionamiento

- Formatos: JPG, PNG y WebP.
- Peso máximo de entrada: 2 MB.
- Recorte cuadrado con movimiento y zoom.
- Salida: WebP de 600 × 600 px.
- Ruta: `ID_DEL_USUARIO/avatar.webp`.
- Cada usuario únicamente puede modificar archivos dentro de su carpeta.

> HEIC no se acepta porque su compatibilidad depende del navegador y del dispositivo. Convierte previamente esas fotografías a JPG o WebP.
