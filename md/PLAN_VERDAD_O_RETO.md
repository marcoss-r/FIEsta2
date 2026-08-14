# Plan de desarrollo — FIEsta 2 · «Verdad o Reto» 🍒

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
letras. Las de este juego son **`vr`**.

El **núcleo compartido** (`js/nucleo/`) ya trae hecho lo que este juego no debe
reimplementar: configuración de jugadores, niveles de intensidad, modo fiesta,
plantillas de texto, persistencia y utilidades de azar. Está especificado en el
**§7 del plan global** y se construye en la **Fase 2** del proyecto; aquí se usa,
no se copia.

Reglas de trabajo que no se negocian: **español** en interfaz, código y
comentarios; **sin `// TODO`** (se implementa completo y funcional); **una fase
cada vez**, parando al final de cada una; y **el usuario prueba la app él mismo
en su navegador** — nunca la abras ni la sirvas tú para «comprobar» un cambio de
interfaz.

---

## 2. Qué es este juego

El clásico de toda la vida. En tu turno eliges **Verdad** o **Reto** y la app te
sirve una carta al azar del banco, filtrada por los niveles de intensidad que el
grupo haya elegido al empezar.

Si sale **Verdad**, respondes una pregunta personal en voz alta. Si sale
**Reto**, haces lo que diga la carta. Cuando has cumplido, pulsas **«Hecho»** y
el turno pasa al siguiente. Si no quieres hacerlo, pulsas **«Paso»**: nadie te
obliga (y con el modo fiesta activo, pagas un castigo simbólico). Si el reto es
literalmente **imposible** en ese momento (pide un objeto que no hay, un sitio
donde no estáis), puedes pedir **«Otra»** hasta dos veces por turno.

No hay puntos, no hay ganador y no hay rondas: se juega hasta que el grupo se
cansa y alguien pulsa **«Terminar»**. La app solo sirve el contenido y ordena
los turnos.

---

## 3. Decisiones cerradas (no volver a preguntar)

| Tema | Decisión |
|---|---|
| **Prefijo** | `vr` en estado, funciones, constantes, pantallas, IDs, clases y `localStorage`. |
| **Nº de jugadores** | **2–12**. Por defecto 4. |
| **Pantallas** | `vr-config` → `vr-turno` → `vr-carta` → `vr-fin`. |
| **Modos de juego** | **Tres**: `mixto` (por defecto, eliges en cada turno), `verdades` (solo verdades) y `retos` (solo retos). Se elige en `vr-config` con chips. |
| **Presentación de la carta** | **Volteo 3D**: la carta entra boca abajo y se voltea al servir el texto (patrón `.cf-carta` de FIEsta 1). |
| **Botón «Otra»** | ✅ Existe **solo para retos**, nunca para verdades (ampliación pedida por el usuario): representa «no puedo hacer este reto por el sitio donde estoy», no una negativa, así que **no tiene límite de veces ni castigo**. En verdad no existe ese botón: solo hay «Hecho» y «Paso». |
| **Niveles de intensidad** | Los tres del núcleo (`suave` / `picante` / `extremo`), multi-selección, por defecto suave + picante. Filtran **los dos bancos a la vez**. |
| **Modo fiesta** | Interruptor global del núcleo (persistente entre partidas). Añade castigo a **«Paso»** (en verdad o en reto: significa «no quiero hacerlo/contestarlo», sí es una negativa). Usa `castigoPonderado({ beber: 0.3, prenda: 0.2, otros: 0.5 })` del núcleo (ver `js/nucleo/intensidad.js`): 30 % de las veces toca beber, 20 % quitarse una prenda, 50 % uno de los castigos "neutros" del banco (bailar, imitar…). No se elige, se ofrece al azar. Sin modo fiesta, «Paso» sigue sin castigo (mismo criterio que el resto de la app: sin modo fiesta, la app no impone nada). |
| **Datos** | **Dos bancos separados**: `VR_VERDADES` y `VR_RETOS`, en `data/verdadreto/`. |
| **Volumen** | **≥ 400 en total: ≥ 200 verdades y ≥ 200 retos** (mínimo original). Ampliado después a petición del usuario a **360 + 360 (120 por nivel en cada banco)**. Tras la corrección de retos-que-eran-verdades, verdades quedó en **366** (120/124/122) por las pocas conversiones no duplicadas; retos se mantiene en **360** (120/120/120). |
| **Qué hace la app** | Servir contenido sin repetir, ordenar turnos, resolver plantillas (`{jugador}`, `{otro}`), guardar la partida y llevar un contador de verdades/retos/pasos. |
| **Qué NO hace la app** | ❌ No hay votaciones, ni puntos, ni podio, ni ganador. ❌ No comprueba si el reto se ha cumplido: eso lo dice el grupo en voz alta. |
| **Turnos** | Rotación **en orden** (nunca sorteo), empezando por el primer jugador de la lista. Sin límite de rondas. |
| **Persistencia** | Clave `"vr_partida"`. Se guarda al **empezar cada turno**. Al llegar a `vr-fin` se borra. |
| **Reanudación y repetición** | Al reanudar una partida guardada, **los repartidores se reinician**: puede volver a salir una carta ya vista antes de la recarga. Es un compromiso consciente para no tener que serializar el estado de los repartidores. |
| **Fin de partida** | Botón **«Terminar»** siempre visible en `vr-turno` y `vr-carta` → `vr-fin` con un resumen simpático → hub. |

