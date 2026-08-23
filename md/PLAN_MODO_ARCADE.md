# Plan de desarrollo — FIEsta 2 · «Verdad o Reto» → **Modo arcade** 🎰

> Documento pensado para que otro agente **sin contexto** pueda implementarlo
> leyendo solo esto, [`md/PLAN_DESARROLLO.md`](PLAN_DESARROLLO.md) y
> [`md/PLAN_VERDAD_O_RETO.md`](PLAN_VERDAD_O_RETO.md).
>
> Esto **no es un juego nuevo del hub**: es una ampliación de «Verdad o Reto»
> (`vr`) y comparte su prefijo, su configuración y sus jugadores.

---

## 1. Contexto mínimo

**FIEsta 2** es una web app (PWA) de juegos de fiesta por turnos que se juega
**pasándose un solo móvil en vertical**. Todo es **HTML + CSS + JavaScript
vanilla**: sin frameworks, sin npm, sin build step, sin CDNs. Es una **SPA de
una sola página**: `index.html` contiene todas las pantallas como
`<section class="pantalla" data-pantalla="…">` y solo la que tiene `.activa` se
ve; se navega con `mostrarPantalla(nombre)`.

Todos los `.js` se cargan con `<script>` desde `index.html` y **viven en el
ámbito global**, así que **todo se prefija** con las dos letras del juego: aquí,
**`vr`** (y `vrMj` para el motor de minijuegos).

El **núcleo compartido** (`js/nucleo/`) ya trae hecho lo que no hay que
reimplementar: jugadores, niveles, modo fiesta, castigos, plantillas,
persistencia y azar (§7 del plan global).

Reglas que no se negocian: **español** en interfaz, código y comentarios; **sin
`// TODO`** (cada fase se entrega completa y funcional); **una fase cada vez**;
y **el usuario prueba la app él mismo en el navegador** — nunca la abras tú para
«comprobar» un cambio visual.

⚠️ **No hay carpeta `img/` y no se crea** (§4.5 del plan global). El arte de los
minijuegos son **sprites de pixel art definidos como matrices de texto en un
`.js`**, más escenarios dibujados con formas simples de canvas.

---

## 2. Qué es el modo arcade

Un **interruptor** en la configuración de «Verdad o Reto». Con él apagado, el
juego es exactamente el de siempre: eliges VERDAD o RETO y sale una carta.

Con él encendido, **elegir RETO ya no te da un reto directamente: te manda a una
ruleta**. La ruleta gira y decide qué te toca de verdad:

- **Reto normal (75 %)** — la carta de reto de siempre.
- **Minijuego (10 %)** — se abre uno de los cuatro minijuegos al azar y tienes
  que sacar una puntuación mínima. Si no llegas, bebes.
- **Test rápido (10 %)** — tres preguntas de cultura general. Por cada fallo,
  chupito.
- **Doble verdad (5 %)** — te libras del reto, pero respondes **dos** verdades
  seguidas.

Elegir VERDAD no pasa por la ruleta nunca: sigue siendo una carta y ya está. La
gracia es que **elegir RETO deja de ser seguro**: puede salirte peor (un
minijuego que no dominas) o mejor (un reto normal como siempre).

---

## 3. Decisiones cerradas (no volver a preguntar)

| Tema | Decisión |
|---|---|
| **Prefijo** | `vr` para todo (estado, funciones, constantes, pantallas, IDs, clases, `localStorage`). El motor de minijuegos usa `vrMj`; cada minijuego, `vrMjPez`, `vrMjGuepardo`, `vrMjZigzag`, `vrMjCanasta`. |
| **Chips de modo (mixto / solo verdades / solo retos)** | ❌ **Se eliminan.** El juego es siempre mixto. Desaparecen `VR_MODOS`, `vrMontarSelectorModo()`, `vrModoEfectivo()`, `#vr-modo` y `#vr-btn-unico`. |
| **Interruptor de arcade** | Ocupa el hueco que dejan los chips, con el mismo componente `.fila-switch` + `montarInterruptor…` que el modo fiesta, pero **propio de la partida** (no global): se elige en `vr-config` y se guarda con la partida, no en una clave aparte. Apagado por defecto. |
| **Cuándo entra la ruleta** | Solo al pulsar **RETO** y solo con arcade encendido. VERDAD nunca pasa por la ruleta. |
| **Quesitos de la ruleta** | **20 quesitos iguales de 18°** (5 % cada uno), para que lo que se ve sea exactamente la probabilidad real. Reparto: **15 reto · 2 minijuego · 2 test rápido · 1 doble verdad** = 75/10/10/5. Los especiales van espaciados (índices 2, 6, 10, 14, 18) para que no queden pegados. |
| **Sorteo** | Se elige un quesito **uniformemente al azar** (los 20 son iguales, así que no hace falta ponderar) y después se anima la rueda hasta él. No se anima "libre" y se lee dónde cae: eso daría sesgos por redondeo. |
| **Volver a girar** | ❌ No. La ruleta decide una vez por turno. Lo que sí queda es «Paso» (con su castigo de siempre) si no quieres hacer lo que ha salido. |
| **Botón «Otra»** | Sigue existiendo tal cual en verdad y en reto normal. **No existe** en minijuego, test rápido ni doble verdad: la ruleta ya ha hablado. |
| **Doble verdad** | Las dos preguntas salen **una detrás de otra**, cada una con su «Hecho»/«Paso». Puede acabar en dos castigos en el mismo turno. La cabecera de la carta lo indica: «VERDAD · 1 de 2». |
| **Test rápido** | 3 preguntas, **4 opciones cada una**, se toca la correcta y la app corrige sola. Categorías: geografía, matemáticas, historia y banderas. **1 chupito por fallo** (0–3 chupitos). |
| **Minijuegos** | Cuatro: **pez** (flappy), **guepardo** (corredor del desierto), **bolita** (zigzag) y **canasta**. Se elige uno al azar. Cada uno tiene un **objetivo fijo** de puntuación. ⚠️ **De momento el sorteo está limitado a la canasta**, a petición del usuario, mientras la afina: ver §13. |
| **Castigo de los minijuegos** | Escalado: llegas al objetivo → nada; te quedas **por encima de la mitad** → 1 chupito; **por debajo de la mitad** → 2 chupitos. |
| **Duración de los minijuegos** | **Nunca más de 60 s.** Los tres de habilidad (pez, guepardo, bolita) **se aceleran un 15 % cada 5 s** para que la partida se resuelva sola, y llevan además un tope duro de 60 s. La **canasta** son **30 s exactos y no acelera** (lo dijo el usuario): su dificultad la pone el aro, que se mueve a velocidad constante. |
| **Modo fiesta** | Los chupitos del test rápido y de los minijuegos **solo se sirven con modo fiesta activo**, igual que el resto de la app. Sin modo fiesta se enseña el resultado («2 de 3», «has hecho 5 de 8») y se pasa turno sin castigo. |
| **Niveles de intensidad** | Filtran verdades y retos como siempre. **No filtran** trivia ni minijuegos: son neutros y salen igual en normal y en picante. |
| **Arte** | **Pixel art** para los personajes (pez, guepardo, pelota, bolita), definido como matrices de caracteres + paleta en `data/verdadreto/sprites.js`. **Escenarios dibujados** con formas simples de canvas (rectángulos, arcos, degradados) usando los tokens de la paleta roja. Cero archivos de imagen. |
| **Orientación** | Todo en **vertical**, como el resto de la app. Ningún minijuego pide girar el móvil. |
| **Quién juega** | **Solo quien tiene el turno.** Los minijuegos y el test son individuales; el resto del grupo mira. |
| **Puntuaciones** | ❌ No hay récords ni ranking entre partidas. Se juega, se bebe o no, y a otra cosa. |
| **Persistencia** | Sigue siendo `"vr_partida"`, con un campo `arcade` nuevo en vez de `modo`. **Nunca** se guarda una ruleta a medias ni un minijuego a medias: al reanudar se vuelve al principio del turno. |

