# FIEsta 2 🍒

Colección de juegos de fiesta por turnos para jugar **pasándose un solo móvil**.
Hermana de [FIEsta](../DescriptIA) (misma arquitectura y enfoque), con juegos
nuevos y estética roja.

**Los seis juegos:** Yo nunca · Quién es más… · Verdad o Reto · Preguntas
incómodas · Dos mentiras y una verdad · El Impostor.

## Estado

✅ **Fases 0, 1 y 2 completas**. Los tres primeros juegos ya se juegan de
principio a fin, cada uno con su banco de contenido **provisional**
(pendiente de su Fase 3, el banco definitivo, a cuatro manos con el usuario):

- **«Yo nunca»** (🚧 Fase 3 en curso) — jugadores y niveles (el más fuerte se
  llama «Salseo», no «Extremo»), modo fiesta, rotación de quien lee, partida
  guardable/reanudable, 649 frases en el banco (`data/yonunca/frases.json` +
  `frases.js` generado + `agregar.py`), mezclando confesiones («he...») e
  hipotéticas («probaría...»); pendiente de que el usuario lo recorte y afine.
- **«Quién es más…»** (🚧 Fase 4 en curso) — chips de nivel y de tipo de
  pregunta, encabezado dinámico, castigo por pregunta con modo fiesta, banco
  de 400 preguntas (100 por tipo, `data/quienmas/preguntas.json` + `.js`
  generado + `agregar.py`). Incluye además un **modo parejas**
  (`md/PLAN_QUIEN_ES_MAS.md` §10): sortea una pareja de entre todos los
  jugadores y recorre, en orden aleatorio, todas las combinaciones posibles,
  8 preguntas cada una; si coinciden se libran, si difieren beben (con modo
  fiesta); termina con un ranking de parejas por coincidencias.
- **«Verdad o Reto»** (🚧 Fase 5 en curso) — chips de nivel y de modo (mixto /
  solo verdades / solo retos), carta volteable en 3D, «Paso» (en verdad o en
  reto) con castigo ponderado (30 % beber / 20 % prenda / 50 % otros), «Otro
  reto» sin límite ni castigo en los retos (no existe en las verdades), banco
  de 200 verdades + 200 retos (`data/verdadreto/verdades.json` + `retos.json`
  + `.js` generados + `agregar.py`), pendiente de que el usuario lo revise.
- **«Preguntas incómodas»** (🚧 Fase 6 en curso) — la app elige a quién y qué
  preguntar (tres formatos: `dirigida`, `cruzada` y `grupo`), rotación de
  destinatario y lector, «Se lo salta» con castigo, botón «Devolver» (solo
  con modo fiesta, una vez por jugador y partida, no encadenable), banco
  provisional de 30 preguntas (`data/incomodas/preguntas.js`, la muestra de
  `md/PLAN_PREGUNTAS_INCOMODAS.md` §9).

El resto de tarjetas del hub (Dos mentiras y una verdad, El Impostor) aún no
llevan a ningún sitio: se implementan en las fases 7-8.

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
alta entradas desde consola, igual que en FIEsta 1. `data/yonunca/` ya sigue
este patrón completo: `frases.json` (fuente, 649 entradas) + `frases.js`
(generado) + `agregar.py` (da de alta frases nuevas y regenera el `.js`; nunca
se edita `frases.js` a mano). `data/quienmas/` sigue ahora el mismo patrón:
`preguntas.json` (fuente, 400 entradas) + `preguntas.js` (generado) +
`agregar.py`. `data/incomodas/preguntas.js` existe ya, pero solo como banco
**provisional** (30 entradas escritas a mano, la muestra de
`md/PLAN_PREGUNTAS_INCOMODAS.md` §9); su `.json` fuente y `agregar.py`
llegan con el banco definitivo (su Fase 3). El resto de carpetas de juego
siguen vacías.

## Tecnología

HTML + CSS + JavaScript **vanilla**: sin frameworks, sin dependencias, sin paso
de compilación. PWA instalable y jugable sin conexión. Se publica en GitHub Pages.
