# Plan de desarrollo — FIEsta 2 · «Dos mentiras y una verdad» 🍒

> Documento pensado para que otro agente **sin contexto** pueda implementar el
> juego leyendo solo esto y [`md/PLAN_DESARROLLO.md`](PLAN_DESARROLLO.md).

> **Nota posterior:** el temporizador opcional de 60 s descrito en la Fase 4
> de este plan se **eliminó** a petición del usuario (retoques de app,
> v1.12.2): ni la interfaz ni el código lo mencionan ya. El resto del
> documento se deja tal cual quedó implementado, como registro histórico de
> esa fase.

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
letras. Las de este juego son **`dm`**.

El **núcleo compartido** (`js/nucleo/`) trae hecho lo que este juego no debe
reimplementar: configuración de jugadores, niveles, modo fiesta, plantillas,
persistencia y utilidades de azar (**§7 del plan global**, construido en la Fase 2
del proyecto).

Reglas de trabajo: **español** en interfaz, código y comentarios; **sin
`// TODO`**; **una fase cada vez**; y **el usuario prueba la app él mismo**.

---

## 2. Qué es este juego

El jugador de turno cuenta **tres cosas sobre sí mismo**: dos falsas y una
verdadera. El grupo debate, decide cuál cree que es la verdadera y el jugador lo
revela en voz alta. Luego le toca al siguiente.

El problema clásico de este juego es que **la gente se queda en blanco**: te toca
el turno, no se te ocurre nada y el juego se muere. Por eso aquí **la app da el
tema**: *«Tus viajes»*, *«La época del colegio»*, *«Tu peor cita»*. Tú solo tienes
que inventar tres frases dentro de ese tema.

El tema se ve **en pantalla y a la vista de todos**, no en secreto: así el grupo
vigila que las tres frases van realmente del tema y nadie se escaquea contando
cualquier cosa.

Si el tema no te inspira, puedes pedir **«Otro tema»** hasta dos veces por turno.

La app **no gestiona ni votos ni puntos**: se vota a mano alzada y se revela
hablando.

---

## 3. Decisiones cerradas (no volver a preguntar)

| Tema | Decisión |
|---|---|
| **Prefijo** | `dm` en estado, funciones, constantes, pantallas, IDs, clases y `localStorage`. |
| **Nº de jugadores** | **3–12** (con 2 no hay debate posible). Por defecto 4. |
| **Pantallas** | `dm-config` → `dm-turno` → `dm-tema` → `dm-fin`. `dm-tema` tiene **dos sub-vistas** (`.vista`): *pensar* y *contar*. |
| **¿El tema es secreto?** | ❌ **No.** Se muestra a todo el grupo, para que vigilen que las tres frases van del tema. Este juego **no usa handoff**. |
| **Temporizador** | ❌ **Eliminado** (v1.12.2). Existió como interruptor opcional en Fase 4; se retiró entero, ver nota al principio del documento. |
| **Botón «Otro tema»** | ✅ **Máximo 2 cambios por turno** (para que nadie busque el tema fácil). Sin castigo, ni con modo fiesta: cambiar de tema no es rajarse. |
| **Niveles de intensidad** | Los tres del núcleo, multi-selección, por defecto suave + picante. |
| **Modo fiesta** | Interruptor global del núcleo. Con él activo, en la sub-vista *contar* se muestra un castigo concreto: «🍻 Quien falle: **…** · Si no acierta nadie, bebe el grupo». |
| **Datos** | Un solo banco `DM_TEMAS` en `data/dosmentiras/temas.js`, con dos `tipo`: **`tema`** (ámbito abierto: «Tus viajes») y **`arranque`** (frase ya empezada, más dirigida). |
| **Volumen** | ~~≥ 400 temas (mínimo 120 de cada tipo)~~. Ajustado a petición del usuario (400 eran muchos): **160 temas, 80 de cada tipo** (32 suave + 32 picante + 16 extremo en cada uno, ~40 %/40 %/20 %). Los temas deben ser **amplios**: da igual el tipo, tienen que dar pie a inventar dos mentiras y recordar una verdad con facilidad, nunca exigir un recuerdo concreto y difícil de fabricar. |
| **Qué hace la app** | Dar el tema, ordenar los turnos, contar los cambios, cronometrar (si se pide) y guardar la partida. |
| **Qué NO hace la app** | ❌ No recoge las tres frases, ❌ no gestiona la votación, ❌ no guarda cuál era la verdad, ❌ no hay puntos ni ganador. Todo eso se habla en voz alta. |
| **Turnos** | Rotación **en orden**, sin límite de rondas. |
| **Persistencia** | Clave `"dm_partida"`. Se guarda al entrar en cada `dm-turno`; se borra en `dm-fin`. |
| **Reanudación y repetición** | Al reanudar, el repartidor se reinicia (puede repetirse algún tema ya visto). |
| **Fin de partida** | Botón **«Terminar»** siempre visible → `dm-fin` con resumen → hub. |