---

## 4. Especificación

### 4.1 Flujo de juego

```
hub  ──►  vr-config  ──►  vr-turno  ◄──────────────┐
                              │                    │
                              ▼                    │
                          vr-carta  ── Hecho ✔ ────┤
                              │      ── Paso ✖ ────┘
                              │      ── Otro reto 🔄 (solo en reto; se queda en vr-carta)
                              │
              «Terminar» ─────┴─────►  vr-fin  ──►  hub
```

**1. `vr-config`**
- Stepper `− N +` (2–12) + lista de inputs de nombres (núcleo, §7.3).
- Selector de niveles: chips multi-selección (núcleo, §7.4).
- Selector de modo: tres chips de selección **única** — *Mixto* · *Solo verdades*
  · *Solo retos*.
- Interruptor de **modo fiesta** (núcleo, §7.4).
- Botón primario **«Empezar»** y, si `hayGuardado("vr_partida")`, botón
  secundario **«Continuar partida»**.
- Al pulsar «Empezar»: `validarNombres()`; si falla, se pinta el mensaje en
  `#vr-error` (en ámbar, `--color-fallo`) y no se avanza. Si el nivel «extremo»
  está marcado o el modo fiesta está activo, el núcleo muestra el **aviso de
  tono** la primera vez (§7.4).

**2. `vr-turno`**
- «Turno de **NOMBRE**» en grande.
- En modo `mixto`: dos botones grandes, **VERDAD** (acento rojo) y **RETO**
  (ámbar, `--color-acento-2`).
- En modo `verdades` / `retos`: un único botón grande («Ver mi verdad» / «Ver mi
  reto»), para no fingir una elección que no existe.
- Línea tenue con el progreso: «Turno 7 · Ana».
- Botón secundario **«Terminar»**.

**3. `vr-carta`**
- Etiqueta del tipo arriba (VERDAD / RETO) con el color correspondiente.
- La carta se **voltea en 3D** y muestra el texto ya resuelto (plantillas
  rellenadas con nombres reales de la partida).
- Botones: **«Hecho ✔»** (éxito), **«Paso ✖»** (secundario) y, **solo en
  reto**, **«Otro reto 🔄»** (secundario, sin límite de veces, nunca se
  deshabilita). En verdad, «Otro reto» está oculto: solo hay Hecho y Paso.
- **«Paso»** (en verdad o en reto): con modo fiesta, antes de pasar turno se
  muestra el castigo ponderado en un `.anuncio` («Ana: Un trago doble») y un
  botón **«Siguiente»**; sin modo fiesta, pasa turno directo sin castigo.
- **«Otro reto»**: sirve un reto nuevo al instante, sin castigo ni aviso —
  representa que el reto actual no se puede hacer en ese sitio, no que no se
  quiera hacer.
- Botón secundario **«Terminar»**.

**4. `vr-fin`**
- Resumen: «Han caído **N verdades** y **M retos**. **P** personas se han rajado.»
- Botones: **«Otra partida»** (vuelve a `vr-config` con los mismos nombres ya
  cargados) y **«Volver al inicio»** (hub).
- Borra `"vr_partida"` al entrar.

### 4.2 Modelo de datos

**Objeto de estado** (`js/verdadreto/main.js`):

