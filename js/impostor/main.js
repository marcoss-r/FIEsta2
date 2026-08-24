// El Impostor (im) — md/PLAN_EL_IMPOSTOR.md. Todos reciben la misma palabra
// secreta menos el impostor, que solo recibe una pista; la app reparte en
// secreto, fija el orden, cuenta las rondas y revela. No guarda nada entre
// partidas: ni la configuración ni el reparto ni el progreso.

const IM_MIN_JUGADORES = 3;
const IM_MAX_JUGADORES = 12;
const IM_MIN_PARA_DOS_IMPOSTORES = 7;
const IM_RONDAS = 3; // fijo, sin stepper

// Todo el estado de la partida vive aquí.
const imEstado = {
  nombres: [],
  nImpostores: 1,
  nRondas: IM_RONDAS,

  entrada: null, // { palabra, pista, categoria, nivel } del banco
  impostores: [], // índices en nombres
  orden: [], // índices en nombres: el orden de palabras
  rondaActual: 1, // 1…nRondas
  posicionActual: 0, // índice dentro de orden
  acusado: null, // índice acusado

  repartidor: null,
};

// Referencias a los componentes montados en im-config: se crean una sola vez
// al cargar la página y se reutilizan en cada partida.
let imConfigJugadores = null;
let imStepperImpostores = null;

// Stepper genérico (− valor +), propio de este juego: a diferencia del de
// jugadores (montarConfigJugadores, que también lleva la lista de nombres),
// aquí solo hace falta un número con límites que pueden cambiar en caliente
// (el de impostores se reajusta según cuántos jugadores hay).
function imMontarStepper(stepper, { min, max, inicial, alCambiar }) {
  const valorEl = stepper.querySelector(".stepper-valor");
  const btnMenos = stepper.querySelector('[data-accion="menos"]');
  const btnMas = stepper.querySelector('[data-accion="mas"]');
  let limiteMin = min;
  let limiteMax = max;
  let valor = inicial;

  function render() {
    valorEl.textContent = valor;
    btnMenos.disabled = valor <= limiteMin;
    btnMas.disabled = valor >= limiteMax;
  }

  function fijar(nuevo) {
    valor = Math.min(Math.max(nuevo, limiteMin), limiteMax);
    render();
    alCambiar(valor);
  }

  btnMenos.addEventListener("click", () => fijar(valor - 1));
  btnMas.addEventListener("click", () => fijar(valor + 1));
  render();
  alCambiar(valor);

  return {
    obtener: () => valor,
    fijar,
    // Cambia los límites y reclama el valor actual contra ellos (§3 del plan:
    // bajar de 7 jugadores con 2 impostores puestos vuelve a 1 solo).
    fijarLimites(nuevoMin, nuevoMax) {
      limiteMin = nuevoMin;
      limiteMax = nuevoMax;
      fijar(valor);
    },
  };
}

// Con menos de 7 jugadores, el stepper de impostores se bloquea en 1.
function imActualizarLimiteImpostores(cantidadJugadores) {
  const maximoPermitido = cantidadJugadores >= IM_MIN_PARA_DOS_IMPOSTORES ? 2 : 1;
  imStepperImpostores.fijarLimites(1, maximoPermitido);
}

function imIniciarMotor() {
  imEstado.repartidor = crearRepartidor(IM_PALABRAS);
}

// El primero en hablar nunca es impostor (hablar primero sin información es
// una desventaja brutal). El mismo orden se repite en todas las rondas.
function imSortearOrden(nombres, impostores) {
  const inocentes = nombres.map((_, i) => i).filter((i) => !impostores.includes(i));
  const primero = elegirAlAzar(inocentes);
  const resto = barajar(nombres.map((_, i) => i).filter((i) => i !== primero));
  return [primero, ...resto];
}

// Palabra, impostores y orden nuevos: se llama al empezar la partida y en
// "Otra ronda".
function imPrepararRonda() {
  const { valor } = imEstado.repartidor.siguiente();
  imEstado.entrada = valor;
  const indices = imEstado.nombres.map((_, i) => i);
  imEstado.impostores = elegirN(indices, imEstado.nImpostores);
  imEstado.orden = imSortearOrden(imEstado.nombres, imEstado.impostores);
  imEstado.rondaActual = 1;
  imEstado.posicionActual = 0;
  imEstado.acusado = null;
}

// Nodo secreto de quien toca, creado EN EL MOMENTO de pulsar "Ver mi
// palabra" (protección anti-espionaje del handoff, §7.6 del núcleo): nunca
// HTML que ya estuviera en la página.
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

function imEntrarReparto() {
  mostrarPantalla("im-reparto");
  iniciarHandoff({
    contenedor: document.getElementById("im-handoff"),
    nombres: imEstado.nombres,
    contenidoDe: imContenidoDe,
    alTerminar: imEntrarRonda,
    textoVer: "Ver mi palabra",
  });
}

function imEntrarRonda() {
  mostrarPantalla("im-ronda");
  imRenderRonda();
}

function imRenderRonda() {
  document.getElementById("im-btn-siguiente").disabled = false;
  const indiceJugador = imEstado.orden[imEstado.posicionActual];
  document.getElementById("im-nombre-turno").textContent = imEstado.nombres[indiceJugador];
  const totalPalabras = imEstado.orden.length * imEstado.nRondas;
  const palabraActual = (imEstado.rondaActual - 1) * imEstado.orden.length + imEstado.posicionActual + 1;
  document.getElementById("im-progreso").textContent =
    `Ronda ${imEstado.rondaActual} de ${imEstado.nRondas} · palabra ${palabraActual} de ${totalPalabras}`;
}