---

## 4. Especificación

### 4.1 Flujo de juego

```
hub ──► dm-config ──► dm-turno ──► dm-tema
                          ▲            │
                          │            ├─ vista «pensar»  (tema + timer opcional)
                          │            │     · «Otro tema» (máx. 2)
                          │            │     · «Ya lo tengo» ─┐
                          │            │                      ▼
                          │            └─ vista «contar»  (tema + instrucciones
                          │                                  + castigo si fiesta)
                          └──────────────── «Siguiente jugador»

             «Terminar» ──────────────────► dm-fin ──► hub
```

**1. `dm-config`**
- Stepper `− N +` (**3**–12) + lista de nombres (núcleo, §7.3).
- Chips de niveles (núcleo, §7.4).
- Interruptor **«Temporizador de 60 s»** (propio del juego, **apagado** por
  defecto, no se recuerda entre partidas).
- Interruptor de **modo fiesta** (núcleo, global y persistente).
- Botones **«Empezar»** y, si hay guardado, **«Continuar partida»**.
- Validación con `validarNombres()`; error en `#dm-error` (ámbar).

**2. `dm-turno`**
- «Turno de **NOMBRE**» en grande + línea tenue de progreso («Ronda 2 · turno 3»).
- Botón primario **«Ver mi tema»** y botón secundario **«Terminar»**.
- Existe como pantalla aparte para que haya un corte limpio entre jugador y
  jugador (que a nadie le salte el tema del siguiente en la cara).

**3. `dm-tema`** — dos sub-vistas `.vista`, solo una visible a la vez.

*Vista «pensar»* (`#dm-vista-pensar`):
- El **tema en grande**: si `tipo === "tema"`, tal cual («Tus viajes»); si
  `tipo === "arranque"`, tal cual también, pero el banco ya lo trae escrito como
  frase empezada.
- Línea de ayuda fija: «Cuenta tres cosas sobre esto: **dos mentira y una
  verdad**».
- Si el temporizador está activo: contador grande **`0:60 → 0:00`**. Al llegar a
  0, `.anuncio` «⏰ Se acabó el tiempo, cuenta lo que tengas» y salto automático a
  la vista *contar*.
- Botones: **«Otro tema 🔄 · quedan N»** (deshabilitado al llegar a
  `DM_MAX_CAMBIOS`) y **«Ya lo tengo»**.

*Vista «contar»* (`#dm-vista-contar`):
- El tema sigue visible arriba, más pequeño (el grupo lo necesita para vigilar).
- Instrucciones: «**NOMBRE** cuenta sus tres frases. El grupo debate y vota **a
  mano alzada**. Después, NOMBRE revela cuál era la verdad.»
- Con modo fiesta, `.anuncio`: «🍻 Quien falle: **un trago** · Si no acierta
  nadie, bebe todo el grupo» (el castigo sale de `castigoAlAzar()`).
- Botón primario **«Siguiente jugador»** → `dm-turno` con el siguiente.
- Botón secundario **«Terminar»**.

