# Plan de desarrollo — FIEsta 2 · «Yo nunca» 🍒

> Documento pensado para que otro agente **sin contexto** pueda implementar el
> juego leyendo solo esto y [`md/PLAN_DESARROLLO.md`](PLAN_DESARROLLO.md).

---

## 1. Contexto mínimo

**FIEsta 2** es una web app (PWA) de juegos de fiesta por turnos que se juega
**pasándose un solo móvil en vertical**. Todo es **HTML + CSS + JavaScript
vanilla**: sin frameworks, sin npm, sin build step, sin CDNs. Es una **SPA de una
sola página**: `index.html` contiene todas las pantallas como
`<section class="pantalla" data-pantalla="…">` y solo la que tiene `.activa` se
ve; se navega con `mostrarPantalla(nombre)`.

Todos los `.js` se cargan con `<script>` desde `index.html` y **viven en el
ámbito global**, así que **cada juego prefija absolutamente todo** con sus dos
letras. Las de este juego son **`yn`**.

El **núcleo compartido** (`js/nucleo/`) trae hecho lo que este juego no debe
reimplementar: configuración de jugadores, niveles de intensidad, modo fiesta,
persistencia y utilidades de azar (**§7 del plan global**, construido en la
Fase 2 del proyecto).

Reglas de trabajo: **español** en interfaz, código y comentarios; **sin
`// TODO`**; **una fase cada vez**; y **el usuario prueba la app él mismo** en su
navegador — nunca la abras ni la sirvas tú para «comprobar» un cambio de
interfaz.

> ✅ **Este juego se añadió después de la Fase 0** (§9.6 y §10 del plan global),
> así que su tarjeta en el hub (`index.html`, `js/nucleo/arranque.js`, `sw.js`)
> se añadió al empezar la Fase 1 de este plan, ya completada.

---

## 2. Qué es este juego

El clásico de mesa para beber, adaptado a pasarse el móvil. La app lee en voz
alta (a través de quien tenga el turno) una frase que empieza por **«Yo
nunca…»**: por ejemplo, «Yo nunca he fingido estar dormido para no hablar con
alguien».

**Quien SÍ lo ha hecho, baja un dedo** (todo el mundo empieza la partida con 5
dedos, gestionados a mano, fuera de la app) — o, si el grupo ha encendido el
**modo fiesta**, en vez de bajar un dedo, **bebe**.

La app **no lleva la cuenta de dedos ni de tragos**: solo sirve las frases sin
repetir y rota quién lee. Es el juego más simple de los seis, y por eso **abre
la implementación** (Fase 3 del plan global): con él se prueba el núcleo entero
usando el mínimo posible de piezas.

---

## 3. Decisiones cerradas (no volver a preguntar)

