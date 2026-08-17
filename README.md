# FIEsta 2 🍒

Colección de juegos de fiesta por turnos para jugar **pasándose un solo móvil**.
Hermana de [FIEsta](../DescriptIA) (misma arquitectura y enfoque), con juegos
nuevos y estética roja.

**Los cinco juegos:** Yo nunca · Quién es más… · Verdad o Reto · Dos mentiras
y una verdad · El Impostor.

> Hubo un sexto juego, **«Preguntas incómodas»**, implementado y luego
> eliminado por redundante con «Verdad o Reto» en modo «solo verdades»: su
> contenido se fusionó en el banco de verdades de `vr` (ver más abajo).
> Detalles en `md/PLAN_DESARROLLO.md` §9.5 y `md/PLAN_PREGUNTAS_INCOMODAS.md`.

## Estado

✅ **Fases 0, 1 y 2 completas**. Los tres primeros juegos ya se juegan de
principio a fin, cada uno con su banco de contenido **provisional**
(pendiente de su Fase 3, el banco definitivo, a cuatro manos con el usuario):

- **«Yo nunca»** (🚧 Fase 3 en curso) — jugadores y niveles (el más fuerte se
  llama «Salseo», no «Extremo»), modo fiesta, rotación de quien lee, partida
  guardable/reanudable, 674 frases en el banco (`data/yonunca/frases.json` +
  `frases.js` generado + `agregar.py`), mezclando confesiones («he...») e
  hipotéticas («probaría...»); pendiente de que el usuario lo recorte y afine.
- **«Quién es más…»** (🚧 Fase 4 en curso) — chips de nivel propios del
  juego (**Normal** / **Picante**, no los tres del núcleo: picante agrupa
  pareja, sexo, infidelidades, drogas, alcohol, tabaco, adicciones, racismo,
  machismo, homofobia y orientación sexual), encabezado dinámico, castigo
  por pregunta con modo fiesta, banco de 584 preguntas (343 normal / 241
  picante); el tipo de pregunta (`probable`/`adjetivo`, con los antiguos
  `primero`/`nunca` fusionados en `probable`) ya no se filtra de cara al
  usuario, solo decide el encabezado (`data/quienmas/preguntas.json` + `.js`
  generado + `agregar.py`, ver `md/PLAN_QUIEN_ES_MAS.md`). Incluye además un
  **modo parejas**
  (`md/PLAN_QUIEN_ES_MAS.md` §10): sortea una pareja de entre todos los
  jugadores y recorre, en orden aleatorio, todas las combinaciones posibles,
  8 preguntas cada una; si coinciden se libran, si difieren beben (con modo
  fiesta); termina con un ranking de parejas por coincidencias.
- **«Verdad o Reto»** (🚧 Fase 5 en curso) — chips de nivel y de modo (mixto /
  solo verdades / solo retos), carta volteable en 3D, «Paso» (en verdad o en
  reto) con castigo ponderado (30 % beber / 20 % prenda / 50 % otros), «Otro
  reto» sin límite ni castigo en los retos (no existe en las verdades), banco
  de 651 verdades (258 suave / 224 picante / 169 extremo, tras fusionar el
  contenido no duplicado de «Preguntas incómodas», el sexto juego original,
  eliminado) + 360 retos (120 por nivel; los retos vuelven a ser dares de
  acción reales en vez de confesiones disfrazadas — ver «Ajustes de
  contenido» en el plan del juego, `data/verdadreto/verdades.json` +
  `retos.json` + `.js` generados + `agregar.py`), pendiente de que el
  usuario lo revise.

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
- [`md/PLAN_DOS_MENTIRAS.md`](md/PLAN_DOS_MENTIRAS.md) (`dm`)
- [`md/PLAN_EL_IMPOSTOR.md`](md/PLAN_EL_IMPOSTOR.md) (`im`)
- [`md/PLAN_PREGUNTAS_INCOMODAS.md`](md/PLAN_PREGUNTAS_INCOMODAS.md) (`pi`,
  juego eliminado — referencia histórica)

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
este patrón completo: `frases.json` (fuente, 674 entradas) + `frases.js`
(generado) + `agregar.py` (da de alta frases nuevas y regenera el `.js`; nunca
se edita `frases.js` a mano). `data/quienmas/` sigue ahora el mismo patrón:
`preguntas.json` (fuente, 400 entradas) + `preguntas.js` (generado) +
`agregar.py`. El resto de carpetas de juego siguen vacías.

## Tecnología

HTML + CSS + JavaScript **vanilla**: sin frameworks, sin dependencias, sin paso
de compilación. PWA instalable y jugable sin conexión. Se publica en GitHub Pages.