**4. `dm-fin`**
- Resumen: «**N** rondas de mentiras. **M** temas rechazados por difíciles.»
- Botones **«Otra partida»** y **«Volver al inicio»**. Borra `"dm_partida"`.

### 4.2 Modelo de datos

```js
// Todo el estado del juego vive aquí.
const dmEstado = {
  nombres: [],
  niveles: ["suave", "picante"],
  conTemporizador: false,
  indiceTurno: 0,
  temaActual: null,        // { texto, tipo, nivel } tal cual del banco
  cambiosUsados: 0,        // «Otro tema» gastados en este turno
  castigoActual: "",       // solo si el modo fiesta está activo
  idTemporizador: null,    // handle del setInterval, para poder pararlo
  segundosRestantes: 0,
  contador: { turnos: 0, cambios: 0 },
  repartidor: null,
};

const DM_MIN_JUGADORES = 3;
const DM_MAX_JUGADORES = 12;
const DM_MAX_CAMBIOS = 2;        // «Otro tema» por turno
const DM_SEGUNDOS = 60;          // duración del temporizador opcional
const DM_CLAVE_GUARDADO = "dm_partida";
```

**Formato del banco** (`data/dosmentiras/temas.js`):

```js
// Generado desde temas.json — no editar a mano (usar agregar.py).
const DM_TEMAS = [
  { texto: "Tus viajes",                                            tipo: "tema",     nivel: "suave" },
  { texto: "La época del colegio",                                  tipo: "tema",     nivel: "suave" },
  { texto: "Tres cosas que has hecho y de las que no te enorgulleces", tipo: "arranque", nivel: "picante" },
];
```

Campos: `texto`, `tipo` (`"tema"` | `"arranque"`) y `nivel`
(`"suave"` | `"picante"` | `"extremo"`).

**Convenciones de escritura del banco:**
- `tema`: un **sintagma nominal corto**, sin verbo y sin punto final («Tus
  viajes», «Tu peor jefe», «Dinero»). Es un ámbito, no una instrucción.
- `arranque`: una **frase completa en segunda persona** que ya dirige el
  contenido («Tres cosas que has hecho y de las que no te enorgulleces»). Sin
  punto final.
- **No se usan plantillas** (`{jugador}`, `{otro}`) en este banco: el tema es
  sobre uno mismo, y meter a otro jugador rompe el juego.

**Qué se guarda** (clave `"dm_partida"`):

```js
{ nombres, niveles, conTemporizador, indiceTurno, contador }
```

Nunca se guarda el tema en curso ni el estado del temporizador: al reanudar se
empieza limpio el turno de ese jugador.

### 4.3 Pantallas y componentes

| Pantalla | Elemento | ID |
|---|---|---|
| `dm-config` | contenedor de nombres | `dm-nombres` |
| | stepper | `dm-stepper` |
| | chips de nivel | `dm-niveles` |
| | interruptor de temporizador | `dm-timer-switch` |
| | interruptor de modo fiesta | `dm-fiesta` |
| | mensaje de validación | `dm-error` |
| | botones | `dm-btn-empezar` · `dm-btn-continuar` |
| `dm-turno` | nombre del jugador | `dm-nombre-turno` |
| | progreso | `dm-progreso` |
| | botones | `dm-btn-ver-tema` · `dm-btn-terminar` |
| `dm-tema` | vista pensar | `dm-vista-pensar` |
| | vista contar | `dm-vista-contar` |
| | tema (grande, vista pensar) | `dm-tema-texto` |
| | tema (pequeño, vista contar) | `dm-tema-eco` |
| | contador del temporizador | `dm-temporizador` |
| | aviso de tiempo agotado (`.anuncio`) | `dm-aviso` |
| | castigo del modo fiesta (`.anuncio`) | `dm-castigo` |
| | instrucciones de la vista contar | `dm-instrucciones` |
| | botones | `dm-btn-otro-tema` · `dm-btn-listo` · `dm-btn-siguiente` |
| | terminar (vista contar) | `dm-btn-terminar-2` |
| `dm-fin` | resumen | `dm-resumen` |
| | botones | `dm-btn-otra-partida` · `dm-btn-hub` |