| Tema | Decisión |
|---|---|
| **Prefijo** | `yn` en estado, funciones, constantes, pantallas, IDs, clases y `localStorage`. |
| **Nº de jugadores** | **2–12**. Por defecto 5. |
| **Pantallas** | `yn-config` → `yn-juego` → `yn-fin`. |
| **Quién lee** | Rota **en orden** (nunca sorteo), una frase por jugador. |
| **Mecánica de resolución** | **La app no la gestiona.** Sin modo fiesta: cada jugador lleva sus propios **5 dedos** fuera de la app y baja uno si es su caso. Con modo fiesta: quien es su caso **bebe**, sin gestión de dedos. La instrucción («Si es tu caso, baja un dedo / bebe») es neutra en tiempo verbal a propósito, porque el banco mezcla frases de cosas ya hechas («he mentido…») con hipotéticas («probaría…», ver «Tipos de frase» más abajo). **Nunca hay un contador en la app**: es la misma filosofía de «sin marcador» que el resto de FIEsta 2 (§8 del plan global). |
| **Tipos de frase** | El banco mezcla dos registros: **confesión** («he mentido sobre mi edad») y **hipotética** («probaría el paracaidismo», «me atrevería a…»). No hay un campo `tipo` que las distinga: basta con que el propio texto, en pretérito perfecto o en condicional, complete «Yo nunca…» con sentido. |
| **Nivel «Salseo»** | El nivel que en el núcleo se llama internamente `"extremo"` (mismo id en todos los bancos y juegos, no se toca) se **muestra** como **«Salseo»** (`js/nucleo/intensidad.js`, `NIVELES`): no busca ser gratuito, sino generar temas de conversación entre amigos. Criterio de contenido igual que antes (§12 global): incómodo, no cruel. |
| **¿Se explica la regla de los dedos?** | Sí, en el overlay ⓘ del hub (`INFO_JUEGOS`, ya soportado desde la Fase 0): una frase breve para quien no conozca el juego de mesa. No hace falta un overlay nuevo. |
| **Plantillas** | ❌ **No se usan** (`{jugador}`, `{otro}`). El banco es autoconclusivo: nunca señala a una persona por nombre. Cuando una entrada picante involucra al grupo, se escribe en **genérico** («…alguien de este grupo»), nunca insertando un nombre real. |
| **Niveles de intensidad** | Los tres del núcleo, multi-selección, por defecto suave + picante. |
| **Modo fiesta** | Interruptor global del núcleo. Aquí **no dispara `castigoAlAzar()`**: solo cambia el texto de la instrucción de «baja un dedo» a «bebe». La propia frase ya es el disparador; no hay «fallo» que castigar. |
| **Datos** | Un solo banco `YN_FRASES` en `data/yonunca/frases.js`. |
| **Volumen** | **~200 frases por nivel** (~600 en total, por decisión explícita del usuario — supera el mínimo de 400 del plan global). Un solo formato: no hay tipos que repartir (a diferencia de «Quién es más…» o «Preguntas incómodas»). |
| **Qué hace la app** | Servir frases sin repetir, rotar quién lee, mostrar la instrucción correcta según el modo fiesta y guardar la partida. |
| **Qué NO hace la app** | ❌ No cuenta dedos, ❌ no cuenta tragos, ❌ no hay puntos, podio ni ganador. Todo eso se gestiona a mano, fuera de la app. |
| **Persistencia** | Clave `"yn_partida"`. Se guarda al servir cada frase; se borra en `yn-fin`. |
| **Reanudación y repetición** | Al reanudar, el repartidor se reinicia (puede repetirse alguna frase ya vista). No hay secretos que proteger, así que reanudar es trivial. |
| **Fin de partida** | Botón **«Terminar»** siempre visible → `yn-fin` con resumen → hub. |

---

## 4. Especificación

### 4.1 Flujo de juego

```
hub ──► yn-config ──► yn-juego ──┐
                          ▲      │  «Siguiente» (rota lector + frase nueva)
                          └──────┘
             «Terminar» ──────────► yn-fin ──► hub
```

**1. `yn-config`**
- Stepper `− N +` (2–12) + lista de nombres (núcleo, §7.3).
- Chips de niveles (núcleo, §7.4).
- Interruptor de **modo fiesta** (núcleo, §7.4). Debajo, una línea tenue fija que
  explica la regla que va a regir la partida y **cambia con el interruptor**:
  - Apagado: «Si es tu caso, baja un dedo (empezáis con 5 cada uno).»
  - Encendido: «Si es tu caso, bebe.»
- Botón **«Empezar»** y, si hay guardado, **«Continuar partida»**.
- Validación con `validarNombres()`; error en `#yn-error` (ámbar).

**2. `yn-juego`**
- Arriba, línea tenue: **«Lee ANA»**.
- Encabezado fijo en tamaño medio: **«Yo nunca…»**.
- El cuerpo de la frase en grande, debajo: «…he fingido estar dormido para no
  hablar con alguien».
- Línea de instrucción (la misma de `yn-config`, reflejando el modo fiesta
  actual): «Si es tu caso, **baja un dedo**» o «Si es tu caso, **bebe**».
- Botón primario grande **«Siguiente»** y botón secundario **«Terminar»**.
- Línea tenue de progreso: «Frase 12».

**3. `yn-fin`**
- Resumen: «Habéis pasado por **N** confesiones. Contad los dedos que os
  quedan.»
- Botones **«Otra partida»** y **«Volver al inicio»**. Borra `"yn_partida"`.

### 4.2 Modelo de datos

```js
// Todo el estado del juego vive aquí.
const ynEstado = {
  nombres: [],
  niveles: ["suave", "picante"],
  indiceLector: 0,
  fraseActual: null,      // { texto, nivel } tal cual del banco
  contador: { frases: 0 },
  repartidor: null,
};

const YN_MIN_JUGADORES = 2;
const YN_MAX_JUGADORES = 12;
const YN_CLAVE_GUARDADO = "yn_partida";
```

