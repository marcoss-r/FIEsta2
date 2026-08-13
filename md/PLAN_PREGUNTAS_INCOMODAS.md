# Plan de desarrollo — FIEsta 2 · «Preguntas incómodas» 🍒

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
letras. Las de este juego son **`pi`**.

El **núcleo compartido** (`js/nucleo/`) trae hecho lo que este juego no debe
reimplementar: configuración de jugadores, niveles de intensidad, modo fiesta,
plantillas de texto, persistencia y utilidades de azar. Está especificado en el
**§7 del plan global** y se construye en la **Fase 2** del proyecto.

Reglas de trabajo: **español** en interfaz, código y comentarios; **sin
`// TODO`**; **una fase cada vez**; y **el usuario prueba la app él mismo** en su
navegador — nunca la abras tú para «comprobar» un cambio de interfaz.

---

## 2. Qué es este juego

Preguntas **directas, personales y afiladas**. La diferencia con Verdad o Reto es
que aquí **no eliges**: la app decide **a quién** se le pregunta y **qué** se le
pregunta. Y la diferencia con «Quién es más…» es que allí se habla del grupo en
tercera persona y se responde señalando, mientras que aquí se interpela **a una
persona concreta, que tiene que abrir la boca**.

El móvil lo tiene el jugador **anterior**, que **lee la pregunta en voz alta**
al destinatario. El destinatario responde («Respondió») o se lo salta («Se lo
salta»), y con el modo fiesta activo saltarse una pregunta cuesta un castigo.

Con el modo fiesta hay además una carta bajo la manga: **«Devolver»**. El
destinatario le devuelve la pregunta a quien se la ha leído… pero solo puede
hacerlo **una vez en toda la partida**, así que hay que elegir bien el momento.

No hay puntos, no hay ganador. Se juega hasta que alguien pulsa «Terminar».

---

## 3. Decisiones cerradas (no volver a preguntar)

| Tema | Decisión |
|---|---|
| **Prefijo** | `pi` en estado, funciones, constantes, pantallas, IDs, clases y `localStorage`. |
| **Nº de jugadores** | **2–12**. Por defecto 4. |
| **Pantallas** | `pi-config` → `pi-juego` → `pi-fin`. |
| **Quién responde** | El **destinatario**, que rota **en orden** (nunca sorteo, para que a nadie le toque tres veces seguidas). |
| **Quién lee** | El **jugador anterior** en el orden. Él tiene el móvil y lee en voz alta. |
| **Tres formatos** | `dirigida` (a la persona del turno) · `cruzada` (sobre otra persona concreta, con `{otro}`) · `grupo` (al grupo entero; empieza a responder el destinatario). |
| **Botón «Devolver»** | ✅ **Solo con el modo fiesta activo.** Balanceado como recurso escaso: **una devolución por jugador y partida**, **no encadenable** (quien la recibe devuelta responde o se salta) y **no disponible en preguntas de tipo `grupo`** (devolver algo que es para todos no significa nada). |
| **Niveles de intensidad** | Los tres del núcleo, multi-selección, por defecto suave + picante. |
| **Modo fiesta** | Interruptor global del núcleo. Añade castigo a **«Se lo salta»** y habilita **«Devolver»**. |
| **Datos** | Un solo banco `PI_PREGUNTAS` en `data/incomodas/preguntas.js`. |
| **Volumen** | **≥ 400 preguntas**, con los tres tipos representados (**mínimo 80 de cada**). Reparto orientativo: ~40 % suave, ~40 % picante, ~20 % extremo. |
| **Qué hace la app** | Elegir destinatario y pregunta, resolver plantillas, servir sin repetir, gestionar las devoluciones y guardar la partida. |
| **Qué NO hace la app** | ❌ Nada de votos, puntos, podio ni ganador. ❌ No juzga si la respuesta ha sido buena: eso lo dice el grupo. |
| **Persistencia** | Clave `"pi_partida"`. Se guarda al empezar cada pregunta. Se borra al llegar a `pi-fin`. |
| **Reanudación y repetición** | Al reanudar, el repartidor se reinicia (puede repetirse alguna pregunta ya vista). Las **devoluciones restantes sí se guardan**: son el recurso del juego. |
| **Fin de partida** | Botón **«Terminar»** siempre visible → `pi-fin` con resumen → hub. |