**Sub-vistas**: se usan las clases comunes `.vista` / `.vista[hidden]` del núcleo
(adaptadas de `.zt-vista` de FIEsta 1). Cambiar de vista es poner/quitar el
atributo `hidden`.

⚠️ El CSS **debe** incluir `.vista[hidden] { display: none; }` y
`.anuncio[hidden] { display: none; }`: el atributo `hidden` pierde contra
cualquier regla de autor con `display: flex` (§3.3 del plan global).

**Temporizador** (propio del juego, patrón copiado de `arrancarTimer` /
`detenerTimer` de DescriptIA):

```js
function dmArrancarTemporizador() { … }   // setInterval de 1000 ms
function dmDetenerTemporizador() { … }    // clearInterval + idTemporizador = null
```

Se **para siempre** al pulsar «Ya lo tengo», «Otro tema» (y se rearranca),
«Terminar» y al salir de la pantalla. Nunca puede quedar un `setInterval` vivo:
es el error clásico de este patrón.

### 4.4 Qué del núcleo se usa y qué es propio

| Del núcleo (§7 global) | Para qué |
|---|---|
| `mostrarPantalla(nombre)` | Navegación. |
| `montarConfigJugadores` · `validarNombres` | `dm-config` (con `min: 3`). |
| `montarSelectorNiveles` · `filtrarPorNivel` | Chips y filtrado del banco. |
| `montarInterruptorModoFiesta` · `modoFiestaActivo` · `castigoAlAzar` | Castigo de la vista *contar*. |
| `crearRepartidor(banco)` | Servir temas sin repetir. |
| `guardarJSON` · `cargarJSON` · `hayGuardado` · `borrarGuardado` | «Continuar partida». |
| CSS común `.vista` · `.anuncio` · `.switch` | Sub-vistas, avisos e interruptor. |

**Propio de este juego:** el temporizador de 60 s, el contador de cambios de
tema, las dos sub-vistas y el interruptor de temporizador (que **no** es el del
núcleo: ese es el de modo fiesta).

---

## 5. Convenciones para no chocar con los otros juegos

- **Estado**: `dmEstado`. **Funciones**: `dmEmpezarPartida()`, `dmEntrarTurno()`,
  `dmServirTema()`, `dmOtroTema()`, `dmYaLoTengo()`, `dmSiguienteJugador()`,
  `dmArrancarTemporizador()`, `dmDetenerTemporizador()`, `dmTerminar()`,
  `dmGuardar()`, `dmReanudar()`. **Constantes**: `DM_MAX_CAMBIOS`, `DM_SEGUNDOS`…
- **Pantallas**: `data-pantalla="dm-config|dm-turno|dm-tema|dm-fin"`.
- **IDs** empiezan por `dm-`; **clases CSS** por `.dm-`.
- **`localStorage`**: solo `"dm_partida"`.
- **`<script>` en `index.html`** (§6.2 global):

```html
<script src="data/dosmentiras/temas.js"></script>
…
<script src="js/dosmentiras/main.js"></script>
```

- **CSS**: bloque propio al final de `css/estilos.css`, abierto con
  `/* ===== Dos mentiras y una verdad (dm) ===== */`.
- Wiring dentro de su propio `DOMContentLoaded`; **el núcleo no se toca**.

---

## 6. Desarrollo por fases

### Fase 1 — Pantallas y configuración

🎯 Que se pueda configurar una partida (3–12) y llegar a `dm-turno`.

🛠️ A construir
- Las 4 pantallas en `index.html`, con `dm-tema` conteniendo ya sus **dos
  sub-vistas** `.vista` (la de contar arranca con `hidden`).
- Bloque CSS `dm`: tema en grande centrado, contador del temporizador, layout de
  las dos vistas, fila de botones.