---

## 4. Especificación

### 4.1 Flujo de juego

```
vr-config   Jugadores · niveles · [Modo arcade ⬤] · [Modo fiesta ⬤]
   │
   ▼
vr-turno    "Turno de Ana"        [VERDAD]  [RETO]
   │                                 │         │
   │        ┌────────────────────────┘         │
   │        ▼                                  │
   │    vr-carta (verdad)                      │  arcade OFF
   │    Hecho / Paso / Otra pregunta ──────────┼──────────► vr-carta (reto)
   │                                           │
   │                                  arcade ON▼
   │                                      vr-ruleta
   │                                   [GIRAR] → gira 3,2 s
   │                                           │
   │        ┌──────────────┬───────────────────┼───────────────┐
   │        ▼              ▼                   ▼               ▼
   │   reto normal    doble verdad       test rápido      minijuego
   │        │              │                   │               │
   │   vr-carta      vr-carta ×2          vr-trivia      vr-minijuego
   │   (RETO)        (1 de 2, 2 de 2)     3 preguntas    3·2·1 → juego
   │        │              │                   │               │
   │        └──────────────┴───────────────────┴───────────────┘
   │                              │
   ▼                              ▼
vr-fin  ◄──── [Terminar]     siguiente turno → vr-turno
```

**La ruleta (`vr-ruleta`)**

1. Se entra con el nombre de quien tiene el turno arriba y la rueda quieta.
2. Un botón **«Girar 🎰»**. Al pulsarlo se desactiva y la rueda gira **3,2 s**
   con una curva de frenada larga (`cubic-bezier(.17,.67,.16,1)`), dando 4
   vueltas completas más el ángulo hasta el centro del quesito elegido, con un
   pequeño desvío aleatorio dentro del quesito para que no caiga siempre clavada.
3. Al terminar (`transitionend`) aparece el rótulo del resultado y un botón
   **«Vamos»** que lleva a la pantalla que toque. No hay paso automático: que se
   vea qué ha salido y le dé tiempo al grupo a reaccionar.

**El test rápido (`vr-trivia`)**

Tres preguntas, una a una. Cada una: enunciado grande y cuatro botones de
opción. Al tocar uno, se bloquean los cuatro, el correcto se pinta en verde
(`--color-exito`) y, si has fallado, el que tocaste en ámbar (`--color-fallo`);
1,2 s después pasa a la siguiente. Al acabar las tres: **«2 de 3»** y, con modo
fiesta, un chupito por cada fallo. Botón «Siguiente» → siguiente turno.

**El minijuego (`vr-minijuego`)**

1. Portada: nombre del juego, una línea de cómo se juega y **el objetivo**
   («Pasa 12 corales»). Botón «Empezar».
2. Cuenta atrás **3 · 2 · 1** sobre el canvas ya pintado, para que dé tiempo a
   colocar el dedo.
3. Se juega. Arriba, un HUD con puntuación / objetivo y el tiempo.
4. Fin (por chocar, por agotarse los 60 s o por acabarse los 30 s de la
   canasta): overlay de resultado con la puntuación, el objetivo y el castigo si
   toca. Botón «Siguiente» → siguiente turno.

### 4.2 Modelo de datos

**Estado del juego** — se amplía `vrEstado` (en `js/verdadreto/main.js`):

```js
const vrEstado = {
  nombres: [],
  niveles: [],
  arcade: false,            // ← sustituye a `modo`
  indiceTurno: 0,
  tipoActual: null,         // "verdad" | "reto"
  textoActual: "",
  contador: { verdades: 0, retos: 0, pasos: 0, cambios: 0 },
  repartidorVerdades: null,
  repartidorRetos: null,
  // Nuevo, solo con arcade encendido:
  resultadoRuleta: null,    // "reto" | "minijuego" | "trivia" | "dobleverdad"
  dobleVerdad: null,        // null | { indice: 1|2 }
};
```

**Estado de la ruleta** (`js/verdadreto/arcade.js`) — el reparto de quesitos es
una constante, y cada fase de desarrollo solo cambia esta tabla:

```js
// 20 quesitos iguales de 18°: lo que se ve ES la probabilidad.
// 15 reto · 2 minijuego · 2 trivia · 1 doble verdad = 75/10/10/5.
const VR_RULETA_TIPOS = {
  reto:        { etiqueta: "Reto normal",  emoji: "🎯", color: "var(--color-acento-oscuro)" },
  minijuego:   { etiqueta: "Minijuego",    emoji: "🎮", color: "var(--color-acento-2)" },
  trivia:      { etiqueta: "Test rápido",  emoji: "🧠", color: "#3d7dd6" },
  dobleverdad: { etiqueta: "Doble verdad", emoji: "⭐", color: "var(--color-exito)" },
};

const VR_RULETA_QUESITOS = [
  "reto", "reto", "minijuego", "reto",
  "reto", "reto", "trivia",    "reto",
  "reto", "reto", "minijuego", "reto",
  "reto", "reto", "trivia",    "reto",
  "reto", "reto", "dobleverdad", "reto",
];
```

**Banco de trivia** — `data/verdadreto/trivia.json` (fuente) + `trivia.js`
(generado, `const VR_TRIVIA = […]`). La correcta se guarda **por texto, no por
índice**, y las cuatro opciones se barajan al pintarlas: así es imposible
desincronizar el JSON y no se puede memorizar "siempre es la B".

```json
[
  {
    "categoria": "geografia",
    "pregunta": "¿Cuál es la capital de Australia?",
    "correcta": "Canberra",
    "incorrectas": ["Sídney", "Melbourne", "Perth"]
  },
  {
    "categoria": "banderas",
    "pregunta": "¿De qué país es esta bandera? 🇵🇹",
    "correcta": "Portugal",
    "incorrectas": ["España", "Italia", "Brasil"]
  },
  {
    "categoria": "mates",
    "pregunta": "¿Cuánto es 15 % de 220?",
    "correcta": "33",
    "incorrectas": ["30", "35", "22"]
  },
  {
    "categoria": "historia",
    "pregunta": "¿En qué año cayó el Muro de Berlín?",
    "correcta": "1989",
    "incorrectas": ["1991", "1985", "1993"]
  }
]
```

Las **banderas** van como emoji en el enunciado (`🇵🇹`): son texto, no hacen
falta imágenes. Nada de niveles: la trivia no se filtra.

**Sprites** — `data/verdadreto/sprites.js`. Cada sprite es una paleta + una
matriz de caracteres; `.` es transparente:

```js
const VR_SPRITES = {
  pez: {
    paleta: { "1": "#ff8a3d", "2": "#ffd166", "3": "#2a0d12", "4": "#f9e8ea" },
    pixeles: [
      "....111111....",
      "..11122211.1..",
      ".1112432111 1.",
      "111124321111 1",
      ".1112222111 1.",
      "..11122111.1..",
      "....111111....",
    ],
  },
  // guepardo (3 fotogramas: correr A, correr B, salto), pelota, bolita…
};
```

El motor **pre-renderiza cada sprite una sola vez** a un canvas fuera de
pantalla y luego lo pinta con `drawImage` e `imageSmoothingEnabled = false`
(pintar píxel a píxel con `fillRect` en cada fotograma sería tirar frames a la
basura).

**Definición de un minijuego** — cada uno exporta un objeto con la misma forma,
para que el motor no sepa nada de sus reglas:

```js
const VR_MJ_PEZ = {
  id: "pez",
  nombre: "Pez volador",
  como: "Toca para nadar hacia arriba. Esquiva los corales.",
  objetivo: 12,
  unidad: "corales",
  acelera: true,          // rampa de ×1,15 cada 5 s
  duracionMax: 60,
  iniciar(ctx, ancho, alto) { /* devuelve el estado inicial */ },
  tocar(estado) { /* un toque en la pantalla */ },
  soltar(estado, x, y) { /* solo lo usa la canasta */ },
  actualizar(estado, dt, factor) { /* devuelve { vivo, puntos } */ },
  pintar(ctx, estado) { /* escenario + sprites */ },
};
```

### 4.3 Pantallas y componentes

| Pantalla | Elementos nuevos |
|---|---|
| `vr-config` | Se **quita** `#vr-modo`. Se **añade** `.fila-switch` con «Modo arcade» + `#vr-arcade`, y debajo `<p class="ayuda">` explicando en una línea qué hace. |
| `vr-turno` | Se **quita** `#vr-btn-unico`. `#vr-btn-verdad` y `#vr-btn-reto` pasan a estar siempre visibles. |
| `vr-carta` | Sin cambios de estructura. `#vr-carta-tipo` pasa a poder decir «VERDAD · 1 de 2». |
| **`vr-ruleta`** *(nueva)* | `#vr-ruleta-turno` (h1), `#vr-ruleta-svg` (la rueda, SVG generado por JS), `#vr-ruleta-marcador` (el puntero fijo arriba), `#vr-btn-girar`, `#vr-ruleta-resultado` (oculto hasta que para), `#vr-btn-ruleta-ir` (oculto hasta que para), `#vr-ruleta-leyenda` (los 4 tipos con su color y su porcentaje). |
| **`vr-trivia`** *(nueva)* | `#vr-trivia-progreso` («Pregunta 2 de 3»), `#vr-trivia-categoria`, `#vr-trivia-pregunta`, `#vr-trivia-opciones` (4 botones generados), `#vr-trivia-resultado` (oculto), `#vr-trivia-castigo` (oculto), `#vr-btn-trivia-siguiente` (oculto). |
| **`vr-minijuego`** *(nueva)* | `#vr-mj-portada` (nombre + cómo se juega + objetivo + `#vr-btn-mj-empezar`), `#vr-mj-lienzo` (contenedor con `#vr-mj-canvas` y `#vr-mj-hud`), `#vr-mj-cuenta` (el 3·2·1), `#vr-mj-final` (overlay: `#vr-mj-marcador`, `#vr-mj-castigo`, `#vr-btn-mj-siguiente`). |

Las tres pantallas nuevas llevan su **«Terminar»** al pie, como el resto de `vr`.

### 4.4 Qué del núcleo se usa y qué es propio

**Del núcleo, tal cual:** `mostrarPantalla()`, `barajar()`, `elegirAlAzar()`,
`enteroAleatorio()`, `crearRepartidor()` (también para la trivia),
`guardarJSON`/`cargarJSON`/`borrarGuardado`, `modoFiestaActivo()`,
`filtrarPorNivel()`, `rellenarPlantilla()`, `montarInterruptorModoFiesta()`
(como patrón para el interruptor de arcade).