**Formato del banco** (`data/yonunca/frases.js`):

```js
// Generado desde frases.json — no editar a mano (usar agregar.py).
const YN_FRASES = [
  { texto: "he fingido estar dormido para no hablar con alguien", nivel: "suave" },
  { texto: "he mandado un mensaje a la persona equivocada",       nivel: "suave" },
  { texto: "he querido besar a alguien de este grupo",            nivel: "picante" },
];
```

Campos: `texto` (string, sin plantillas) y `nivel`
(`"suave"` | `"picante"` | `"extremo"`).

**Convenciones de escritura del banco:**
- El texto completa **«Yo nunca…»** (que pone la app, no el banco): empieza en
  minúscula y **no lleva punto final**.
- Siempre en **pretérito perfecto**, primera persona: «he mentido», «he
  fingido», «he llorado», «he cotilleado».
- **Nunca usa `{otro}` ni ningún hueco de plantilla.** Cuando una entrada
  necesita involucrar a otra persona del grupo, se escribe en **genérico**:
  «he querido besar a alguien de este grupo», «he mentido sobre mis
  sentimientos a alguien que está aquí ahora mismo». Nunca se inserta un nombre
  real: el juego no señala, cada uno confiesa lo que quiere confesar.

**Qué se guarda** (clave `"yn_partida"`):

```js
{ nombres, niveles, indiceLector, contador }
```

### 4.3 Pantallas y componentes

| Pantalla | Elemento | ID |
|---|---|---|
| `yn-config` | contenedor de nombres | `yn-nombres` |
| | stepper | `yn-stepper` |
| | chips de nivel | `yn-niveles` |
| | interruptor de modo fiesta | `yn-fiesta` |
| | línea de instrucción (regla vigente) | `yn-regla` |
| | mensaje de validación | `yn-error` |
| | botones | `yn-btn-empezar` · `yn-btn-continuar` |
| `yn-juego` | línea «Lee …» | `yn-lector` |
| | encabezado fijo «Yo nunca…» | `yn-encabezado` |
| | cuerpo de la frase | `yn-frase` |
| | línea de instrucción | `yn-instruccion` |
| | progreso | `yn-progreso` |
| | botones | `yn-btn-siguiente` · `yn-btn-terminar` |
| `yn-fin` | resumen | `yn-resumen` |
| | botones | `yn-btn-otra-partida` · `yn-btn-hub` |

`#yn-regla` (en `yn-config`) y `#yn-instruccion` (en `yn-juego`) muestran el
**mismo texto**, calculado por la misma función (`ynTextoInstruccion()`), para
que no diverjan si se toca uno y no el otro.

### 4.4 Qué del núcleo se usa y qué es propio

| Del núcleo (§7 global) | Para qué |
|---|---|
| `mostrarPantalla(nombre)` | Navegación. |
| `montarConfigJugadores` · `validarNombres` | `yn-config`. |
| `montarSelectorNiveles` · `filtrarPorNivel` | Chips de nivel y filtrado del banco. |
| `montarInterruptorModoFiesta` · `modoFiestaActivo` | Interruptor y texto de instrucción (`bebe` vs `baja un dedo`). |
| `crearRepartidor(banco)` | Servir frases sin repetir. |
| `guardarJSON` · `cargarJSON` · `hayGuardado` · `borrarGuardado` | «Continuar partida». |

**No usa:** `rellenarPlantilla` / `otrosNecesarios` (el banco no tiene huecos),
`castigoAlAzar` (aquí el modo fiesta no dispara castigos aleatorios, solo cambia
un texto fijo) ni `iniciarHandoff` (no hay secretos que repartir).

**Propio de este juego:** `ynTextoInstruccion()` y la rotación simple del
lector — es, junto con «Quién es más…», el juego con menos piezas propias de
los seis.

---

## 5. Convenciones para no chocar con los otros juegos

- **Estado**: `ynEstado`. **Funciones**: `ynEmpezarPartida()`,
  `ynServirFrase()`, `ynRender()`, `ynSiguiente()`, `ynTextoInstruccion()`,
  `ynTerminar()`, `ynGuardar()`, `ynReanudar()`.
  **Constantes**: `YN_MIN_JUGADORES`, `YN_MAX_JUGADORES`…
