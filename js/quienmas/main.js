// Quién es más… (qm) — md/PLAN_QUIEN_ES_MAS.md. Lanza una pregunta sobre el
// grupo; todos señalan a la vez. La app NO cuenta votos ni lleva marcador.

const QM_MIN_JUGADORES = 2;
const QM_MAX_JUGADORES = 12;
const QM_CLAVE_GUARDADO = "qm_partida";
const QM_RONDAS_PAREJA = 8;

// Modo parejas (§10 del plan): selección ÚNICA, a diferencia de los chips de
// nivel y de tipo, que son multi-selección.
const QM_MODOS = [
  { id: "normal", nombre: "Normal" },
  { id: "parejas", nombre: "Parejas" },
];

// Los encabezados viven en el código, no en los datos: si fueran parte de
// cada entrada del banco, se repetirían cientos de veces.
const QM_ENCABEZADOS = {
  probable: "¿Quién es más probable que…",
  adjetivo: "¿Quién es más…",
  primero: "¿Quién sería el primero en…",
  nunca: "¿Quién nunca…",
};

// Filtro de tipo, propio de este juego (a diferencia del de nivel, que es del
// núcleo): mismo patrón de chips multi-selección con mínimo uno activo.
const QM_TIPOS = [
  { id: "probable", nombre: "Probable" },
  { id: "adjetivo", nombre: "Adjetivo" },
  { id: "primero", nombre: "El primero en" },
  { id: "nunca", nombre: "Nunca" },
];

// Todo el estado de la partida vive aquí.
const qmEstado = {
  nombres: [],
  niveles: [],
  tipos: [],
  modo: "normal", // "normal" | "parejas"
  indiceLector: 0,
  preguntaActual: null,
  textoResuelto: "",
  castigoActual: "",
  contador: { preguntas: 0 },
  repartidor: null,
  // Sub-estado propio del modo parejas (§10 del plan).
  parejas: {
    repartidor: null,
    combinaciones: [], // [[i, j], …] índices sobre qmEstado.nombres, barajadas
    indiceCombinacion: 0,
    ronda: 0, // 1..QM_RONDAS_PAREJA de la pareja actual
    coincidencias: 0,
    diferencias: 0,
    ranking: [], // [{ a, b, coincidencias, diferencias }, …] parejas ya completadas
  },
};

// Referencias a los componentes montados en qm-config: se crean una sola vez
// al cargar la página y se reutilizan en cada partida.
let qmConfigJugadores = null;
let qmSelectorNiveles = null;
let qmSelectorTipos = null;
let qmSelectorModo = null;

function qmMontarSelectorTipos(contenedor, alCambiar) {
  let elegidos = QM_TIPOS.map((tipo) => tipo.id); // los cuatro activos por defecto

  function render() {
    contenedor.innerHTML = "";
    QM_TIPOS.forEach((tipo) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "qm-chip" + (elegidos.includes(tipo.id) ? " activo" : "");
      chip.dataset.tipo = tipo.id;
      chip.textContent = tipo.nombre;
      chip.addEventListener("click", () => alternar(tipo.id));
      contenedor.appendChild(chip);
    });
  }

  function alternar(id) {
    if (elegidos.includes(id)) {
      if (elegidos.length === 1) return; // mínimo uno activo
      elegidos = elegidos.filter((t) => t !== id);
    } else {
      elegidos = elegidos.concat(id);
    }
    render();
    alCambiar(elegidos.slice());
  }

  render();
  alCambiar(elegidos.slice());

  return { obtenerTipos: () => elegidos.slice() };
}

function qmMontarSelectorModo(contenedor, alCambiar) {
  let elegido = "normal";

  function render() {
    contenedor.innerHTML = "";
    QM_MODOS.forEach((modo) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "qm-chip" + (modo.id === elegido ? " activo" : "");
      chip.dataset.modo = modo.id;
      chip.textContent = modo.nombre;
      chip.addEventListener("click", () => elegir(modo.id));
      contenedor.appendChild(chip);
    });
  }

  function elegir(id) {
    if (id === elegido) return;
    elegido = id;
    render();
    alCambiar(elegido);
  }

  render();
  return { obtenerModo: () => elegido };
}

