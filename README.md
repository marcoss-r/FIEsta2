# FIEsta 2 🍒

Colección de juegos de fiesta por turnos para jugar **pasándose un solo móvil**.
Hermana de [FIEsta](../DescriptIA) (misma arquitectura y enfoque), con juegos
nuevos y estética roja.

**Los cinco juegos:** Verdad o Reto · Quién es más… · Dos mentiras y una verdad ·
El Impostor · Preguntas incómodas.

## Estado

✅ **Fase 0 completa:** esqueleto de la app, tema rojo e iconos. El hub muestra
las 5 tarjetas de juego (con su ⓘ de información), pero aún no llevan a ningún
sitio: cada juego se conecta en su propia fase.

## Por dónde empezar

Lee **[`md/PLAN_DESARROLLO.md`](md/PLAN_DESARROLLO.md)**: es la fuente de la
verdad del proyecto (qué se construye, qué se reutiliza de la app original, la
paleta, la arquitectura, las decisiones cerradas y las fases de desarrollo).

Después, cada juego tendrá su propio plan en `md/` (los escribe la Fase 1).

## Cómo abrir el proyecto

Basta con abrir `index.html` en el navegador. Cuando haya `data/*.js` (a partir
de la Fase 2), si el navegador se queja al cargarlos, sirve la carpeta con un
servidor local:

```bash
npx serve .
```

## Cómo regenerar los iconos

Los PNG de `icons/` se generan con Pillow a partir del mismo motivo que el SVG
del hub (`icons/icono.svg` / `index.html`):

```bash
python icons/generar_icono.py
```

## Cómo añadir contenido a un banco

Cada juego guardará su banco en `data/<juego>/` como un `.json` (fuente) + un
`.js` generado (`const XX_BANCO = […]`) + un script `agregar.py` para dar de
alta entradas desde consola, igual que en FIEsta 1. Se implementa junto con
cada juego (a partir de la Fase 3); de momento esas carpetas están vacías.

## Tecnología

HTML + CSS + JavaScript **vanilla**: sin frameworks, sin dependencias, sin paso
de compilación. PWA instalable y jugable sin conexión. Se publica en GitHub Pages.