---

## 4. Especificación

### 4.1 Flujo de juego

```
hub ──► pi-config ──► pi-juego ──┬── Respondió ✔ ──┐
                                 ├── Se lo salta ✖ ─┤ (castigo si modo fiesta)
                                 └── Devolver ↩ ────┘  (misma pregunta, nuevo
                                        │               destinatario: el lector)
                     «Terminar» ────────┴────► pi-fin ──► hub
```

**1. `pi-config`**
- Stepper `− N +` (2–12) + lista de nombres (núcleo, §7.3).
- Chips de niveles (núcleo, §7.4).
- Interruptor de modo fiesta (núcleo, §7.4). Debajo, una línea tenue:
  «Con el modo fiesta, cada jugador puede devolver **una** pregunta por partida».
- Botón **«Empezar»** y, si hay guardado, **«Continuar partida»**.
- Validación con `validarNombres()`; el error va en `#pi-error` en ámbar.

**2. `pi-juego`** — es la pantalla donde vive el juego entero.
- Arriba, línea tenue: **«Lee LUIS»** (el jugador anterior).
- En grande, el encabezado del destinatario y la pregunta:
  - `dirigida` y `cruzada` → «**ANA,**» + la pregunta.
  - `grupo` → «**Para todos**» + la pregunta + línea tenue «empieza **ANA**».
- Botones: **«Respondió ✔»**, **«Se lo salta ✖»** y, si procede,
  **«Devolver ↩»** (ver reglas abajo).
- Contenedor `.anuncio` `#pi-castigo` para el castigo, oculto por defecto.
- Botón secundario **«Terminar»**.

**Reglas del botón «Devolver»** (todas se cumplen o el botón no se pinta):
1. El modo fiesta está activo.
2. Al destinatario **le queda** su devolución (`devolucionesRestantes[i] > 0`).
3. La pregunta **no** es de tipo `grupo`.
4. La pregunta **no** viene ya devuelta (no se encadena).

Al pulsarlo: se descuenta la devolución del destinatario, el **lector pasa a ser
el destinatario**, se repinta la pantalla con un `.anuncio` («↩ Ana te la
devuelve, Luis») y solo quedan «Respondió» y «Se lo salta». Si la pregunta es
`cruzada` y el `{otro}` resuelto resulta ser el nuevo destinatario, **se vuelve a
resolver la plantilla** excluyéndolo.

Tras «Respondió» o «Se lo salta» (con su castigo si toca), se avanza al siguiente
destinatario, se sirve pregunta nueva y se guarda la partida.

**3. `pi-fin`**
- Resumen: «**N** preguntas respondidas, **M** esquivadas y **P** devueltas.»
- Botones **«Otra partida»** y **«Volver al inicio»**. Borra `"pi_partida"`.

### 4.2 Modelo de datos

```js
// Todo el estado del juego vive aquí.
const piEstado = {
  nombres: [],                 // ["Ana", "Luis", …] en orden de rotación
  niveles: ["suave", "picante"],
  indiceDestinatario: 0,       // a quién se le pregunta
  indiceLector: 0,             // quien lee (el anterior); se recalcula siempre
  preguntaActual: null,        // { texto, tipo, nivel } tal cual del banco
  textoResuelto: "",           // con {otro} ya sustituido
  devuelta: false,             // ¿esta pregunta ya se ha devuelto una vez?
  devolucionesRestantes: [],   // paralelo a nombres: 1 por jugador al empezar
  contador: { respondidas: 0, saltadas: 0, devueltas: 0 },
  repartidor: null,
};

const PI_MIN_JUGADORES = 2;
const PI_MAX_JUGADORES = 12;
const PI_DEVOLUCIONES_POR_JUGADOR = 1;
const PI_CLAVE_GUARDADO = "pi_partida";
```

