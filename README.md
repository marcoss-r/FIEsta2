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

✅ **Fases 0, 1 y 2 completas**. Los cinco juegos ya se juegan de principio a
fin, cada uno con su banco de contenido **provisional** (pendiente de su fase
de contenido definitivo, a cuatro manos con el usuario), salvo «Dos mentiras y
una verdad», que ya tiene su banco cerrado:

- **«Yo nunca»** (🚧 Fase 3 en curso) — jugadores y niveles (el más fuerte se
  llama «Salseo», no «Extremo»), modo fiesta, rotación de quien lee, partida
  guardable/reanudable, 674 frases en el banco (`data/yonunca/frases.json` +
  `frases.js` generado + `agregar.py`), mezclando confesiones («he...») e
  hipotéticas («probaría...»); pendiente de que el usuario lo recorte y afine.
- **«Quién es más…»** (🚧 Fase 4 en curso) — chips de nivel propios del
  juego (**Normal** / **Picante**, no los tres del núcleo: picante agrupa
  pareja, sexo, infidelidades, drogas, alcohol, tabaco, adicciones, racismo,
  machismo, homofobia y orientación sexual), encabezado dinámico, castigo
  por pregunta con modo fiesta, banco de 570 preguntas (337 normal / 233
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
  de 873 verdades (421 suave / 251 picante / 201 extremo) + 710 retos (414 /
  159 / 137), tras fusionar el contenido no duplicado de «Preguntas
  incómodas» (el sexto juego original, eliminado) y una tanda de 222 verdades
  + 350 retos importados y adaptados a la voz del juego (retos pasados de
  infinitivo a imperativo) desde una recopilación externa, pendiente de que
  el usuario la revise y pode (`data/verdadreto/verdades.json` + `retos.json`
  + `.js` generados + `agregar.py`).
- **«Dos mentiras y una verdad»** (✅ Fases 1-5 completas) — la app da el
  **tema** (o la frase ya empezada, tipo `arranque`) para que nadie se quede
  en blanco; el tema se ve a la vista de todo el grupo, «Otro tema» hasta 2
  veces por turno sin castigo, temporizador opcional de 60 s (propio del
  juego, no confundir con el modo fiesta) que al agotarse pasa solo a la
  vista de contar, y castigo (`castigoAlAzar()`) si el modo fiesta está
  activo. Banco de **160 temas** (80 `tema` + 80 `arranque`, 32/32/16 por
  nivel en cada tipo; objetivo reducido de ≥ 400 a 160 a petición del
  usuario, con temas **amplios** para poder inventar mentiras y recordar
  verdades con facilidad), `data/dosmentiras/temas.json` + `.js` generado +
  `agregar.py` (`md/PLAN_DOS_MENTIRAS.md`), pendiente de que el usuario lo
  pruebe y lo revise.
- **«El Impostor»** (🚧 Fase 4 en curso) — todos reciben la misma palabra
  secreta menos el impostor (o los dos impostores, a partir de 7 jugadores,
  que no se conocen entre sí), que solo recibe una pista; reparto secreto con
  el **handoff** del núcleo (el contenido nunca existe en el DOM antes de
  «Ver mi palabra» ni después de «Ocultar y pasar»), steppers propios de
  impostores (1-2) y rondas de palabras (1-3, el primero en hablar nunca es
  el impostor), acusación por selección única y revelación con los tres casos
  (1 impostor, 2 acertados, 2 con uno escapado) y castigo con modo fiesta.
  Este juego **no guarda la partida en curso** (reanudar a medias filtraría
  quién es el impostor): solo recuerda la configuración
  (`"im_config"`, botón «Usar la última configuración»), nunca el reparto ni
  el progreso — recargar a mitad de un reparto siempre vuelve a la
  configuración. Banco **provisional** de 28 palabras con su pista escrita a
  mano (`data/impostor/palabras.js`, tomadas de `md/PLAN_EL_IMPOSTOR.md` §9),
  pendiente de su Fase 4 (banco definitivo, ≥ 400 palabras, a cuatro manos con
  el usuario).

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
se edita `frases.js` a mano). `data/quienmas/` (570 entradas),
`data/verdadreto/` (651 verdades + 360 retos) y `data/dosmentiras/` (160
temas) siguen el mismo patrón. `data/impostor/` de momento solo tiene
`palabras.js` (28 palabras de muestra, sin `.json` ni `agregar.py` todavía):
el patrón completo llega con su Fase 4.

## Tecnología

HTML + CSS + JavaScript **vanilla**: sin frameworks, sin dependencias, sin paso
de compilación. PWA instalable y jugable sin conexión. Se publica en GitHub Pages.
