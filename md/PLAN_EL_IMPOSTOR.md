# Plan de desarrollo — FIEsta 2 · «El Impostor» 🍒

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
letras. Las de este juego son **`im`**.

El **núcleo compartido** (`js/nucleo/`) trae hecho lo que este juego no debe
reimplementar: configuración de jugadores, niveles, modo fiesta, persistencia,
utilidades de azar y —clave aquí— el **handoff** para pasar el móvil sin que
nadie vea lo del otro (**§7 del plan global**, construido en la Fase 2 del
proyecto).

Reglas de trabajo: **español** en interfaz, código y comentarios; **sin
`// TODO`**; **una fase cada vez**; y **el usuario prueba la app él mismo**.

> ⚠️ **Este es el juego más complejo de los cinco** y por eso va el último
> (Fase 7 del plan global). Tiene reparto secreto, protección anti-espionaje y
> una máquina de estados de verdad. No lo empieces hasta que el núcleo esté
> terminado y probado.

---

## 2. Qué es este juego

Todos los jugadores reciben **la misma palabra secreta** menos **el impostor**,
que solo recibe una **pista vaga** («Un trabajo de cara al público»).

Después, por turnos, **cada uno dice una sola palabra relacionada** con la
secreta. Los inocentes tienen que demostrar que la conocen **sin ser tan obvios
como para regalársela al impostor**; el impostor improvisa a partir de la pista y
de lo que van diciendo los demás, rezando por no cantar.

Tras una o varias rondas de palabras, **el grupo debate y acusa a alguien**.
Alguien toca su nombre en la app —el **único toque «de gestión» de toda
FIEsta 2**— y la app revela quién era el impostor, cuál era la palabra y si el
grupo acertó.

Con dos impostores (grupos de 7 o más) hay un giro: **no se conocen entre
ellos**. Cada uno cree que está solo, así que pueden acusarse mutuamente con toda
la convicción del mundo.

---

## 3. Decisiones cerradas (no volver a preguntar)

| Tema | Decisión |
|---|---|
| **Prefijo** | `im` en estado, funciones, constantes, pantallas, IDs, clases y `localStorage`. |
| **Nº de jugadores** | **3–12** (recomendado 4+). Por defecto 5. |
| **Nº de impostores** | **1** por defecto. **2 solo a partir de 7 jugadores**; con menos, el selector se bloquea en 1. Con 3 jugadores, 1 obligatorio. |
| **¿Los impostores se conocen?** | ❌ **No.** Cada impostor cree que es el único. Es más divertido, más caótico (pueden acusarse entre ellos) y hace el reparto más simple: nadie ve el nombre de nadie. |
| **Nº de rondas de palabras** | **1–3**, por defecto **2**. Se elige en `im-config`. |
| **Orden de palabras** | Se sortea al empezar la ronda, con una regla: **el primero en hablar nunca es un impostor** (hablar primero sin información es una desventaja brutal). **El mismo orden se repite en todas las rondas** de la partida, para que la mesa lo siga sin perderse. |
| **Pantallas** | `im-config` → `im-reparto` → `im-ronda` → `im-acusacion` → `im-revelacion`. |
| **Acusación** | Lista de nombres; se **toca uno para seleccionarlo** (queda marcado) y luego se pulsa **«Confirmar acusación»**. Dos pasos, para que un roce no arruine la partida. |
| **Empate / no hay acuerdo** | La app no gestiona votos: el grupo decide a viva voz y **alguien toca un solo nombre**. Si no hay acuerdo, que discutan más. |
| **Niveles de intensidad** | Los tres del núcleo, multi-selección, por defecto suave + picante. Filtran el banco de palabras. |
| **Modo fiesta** | Interruptor global del núcleo. En `im-revelacion`: si el grupo acierta, castigo para **el impostor**; si falla, castigo para **todos los demás**. |
| **Datos** | Un solo banco `IM_PALABRAS` en `data/impostor/palabras.js`, con `palabra`, `pista`, `categoria` y `nivel`. |
| **Volumen** | **≥ 400 palabras**, **cada una con su pista escrita a mano** (nunca derivada automáticamente de la categoría: saldrían todas iguales). Reparto orientativo: ~40 % suave, ~40 % picante, ~20 % extremo. |
| **Qué hace la app** | Repartir en secreto, fijar el orden, contar las rondas, registrar **a quién acusa el grupo** y revelar. |
| **Qué NO hace la app** | ❌ No cuenta votos individuales, ❌ no lleva puntos entre rondas, ❌ no hay podio ni ganador. La discusión es del grupo. |
| **Persistencia** | ⚠️ **Especial:** este juego **NO guarda la partida en curso**. Reanudar a mitad de reparto o de ronda filtraría información. Solo se guarda la **configuración** (jugadores, nº de impostores, nº de rondas, niveles) con la clave `"im_config"`, para no volver a escribir los nombres. En `im-config` el botón se llama **«Usar la última configuración»**, no «Continuar partida». |
| **Recarga a mitad** | Se vuelve a `im-config` con la configuración cargada y se empieza una ronda nueva. Nunca se retoma un reparto a medias. |
| **«Otra ronda»** | Desde `im-revelacion`: mismos jugadores y ajustes, **palabra nueva, impostores nuevos y orden nuevo**. |