```js
// Todo el estado del juego vive aquí: cambiar el estado y volver a renderizar,
// nunca guardar información solo en el DOM.
const vrEstado = {
  nombres: [],              // ["Ana", "Luis", …] en orden de turno
  niveles: ["suave", "picante"],
  modo: "mixto",            // "mixto" | "verdades" | "retos"
  indiceTurno: 0,           // a quién le toca (índice en nombres)
  tipoActual: null,         // "verdad" | "reto" — el de la carta en pantalla
  textoActual: "",          // ya con las plantillas resueltas
  cambiosUsados: 0,         // «Otra» gastados en este turno (0…VR_MAX_CAMBIOS)
  contador: { verdades: 0, retos: 0, pasos: 0, cambios: 0 },
  repartidorVerdades: null, // crearRepartidor() sobre el banco ya filtrado
  repartidorRetos: null,
};

const VR_MIN_JUGADORES = 2;
const VR_MAX_JUGADORES = 12;
const VR_MAX_CAMBIOS = 2;     // «Otra» por turno
const VR_CLAVE_GUARDADO = "vr_partida";
```

**Formato del banco** (`data/verdadreto/verdades.js` y `retos.js`):

```js
// Generado desde verdades.json — no editar a mano (usar agregar.py).
const VR_VERDADES = [
  { texto: "¿Cuál es la mentira más grande que has contado?", nivel: "suave" },
  { texto: "¿Qué opinas de verdad de {otro}?", nivel: "picante" },
];

const VR_RETOS = [
  { texto: "Imita a {otro} hasta que alguien adivine a quién imitas", nivel: "suave" },
];
```

Campos: `texto` (string, con o sin huecos de plantilla) y `nivel`
(`"suave"` | `"picante"` | `"extremo"`). Sin `id`: la posición en el array basta.

**Qué se guarda en `localStorage`** (clave `"vr_partida"`):

```js
{ nombres, niveles, modo, indiceTurno, contador }
```

Los repartidores **no** se serializan (ver §3, decisión de reanudación).

### 4.3 Pantallas y componentes

IDs exactos, para que la implementación no tenga que inventar nomenclatura:

| Pantalla | Elemento | ID |
|---|---|---|
| `vr-config` | contenedor de inputs de nombres | `vr-nombres` |
| | stepper | `vr-stepper` |
| | contenedor de chips de nivel | `vr-niveles` |
| | contenedor de chips de modo | `vr-modo` |
| | interruptor de modo fiesta | `vr-fiesta` |
| | mensaje de validación | `vr-error` |
| | botón empezar / continuar | `vr-btn-empezar` · `vr-btn-continuar` |
| `vr-turno` | nombre del jugador | `vr-nombre-turno` |
| | línea de progreso | `vr-progreso` |
| | botones de elección | `vr-btn-verdad` · `vr-btn-reto` |
| | botón único (modos no mixtos) | `vr-btn-unico` |
| | terminar | `vr-btn-terminar` |
| `vr-carta` | carta volteable (contenedor 3D) | `vr-carta` |
| | etiqueta del tipo | `vr-carta-tipo` |
| | texto de la carta | `vr-carta-texto` |
| | castigo (`.anuncio`, `hidden` por defecto) | `vr-castigo` |
| | aviso de banco agotado (`.anuncio`, `hidden`) | `vr-anuncio` |
| | botones | `vr-btn-hecho` · `vr-btn-paso` · `vr-btn-otra` |
| | botón «Siguiente» tras el castigo de «Paso» (`hidden` por defecto) | `vr-btn-siguiente-paso` |
| | terminar | `vr-btn-terminar-2` |
| `vr-fin` | texto del resumen | `vr-resumen` |
| | botones | `vr-btn-otra-partida` · `vr-btn-hub` |

**Chips de modo** (propios del juego, no del núcleo):

```html
<div class="vr-chips" id="vr-modo">
  <button type="button" class="vr-chip activo" data-modo="mixto">Mixto</button>
  <button type="button" class="vr-chip" data-modo="verdades">Solo verdades</button>
  <button type="button" class="vr-chip" data-modo="retos">Solo retos</button>
</div>
```

**La carta volteable** (CSS propio, bloque `vr` al final de `css/estilos.css`):