- **Pantallas**: `data-pantalla="yn-config|yn-juego|yn-fin"`.
- **IDs** empiezan por `yn-`; **clases CSS** por `.yn-`.
- **`localStorage`**: solo `"yn_partida"`.
- **`<script>` en `index.html`** (§6.2 global), **el primer juego en cargarse**:

```html
<script src="data/yonunca/frases.js"></script>
…
<script src="js/yonunca/main.js"></script>
```

- **CSS**: bloque propio al final de `css/estilos.css`, abierto con
  `/* ===== Yo nunca (yn) ===== */`.
- Wiring dentro de su propio `DOMContentLoaded`; **el núcleo no se toca**, salvo
  la entrada del juego en `INFO_JUEGOS` y la tarjeta en el hub (ver Fase 1 de
  este plan, más abajo: ese paso quedó pendiente de la Fase 0).

---

## 6. Desarrollo por fases

### Fase 1 — Tarjeta del hub, pantallas y configuración

🎯 Dejar a «Yo nunca» enganchado al hub y con una configuración funcional.

🛠️ A construir
- **Añadir la 6ª tarjeta al hub** en `index.html` (pantalla `fiesta`): misma
  estructura que las otras 5 `.juego-card`, con su `<span class="juego-card-info">`
  y su bloque en `.info-overlay` explicando el juego **y la regla de los dedos**
  para quien no conozca el clásico de mesa.
- **Añadir la entrada de «Yo nunca» a `INFO_JUEGOS`** en `js/nucleo/arranque.js`
  (nombre, descripción corta, descripción larga del overlay, prefijo `yn` y
  pantalla de entrada `yn-config`).
- Las 3 pantallas del juego (`yn-config`, `yn-juego`, `yn-fin`) en `index.html`,
  con los IDs de §4.3.
- Bloque CSS `yn`: layout de `yn-juego` (encabezado + frase grande +
  instrucción), fila de botones.
- `js/yonunca/main.js` con `ynEstado`, wiring, `montarConfigJugadores`,
  `montarSelectorNiveles`, interruptor de modo fiesta y `ynTextoInstruccion()`
  (usada tanto en `yn-config` como en `yn-juego`).
- `ynEmpezarPartida()` y navegación completa entre las tres pantallas.

✅ Aceptación
- La 6ª tarjeta aparece en el hub, con su ⓘ funcionando igual que las otras 5.
- `#yn-regla` cambia de texto en tiempo real al tocar el interruptor de modo
  fiesta, sin recargar.
- Nombres vacíos o repetidos bloquean el paso.
- La consola está limpia.

🔍 Qué debe probar el usuario
Abrir el hub y comprobar que ahora hay 6 tarjetas y que la de «Yo nunca» lleva a
la configuración; togglear el modo fiesta en `yn-config` y ver cambiar el texto
de la regla.

---

### Fase 2 — Motor de frases y rotación

🎯 Que el juego sea jugable de principio a fin con un banco de prueba.

🛠️ A construir
- Banco provisional de ~30 frases (formato definitivo).
- `filtrarPorNivel()` + `crearRepartidor()`.
- `ynServirFrase()` y `ynRender()`: pinta «Lee NOMBRE», el encabezado fijo, el
  cuerpo de la frase y la instrucción vigente.
- `ynSiguiente()`: rota el lector en orden y sirve frase nueva.
- Contador y `yn-fin` con el resumen real.
- Aviso de banco agotado (`.anuncio`) y rebarajado.

✅ Aceptación
- 30 frases seguidas sin repetición.
- El lector rota en orden, sin saltarse a nadie.
- La instrucción visible en `yn-juego` coincide siempre con el estado actual del
  interruptor de modo fiesta (si se apaga a mitad de partida, la frase siguiente
  ya muestra «baja un dedo»).

🔍 Qué debe probar el usuario
Una partida de 5 personas jugando de verdad, con y sin modo fiesta, y cambiando
el interruptor a mitad de partida para ver que la instrucción se actualiza.

---

### Fase 3 — Banco de contenido (~200 por nivel)

🎯 Contenido definitivo.

🛠️ A construir
- `data/yonunca/frases.json` (fuente) y `frases.js` (generado).
- `data/yonunca/agregar.py`: pregunta texto y nivel; valida el nivel; **avisa si
  el texto contiene `{otro}` o algo que empiece por mayúscula/parezca un
  nombre propio** (para pillar el error de escribir una frase dirigida por
  error); evita duplicados; regenera el `.js`.