// Filtra por nivel (núcleo) y por tipo (chips propios), y descarta las
// preguntas cuyo {otro}/{otro2} no puede resolverse con los "disponibles"
// que pase cada modo: el modo normal excluye al lector (nombres.length - 1),
// el modo parejas no excluye a nadie (nombres.length), porque ahí nadie lee
// para sí mismo (§10.4 del plan).
function qmFiltrarBanco(disponibles) {
  const porNivel = filtrarPorNivel(QM_PREGUNTAS, qmEstado.niveles);
  const porTipo = porNivel.filter((pregunta) => qmEstado.tipos.includes(pregunta.tipo));
  return porTipo.filter((pregunta) => otrosNecesarios(pregunta.texto) <= disponibles);
}

// Prepara el repartidor con el banco ya filtrado. Devuelve false (y muestra
// el error) si la combinación de nivel y tipo deja el banco vacío.
function qmIniciarMotor() {
  const banco = qmFiltrarBanco(qmEstado.nombres.length - 1);
  if (banco.length === 0) {
    document.getElementById("qm-error").textContent =
      "No hay preguntas para esta combinación de nivel y tipo.";
    return false;
  }
  qmEstado.repartidor = crearRepartidor(banco);
  return true;
}

function qmServirPregunta() {
  const { valor, agotado } = qmEstado.repartidor.siguiente();
  qmEstado.preguntaActual = valor;
  qmEstado.contador.preguntas++;

  const lector = qmEstado.nombres[qmEstado.indiceLector];
  const otros = qmEstado.nombres.filter((_, indice) => indice !== qmEstado.indiceLector);
  qmEstado.textoResuelto = rellenarPlantilla(valor.texto, { jugador: lector, otros });

  // El castigo es propio de cada pregunta: cambia en cada "Siguiente", no es
  // fijo durante toda la partida. Con modo fiesta, casi siempre es beber (el
  // 10 % restante, quitarse una prenda); sin modo fiesta, se usan los
  // castigos "neutros" del banco (bailar, imitar…), nunca beber ni prenda.
  qmEstado.castigoActual = modoFiestaActivo()
    ? castigoPonderado({ beber: 0.9, prenda: 0.1 })
    : castigoPonderado({ otros: 1 });

  const anuncio = document.getElementById("qm-anuncio");
  anuncio.hidden = !agotado;
  if (agotado) {
    anuncio.textContent = "Se han acabado las preguntas con este filtro: volvemos a barajar.";
  }
}

function qmRender() {
  document.getElementById("qm-lector").textContent =
    `Lee ${qmEstado.nombres[qmEstado.indiceLector]}`;
  document.getElementById("qm-encabezado").textContent =
    QM_ENCABEZADOS[qmEstado.preguntaActual.tipo];
  document.getElementById("qm-pregunta").textContent = `${qmEstado.textoResuelto}?`;
  document.getElementById("qm-progreso").textContent = `Pregunta ${qmEstado.contador.preguntas}`;

  // Ahora siempre hay castigo (con o sin modo fiesta, ver qmServirPregunta),
  // así que esta línea ya no se oculta nunca; el emoji es neutro porque el
  // castigo puede no tener nada que ver con beber.
  const castigoEl = document.getElementById("qm-castigo");
  castigoEl.hidden = false;
  castigoEl.textContent = `🎯 El más señalado: ${qmEstado.castigoActual}`;
}

// ===== Modo parejas (§10 del plan) =====

// Todas las combinaciones de 2 sobre n jugadores (por índice), barajadas.
function qmGenerarCombinaciones(n) {
  const combinaciones = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      combinaciones.push([i, j]);
    }
  }
  return barajar(combinaciones);
}

function qmParejaActual() {
  const [i, j] = qmEstado.parejas.combinaciones[qmEstado.parejas.indiceCombinacion];
  return [qmEstado.nombres[i], qmEstado.nombres[j]];
}