---

## 4. Especificación

### 4.1 Flujo de juego

```
hub ──► im-config ──► im-reparto ──► im-ronda ──► im-acusacion ──► im-revelacion
                       (handoff)      (× rondas)                       │
                          ▲                                            │
                          └──────────── «Otra ronda» ───────────────────┤
                                                                       │
                                          «Terminar» ──────────────────►  hub
```

**1. `im-config`**
- Stepper `− N +` (3–12) + lista de nombres (núcleo, §7.3).
- Stepper de **nº de impostores** (1–2). Si `nombres.length < 7`, se fuerza a 1 y
  el stepper se deshabilita con la ayuda: «2 impostores a partir de 7 jugadores».
- Stepper de **nº de rondas** (1–3, por defecto 2).
- Chips de niveles (núcleo, §7.4).
- Interruptor de modo fiesta (núcleo, §7.4).
- Botones **«Empezar»** y, si hay guardado, **«Usar la última configuración»**.
- Validación con `validarNombres()`; error en `#im-error` (ámbar).

**2. `im-reparto`** — handoff del núcleo (§7.6).
- Para cada jugador, en orden de la lista: «Pasa el móvil a **NOMBRE**» →
  botón **«Ver mi palabra»** → contenido secreto → **«Ocultar y pasar»**.
- Contenido secreto de un **inocente**: la palabra en grande + la categoría en
  pequeño («**Camarero** · Oficios»).
- Contenido secreto de un **impostor**: «**ERES EL IMPOSTOR**» en grande (en
  `--color-acento`) + su **pista** («Un trabajo de cara al público») + la línea
  «Nadie más sabe que lo eres».
- ⚠️ **Protección anti-espionaje (obligatoria):** el nodo secreto **no existe en
  el DOM** hasta que se pulsa «Ver mi palabra» y se **borra del DOM** al pulsar
  «Ocultar y pasar». No basta con ocultarlo por CSS (se ve en ángulo o
  inspeccionando).
- Se puede volver a pulsar «Ver mi palabra» **mientras siga siendo tu turno de
  reparto**; nunca después.
- Al terminar el último jugador → `im-ronda`.

**3. `im-ronda`**
- Línea de progreso: «Ronda **1** de 2 · palabra **3** de 5».
- «Turno de **NOMBRE**» en grande + la instrucción fija: «Di **una palabra**
  relacionada con la secreta».
- Botón primario **«Siguiente»**. Al acabar la última palabra de la última ronda
  → `im-acusacion`.
- Botón secundario **«Terminar»**.

**4. `im-acusacion`**
- Título: «¿Quién es el impostor?» + ayuda: «Debatid en voz alta y tocad un
  nombre».
- Lista de botones con todos los nombres (`.im-nombre`). Al tocar uno queda
  `.seleccionado`; tocar otro cambia la selección.
- Botón primario **«Confirmar acusación»**, deshabilitado hasta que haya
  selección.

**5. `im-revelacion`**
- Veredicto en grande: «**¡Acertasteis!**» o «**El impostor se ha salido con la
  suya**».
- «El impostor era **LUIS**» (con 2: «Los impostores eran **LUIS** y **ANA**» y,
  si acertaron a uno solo, se dice también «se os escapó **ANA**»).
- «La palabra era **Camarero**» + «La pista del impostor: *Un trabajo de cara al
  público*».
- Con modo fiesta, `.anuncio`: si acertaron, «🍻 Luis: **un trago doble**»; si
  no, «🍻 Todos menos Luis: **un trago**».