**Formato del banco** (`data/incomodas/preguntas.js`):

```js
// Generado desde preguntas.json — no editar a mano (usar agregar.py).
const PI_PREGUNTAS = [
  { texto: "¿Qué es lo peor que has pensado de alguien de esta sala?", tipo: "dirigida", nivel: "picante" },
  { texto: "¿Qué cambiarías de {otro} si pudieras?",                   tipo: "cruzada",  nivel: "picante" },
  { texto: "¿Quién de aquí guarda el secreto más gordo?",              tipo: "grupo",    nivel: "suave" },
];
```

Campos: `texto`, `tipo` (`"dirigida"` | `"cruzada"` | `"grupo"`) y `nivel`
(`"suave"` | `"picante"` | `"extremo"`).

> **Convención de escritura:** las preguntas `cruzada` **siempre** llevan
> `{otro}`; las `dirigida` y `grupo` **nunca** lo llevan. El nombre del
> destinatario lo pone la app en el encabezado, así que **el texto no empieza por
> `{jugador}`**.

**Qué se guarda** (clave `"pi_partida"`):

```js
{ nombres, niveles, indiceDestinatario, devolucionesRestantes, contador }
```

### 4.3 Pantallas y componentes

| Pantalla | Elemento | ID |
|---|---|---|
| `pi-config` | contenedor de nombres | `pi-nombres` |
| | stepper | `pi-stepper` |
| | chips de nivel | `pi-niveles` |
| | interruptor de modo fiesta | `pi-fiesta` |
| | mensaje de validación | `pi-error` |
| | botones | `pi-btn-empezar` · `pi-btn-continuar` |
| `pi-juego` | línea «Lee …» | `pi-lector` |
| | encabezado del destinatario | `pi-destinatario` |
| | texto de la pregunta | `pi-pregunta` |
| | línea tenue auxiliar (tipo `grupo`) | `pi-nota` |
| | castigo / aviso (`.anuncio`, `hidden`) | `pi-castigo` |
| | botones | `pi-btn-respondio` · `pi-btn-salta` · `pi-btn-devolver` |
| | botón «Siguiente» tras el castigo de «Se lo salta» (`hidden` por defecto) | `pi-btn-siguiente-salta` |
| | terminar | `pi-btn-terminar` |
| `pi-fin` | resumen | `pi-resumen` |
| | botones | `pi-btn-otra-partida` · `pi-btn-hub` |

El botón «Devolver» se **oculta con `hidden`**, y el CSS debe llevar
`#pi-btn-devolver[hidden] { display: none; }` (el atributo `hidden` pierde contra
`display: flex`, §3.3 del plan global). La etiqueta del botón muestra el recurso
restante: **«Devolver ↩ · te queda 1»**.

### 4.4 Qué del núcleo se usa y qué es propio

| Del núcleo (§7 global) | Para qué |
|---|---|
| `mostrarPantalla(nombre)` | Navegación. |
| `montarConfigJugadores` · `validarNombres` | `pi-config`. |
| `montarSelectorNiveles` · `filtrarPorNivel` | Chips y filtrado del banco. |
| `montarInterruptorModoFiesta` · `modoFiestaActivo` · `castigoAlAzar` | Modo fiesta, «Se lo salta» y habilitar «Devolver». |
| `crearRepartidor(banco)` | Servir preguntas sin repetir. |
| `rellenarPlantilla` · `otrosNecesarios` | Resolver `{otro}` de las `cruzada` y descartarlas si no hay candidatos. |
| `guardarJSON` · `cargarJSON` · `hayGuardado` · `borrarGuardado` | «Continuar partida». |