**Propio de este bloque:** la ruleta entera, el motor de minijuegos, los cuatro
minijuegos, el pintado de sprites, la pantalla de trivia y el castigo escalado
(el núcleo solo tiene `castigoAlAzar()`/`castigoPonderado()`, que devuelven
frases; aquí el castigo es literalmente «N chupitos», así que se compone aquí).

---

## 5. Convenciones para no chocar con los otros juegos

**Archivos nuevos**

```
data/verdadreto/trivia.json     fuente del banco de trivia
data/verdadreto/trivia.js       generado (const VR_TRIVIA)
data/verdadreto/sprites.js      pixel art (const VR_SPRITES)
js/verdadreto/arcade.js         ruleta + enrutado + doble verdad + trivia
js/verdadreto/minijuegos.js     motor común (bucle, canvas, HUD, sprites, final)
js/verdadreto/mj-pez.js         VR_MJ_PEZ
js/verdadreto/mj-guepardo.js    VR_MJ_GUEPARDO
js/verdadreto/mj-zigzag.js      VR_MJ_ZIGZAG
js/verdadreto/mj-canasta.js     VR_MJ_CANASTA
```

**Orden de los `<script>` en `index.html`** (§6.2 del plan global): los `data/`
van con los demás bancos; los `js/verdadreto/` van **después** de
`js/verdadreto/main.js` y **antes** de `js/nucleo/arranque.js`, en este orden:
`minijuegos.js` → los cuatro `mj-*.js` → `arcade.js` (el último, porque su
`DOMContentLoaded` necesita que las constantes de los minijuegos existan).

**`agregar_trivia.py`**: script propio, hermano de `agregar.py`, del que importa
`cargar` y `guardar`. Va aparte y no como un `BANCOS["trivia"]` más porque la
forma del banco es distinta: verdades y retos son `{texto, nivel}`, y una
pregunta es `{categoria, pregunta, correcta, incorrectas}`; meterlo en el flujo
interactivo de `agregar.py` habría obligado a bifurcarlo entero. Como en el
resto del proyecto, **`trivia.js` no se edita a mano nunca**: se regenera.

**CSS**: un bloque nuevo al final de la sección de `vr` en `css/estilos.css`,
con el comentario `/* Verdad o Reto — modo arcade */`. Clases `.vr-ruleta-*`,
`.vr-trivia-*`, `.vr-mj-*`.

**`sw.js`**: los **nueve archivos nuevos** hay que añadirlos a `ARCHIVOS`, o la
app instalada se romperá sin conexión. Es lo que más se olvida.

**Versión**: `APP_VERSION` (`js/nucleo/arranque.js`) y `CACHE` (`sw.js`) suben
juntos en cada fase. La Fase A es **1.11.0**.

---

## 6. Desarrollo por fases

Cada fase deja la app **completa y jugable**, sin TODOs. La rueda se define en
`VR_RULETA_QUESITOS` y **cada fase solo cambia esa tabla** para dar de alta el
resultado que acaba de implementar: nunca hay un quesito que lleve a un sitio
que no existe.

---

### Fase A — Fuera los modos, entra el arcade: ruleta + doble verdad

🎯 **Objetivo:** sustituir los chips de modo por el interruptor de arcade y
tener la ruleta girando de verdad, con dos resultados posibles.

🛠️ **A construir**
- Eliminar `VR_MODOS`, `vrMontarSelectorModo()`, `vrModoEfectivo()`, `#vr-modo`,
  `#vr-btn-unico` y el campo `modo` del estado y del guardado.
- `vrIniciarMotor()`: ahora siempre necesita los dos bancos. Si uno se queda
  vacío tras filtrar, se avisa y solo sale el otro tipo (el botón del tipo sin
  contenido se oculta en `vr-turno`).
- Interruptor `#vr-arcade` en `vr-config`, guardado en `vr_partida`.
- Pantalla `vr-ruleta` con la rueda en SVG generada por JS: 20 quesitos, colores
  y emoji por tipo, marcador fijo arriba, leyenda con los cuatro tipos y sus
  porcentajes **ya definitivos** (75/10/10/5), aunque dos de ellos aún no
  aparezcan en la rueda de esta fase.
- Giro: elegir quesito al azar → animar → `transitionend` → resultado + «Vamos».
- `VR_RULETA_QUESITOS` de esta fase: **19 reto · 1 doble verdad**.
- Doble verdad: dos verdades seguidas, cada una con su Hecho/Paso, cabecera
  «VERDAD · 1 de 2» / «· 2 de 2», sin «Otra».

✅ **Criterios de aceptación**
- Con arcade apagado el juego se comporta **exactamente** como antes (salvo que
  ya no hay chips de modo y siempre es mixto).
- Con arcade encendido, RETO lleva a la ruleta; VERDAD no.
- La rueda para **siempre** con el marcador dentro del quesito anunciado.
- Una partida guardada con la versión anterior (que tiene `modo` y no `arcade`)
  se reanuda sin romperse, con el arcade apagado.

🔍 **Qué debe probar el usuario:** encender el arcade y pulsar RETO diez o doce
veces seguidas para ver que la ruleta se siente bien (velocidad de giro, frenada,
legibilidad de los quesitos en su móvil) y que la doble verdad sale de vez en
cuando.

---

### Fase B — Banco de contenido: test rápido (200 preguntas)

🎯 **Objetivo:** el quesito de test rápido, con su banco.

🛠️ **A construir**
- `data/verdadreto/trivia.json` con **200 preguntas: 50 de geografía, 50 de
  mates, 50 de historia y 50 de banderas**, en el formato de §4.2. Dificultad de
  bar: que un adulto medio acierte más o menos la mitad. Los tres distractores
  tienen que ser **plausibles** (si la respuesta es un año, los tres fallos son
  años cercanos), o el test no tiene gracia.
- `trivia.js` generado + `BANCOS["trivia"]` en `agregar.py`.
- Pantalla `vr-trivia`: 3 preguntas de un repartidor sin repetición, 4 opciones
  barajadas, corrección inmediata con color, 1,2 s de pausa, resumen final y un
  chupito por fallo con modo fiesta.
