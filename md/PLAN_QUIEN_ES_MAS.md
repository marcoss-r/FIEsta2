# Plan de desarrollo — FIEsta 2 · «Quién es más…» 🍒

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
letras. Las de este juego son **`qm`**.

El **núcleo compartido** (`js/nucleo/`) trae hecho lo que este juego no debe
reimplementar: configuración de jugadores, niveles, modo fiesta, plantillas,
persistencia y utilidades de azar (**§7 del plan global**, construido en la Fase 2
del proyecto).

Reglas de trabajo: **español** en interfaz, código y comentarios; **sin
`// TODO`**; **una fase cada vez**; y **el usuario prueba la app él mismo**.

---

## 2. Qué es este juego

El juego más rápido y ruidoso de los cinco. La app lanza una pregunta sobre el
grupo, alguien la lee en voz alta y, **a la de tres, todos señalan a la vez** a
quien crean. Se comenta a gritos durante veinte segundos, se pulsa «Siguiente» y
va la próxima.

La gracia está en que **no se limita a «¿quién es más probable que…?»**: el banco
mezcla **dos formatos** distintos, y el encabezado lo pone la app según el
tipo de cada pregunta.

> **Nota (reestructuración posterior):** el banco arrancó con **cuatro** tipos
> (`probable`, `adjetivo`, `primero`, `nunca` — ver §6 y §9 más abajo, que
> documentan esa versión original). El usuario pidió después fusionar
> `primero` y `nunca` dentro de `probable` (ambos se pueden reformular
> siempre como «¿quién es más probable que…?»: «sea el primero en…» / «nunca
> haya…») y depurar `adjetivo` para que solo queden adjetivos genuinos (las
> construcciones «de + infinitivo» que eran en realidad «probable» disfrazado
> también se fusionaron). Ver el bloque de checklist correspondiente en §8
> para el detalle exacto. Esta tabla ya refleja el estado **actual**, de solo
> dos tipos:

| `tipo` | Encabezado que pone la app | Ejemplo completo |
|---|---|---|
| `probable` | ¿Quién es más probable que… | «…acabe durmiendo en el sofá esta noche?» |
| `adjetivo` | ¿Quién es más… | «…dramático cuando se pone malo?» |

La app **no cuenta votos ni lleva marcador**: solo sirve las preguntas y rota
quién lee. Todo lo demás se resuelve señalando y gritando.

---

## 3. Decisiones cerradas (no volver a preguntar)

| Tema | Decisión |
|---|---|
| **Prefijo** | `qm` en estado, funciones, constantes, pantallas, IDs, clases y `localStorage`. |
| **Nº de jugadores** | **2–12**. Por defecto 5 (es un juego que gana con grupo grande). |
| **Pantallas** | `qm-config` → `qm-juego` → `qm-fin`. |
| **Quién lee** | Rota **en orden**, una pregunta por jugador. Los jugadores sirven para eso y para rellenar `{otro}`. |
| **Filtro por tipo** | ✅ **Sí.** En `qm-config` hay dos chips (uno por tipo: `probable`, `adjetivo`), multi-selección, **los dos activos por defecto**, **mínimo uno**. (Originalmente eran cuatro chips; `primero` y `nunca` se fusionaron en `probable`, ver nota de §2.) |
| **Cuenta atrás «3, 2, 1… ¡señalad!»** | ❌ **No se implementa.** La pregunta aparece directamente: el ritmo lo marca quien lee, y una animación obligatoria entre pregunta y pregunta se hace pesada a las veinte rondas. |
| **Niveles de intensidad** | Los tres del núcleo, multi-selección, por defecto suave + picante. Se combinan con el filtro de tipo (**los dos filtros a la vez**). |
| **Modo fiesta** | Interruptor global del núcleo. Bajo la pregunta **siempre** aparece una línea con un castigo concreto para **el más señalado** (ampliación pedida por el usuario, ver más abajo). Con modo fiesta: `castigoPonderado({ beber: 0.9, prenda: 0.1 })`. Sin modo fiesta: `castigoPonderado({ otros: 1 })` (bailar, imitar…, nunca beber ni prenda). |
| **Datos** | Un solo banco `QM_PREGUNTAS` en `data/quienmas/preguntas.js`. El **encabezado no va en los datos**: lo pone la app según el `tipo` (si no, se repetiría 400 veces). |
| **Volumen** | **≥ 400 preguntas**, con los tipos representados. Reparto orientativo: ~40 % suave, ~40 % picante, ~20 % extremo. Tras la fusión de §2: **584 preguntas** (488 `probable` + 96 `adjetivo`, tras una edición manual posterior del usuario sobre `preguntas.js`). |
| **Qué hace la app** | Servir preguntas sin repetir, poner el encabezado, rotar al lector, resolver `{otro}` y guardar la partida. |
| **Qué NO hace la app** | ❌ **No cuenta votos, no hay puntos, no hay podio, no hay ganador.** Se señala con el dedo y punto. |
| **Persistencia** | Clave `"qm_partida"`. Se guarda al servir cada pregunta; se borra en `qm-fin`. |
| **Reanudación y repetición** | Al reanudar, el repartidor se reinicia (puede repetirse alguna pregunta ya vista). |
| **Fin de partida** | Botón **«Terminar»** siempre visible → `qm-fin` con resumen → hub. |
| **Modo parejas** | Ampliación (ver §10): selector de modo en `qm-config` (chip único, no multi-selección). Reutiliza niveles, tipos y banco. |