**Propio de este juego:** la rotación destinatario/lector, los tres encabezados
por tipo, y toda la mecánica de devoluciones (recurso por jugador, no
encadenable, re-resolución de `{otro}`).

---

## 5. Convenciones para no chocar con los otros juegos

- **Estado**: `piEstado`. **Funciones**: `piEmpezarPartida()`,
  `piServirPregunta()`, `piRender()`, `piRespondio()`, `piSalta()`,
  `piDevolver()`, `piSiguienteDestinatario()`, `piTerminar()`, `piGuardar()`,
  `piReanudar()`. **Constantes**: `PI_DEVOLUCIONES_POR_JUGADOR`…
- **Pantallas**: `data-pantalla="pi-config|pi-juego|pi-fin"`.
- **IDs** empiezan por `pi-`; **clases CSS** por `.pi-`.
- **`localStorage`**: solo `"pi_partida"`.
- **`<script>` en `index.html`** (§6.2 global):

```html
<script src="data/incomodas/preguntas.js"></script>
…
<script src="js/incomodas/main.js"></script>
```

- **CSS**: bloque propio al final de `css/estilos.css`, abierto con
  `/* ===== Preguntas incómodas (pi) ===== */`.
- Wiring dentro de su propio `DOMContentLoaded`; **el núcleo no se toca**.

---

## 6. Desarrollo por fases

### Fase 1 — Pantallas, configuración y rotación

🎯 Que se pueda configurar una partida y ver rotar destinatario y lector.

🛠️ A construir
- Las 3 pantallas en `index.html` con los IDs de §4.3.
- Bloque CSS `pi`: encabezado grande del destinatario, caja de la pregunta, fila
  de tres botones que no se rompe en 360 px.
- `js/incomodas/main.js` con `piEstado`, wiring, `montarConfigJugadores`,
  `montarSelectorNiveles` y el interruptor de modo fiesta.
- `piEmpezarPartida()` y `piSiguienteDestinatario()`: rotación **en orden**;
  `indiceLector = (indiceDestinatario - 1 + n) % n`.

✅ Aceptación
- Con 4 jugadores, tras 8 pulsaciones de «Respondió» cada uno ha sido
  destinatario exactamente dos veces, siempre en el mismo orden.
- El lector mostrado es siempre el jugador **anterior** al destinatario.
- Con 2 jugadores, lector y destinatario se alternan correctamente.

🔍 Qué debe probar el usuario
Poner 3 nombres reconocibles y dar a «Respondió» varias veces mirando que la
pareja «lee X / responde Y» sea siempre la correcta.

---

### Fase 2 — Motor de preguntas y los tres formatos

🎯 Que el juego sea jugable con un banco de prueba.

🛠️ A construir
- Banco provisional de ~30 preguntas con los tres tipos (formato definitivo).
- Filtrado: `filtrarPorNivel()` **y** descarte de las `cruzada` cuando
  `otrosNecesarios(texto) > nombres.length - 1`.
- `crearRepartidor()` y `piServirPregunta()`.
- `piRender()` con el encabezado correcto según `tipo`:
  - `dirigida` / `cruzada` → `#pi-destinatario` = «ANA,» y `#pi-nota` oculto.
  - `grupo` → `#pi-destinatario` = «Para todos» y `#pi-nota` = «empieza ANA».
- Contadores y `pi-fin` con el resumen real.
- Aviso de banco agotado en el `.anuncio` y rebarajado.

✅ Aceptación
- Las `cruzada` nunca apuntan al propio destinatario.
- Con 2 jugadores el juego sigue funcionando (las `cruzada` que necesiten dos
  «otros» se descartan al filtrar).
- 30 preguntas seguidas sin repetición.

🔍 Qué debe probar el usuario
Una partida de 4 personas comprobando que los tres formatos aparecen y se leen
con naturalidad en voz alta.