- Botones: **«Otra ronda»** (primario) y **«Terminar»** (secundario → hub).

### 4.2 Modelo de datos

```js
// Todo el estado del juego vive aquí.
const imEstado = {
  nombres: [],             // ["Ana", "Luis", …]
  niveles: ["suave", "picante"],
  nImpostores: 1,
  nRondas: 2,

  // Se recalculan en cada ronda de juego:
  entrada: null,           // { palabra, pista, categoria, nivel } del banco
  impostores: [],          // índices en nombres, p. ej. [3]
  orden: [],               // índices en nombres: el orden de palabras
  rondaActual: 1,          // 1…nRondas
  posicionActual: 0,       // índice dentro de orden
  acusado: null,           // índice acusado, o null
  castigoActual: "",       // solo si el modo fiesta está activo

  repartidor: null,
};

const IM_MIN_JUGADORES = 3;
const IM_MAX_JUGADORES = 12;
const IM_MIN_PARA_DOS_IMPOSTORES = 7;
const IM_MAX_RONDAS = 3;
const IM_CLAVE_CONFIG = "im_config";   // solo configuración, nunca la partida
```

**Formato del banco** (`data/impostor/palabras.js`):

```js
// Generado desde palabras.json — no editar a mano (usar agregar.py).
const IM_PALABRAS = [
  { palabra: "Camarero", pista: "Un trabajo de cara al público", categoria: "Oficios", nivel: "suave" },
  { palabra: "Tinder",   pista: "Algo que usas en el móvil",     categoria: "Apps",    nivel: "picante" },
];
```

> **La pista es la pieza delicada del diseño.** Debe ser **lo bastante vaga como
> para no regalar la palabra** y **lo bastante útil como para que el impostor
> pueda fingir**. Regla: la pista describe **la categoría o el contexto**, nunca
> una propiedad distintiva.
> - ❌ Mala: «Sirve copas en un bar» (eso *es* la palabra).
> - ✅ Buena: «Un trabajo de cara al público».
> - ❌ Mala: «Una app para ligar» (regala «Tinder»).
> - ✅ Buena: «Algo que usas en el móvil».

**Sorteo de impostores y orden** (`imPrepararRonda()`):

```js
// 1. Palabra: del repartidor sobre el banco filtrado por nivel.
// 2. Impostores: elegirN(indices, nImpostores).
// 3. Orden: se baraja todo el mundo, pero el primero en hablar nunca es
//    impostor (hablar primero sin información es una desventaja brutal).
function imSortearOrden(nombres, impostores) {
  const inocentes = nombres.map((_, i) => i).filter((i) => !impostores.includes(i));
  const primero = elegirAlAzar(inocentes);
  const resto = barajar(nombres.map((_, i) => i).filter((i) => i !== primero));
  return [primero, ...resto];
}
```

**Qué se guarda** (clave `"im_config"`, **solo configuración**):

```js
{ nombres, niveles, nImpostores, nRondas }
```

Nunca se guardan `entrada`, `impostores`, `orden` ni el progreso de la ronda.

### 4.3 Pantallas y componentes

| Pantalla | Elemento | ID |
|---|---|---|
| `im-config` | contenedor de nombres | `im-nombres` |
| | stepper de jugadores | `im-stepper` |
| | stepper de impostores | `im-stepper-impostores` |
| | ayuda del stepper de impostores | `im-ayuda-impostores` |
| | stepper de rondas | `im-stepper-rondas` |
| | chips de nivel | `im-niveles` |
| | interruptor de modo fiesta | `im-fiesta` |
| | mensaje de validación | `im-error` |
| | botones | `im-btn-empezar` · `im-btn-config-guardada` |
| `im-reparto` | contenedor del handoff | `im-handoff` |
| `im-ronda` | progreso | `im-progreso` |
| | nombre del jugador | `im-nombre-turno` |
| | botones | `im-btn-siguiente` · `im-btn-terminar` |
| `im-acusacion` | lista de nombres | `im-lista-acusados` |
| | botón confirmar | `im-btn-confirmar` |
| `im-revelacion` | veredicto | `im-veredicto` |
| | quién era el impostor | `im-quien` |
| | palabra y pista | `im-palabra` · `im-pista` |
| | castigo (`.anuncio`, `hidden`) | `im-castigo` |
| | botones | `im-btn-otra-ronda` · `im-btn-hub` |