---

## 4. Especificación

### 4.1 Flujo de juego

```
hub ──► qm-config ──► qm-juego ──┐
                          ▲      │  «Siguiente» (rota lector + pregunta nueva)
                          └──────┘
             «Terminar» ──────────► qm-fin ──► hub
```

**1. `qm-config`**
- Stepper `− N +` (2–12) + lista de nombres (núcleo, §7.3).
- Chips de **niveles** (núcleo, §7.4).
- Chips de **tipo de pregunta** (propios del juego): *Probable* · *Adjetivo*.
  Los dos activos por defecto; **mínimo uno**.
- Interruptor de modo fiesta.
- Botones **«Empezar»** y, si hay guardado, **«Continuar partida»**.
- Validación con `validarNombres()`; error en `#qm-error` (ámbar).

**2. `qm-juego`**
- Arriba, línea tenue: **«Lee ANA»**.
- El **encabezado** del tipo en tamaño medio y color tenue
  («¿Quién es más probable que…»).
- El **cuerpo de la pregunta** en grande, con el `?` que añade la app
  («…acabe durmiendo en el sofá esta noche?»).
- Línea inferior **siempre visible** (ampliación, ver más abajo): «🎯 El más
  señalado: **un trago doble**» (castigo distinto en cada pregunta).
- Botón primario grande **«Siguiente»** y botón secundario **«Terminar»**.
- Línea tenue de progreso: «Pregunta 12».

**3. `qm-fin`**
- Resumen: «Habéis señalado **N** veces. Se acabó la paz.»
- Botones **«Otra partida»** y **«Volver al inicio»**. Borra `"qm_partida"`.

### 4.2 Modelo de datos

```js
// Todo el estado del juego vive aquí.
const qmEstado = {
  nombres: [],
  niveles: ["suave", "picante"],
  tipos: ["probable", "adjetivo"],
  indiceLector: 0,
  preguntaActual: null,   // { texto, tipo, nivel } tal cual del banco
  textoResuelto: "",      // con {otro} ya sustituido
  castigoActual: "",      // siempre hay uno; los pesos cambian según el modo fiesta
  contador: { preguntas: 0 },
  repartidor: null,
};

// Los encabezados viven en el código, no en los datos.
const QM_ENCABEZADOS = {
  probable: "¿Quién es más probable que…",
  adjetivo: "¿Quién es más…",
};

const QM_MIN_JUGADORES = 2;
const QM_MAX_JUGADORES = 12;
const QM_CLAVE_GUARDADO = "qm_partida";
```

**Formato del banco** (`data/quienmas/preguntas.js`):

```js
// Generado desde preguntas.json — no editar a mano (usar agregar.py).
const QM_PREGUNTAS = [
  { texto: "acabe durmiendo en el sofá esta noche",        tipo: "probable", nivel: "suave" },
  { texto: "dramático cuando se pone malo",                tipo: "adjetivo", nivel: "suave" },
];
```

**Convenciones de escritura del banco** (importantes: el texto tiene que encajar
con su encabezado):

- El texto **empieza en minúscula** y **no lleva `?` final** (lo pone la app).
- `probable` → verbo en **subjuntivo** («acabe», «se case», «pida»). Las ideas
  de «quién sería el primero en…» y «quién nunca…» (tipos ya fusionados aquí,
  ver §2) se reformulan dentro de este mismo tipo: «sea el primero en pedir el
  postre», «nunca haya cantado en un karaoke».
- `adjetivo` → un adjetivo o una construcción corta que encaje tras «¿Quién es
  más…» **y sea un rasgo, no una acción**: «dominante en la cama», «puntual»,
  «rencoroso». Si el adjetivo tiene género, **reformular con algo invariable**
  o usar adjetivos que no lo tengan («exigente», «insoportable», «valiente»).
  Nunca escribir «dramático/a». Las construcciones «de + infinitivo» / «capaz
  de + infinitivo» («de dormirse en cualquier sitio») son en realidad
  `probable` disfrazado («se duerma en cualquier sitio») — si describen una
  **acción/costumbre**, van a `probable`; si describen un **rasgo estable**,
  se pueden dejar como adjetivo usando «capaz de + infinitivo» tal cual
  («sea capaz de ligar sin decir una palabra» ya es válido como `probable`,
  no hace falta forzarlo a adjetivo).