- `js/dosmentiras/main.js` con `dmEstado`, wiring, `montarConfigJugadores`
  (`min: 3`), `montarSelectorNiveles`, interruptor de modo fiesta e interruptor
  propio de temporizador.
- `dmEmpezarPartida()` y navegación completa entre las cuatro pantallas.

✅ Aceptación
- El stepper no baja de 3 ni sube de 12.
- Nombres vacíos o repetidos bloquean el paso.
- Se puede ir y volver entre `dm-turno` y las dos sub-vistas de `dm-tema` sin que
  se queden las dos visibles a la vez.

🔍 Qué debe probar el usuario
Intentar bajar a 2 jugadores y comprobar que no deja; recorrer las pantallas
vacías.

---

### Fase 2 — Motor de temas y turnos

🎯 Que el juego sea jugable con un banco de prueba.

🛠️ A construir
- Banco provisional de ~30 temas con los dos tipos.
- Filtrado por nivel con `filtrarPorNivel()` + `crearRepartidor()`.
- `dmServirTema()` y `dmOtroTema()` con el contador `cambiosUsados`, la etiqueta
  dinámica («Otro tema 🔄 · quedan 1») y el botón deshabilitado al llegar a
  `DM_MAX_CAMBIOS`. Se resetea en cada turno nuevo.
- `dmYaLoTengo()`: cambia a la vista *contar*, con el eco del tema y las
  instrucciones con el nombre real.
- `dmSiguienteJugador()`: rota en orden y vuelve a `dm-turno`.
- Contadores y `dm-fin` con el resumen real.
- Aviso de banco agotado en `#dm-aviso` y rebarajado.

✅ Aceptación
- No se repite ningún tema en 30 turnos.
- «Otro tema» solo se puede pulsar dos veces por turno.
- Las instrucciones de la vista *contar* llevan el nombre correcto.
- El turno rota en orden y nunca se salta a nadie.

🔍 Qué debe probar el usuario
Una partida de 4 personas jugando de verdad: ver si los temas dan juego o si son
demasiado abiertos.

---

### Fase 3 — Banco de contenido (160, 80 de cada tipo)

🎯 Contenido definitivo con los dos tipos bien representados. Objetivo
reducido de ≥ 400 a **160** a petición del usuario: con temas suficientemente
amplios, 400 eran muchos más de los necesarios.

🛠️ A construir
- `data/dosmentiras/temas.json` (fuente) y `temas.js` (generado).
- `data/dosmentiras/agregar.py`: pregunta tipo, texto y nivel; valida el tipo y
  el nivel; **avisa si un `tema` acaba en punto o pasa de ~40 caracteres** (señal
  de que en realidad es un `arranque`); evita duplicados; regenera el `.js`.
- Contenido a cuatro manos (§2.4 global): tanda de 30–50, validar tono, producir.

✅ Aceptación
- **160 temas, 80 de cada tipo**, reparto 32/32/16 (~40 %/40 %/20 %) por nivel
  dentro de cada tipo.
- Todos los `tema` son ámbitos cortos; todos los `arranque` son frases completas.
- Todos los temas son **amplios**: dan pie a inventar dos mentiras y recordar
  una verdad con facilidad, sin exigir un recuerdo concreto y difícil de
  fabricar. Ningún tema exige tener una vida concreta («Tus hijos», «Tu
  divorcio» solo en niveles altos y con alternativa: mejor «La familia»).

🔍 Qué debe probar el usuario
Jugar con solo «suave» y comprobar que a nadie se le queda cara de «yo de esto no
tengo nada que contar».

---

### Fase 4 — Temporizador y modo fiesta

🎯 Cerrar las dos opciones configurables.

🛠️ A construir
- `dmArrancarTemporizador()` / `dmDetenerTemporizador()` con `setInterval` de
  1000 ms y pintado `m:ss` en `#dm-temporizador`.
- Solo se arranca si `conTemporizador === true`; en caso contrario el contador va
  `hidden`.
- A 0 s: `.anuncio` «⏰ Se acabó el tiempo» y salto automático a la vista
  *contar*.