// Deshabilita el botón al pulsar (casos borde del plan: un doble toque no
// debe saltarse el turno de nadie) hasta el siguiente render.
function imSiguientePalabra() {
  document.getElementById("im-btn-siguiente").disabled = true;
  imEstado.posicionActual++;
  if (imEstado.posicionActual >= imEstado.orden.length) {
    imEstado.posicionActual = 0;
    imEstado.rondaActual++;
  }
  if (imEstado.rondaActual > imEstado.nRondas) {
    imEntrarAcusacion();
    return;
  }
  imRenderRonda();
}

function imEntrarAcusacion() {
  imEstado.acusado = null;
  const contenedor = document.getElementById("im-lista-acusados");
  contenedor.innerHTML = "";
  imEstado.nombres.forEach((nombre, indice) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "im-nombre";
    boton.textContent = nombre;
    boton.addEventListener("click", () => imSeleccionarAcusado(indice, boton));
    contenedor.appendChild(boton);
  });
  document.getElementById("im-btn-confirmar").disabled = true;
  mostrarPantalla("im-acusacion");
}

// Selección única: tocar un nombre cambia la marca, nunca la acumula.
function imSeleccionarAcusado(indice, boton) {
  document
    .querySelectorAll("#im-lista-acusados .im-nombre")
    .forEach((b) => b.classList.remove("seleccionado"));
  boton.classList.add("seleccionado");
  imEstado.acusado = indice;
  document.getElementById("im-btn-confirmar").disabled = false;
}

function imConfirmarAcusacion() {
  if (imEstado.acusado === null) return; // el botón ya está deshabilitado, red de seguridad barata
  imRevelar();
}

function imRevelar() {
  const acierto = imEstado.impostores.includes(imEstado.acusado);
  const nombresImpostores = imEstado.impostores.map((i) => imEstado.nombres[i]);
  const escapados = imEstado.impostores
    .filter((i) => i !== imEstado.acusado)
    .map((i) => imEstado.nombres[i]);

  document.getElementById("im-veredicto").textContent = acierto
    ? "¡Acertasteis!"
    : "El impostor se ha salido con la suya";

  let textoQuien;
  if (nombresImpostores.length === 1) {
    textoQuien = `El impostor era ${nombresImpostores[0]}`;
  } else {
    textoQuien = `Los impostores eran ${nombresImpostores.join(" y ")}`;
    if (acierto && escapados.length > 0) {
      textoQuien += `, se os escapó ${escapados.join(" y ")}`;
    }
  }
  document.getElementById("im-quien").textContent = textoQuien;
  document.getElementById("im-palabra").textContent = `La palabra era ${imEstado.entrada.palabra}`;
  document.getElementById("im-pista").textContent = `La pista del impostor: ${imEstado.entrada.pista}`;

  const castigoEl = document.getElementById("im-castigo");
  if (modoFiestaActivo()) {
    castigoEl.hidden = false;
    if (acierto) {
      const acusadoNombre = imEstado.nombres[imEstado.acusado];
      castigoEl.textContent = `🍻 ${acusadoNombre}: un trago doble`;
    } else {
      castigoEl.textContent = `🍻 Todos menos ${nombresImpostores.join(" y ")}: un trago`;
    }
  } else {
    castigoEl.hidden = true;
  }

  mostrarPantalla("im-revelacion");
}

function imEmpezarPartida() {
  const nombres = imConfigJugadores.obtenerNombres();
  const validacion = validarNombres(nombres);
  const errorEl = document.getElementById("im-error");
  if (!validacion.ok) {
    errorEl.textContent = validacion.mensaje;
    return;
  }

  imEstado.nombres = nombres;
  imEstado.nImpostores = imStepperImpostores.obtener();
  imIniciarMotor();

  imPrepararRonda();
  imEntrarReparto();
}

// "Otra ronda": mismos jugadores y ajustes, palabra, impostores y orden
// nuevos. Vuelve a pasar por el reparto entero (§3 del plan).
function imOtraRonda() {
  imPrepararRonda();
  imEntrarReparto();
}

function imTerminar() {
  mostrarPantalla("fiesta");
}

document.addEventListener("DOMContentLoaded", () => {
  // El stepper de impostores se monta ANTES que el de jugadores: este último
  // dispara alCambiar en el momento de montarse, y ese callback ya necesita
  // imStepperImpostores para ajustar su límite.
  imStepperImpostores = imMontarStepper(document.getElementById("im-stepper-impostores"), {
    min: 1,
    max: 1,
    inicial: 1,
    alCambiar: () => {},
  });

  imConfigJugadores = montarConfigJugadores({
    contenedorNombres: document.getElementById("im-nombres"),
    stepper: document.getElementById("im-stepper"),
    min: IM_MIN_JUGADORES,
    max: IM_MAX_JUGADORES,
    inicial: 3,
    alCambiar: (nombres) => {
      document.getElementById("im-error").textContent = "";
      imActualizarLimiteImpostores(nombres.length);
    },
  });

  montarInterruptorModoFiesta(document.getElementById("im-fiesta"), () => {});

  document.getElementById("btn-juego-im").addEventListener("click", () => {
    mostrarPantalla("im-config");
  });

  document.getElementById("im-btn-empezar").addEventListener("click", imEmpezarPartida);
  document.getElementById("im-btn-siguiente").addEventListener("click", imSiguientePalabra);
  document.getElementById("im-btn-terminar").addEventListener("click", imTerminar);
  document.getElementById("im-btn-confirmar").addEventListener("click", imConfirmarAcusacion);
  document.getElementById("im-btn-otra-ronda").addEventListener("click", imOtraRonda);
  document.getElementById("im-btn-hub").addEventListener("click", imTerminar);
});