- `{otro}` es opcional y puede aparecer en cualquier tipo. **`{jugador}` no se
  usa en este banco**: aquí no hay «turno» de nadie, se pregunta por el grupo.

**Qué se guarda** (clave `"qm_partida"`):

```js
{ nombres, niveles, tipos, indiceLector, contador }
```

### 4.3 Pantallas y componentes

| Pantalla | Elemento | ID |
|---|---|---|
| `qm-config` | contenedor de nombres | `qm-nombres` |
| | stepper | `qm-stepper` |
| | chips de nivel | `qm-niveles` |
| | chips de tipo | `qm-tipos` |
| | interruptor de modo fiesta | `qm-fiesta` |
| | mensaje de validación | `qm-error` |
| | botones | `qm-btn-empezar` · `qm-btn-continuar` |
| `qm-juego` | línea «Lee …» | `qm-lector` |
| | encabezado del tipo | `qm-encabezado` |
| | cuerpo de la pregunta | `qm-pregunta` |
| | línea de castigo (`.anuncio`, `hidden`) | `qm-castigo` |
| | progreso | `qm-progreso` |
| | aviso de banco agotado (`.anuncio`, `hidden`) | `qm-anuncio` |
| | botones | `qm-btn-siguiente` · `qm-btn-terminar` |
| `qm-fin` | resumen | `qm-resumen` |
| | botones | `qm-btn-otra-partida` · `qm-btn-hub` |

**Chips de tipo** (multi-selección, mínimo uno):

```html
<div class="qm-chips" id="qm-tipos">
  <button type="button" class="qm-chip activo" data-tipo="probable">Probable</button>
  <button type="button" class="qm-chip activo" data-tipo="adjetivo">Adjetivo</button>
</div>
```

Al intentar desmarcar el último chip activo, **no se desmarca** (mismo
comportamiento que los chips de nivel del núcleo).

⚠️ `#qm-castigo` usa `hidden`: añadir `.anuncio[hidden] { display: none; }` al CSS
común si no está ya (§3.3 del plan global).

### 4.4 Qué del núcleo se usa y qué es propio

| Del núcleo (§7 global) | Para qué |
|---|---|
| `mostrarPantalla(nombre)` | Navegación. |
| `montarConfigJugadores` · `validarNombres` | `qm-config`. |
| `montarSelectorNiveles` · `filtrarPorNivel` | Chips de nivel y filtrado. |
| `montarInterruptorModoFiesta` · `modoFiestaActivo` · `castigoPonderado` | Línea de castigo bajo la pregunta (siempre visible; los pesos cambian según el modo fiesta). |
| `crearRepartidor(banco)` | Servir preguntas sin repetir. |
| `rellenarPlantilla` · `otrosNecesarios` | Resolver `{otro}` y descartar textos sin candidatos. |
| `guardarJSON` · `cargarJSON` · `hayGuardado` · `borrarGuardado` | «Continuar partida». |

**Propio de este juego:** los chips de tipo (`qm-chip`), el mapa
`QM_ENCABEZADOS`, el filtrado combinado nivel + tipo y la rotación del lector.

---

## 5. Convenciones para no chocar con los otros juegos

- **Estado**: `qmEstado`. **Funciones**: `qmEmpezarPartida()`,
  `qmServirPregunta()`, `qmRender()`, `qmSiguiente()`, `qmTerminar()`,
  `qmGuardar()`, `qmReanudar()`, `qmFiltrarBanco()`.
  **Constantes**: `QM_ENCABEZADOS`, `QM_MIN_JUGADORES`…
- **Pantallas**: `data-pantalla="qm-config|qm-juego|qm-fin"`.
- **IDs** empiezan por `qm-`; **clases CSS** por `.qm-`.
- **`localStorage`**: solo `"qm_partida"`.
- **`<script>` en `index.html`** (§6.2 global):

```html
<script src="data/quienmas/preguntas.js"></script>
…
<script src="js/quienmas/main.js"></script>
```

- **CSS**: bloque propio al final de `css/estilos.css`, abierto con
  `/* ===== Quién es más… (qm) ===== */`.
- Wiring dentro de su propio `DOMContentLoaded`; **el núcleo no se toca**.

---

## 6. Desarrollo por fases

> **Nota:** las fases que siguen describen la versión **original** del juego,
> con **cuatro** tipos de pregunta (`probable`, `adjetivo`, `primero`,
> `nunca`). Esa versión ya está cerrada e implementada tal como se describe.
> Después, el usuario pidió fusionar `primero` y `nunca` dentro de `probable`
> y depurar `adjetivo` (ver la nota de §2 y el bullet correspondiente en el
> checklist de §8): el texto de las fases se deja sin tocar como registro
> histórico, pero **ya no describe el estado actual del juego** en lo que
> respecta al número de tipos.