```html
<div class="vr-carta" id="vr-carta">
  <div class="vr-carta-cara vr-carta-dorso">🍒</div>
  <div class="vr-carta-cara vr-carta-frente">
    <span class="vr-carta-tipo" id="vr-carta-tipo">RETO</span>
    <p class="vr-carta-texto" id="vr-carta-texto"></p>
  </div>
</div>
```

`.vr-carta` usa `transform-style: preserve-3d` y una clase `.volteada` que aplica
`rotateY(180deg)`; las dos caras llevan `backface-visibility: hidden`. El texto se
escribe **antes** de añadir `.volteada`, para que aparezca ya al girar.

⚠️ El `.anuncio` del castigo usa el atributo `hidden`: hay que añadir
`.anuncio[hidden] { display: none; }` al CSS, porque `hidden` pierde contra
cualquier regla de autor que ponga `display: flex` (§3.3 del plan global).

### 4.4 Qué del núcleo se usa y qué es propio

| Del núcleo (§7 global) | Para qué en este juego |
|---|---|
| `mostrarPantalla(nombre)` | Toda la navegación. |
| `montarConfigJugadores({…})` · `validarNombres()` | `vr-config` entera. |
| `montarSelectorNiveles(…)` · `filtrarPorNivel(banco, niveles)` | Chips de nivel y filtrado de los dos bancos. |
| `montarInterruptorModoFiesta(…)` · `modoFiestaActivo()` · `castigoPonderado(pesos)` | Modo fiesta y «Paso». |
| `crearRepartidor(banco)` | Servir verdades y retos sin repetir. |
| `rellenarPlantilla(texto, { jugador, otros })` · `otrosNecesarios(texto)` | Resolver `{jugador}` / `{otro}` y descartar textos imposibles al filtrar. |
| `guardarJSON` · `cargarJSON` · `hayGuardado` · `borrarGuardado` | «Continuar partida». |
| `barajar` · `elegirAlAzar` | Auxiliares. |

**Propio de este juego:** el reparto de pesos que se le pasa a
`castigoPonderado({ beber: 0.3, prenda: 0.2, otros: 0.5 })` — el propio
`castigoPonderado()` es del núcleo (§7 global) y lo comparte con Quién es
más…, que le pasa otros pesos distintos.

**Propio de Verdad o Reto:** los chips de modo (`vr-chip`), la carta volteable
(`.vr-carta*`), el contador de cambios por turno, el contador del resumen y el
filtrado combinado de los dos bancos.

---

## 5. Convenciones para no chocar con los otros juegos

- **Estado**: `vrEstado`. **Funciones**: `vrEmpezarPartida()`, `vrRenderTurno()`,
  `vrServirCarta(tipo)`, `vrOtraCarta()`, `vrPaso()`, `vrHecho()`,
  `vrSiguienteTurno()`, `vrTerminar()`, `vrGuardar()`, `vrReanudar()`.
  **Constantes**: `VR_MAX_CAMBIOS`, `VR_MIN_JUGADORES`…
- **Pantallas**: `data-pantalla="vr-config|vr-turno|vr-carta|vr-fin"`.
- **IDs**: todos empiezan por `vr-`. **Clases CSS**: todas empiezan por `.vr-`.
- **`localStorage`**: solo la clave `"vr_partida"`.
- **`<script>` en `index.html`**, en este orden y en su sitio (§6.2 global):

```html
<!-- 2. Datos -->
<script src="data/verdadreto/verdades.js"></script>
<script src="data/verdadreto/retos.js"></script>
<!-- 3. Lógica de cada juego -->
<script src="js/verdadreto/main.js"></script>
```

- **CSS**: un único bloque al final de `css/estilos.css`, abierto con
  `/* ===== Verdad o Reto (vr) ===== */`. Nada de tocar el bloque común para
  ajustar algo de este juego.
- Todo el wiring del juego va dentro de su propio
  `document.addEventListener("DOMContentLoaded", …)`; **el núcleo no se toca**
  (salvo la entrada del juego en `INFO_JUEGOS`, que ya existe desde la Fase 0).

---

## 6. Desarrollo por fases

### Fase 1 — Pantallas y configuración

🎯 Que se pueda configurar una partida y llegar a `vr-turno` con los nombres
reales.

🛠️ A construir
- Las 4 `<section class="pantalla">` en `index.html` con todos los IDs de §4.3.
- Bloque CSS `vr` con: chips de modo, layout de `vr-turno` (dos botones grandes),
  layout de `vr-carta` (sin volteo todavía) y `vr-fin`.