- Contenido a cuatro manos (§2.4 global): tanda de 30–50, validar el tono con el
  usuario, y **solo después** producir en volumen.
- Nivel «Salseo» (antes «Extremo», ver tabla de decisiones): frases que generen
  tema de conversación entre amigos, incómodo pero no cruel.
- Picante algo más explícito que la tanda inicial (decisión del usuario tras
  ver la primera muestra).
- Frases hipotéticas («probaría…», «me atrevería a…») mezcladas con las de
  confesión, repartidas por los tres niveles.

✅ Aceptación
- ~200 frases por nivel (~600 en total).
- Ninguna usa `{otro}` ni nombra a una persona concreta.
- Ninguna se solapa con el tipo `nunca` de «Quién es más…» (ese banco pregunta
  **quién del grupo** nunca ha hecho algo; este pregunta **por uno mismo**).

🔍 Qué debe probar el usuario
Jugar solo con «Salseo» y decidir si el filo es el que quiere para su grupo.

---

### Fase 4 — Persistencia y pulido

🎯 Dejar el juego terminado.

🛠️ A construir
- `ynGuardar()` al servir cada frase; `ynReanudar()`; borrado en `yn-fin`.
- `clamp()` en el cuerpo de la frase para que 3-4 líneas no provoquen scroll.
- `env(safe-area-inset-*)` en botón volver y fila inferior.
- Subir `APP_VERSION` y `CACHE`, y añadir **todos** los archivos nuevos de este
  juego (incluida la tarjeta ya integrada en `index.html`) a `ARCHIVOS` en
  `sw.js`.

✅ Aceptación
- Se reanuda una partida a medias con el mismo lector y el mismo estado del
  interruptor de modo fiesta.
- Al terminar, «Continuar» desaparece.
- La frase más larga del banco cabe sin scroll en 360 px.

🔍 Qué debe probar el usuario
En el móvil: partida a medias → cerrar → reabrir → continuar. Y, con la app ya
instalada, modo avión para confirmar que la 6ª tarjeta también funciona offline.

---

## 7. Casos borde

- **2 jugadores**: funciona con normalidad (no hay `{otro}` que necesite un
  tercero).
- **Banco agotado**: aviso en el `.anuncio` y rebarajado, nunca pantalla en
  blanco.
- **Banco vacío tras filtrar** (p. ej. solo «extremo» marcado y ese tramo se
  queda corto): volver a `yn-config` con el error «No hay frases para esta
  configuración».
- **Cambiar el modo fiesta a mitad de partida**: la instrucción de la frase
  **actual** no cambia retroactivamente (ya se leyó con una regla), pero la
  **siguiente** frase sí refleja el nuevo estado.
- **Textos larguísimos**: `clamp()` + `overflow-wrap`.
- **Nombres repetidos o vacíos**: bloqueados en la configuración.
- **Recarga a mitad**: se reanuda con una frase nueva del mismo filtro (no hay
  secreto que proteger).
- **`localStorage` bloqueado** (incógnito): sin «Continuar», el resto igual.
- **Doble toque en «Siguiente»**: deshabilitar el botón hasta que se haya
  renderizado la frase siguiente, para no saltarse a nadie en la rotación.
- **Confundir este banco con el de «Quién es más…»**: si al escribir contenido
  aparece una frase en tercera persona («¿Quién nunca ha…?»), es del banco
  equivocado — este banco es siempre en primera persona («Yo nunca he…»).

---

## 8. Checklist