// Prepara el repartidor (uno solo para todo el torneo) y sortea el orden de
// las parejas. Devuelve false (y muestra el error) si el banco filtrado
// queda vacío.
function qmIniciarMotorParejas() {
  const banco = qmFiltrarBanco(qmEstado.nombres.length);
  if (banco.length === 0) {
    document.getElementById("qm-error").textContent =
      "No hay preguntas para esta combinación de nivel y tipo.";
    return false;
  }
  qmEstado.parejas.repartidor = crearRepartidor(banco);
  qmEstado.parejas.combinaciones = qmGenerarCombinaciones(qmEstado.nombres.length);
  qmEstado.parejas.indiceCombinacion = 0;
  qmEstado.parejas.ronda = 0;
  qmEstado.parejas.coincidencias = 0;
  qmEstado.parejas.diferencias = 0;
  qmEstado.parejas.ranking = [];
  return true;
}

function qmServirPreguntaPareja() {
  const { valor, agotado } = qmEstado.parejas.repartidor.siguiente();
  qmEstado.preguntaActual = valor;
  // Sin lector: {otro}/{otro2} se resuelve con todos los jugadores como
  // candidatos, nadie se excluye (a diferencia del modo normal).
  qmEstado.textoResuelto = rellenarPlantilla(valor.texto, {
    jugador: undefined,
    otros: qmEstado.nombres,
  });

  const anuncio = document.getElementById("qm-pareja-anuncio");
  anuncio.hidden = !agotado;
  if (agotado) {
    anuncio.textContent = "Se han acabado las preguntas con este filtro: volvemos a barajar.";
  }
}

function qmRenderPareja() {
  const [a, b] = qmParejaActual();
  document.getElementById("qm-pareja-vs").textContent = `${a} vs ${b}`;
  document.getElementById("qm-pareja-progreso").textContent =
    `Pareja ${qmEstado.parejas.indiceCombinacion + 1} de ${qmEstado.parejas.combinaciones.length} · ` +
    `Ronda ${qmEstado.parejas.ronda} de ${QM_RONDAS_PAREJA}`;
  document.getElementById("qm-pareja-encabezado").textContent =
    QM_ENCABEZADOS[qmEstado.preguntaActual.tipo];
  document.getElementById("qm-pareja-pregunta").textContent = `${qmEstado.textoResuelto}?`;

  document.getElementById("qm-pareja-resultado").hidden = true;
  document.getElementById("qm-btn-coinciden").hidden = false;
  document.getElementById("qm-btn-difieren").hidden = false;
  document.getElementById("qm-btn-siguiente-pareja").hidden = true;
}

// Registra si la pareja ha coincidido o no en esta ronda (lo decide quien
// lleva el móvil, la app no puede saber a quién han señalado).
function qmElegirResultado(coinciden) {
  const [a, b] = qmParejaActual();
  const resultadoEl = document.getElementById("qm-pareja-resultado");
  if (coinciden) {
    qmEstado.parejas.coincidencias++;
    resultadoEl.textContent = "🙌 ¡Coinciden! Se libran.";
  } else {
    qmEstado.parejas.diferencias++;
    resultadoEl.textContent = modoFiestaActivo()
      ? `🍻 ${a} y ${b}: ${castigoAlAzar()}`
      : "😬 Han diferido.";
  }
  resultadoEl.hidden = false;
  document.getElementById("qm-btn-coinciden").hidden = true;
  document.getElementById("qm-btn-difieren").hidden = true;
  document.getElementById("qm-btn-siguiente-pareja").hidden = false;
  qmGuardar();
}

// Cierra la pareja actual (ya completó sus 8 rondas): la manda al ranking y
// avanza a la siguiente combinación.
function qmCerrarParejaActual() {
  const [a, b] = qmParejaActual();
  qmEstado.parejas.ranking.push({
    a,
    b,
    coincidencias: qmEstado.parejas.coincidencias,
    diferencias: qmEstado.parejas.diferencias,
  });
  qmEstado.parejas.indiceCombinacion++;
  qmEstado.parejas.ronda = 0;
  qmEstado.parejas.coincidencias = 0;
  qmEstado.parejas.diferencias = 0;
}

// Botón «Siguiente» de qm-pareja: pasa a la ronda siguiente de la pareja
// actual o, si ya jugó sus 8 rondas, cierra la pareja y sortea la próxima
// pregunta para la siguiente (o muestra el ranking si ya no quedan).
function qmSiguienteRondaPareja() {
  if (qmEstado.parejas.ronda >= QM_RONDAS_PAREJA) {
    qmCerrarParejaActual();
    if (qmEstado.parejas.indiceCombinacion >= qmEstado.parejas.combinaciones.length) {
      qmMostrarRanking();
      return;
    }
  }
  qmEstado.parejas.ronda++;
  qmServirPreguntaPareja();
  qmRenderPareja();
  qmGuardar();
}