- `js/verdadreto/main.js` con `vrEstado`, el wiring del `DOMContentLoaded`,
  `montarConfigJugadores`, `montarSelectorNiveles`, el interruptor de modo fiesta
  y los chips de modo.
- `vrEmpezarPartida()`: valida nombres, vuelca la configuración en `vrEstado` y
  pasa a `vr-turno` mostrando el nombre correcto.
- Navegación completa entre las cuatro pantallas (aunque la carta esté vacía).

✅ Aceptación
- La tarjeta del hub abre `vr-config`.
- El stepper añade y quita nombres **conservando lo escrito** al bajar.
- Nombres vacíos o repetidos bloquean el paso y pintan el error en ámbar.
- Los chips de nivel y de modo se marcan y desmarcan (nivel: mínimo uno; modo:
  selección única).
- La consola está limpia.

🔍 Qué debe probar el usuario
Abrir el juego desde el hub, poner 2 jugadores y luego 12, escribir nombres,
dejar uno vacío, repetir un nombre, y comprobar que «Empezar» solo funciona
cuando todo está bien.

---

### Fase 2 — Motor de turnos y cartas

🎯 Que el juego sea jugable de principio a fin con un banco de prueba pequeño.

🛠️ A construir
- Bancos provisionales de ~20 verdades y ~20 retos (los definitivos llegan en la
  Fase 3, con el mismo formato).
- Filtrado por niveles y por plantillas: al empezar la partida se construyen los
  dos bancos filtrados con `filtrarPorNivel()` **y** se descartan los textos cuyo
  `otrosNecesarios(texto)` supere `nombres.length - 1`.
- `crearRepartidor()` para cada banco.
- `vrServirCarta(tipo)`: coge del repartidor, resuelve la plantilla con
  `rellenarPlantilla`, guarda en `vrEstado` y renderiza `vr-carta`.
- `vrHecho()` y `vrPaso()` (todavía sin castigo) → `vrSiguienteTurno()`.
- Contadores de verdades, retos y pasos; `vr-fin` con el resumen real.
- Aviso de banco agotado: cuando el repartidor se reinicia, mostrar en el
  `.anuncio` «Se han acabado los retos: volvemos a barajar».

✅ Aceptación
- Se pueden encadenar 20 turnos sin que se repita ninguna carta.
- Los `{otro}` salen siempre con un nombre real y **nunca con el del jugador que
  tiene el turno**.
- Con 2 jugadores no aparece ningún texto que necesite `{otro2}`.
- «Terminar» lleva a `vr-fin` con números correctos.

🔍 Qué debe probar el usuario
Jugar una partida entera de 3 personas, mirar que los nombres encajan en las
frases y que el turno rota en orden.

---

### Fase 3 — Banco de contenido (≥ 400)

🎯 Tener el contenido definitivo: **≥ 200 verdades y ≥ 200 retos**.

🛠️ A construir
- `data/verdadreto/verdades.json` y `retos.json` (fuente).
- `data/verdadreto/verdades.js` y `retos.js` (generados: `const VR_VERDADES = […]`).
- `data/verdadreto/agregar.py`: alta desde consola (pregunta texto y nivel,
  valida el nivel, evita duplicados exactos y **regenera el `.js`**).
- El contenido se escribe **a cuatro manos** (§2.4 global): primero una tanda de
  30–50 para validar el tono con el usuario, y **solo después** producir en
  volumen.

✅ Aceptación
- ≥ 200 en cada banco, con el reparto ~40 % suave / ~40 % picante / ~20 % extremo.
- Ningún texto se repite; ninguno humilla por identidad (§12 global).
- `python data/verdadreto/agregar.py` da de alta una entrada nueva y el `.js`
  queda regenerado y válido.

🔍 Qué debe probar el usuario
Jugar con solo «suave» marcado, luego solo «extremo», y comprobar que el tono
sube de verdad y que no sale nada que le incomode publicar.

---

### Fase 4 — Modo fiesta, «Otra» y modos de juego

🎯 Cerrar las tres funcionalidades que faltan.

🛠️ A construir
- **Modo fiesta**: «Paso» muestra `castigoAlAzar()` en `#vr-castigo` con el nombre
  del jugador, y el turno no pasa hasta pulsar «Siguiente».