- `VR_RULETA_QUESITOS`: **17 reto · 2 test rápido · 1 doble verdad**.

✅ **Criterios de aceptación**
- Las tres preguntas de un mismo test nunca se repiten entre sí.
- La correcta no cae siempre en la misma posición.
- Sin modo fiesta se ve el resultado pero no se manda beber a nadie.

🔍 **Qué debe probar el usuario:** varias tandas seguidas, sobre todo para
juzgar el **nivel** de las preguntas y podarlas/reescribirlas él, como con los
demás bancos.

> **Por qué 200 y no ≥ 400** como en los bancos principales: la trivia sale en
> el 10 % de los retos y consume 3 entradas por vez. Con 200 preguntas hacen
> falta ~67 tests para agotarla, muchísimas más partidas de las que da un banco
> de verdades. Si al probarlo se queda corto, se amplía.

---

### Fase C — Motor de minijuegos + el pez

🎯 **Objetivo:** toda la infraestructura de canvas funcionando, estrenada con el
primer minijuego.

🛠️ **A construir**
- `data/verdadreto/sprites.js` con el pez (2 fotogramas de aleta).
- `js/verdadreto/minijuegos.js`: canvas escalado por `devicePixelRatio`, bucle
  `requestAnimationFrame` con `dt` acotado a 50 ms (un frame lento no debe
  teletransportar nada), rampa de velocidad ×1,15 cada 5 s, tope de 60 s, HUD,
  cuenta atrás 3·2·1, overlay de resultado con castigo escalado, y **limpieza
  completa** (cancelar el rAF y quitar los listeners) al salir por cualquier vía.
- `js/verdadreto/mj-pez.js`: el pez sube al tocar y cae con gravedad; parejas de
  corales arriba/abajo con un hueco; +1 por hueco pasado; muere al tocar coral o
  borde. **Objetivo: 12.** Al acelerar, el hueco se estrecha un poco (con un
  mínimo, para que no sea imposible).
- Escenario dibujado: degradado de agua, corales como rectángulos redondeados y
  burbujas de fondo.
- `VR_RULETA_QUESITOS`: **15 reto · 2 minijuego · 2 test · 1 doble verdad** —
  ya el reparto definitivo 75/10/10/5, con el pez como único minijuego posible.

✅ **Criterios de aceptación**
- El canvas se ve nítido (no borroso) en pantallas de alta densidad.
- Ninguna partida dura más de 60 s.
- Salir con «Terminar» a mitad de juego no deja el bucle corriendo por detrás.

🔍 **Qué debe probar el usuario:** si el objetivo de 12 es razonable y si el
control responde bien al tacto en su móvil.

---

### Fase D — El guepardo

🎯 **Objetivo:** segundo minijuego.

🛠️ **A construir**
- Sprite del guepardo (2 fotogramas de carrera + 1 de salto).
- `mj-guepardo.js`: desierto con scroll, cactus y rocas de alturas variadas,
  toque = salto (con gravedad, sin doble salto), +1 por obstáculo esquivado.
  **Objetivo: 12.**
- Escenario: duna de fondo con parallax lento, suelo y sol.
- El minijuego se elige al azar entre **dos**.

✅ **Criterios de aceptación:** el salto siempre da para pasar el obstáculo más
alto si se pulsa a tiempo (nada de situaciones imposibles).

---

### Fase E — La bolita (zigzag)

🎯 **Objetivo:** tercer minijuego.

🛠️ **A construir**
- `mj-zigzag.js`: la bola avanza sola por un camino estrecho en diagonal; cada
  toque alterna entre las dos direcciones (↗ / ↘); el camino se va generando por
  delante con giros de 90°; si te sales, caes y se acaba. +1 por tramo
  recorrido. **Objetivo: 20.**
- Escenario: fondo oscuro, camino en `--color-superficie` con borde de acento,
  cámara que sigue a la bola.
- El minijuego se elige al azar entre **tres**.

✅ **Criterios de aceptación:** el camino generado siempre es transitable (nunca
un giro imposible de tomar a la velocidad actual).

---

### Fase F — La canasta y afinado final

🎯 **Objetivo:** cuarto minijuego y calibrado de los cuatro objetivos.

🛠️ **A construir**
- Sprite de la pelota.
- `mj-canasta.js`: **30 s**, sin rampa. **En tres dimensiones**, a diferencia de
  los otros tres minijuegos (petición del usuario: «que haya una sensación de
  distancia a la canasta, no que parezca que esté encima», tipo *Game Pigeon*).
  La pelota se mueve en un mundo en **metros** (`x` lateral, `y` altura, `z`
  distancia) con gravedad real de 9,8 m/s², y se proyecta con una cámara de
  perspectiva de verdad. Se arrastra el dedo hacia arriba desde la pelota: el
  componente vertical del gesto da la potencia (repartida entre altura y
  distancia en proporción fija, que es lo que mantiene el arco reconocible) y el
  lateral apunta a izquierda o derecha. El aro está a **5,5 m**, a la altura
  reglamentaria de **3,05 m**, y se desplaza en horizontal a velocidad constante
  (ahí está la dificultad, ya que este juego no acelera). Rebote en hierro y
  tablero. Canasta = +1. **Objetivo: 6.**
- **La sensación de distancia** sale de cuatro cosas, no de una: la pista
  converge hacia el horizonte (líneas de fondo que se juntan y laterales que
  convergen), la pelota **encoge a menos de un tercio** mientras vuela, su
  **sombra** corre por el suelo, y el aro se dibuja en dos mitades (la de atrás
  antes que la pelota y la de delante después) para que una canasta se vea
  **pasar por dentro**.
- ⚠️ Dos licencias deliberadas, las dos para que el aro se **vea**: el radio es
  **0,32 m** y no los 0,225 reglamentarios (con el bueno, a esta distancia el
  aro sale a 41 px en un móvil), y la elipse se dibuja **más abierta de lo que
  tocaría** (proyectada de verdad mide dos píxeles de alto y se lee como una
  raya).