**Contenido secreto del handoff** — se construye **en el momento**, en una
función que devuelve un nodo nuevo cada vez (nunca HTML que ya estuviera en la
página):

```js
// Devuelve el nodo secreto de quien toca. El handoff lo inserta al pulsar
// «Ver mi palabra» y lo elimina del DOM al pulsar «Ocultar y pasar».
function imContenidoDe(indice) {
  const caja = document.createElement("div");
  caja.className = "im-secreto";
  if (imEstado.impostores.includes(indice)) {
    caja.innerHTML = `
      <p class="im-secreto-titulo im-impostor">ERES EL IMPOSTOR</p>
      <p class="im-secreto-pista">${imEstado.entrada.pista}</p>
      <p class="im-secreto-nota">Nadie más sabe que lo eres</p>`;
  } else {
    caja.innerHTML = `
      <p class="im-secreto-titulo">${imEstado.entrada.palabra}</p>
      <p class="im-secreto-nota">${imEstado.entrada.categoria}</p>`;
  }
  return caja;
}
```

⚠️ Recordatorios de CSS: `.vista[hidden]`, `.anuncio[hidden]` y
`#im-btn-confirmar[disabled]` necesitan reglas explícitas; el atributo `hidden`
pierde contra `display: flex` (§3.3 del plan global).

### 4.4 Qué del núcleo se usa y qué es propio

| Del núcleo (§7 global) | Para qué |
|---|---|
| `mostrarPantalla(nombre)` | Navegación. |
| `montarConfigJugadores` · `validarNombres` | `im-config` (con `min: 3`). |
| `montarSelectorNiveles` · `filtrarPorNivel` | Chips y filtrado del banco. |
| `montarInterruptorModoFiesta` · `modoFiestaActivo` · `castigoAlAzar` | Castigo de `im-revelacion`. |
| `iniciarHandoff({ nombres, contenidoDe, alTerminar })` | **Todo `im-reparto`**, con la protección anti-espionaje. |
| `crearRepartidor(banco)` | Palabra nueva en cada ronda sin repetir. |
| `barajar` · `elegirAlAzar` · `elegirN` | Sorteo de impostores y de orden. |
| `guardarJSON` · `cargarJSON` · `hayGuardado` | Solo para `"im_config"`. |

**Propio de este juego:** los steppers de impostores y rondas con sus reglas, el
sorteo con la regla del «primero nunca es impostor», la máquina de rondas, la
pantalla de acusación y la revelación.

**No usa:** `rellenarPlantilla` (el banco no tiene huecos) ni `borrarGuardado`
(la configuración se conserva a propósito).

---

## 5. Convenciones para no chocar con los otros juegos

- **Estado**: `imEstado`. **Funciones**: `imEmpezarPartida()`,
  `imPrepararRonda()`, `imSortearOrden()`, `imContenidoDe()`, `imEntrarReparto()`,
  `imEntrarRonda()`, `imSiguientePalabra()`, `imEntrarAcusacion()`,
  `imConfirmarAcusacion()`, `imRevelar()`, `imOtraRonda()`, `imTerminar()`,
  `imGuardarConfig()`, `imCargarConfig()`.
  **Constantes**: `IM_MIN_PARA_DOS_IMPOSTORES`, `IM_MAX_RONDAS`…
- **Pantallas**:
  `data-pantalla="im-config|im-reparto|im-ronda|im-acusacion|im-revelacion"`.
- **IDs** empiezan por `im-`; **clases CSS** por `.im-`.
- **`localStorage`**: solo `"im_config"`.
- **`<script>` en `index.html`** (§6.2 global):

```html
<script src="data/impostor/palabras.js"></script>
…
<script src="js/impostor/main.js"></script>
<!-- si el reparto crece, se puede partir en js/impostor/reparto.js, cargado ANTES de main.js -->
```

- **CSS**: bloque propio al final de `css/estilos.css`, abierto con
  `/* ===== El Impostor (im) ===== */`.
- Wiring dentro de su propio `DOMContentLoaded`; **el núcleo no se toca**.

---

## 6. Desarrollo por fases

### Fase 1 — Pantallas y configuración

🎯 Que se pueda configurar una partida con sus tres steppers y sus reglas.

🛠️ A construir
- Las 5 pantallas en `index.html` con los IDs de §4.3.
- Bloque CSS `im`: steppers en fila, lista de acusados, tarjeta de secreto,
  veredicto grande.