- **Botón «Otra»**: contador `cambiosUsados` por turno, etiqueta dinámica
  («Otra 🔄 · quedan 2»), deshabilitado al llegar a `VR_MAX_CAMBIOS`. El
  **segundo** cambio con modo fiesta activo muestra castigo antes de servir.
  `cambiosUsados` se resetea en `vrSiguienteTurno()`.
- **Modos** `verdades` / `retos`: `vr-turno` muestra el botón único y
  `vrServirCarta()` se salta la elección.

✅ Aceptación
- Con modo fiesta apagado no aparece ningún castigo, y los dos «Otra» son gratis.
- Con modo fiesta encendido: «Paso» siempre castiga; el primer «Otra» no; el
  segundo sí.
- En modo «Solo retos» nunca sale una verdad, y viceversa.
- El interruptor de modo fiesta se recuerda al cerrar y volver a abrir la app.

🔍 Qué debe probar el usuario
Una partida con modo fiesta encendido, gastando los dos cambios en el mismo
turno, y otra con él apagado.

---

### Fase 5 — Persistencia, volteo 3D y pulido

🎯 Dejar el juego terminado y bonito.

🛠️ A construir
- `vrGuardar()` al empezar cada turno; `vrReanudar()` desde `vr-config`;
  `borrarGuardado()` al entrar en `vr-fin`. Todo a prueba de incógnito (el núcleo
  ya envuelve en `try/catch`: el juego solo debe ocultar «Continuar partida» si
  `hayGuardado()` devuelve `false`).
- **Volteo 3D** de la carta (§4.3), con la transición del token
  `--duracion-transicion`.
- Tamaño de fuente fluido con `clamp()` en `.vr-carta-texto` para que un texto de
  4 líneas no provoque scroll.
- `env(safe-area-inset-*)` en el botón volver y en la fila de botones inferior.
- Subir `APP_VERSION` en `js/nucleo/arranque.js`, subir `CACHE` en `sw.js` **y
  añadir a `ARCHIVOS`** los archivos nuevos de este juego.

✅ Aceptación
- Se cierra la app a mitad de partida, se reabre y «Continuar partida» retoma
  **al principio del turno en curso**.
- Al terminar la partida, «Continuar» desaparece.
- La carta se voltea con suavidad y el texto más largo del banco cabe sin scroll
  en 360 px de ancho.

🔍 Qué debe probar el usuario
En el móvil: partida a medias → cerrar pestaña → volver a abrir → continuar. Y
mirar la carta más larga del banco en horizontal y en vertical.

---

## 7. Casos borde

- **2 jugadores**: se descartan al filtrar todos los textos con `{otro2}`; los de
  `{otro}` sí valen (solo hay un candidato posible).
- **`{otro}` nunca es quien tiene el turno**: la lista `otros` que se pasa a
  `rellenarPlantilla` se construye **excluyendo** al jugador actual.
- **Banco agotado**: al vaciarse el repartidor se avisa en el `.anuncio` y se
  vuelve a barajar. Nunca pantalla en blanco, nunca bucle de repetición.
- **Banco vacío tras filtrar** (p. ej. solo «extremo» marcado y el banco de
  retos extremos se queda sin textos válidos para 2 jugadores): mostrar el aviso
  «No hay retos para esta configuración» y dejar solo el otro tipo disponible; si
  se quedan los dos vacíos, volver a `vr-config` con el error.
- **Modo «solo retos» + un único nivel**: es la combinación que antes agota el
  banco; probar que el reinicio del repartidor funciona.
- **Textos larguísimos**: `clamp()` en el tamaño de fuente y `overflow-wrap` para
  palabras largas; la carta crece, la pantalla no hace scroll.
- **Nombres repetidos o vacíos**: bloqueados en la configuración por
  `validarNombres()`.
- **Recarga a mitad de turno**: se reanuda al **principio** del turno en curso,
  nunca con la carta ya servida.
- **`localStorage` bloqueado** (incógnito): la partida no se guarda y «Continuar»
  no aparece; el juego funciona igual.
- **Pulsar «Otra» y luego «Terminar»**: los cambios gastados cuentan en el
  resumen, y el estado no queda a medias.
- **Doble toque rápido** en «Hecho»: deshabilitar los botones de `vr-carta` hasta
  que se haya renderizado `vr-turno`, para no saltarse un jugador.

