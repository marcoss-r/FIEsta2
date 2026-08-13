// Verdad o Reto (vr) — md/PLAN_VERDAD_O_RETO.md. En tu turno eliges Verdad o
// Reto y la app sirve una carta al azar. Sin puntos, sin ganador: se juega
// hasta que el grupo se cansa.

const VR_MIN_JUGADORES = 2;
const VR_MAX_JUGADORES = 12;
const VR_MAX_CAMBIOS = 2; // "Otra" por turno
const VR_CLAVE_GUARDADO = "vr_partida";

// Selector de modo, propio de este juego (selección ÚNICA, a diferencia de
// los chips de nivel del núcleo, que son multi-selección).
const VR_MODOS = [
  { id: "mixto", nombre: "Mixto" },
  { id: "verdades", nombre: "Solo verdades" },
  { id: "retos", nombre: "Solo retos" },
];

// Todo el estado de la partida vive aquí.
const vrEstado = {
  nombres: [],
  niveles: [],
  modo: "mixto",
  indiceTurno: 0,
  tipoActual: null,
  textoActual: "",
  cambiosUsados: 0,
  contador: { verdades: 0, retos: 0, pasos: 0, cambios: 0 },
  repartidorVerdades: null,
  repartidorRetos: null,
};

// Referencias a los componentes montados en vr-config: se crean una sola vez
// al cargar la página y se reutilizan en cada partida.
let vrConfigJugadores = null;
let vrSelectorNiveles = null;
let vrSelectorModo = null;