- Se para en: «Ya lo tengo», «Terminar», «Siguiente jugador» y al cambiar de
  pantalla. Se reinicia a `DM_SEGUNDOS` en cada tema nuevo (incluido «Otro tema»).
- Modo fiesta: `castigoAlAzar()` en `#dm-castigo` al entrar en la vista *contar*.

✅ Aceptación
- Con el temporizador apagado no aparece contador ni aviso.
- Con él encendido, llega a 0 y salta solo, **una sola vez** (no se dispara dos
  veces si el usuario ya había pulsado «Ya lo tengo»).
- Pulsar «Otro tema» reinicia el contador a 60 s.
- Salir a `dm-fin` con el contador corriendo no deja ningún `setInterval` vivo
  (comprobable: el contador no sigue bajando al volver).

🔍 Qué debe probar el usuario
Una partida con temporizador: dejar que se agote una vez, y en otro turno
pulsar «Ya lo tengo» a falta de 2 segundos.

---

### Fase 5 — Persistencia y pulido

🎯 Dejar el juego terminado.

🛠️ A construir
- `dmGuardar()` al entrar en cada `dm-turno`; `dmReanudar()`; borrado en `dm-fin`.
- `clamp()` en el tema grande y en las instrucciones.
- `env(safe-area-inset-*)` en botón volver y fila inferior.
- Subir `APP_VERSION` y `CACHE`, y añadir los archivos nuevos a `ARCHIVOS`.

✅ Aceptación
- Se reanuda **al principio del turno en curso** (`dm-turno`), nunca con un tema
  ya servido.
- El interruptor de temporizador se restaura al reanudar.
- El `arranque` más largo del banco cabe sin scroll en 360 px.

🔍 Qué debe probar el usuario
En el móvil: partida a medias → cerrar → reabrir → continuar.

---

## 7. Casos borde

- **Mínimo 3 jugadores**: bloqueado en el stepper. Con 2 el juego no tiene
  sentido (no hay debate).
- **Banco agotado**: aviso en `#dm-aviso` y rebarajado.
- **Banco vacío tras filtrar**: volver a `dm-config` con el error «No hay temas
  para esta configuración».
- **Gastar los dos cambios y seguir sin ideas**: es intencionado — el botón se
  deshabilita y hay que tirar con lo que hay. No se penaliza.
- **Temporizador a 0 justo cuando se pulsa «Ya lo tengo»**: la transición a
  *contar* debe ser **idempotente** (una bandera o comprobar si la vista ya está
  activa) para no ejecutarla dos veces.
- **Salir de la pantalla con el temporizador corriendo**: `dmDetenerTemporizador()`
  en «Terminar», en el botón volver y en «Siguiente jugador».
- **Recarga a mitad de turno**: se reanuda en `dm-turno`, sin tema servido; el
  temporizador no se restaura a medias.
- **Textos larguísimos** (los `arranque` pueden pasar de 80 caracteres):
  `clamp()` + `overflow-wrap`, la caja crece sin provocar scroll.
- **Nombres repetidos o vacíos**: bloqueados en la configuración.
- **`localStorage` bloqueado**: sin «Continuar», el resto igual.
- **Doble toque en «Siguiente jugador»**: deshabilitar hasta haber renderizado
  `dm-turno`, para no saltarse un jugador.

---

## 8. Checklist

- [x] **Fase 1** — Pantallas y configuración
- [x] **Fase 2** — Motor de temas y turnos (banco provisional de 30 temas,
      la muestra de §9 de este plan)
- [x] **Fase 3** — Banco de contenido: **160 temas** (80 `tema` + 80
      `arranque`, 32/32/16 por nivel en cada tipo), objetivo reducido de
      ≥ 400 a 160 a petición del usuario y con temas amplios para poder
      inventar y recordar con facilidad (`data/dosmentiras/temas.json` +
      `.js` generado + `agregar.py`)
- [x] **Fase 4** — Temporizador y modo fiesta
- [x] **Fase 5** — Persistencia y pulido (falta la prueba en dispositivo
      real, que hace el usuario)