### Fase 1 — Pantallas, configuración y filtro por tipo

🎯 Que se pueda configurar una partida eligiendo niveles **y** tipos.

🛠️ A construir
- Las 3 pantallas en `index.html` con los IDs de §4.3.
- Bloque CSS `qm`: chips de tipo (misma pinta que los de nivel del núcleo, pero
  con su prefijo), encabezado tenue + pregunta grande, botón «Siguiente» ancho.
- `js/quienmas/main.js` con `qmEstado`, wiring, `montarConfigJugadores`,
  `montarSelectorNiveles`, interruptor de modo fiesta y chips de tipo con la
  regla de «mínimo uno».
- `qmEmpezarPartida()`: valida, vuelca la configuración y pasa a `qm-juego`.

✅ Aceptación
- Los cuatro chips de tipo empiezan activos y se pueden desmarcar salvo el
  último.
- Nombres vacíos o repetidos bloquean el paso.
- La consola está limpia.

🔍 Qué debe probar el usuario
Desmarcar tres tipos y comprobar que el cuarto ya no se puede desmarcar.

---

### Fase 2 — Motor de preguntas y encabezados

🎯 Que el juego sea jugable con un banco de prueba.

🛠️ A construir
- Banco provisional de ~40 preguntas con los cuatro tipos.
- `qmFiltrarBanco()`: filtra por nivel (`filtrarPorNivel`), por tipo (los chips)
  y descarta textos cuyo `otrosNecesarios(texto) > nombres.length - 1`.
- `crearRepartidor()` y `qmServirPregunta()`.
- `qmRender()`: pinta `QM_ENCABEZADOS[tipo]`, el cuerpo con `?` al final y la
  línea «Lee NOMBRE».
- Rotación del lector en orden en cada «Siguiente».
- Contador y `qm-fin` con el resumen real.
- Aviso de banco agotado en el `.anuncio` y rebarajado.

✅ Aceptación
- Las cuatro combinaciones encabezado + cuerpo se leen bien en voz alta, sin
  concordancias raras.
- 40 preguntas seguidas sin repetición.
- Desmarcar un tipo hace que ese tipo no vuelva a salir en toda la partida.

🔍 Qué debe probar el usuario
Leer 15 preguntas en voz alta y avisar de cualquier frase que suene forzada: eso
es un fallo de convención de escritura, no de código.

---

### Fase 3 — Banco de contenido (≥ 400)

🎯 Contenido definitivo, con los cuatro tipos bien representados.

🛠️ A construir
- `data/quienmas/preguntas.json` (fuente) y `preguntas.js` (generado).
- `data/quienmas/agregar.py`: pregunta texto, tipo y nivel; valida el tipo y el
  nivel; **avisa si el texto empieza por mayúscula o acaba en `?`** (error típico
  al pegar una frase entera); evita duplicados; regenera el `.js`.
- Contenido a cuatro manos (§2.4 global): tanda de 30–50, validar tono, producir.

✅ Aceptación
- ≥ 400 preguntas, ≥ 60 de cada tipo, reparto ~40/40/20 por nivel.
- Ninguna se solapa con «Preguntas incómodas» (allí se responde hablando, aquí se
  señala).
- Ningún `adjetivo` con género marcado.

🔍 Qué debe probar el usuario
Jugar solo con un tipo activo (p. ej. «Nunca») y ver si aguanta 20 preguntas
seguidas sin cansar.

---

### Fase 4 — Modo fiesta y pulido

🎯 Cerrar el juego.

🛠️ A construir
- Con modo fiesta activo, `castigoAlAzar()` en `#qm-castigo` **en cada pregunta**
  («🍻 El más señalado: …»); con el modo apagado, el `.anuncio` va `hidden`.
- `qmGuardar()` al servir cada pregunta, `qmReanudar()` y borrado en `qm-fin`.
- `clamp()` en el cuerpo de la pregunta; `env(safe-area-inset-*)` en el botón
  volver y la fila inferior.
- Subir `APP_VERSION` y `CACHE`, y añadir los archivos nuevos a `ARCHIVOS`.

✅ Aceptación
- El castigo cambia de una pregunta a otra.
- (Ampliación posterior, ver checklist: con el modo apagado ya no se oculta
  la línea, muestra un castigo "neutro" en vez de nada.)
- Se reanuda una partida a medias con los mismos filtros de nivel y tipo.
- La pregunta más larga cabe sin scroll en 360 px.

🔍 Qué debe probar el usuario
Una ronda larga en el móvil, con modo fiesta encendido, cerrando la app a mitad
y continuando.

---

## 7. Casos borde

- **2 jugadores**: el juego pierde gracia pero funciona; se descartan los textos
  con `{otro2}`.
- **Un solo tipo + un solo nivel**: es la combinación que antes agota el banco.
  Al agotarse, avisar y rebarajar.