---

## 8. Checklist

- [x] **Fase 1** — Pantallas y configuración
- [x] **Fase 2** — Motor de turnos y cartas (banco provisional de 20
      verdades + 17 retos, la muestra de §9 de este plan)
- [x] **Fase 3** — Banco de contenido: **360 verdades + 360 retos** (120
      suave / 120 picante / 120 extremo en cada banco — ampliado a petición
      del usuario por encima del mínimo original de ≥ 200 cada uno), sin
      duplicados exactos, con `verdades.json` + `retos.json` (fuente) y
      `agregar.py` (da de alta en cualquiera de los dos bancos). Probado
      con una partida de 200 turnos alternando verdad/reto con los tres
      niveles activos, sin errores de consola. Pendiente de que el usuario
      lo revise, recorte y afine (§2.4) antes de dar la fase por cerrada
- [x] **Fase 4** — Modo fiesta, botón «Otra» y modos de juego
- [x] **Fase 5** — Persistencia, volteo 3D y pulido (falta la prueba en
      dispositivo real, que hace el usuario)
- [x] `APP_VERSION` subida, `CACHE` subido y `ARCHIVOS` actualizado en `sw.js`
- [x] `<script>` de datos y de lógica añadidos a `index.html` en su orden
- [x] **Castigo de «Paso» ponderado y «Otra» solo en reto** (ampliación
      pedida por el usuario): `castigoPonderado({ beber: 0.3, prenda: 0.2,
      otros: 0.5 })` del núcleo en «Paso» (verdad o reto); botón «Otra»
      eliminado en verdad y convertido en «Otro reto» sin límite ni castigo
      en reto, porque representa un impedimento del sitio, no una negativa
- [x] **Ajuste de tono y limpieza de duplicados fantasma** (pedido por el
      usuario, leyendo el banco ya revisado de `data/yonunca/frases.json`):
      picante y extremo reescritos por completo en verdades y en retos
      (picante más explícito; extremo centrado en la dinámica de **este
      grupo concreto**). Suave se mantiene, con varios duplicados fantasma
      corregidos tras pasar un detector de similitud por los dos bancos.
      360 + 360 entradas en total sin cambios de volumen.
- [x] **Corrección: los retos picante/extremo se habían convertido en
      verdades disfrazadas** (detectado por el usuario tras revisar el `.md`
      de la Fase 3: casi el 100 % de los retos picante y extremo del ajuste
      de tono anterior empezaban por «Confiesa…/Dile…/Cuéntale…», es decir,
      pedían *decir* algo en vez de *hacer* algo). Arreglo en tres pasos:
      1) se conservaron ~20 de esos retos de confesión por nivel (los más
      directos, tipo «Dile a {otro}…», más 1 reto de mostrar algo); 2) el
      resto se convirtió a formato pregunta y se comprobó contra el banco de
      verdades ya existente con un detector de similitud — la inmensa
      mayoría resultaron ser duplicados fantasma del propio ajuste de tono
      anterior (ambos bancos se habían reescrito en paralelo con el mismo
      contenido), así que solo sobrevivieron 6 preguntas genuinamente
      nuevas, añadidas al final de `verdades.json` (picante 120→124, extremo
      120→122); 3) se generaron 100 retos de acción nuevos por nivel
      (picante y extremo), con inspiración de búsquedas en internet sobre
      dinámicas de «verdad o reto» reales (baile/posturas, móvil y redes,
      llamadas y mensajes, comida y bebida, contacto físico con `{otro}`,
      actuación, resistencia, exposición ligera), evitando nada humillante
      por físico/orientación/origen/salud mental (criterio de §12 de
      `PLAN_DESARROLLO.md`). Retos queda en 360 (120/120/120, ~20 de
      confesión + ~100 de acción por nivel en picante y extremo). Probado de
      nuevo con la partida de 200 turnos, sin errores de consola.

---

## 9. Muestra de contenido (para fijar el tono)

Estas ~30 entradas son la referencia de tono de las 400. **Van al banco tal
cual**; la Fase 3 continúa a partir de aquí.

### Verdades

