// Quién es más… (qm) — md/PLAN_QUIEN_ES_MAS.md. Lanza una pregunta sobre el
// grupo; todos señalan a la vez. La app NO cuenta votos ni lleva marcador.

const QM_MIN_JUGADORES = 2;
const QM_MAX_JUGADORES = 12;
const QM_CLAVE_GUARDADO = "qm_partida";

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
  indiceLector: 0,
  preguntaActual: null,
  textoResuelto: "",
  castigoActual: "",
  contador: { preguntas: 0 },
  repartidor: null,
};

// Referencias a los componentes montados en qm-config: se crean una sola vez
// al cargar la página y se reutilizan en cada partida.
let qmConfigJugadores = null;
let qmSelectorNiveles = null;
let qmSelectorTipos = null;

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

// Filtra por nivel (núcleo) y por tipo (chips propios), y descarta las
// preguntas cuyo {otro}/{otro2} no puede resolverse con los jugadores
// disponibles (el lector nunca puede ser su propio {otro}).
function qmFiltrarBanco() {
  const porNivel = filtrarPorNivel(QM_PREGUNTAS, qmEstado.niveles);
  const porTipo = porNivel.filter((pregunta) => qmEstado.tipos.includes(pregunta.tipo));
  return porTipo.filter(
    (pregunta) => otrosNecesarios(pregunta.texto) <= qmEstado.nombres.length - 1
  );
}

// Prepara el repartidor con el banco ya filtrado. Devuelve false (y muestra
// el error) si la combinación de nivel y tipo deja el banco vacío.
function qmIniciarMotor() {
  const banco = qmFiltrarBanco();
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

  // El castigo es propio de cada pregunta: con modo fiesta activo cambia en
  // cada "Siguiente", no es fijo durante toda la partida.
  qmEstado.castigoActual = modoFiestaActivo() ? castigoAlAzar() : "";

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

  const castigoEl = document.getElementById("qm-castigo");
  castigoEl.hidden = !qmEstado.castigoActual;
  if (qmEstado.castigoActual) {
    castigoEl.textContent = `🍻 El más señalado: ${qmEstado.castigoActual}`;
  }
}

function qmGuardar() {
  guardarJSON(QM_CLAVE_GUARDADO, {
    nombres: qmEstado.nombres,
    niveles: qmEstado.niveles,
    tipos: qmEstado.tipos,
    indiceLector: qmEstado.indiceLector,
    contador: qmEstado.contador,
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
});
