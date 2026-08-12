# FIEsta 2 🍒

Colección de juegos de fiesta por turnos para jugar **pasándose un solo móvil**.
Hermana de [FIEsta](../DescriptIA) (misma arquitectura y enfoque), con juegos
nuevos y estética roja.

**Los seis juegos:** Yo nunca · Quién es más… · Verdad o Reto · Preguntas
incómodas · Dos mentiras y una verdad · El Impostor.

## Estado

✅ **Fases 0, 1 y 2 completas**. **«Yo nunca»** (🚧 Fase 3 en curso) ya se juega
de principio a fin — hub, configuración de jugadores y niveles (el más fuerte
se llama «Salseo», no «Extremo»), modo fiesta, rotación de quien lee y partida
guardable/reanudable — con 633 frases en el banco (`data/yonunca/
frases.json` + `frases.js` generado + `agregar.py`), mezclando confesiones
(«he...») e hipotéticas («probaría...»); pendiente de que el usuario lo
recorte y afine. **«Quién es más…»** (🚧 Fase 4 en curso) también se juega de
principio a fin — chips de nivel y de tipo de pregunta, encabezado dinámico,
castigo por pregunta con modo fiesta, partida guardable/reanudable — con un
banco provisional de 32 preguntas (`data/quienmas/preguntas.js`). El resto de
tarjetas del hub (Verdad o Reto, Preguntas incómodas, Dos mentiras y una
verdad, El Impostor) aún no llevan a ningún sitio: se implementan en las
fases 5-8.

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
este patrón completo: `frases.json` (fuente, 633 entradas) + `frases.js`
(generado) + `agregar.py` (da de alta frases nuevas y regenera el `.js`; nunca
se edita `frases.js` a mano). `data/quienmas/preguntas.js` existe ya, pero
solo como banco **provisional** (32 entradas escritas a mano, la muestra de
`md/PLAN_QUIEN_ES_MAS.md` §9); su `.json` fuente y `agregar.py` llegan con el
banco definitivo (Fase 3 de ese plan). El resto de carpetas de juego siguen
vacías.

## Tecnología

HTML + CSS + JavaScript **vanilla**: sin frameworks, sin dependencias, sin paso
de compilación. PWA instalable y jugable sin conexión. Se publica en GitHub Pages.