- **El suelo es una pista, no una cuadrícula**: parqué con las duelas corriendo
  hacia el fondo (solo en el sentido de la profundidad — cruzarlas también a lo
  ancho da un tablero de ajedrez, no una cancha), la línea de fondo por detrás
  del tablero, el semicírculo de la zona restringida bajo la canasta y una marca
  a la altura del tirador. El semicírculo se proyecta **punto a punto**: en
  perspectiva, un círculo del suelo no es una elipse centrada en su propio
  centro, así que `ctx.ellipse` daría una forma mal colocada.
- Línea de puntos que previsualiza el tiro mientras arrastras.
- El minijuego se elige al azar entre **los cuatro**.
- Repasar los cuatro objetivos con lo que haya visto el usuario probando y
  ajustarlos.

✅ **Criterios de aceptación**
- En 30 s da tiempo a **al menos 15 tiros**, o el objetivo de 6 no es alcanzable.
- La física es **independiente de los fps**: el mismo gesto tiene que dar el
  mismo tiro en una pantalla de 60 Hz y en una de 120 Hz.

🔍 **Qué debe probar el usuario:** los cuatro seguidos, para decidir los
objetivos definitivos.

---

## 7. Casos borde

| Caso | Qué hace la app |
|---|---|
| **Partida guardada de una versión anterior** (tiene `modo`, no tiene `arcade`) | Se reanuda con `arcade: false`. El campo `modo` viejo se ignora. |
| **Recarga a mitad de una ruleta / trivia / minijuego** | Se vuelve al **principio del turno** (`vr-turno`), como ya pasa con las cartas: no se serializa nada a medias. |
| **«Terminar» a mitad de un minijuego** | Se corta el bucle, se quitan los listeners y se va a `vr-fin`. Sin castigo por lo que estuviera a medias. |
| **La app pasa a segundo plano** (llamada, bloqueo de pantalla) | El `dt` acotado a 50 ms evita el salto gigante al volver. Además, con `visibilitychange` el juego se pausa y muestra «Toca para seguir». |
| **Banco de verdades vacío tras filtrar** | El botón VERDAD se oculta y **doble verdad sale de la ruleta** (se sustituye ese quesito por reto). |
| **Banco de retos vacío tras filtrar** | El botón RETO se oculta: sin RETO no hay ruleta, y el arcade queda inerte esa partida. Se avisa en `vr-config`. |
| **Doble verdad con el banco casi agotado** | El repartidor rebaraja como siempre; si las dos preguntas salieran iguales (banco de 1), se sirve una sola y se avisa. |
| **Trivia sin las 3 preguntas disponibles** | Imposible con el banco de 200, pero si el banco quedara con menos de 3, el test se hace con las que haya. |
| **Pantallas muy bajas** (móviles pequeños, barra del navegador) | El canvas se mide con `getBoundingClientRect()` del contenedor, no con `innerHeight`, y se redimensiona en `resize`. |
| **`prefers-reduced-motion`** | La ruleta no gira: enseña el resultado directamente tras una pausa breve. Los minijuegos sí funcionan (son el juego, no decoración). |
| **Dedo fuera del canvas al arrastrar en la canasta** | El tiro se resuelve igual con `pointerup`/`pointercancel` capturados en el contenedor. |

---

## 8. Checklist

**Fase A — Ruleta y doble verdad**
- [x] Chips de modo eliminados (`VR_MODOS`, `vrMontarSelectorModo`, `vrModoEfectivo`, `#vr-modo`, `#vr-btn-unico`)
- [x] Interruptor «Modo arcade» en `vr-config`, guardado con la partida
- [x] Pantalla `vr-ruleta` con la rueda SVG de 20 quesitos, marcador y leyenda
- [x] Giro animado que para siempre en el quesito anunciado
- [x] Doble verdad: dos verdades seguidas con su Hecho/Paso
- [x] Compatibilidad con partidas guardadas antiguas
- [x] `APP_VERSION` + `CACHE` a 1.11.0, `sw.js` actualizado
- [x] `README.md` y `md/PLAN_VERDAD_O_RETO.md` al día

**Fase B — Test rápido**
- [x] `trivia.json` con 200 preguntas (50 × 4 categorías)
- [x] `trivia.js` generado + `BANCOS["trivia"]` en `agregar.py`
- [x] Pantalla `vr-trivia` con corrección inmediata y opciones barajadas
- [x] Un chupito por fallo, solo con modo fiesta
- [x] Quesitos a 17/2/1

**Fase C — Motor + pez**
- [x] `sprites.js` con el pez y el pintado cacheado en canvas offscreen
- [x] `minijuegos.js`: bucle, HUD, cuenta atrás, rampa, tope de 60 s, limpieza
- [x] `mj-pez.js` con objetivo 12
- [x] Castigo escalado (0 / 1 / 2 chupitos)
- [x] Quesitos al reparto definitivo 15/2/2/1

**Fase D — Guepardo**
- [x] Sprite de 3 fotogramas
- [x] `mj-guepardo.js` con objetivo 15
- [x] Sorteo entre 2 minijuegos

**Fase E — Bolita**
- [x] `mj-zigzag.js` con objetivo 20 y camino siempre transitable
- [x] Sorteo entre 3 minijuegos

**Fase F — Canasta**
- [x] `mj-canasta.js` con arrastrar-y-soltar, 30 s y objetivo 8
- [x] Sorteo entre los 4 minijuegos
- [x] Objetivos de los cuatro afinados con el usuario

---

## 9. Lo que he decidido por defecto (dime si cambias algo)

Cosas que no pregunté para no alargar, pero que son decisiones reales:

1. **La ruleta no se puede volver a girar.** Decide una vez por turno; si no te
   gusta lo que sale, «Paso» con su castigo.
2. **«Otra» desaparece en los tres resultados especiales**, y sigue igual en el
   reto normal.
3. **VERDAD nunca pasa por la ruleta**, tal y como lo planteaste.
4. **El aro de la canasta se mueve** a velocidad constante desde el segundo 0.
   No es una aceleración (respeta que la canasta no acelere), pero es lo que
   hace que 30 s tengan tensión. Si lo prefieres quieto, se quita.
5. **Los chupitos solo se sirven con modo fiesta.** Sin él, se enseña el
   resultado y a otra cosa.
