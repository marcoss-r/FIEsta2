// Preguntas incómodas (pi) — md/PLAN_PREGUNTAS_INCOMODAS.md. La app elige a
// quién se le pregunta y qué se le pregunta; el jugador anterior la lee en
// voz alta. Responde, se la salta o (con modo fiesta) la devuelve.

const PI_MIN_JUGADORES = 2;
const PI_MAX_JUGADORES = 12;
const PI_DEVOLUCIONES_POR_JUGADOR = 1;
const PI_CLAVE_GUARDADO = "pi_partida";

// Todo el estado de la partida vive aquí.
const piEstado = {
  nombres: [],
  niveles: [],
  indiceDestinatario: 0,
  indiceLector: 0,
  preguntaActual: null,
  textoResuelto: "",
  devuelta: false,
  devolucionesRestantes: [],
  contador: { respondidas: 0, saltadas: 0, devueltas: 0 },
  repartidor: null,
};

// Referencias a los componentes montados en pi-config: se crean una sola vez
// al cargar la página y se reutilizan en cada partida.
let piConfigJugadores = null;
let piSelectorNiveles = null;

// Filtra por nivel (núcleo) y descarta las `cruzada` cuyo {otro} no puede
// resolverse con los jugadores disponibles (el destinatario nunca puede ser
// su propio {otro}); `dirigida` y `grupo` no usan plantillas y pasan siempre.
function piFiltrarBanco() {
  return filtrarPorNivel(PI_PREGUNTAS, piEstado.niveles).filter(
    (p) => otrosNecesarios(p.texto) <= piEstado.nombres.length - 1
  );
}

// Prepara el repartidor con el banco ya filtrado. Devuelve false (y muestra
// el error) si la combinación de nivel deja el banco vacío.
function piIniciarMotor() {
  const banco = piFiltrarBanco();
  if (banco.length === 0) {
    document.getElementById("pi-error").textContent = "No hay preguntas para esta configuración.";
    return false;
  }
  piEstado.repartidor = crearRepartidor(banco);
  return true;
}

// Resuelve {otro} de la pregunta actual excluyendo siempre al destinatario
// actual. Se llama al servir una pregunta nueva y, en las `cruzada`, otra vez
// tras un «Devolver» (para que nunca acabe hablando del nuevo destinatario).
function piResolverTexto() {
  const destinatario = piEstado.nombres[piEstado.indiceDestinatario];
  const otros = piEstado.nombres.filter((_, indice) => indice !== piEstado.indiceDestinatario);
  piEstado.textoResuelto = rellenarPlantilla(piEstado.preguntaActual.texto, {
    jugador: destinatario,
    otros,
  });
}

// Coge la siguiente pregunta del repartidor y recalcula quién lee (el
// jugador anterior al destinatario en la rotación). `indiceLector` no se
// guarda: se recalcula siempre a partir de `indiceDestinatario`.
function piServirPregunta() {
  const { valor, agotado } = piEstado.repartidor.siguiente();
  piEstado.preguntaActual = valor;
  piEstado.devuelta = false;
  piEstado.indiceLector =
    (piEstado.indiceDestinatario - 1 + piEstado.nombres.length) % piEstado.nombres.length;
  piResolverTexto();

  const anuncio = document.getElementById("pi-anuncio");
  anuncio.hidden = !agotado;
  if (agotado) {
    anuncio.textContent = "Se han acabado las preguntas con este filtro: volvemos a barajar.";
  }
}

// Visibilidad de «Devolver»: las cuatro reglas del plan (§4.1) deben
// cumplirse todas a la vez o el botón no se pinta.
function piActualizarBotonDevolver() {
  const boton = document.getElementById("pi-btn-devolver");
  const puede =
    modoFiestaActivo() &&
    piEstado.devolucionesRestantes[piEstado.indiceDestinatario] > 0 &&
    piEstado.preguntaActual.tipo !== "grupo" &&
    !piEstado.devuelta;
  boton.hidden = !puede;
  if (puede) {
    boton.textContent = `Devolver ↩ · te queda ${piEstado.devolucionesRestantes[piEstado.indiceDestinatario]}`;
  }
}