// Pinta el ranking (solo parejas que completaron sus 8 rondas) y navega a
// qm-ranking. La llaman tanto el fin automático como «Terminar».
function qmMostrarRanking() {
  const ranking = qmEstado.parejas.ranking
    .slice()
    .sort((x, y) => y.coincidencias - x.coincidencias);

  const contenedor = document.getElementById("qm-ranking-lista");
  contenedor.innerHTML = "";
  if (ranking.length === 0) {
    const vacio = document.createElement("p");
    vacio.textContent = "Ninguna pareja completó sus 8 rondas.";
    contenedor.appendChild(vacio);
  } else {
    ranking.forEach((pareja, indice) => {
      const item = document.createElement("p");
      item.className = "qm-ranking-item";
      item.textContent =
        `${indice + 1}. ${pareja.a} y ${pareja.b} — ` +
        `${pareja.coincidencias} de ${QM_RONDAS_PAREJA} coincidencias`;
      contenedor.appendChild(item);
    });
  }

  borrarGuardado(QM_CLAVE_GUARDADO);
  mostrarPantalla("qm-ranking");
}

// «Otra partida» desde qm-ranking: mismo grupo, niveles y tipos, nuevo
// sorteo de combinaciones.
function qmOtraPartidaParejas() {
  if (!qmIniciarMotorParejas()) {
    mostrarPantalla("qm-config");
    return;
  }
  qmEstado.parejas.ronda = 1;
  qmServirPreguntaPareja();
  mostrarPantalla("qm-pareja");
  qmRenderPareja();
  qmGuardar();
}

function qmGuardar() {
  guardarJSON(QM_CLAVE_GUARDADO, {
    nombres: qmEstado.nombres,
    niveles: qmEstado.niveles,
    tipos: qmEstado.tipos,
    modo: qmEstado.modo,
    indiceLector: qmEstado.indiceLector,
    contador: qmEstado.contador,
    parejas:
      qmEstado.modo === "parejas"
        ? {
            combinaciones: qmEstado.parejas.combinaciones,
            indiceCombinacion: qmEstado.parejas.indiceCombinacion,
            ronda: qmEstado.parejas.ronda,
            coincidencias: qmEstado.parejas.coincidencias,
            diferencias: qmEstado.parejas.diferencias,
            ranking: qmEstado.parejas.ranking,
          }
        : null,
  });
}

function qmEmpezarPartida() {
  const nombres = qmConfigJugadores.obtenerNombres();
  const validacion = validarNombres(nombres);
  const errorEl = document.getElementById("qm-error");
  if (!validacion.ok) {
    errorEl.textContent = validacion.mensaje;
    return;
  }
  errorEl.textContent = "";

  qmEstado.nombres = nombres;
  qmEstado.niveles = qmSelectorNiveles.obtenerNiveles();
  qmEstado.tipos = qmSelectorTipos.obtenerTipos();
  qmEstado.modo = qmSelectorModo.obtenerModo();

  if (qmEstado.modo === "parejas") {
    if (!qmIniciarMotorParejas()) return;
    qmEstado.parejas.ronda = 1;
    qmServirPreguntaPareja();
    mostrarPantalla("qm-pareja");
    qmRenderPareja();
    qmGuardar();
    return;
  }

  qmEstado.indiceLector = 0;
  qmEstado.contador.preguntas = 0;
  if (!qmIniciarMotor()) return;

  qmServirPregunta();
  mostrarPantalla("qm-juego");
  qmRender();
  qmGuardar();
}

function qmOtraPartida() {
  qmEstado.indiceLector = 0;
  qmEstado.contador.preguntas = 0;
  if (!qmIniciarMotor()) {
    mostrarPantalla("qm-config");
    return;
  }
  qmServirPregunta();
  mostrarPantalla("qm-juego");
  qmRender();
  qmGuardar();
}