- `js/impostor/main.js` con `imEstado`, wiring, `montarConfigJugadores`
  (`min: 3`), `montarSelectorNiveles` e interruptor de modo fiesta.
- Steppers de **impostores** (1–2, con la regla de los 7 jugadores y su texto de
  ayuda) y de **rondas** (1–3).
- `imGuardarConfig()` / `imCargarConfig()` y el botón «Usar la última
  configuración».

✅ Aceptación
- Con 6 jugadores el stepper de impostores está bloqueado en 1 y se ve la ayuda;
  al subir a 7 se desbloquea. **Si se baja de 7 con 2 impostores puestos, vuelve
  a 1 automáticamente.**
- Con 3 jugadores todo sigue funcionando (1 impostor).
- «Usar la última configuración» restaura nombres y ajustes.

🔍 Qué debe probar el usuario
Subir y bajar de 6 a 7 jugadores con 2 impostores seleccionados y ver que el
ajuste se corrige solo.

---

### Fase 2 — Reparto secreto (handoff)

🎯 Que cada jugador vea lo suyo y **solo** lo suyo.

🛠️ A construir
- Banco provisional de ~30 palabras con sus pistas.
- `imPrepararRonda()`: palabra del repartidor, sorteo de impostores con
  `elegirN`, sorteo de orden con `imSortearOrden()`.
- `imEntrarReparto()`: `iniciarHandoff({ nombres, contenidoDe: imContenidoDe,
  alTerminar: imEntrarRonda })`.
- `imContenidoDe()` según §4.3, creando el nodo **en el momento**.

✅ Aceptación
- El secreto **no está en el DOM** antes de pulsar «Ver mi palabra» (comprobable
  con el inspector) y **desaparece del DOM** al pulsar «Ocultar y pasar».
- Con 2 impostores, **ninguno** ve el nombre del otro ni sabe que hay otro.
- Volver a pulsar «Ver mi palabra» funciona mientras es tu turno, y es imposible
  después.
- Todos los inocentes ven exactamente la misma palabra.

🔍 Qué debe probar el usuario
Repartir con 5 personas de verdad y comprobar que nadie ve nada que no le toque;
además, abrir el inspector del navegador en medio del reparto y buscar la palabra.

---

### Fase 3 — Rondas, acusación y revelación

🎯 Cerrar la partida de principio a fin.

🛠️ A construir
- `imEntrarRonda()` / `imSiguientePalabra()`: recorre `orden`, avanza
  `rondaActual` al terminar cada vuelta y salta a `im-acusacion` al acabar la
  última.
- Progreso «Ronda 1 de 2 · palabra 3 de 5».
- `im-acusacion`: lista de botones con los nombres, selección única con la clase
  `.seleccionado`, botón confirmar deshabilitado hasta que haya selección.
- `imRevelar()`: veredicto, impostor(es), palabra y pista, con los tres textos
  del caso de 2 impostores.
- `imOtraRonda()`: vuelve a `imPrepararRonda()` + `im-reparto` con los mismos
  jugadores.

✅ Aceptación
- Con 5 jugadores y 2 rondas se piden exactamente 10 palabras.
- **El primero en hablar nunca es impostor**, comprobado en 20 rondas seguidas.
- El orden es **el mismo** en la ronda 1 y en la ronda 2.
- Acertar y fallar producen los dos veredictos correctos, también con 2
  impostores.
- «Otra ronda» cambia palabra, impostores y orden.

🔍 Qué debe probar el usuario
Una partida completa de 5 personas con 2 rondas, y otra de 7 con 2 impostores.

---

### Fase 4 — Banco de contenido (≥ 400)

🎯 Contenido definitivo, con **pistas escritas a mano**.

🛠️ A construir
- `data/impostor/palabras.json` (fuente) y `palabras.js` (generado).
- `data/impostor/agregar.py`: pregunta palabra, pista, categoría y nivel; valida
  el nivel; **rechaza pistas que contengan la propia palabra** (el error más
  frecuente); avisa si la pista tiene menos de 3 palabras; evita duplicados de
  `palabra`; regenera el `.js`.
- Categorías orientativas: Oficios, Objetos de casa, Comida, Lugares, Apps,
  Famosos, Animales, Situaciones, Partes del cuerpo, Vicios, Relaciones.