- [x] **Fase 1** — Tarjeta del hub, pantallas y configuración
- [x] **Fase 2** — Motor de frases y rotación
- [ ] **Fase 3** — Banco de contenido (~200 por nivel): 🚧 en curso. Primera
      tanda de 67 validada por el usuario, que pidió: renombrar «Extremo» a
      «Salseo» (hecho, `js/nucleo/intensidad.js`), picante más explícito,
      «Salseo» orientado a generar conversación, y frases hipotéticas además
      de las de confesión (hecho, `ynTextoInstruccion()` neutra en tiempo
      verbal). Generadas 633 frases (223 suave / 204 picante / 206 salseo),
      sin duplicados exactos, probadas con el juego completo en jsdom (0
      errores de consola). Primera revisión del usuario sobre el nivel
      suave: 45 frases reescritas, 4 eliminadas y 20 nuevas (633 → 649
      frases en total, 239 suave), aplicado con un script puntual sobre
      `frases.json` que reproduce exactamente `regenerar_js()` de
      `agregar.py`. A continuación, el usuario revisó **picante y salseo**
      directamente en `frases.json` (edición manual + regeneración del
      `.js`, commit `7830742`): picante pasó de 204 a 229 frases (+102 /
      −77) y salseo se reescribió casi por completo, de 206 a 205 (+202 /
      −203). Banco actual: 674 frases (240 suave / 229 picante / 205
      salseo). Pendiente de que el usuario siga recortando y afinando
      (§2.4) antes de dar la fase por cerrada
- [x] **Fase 4** — Persistencia y pulido (adelantada junto con las Fases 1-2:
      guardado/reanudación, `clamp()` en la frase, `APP_VERSION`/`CACHE`/`ARCHIVOS`
      al día; falta la prueba en dispositivo real y modo avión, que hace el usuario)
- [ ] `APP_VERSION`, `CACHE` y `ARCHIVOS` actualizados (incluida la tarjeta del hub)
- [ ] `<script>` de datos y lógica añadidos a `index.html`
- [ ] `INFO_JUEGOS` en `js/nucleo/arranque.js` incluye «Yo nunca»

---

## 9. Muestra de contenido (para fijar el tono)

~30 entradas de referencia. Van al banco tal cual; la Fase 3 continúa desde aquí.

```js
// ── suave
{ texto: "he fingido estar dormido para no hablar con alguien", nivel: "suave" },
{ texto: "he mandado un mensaje a la persona equivocada", nivel: "suave" },
{ texto: "me he reído de un chiste que no he entendido", nivel: "suave" },
{ texto: "he mentido sobre haber leído un libro", nivel: "suave" },
{ texto: "he llorado viendo un anuncio", nivel: "suave" },
{ texto: "me he colado en una cola", nivel: "suave" },
{ texto: "he fingido que se me había cortado la llamada", nivel: "suave" },
{ texto: "he vuelto a comprar algo que ya tenía por no buscarlo", nivel: "suave" },
{ texto: "he cantado en la ducha a pleno pulmón", nivel: "suave" },
{ texto: "me he hecho el dormido en un coche para no hablar", nivel: "suave" },

// ── picante
{ texto: "he querido besar a alguien de este grupo", nivel: "picante" },
{ texto: "he cotilleado el móvil de alguien sin permiso", nivel: "picante" },
{ texto: "he mentido para librarme de un plan", nivel: "picante" },
{ texto: "me he arrepentido de un mensaje justo después de enviarlo", nivel: "picante" },
{ texto: "he salido con alguien solo por no estar solo", nivel: "picante" },
{ texto: "he fingido que me iba bien en el trabajo cuando no era así", nivel: "picante" },
{ texto: "he hablado mal de alguien que está en esta sala", nivel: "picante" },
{ texto: "he tenido un sueño con alguien que está aquí ahora mismo", nivel: "picante" },
{ texto: "he buscado a un ex en redes sociales esta misma semana", nivel: "picante" },
{ texto: "he dicho una mentira para quedar mejor en una entrevista", nivel: "picante" },

// ── extremo
{ texto: "he sentido celos de alguien que está en esta sala", nivel: "extremo" },
{ texto: "he roto algo a propósito y he dejado que culparan a otro", nivel: "extremo" },
{ texto: "he fingido un sentimiento que no tenía para no herir a alguien", nivel: "extremo" },
{ texto: "he guardado un secreto que no era mío durante años", nivel: "extremo" },
{ texto: "he deseado que una relación se acabara sin atreverme a decirlo", nivel: "extremo" },
{ texto: "he dejado de hablar con alguien sin darle explicaciones", nivel: "extremo" },
{ texto: "he mentido sobre algo importante a mi familia", nivel: "extremo" },
```

> **Criterio de contenido (§12 global):** «Extremo» debe ser **incómodo, no
> cruel**. Nada que humille por aspecto, orientación, origen o salud mental. Y
> recuerda la regla de plantillas: **ninguna frase señala a una persona
> concreta por su nombre**; lo más lejos que llega es «alguien de este grupo».