- **Combinación vacía** (p. ej. solo «extremo» + solo «adjetivo» y no hay
  entradas): volver a `qm-config` con el error «No hay preguntas para esta
  combinación de nivel y tipo».
- **`{otro}`**: se resuelve excluyendo al **lector** (`{jugador}` = lector), para
  que quien lee no acabe preguntando por sí mismo.
- **Textos con género en `adjetivo`**: es un problema de contenido, no de código;
  se corrige en el banco (ver convenciones de §4.2).
- **Textos larguísimos**: `clamp()` + `overflow-wrap`; la caja crece, la pantalla
  no hace scroll.
- **Nombres repetidos o vacíos**: bloqueados en la configuración.
- **Recarga a mitad**: se reanuda con una pregunta nueva del mismo filtro (aquí
  no hay secreto que proteger ni turno a medias).
- **`localStorage` bloqueado**: sin «Continuar», el resto igual.
- **Doble toque en «Siguiente»**: deshabilitar el botón hasta que se haya
  renderizado la pregunta siguiente, para no saltarse ninguna.

---

## 8. Checklist

- [x] **Fase 1** — Pantallas, configuración y filtro por tipo
- [x] **Fase 2** — Motor de preguntas y encabezados (banco provisional de 32,
      la muestra de §9 de este plan)
- [x] **Fase 3** — Banco de contenido (≥ 400, ≥ 60 por tipo): 400 preguntas
      (100 por tipo, 40 suave / 40 picante / 20 extremo en cada uno), sin
      duplicados exactos, con `preguntas.json` (fuente) y `agregar.py`.
      Probado con jsdom: 300 preguntas seguidas sin repetirse, 0 errores de
      consola. Pendiente de que el usuario lo revise y afine (§2.4)
- [x] **Fase 4** — Modo fiesta y pulido (adelantada junto con las Fases 1-2:
      castigo por pregunta, guardado/reanudación, `clamp()`, `APP_VERSION`/
      `CACHE`/`ARCHIVOS` al día; falta la prueba en dispositivo real, que
      hace el usuario)
- [x] `APP_VERSION`, `CACHE` y `ARCHIVOS` actualizados
- [x] `<script>` de datos y lógica añadidos a `index.html`
- [x] **Modo parejas** (ver §10) — pedido por el usuario tras cerrar las
      Fases 1-2-4; se implementa reutilizando el banco y los filtros
      existentes, sin banco propio ni fase nueva de contenido.
- [x] **Castigo siempre visible, con pesos por categoría** (ampliación
      pedida por el usuario, solo en el modo normal, no en parejas — ese
      sigue con `castigoAlAzar()` y solo con modo fiesta): con modo fiesta,
      `castigoPonderado({ beber: 0.9, prenda: 0.1 })`; sin modo fiesta,
      `castigoPonderado({ otros: 1 })`. La línea `#qm-castigo` deja de
      ocultarse nunca.
- [x] **Ajuste de tono y limpieza de duplicados fantasma** (pedido por el
      usuario, leyendo el banco ya revisado de `data/yonunca/frases.json`):
      picante y extremo reescritos por completo (picante más explícito;
      extremo centrado en la dinámica de **este grupo concreto** — favoritismos,
      secretos y tensiones entre quienes juegan, no solo confesiones
      genéricas). Suave se mantiene, con un puñado de duplicados fantasma
      corregidos (misma idea, distinta redacción) tras pasar un detector de
      similitud por todo el banco. 400 preguntas en total sin cambios de
      volumen (100 por tipo, 40/40/20 por nivel).