- Contenido a cuatro manos (§2.4 global): tanda de 30–50, validar el calibrado de
  las pistas con el usuario, y **solo después** producir en volumen.

✅ Aceptación
- ≥ 400 palabras, reparto ~40/40/20 por nivel, con al menos 8 categorías.
- Ninguna pista contiene la palabra ni un sinónimo directo.
- Ninguna pista es tan vaga que valga para 200 entradas («Una cosa»).
- `python data/impostor/agregar.py` funciona y regenera el `.js`.

🔍 Qué debe probar el usuario
Jugar 5 rondas seguidas y decir, en cada una, si la pista le pareció **justa**:
ese es el único criterio que importa en este banco.

---

### Fase 5 — Modo fiesta, persistencia y pulido

🎯 Dejar el juego terminado.

🛠️ A construir
- Modo fiesta en `im-revelacion` con los dos casos (acierto / fallo) y
  `castigoAlAzar()`.
- `imGuardarConfig()` al empezar cada partida; carga en `im-config`.
- Comprobación explícita de que **no** existe ninguna clave `"im_partida"`.
- `clamp()` en la palabra secreta y en el veredicto.
- `env(safe-area-inset-*)` en botón volver y filas de botones.
- Subir `APP_VERSION` y `CACHE`, y añadir los archivos nuevos a `ARCHIVOS`.

✅ Aceptación
- Recargar a mitad de reparto o de ronda lleva a `im-config` con la
  configuración cargada, **sin filtrar nada** de la partida anterior.
- Con modo fiesta apagado no aparece ningún castigo.
- La palabra más larga del banco y un nombre de 20 caracteres caben sin scroll en
  360 px.

🔍 Qué debe probar el usuario
Recargar la página en mitad de un reparto y comprobar que no se puede recuperar
la palabra de ninguna manera.

---

## 7. Casos borde

- **3 jugadores**: 1 impostor obligatorio; el juego es corto pero funciona.
- **Bajar de 7 con 2 impostores puestos**: el ajuste se corrige a 1
  automáticamente y se avisa en la ayuda.
- **2 impostores que se acusan entre ellos**: es el resultado buscado, no un bug.
  La revelación debe leerse bien en ese caso.
- **Acertar a uno de los dos impostores**: cuenta como acierto del grupo; la
  revelación menciona además al que se escapó.
- **El primero en hablar**: nunca impostor. Con 3 jugadores y 1 impostor solo hay
  2 candidatos a primero: comprobar que el sorteo no se rompe.
- **Ver la palabra dos veces**: permitido mientras sea tu turno de reparto,
  imposible después.
- **Recarga a mitad del reparto**: se reinicia el reparto entero (de hecho, se
  vuelve a `im-config`). No se puede reanudar a medias sin filtrar información.
- **Inspeccionar el DOM**: el secreto no debe existir en el DOM ni antes de
  «Ver» ni después de «Ocultar».
- **Banco agotado** tras muchas rondas seguidas: aviso y rebarajado.
- **Banco vacío tras filtrar** (p. ej. solo «extremo»): volver a `im-config` con
  el error «No hay palabras para esta configuración».
- **Nombres repetidos o vacíos**: bloqueados en la configuración (aquí es
  crítico: dos «Ana» hacen imposible acusar).
- **Nombres muy largos** en la lista de acusación: la lista es `.lista-scroll`,
  con texto truncado por CSS si hace falta.
- **`localStorage` bloqueado**: no se recuerda la configuración; el juego funciona
  igual.
- **Doble toque en «Siguiente»** durante la ronda: deshabilitar hasta el
  siguiente render, para no saltarse el turno de nadie.

---

## 8. Checklist

- [ ] **Fase 1** — Pantallas y configuración (steppers y reglas)
- [ ] **Fase 2** — Reparto secreto con handoff
- [ ] **Fase 3** — Rondas, acusación y revelación
- [ ] **Fase 4** — Banco de contenido (≥ 400 palabras con pista a mano)
- [ ] **Fase 5** — Modo fiesta, persistencia de configuración y pulido
- [ ] `APP_VERSION`, `CACHE` y `ARCHIVOS` actualizados
- [ ] `<script>` de datos y lógica añadidos a `index.html`

---

## 9. Muestra de contenido (para fijar el tono y calibrar las pistas)

~28 entradas de referencia. Van al banco tal cual; la Fase 4 continúa desde aquí.