function qmReanudar() {
  const guardado = cargarJSON(QM_CLAVE_GUARDADO);
  if (!guardado) return;

  qmEstado.nombres = guardado.nombres;
  qmEstado.niveles = guardado.niveles;
  qmEstado.tipos = guardado.tipos;
  qmEstado.modo = guardado.modo || "normal";

  if (qmEstado.modo === "parejas" && guardado.parejas) {
    const banco = qmFiltrarBanco(qmEstado.nombres.length);
    if (banco.length === 0) {
      document.getElementById("qm-error").textContent =
        "No hay preguntas para esta combinación de nivel y tipo.";
      mostrarPantalla("qm-config");
      return;
    }
    qmEstado.parejas.repartidor = crearRepartidor(banco);
    qmEstado.parejas.combinaciones = guardado.parejas.combinaciones;
    qmEstado.parejas.indiceCombinacion = guardado.parejas.indiceCombinacion;
    qmEstado.parejas.ronda = guardado.parejas.ronda;
    qmEstado.parejas.coincidencias = guardado.parejas.coincidencias;
    qmEstado.parejas.diferencias = guardado.parejas.diferencias;
    qmEstado.parejas.ranking = guardado.parejas.ranking;

    qmServirPreguntaPareja();
    mostrarPantalla("qm-pareja");
    qmRenderPareja();
    qmGuardar();
    return;
  }

  qmEstado.indiceLector = guardado.indiceLector;
  qmEstado.contador = guardado.contador;
  if (!qmIniciarMotor()) {
    mostrarPantalla("qm-config");
    return;
  }

  qmServirPregunta();
  mostrarPantalla("qm-juego");
  qmRender();
  qmGuardar();
}

function qmSiguiente() {
  qmEstado.indiceLector = (qmEstado.indiceLector + 1) % qmEstado.nombres.length;
  qmServirPregunta();
  qmRender();
  qmGuardar();
}

function qmTerminar() {
  document.getElementById("qm-resumen").textContent =
    `Habéis señalado ${qmEstado.contador.preguntas} veces. Se acabó la paz.`;
  borrarGuardado(QM_CLAVE_GUARDADO);
  mostrarPantalla("qm-fin");
}

document.addEventListener("DOMContentLoaded", () => {
  qmConfigJugadores = montarConfigJugadores({
    contenedorNombres: document.getElementById("qm-nombres"),
    stepper: document.getElementById("qm-stepper"),
    min: QM_MIN_JUGADORES,
    max: QM_MAX_JUGADORES,
    inicial: 5,
    alCambiar: () => (document.getElementById("qm-error").textContent = ""),
  });

  qmSelectorNiveles = montarSelectorNiveles(document.getElementById("qm-niveles"), () => {});
  qmSelectorTipos = qmMontarSelectorTipos(document.getElementById("qm-tipos"), () => {});
  qmSelectorModo = qmMontarSelectorModo(document.getElementById("qm-modo"), () => {});

  montarInterruptorModoFiesta(document.getElementById("qm-fiesta"), () => {});

  document.getElementById("btn-juego-qm").addEventListener("click", () => {
    document.getElementById("qm-btn-continuar").hidden = !hayGuardado(QM_CLAVE_GUARDADO);
    mostrarPantalla("qm-config");
  });

  document.getElementById("qm-btn-empezar").addEventListener("click", qmEmpezarPartida);
  document.getElementById("qm-btn-continuar").addEventListener("click", qmReanudar);
  document.getElementById("qm-btn-siguiente").addEventListener("click", qmSiguiente);
  document.getElementById("qm-btn-terminar").addEventListener("click", qmTerminar);
  document.getElementById("qm-btn-otra-partida").addEventListener("click", qmOtraPartida);
  document.getElementById("qm-btn-hub").addEventListener("click", () => mostrarPantalla("fiesta"));

  document.getElementById("qm-btn-coinciden").addEventListener("click", () => qmElegirResultado(true));
  document.getElementById("qm-btn-difieren").addEventListener("click", () => qmElegirResultado(false));
  document
    .getElementById("qm-btn-siguiente-pareja")
    .addEventListener("click", qmSiguienteRondaPareja);
  document.getElementById("qm-btn-terminar-parejas").addEventListener("click", qmMostrarRanking);
  document.getElementById("qm-btn-ranking-otra").addEventListener("click", qmOtraPartidaParejas);
  document.getElementById("qm-btn-ranking-hub").addEventListener("click", () => mostrarPantalla("fiesta"));
});