- [x] **Fusión de tipos: de cuatro a dos** (pedido por el usuario, con el
      banco ya en 446 preguntas tras una edición manual suya —
      `data/quienmas/preguntas.json`, commit «Actualizar tarjetas de quien es
      más»):
      - `primero` (100 entradas) se reescribió entera como `probable`,
        anteponiendo «sea el primero en » al texto original (infinitivo sin
        tocar, cero riesgo de conjugación): «perderse en una ciudad nueva» →
        «sea el primero en perderse en una ciudad nueva».
      - `nunca` (100 entradas) se reescribió entera como `probable`,
        convirtiendo el auxiliar («ha…» → «nunca haya…», «se ha…» → «nunca se
        haya…»); 5 casos con una segunda acción coordinada bajo el mismo
        «nunca» se corrigieron a mano para que el segundo verbo también
        llevara «haya» (p. ej. «...y ha seguido fingiendo» → «...y haya
        seguido fingiendo»).
      - `adjetivo` (97 entradas) se depuró: se dejaron **13** adjetivos
        genuinos de nivel suave («dramático», «puntual», «impulsivo»…); las
        **84** restantes (construcciones «de + infinitivo» / «capaz de +
        infinitivo», que en realidad eran «probable» disfrazado, p. ej. «de
        dormirse en cualquier sitio») se reescribieron como `probable`
        («se duerma en cualquier sitio», «sea capaz de ligar sin decir una
        palabra»).
      - Como la categoría `adjetivo` quedó casi vacía en picante/extremo
        (0 supervivientes en ambos), se añadieron **75 adjetivos nuevos**
        genuinos (22 suave, 35 picante, 18 extremo) para no dejarla escasa.
      - Se corrigió además un **`que` redundante** al inicio de 35 de las
        149 entradas `probable` originales (el encabezado de la app ya
        termina en «…que», así que el texto no debe repetirlo:
        «que se quede atrapado…» → «se quede atrapado…»).
      - Se encontró y eliminó **1 duplicado exacto** preexistente en los
        datos («se le olvide una cita importante», repetido dos veces en
        `probable`/suave).
      - Resultado: **520 preguntas** (432 `probable` + 88 `adjetivo`; suave
        174+35, picante 174+35, extremo 84+18). `QM_TIPOS` y
        `QM_ENCABEZADOS` en `js/quienmas/main.js` se redujeron a los dos
        tipos vigentes; `agregar.py` actualizado igual.
      - Verificado con jsdom: sin `{otro}` sin resolver, sin duplicados
        exactos, filtro por tipo funcionando con solo dos chips, 150 turnos
        seguidos sin errores de consola.
- [x] **Sincronización tras edición manual del usuario** (el usuario editó
      `preguntas.js` directamente en dos commits — «actualizar js quien mas»,
      «Actulizar preguntas js de quienmas» — añadiendo, quitando y
      reescribiendo preguntas a mano): `preguntas.json` se regeneró
      parseando el `.js` (fuente de la verdad pasó a ser el `.js` en ese
      momento), y `preguntas.js` se volvió a generar desde ese `.json` con
      `agregar.py` para recuperar el formato canónico. Resultado: **584
      preguntas** (488 `probable` + 96 `adjetivo`). Se detectaron y se
      **dejaron sin tocar** (pendientes de que el usuario decida): 3
      duplicados exactos («lo deje con su pareja», «hable mal de alguien de
      esta sala a sus espaldas», «sea el primero en sentirse mal tras
      haberse equivocado») y 3 entradas `probable` con un «que» redundante
      al inicio («que mande un texto kilométrico…», «que mande un audio de
      10 minutos…», «que nunca cambie de tipo de persona que le gusta»).

---

## 9. Muestra de contenido (para fijar el tono)

~32 entradas de referencia, con los cuatro tipos **originales** (histórico:
`primero` y `nunca` ya no existen como tipo, ver nota de §2 y §6).

```js
// ── probable
{ texto: "acabe durmiendo en el sofá esta noche",                    tipo: "probable", nivel: "suave" },
{ texto: "pierda el móvil en los próximos tres meses",               tipo: "probable", nivel: "suave" },
{ texto: "se apunte a un gimnasio y no vaya nunca",                  tipo: "probable", nivel: "suave" },
{ texto: "llore viendo un anuncio",                                  tipo: "probable", nivel: "suave" },
{ texto: "se enamore de alguien a quien conoció esa misma noche",    tipo: "probable", nivel: "picante" },
{ texto: "conteste un mensaje a las cuatro de la mañana",            tipo: "probable", nivel: "picante" },
{ texto: "acabe montando una escena en una boda",                    tipo: "probable", nivel: "picante" },
{ texto: "se case con {otro} si el mundo se acabara mañana",         tipo: "probable", nivel: "picante" },
{ texto: "haya mentido en algo gordo esta misma semana",             tipo: "probable", nivel: "extremo" },
{ texto: "deje de hablarse con alguien de esta sala en un año",      tipo: "probable", nivel: "extremo" },

// ── adjetivo
{ texto: "de hacer un drama cuando se pone malo",                    tipo: "adjetivo", nivel: "suave" },
{ texto: "insoportable antes del primer café",                       tipo: "adjetivo", nivel: "suave" },
{ texto: "exigente con los demás y blando consigo mismo",            tipo: "adjetivo", nivel: "suave" },
{ texto: "de organizar planes que luego cancela",                    tipo: "adjetivo", nivel: "suave" },
{ texto: "de perdonar demasiado rápido",                             tipo: "adjetivo", nivel: "picante" },
{ texto: "de decir «no me importa» cuando le importa muchísimo",     tipo: "adjetivo", nivel: "picante" },
{ texto: "dependiente de que le digan que lo está haciendo bien",    tipo: "adjetivo", nivel: "picante" },
{ texto: "de guardar rencor durante años sin decirlo",               tipo: "adjetivo", nivel: "extremo" },

// ── primero
{ texto: "perderse en una ciudad nueva",                             tipo: "primero", nivel: "suave" },
{ texto: "quedarse dormido en el cine",                              tipo: "primero", nivel: "suave" },
{ texto: "pedir el postre antes que nadie",                          tipo: "primero", nivel: "suave" },
{ texto: "montar el karaoke en una reunión familiar",                tipo: "primero", nivel: "suave" },
{ texto: "escribir a su ex después de tres copas",                   tipo: "primero", nivel: "picante" },
{ texto: "contar un secreto que le habían pedido guardar",           tipo: "primero", nivel: "picante" },
{ texto: "abandonar el grupo si la cosa se pusiera fea",             tipo: "primero", nivel: "extremo" },
{ texto: "reconocer que ha estado fingiendo estar bien",             tipo: "primero", nivel: "extremo" },

// ── nunca
{ texto: "ha ido a una fiesta sin saber de quién era",               tipo: "nunca", nivel: "suave" },
{ texto: "ha cantado en un karaoke delante de desconocidos",         tipo: "nunca", nivel: "suave" },
{ texto: "se ha ido de un sitio sin despedirse de nadie",            tipo: "nunca", nivel: "suave" },
{ texto: "ha cotilleado el móvil de alguien",                        tipo: "nunca", nivel: "picante" },
{ texto: "ha inventado una excusa para cortar una conversación",     tipo: "nunca", nivel: "picante" },
{ texto: "ha dicho «te quiero» sin sentirlo",                        tipo: "nunca", nivel: "extremo" },
```