function piRender() {
  document.getElementById("pi-lector").textContent = `Lee ${piEstado.nombres[piEstado.indiceLector]}`;

  const destinatario = piEstado.nombres[piEstado.indiceDestinatario];
  const destinatarioEl = document.getElementById("pi-destinatario");
  const notaEl = document.getElementById("pi-nota");

  if (piEstado.preguntaActual.tipo === "grupo") {
    destinatarioEl.textContent = "Para todos";
    notaEl.textContent = `empieza ${destinatario}`;
    notaEl.hidden = false;
  } else {
    destinatarioEl.textContent = `${destinatario},`;
    notaEl.hidden = true;
  }
  document.getElementById("pi-pregunta").textContent = piEstado.textoResuelto;

  // Vuelve al estado normal de botones: por si veníamos de un "Se lo salta"
  // con castigo (que los ocultaba) del turno anterior.
  document.getElementById("pi-btn-respondio").hidden = false;
  document.getElementById("pi-btn-salta").hidden = false;
  document.getElementById("pi-btn-siguiente-salta").hidden = true;
  document.getElementById("pi-castigo").hidden = true;
  piActualizarBotonDevolver();
}

function piGuardar() {
  guardarJSON(PI_CLAVE_GUARDADO, {
    nombres: piEstado.nombres,
    niveles: piEstado.niveles,
    indiceDestinatario: piEstado.indiceDestinatario,
    devolucionesRestantes: piEstado.devolucionesRestantes,
    contador: piEstado.contador,
  });
}

function piEmpezarPartida() {
  const nombres = piConfigJugadores.obtenerNombres();
  const validacion = validarNombres(nombres);
  const errorEl = document.getElementById("pi-error");
  if (!validacion.ok) {
    errorEl.textContent = validacion.mensaje;
    return;
  }
  errorEl.textContent = "";

  piEstado.nombres = nombres;
  piEstado.niveles = piSelectorNiveles.obtenerNiveles();
  piEstado.indiceDestinatario = 0;
  piEstado.devolucionesRestantes = nombres.map(() => PI_DEVOLUCIONES_POR_JUGADOR);
  piEstado.contador = { respondidas: 0, saltadas: 0, devueltas: 0 };
  if (!piIniciarMotor()) return;

  piServirPregunta();
  mostrarPantalla("pi-juego");
  piRender();
  piGuardar();
}

// "Otra partida" reutiliza jugadores, niveles y modo fiesta ya configurados;
// las devoluciones se reinician a una por jugador, como al empezar.
function piOtraPartida() {
  piEstado.indiceDestinatario = 0;
  piEstado.devolucionesRestantes = piEstado.nombres.map(() => PI_DEVOLUCIONES_POR_JUGADOR);
  piEstado.contador = { respondidas: 0, saltadas: 0, devueltas: 0 };
  if (!piIniciarMotor()) {
    mostrarPantalla("pi-config");
    return;
  }
  piServirPregunta();
  mostrarPantalla("pi-juego");
  piRender();
  piGuardar();
}

// Al reanudar siempre se vuelve al principio de una pregunta nueva para el
// destinatario guardado (el repartidor no se serializa, mismo criterio que
// el resto de juegos); las devoluciones restantes sí se restauran tal cual.
function piReanudar() {
  const guardado = cargarJSON(PI_CLAVE_GUARDADO);
  if (!guardado) return;

  piEstado.nombres = guardado.nombres;
  piEstado.niveles = guardado.niveles;
  piEstado.indiceDestinatario = guardado.indiceDestinatario;
  piEstado.devolucionesRestantes = guardado.devolucionesRestantes;
  piEstado.contador = guardado.contador;
  if (!piIniciarMotor()) {
    mostrarPantalla("pi-config");
    return;
  }

  piServirPregunta();
  mostrarPantalla("pi-juego");
  piRender();
  piGuardar();
}

function piSiguienteDestinatario() {
  piEstado.indiceDestinatario = (piEstado.indiceDestinatario + 1) % piEstado.nombres.length;
  piServirPregunta();
  piRender();
  piGuardar();
}