```js
// ── suave
{ palabra: "Camarero",   pista: "Un trabajo de cara al público",      categoria: "Oficios",  nivel: "suave" },
{ palabra: "Dentista",   pista: "Alguien a quien vas por obligación", categoria: "Oficios",  nivel: "suave" },
{ palabra: "Aeropuerto", pista: "Un sitio donde se espera mucho",     categoria: "Lugares",  nivel: "suave" },
{ palabra: "Gimnasio",   pista: "Un sitio al que se va con intención",categoria: "Lugares",  nivel: "suave" },
{ palabra: "Paraguas",   pista: "Algo que siempre se pierde",         categoria: "Objetos",  nivel: "suave" },
{ palabra: "Microondas", pista: "Algo que hay en casi todas las casas",categoria: "Objetos", nivel: "suave" },
{ palabra: "Pizza",      pista: "Algo que se pide para compartir",    categoria: "Comida",   nivel: "suave" },
{ palabra: "Café",       pista: "Algo de todas las mañanas",          categoria: "Comida",   nivel: "suave" },
{ palabra: "Perro",      pista: "Algo que da mucho trabajo y no te importa", categoria: "Animales", nivel: "suave" },
{ palabra: "Boda",       pista: "Un día que la gente recuerda",       categoria: "Situaciones", nivel: "suave" },
{ palabra: "Instagram",  pista: "Algo que abres sin darte cuenta",    categoria: "Apps",     nivel: "suave" },
{ palabra: "Playa",      pista: "Un sitio de verano",                 categoria: "Lugares",  nivel: "suave" },

// ── picante
{ palabra: "Tinder",         pista: "Algo que usas en el móvil",             categoria: "Apps",       nivel: "picante" },
{ palabra: "Resaca",         pista: "Algo que llega después",                categoria: "Situaciones",nivel: "picante" },
{ palabra: "Ex",             pista: "Alguien de tu pasado",                  categoria: "Relaciones", nivel: "picante" },
{ palabra: "Chupito",        pista: "Algo que se toma en grupo",             categoria: "Vicios",     nivel: "picante" },
{ palabra: "Discoteca",      pista: "Un sitio al que se va de noche",        categoria: "Lugares",    nivel: "picante" },
{ palabra: "Tatuaje",        pista: "Algo que no se puede deshacer fácil",   categoria: "Objetos",    nivel: "picante" },
{ palabra: "Cita a ciegas",  pista: "Un plan que puede salir muy mal",       categoria: "Situaciones",nivel: "picante" },
{ palabra: "Jefe",          pista: "Alguien con quien te cuidas de hablar",  categoria: "Relaciones", nivel: "picante" },
{ palabra: "Despedida de soltero", pista: "Una noche que se organiza con tiempo", categoria: "Situaciones", nivel: "picante" },
{ palabra: "Suegra",        pista: "Alguien que llega con la pareja",        categoria: "Relaciones", nivel: "picante" },

// ── extremo
{ palabra: "Infidelidad",   pista: "Algo que rompe cosas",                   categoria: "Relaciones", nivel: "extremo" },
{ palabra: "Test de embarazo", pista: "Algo que se mira con miedo",          categoria: "Objetos",    nivel: "extremo" },
{ palabra: "Divorcio",      pista: "Un final con papeleo",                   categoria: "Situaciones",nivel: "extremo" },
{ palabra: "Terapia",       pista: "Algo a lo que se va a hablar",           categoria: "Situaciones",nivel: "extremo" },
{ palabra: "Deuda",         pista: "Algo que aprieta",                       categoria: "Vicios",     nivel: "extremo" },
{ palabra: "Mensaje borrado", pista: "Algo que no querías que se viera",     categoria: "Objetos",    nivel: "extremo" },
```

> **Cómo se sabe si una pista está bien calibrada:** juega la ronda mentalmente
> desde el lado del impostor. Si con la pista **ya sabes la palabra**, es
> demasiado concreta. Si con la pista **no puedes decir ni una palabra
> relacionada sin cantarte**, es demasiado vaga. La buena está justo en medio:
> te deja decir algo genérico y creíble, y te obliga a escuchar a los demás.

> **Criterio de contenido (§12 global):** «Extremo» debe ser **incómodo, no
> cruel**. Nada que humille por aspecto, orientación, origen o salud mental
> («Terapia» vale como concepto cotidiano; un diagnóstico concreto, no).