> **Criterio de contenido (§12 global):** «Extremo» debe ser **incómodo, no
> cruel**. Nada que humille por aspecto, orientación, origen o salud mental.
> Ojo especial en este juego: como se **señala a una persona real**, una pregunta
> mal calibrada duele de verdad. Si una entrada solo funciona haciendo daño,
> fuera.

---

## 10. Modo parejas (ampliación)

Pedido por el usuario después de cerrar las Fases 1-2-4. Es un **modo
alternativo** dentro del mismo juego, no un juego nuevo: reutiliza jugadores,
niveles, tipos y el banco `QM_PREGUNTAS` tal cual.

### 10.1 Qué es

En vez de que todos señalen a la vez sobre el grupo, se sortea **una pareja**
de entre todos los jugadores y sale «a la palestra». Se le hacen **8
preguntas seguidas** (el mismo banco de siempre) y, para cada una, **ambos
señalan a la vez a quien crean** — pero esta vez solo entre ellos dos importa
si **coinciden o no**. La app no puede saber a quién han señalado (igual que
en el modo normal, es un juego de dedo y voz), así que quien lleva el móvil
**pulsa el resultado real** tras cada pregunta.

Terminadas las 8 rondas de una pareja, sale otra: el juego recorre **todas
las combinaciones posibles de parejas** de los jugadores apuntados, en orden
aleatorio, cada una exactamente una vez, y termina automáticamente al
agotarlas. Al final (o al pulsar «Terminar» antes de tiempo) se muestra un
**ranking de parejas** ordenado por número de coincidencias.

### 10.2 Decisiones cerradas de esta ampliación

| Tema | Decisión |
|---|---|
| **Activación** | Chip de selección **única** en `qm-config` (`qm-modo`: Normal / Parejas), mismo look que `.qm-chip` pero sin multi-selección (patrón ya usado en `vr-modo` de Verdad o Reto). |
| **Combinaciones** | **Todas** las combinaciones de 2 sobre los jugadores apuntados (C(n,2)), barajadas una vez al empezar. Cada combinación se juega **exactamente una vez**, nunca se repite en la misma partida. |
| **Rondas por pareja** | Fijo: **8** (`QM_RONDAS_PAREJA`). |
| **Registro del resultado** | Dos botones tras cada pregunta: **«Coinciden»** / **«Difieren»**. Los pulsa quien lleva el móvil, según lo que ha pasado de verdad. |
| **Castigo** | Solo si **difieren**: con modo fiesta activo, `castigoAlAzar()` dirigido a la pareja («🍻 Ana y Luis: un trago»); con el modo apagado, solo un aviso neutro («Han diferido»), sin forzar nada (igual criterio que el resto del juego: sin modo fiesta, no hay consecuencia impuesta por la app). |
| **Sin «lector»** | En este modo nadie lee por turno: se muestra «A vs B» en vez de «Lee NOMBRE». El hueco `{otro}`/`{otro2}` se resuelve con **todos** los jugadores como candidatos (no se excluye a nadie, a diferencia del modo normal que excluye al lector). |
| **Repartidor** | Uno solo para **todo el torneo** de parejas (no uno por pareja), para no repetir preguntas entre parejas distintas hasta agotar el banco filtrado. |
| **Filtros** | Reutiliza los mismos chips de nivel y de tipo de `qm-config`; el filtrado de banco también descarta textos cuyo `otrosNecesarios` no se pueda cubrir con `nombres.length` (ver §10.4). |
| **Fin de partida** | Automático al agotar todas las combinaciones, o manual con **«Terminar»** (siempre visible en `qm-pareja`). Ambos caminos llevan a `qm-ranking`. |
| **Qué entra en el ranking** | Solo las parejas que **completaron sus 8 rondas**. Si se pulsa «Terminar» a mitad de una pareja, esa pareja en curso se descarta (no se cuenta con datos parciales). |
| **Orden del ranking** | Descendente por nº de coincidencias (de 8). Empates: se mantiene el orden en que terminaron, sin desempate especial. |
| **Persistencia** | Misma clave `"qm_partida"`, con un campo `modo` y, si es `"parejas"`, el sub-estado (`combinaciones`, `indiceCombinacion`, `ronda`, `coincidencias`, `diferencias`, `ranking`). Al reanudar, el repartidor se reinicia (mismo criterio que el resto de la app) y se sirve una pregunta nueva para la ronda en curso. |
| **Jugadores** | Mismo rango 2–12. Con 2 jugadores solo hay una combinación posible (ellos mismos): el torneo son 8 rondas y termina. |