6. **Los minijuegos no filtran por nivel**: salen igual en normal y en picante.
7. **No hay récords ni ranking**: coherente con que `vr` no tenga puntuación.
8. **Los objetivos (12 / 12 / 20 / 6) son una primera estimación** y se afinan
   cuando los pruebes: ver §10.

---

## 10. Estado: implementado (v1.11.0)

Las seis fases están hechas y subidas de una vez. Lo que se apartó del plan, y
por qué:

| Punto del plan | Qué se hizo | Motivo |
|---|---|---|
| `BANCOS["trivia"]` dentro de `agregar.py` | Script aparte, `agregar_trivia.py` | La forma del banco es distinta (`{categoria, pregunta, correcta, incorrectas}` frente a `{texto, nivel}`) y habría obligado a bifurcar todo el flujo interactivo. Importa `cargar`/`guardar` de `agregar.py`, así que la lógica de ficheros no se duplica. |
| Guepardo: objetivo 15 | **12** | Ver abajo. |
| Canasta: objetivo 8 | **6** | Ver abajo. |
| Canasta: nueva pelota al salir de pantalla | Nueva pelota **0,6 s después de encestar** | Esperar a que la pelota llegara al suelo se comía casi un segundo por canasta: en 30 s eso son dos o tres tiros perdidos. |

### Calibrado: por qué estos números y no otros

Los cuatro minijuegos se probaron con un **bot** que juega cada uno con la
estrategia óptima (el pez apunta al centro del hueco, el guepardo salta por
tiempo hasta el impacto, la bolita gira justo en la esquina, la canasta resuelve
la parábola y **anticipa** dónde estará el aro). Doce partidas de cada uno. La
idea no es que el bot represente a un jugador humano —juega mucho mejor—, sino
detectar lo que un humano no podría distinguir de «se me da mal»: que algo sea
directamente **imposible**.

Y saltaron dos cosas que no se habrían visto jugando a mano:

**El guepardo era imposible de pasar, incluso a velocidad 1.** No basta con que
el salto sea más alto que el cactus: hay que estar por encima el tiempo
suficiente para que el cactus termine de pasar por debajo. Con el impulso
original (sube 0,21 altos, 0,69 s en el aire) el guepardo pasaba 0,39 s por
encima del obstáculo más alto, y a la velocidad de salida eso son 93 px de
recorrido — menos que los 111 px que ocupan guepardo y cactus juntos. Chocaba
siempre. Arreglado subiendo el salto (0,35 altos, 0,97 s en el aire), bajando el
cactus más alto de 0,16 a 0,14 y estrechando la caja de colisión, que incluía
cola y patas traseras.

**En la canasta, un tirador perfecto metía 5 de objetivo 6.** El tiro necesitaba
tanto arco que había que arrastrar el dedo por casi toda la pantalla, y encima
cada canasta gastaba un segundo viendo caer la pelota al suelo. Se bajó la
gravedad (2,4 → 1,8), se subió la fuerza del gesto (3,2 → 4,5) y el aro va algo
más lento (0,2 → 0,14 anchos/s). Ahora el bot perfecto mete 11, así que 6 es
exigente pero alcanzable.

Con eso, el bot óptimo saca (mediana de 12 partidas):

| Minijuego | Objetivo | Bot óptimo | Lectura |
|---|---|---|---|
| Pez | 12 | 20 | Holgado: un humano decente llega. |
| Guepardo | 12 | 11 | El bot salta con antelación fija y no es especialmente bueno; el techo que alcanzó fue 27. |
| Bolita | 20 | 149 | El bot es *imbatible* aquí (gira siempre en el píxel exacto), así que su cifra no dice nada. 20 es lo que sale a los ~12 s de juego humano. |
| Canasta | 6 | 19 | El bot resuelve la parábola exacta y **mete todas**: 19 tiros en 30 s. El objetivo pide acertar un tercio de eso. |

**Estos objetivos siguen siendo provisionales**: el bot no se pone nervioso, no
tiene el móvil pringado ni ha bebido. Ajústalos jugando.

### Qué está probado y qué no

Hay una prueba de humo con jsdom (85 comprobaciones) que cubre: que los chips de
modo ya no existen, que el arcade sale y entra bien, **300 giros de ruleta
comprobando que siempre para en el quesito que anuncia**, la doble verdad con
Hecho y con Paso, el test rápido entero (incluido que la correcta aparece en las
cuatro posiciones), el castigo escalado, que los cuatro minijuegos terminan
solos y nunca pasan de 60 s, que salir con «Terminar» corta el bucle, y que una
partida guardada por la versión anterior (con `modo` y sin `arcade`) se reanuda
sin romperse.

Lo que **no** puede probar jsdom, y tienes que mirar tú en el móvil: cómo se ve
la ruleta girando, si el pixel art se lee a ese tamaño, si los controles
responden bien al dedo, y si los escenarios quedan bonitos. El guepardo, en
concreto, es el sprite más tosco de los cuatro.

---

## 11. Revisión: la canasta, rehecha en 3D (v1.11.1)

Al probarlo, el usuario pidió que la canasta se pareciera al baloncesto de
*Game Pigeon*: **«que haya una sensación de distancia a la canasta, no que
parezca que esté encima»**. Tenía razón — la primera versión era plana: aro y
pelota vivían en el mismo plano 2D, así que el aro no estaba *lejos*, estaba
*arriba*.

Rehecha entera. Ahora la pelota se mueve en un mundo de tres dimensiones en
metros con gravedad real, proyectado con una cámara de perspectiva. Lo que
transmite la distancia no es una cosa sino cuatro, y las cuatro hacen falta:

1. **La pista converge** hacia el horizonte: las líneas de fondo se van juntando
   y las laterales se cierran. Es la que más pesa.
2. **La pelota encoge**: 35 px de radio en la mano, 11 px al llegar al aro.
3. **La sombra** en el suelo dice a qué altura y a qué distancia va — sin ella
   no se distingue un tiro corto de uno bajo.
4. **El aro se dibuja en dos mitades**, la de atrás antes que la pelota y la de
   delante después, para que una canasta se vea *pasar por dentro* y no por
   encima.

Efecto secundario agradable: como el mundo está en metros, `redimensionar` en
este minijuego solo tiene que rehacer la cámara. Los otros tres, que trabajan en
píxeles, tienen que reescalar a mano todo lo que hay en pantalla.