---

### Fase 3 — Banco de contenido (≥ 400)

🎯 Contenido definitivo, con los tres tipos bien representados.

🛠️ A construir
- `data/incomodas/preguntas.json` (fuente) y `preguntas.js` (generado).
- `data/incomodas/agregar.py`: pregunta texto, tipo y nivel; valida que las
  `cruzada` contengan `{otro}` y que las `dirigida`/`grupo` **no** lo contengan;
  evita duplicados exactos; regenera el `.js`.
- Contenido a cuatro manos (§2.4 global): tanda de 30–50, validar tono, producir.

✅ Aceptación
- ≥ 400 preguntas, ≥ 80 de cada tipo, reparto ~40/40/20 por nivel.
- Ninguna se solapa con el banco de «Quién es más…» (allí se **señala**, aquí se
  **responde hablando**).
- `python data/incomodas/agregar.py` funciona y regenera el `.js`.

🔍 Qué debe probar el usuario
Jugar solo con «extremo» y decidir si el tono es el que quiere; marcar las que
haya que suavizar o quitar.

---

### Fase 4 — Modo fiesta y devoluciones

🎯 Cerrar la mecánica que le da personalidad al juego.

🛠️ A construir
- «Se lo salta» con `castigoAlAzar()` en `#pi-castigo` y botón «Siguiente».
- `devolucionesRestantes` inicializado a `PI_DEVOLUCIONES_POR_JUGADOR` por
  jugador al empezar la partida.
- Visibilidad del botón «Devolver» según las **cuatro reglas** de §4.1, con la
  etiqueta mostrando cuántas le quedan.
- `piDevolver()`: descuenta, intercambia destinatario y lector, marca
  `devuelta = true`, re-resuelve `{otro}` si hace falta y repinta con el aviso.
- Contador de devueltas en el resumen.

✅ Aceptación
- Con modo fiesta apagado, el botón «Devolver» no existe en ninguna pregunta.
- Con modo fiesta encendido, cada jugador puede devolver **exactamente una vez**
  en toda la partida; después el botón desaparece para él.
- Una pregunta devuelta **no** se puede volver a devolver.
- En preguntas de tipo `grupo` nunca aparece el botón.
- Una `cruzada` devuelta nunca acaba hablando del propio destinatario.

🔍 Qué debe probar el usuario
Partida con modo fiesta: gastar la devolución con un jugador, intentar devolver
otra vez con él (no debe poder) y comprobar que a los demás sí les queda.

---

### Fase 5 — Persistencia y pulido

🎯 Dejar el juego terminado.

🛠️ A construir
- `piGuardar()` al servir cada pregunta; `piReanudar()`; borrado en `pi-fin`.
  Las **devoluciones restantes se guardan y se restauran**.
- `clamp()` en el tamaño de la pregunta para que 4 líneas no provoquen scroll.
- `env(safe-area-inset-*)` en botón volver y fila inferior.
- Subir `APP_VERSION` y `CACHE`, y añadir los archivos nuevos a `ARCHIVOS` en
  `sw.js`.

✅ Aceptación
- Se reanuda al **principio de la pregunta en curso**, con las devoluciones
  gastadas todavía gastadas.
- Al terminar, «Continuar» desaparece.
- La pregunta más larga del banco cabe sin scroll en 360 px.

🔍 Qué debe probar el usuario
En el móvil: partida a medias → cerrar → reabrir → continuar y comprobar que la
devolución ya gastada sigue gastada.

---

## 7. Casos borde

- **2 jugadores**: funciona; lector y destinatario se alternan. Las `cruzada` que
  necesiten dos «otros» distintos se descartan al filtrar.
- **`{otro}` nunca es el destinatario**: la lista `otros` se construye
  excluyéndolo (y, al devolver, excluyendo al nuevo destinatario).
