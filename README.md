# FIEsta 2 🍒

Colección de juegos de fiesta por turnos para jugar **pasándose un solo móvil**.
Hermana de [FIEsta](../DescriptIA) (misma arquitectura y enfoque), con juegos
nuevos y estética roja.

**Los seis juegos:** Yo nunca · Quién es más… · Verdad o Reto · Preguntas
incómodas · Dos mentiras y una verdad · El Impostor.

## Estado

✅ **Fases 0, 1 y 2 completas.** El esqueleto de la app está en pie (tema rojo,
iconos, hub con las 5 tarjetas de juego originales y su ⓘ de información, aunque
todavía no llevan a ningún sitio), los seis planes de juego ya están escritos en
`md/`, y el **núcleo compartido** (`js/nucleo/`: jugadores, niveles de
intensidad, modo fiesta, plantillas de texto, persistencia y handoff) está
implementado y probado. **«Yo nunca» se añadió después de cerrar la Fase 0**,
así que su tarjeta en el hub se añade al empezar su propia fase de
implementación (ver `md/PLAN_YO_NUNCA.md`). Lo siguiente es la **Fase 3** (el
primer juego: Yo nunca).

## Por dónde empezar

Lee **[`md/PLAN_DESARROLLO.md`](md/PLAN_DESARROLLO.md)**: es la fuente de la
verdad del proyecto (qué se construye, qué se reutiliza de la app original, la
paleta, la arquitectura, las decisiones cerradas y las fases de desarrollo).

Después, cada juego tiene su propio plan, autosuficiente y con las decisiones ya
cerradas:

- [`md/PLAN_YO_NUNCA.md`](md/PLAN_YO_NUNCA.md) (`yn`)
- [`md/PLAN_QUIEN_ES_MAS.md`](md/PLAN_QUIEN_ES_MAS.md) (`qm`)
- [`md/PLAN_VERDAD_O_RETO.md`](md/PLAN_VERDAD_O_RETO.md) (`vr`)
- [`md/PLAN_PREGUNTAS_INCOMODAS.md`](md/PLAN_PREGUNTAS_INCOMODAS.md) (`pi`)
- [`md/PLAN_DOS_MENTIRAS.md`](md/PLAN_DOS_MENTIRAS.md) (`dm`)
- [`md/PLAN_EL_IMPOSTOR.md`](md/PLAN_EL_IMPOSTOR.md) (`im`)

## Cómo abrir el proyecto

Basta con abrir `index.html` en el navegador. Si el navegador se queja al
cargar alguno de los `data/*.js`, sirve la carpeta con un servidor local:

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
