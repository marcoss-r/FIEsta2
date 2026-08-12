# Plan de desarrollo — **FIEsta 2** 🍒

> **Para quién es este documento:** para un agente (o persona) que **no ha visto
> nunca este proyecto ni el anterior**. Aquí está todo: qué hay que construir,
> qué se copia de la app original, qué se decide ya y en qué orden se trabaja.
> Léelo entero antes de tocar un archivo.

---

## 📑 Índice

1. [Qué es FIEsta 2](#1-qué-es-fiesta-2)
2. [Cómo trabajar en este proyecto (metodología)](#2-cómo-trabajar-en-este-proyecto-metodología)
3. [La app original: dónde está y cómo funciona](#3-la-app-original-dónde-está-y-cómo-funciona)
4. [Qué se reutiliza, archivo por archivo](#4-qué-se-reutiliza-archivo-por-archivo)
5. [Estética: el tema rojo de FIEsta 2](#5-estética-el-tema-rojo-de-fiesta-2)
6. [Arquitectura de FIEsta 2](#6-arquitectura-de-fiesta-2)
7. [Núcleo compartido (lo que NO tenía FIEsta 1)](#7-núcleo-compartido-lo-que-no-tenía-fiesta-1)
8. [Decisiones globales ya tomadas](#8-decisiones-globales-ya-tomadas)
9. [Los seis juegos: fichas de diseño](#9-los-seis-juegos-fichas-de-diseño)
10. [Fases globales de desarrollo](#10-fases-globales-de-desarrollo)
11. [Plantilla obligatoria para los planes de cada juego](#11-plantilla-obligatoria-para-los-planes-de-cada-juego)
12. [Casos borde y trampas comunes](#12-casos-borde-y-trampas-comunes)
13. [Checklist global](#13-checklist-global)

---

## 1. Qué es FIEsta 2

**FIEsta 2** es una **web app (PWA) de juegos de fiesta por turnos**, pensada
para jugarse **pasándose un solo móvil en vertical**. Es la hermana mayor de
**FIEsta** (la app original, ya terminada y con 5 juegos): mismo enfoque técnico,
misma arquitectura, misma forma de trabajar… pero **contenido nuevo, más adulto
y verbal** (nada de mímica ni de equipos), y **estética roja** en lugar de azul.

**Los seis juegos de FIEsta 2:**

| # | Juego | Prefijo | En una frase |
|---|-------|---------|--------------|
| 1 | **Yo nunca** | `yn` | El clásico de beber: se lee una frase y quien la haya hecho, baja un dedo (o bebe, en modo fiesta). |
| 2 | **Quién es más…** | `qm` | Preguntas para señalar a alguien del grupo (no solo «quién es más probable que…»). |
| 3 | **Verdad o Reto** | `vr` | El clásico: eliges verdad o reto y la app te lo sirve. |
| 4 | **Preguntas incómodas** | `pi` | Preguntas directas y afiladas, dirigidas a una persona concreta. |
| 5 | **Dos mentiras y una verdad** | `dm` | La app te da el **tema**; tú cuentas tres cosas y el grupo adivina cuál es verdad. |
| 6 | **El Impostor** | `im` | Todos ven una palabra menos el impostor, que solo recibe una **pista**. |

> El orden de esta tabla sigue el **orden de implementación** (§10), no el orden
> alfabético ni el de complejidad estricta.

**Principios que no se negocian** (heredados de FIEsta y validados en producción):

- **Vanilla puro**: HTML + CSS + JavaScript. **Sin frameworks, sin npm, sin build
  step, sin CDNs.** Todo el código vive en el repositorio.
- **SPA de una sola página**: `index.html` contiene todas las pantallas como
  `<section class="pantalla" data-pantalla="…">`; solo la que tiene `.activa` se ve.
- **Todo global**: los `.js` se cargan con `<script>` en orden desde `index.html`.
  No hay módulos ES. **El orden importa** y **los nombres pueden colisionar**: por
  eso cada juego prefija todo lo suyo.
- **PWA instalable y offline**: `site.webmanifest` + `sw.js` (service worker que
  cachea todos los archivos).
- **Móvil en vertical, sin scroll**, respetando las *safe areas* del notch.
- **Idioma del código, los comentarios y la interfaz: español.**
- **Se publica en GitHub Pages** (100 % estático).

---

## 2. Cómo trabajar en este proyecto (metodología)

Léelo con atención: aquí FIEsta 2 **se aparta** de cómo se hizo FIEsta 1.

### 2.1 Sin TODOs — implementación completa

En FIEsta 1 el asistente dejaba huecos `// TODO` para que el usuario aprendiera
implementando. **En FIEsta 2 no.** El agente **implementa el código completo y
funcional** de cada fase. Nada de esqueletos a medias ni de «esto lo rellenas tú».

### 2.2 Desarrollo por fases, con el usuario marcando el ritmo

- Se trabaja **una fase cada vez**. Al acabar una fase, **parar** y esperar a que
  el usuario diga que se pasa a la siguiente.
- Cada fase deja la app **en un estado probable** (que se puede abrir y usar).
- Al empezar una fase, resumir en dos líneas qué se va a hacer; al terminarla,
  resumir qué cambió y **qué debe probar el usuario**.

### 2.3 El usuario prueba en el navegador, no tú

**Nunca abras, sirvas ni ejecutes la app para «comprobar» un cambio de interfaz.**
El usuario la prueba él mismo en su móvil/navegador y te da feedback. Tu trabajo
termina en el código.

### 2.4 El contenido se escribe a cuatro manos

Los bancos de contenido son enormes (≥ 400 entradas por juego, ver §8). El agente
**propone tandas** (p. ej. 50 entradas) y el usuario **añade, corta y afina**
creativamente. No intentes escribir 400 frases de golpe sin enseñar una muestra:
proponer 30–50, validar el tono con el usuario, y **luego** producir en volumen.

### 2.5 Estilo de código

Copia el estilo de la app original al milímetro:

- **Comentarios en español**, explicando el *porqué* (no el *qué*). Los archivos
  empiezan con un comentario de cabecera diciendo de qué van.
- Nombres de funciones y variables **en español**: `barajar`, `mostrarPantalla`,
  `vrSiguienteTurno`, `imRepartirPalabras`.
- Funciones cortas, una responsabilidad, sin clases: **funciones + un objeto de
  estado por juego**.
- **El estado manda**: cambiar el estado → volver a renderizar. Nunca guardar
  información «solo en el DOM».

### 2.6 Al terminar cada fase, tres cosas que se olvidan siempre

1. **Subir `APP_VERSION`** en `js/nucleo/arranque.js`.
2. **Subir `CACHE`** en `sw.js` al mismo número **y añadir a `ARCHIVOS` todos los
   archivos nuevos** (si no, offline sirve una versión vieja o rota).
3. **Añadir los `<script>` nuevos** a `index.html` en el orden correcto (§6.2).

---

## 3. La app original: dónde está y cómo funciona

### 3.1 Dónde está

La app original vive en la carpeta hermana:

```
Desktop/Diseño de aplicaciones/
├── DescriptIA/     ← ⚠️ AQUÍ está FIEsta 1 (la carpeta conserva el nombre del
│                       primer juego que tuvo; la app se llama FIEsta)
└── FIEsta2/        ← este proyecto
```

Desde la raíz de FIEsta 2, la ruta relativa es **`../DescriptIA`**. Es un
repositorio git independiente: **léelo, cópialo, pero no lo modifiques nunca.**

### 3.2 Qué contiene (para orientarte)

```
../DescriptIA/
├── index.html               ← 923 líneas: TODAS las pantallas de los 5 juegos
├── css/estilos.css          ← 2159 líneas: tokens + común + estilos por juego
├── sw.js                    ← service worker (lista de archivos a cachear)
├── site.webmanifest         ← nombre, colores e iconos de la PWA
├── icons/                   ← icono.svg + PNG 180/192/512 + generar_icono.py
├── img/<juego>/             ← arte pixel art por juego + scripts Python que lo generan
├── js/
│   ├── nucleo/              ← COMÚN a todos los juegos
│   │   ├── pantallas.js     ← mostrarPantalla(nombre)
│   │   ├── util.js          ← barajar() (Fisher–Yates)
│   │   └── arranque.js      ← APP_VERSION, INFO_JUEGOS, wiring del hub, service worker
│   ├── descriptia/          ← juego 1 (equipos, tarjetas, timer)
│   ├── cartas/              ← juego 2 (mazo con efectos, persistencia)
│   ├── ruleta/              ← juego 3 (SVG, arrastre)
│   ├── zona/                ← juego 4 (roles ocultos, handoff, noche/día)
│   └── blackjack/           ← juego 5 (el más grande: motor, tarot, arcade)
├── data/<juego>/            ← bancos de datos (.js) + .json + script Python de alta
└── md/                      ← los planes de desarrollo (uno global + uno por juego)
```

### 3.3 Los cinco patrones que vas a copiar una y otra vez

| Patrón | Dónde verlo en `../DescriptIA` | Para qué |
|---|---|---|
| **Pantalla SPA** | `js/nucleo/pantallas.js` + cualquier `<section class="pantalla">` de `index.html` | Toda la navegación |
| **Stepper + lista de nombres** | `js/descriptia/main.js:131-163` (`sincronizarJugadores`, `renderNombresJugadores`) y `js/cartas/main.js:76-110` | Configurar jugadores (lo usan los 5 juegos) |
| **Persistencia en `localStorage`** | `js/cartas/main.js:159-234` (`cfGuardar`, `cfCargar`, `cfHayPartidaGuardada`, `cfBorrar`, `cfReanudar`) | «Continuar partida» |
| **Handoff (pasar el móvil sin espiar)** | `js/zona/main.js:469-540` (`ztEntrarReparto`, `ztRepartoVerCarta`, `ztRepartoOcultarYPasar`) | El Impostor, Dos mentiras |
| **Overlay que se cierra tocando fuera** | `js/nucleo/arranque.js:62-77` + CSS `.info-overlay` | Ventanas de info y de ayuda |

> ⚠️ **Detalle que cuesta una tarde de depuración si se ignora:** el atributo
> HTML `hidden` **pierde** contra cualquier regla CSS de autor que ponga
> `display: flex`. Por eso en el CSS original hay reglas como
> `.info-overlay[hidden] { display: none; }`. **Repite ese truco** en cada
> componente nuevo que use `hidden` + `display`.

---

## 4. Qué se reutiliza, archivo por archivo

Leyenda: **[COPIA]** copiar tal cual · **[ADAPTA]** copiar y modificar ·
**[IMITA]** no copiar el archivo, copiar el patrón · **[NO]** no traer nada.

### 4.1 Núcleo y andamiaje — se copia casi entero

| Origen (`../DescriptIA/`) | Destino (FIEsta 2) | Acción | Qué cambia |
|---|---|---|---|
| `js/nucleo/pantallas.js` | igual | **[COPIA]** | Nada. 8 líneas, perfecto tal cual. |
| `js/nucleo/util.js` | igual | **[ADAPTA]** | Se queda `barajar()` y se amplía con las utilidades de §7.1. |
| `js/nucleo/arranque.js` | igual | **[ADAPTA]** | Misma estructura (navegación genérica, ⓘ del hub, service worker). Cambian `APP_VERSION` (a `"1.0.0"`) y `INFO_JUEGOS` (los 5 juegos nuevos). |
| `sw.js` | igual | **[ADAPTA]** | Misma lógica (install/activate/fetch, cache-first). Cambian `CACHE` → `"fiesta2-v1.0.0"` y la lista `ARCHIVOS` entera. |
| `site.webmanifest` | igual | **[ADAPTA]** | `name`/`short_name` → `"FIEsta 2"`; `background_color` y `theme_color` → `#170709`; `description` nueva. |
| `icons/generar_icono.py` | igual | **[ADAPTA]** | Mismo script (Pillow, supersampling ×2048 + LANCZOS). Solo cambia la paleta a la roja (§5) y el motivo (§5.3). Ejecutar `python icons/generar_icono.py` para regenerar los 3 PNG. |
| `.gitattributes` | igual | **[COPIA]** | Config de fin de línea. |

### 4.2 `css/estilos.css` — se copia **solo la mitad común**

El CSS original mezcla lo común y lo específico de cada juego. **Copia estos
tramos** (números de línea del archivo original) y **descarta el resto**:

| Líneas | Bloque | Acción |
|---|---|---|
| 1–20 | Tokens de color (`:root`) | **[ADAPTA]** → paleta roja (§5.1) |
| 22–47 | Base (`html`, `body`, `#app`, sin scroll) | **[COPIA]** |
| 49–104 | `.pantalla`, `.pantalla.activa`, `.con-scroll`, `h1`, `p` | **[COPIA]** |
| 106–262 | Hub: `.fiesta-hero`, `.fiesta-titulo`, `.lista-juegos`, `.juego-card`, `.juego-card-info`, `.info-overlay`, `.info-panel` | **[ADAPTA]** (solo colores del degradado del título y de la sombra del logo) |
| 264–333 | Botones: `button`, `.secundario`, `.boton-exito`, `.boton-fallo`, `.boton-volver` | **[COPIA]** |
| 335–420 | Formularios: `.fila-botones`, `.error`, `.ayuda`, `.lista-scroll`, `.campo input`, `.stepper` | **[COPIA]** |
| 442–505 | Interruptor iOS (`.zt-switch*`) | **[ADAPTA]** → renombrar a `.switch*` y llevarlo al bloque común (lo usará el «modo fiesta» de los 5 juegos) |
| 519–535 | `.zt-vista` + `.zt-vista[hidden]` (sub-vistas del handoff) | **[ADAPTA]** → renombrar a `.vista` / `.vista[hidden]` |
| 550–575 | `.zt-anuncio` (tarjetita de texto) | **[ADAPTA]** → renombrar a `.anuncio` |
| 834–893 | Podio (`.podio-fila`, `.podio-medalla`, `.podio-oro/plata/bronce`) | **[COPIA]** — aunque en FIEsta 2 ningún juego puntúa (§8), se conserva para futuros modos con marcador. *Opcional: omitirlo hasta que haga falta.* |
| Resto | Todo lo específico de DescriptIA / Cartas / Ruleta / Zona / Blackjack | **[NO]** |

### 4.3 `index.html` — se copia la cabecera y el hub

- **[ADAPTA] Líneas 1–19** (`<head>`): mismos metas de viewport, iconos, manifest
  y modo app. Cambian `<title>`, `apple-mobile-web-app-title` (→ `FIEsta 2`) y
  `theme-color` (→ `#170709`).
- **[ADAPTA] Líneas 24–103** (pantalla `fiesta`, el hub): misma estructura
  (logo SVG + título + versión + `.lista-juegos` con una `.juego-card` por juego,
  cada una con su `<span class="juego-card-info">` y el `.info-overlay` al final).
  Cambian el SVG (colores) y las 5 tarjetas.
- **[NO]** el resto: todas las pantallas de los juegos viejos.
- El `<body>` mantiene el contenedor `<div id="app">`.

### 4.4 Lógica de juego — solo patrones, ningún archivo

**Ningún juego de FIEsta 1 se copia**: son juegos distintos. Lo que se copia es el
*cómo*. Referencias concretas para cuando llegue el momento:

| Necesito… | Míralo en… |
|---|---|
| Configurar jugadores (stepper + inputs + validación) | `js/cartas/main.js:55-142` (la versión más limpia y compacta) |
| Guardar/continuar partida | `js/cartas/main.js:159-234` |
| Rotar turnos entre jugadores | `js/cartas/main.js:341-354` (`cfSiguienteJugador`) |
| Pasar el móvil sin que se vea lo del otro | `js/zona/main.js:469-540` |
| Repartir roles/cartas al azar sin repetir | `js/zona/main.js:382-468` (`ztConstruirMazo`, `ztRepartirCartas`) |
| Presets según el nº de jugadores | `js/zona/main.js:213-341` (`ZT_PRESETS`, `ztAplicarPreset`) |
| Un temporizador de turno | `js/descriptia/juego.js:122-158` (`arrancarTimer`, `detenerTimer`, `restarTiempo`) |
| Elegir N elementos al azar sin repetir | `js/ruleta/main.js` (barajar el banco + `slice`) |
| Voltear una carta en 3D | CSS `.cf-carta*` (líneas 1005–1075) + `js/cartas/main.js:321-340` |
| Interruptor de «modo fiesta» | `js/blackjack/main.js` (ruleset con `localStorage`) + CSS `.zt-switch` |
| Banco de datos JSON + JS generado + alta por consola | `data/descriptia/agregar_tarjeta.py` y su explicación en `../DescriptIA/md/PLAN_DESARROLLO.md:186-253` |

### 4.5 Arte (`img/`) — [NO], y de momento no hace falta

FIEsta 2 es una app **de texto**: no necesita pixel art para funcionar. Si en
alguna fase de pulido se decide añadir arte (p. ej. cartas de Verdad / Reto):

- Carpeta propia por juego: `img/<juego>/`, con su script `generar_*.py` (Pillow).
- Criterios del usuario para el pixel art: **legibilidad por encima de fidelidad**;
  **sin coronas flotantes ni contornos internos**; el arte se genera con script,
  no a mano.

---

## 5. Estética: el tema rojo de FIEsta 2

Misma personalidad visual que FIEsta (oscuro, bordes muy redondeados,
transiciones suaves, tipografía del sistema), **girando el azul a rojo**.

### 5.1 Tokens de color (`:root` de `css/estilos.css`)

```css
:root {
  --color-fondo: #170709;        /* rojo casi negro (era #0b1120) */
  --color-fondo-alt: #2a0d12;    /* (era #131c31) */
  --color-superficie: #3a1219;   /* tarjetas y campos (era #1a2540) */
  --color-texto: #f9e8ea;        /* blanco cálido (era #e8edf9) */
  --color-texto-tenue: #c0959a;  /* (era #93a1c0) */
  --color-acento: #ff4d5a;       /* rojo vivo: botones y acciones (era #4c7dff) */
  --color-acento-oscuro: #c22334;/* hover/pulsado (era #2d52c9) */
  --color-acento-2: #ff9142;     /* ámbar: degradado del título y detalles (era el violeta #a06bff) */
  --color-exito: #34c759;        /* verde: igual que en FIEsta */
  --color-fallo: #ffb020;        /* ⚠️ ÁMBAR, no rojo (ver nota) */

  --radio-borde: 18px;
  --radio-borde-chico: 10px;

  --duracion-transicion: 320ms;
  --curva-transicion: cubic-bezier(0.4, 0, 0.2, 1);
}
```

> ⚠️ **Por qué `--color-fallo` es ámbar y no rojo.** En FIEsta el rojo significaba
> «error/fallo» porque la marca era azul. Aquí **el rojo es la marca**: un texto de
> error en rojo se confundiría con un botón normal. Los mensajes de validación y
> los estados negativos usan **ámbar** (`#ffb020`). El verde de éxito se mantiene.
> Si algún juego necesita un botón «✗» rojo intenso, que use `--color-acento`.

- `#app` conserva su degradado vertical: `linear-gradient(180deg, var(--color-fondo), var(--color-fondo-alt))`.
- `.fiesta-titulo`: degradado `90deg, var(--color-acento) → var(--color-acento-2)`.
- Sombra del logo: `drop-shadow(0 8px 20px rgba(255, 77, 90, 0.35))`.
- `theme-color` (HTML) y `background_color`/`theme_color` (manifest): `#170709`.

### 5.2 Contraste

Comprobar que `--color-texto-tenue` sobre `--color-superficie` sigue siendo
legible en un móvil al sol. Si no lo es, aclarar el tenue antes que oscurecer la
superficie.

### 5.3 El logo

Mismo espíritu que el original (SVG inline en el hub + PNG generados con Pillow
para los iconos de la PWA), en rojo. Motivo propuesto: **el mismo planeta con
órbita y confeti estelar**, con la paleta roja/ámbar y un **«2»** integrado
(p. ej. el electrón de la órbita sustituido por un 2, o el 2 sobre el planeta).
El script `icons/generar_icono.py` debe dibujar exactamente lo mismo que el SVG
del hub: si cambias uno, cambia el otro.

---

## 6. Arquitectura de FIEsta 2

### 6.1 Estructura de carpetas

```
FIEsta2/
├── index.html                  ← hub + todas las pantallas de los 6 juegos
├── site.webmanifest
├── sw.js
├── README.md
├── css/
│   └── estilos.css             ← tokens + común + un bloque por juego, en orden
├── icons/
│   ├── icono.svg
│   ├── icon-180.png · icon-192.png · icon-512.png
│   └── generar_icono.py
├── js/
│   ├── nucleo/                 ← COMÚN (ver §7)
│   │   ├── pantallas.js
│   │   ├── util.js
│   │   ├── persistencia.js
│   │   ├── jugadores.js
│   │   ├── intensidad.js
│   │   ├── plantillas.js
│   │   ├── handoff.js
│   │   └── arranque.js         ← SIEMPRE el último
│   ├── yonunca/main.js
│   ├── quienmas/main.js
│   ├── verdadreto/main.js
│   ├── incomodas/main.js
│   ├── dosmentiras/main.js
│   └── impostor/main.js        (+ reparto.js si crece)
├── data/
│   ├── comun/castigos.js       ← castigos del modo fiesta (tragos y prendas)
│   ├── yonunca/frases.json + .js + agregar.py
│   ├── quienmas/preguntas.json + .js + agregar.py
│   ├── verdadreto/{verdades,retos}.json + .js + agregar.py
│   ├── incomodas/preguntas.json + .js + agregar.py
│   ├── dosmentiras/temas.json + .js + agregar.py
│   └── impostor/palabras.json + .js + agregar.py
└── md/
    ├── PLAN_DESARROLLO.md      ← este documento
    ├── PLAN_YO_NUNCA.md
    ├── PLAN_QUIEN_ES_MAS.md
    ├── PLAN_VERDAD_O_RETO.md
    ├── PLAN_PREGUNTAS_INCOMODAS.md
    ├── PLAN_DOS_MENTIRAS.md
    └── PLAN_EL_IMPOSTOR.md
```

### 6.2 Orden de los `<script>` en `index.html`

**El orden es la única «gestión de dependencias» que hay.** Debe ser:

```html
<!-- 1. Núcleo, salvo arranque -->
<script src="js/nucleo/pantallas.js"></script>
<script src="js/nucleo/util.js"></script>
<script src="js/nucleo/persistencia.js"></script>
<script src="js/nucleo/jugadores.js"></script>
<script src="js/nucleo/intensidad.js"></script>
<script src="js/nucleo/plantillas.js"></script>
<script src="js/nucleo/handoff.js"></script>

<!-- 2. Datos (antes que la lógica que los usa) -->
<script src="data/comun/castigos.js"></script>
<script src="data/yonunca/frases.js"></script>
<!-- … el resto de bancos … -->

<!-- 3. Lógica de cada juego -->
<script src="js/yonunca/main.js"></script>
<!-- … el resto de juegos … -->

<!-- 4. Arranque: SIEMPRE el último (es quien muestra el hub) -->
<script src="js/nucleo/arranque.js"></script>
```

Cada juego registra su propio wiring dentro de su
`document.addEventListener("DOMContentLoaded", …)`; **no se toca el núcleo para
añadir un juego** (salvo su entrada en `INFO_JUEGOS`).

### 6.3 Namespacing: la regla que evita el caos

Como todo es global, **cada juego prefija absolutamente todo** con sus dos letras:

| Elemento | Convención | Ejemplo (Verdad o Reto) |
|---|---|---|
| Objeto de estado | `xxEstado` | `vrEstado` |
| Funciones | `xxAlgo()` | `vrSiguienteTurno()` |
| Constantes | `XX_ALGO` | `VR_MAX_JUGADORES` |
| Pantallas | `data-pantalla="xx-…"` | `data-pantalla="vr-turno"` |
| IDs del DOM | `xx-…` | `id="vr-btn-verdad"` |
| Clases CSS | `.xx-…` | `.vr-carta` |
| Clave de `localStorage` | `"xx_partida"` | `"vr_partida"` |

Prefijos asignados: **`yn`** Yo nunca · **`vr`** Verdad o Reto · **`qm`** Quién es
más… · **`dm`** Dos mentiras y una verdad · **`im`** El Impostor · **`pi`**
Preguntas incómodas. Lo del núcleo va **sin prefijo** (`mostrarPantalla`,
`barajar`…).

---

## 7. Núcleo compartido (lo que NO tenía FIEsta 1)

En FIEsta 1 cada juego reimplementaba la configuración de jugadores y la
persistencia (5 copias casi idénticas). **En FIEsta 2 eso vive en el núcleo desde
el principio.** Este núcleo se construye **entero en la Fase 2**, antes del primer
juego, porque los seis lo usan.

### 7.1 `js/nucleo/util.js`

```js
barajar(lista)                    // Fisher–Yates, devuelve copia (copiado tal cual)
enteroAleatorio(min, max)         // ambos inclusive
elegirAlAzar(lista)               // un elemento
elegirN(lista, n)                 // n elementos distintos (barajar + slice)
```

Más un **repartidor sin repetición** que es la pieza central de los 6 juegos:

```js
// Va sirviendo elementos de un banco sin repetir hasta agotarlo; cuando se
// agota, vuelve a barajar y avisa. Cada juego crea el suyo con su banco filtrado.
crearRepartidor(banco)  // → { siguiente(), quedan(), reiniciar() }
```

### 7.2 `js/nucleo/persistencia.js`

Generalización del patrón `cf*` de Cartas de la Fortuna. Todo envuelto en
`try/catch`: en modo incógnito `localStorage` puede lanzar excepción y **la app no
debe romperse por eso**.

```js
guardarJSON(clave, objeto)
cargarJSON(clave)         // null si no hay o está corrupto
hayGuardado(clave)
borrarGuardado(clave)
```

### 7.3 `js/nucleo/jugadores.js`

Componente reutilizable de configuración de jugadores (stepper `− N +` + lista de
inputs de nombres + validación). Se monta con:

```js
montarConfigJugadores({
  contenedorNombres,   // elemento donde van los inputs (p. ej. .lista-scroll)
  stepper,             // elemento .stepper del juego (ver markup exacto abajo)
  min, max, inicial,
  alCambiar(nombres)   // se llama con el array de nombres cada vez que cambian
}); // → { obtenerNombres(), fijarNombres(nombres) } — fijarNombres() restaura
   //   una configuración guardada ("Continuar partida", "Usar la última
   //   configuración" de El Impostor)
validarNombres(nombres) // → { ok, mensaje }: ninguno vacío, sin duplicados
```

**Markup exacto que espera `stepper`** (cada juego lo construye así, con su
propio `id`; el resto de clases y atributos son fijos):

```html
<div class="stepper" id="xx-stepper">
  <button type="button" class="stepper-btn" data-accion="menos">−</button>
  <span class="stepper-valor"></span>
  <button type="button" class="stepper-btn" data-accion="mas">+</button>
</div>
```

Reglas comunes: al **subir** el número se añaden inputs vacíos, al **bajar** se
recortan **conservando lo escrito**; el nombre por defecto es `Jugador N`; no se
permiten nombres vacíos ni repetidos (dos «Ana» hacen ilegible cualquier turno).

### 7.4 `js/nucleo/intensidad.js` — niveles y modo fiesta

**Los tres niveles son transversales a los seis juegos:**

```js
const NIVELES = [
  { id: "suave",   nombre: "Suave",   emoji: "🙂", desc: "Apto para cualquier grupo" },
  { id: "picante", nombre: "Picante", emoji: "🌶️", desc: "Sube la temperatura" },
  { id: "extremo", nombre: "Extremo", emoji: "🔥", desc: "Solo con gente de confianza" },
];
```

- **UI**: fila de chips seleccionables (multi-selección, mínimo uno). Componente
  `montarSelectorNiveles(contenedor, alCambiar)`. Los tres empiezan… **solo
  «Suave» y «Picante» activos por defecto** (que «Extremo» sea una decisión
  consciente).
- **Filtro**: `filtrarPorNivel(banco, nivelesElegidos)` → subconjunto del banco.
- **Modo fiesta**: interruptor (el switch iOS del §4.2) guardado en
  `localStorage` (clave `"modo_fiesta"`, se recuerda entre partidas). Cuando está
  activo, los juegos añaden un **castigo** a las negativas y a los fallos:
  `castigoAlAzar()` lee `data/comun/castigos.js` (~40 entradas: «Un trago»,
  «Dos tragos», «Bebes tú y quien tengas a la derecha», «Un chupito», prendas…).
- **Aviso legal/de tono**: la primera vez que se activa «Extremo» o «modo fiesta»,
  mostrar un overlay de aviso (una sola vez, recordado en `localStorage`):
  juego para mayores de edad, bebed con cabeza, cualquiera puede pasar de un reto.

**API exacta** (nombres cerrados en la Fase 1: los planes de juego llaman a
estas funciones tal cual, así que la Fase 2 debe implementarlas con este nombre):

```js
NIVELES                                   // la constante de arriba
montarSelectorNiveles(contenedor, alCambiar)  // → { obtenerNiveles(), fijarNiveles(ids) }
filtrarPorNivel(banco, nivelesElegidos)
montarInterruptorModoFiesta(contenedor, alCambiar)
modoFiestaActivo()                        // lee localStorage "modo_fiesta"
castigoAlAzar()                           // una entrada de data/comun/castigos.js
```

### 7.5 `js/nucleo/plantillas.js`

Los bancos contienen huecos que se rellenan con nombres de la partida:

```
"{jugador}, ¿cuál fue tu peor cita?"          → "Ana, ¿cuál fue tu peor cita?"
"Dale un piropo a {otro}"                     → "Dale un piropo a Luis"
"¿Quién es más probable que se case con {otro}?"
```

```js
rellenarPlantilla(texto, { jugador, otros })  // {jugador} = quien tiene el turno
                                              // {otro}, {otro2} = otros distintos, sin repetir
tienePlantilla(texto)                         // true si el texto tiene algún hueco
otrosNecesarios(texto)                        // 0, 1 o 2: cuántos {otro} distintos pide el texto
```

`otrosNecesarios()` es lo que usan los juegos con plantillas para **descartar al
filtrar el banco** los textos imposibles con pocos jugadores (regla: se descarta
si `otrosNecesarios(texto) > nombres.length - 1`). **Yo nunca no usa
plantillas**: su banco es autoconclusivo (§9.6).

### 7.6 `js/nucleo/handoff.js`

Pantalla genérica de «pasa el móvil», con la protección anti-espionaje del
original: **el contenido secreto no está en el DOM hasta que se pulsa «Ver»,
y se borra del DOM al pulsar «Ocultar y pasar»** (no basta con ocultarlo por CSS:
se puede ver mirando la pantalla en ángulo o inspeccionando).

```js
iniciarHandoff({
  contenedor,            // elemento del juego donde vive el handoff (p. ej.
                         // #im-handoff); la función lo rellena por completo
  nombres,               // orden de paso
  contenidoDe(indice),   // devuelve el NODO del DOM con el secreto de esa persona
  alTerminar(),          // cuando todos han visto lo suyo
  textoVer,              // opcional, por defecto "Ver" (im usa "Ver mi palabra")
  textoOcultar,          // opcional, por defecto "Ocultar y pasar"
});
```

`contenedor` no estaba en el boceto original de esta sección: se cerró al
implementar la Fase 2, porque `iniciarHandoff` necesita saber **dónde**
construir su propia sub-vista `.vista` («pasa el móvil» / secreto visible), y
es más simple que cada juego se lo pase que inventar una convención de ID
implícita.

---

## 8. Decisiones globales ya tomadas

**No volver a preguntar por esto.** Son decisiones del usuario, ya cerradas.

| Tema | Decisión |
|---|---|
| **Nombre** | FIEsta 2 |
| **Estética** | Rojo muy oscuro de fondo + rojo de acento (§5). Todo lo demás igual que FIEsta. |
| **Metodología** | Por fases, **sin TODOs**: el agente implementa completo (§2.1). |
| **Votación y puntos** | ❌ **La app no gestiona votaciones ni marcadores.** Los juegos se resuelven **hablando en voz alta**. La app sirve el contenido, ordena los turnos y guarda los secretos. Sin podio ni ganador. (Única excepción tolerada: El Impostor registra **a quién acusa el grupo** con un toque, para poder revelar si acertaron.) |
| **Niveles de intensidad** | ✅ Suave / Picante / Extremo, transversal a los 6 juegos, multi-selección al configurar (§7.4). |
| **Modo fiesta (tragos)** | ✅ Interruptor global recordado entre partidas; añade castigos a negativas y fallos (§7.4). |
| **Volumen de contenido** | **Mínimo 400 entradas por juego.** Reparto orientativo: ~40 % suave, ~40 % picante, ~20 % extremo. El usuario colabora creativamente (§2.4). |
| **Gestión del contenido** | Igual que DescriptIA: `data/<juego>/x.json` (fuente) + `x.js` generado (`const XX_BANCO = […]`) + `agregar.py` para dar de alta desde consola. Sin edición desde la app en v1. |
| **Jugadores** | 2–12 en general; El Impostor mínimo 3 (recomendado 4+). Sin equipos en ningún juego. |
| **Persistencia** | Cada juego guarda su partida y ofrece «Continuar» (§7.2). Al llegar al final, borra. |
| **Idioma** | Español en todo: interfaz, código, comentarios y planes. |
| **Despliegue** | GitHub Pages, repositorio propio e independiente del de FIEsta. |

---

## 9. Los seis juegos: fichas de diseño

Cada ficha es la **materia prima del plan detallado** que se escribirá en la
Fase 1. Contiene lo ya decidido; lo que ponga **(a decidir en su plan)** debe
cerrarse al escribir ese plan, proponiendo una opción concreta al usuario.

> El orden de las fichas de este capítulo es el histórico (el de cuando se
> escribieron). El **orden de implementación real** es otro y vive en §10:
> empieza por **Yo nunca** (§9.6) y **Quién es más…** (§9.2).

---

### 9.1 Verdad o Reto — `vr`

**Idea:** el clásico. En tu turno eliges **Verdad** o **Reto** y la app te sirve
uno al azar del banco filtrado por los niveles elegidos.

**Pantallas:** `vr-config` → `vr-turno` → `vr-carta` → `vr-fin`

**Flujo:**
1. **`vr-config`**: jugadores (2–12) + selector de niveles + interruptor de modo
   fiesta + botón «Continuar partida» si hay guardada.
2. **`vr-turno`**: «Turno de **NOMBRE**» y dos botones grandes: **VERDAD** (rojo)
   y **RETO** (ámbar).
3. **`vr-carta`**: el texto grande, con plantillas ya resueltas (`{otro}` = otro
   jugador al azar). Debajo: **«Hecho ✔»** y **«Paso ✖»**.
   - Con **modo fiesta** activo, «Paso» muestra el castigo (`castigoAlAzar()`)
     antes de pasar turno.
4. Vuelta a `vr-turno` con el siguiente jugador. Sin límite de rondas: se juega
   hasta que alguien pulsa **«Terminar»** → `vr-fin` (resumen simpático: cuántas
   verdades y cuántos retos han caído) → volver al hub.

**Datos** (`data/verdadreto/`): dos bancos separados.

```js
const VR_VERDADES = [
  { texto: "¿Cuál es la mentira más grande que has contado?", nivel: "suave" },
  { texto: "¿Qué opinas de verdad de {otro}?", nivel: "picante" },
];
const VR_RETOS = [
  { texto: "Imita a {otro} hasta que alguien adivine a quién imitas", nivel: "suave" },
];
```

**Volumen:** ≥ 400 en total (**≥ 200 verdades y ≥ 200 retos**).

**Reglas y casos borde:**
- Nada se repite dentro de una partida (repartidor del §7.1). Al agotar un banco,
  avisar («Se han acabado los retos picantes») y volver a barajar.
- Textos con `{otro}` solo si hay ≥ 3 jugadores; si no, se descartan al filtrar.
- Un reto nunca puede señalar a quien tiene el turno como `{otro}`.

**(a decidir en su plan):** si la carta se presenta con **volteo 3D** (patrón
`.cf-carta`) o con una transición simple; si existe un modo «solo verdades» /
«solo retos».

---

### 9.2 Quién es más… — `qm`

**Idea:** la app lanza una pregunta sobre el grupo; a la de tres, **todos señalan
a la vez** a quien crean. Se comenta a gritos. Siguiente.

**Importante:** **no** se limita a «¿quién es más probable que…?». Hay cuatro
formatos, y el banco los mezcla:

| `tipo` | Formato | Ejemplo |
|---|---|---|
| `probable` | ¿Quién es más probable que…? | «…acabe durmiendo en el sofá esta noche» |
| `adjetivo` | ¿Quién es más…? | «…dramático cuando se pone malo» |
| `primero` | ¿Quién sería el primero en…? | «…perderse en una ciudad nueva» |
| `nunca` | ¿Quién nunca…? | «…ha ido a una fiesta sin saber de quién era» |

**Pantallas:** `qm-config` → `qm-juego` → `qm-fin`

**Flujo:**
1. **`qm-config`**: jugadores (2–12, se usan para rotar **quién lee** y para
   rellenar `{otro}`) + niveles + modo fiesta.
2. **`qm-juego`**: cabecera pequeña «Lee **NOMBRE**», la pregunta en grande, y
   **«Siguiente»**. Con modo fiesta, una línea bajo la pregunta: «El más señalado
   bebe». La app **no** cuenta votos.
3. **«Terminar»** → `qm-fin` → hub.

**Datos** (`data/quienmas/preguntas.js`):

```js
const QM_PREGUNTAS = [
  { texto: "acabe durmiendo en el sofá esta noche", tipo: "probable", nivel: "suave" },
];
```

El encabezado («¿Quién es más probable que…») lo pone la app según el `tipo`, para
no repetirlo 400 veces en los datos.

**Volumen:** ≥ 400 preguntas, con los cuatro tipos representados (mínimo 60 de cada).

**(a decidir en su plan):** si se puede filtrar por tipo desde la configuración;
si hay una cuenta atrás «3, 2, 1… ¡señalad!» antes de revelar la pregunta.

---

### 9.3 Dos mentiras y una verdad — `dm`

**Idea:** el jugador de turno cuenta **tres cosas sobre sí mismo**: dos falsas y
una verdadera. El grupo debate y adivina cuál es la verdadera. **La app da el
tema** para que nadie se quede en blanco, que es lo que mata a este juego.

**Pantallas:** `dm-config` → `dm-turno` → `dm-tema` → `dm-fin`

**Flujo:**
1. **`dm-config`**: jugadores (3–12) + niveles + modo fiesta.
2. **`dm-turno`**: «Turno de **NOMBRE**» + «Ver mi tema».
3. **`dm-tema`**: el tema en grande (p. ej. *«Tus viajes»*, *«La época del
   colegio»*, *«Tu peor cita»*) con una línea de ayuda («Cuenta tres cosas sobre
   esto: dos mentira y una verdad»). Botones: **«Otro tema»** (máx. 2 cambios por
   turno, para que no busque el tema fácil) y **«Ya lo tengo»**.
   - Opcional (fase de pulido): **cuenta atrás de 60 s** para pensarlas,
     reutilizando el temporizador de DescriptIA.
4. Tras contarlas, el grupo debate y vota **a mano alzada**; el jugador revela la
   verdad **en voz alta**. Con modo fiesta: quien falle bebe; si no acierta nadie,
   bebe todo el grupo. Botón **«Siguiente jugador»** → `dm-turno`.
5. **«Terminar»** → `dm-fin` → hub.

**Datos** (`data/dosmentiras/temas.js`):

```js
const DM_TEMAS = [
  { texto: "Tus viajes", nivel: "suave", tipo: "tema" },
  { texto: "Tres cosas que has hecho y de las que no te enorgulleces", nivel: "picante", tipo: "arranque" },
];
```

Dos `tipo`: **`tema`** (un ámbito abierto) y **`arranque`** (la frase ya empezada,
más dirigido).

**Volumen:** ≥ 400 temas.

**(a decidir en su plan):** si el temporizador es obligatorio u opcional; si el
tema se puede mostrar también al grupo (recomendado: **sí**, así vigilan que las
tres frases van del tema).

---

### 9.4 El Impostor — `im`

**Idea:** todos reciben la **misma palabra secreta** menos el impostor, que recibe
solo una **pista** (una categoría o descripción vaga). Por turnos, cada uno dice
**una palabra** relacionada con la secreta: los inocentes deben demostrar que la
conocen sin ser tan obvios como para delatarla; el impostor improvisa. Al final,
el grupo acusa a alguien.

Es **el juego más complejo de los seis**: reparto secreto, handoff y anti-trampas.
Se deja para el final.

**Pantallas:** `im-config` → `im-reparto` → `im-ronda` → `im-acusacion` → `im-revelacion`

**Flujo:**
1. **`im-config`**: jugadores (3–12; recomendado 4+), **nº de impostores**
   (1 por defecto; 2 permitido desde 7 jugadores), **nº de rondas de palabras**
   (1–3, por defecto 2), niveles, modo fiesta.
2. **`im-reparto`** (handoff del §7.6): «Pasa el móvil a **NOMBRE**» → «Ver mi
   palabra» → o bien la **palabra secreta**, o bien **«ERES EL IMPOSTOR»** con su
   **pista** → «Ocultar y pasar». El secreto **sale del DOM** al ocultar.
3. **`im-ronda`**: la app fija un orden y muestra «Turno de **NOMBRE** — di una
   palabra relacionada» + «Siguiente». Al completar las rondas configuradas →
   `im-acusacion`.
4. **`im-acusacion`**: el grupo debate y vota **a viva voz**; alguien toca el
   nombre del acusado en la app (único toque «de gestión» de toda FIEsta 2).
5. **`im-revelacion`**: se revela quién era el impostor, la palabra secreta y la
   pista, y si el grupo acertó. Con modo fiesta: si acertaron, bebe el impostor;
   si no, beben todos los demás. Botones: **«Otra ronda»** (mismos jugadores,
   palabra nueva, impostor nuevo) y **«Terminar»**.

**Datos** (`data/impostor/palabras.js`):

```js
const IM_PALABRAS = [
  { palabra: "Camarero", pista: "Un trabajo de cara al público", categoria: "Oficios", nivel: "suave" },
  { palabra: "Tinder",   pista: "Algo que usas en el móvil",     categoria: "Apps",    nivel: "picante" },
];
```

**La pista es la pieza delicada del diseño:** debe ser **lo bastante vaga como
para no regalar la palabra** y **lo bastante útil como para que el impostor pueda
fingir**. Regla: la pista describe la **categoría o el contexto**, nunca una
propiedad distintiva. Mala: «Sirve copas en un bar». Buena: «Un trabajo de cara al
público».

**Volumen:** ≥ 400 palabras, cada una con su pista escrita a mano (no derivada
automáticamente de la categoría: quedarían todas iguales).

**Reglas y casos borde:**
- **El primero en hablar nunca es un impostor** (hablar primero sin información es
  una desventaja brutal): el orden se sortea entre los inocentes para el primer
  puesto.
- Con 3 jugadores, **1 impostor** obligatorio.
- 2 impostores solo desde 7 jugadores; **se conocen entre ellos** *(a decidir en
  su plan: podría ser más divertido que no)*.
- Si alguien pulsa «Ver mi palabra» dos veces por error, debe poder volver a verla
  **solo mientras es su turno de reparto**, nunca después.
- Recarga a mitad del reparto → se reinicia el reparto entero (no se puede
  reanudar a medias sin filtrar información).

---

### 9.5 Preguntas incómodas — `pi`

**Idea:** preguntas directas, personales y afiladas. La app **elige a quién se le
pregunta** y **qué se le pregunta**. Responder o pagar el castigo.

**Pantallas:** `pi-config` → `pi-juego` → `pi-fin`

**Flujo:**
1. **`pi-config`**: jugadores (2–12) + niveles + modo fiesta.
2. **`pi-juego`**: «**NOMBRE**,» + la pregunta en grande. Botones **«Respondió»**
   y **«Se lo salta»** (con modo fiesta, saltarse muestra el castigo). El
   destinatario rota (rotación normal, no aleatoria, para que a nadie le toque
   tres veces seguidas), pero **quién lee la pregunta es el jugador anterior**.
3. **«Terminar»** → `pi-fin` → hub.

**Tres formatos en el banco:**

| `tipo` | Qué es | Ejemplo |
|---|---|---|
| `dirigida` | A la persona del turno | «¿Qué es lo peor que has pensado de alguien de esta sala?» |
| `cruzada` | Sobre otra persona concreta | «¿Qué cambiarías de {otro} si pudieras?» |
| `grupo` | Al grupo entero, responde el turno primero | «¿Quién de aquí guarda el secreto más gordo?» |

**Datos** (`data/incomodas/preguntas.js`):

```js
const PI_PREGUNTAS = [
  { texto: "¿Qué cambiarías de {otro} si pudieras?", tipo: "cruzada", nivel: "picante" },
];
```

**Volumen:** ≥ 400 preguntas.

**Diferencia con «Quién es más…»** (para que no se solapen los bancos):
«Quién es más…» habla **del grupo en tercera persona y se responde señalando**;
«Preguntas incómodas» interpela **a una persona, que tiene que abrir la boca**.

**(a decidir en su plan):** si existe un botón «Devolver la pregunta» (quien la
recibe se la lanza a quien la leyó).

---

### 9.6 Yo nunca — `yn`

**Idea:** el clásico de mesa para beber. La app lee una frase («Yo nunca…») y
**quien la haya hecho de verdad, baja un dedo** (o, con el modo fiesta activo,
bebe). La app **no lleva la cuenta de dedos ni de tragos**: es un juego de
autogestión física, igual de cierto que el resto de FIEsta 2 en que no hay
marcador ni ganador. Es el juego más simple de los seis y por eso **abre la
implementación**: valida el núcleo entero con el mínimo de piezas en juego.

**Pantallas:** `yn-config` → `yn-juego` → `yn-fin`

**Flujo:**
1. **`yn-config`**: jugadores (2–12) + niveles + modo fiesta.
2. **`yn-juego`**: «Lee **NOMBRE**» + «**Yo nunca…**» + la frase en grande.
   Debajo, una línea de instrucción que **cambia con el modo fiesta**:
   - Sin modo fiesta: «Quien lo haya hecho, baja un dedo.»
   - Con modo fiesta: «Quien lo haya hecho, bebe.»

   Botón primario **«Siguiente»** (rota quién lee) y secundario **«Terminar»**.
3. **«Terminar»** → `yn-fin` → hub.

**Datos** (`data/yonunca/frases.js`): un solo banco, sin plantillas.

```js
const YN_FRASES = [
  { texto: "he fingido estar dormido para no hablar con alguien", nivel: "suave" },
  { texto: "he querido besar a alguien de este grupo", nivel: "picante" },
];
```

El texto completa «**Yo nunca…**» (que pone la app, no el banco) y va siempre en
**pretérito perfecto** («he mentido», «he fingido», «he llorado»).

**Nada de plantillas `{otro}`:** las preguntas nunca señalan a una persona
concreta por nombre. Cuando el picante necesita involucrar al grupo, se escribe
en genérico: «he querido besar a alguien de este grupo», nunca «he querido besar
a {otro}». Así se evita que la app obligue a nadie a destaparse delante de una
persona señalada por su nombre; quien quiera confesar, confiesa él solo.

**Volumen:** ≥ 400 frases. Reparto orientativo: ~40 % suave, ~40 % picante,
~20 % extremo.

**Diferencia con «Quién es más…» (tipo `nunca`)** (para que no se solapen los
bancos): el tipo `nunca` de Quién es más pregunta **quién del grupo, en tercera
persona, nunca ha hecho algo** y se resuelve señalando a otro; «Yo nunca»
pregunta **por uno mismo, en primera persona**, y se resuelve confesando (o no).

**Reglas y casos borde:**
- Sin gestión de dedos en la app: la primera vez que se abre el juego (overlay
  ⓘ del hub, ya presente desde la Fase 0), la descripción explica la regla de
  los dedos para quien no conozca el juego de mesa.
- Con modo fiesta, no hay `castigoAlAzar()`: la propia frase ya es el
  disparador («bebe» es fijo, no aleatorio). `castigoAlAzar()` se reserva para
  las negativas/fallos de los demás juegos.
- Nada se repite dentro de una partida (repartidor del §7.1).

---

## 10. Fases globales de desarrollo

> Cada fase deja la app en un estado que el usuario puede abrir y probar. **No se
> pasa de fase sin que él lo diga.** Se marcan las casillas al completar.

### Fase 0 — Infraestructura y tema rojo
Poner en pie el esqueleto de la app, copiando de `../DescriptIA` lo indicado en §4.
- [x] Estructura de carpetas de §6.1 (con las carpetas de juego vacías).
- [x] `css/estilos.css` con los tokens rojos (§5.1) y **solo** los bloques comunes (§4.2).
- [x] `index.html` con `<head>` adaptado y la **pantalla `fiesta` (el hub)** con las
      5 tarjetas de juego, su ⓘ y el `.info-overlay`.
- [x] `js/nucleo/pantallas.js` (copia), `js/nucleo/util.js`, `js/nucleo/arranque.js`
      con `APP_VERSION = "1.0.0"` e `INFO_JUEGOS` de los 5 juegos.
- [x] Logo SVG rojo en el hub + `icons/generar_icono.py` con la paleta roja +
      los 3 PNG regenerados.
- [x] `site.webmanifest` y `sw.js` (`CACHE = "fiesta2-v1.0.0"`) con la lista de archivos real.
- [x] `README.md` (cómo abrir, cómo desplegar, cómo añadir contenido).
- [x] Repositorio git inicializado con un primer commit.

**✅ Aceptación:** se abre `index.html`, se ve el hub rojo con 5 tarjetas, las ⓘ
abren su ventana, la consola está limpia y las tarjetas aún no llevan a ningún sitio.

> ✅ **Resuelto en la Fase 3:** «Yo nunca» (§9.6) se decidió como sexto juego
> **después** de que la Fase 0 ya estuviera cerrada y fusionada. La 6ª tarjeta,
> su entrada en `INFO_JUEGOS` y el hueco en `sw.js`/`ARCHIVOS` se añadieron al
> empezar la Fase 3, junto con ese juego (siguiendo la regla de §6.2: «no se
> toca el núcleo para añadir un juego, salvo su entrada en `INFO_JUEGOS`»).

### Fase 1 — Los seis planes de juego  ← **empieza por aquí si ya hay Fase 0**
Escribir, en `md/`, un plan por juego siguiendo **la plantilla de §11**, partiendo
de la ficha de diseño correspondiente de §9.
- [x] `md/PLAN_YO_NUNCA.md`
- [x] `md/PLAN_QUIEN_ES_MAS.md`
- [x] `md/PLAN_VERDAD_O_RETO.md`
- [x] `md/PLAN_PREGUNTAS_INCOMODAS.md`
- [x] `md/PLAN_DOS_MENTIRAS.md`
- [x] `md/PLAN_EL_IMPOSTOR.md`

En cada uno hay que **cerrar los «(a decidir en su plan)»** de su ficha: proponer
una opción concreta y razonada, y dejar la decisión escrita en su tabla de
decisiones. **Cada plan tiene sus propias fases internas**, y una de ellas es
siempre la del banco de contenido (≥ 400).

**Decisiones cerradas en esta fase** (el detalle y el porqué, en cada plan):

| Juego | Se decidió |
|---|---|
| **Yo nunca** | Sexto juego, añadido después de esta fase. Resolución por **dedos** (sin modo fiesta) o **bebiendo** (con modo fiesta), gestionada fuera de la app; sin plantillas `{otro}` (el picante que involucra al grupo se escribe en genérico: «alguien de este grupo»); la app no cuenta nada. |
| **Verdad o Reto** | Carta con **volteo 3D**; **sí** hay modos «solo verdades» y «solo retos»; y **botón «Otra»** (máx. 2 por turno, para verdades y retos; el 2.º con castigo si el modo fiesta está activo). |
| **Quién es más…** | **Sí** al filtro por tipo en la configuración; **no** a la cuenta atrás «3, 2, 1». |
| **Dos mentiras** | Temporizador de 60 s **opcional y apagado por defecto**; el tema **se muestra a todo el grupo** (no es secreto). |
| **El Impostor** | Los 2 impostores **no se conocen entre ellos**; y el juego **no guarda la partida en curso**, solo la configuración (`"im_config"`), porque reanudar filtraría información. |
| **Preguntas incómodas** | **Sí** al botón «Devolver la pregunta», pero **solo con el modo fiesta** y como recurso escaso: **una por jugador y partida**, no encadenable y no disponible en las preguntas de tipo `grupo`. |

**✅ Aceptación:** los 6 planes existen, son autosuficientes (otro agente sin
contexto podría implementarlos leyendo solo ese plan + este documento) y no
quedan decisiones abiertas.

### Fase 2 — Núcleo compartido de FIEsta 2
Implementar §7 completo, con una pantalla de pruebas temporal si hace falta.
- [x] `util.js` ampliado (`enteroAleatorio`, `elegirAlAzar`, `elegirN`, `crearRepartidor`).
- [x] `persistencia.js` (`guardarJSON`/`cargarJSON`/`hayGuardado`/`borrarGuardado`, a prueba de incógnito).
- [x] `jugadores.js` (`montarConfigJugadores`, `validarNombres`).
- [x] `intensidad.js` (`NIVELES`, selector de chips, `filtrarPorNivel`, modo fiesta
      persistente, `castigoAlAzar`, aviso de tono la primera vez).
- [x] `plantillas.js` (`rellenarPlantilla`, `tienePlantilla`, `otrosNecesarios`).
- [x] `handoff.js` (con la protección de sacar el secreto del DOM).
- [x] `data/comun/castigos.js` (40 castigos).
- [x] CSS común nuevo: chips de nivel (`.chip-nivel`), fila «etiqueta +
      interruptor» (`.fila-switch`) — `.switch`, `.vista` y `.anuncio` ya
      existían desde la Fase 0.

**✅ Aceptación:** el núcleo está probado — con pruebas automatizadas via
jsdom (montar/desmontar el stepper de jugadores conservando nombres al
subir/bajar, chips de nivel con el mínimo-uno, modo fiesta persistente,
`crearRepartidor` sin repetición y con aviso al agotarse, `rellenarPlantilla`
sin colisión `{otro}`/`{otro2}`, y sobre todo el **handoff**: el nodo secreto
no existe en el DOM ni antes de «Ver» ni después de «Ocultar y pasar» — y una
integración completa cargando `index.html` real con los 9 `<script>` en
orden) y documentado con comentarios; ningún juego lo duplicará después. No
hizo falta una pantalla de pruebas temporal: todo es verificable llamando a
las funciones (son globales, sin módulos ES).

**Decisiones de implementación que cerraron un boceto abierto del §7:**
`montarConfigJugadores` devuelve `{ obtenerNombres, fijarNombres }` (no
especificado en el boceto original, necesario para "Continuar
partida"/"Otra partida"/"Usar la última configuración"); `iniciarHandoff`
añade el parámetro `contenedor` y los opcionales `textoVer`/`textoOcultar`
(ver §7.3 y §7.6 arriba, ya actualizados).

### Fase 3 — Juego 1: **Yo nunca**
Es el más simple de los seis y el que **valida el núcleo entero** (jugadores,
niveles, modo fiesta, repartidor, persistencia) con el mínimo de piezas: no usa
plantillas ni handoff. Incluye añadir su tarjeta al hub (ver aviso de la Fase 0).
Seguir `md/PLAN_YO_NUNCA.md`.

> 🚧 **En curso.** Ya están sus Fases 1, 2 y 4 (tarjeta del hub, `INFO_JUEGOS`,
> pantallas, configuración, motor de rotación, persistencia), probado con una
> integración jsdom completa sobre `index.html` real (sirviendo por HTTP para
> que `localStorage` funcione igual que en el navegador) sin errores de
> consola. **Fase 3 en marcha**: primera tanda del banco de contenido, 67
> frases (`data/yonunca/frases.json` + `frases.js` generado + `agregar.py`),
> pendiente de validar el tono con el usuario (§2.4) antes de seguir hasta
> las ≥ 400. `APP_VERSION`/`CACHE` = 1.2.2.

### Fase 4 — Juego 2: **Quién es más…**
Reutiliza el mismo esqueleto de Yo nunca (config → juego → fin, rotación de
quien lee) y añade los cuatro tipos de pregunta, el encabezado dinámico y las
plantillas. Seguir su plan.

> 🚧 **En curso.** Ya están sus Fases 1, 2 y 4 (tarjeta del hub ya existía
> desde la Fase 0, pantallas, configuración con chips de nivel y de tipo,
> motor de preguntas con `{otro}` resuelto excluyendo al lector, castigo por
> pregunta con modo fiesta, guardado/reanudación), probado de principio a fin
> con jsdom real sobre `index.html` (rotación de lector, los cuatro
> encabezados, aviso de banco agotado con un filtro estrecho, error de
> combinación vacía) sin errores de consola. Banco provisional: las ~32
> preguntas de muestra de `md/PLAN_QUIEN_ES_MAS.md` §9. **Falta su Fase 3**:
> el banco definitivo de ≥ 400 preguntas, a cuatro manos con el usuario
> (§2.4). `APP_VERSION`/`CACHE` = 1.4.0.

### Fase 5 — Juego 3: **Verdad o Reto**
Añade el volteo 3D, dos bancos en vez de uno, y el botón «Otra». Seguir
`md/PLAN_VERDAD_O_RETO.md`.

### Fase 6 — Juego 4: **Preguntas incómodas**
Reutiliza casi todo lo de Verdad o Reto; añade los tres formatos y la rotación de
destinatario. Seguir su plan.

### Fase 7 — Juego 5: **Dos mentiras y una verdad**
Añade el flujo por turnos con tema, «Otro tema» y (si se decide) temporizador.

### Fase 8 — Juego 6: **El Impostor**
El más complejo: reparto secreto, handoff, rondas, acusación y revelación. Va el
último a propósito.

### Fase 9 — Pulido global y publicación
- [ ] Repasar el tema rojo entero: contrastes, estados de botón, transiciones.
- [ ] Comprobar que ninguna pantalla hace scroll salvo las que deben.
- [ ] Revisar en móvil pequeño (360 px) y con textos largos (las preguntas se van
      a 4 líneas: que la caja crezca sin romper el layout).
- [ ] `sw.js` con **todos** los archivos y `CACHE`/`APP_VERSION` al día; probar
      offline de verdad (modo avión tras instalarla).
- [ ] GitHub Pages + probar la URL pública en el móvil.
- [ ] `README.md` final.

**Orden recomendado en una frase:** infraestructura → planes → núcleo → el juego
más simple → los que se le parecen → el más complejo → pulido.

---

## 11. Plantilla obligatoria para los planes de cada juego

Todos los planes de la Fase 1 tienen **esta misma estructura** (es la que funcionó
en FIEsta 1: ver `../DescriptIA/md/PLAN_LA_RULETA.md` como ejemplo modélico).

```markdown
# Plan de desarrollo — FIEsta 2 · «NOMBRE DEL JUEGO»

> Documento pensado para que otro agente SIN CONTEXTO pueda implementar el juego
> leyendo solo esto y md/PLAN_DESARROLLO.md.

## 1. Contexto mínimo
Qué es FIEsta 2, dónde está el núcleo, sin frameworks, español, sin TODOs,
el usuario prueba él en el navegador. (5–10 líneas + enlace al plan global.)

## 2. Qué es este juego
Explicación para alguien que no lo ha jugado nunca, en 5–8 líneas.

## 3. Decisiones cerradas (no volver a preguntar)
Tabla `| Tema | Decisión |` con: prefijo, nº de jugadores, pantallas, formato de
los datos, volumen del banco, qué hace y qué NO hace la app, modo fiesta, niveles.

## 4. Especificación
### 4.1 Flujo de juego (pantalla a pantalla, con los nombres data-pantalla)
### 4.2 Modelo de datos (objeto de estado + formato del banco, con ejemplos reales)
### 4.3 Pantallas y componentes (qué elementos hay en cada una)
### 4.4 Qué del núcleo se usa (§7 del plan global) y qué es propio del juego

## 5. Convenciones para no chocar con los otros juegos
Prefijo en estado/funciones/constantes/pantallas/IDs/clases/localStorage;
dónde van sus <script>; dónde va su bloque de CSS.

## 6. Desarrollo por fases
Fase 1 … Fase N, cada una con:
- 🎯 Objetivo (una frase)
- 🛠️ A construir (lista de tareas concretas y verificables)
- ✅ Criterios de aceptación
- 🔍 Qué debe probar el usuario
Una de las fases es SIEMPRE «Banco de contenido (≥400)», y va lo bastante pronto
como para que el juego se pueda probar de verdad, pero después del motor.

## 7. Casos borde
Lista concreta: pocos jugadores, banco agotado, plantillas sin candidatos,
recarga a mitad, textos larguísimos, nombres repetidos…

## 8. Checklist
Casillas de todas las fases.
```

**Reglas de escritura de los planes:** en español; concretos (nada de «hacer la
UI bonita»); con ejemplos de código y de datos reales; sin `// TODO`; y con los
nombres exactos de pantallas, IDs y funciones ya decididos, para que la
implementación no tenga que inventar nomenclatura.

---

## 12. Casos borde y trampas comunes

Válidos para los seis juegos; cada plan añadirá los suyos.

**De contenido**
- **Banco agotado** a mitad de partida (sobre todo con un solo nivel activo):
  avisar y volver a barajar, nunca quedarse en blanco ni repetir en bucle.
- **Ningún nivel seleccionado**: imposible por UI (mínimo uno), pero el filtro
  debe devolver algo razonable si aun así ocurre.
- **Plantilla sin candidatos**: `{otro}` con solo 2 jugadores → esos textos se
  descartan **al filtrar el banco**, no al mostrarlos (si no, salta el turno).
- **Textos muy largos**: las preguntas de 4 líneas no pueden romper el layout ni
  provocar scroll; usar tamaño de fuente fluido o `clamp()`.

**De personas y turnos**
- **Nombres repetidos o vacíos**: se bloquean en la configuración.
- **Mínimo de jugadores**: 2 en general, 3 en El Impostor y Dos mentiras.
- **Que a alguien no le toque nunca**: rotación en orden, no sorteo, para los
  destinatarios de preguntas.

**Técnicos**
- **`localStorage` bloqueado** (incógnito): todo en `try/catch`; la app funciona
  igual, solo sin «Continuar».
- **Recarga a mitad de partida**: se reanuda **al principio del turno en curso**,
  nunca en mitad de una revelación (evita ver secretos ajenos).
- **`hidden` vs `display`**: ver el aviso de §3.3.
- **Service worker cacheando versiones viejas**: si el usuario dice «no veo mi
  cambio», casi siempre es que no se subió `CACHE` en `sw.js`.
- **Safe areas**: cualquier elemento posicionado en absoluto (botón volver, chips
  de esquina) debe sumar `env(safe-area-inset-*)`.

**De producto**
- **Contenido ofensivo**: el nivel más fuerte (id interno `"extremo"`, sin tocar
  en los datos; se muestra como **«Salseo»** desde la Fase 3 de «Yo nunca»,
  decisión del usuario — ver `md/PLAN_YO_NUNCA.md`) debe ser incómodo, no cruel.
  Nada que humille por identidad (aspecto, orientación, origen, salud mental).
  Si una entrada solo funciona haciendo daño de verdad, fuera. Los cinco planes
  de juego que aún no han llegado a su fase de contenido siguen usando el
  nombre «Extremo» en sus muestras de referencia: se actualizan a «Salseo» al
  empezar cada una.
- **Consentimiento**: cualquiera puede pasar de cualquier reto o pregunta; el
  botón «Paso» siempre está visible y no se penaliza más allá del castigo simbólico.

---

## 13. Checklist global

- [x] **Fase 0** — Infraestructura y tema rojo
- [x] **Fase 1** — Los seis planes de juego (`md/`)
- [x] **Fase 2** — Núcleo compartido
- [ ] **Fase 3** — Yo nunca
- [ ] **Fase 4** — Quién es más…
- [ ] **Fase 5** — Verdad o Reto
- [ ] **Fase 6** — Preguntas incómodas
- [ ] **Fase 7** — Dos mentiras y una verdad
- [ ] **Fase 8** — El Impostor
- [ ] **Fase 9** — Pulido global y publicación

---

## 🚀 Ideas para después de la v1

- Editar los bancos **desde la app** (como la pantalla de Categorías de DescriptIA).
- **Packs de contenido** temáticos (parejas, compañeros de trabajo, familia).
- **Marcador opcional** activable en ajustes, reutilizando el podio de §4.2.
- **Sonidos** y vibración (`navigator.vibrate`) en los cambios de turno.
- Modo **«ruleta»** que encadena juegos distintos al azar en una misma sesión.
- Que FIEsta 1 y FIEsta 2 se enlacen entre sí desde sus hubs.

---

*Documento vivo. Si se toma una decisión nueva, se escribe aquí: este archivo es
la fuente de la verdad del proyecto.* 🗺️