```js
// suave
{ texto: "¿Cuál es la mentira más grande que has contado?", nivel: "suave" },
{ texto: "¿Qué es lo más raro que has buscado en internet?", nivel: "suave" },
{ texto: "¿Cuál es tu placer culpable que jamás admitirías en público?", nivel: "suave" },
{ texto: "¿Qué canción te sabes entera y te da vergüenza reconocerlo?", nivel: "suave" },
{ texto: "¿Cuál ha sido tu momento más ridículo delante de gente?", nivel: "suave" },
{ texto: "¿Qué le pediste a tus padres y nunca te compraron?", nivel: "suave" },
{ texto: "¿Cuánto tiempo llevas sin cambiar las sábanas? Sé honesto.", nivel: "suave" },
{ texto: "¿Qué manía tuya sabes que a {otro} le saca de quicio?", nivel: "suave" },

// picante
{ texto: "¿Qué opinas de verdad de {otro}?", nivel: "picante" },
{ texto: "¿Cuál ha sido tu peor cita y por qué?", nivel: "picante" },
{ texto: "¿Alguna vez te has hecho el dormido para no hablar con alguien?", nivel: "picante" },
{ texto: "¿A quién de esta sala le pedirías ayuda si tuvieras que esconder un cadáver?", nivel: "picante" },
{ texto: "¿Qué mensaje has borrado antes de enviarlo y todavía te acuerdas?", nivel: "picante" },
{ texto: "¿Has fingido que te gustaba un regalo? ¿Cuál?", nivel: "picante" },
{ texto: "Si tuvieras que salir de fiesta con {otro} o con tu jefe, ¿quién y por qué?", nivel: "picante" },
{ texto: "¿Cuál es la excusa más falsa que has puesto para no ir a un plan?", nivel: "picante" },

// extremo
{ texto: "¿Cuál es el secreto que no has contado nunca y que hoy sí puedes contar?", nivel: "extremo" },
{ texto: "¿Qué es lo peor que has hecho y de lo que nadie de aquí se ha enterado?", nivel: "extremo" },
{ texto: "¿Has traicionado la confianza de alguien de esta sala? Cuéntalo.", nivel: "extremo" },
{ texto: "¿Cuánto dinero haría falta para que dejaras de hablarte con {otro} un año?", nivel: "extremo" },
```

### Retos

```js
// suave
{ texto: "Imita a {otro} hasta que alguien adivine a quién imitas", nivel: "suave" },
{ texto: "Habla como un presentador de telediario hasta tu próximo turno", nivel: "suave" },
{ texto: "Enseña la última foto de tu galería", nivel: "suave" },
{ texto: "Ponte de pie y haz tu mejor pose de portada de disco", nivel: "suave" },
{ texto: "Di tres cosas que te gusten de {otro}, en serio y sin bromas", nivel: "suave" },
{ texto: "Canta el estribillo de la última canción que escuchaste", nivel: "suave" },
{ texto: "Cuenta un chiste. Si nadie se ríe, cuenta otro.", nivel: "suave" },

// picante
{ texto: "Deja que {otro} escriba un mensaje en tus notas y léelo en voz alta", nivel: "picante" },
{ texto: "Enseña la última conversación de WhatsApp que abriste (solo el último mensaje)", nivel: "picante" },
{ texto: "Ponle un mote a cada persona de la sala y explícalo", nivel: "picante" },
{ texto: "Deja que el grupo elija tu foto de perfil durante una hora", nivel: "picante" },
{ texto: "Llama a la persona con la que hablaste ayer y dile que la echas de menos", nivel: "picante" },
{ texto: "Dile a {otro} lo primero que pensaste de él o ella cuando os conocisteis", nivel: "picante" },

// extremo
{ texto: "Deja que {otro} mire tu galería de fotos durante 20 segundos", nivel: "extremo" },
{ texto: "Lee en voz alta el último mensaje que le mandaste a tu ex", nivel: "extremo" },
{ texto: "Manda un audio de 10 segundos a la última persona con la que hablaste diciendo lo que el grupo te dicte", nivel: "extremo" },
{ texto: "Cuéntale a {otro} algo que nunca le has dicho a la cara", nivel: "extremo" },
```

> **Criterio de contenido (§12 global):** «Extremo» debe ser **incómodo, no
> cruel**. Nada que humille por aspecto, orientación, origen o salud mental. Si
> una entrada solo funciona haciendo daño de verdad, fuera. Y recuerda: **«Paso»
> siempre está disponible** y no se penaliza más allá del castigo simbólico.