- **Devolver con 2 jugadores**: es válido (se la devuelve al único otro), pero
  sigue costando la única devolución del jugador.
- **Banco agotado**: aviso en el `.anuncio` y rebarajado, nunca pantalla en
  blanco.
- **Banco vacío tras filtrar**: volver a `pi-config` con el error «No hay
  preguntas para esta configuración».
- **Textos larguísimos**: `clamp()` + `overflow-wrap`.
- **Nombres repetidos o vacíos**: bloqueados en la configuración.
- **Recarga a mitad**: se reanuda al principio de la pregunta en curso, nunca con
  una devolución a medio resolver (`devuelta` no se guarda).
- **`localStorage` bloqueado**: sin «Continuar», el resto igual.
- **Doble toque rápido**: deshabilitar los tres botones hasta que se haya
  renderizado la pregunta siguiente.
- **Modo fiesta apagado a mitad de partida**: el botón «Devolver» desaparece en
  la siguiente pregunta; las devoluciones ya gastadas no se recuperan.

---

## 8. Checklist

- [x] **Fase 1** — Pantallas, configuración y rotación
- [x] **Fase 2** — Motor de preguntas y los tres formatos (banco provisional
      de 30, la muestra de §9 de este plan)
- [x] **Fase 3** — Banco de contenido (≥ 400, ≥ 80 por tipo): 400 preguntas
      (160 dirigida, 160 cruzada, 80 grupo; 40/40/20 suave/picante/extremo
      en cada tipo), sin duplicados exactos, con `preguntas.json` (fuente)
      y `agregar.py`. Probado con jsdom: 350 turnos con los tres niveles
      activos, ninguna `cruzada` apunta jamás a su propio destinatario, 0
      errores de consola. Pendiente de que el usuario lo revise y afine
      (§2.4)
- [x] **Fase 4** — Modo fiesta y devoluciones (adelantada junto con las
      Fases 1-2: castigo en «Se lo salta», botón «Devolver» con las cuatro
      reglas, contador de devueltas)
- [x] **Fase 5** — Persistencia y pulido (adelantada junto con las Fases
      1-2: guardado/reanudación con devoluciones restantes, `clamp()`,
      `APP_VERSION`/`CACHE`/`ARCHIVOS` al día; falta la prueba en
      dispositivo real, que hace el usuario)
- [x] `APP_VERSION`, `CACHE` y `ARCHIVOS` actualizados
- [x] `<script>` de datos y lógica añadidos a `index.html`
- [x] **Ajuste de tono y limpieza de duplicados fantasma** (pedido por el
      usuario, leyendo el banco ya revisado de `data/yonunca/frases.json`):
      picante y extremo reescritos por completo (picante más explícito;
      extremo centrado en la dinámica de **este grupo concreto**). Suave se
      mantiene, con un duplicado fantasma corregido tras pasar un detector
      de similitud por todo el banco. 400 preguntas en total sin cambios de
      volumen.

---

## 9. Muestra de contenido (para fijar el tono)

~30 entradas de referencia. Van al banco tal cual; la Fase 3 continúa desde aquí.