### 10.3 Flujo

```
qm-config (chip de modo) ──► modo "parejas" ──► qm-pareja ──┐
                                                    ▲        │ «Siguiente» tras marcar
                                                    └────────┘  Coinciden/Difieren
                     «Terminar» ─────────────┐
        (combinaciones agotadas) ────────────┴──► qm-ranking ──► hub
                                                       │
                                              «Otra partida» (nuevo sorteo,
                                               mismos jugadores/filtros)
```

### 10.4 Modelo de datos (ampliación de `qmEstado`)

```js
const QM_RONDAS_PAREJA = 8;

const QM_MODOS = [
  { id: "normal", nombre: "Normal" },
  { id: "parejas", nombre: "Parejas" },
];

// Añadido a qmEstado:
qmEstado.modo = "normal";           // "normal" | "parejas"
qmEstado.parejas = {
  repartidor: null,                 // uno solo para todo el torneo
  combinaciones: [],                // [[i, j], …] índices sobre qmEstado.nombres, barajadas
  indiceCombinacion: 0,
  ronda: 0,                         // 1..QM_RONDAS_PAREJA de la pareja actual
  coincidencias: 0,
  diferencias: 0,
  ranking: [],                      // [{ a, b, coincidencias, diferencias }, …] parejas ya completadas
};
```

`qmFiltrarBanco(disponibles)` se generaliza con un parámetro (antes fijo a
`nombres.length - 1`): el modo normal sigue pasando `nombres.length - 1`
(excluye al lector), el modo parejas pasa `nombres.length` (nadie se
excluye).

### 10.5 Pantallas y componentes nuevos

| Pantalla | Elemento | ID |
|---|---|---|
| `qm-config` | chip de modo (selección única) | `qm-modo` |
| `qm-pareja` | línea «A vs B» | `qm-pareja-vs` |
| | progreso («Pareja 2 de 10 · Ronda 3 de 8») | `qm-pareja-progreso` |
| | encabezado del tipo | `qm-pareja-encabezado` |
| | cuerpo de la pregunta | `qm-pareja-pregunta` |
| | resultado de la ronda (`.anuncio`, `hidden`) | `qm-pareja-resultado` |
| | aviso de banco agotado (`.anuncio`, `hidden`) | `qm-pareja-anuncio` |
| | botones de registro | `qm-btn-coinciden` · `qm-btn-difieren` |
| | botón «Siguiente» (`hidden` hasta marcar resultado) | `qm-btn-siguiente-pareja` |
| | botón «Terminar» (siempre visible) | `qm-btn-terminar-parejas` |
| `qm-ranking` | lista de ranking | `qm-ranking-lista` |
| | botones | `qm-btn-ranking-otra` · `qm-btn-ranking-hub` |

### 10.6 Casos borde propios de este modo

- **Combinación de nivel/tipo vacía**: mismo error que el modo normal, en
  `#qm-error`, sin salir de `qm-config`.
- **Banco agotado a mitad de torneo**: mismo aviso que el resto de juegos
  (`.anuncio`), rebaraja y sigue, nunca bloquea.
- **`{otro}` puede nombrar a uno de los dos de la pareja actual**: no se
  excluye, es un simple hueco de texto dentro de la pregunta, no tiene
  relación con a quién señalan después.
- **Terminar en la ronda 8 justo antes de pulsar «Siguiente»**: esa pareja
  cuenta como completada solo si ya se pulsó Coinciden/Difieren de la ronda 8
  (es decir, si ya está en `ranking`); si se pulsa «Terminar» con la
  pregunta 8 aún sin resultado, se descarta como el resto de parejas a
  medias.
- **Doble toque en los botones de resultado**: se ocultan nada más pulsar
  uno (aparece «Siguiente» en su lugar), igual criterio que el resto de
  botones de una sola vez de la app.