function vrMontarSelectorModo(contenedor, alCambiar) {
  let elegido = "mixto";

  function render() {
    contenedor.innerHTML = "";
    VR_MODOS.forEach((modo) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "vr-chip" + (modo.id === elegido ? " activo" : "");
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

// Si el modo es "mixto" pero uno de los dos bancos se ha quedado sin
// entradas tras filtrar, la partida se juega igual pero solo con el tipo que
// sí tiene contenido (§7 del plan del juego, "banco vacío tras filtrar").
function vrModoEfectivo() {
  if (vrEstado.modo !== "mixto") return vrEstado.modo;
  if (!vrEstado.repartidorVerdades) return "retos";
  if (!vrEstado.repartidorRetos) return "verdades";
  return "mixto";
}

// Filtra los dos bancos por nivel y descarta los textos cuyo {otro}/{otro2}
// no puede resolverse con los jugadores disponibles (quien tiene el turno
// nunca puede ser su propio {otro}). Devuelve false (y muestra el error
// bloqueante) solo si NINGÚN tipo necesario tiene contenido; si solo uno de
// los dos se queda vacío, avisa pero deja jugar con el otro.
function vrIniciarMotor() {
  const bancoVerdades = filtrarPorNivel(VR_VERDADES, vrEstado.niveles).filter(
    (v) => otrosNecesarios(v.texto) <= vrEstado.nombres.length - 1
  );
  const bancoRetos = filtrarPorNivel(VR_RETOS, vrEstado.niveles).filter(
    (r) => otrosNecesarios(r.texto) <= vrEstado.nombres.length - 1
  );

  const necesitaVerdades = vrEstado.modo !== "retos";
  const necesitaRetos = vrEstado.modo !== "verdades";
  const hayVerdades = !necesitaVerdades || bancoVerdades.length > 0;
  const hayRetos = !necesitaRetos || bancoRetos.length > 0;

  const errorEl = document.getElementById("vr-error");
  if (!hayVerdades && !hayRetos) {
    errorEl.textContent = "No hay verdades ni retos para esta configuración.";
    return false;
  }
  if (necesitaVerdades && bancoVerdades.length === 0) {
    errorEl.textContent = "No hay verdades para esta configuración: solo saldrán retos.";
  } else if (necesitaRetos && bancoRetos.length === 0) {
    errorEl.textContent = "No hay retos para esta configuración: solo saldrán verdades.";
  } else {
    errorEl.textContent = "";
  }

  vrEstado.repartidorVerdades =
    necesitaVerdades && bancoVerdades.length ? crearRepartidor(bancoVerdades) : null;
  vrEstado.repartidorRetos =
    necesitaRetos && bancoRetos.length ? crearRepartidor(bancoRetos) : null;
  return true;
}

// Coge la siguiente carta del repartidor correspondiente y resuelve sus
// plantillas. NO toca los contadores: "Otra" vuelve a llamar a esta función
// sin que cuente como una verdad o un reto "caídos" (eso solo pasa con
// "Hecho", ver vrHecho()).
function vrServirCarta(tipo) {
  const repartidor = tipo === "verdad" ? vrEstado.repartidorVerdades : vrEstado.repartidorRetos;
  const { valor, agotado } = repartidor.siguiente();
  vrEstado.tipoActual = tipo;

  const jugador = vrEstado.nombres[vrEstado.indiceTurno];
  const otros = vrEstado.nombres.filter((_, indice) => indice !== vrEstado.indiceTurno);
  vrEstado.textoActual = rellenarPlantilla(valor.texto, { jugador, otros });

  const anuncio = document.getElementById("vr-anuncio");
  anuncio.hidden = !agotado;
  if (agotado) {
    anuncio.textContent =
      tipo === "verdad"
        ? "Se han acabado las verdades con este filtro: volvemos a barajar."
        : "Se han acabado los retos con este filtro: volvemos a barajar.";
  }
}

// Pinta la cara de la carta y dispara el volteo 3D. El texto se escribe
// ANTES de añadir ".volteada", para que ya aparezca resuelto al girar.
function vrRenderCarta() {
  const carta = document.getElementById("vr-carta");
  const tipoEl = document.getElementById("vr-carta-tipo");
  const textoEl = document.getElementById("vr-carta-texto");

  tipoEl.textContent = vrEstado.tipoActual === "verdad" ? "VERDAD" : "RETO";
  tipoEl.className =
    "vr-carta-tipo " + (vrEstado.tipoActual === "verdad" ? "vr-tipo-verdad" : "vr-tipo-reto");
  textoEl.textContent = vrEstado.textoActual;

  carta.classList.remove("volteada");
  // Forzar un reflow: si no, quitar y volver a poner la clase en el mismo
  // tick no dispararía otra vez la transición al servir la siguiente carta.
  void carta.offsetWidth;
  carta.classList.add("volteada");
}

function vrActualizarBotonOtra() {
  const restantes = VR_MAX_CAMBIOS - vrEstado.cambiosUsados;
  const boton = document.getElementById("vr-btn-otra");
  boton.textContent = `Otra 🔄 · quedan ${restantes}`;
  boton.disabled = restantes <= 0;
}

// Deja la pantalla de la carta en su estado normal (botones Hecho/Paso/Otra
// visibles, sin castigo a la vista). Se llama siempre que empieza un turno
// nuevo, para no arrastrar el aviso de "Paso" del turno anterior.
function vrRestablecerBotonesCarta() {
  document.getElementById("vr-btn-hecho").hidden = false;
  document.getElementById("vr-btn-paso").hidden = false;
  document.getElementById("vr-btn-otra").hidden = false;
  document.getElementById("vr-btn-siguiente-paso").hidden = true;
  document.getElementById("vr-castigo").hidden = true;
}

function vrElegir(tipo) {
  // Los botones para el tipo sin repartidor están "hidden" (vrRenderTurno) y
  // un usuario real no puede tocarlos; esta comprobación es solo una red de
  // seguridad barata contra un estado de botones desincronizado.
  const repartidor = tipo === "verdad" ? vrEstado.repartidorVerdades : vrEstado.repartidorRetos;
  if (!repartidor) return;

  vrEstado.cambiosUsados = 0;
  vrServirCarta(tipo);
  vrRestablecerBotonesCarta();
  vrActualizarBotonOtra();
  mostrarPantalla("vr-carta");
  vrRenderCarta();
}

function vrRenderTurno() {
  const nombre = vrEstado.nombres[vrEstado.indiceTurno];
  document.getElementById("vr-nombre-turno").textContent = `Turno de ${nombre}`;
  const numeroTurno =
    vrEstado.contador.verdades + vrEstado.contador.retos + vrEstado.contador.pasos + 1;
  document.getElementById("vr-progreso").textContent = `Turno ${numeroTurno} · ${nombre}`;

  const modo = vrModoEfectivo();
  const btnVerdad = document.getElementById("vr-btn-verdad");
  const btnReto = document.getElementById("vr-btn-reto");
  const btnUnico = document.getElementById("vr-btn-unico");

  btnVerdad.hidden = modo !== "mixto";
  btnReto.hidden = modo !== "mixto";
  btnUnico.hidden = modo === "mixto";
  if (modo === "verdades") btnUnico.textContent = "Ver mi verdad";
  if (modo === "retos") btnUnico.textContent = "Ver mi reto";
}

function vrGuardar() {
  guardarJSON(VR_CLAVE_GUARDADO, {
    nombres: vrEstado.nombres,
    niveles: vrEstado.niveles,
    modo: vrEstado.modo,
    indiceTurno: vrEstado.indiceTurno,
    contador: vrEstado.contador,
  });
}

function vrEmpezarPartida() {
  const nombres = vrConfigJugadores.obtenerNombres();
  const validacion = validarNombres(nombres);
  const errorEl = document.getElementById("vr-error");
  if (!validacion.ok) {
    errorEl.textContent = validacion.mensaje;
    return;
  }
  errorEl.textContent = "";

  vrEstado.nombres = nombres;
  vrEstado.niveles = vrSelectorNiveles.obtenerNiveles();
  vrEstado.modo = vrSelectorModo.obtenerModo();
  vrEstado.indiceTurno = 0;
  vrEstado.contador = { verdades: 0, retos: 0, pasos: 0, cambios: 0 };
  if (!vrIniciarMotor()) return;

  mostrarPantalla("vr-turno");
  vrRenderTurno();
  vrGuardar();
}

// "Otra partida" NO empieza directamente: vuelve a vr-config con los mismos
// nombres ya cargados, para poder cambiar niveles/modo si el grupo quiere.
function vrOtraPartida() {
  vrConfigJugadores.fijarNombres(vrEstado.nombres);
  document.getElementById("vr-error").textContent = "";
  document.getElementById("vr-btn-continuar").hidden = true;
  mostrarPantalla("vr-config");
}

// Al reanudar SIEMPRE se vuelve al principio del turno en curso, nunca con
// una carta ya servida (los repartidores no se serializan, ver §3 del plan).
function vrReanudar() {
  const guardado = cargarJSON(VR_CLAVE_GUARDADO);
  if (!guardado) return;

  vrEstado.nombres = guardado.nombres;
  vrEstado.niveles = guardado.niveles;
  vrEstado.modo = guardado.modo;
  vrEstado.indiceTurno = guardado.indiceTurno;
  vrEstado.contador = guardado.contador;
  if (!vrIniciarMotor()) {
    mostrarPantalla("vr-config");
    return;
  }

  mostrarPantalla("vr-turno");
  vrRenderTurno();
  vrGuardar();
}

function vrSiguienteTurno() {
  vrEstado.indiceTurno = (vrEstado.indiceTurno + 1) % vrEstado.nombres.length;
  vrEstado.cambiosUsados = 0;
  vrEstado.tipoActual = null;
  mostrarPantalla("vr-turno");
  vrRenderTurno();
  vrGuardar();
}

function vrHecho() {
  if (vrEstado.tipoActual === "verdad") vrEstado.contador.verdades++;
  else vrEstado.contador.retos++;
  vrSiguienteTurno();
}

function vrPaso() {
  vrEstado.contador.pasos++;

  if (!modoFiestaActivo()) {
    vrSiguienteTurno();
    return;
  }

  // Con modo fiesta activo, el turno no pasa hasta pulsar "Siguiente": antes
  // se enseña el castigo, sustituyendo Hecho/Paso/Otra por un único botón.
  const castigoEl = document.getElementById("vr-castigo");
  castigoEl.hidden = false;
  castigoEl.textContent = `${vrEstado.nombres[vrEstado.indiceTurno]}: ${vrCastigoPasar()}`;
  document.getElementById("vr-btn-hecho").hidden = true;
  document.getElementById("vr-btn-paso").hidden = true;
  document.getElementById("vr-btn-otra").hidden = true;
  document.getElementById("vr-btn-siguiente-paso").hidden = false;
}

// Castigo de «Paso» y del segundo cambio de «Otra»: a diferencia de
// castigoAlAzar() del núcleo (que usa Quién es más…, con prendas y retos
// variados), aquí solo hay dos opciones posibles — pedido así por el
// usuario — y no se elige, se ofrece al azar con 50/50.
function vrCastigoPasar() {
  return Math.random() < 0.5
    ? `🍻 Bebe ${enteroAleatorio(2, 5)} tragos`
    : "🎽 Quítate una prenda";
}

function vrOtraCarta() {
  if (vrEstado.cambiosUsados >= VR_MAX_CAMBIOS) return; // el botón ya está deshabilitado; por si acaso
  vrEstado.cambiosUsados++;
  vrEstado.contador.cambios++;
  const esSegundoCambio = vrEstado.cambiosUsados === VR_MAX_CAMBIOS;

  vrServirCarta(vrEstado.tipoActual);
  vrRenderCarta();
  vrActualizarBotonOtra();

  const castigoEl = document.getElementById("vr-castigo");
  if (esSegundoCambio && modoFiestaActivo()) {
    castigoEl.hidden = false;
    castigoEl.textContent = `${vrEstado.nombres[vrEstado.indiceTurno]}: ${vrCastigoPasar()}`;
  } else {
    castigoEl.hidden = true;
  }
}

function vrTerminar() {
  document.getElementById("vr-resumen").textContent =
    `Han caído ${vrEstado.contador.verdades} verdades y ${vrEstado.contador.retos} retos. ` +
    `${vrEstado.contador.pasos} personas se han rajado.`;
  borrarGuardado(VR_CLAVE_GUARDADO);
  mostrarPantalla("vr-fin");
}

document.addEventListener("DOMContentLoaded", () => {
  vrConfigJugadores = montarConfigJugadores({
    contenedorNombres: document.getElementById("vr-nombres"),
    stepper: document.getElementById("vr-stepper"),
    min: VR_MIN_JUGADORES,
    max: VR_MAX_JUGADORES,
    inicial: 4,
    alCambiar: () => (document.getElementById("vr-error").textContent = ""),
  });

  vrSelectorNiveles = montarSelectorNiveles(document.getElementById("vr-niveles"), () => {});
  vrSelectorModo = vrMontarSelectorModo(document.getElementById("vr-modo"), () => {});

  montarInterruptorModoFiesta(document.getElementById("vr-fiesta"), () => {});

  document.getElementById("btn-juego-vr").addEventListener("click", () => {
    document.getElementById("vr-btn-continuar").hidden = !hayGuardado(VR_CLAVE_GUARDADO);
    mostrarPantalla("vr-config");
  });

  document.getElementById("vr-btn-empezar").addEventListener("click", vrEmpezarPartida);
  document.getElementById("vr-btn-continuar").addEventListener("click", vrReanudar);
  document.getElementById("vr-btn-verdad").addEventListener("click", () => vrElegir("verdad"));
  document.getElementById("vr-btn-reto").addEventListener("click", () => vrElegir("reto"));
  document.getElementById("vr-btn-unico").addEventListener("click", () =>
    vrElegir(vrModoEfectivo() === "retos" ? "reto" : "verdad")
  );
  document.getElementById("vr-btn-hecho").addEventListener("click", vrHecho);
  document.getElementById("vr-btn-paso").addEventListener("click", vrPaso);
  document.getElementById("vr-btn-otra").addEventListener("click", vrOtraCarta);
  document.getElementById("vr-btn-siguiente-paso").addEventListener("click", vrSiguienteTurno);
  document.getElementById("vr-btn-terminar").addEventListener("click", vrTerminar);
  document.getElementById("vr-btn-terminar-2").addEventListener("click", vrTerminar);
  document.getElementById("vr-btn-otra-partida").addEventListener("click", vrOtraPartida);
  document.getElementById("vr-btn-hub").addEventListener("click", () => mostrarPantalla("fiesta"));
});