```js
// ── dirigida · suave
{ texto: "¿Qué es lo que más te cuesta reconocer de ti mismo?", tipo: "dirigida", nivel: "suave" },
{ texto: "¿Cuál es la excusa que más repites y ya nadie se cree?", tipo: "dirigida", nivel: "suave" },
{ texto: "¿Qué plan te da una pereza brutal pero nunca dices que no?", tipo: "dirigida", nivel: "suave" },
{ texto: "¿Qué cosa haces cuando estás solo que jamás harías delante de nadie?", tipo: "dirigida", nivel: "suave" },
{ texto: "¿Qué mentira piadosa has contado esta misma semana?", tipo: "dirigida", nivel: "suave" },

// ── dirigida · picante
{ texto: "¿Qué es lo peor que has pensado de alguien de esta sala?", tipo: "dirigida", nivel: "picante" },
{ texto: "¿A quién de aquí has criticado a sus espaldas?", tipo: "dirigida", nivel: "picante" },
{ texto: "¿Qué te dolió y nunca dijiste que te había dolido?", tipo: "dirigida", nivel: "picante" },
{ texto: "¿Con quién de aquí has tenido más ganas de discutir y te has callado?", tipo: "dirigida", nivel: "picante" },
{ texto: "¿Qué parte de tu vida estás fingiendo que va mejor de lo que va?", tipo: "dirigida", nivel: "picante" },

// ── dirigida · extremo
{ texto: "¿De qué te arrepientes de verdad y todavía no has pedido perdón?", tipo: "dirigida", nivel: "extremo" },
{ texto: "¿Qué le estás ocultando ahora mismo a alguien de esta sala?", tipo: "dirigida", nivel: "extremo" },
{ texto: "¿Cuál es la cosa más egoísta que has hecho por tu propio beneficio?", tipo: "dirigida", nivel: "extremo" },

// ── cruzada · suave
{ texto: "¿Qué le pedirías prestado a {otro} sabiendo que no se lo vas a devolver?", tipo: "cruzada", nivel: "suave" },
{ texto: "¿Qué manía de {otro} imitarías ahora mismo?", tipo: "cruzada", nivel: "suave" },
{ texto: "¿En qué se te parece {otro} más de lo que le gustaría admitir?", tipo: "cruzada", nivel: "suave" },
{ texto: "Si tuvieras que irte de viaje con {otro} un mes, ¿qué norma pondrías el primer día?", tipo: "cruzada", nivel: "suave" },

// ── cruzada · picante
{ texto: "¿Qué cambiarías de {otro} si pudieras?", tipo: "cruzada", nivel: "picante" },
{ texto: "¿Qué consejo le has dado a {otro} que en el fondo sabías que era malo?", tipo: "cruzada", nivel: "picante" },
{ texto: "¿Qué le perdonarías a {otro} que no le perdonarías a nadie más?", tipo: "cruzada", nivel: "picante" },
{ texto: "¿Cuál fue la primera impresión que te dio {otro} y cuánto ha cambiado?", tipo: "cruzada", nivel: "picante" },

// ── cruzada · extremo
{ texto: "¿Qué le has ocultado a {otro} para no tener la conversación?", tipo: "cruzada", nivel: "extremo" },
{ texto: "Si mañana {otro} desapareciera de tu vida, ¿qué echarías de menos y qué no?", tipo: "cruzada", nivel: "extremo" },
{ texto: "¿Qué es lo más duro que le dirías a {otro} si supieras que no se va a enfadar?", tipo: "cruzada", nivel: "extremo" },

// ── grupo · suave
{ texto: "¿Quién de aquí guarda el secreto más gordo?", tipo: "grupo", nivel: "suave" },
{ texto: "¿Quién de aquí sería el peor compañero de piso y por qué?", tipo: "grupo", nivel: "suave" },
{ texto: "¿Quién de aquí llegaría tarde a su propia boda?", tipo: "grupo", nivel: "suave" },

// ── grupo · picante
{ texto: "¿Quién de aquí ha cambiado más desde que os conocéis, para bien o para mal?", tipo: "grupo", nivel: "picante" },
{ texto: "¿Quién de aquí necesita escuchar una verdad que nadie le dice?", tipo: "grupo", nivel: "picante" },

// ── grupo · extremo
{ texto: "¿Qué se dice de alguien de esta sala cuando no está delante?", tipo: "grupo", nivel: "extremo" },
```

> **Criterio de contenido (§12 global):** «Extremo» debe ser **incómodo, no
> cruel**. Nada que humille por aspecto, orientación, origen o salud mental.
> **«Se lo salta» siempre está disponible** y no se penaliza más allá del castigo
> simbólico.