### Un fallo que solo se ve midiendo: la física dependía de los fps

Con el modelo nuevo se puede *calcular* cuál es el tiro perfecto y comprobar que
el juego lo trata como tal. No lo hacía: el tiro analíticamente perfecto cruzaba
el plano del aro **15 cm corto**, a 5 mm de no contar como canasta.

La causa era el integrador. Estaba así:

```js
p.vy -= G * dt;      // primero la gravedad
p.y  += p.vy * dt;   // y luego se avanza con la velocidad YA nueva
```

Eso (Euler semi-implícito) deja la parábola por debajo de la real en `½·g·Δt·t`
— un error **proporcional al tamaño del fotograma**. En una pantalla de 60 Hz el
tiro se quedaba corto; en una de 120 Hz, Δt es la mitad y el error también, así
que **el mismo gesto habría dado un tiro distinto según el móvil**. Un jugador
lo habría vivido como «este juego va raro», nunca como un bug.

Arreglado usando la velocidad media del paso, que para aceleración constante es
exacto:

```js
p.y  += p.vy * dt - 0.5 * G * dt * dt;
p.vy -= G * dt;
```

Ahora el tiro perfecto entra limpio (distancia al centro del aro: 0,000 m) y el
bot mete **exactamente las mismas 19 canastas a 30, 60 y 120 fps**.

Los otros tres minijuegos no arrastran este problema: en ellos la gravedad
gobierna un salto o una caída donde unos centímetros no cambian nada, y no hay
ningún «tiro exacto» que deba cuadrar.

---

## 12. Segunda revisión de la canasta (v1.11.2)

Cuatro cosas que reportó el usuario probándola. Las cuatro eran ciertas; tres
eran errores y una, un fallo de diseño.

**«No rebota siempre que le das al tablero.»** El choque contra el tablero se
comprobaba con la altura de la pelota **al final del fotograma**, no en el
instante del choque. La pelota cruzaba el plano del tablero a la altura correcta
pero, para cuando terminaba el paso, ya estaba por encima o por debajo del
rectángulo, así que el rebote no se disparaba. Ahora se interpola la posición
exacta del cruce (y también la del aro, que se mueve), igual que ya se hacía con
el plano del aro.

**«No acaba cuando toca el suelo»** y **«a veces se va por debajo del suelo»**
eran el mismo error: al tocar el parqué solo se programaba la siguiente pelota,
pero la física seguía corriendo, así que la pelota atravesaba el suelo y se
hundía. Ahora el suelo es un suelo: la pelota se queda encima, da un bote corto
y se para; por debajo de cierta energía se detiene del todo, que si no tirita en
el sitio hasta que aparece la siguiente.

**«La canasta es muy pequeña.»** Lo era: 41 px de ancho en un móvil de 390, un
10 % de la pantalla. Se acercó el aro (6,6 → 5,5 m), se agrandó el radio
(0,225 → 0,32 m, ya no reglamentario) y se subió la distancia focal. Ahora mide
**78 px, un 20 % del ancho**, y la pelota sigue encogiendo 2,4 veces durante el
vuelo, que es lo que sostiene la sensación de distancia.

⚠️ **Efecto secundario a vigilar:** el aro más grande y más cerca hace el juego
**bastante más fácil**, y el objetivo sigue en 6. Si al jugarlo te sale gratis,
súbelo a 7 u 8.

### De paso: un `dt` negativo podía hacer correr el juego hacia atrás

Montando las pruebas apareció que el bucle acotaba el paso de tiempo solo por
arriba (`Math.min(dt, 0.05)`). Un `dt` negativo hacía retroceder el juego —
incluida la cuenta atrás, que en vez de bajar subía. Con `requestAnimationFrame`
real los tiempos son monótonos y no debería ocurrir nunca, pero acotar también
por abajo cuesta una llamada a `Math.max` y elimina toda una familia de fallos
imposibles de diagnosticar.

### Qué se comprueba ahora

Una prueba específica de la canasta, aparte de la de humo general:

| Comprobación | Cómo |
|---|---|
| La pelota nunca atraviesa el parqué | 250 tiros al azar; se mira la altura mínima de toda la trayectoria. |
| Tocar el suelo termina el tiro | Un tiro corto: tiene que llegar al suelo, programar la siguiente pelota y acabar quieta, no hundiéndose. |
| El tablero rebota siempre | Se calcula **analíticamente** qué 137 tiros deberían darle (excluyendo los que el hierro intercepta antes) y se comprueba que los 137 vuelven. |
| La física no depende de los fps | El mismo tiro a 30, 60 y 120 fps tiene que acabar en el mismo punto. |

Las dos últimas costaron más de escribir que de arreglar, y las dos fallaron
primero **por culpa de la prueba, no del juego**: la del tablero buscaba el cruce
en el historial, pero al rebotar el juego recoloca la pelota justo delante del
plano y el cruce nunca llega a grabarse; y la de los fps comparaba instantes
distintos, porque redondear «0,9 s» a un número entero de fotogramas da
duraciones diferentes en cada frecuencia. Merece la pena anotarlo: una prueba en
rojo aquí es tan probable que sea culpa suya como del código.

---

## 13. Solo la canasta en el sorteo (v1.11.3, temporal)

A petición del usuario, mientras sigue probando la canasta el quesito de
«minijuego» **sirve siempre la canasta**. Los otros tres no se han tocado:
funcionan igual, simplemente están fuera del sorteo.

Está hecho para deshacerse en una línea, en `js/verdadreto/arcade.js`:

```js
const VR_MINIJUEGOS_TODOS = [VR_MJ_PEZ, VR_MJ_GUEPARDO, VR_MJ_ZIGZAG, VR_MJ_CANASTA];
const VR_MINIJUEGOS = [VR_MJ_CANASTA];   // ← devolver los cuatro: = VR_MINIJUEGOS_TODOS
```

No hay ningún otro sitio que dependa de esto: la ruleta sigue con sus dos
quesitos de minijuego y sus probabilidades intactas (75/10/10/5), y la prueba de
humo sigue ejercitando los cuatro minijuegos uno a uno aunque solo uno salga
sorteado.