function piRespondio() {
  piEstado.contador.respondidas++;
  piSiguienteDestinatario();
}

function piSalta() {
  piEstado.contador.saltadas++;

  if (!modoFiestaActivo()) {
    piSiguienteDestinatario();
    return;
  }

  // Con modo fiesta activo, el turno no pasa hasta pulsar "Siguiente": antes
  // se enseña el castigo, sustituyendo los tres botones por uno solo.
  const castigoEl = document.getElementById("pi-castigo");
  castigoEl.hidden = false;
  castigoEl.textContent = `🍻 ${piEstado.nombres[piEstado.indiceDestinatario]}: ${castigoAlAzar()}`;
  document.getElementById("pi-btn-respondio").hidden = true;
  document.getElementById("pi-btn-salta").hidden = true;
  document.getElementById("pi-btn-devolver").hidden = true;
  document.getElementById("pi-btn-siguiente-salta").hidden = false;
}

// Descuenta la devolución del destinatario, intercambia destinatario y
// lector (quien leía pasa a responder) y, si la pregunta es `cruzada`,
// vuelve a resolver el {otro} para que nunca acabe hablando del nuevo
// destinatario. La pregunta en sí no cambia: solo quién debe responderla.
function piDevolver() {
  const destinatarioAnterior = piEstado.nombres[piEstado.indiceDestinatario];
  piEstado.devolucionesRestantes[piEstado.indiceDestinatario]--;
  piEstado.devuelta = true;
  piEstado.contador.devueltas++;

  piEstado.indiceDestinatario = piEstado.indiceLector;
  piEstado.indiceLector =
    (piEstado.indiceDestinatario - 1 + piEstado.nombres.length) % piEstado.nombres.length;

  if (piEstado.preguntaActual.tipo === "cruzada") {
    piResolverTexto();
  }

  piRender();
  const anuncioEl = document.getElementById("pi-anuncio");
  anuncioEl.hidden = false;
  anuncioEl.textContent = `↩ ${destinatarioAnterior} te la devuelve, ${piEstado.nombres[piEstado.indiceDestinatario]}`;
  piGuardar();
}

function piTerminar() {
  document.getElementById("pi-resumen").textContent =
    `${piEstado.contador.respondidas} preguntas respondidas, ${piEstado.contador.saltadas} esquivadas ` +
    `y ${piEstado.contador.devueltas} devueltas.`;
  borrarGuardado(PI_CLAVE_GUARDADO);
  mostrarPantalla("pi-fin");
}

document.addEventListener("DOMContentLoaded", () => {
  piConfigJugadores = montarConfigJugadores({
    contenedorNombres: document.getElementById("pi-nombres"),
    stepper: document.getElementById("pi-stepper"),
    min: PI_MIN_JUGADORES,
    max: PI_MAX_JUGADORES,
    inicial: 4,
    alCambiar: () => (document.getElementById("pi-error").textContent = ""),
  });

  piSelectorNiveles = montarSelectorNiveles(document.getElementById("pi-niveles"), () => {});

  montarInterruptorModoFiesta(document.getElementById("pi-fiesta"), () => {});

  document.getElementById("btn-juego-pi").addEventListener("click", () => {
    document.getElementById("pi-btn-continuar").hidden = !hayGuardado(PI_CLAVE_GUARDADO);
    mostrarPantalla("pi-config");
  });

  document.getElementById("pi-btn-empezar").addEventListener("click", piEmpezarPartida);
  document.getElementById("pi-btn-continuar").addEventListener("click", piReanudar);
  document.getElementById("pi-btn-respondio").addEventListener("click", piRespondio);
  document.getElementById("pi-btn-salta").addEventListener("click", piSalta);
  document.getElementById("pi-btn-devolver").addEventListener("click", piDevolver);
  document
    .getElementById("pi-btn-siguiente-salta")
    .addEventListener("click", piSiguienteDestinatario);
  document.getElementById("pi-btn-terminar").addEventListener("click", piTerminar);
  document.getElementById("pi-btn-otra-partida").addEventListener("click", piOtraPartida);
  document.getElementById("pi-btn-hub").addEventListener("click", () => mostrarPantalla("fiesta"));
});