- [x] `APP_VERSION`, `CACHE` y `ARCHIVOS` actualizados
- [x] `<script>` de datos y lógica añadidos a `index.html`

---

## 9. Muestra de contenido (para fijar el tono)

~30 entradas de referencia, con los dos tipos. Van al banco tal cual.

```js
// ── tipo "tema" (ámbito abierto) · suave
{ texto: "Tus viajes",                        tipo: "tema", nivel: "suave" },
{ texto: "La época del colegio",              tipo: "tema", nivel: "suave" },
{ texto: "Tus trabajos",                      tipo: "tema", nivel: "suave" },
{ texto: "Comida y manías raras",             tipo: "tema", nivel: "suave" },
{ texto: "Deportes y desastres físicos",      tipo: "tema", nivel: "suave" },
{ texto: "Tus vecinos",                       tipo: "tema", nivel: "suave" },
{ texto: "Animales que has tenido",           tipo: "tema", nivel: "suave" },
{ texto: "Talentos ocultos",                  tipo: "tema", nivel: "suave" },

// ── tipo "tema" · picante
{ texto: "Tu peor cita",                      tipo: "tema", nivel: "picante" },
{ texto: "Dinero",                            tipo: "tema", nivel: "picante" },
{ texto: "Tu peor jefe",                      tipo: "tema", nivel: "picante" },
{ texto: "Noches que no recuerdas del todo",  tipo: "tema", nivel: "picante" },
{ texto: "Mentiras que has contado en el trabajo", tipo: "tema", nivel: "picante" },
{ texto: "Exparejas",                         tipo: "tema", nivel: "picante" },

// ── tipo "tema" · extremo
{ texto: "Cosas que nunca le has contado a tu familia", tipo: "tema", nivel: "extremo" },
{ texto: "Tus peores decisiones",             tipo: "tema", nivel: "extremo" },

// ── tipo "arranque" (frase empezada) · suave
{ texto: "Tres cosas que hiciste de pequeño y hoy te dan vergüenza", tipo: "arranque", nivel: "suave" },
{ texto: "Tres sitios en los que has estado",                        tipo: "arranque", nivel: "suave" },
{ texto: "Tres cosas que sabes hacer y nadie de aquí sabe",           tipo: "arranque", nivel: "suave" },
{ texto: "Tres cosas que te han pasado en un transporte público",     tipo: "arranque", nivel: "suave" },
{ texto: "Tres motes que te han puesto",                              tipo: "arranque", nivel: "suave" },
{ texto: "Tres cosas que has roto sin querer",                        tipo: "arranque", nivel: "suave" },

// ── tipo "arranque" · picante
{ texto: "Tres cosas que has hecho y de las que no te enorgulleces",  tipo: "arranque", nivel: "picante" },
{ texto: "Tres excusas que has puesto para no ir a un sitio",         tipo: "arranque", nivel: "picante" },
{ texto: "Tres cosas que has hecho por dinero",                       tipo: "arranque", nivel: "picante" },
{ texto: "Tres veces que te han pillado en una mentira",              tipo: "arranque", nivel: "picante" },
{ texto: "Tres cosas que has hecho para llamar la atención de alguien", tipo: "arranque", nivel: "picante" },

// ── tipo "arranque" · extremo
{ texto: "Tres cosas que le has ocultado a alguien de esta sala",     tipo: "arranque", nivel: "extremo" },
{ texto: "Tres veces que has dejado tirado a alguien",                tipo: "arranque", nivel: "extremo" },
{ texto: "Tres cosas de las que te arrepientes de verdad",            tipo: "arranque", nivel: "extremo" },
```

> **Criterio de contenido (§12 global):** «Extremo» debe ser **incómodo, no
> cruel**. Además, un tema mal elegido puede dejar a alguien sin nada que contar:
> los temas deben ser **universales** (todo el mundo ha tenido vecinos, no todo
> el mundo ha tenido pareja). Nada que humille por aspecto, orientación, origen
> o salud mental.
