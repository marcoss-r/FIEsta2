// Núcleo: configuración de jugadores, común a los seis juegos (§7.3).
// Stepper (− N +) + lista de inputs de nombres. Al subir el número se añaden
// inputs vacíos (con "Jugador N" de partida); al bajar se recortan
// CONSERVANDO lo escrito, para no borrar por accidente algo ya tecleado.

function nombrePorDefecto(indice) {
  return `Jugador ${indice + 1}`;
}

function montarConfigJugadores({ contenedorNombres, stepper, min, max, inicial, alCambiar }) {
  const valorEl = stepper.querySelector(".stepper-valor");
  const btnMenos = stepper.querySelector('[data-accion="menos"]');
  const btnMas = stepper.querySelector('[data-accion="mas"]');

  let cantidad = Math.min(Math.max(inicial, min), max);
  let nombres = [];

  function obtenerNombres() {
    // Los inputs son la fuente de verdad: lo que se ve en pantalla es lo que hay.
    return Array.from(contenedorNombres.querySelectorAll("input")).map((input) =>
      input.value.trim()
    );
  }

  function crearCampo(indice) {
    const campo = document.createElement("div");
    campo.className = "campo";
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 20;
    input.value = nombres[indice] || nombrePorDefecto(indice);
    input.addEventListener("input", () => alCambiar(obtenerNombres()));
    campo.appendChild(input);
    return campo;
  }

  function renderNombres() {
    contenedorNombres.innerHTML = "";
    for (let i = 0; i < cantidad; i++) {
      contenedorNombres.appendChild(crearCampo(i));
    }
  }

  function actualizarStepper() {
    valorEl.textContent = cantidad;
    btnMenos.disabled = cantidad <= min;
    btnMas.disabled = cantidad >= max;
  }

  function fijarCantidad(nueva) {
    nombres = obtenerNombres(); // conserva lo escrito antes de re-renderizar
    cantidad = Math.min(Math.max(nueva, min), max);
    nombres.length = cantidad; // recorta o deja huecos vacíos al crecer
    actualizarStepper();
    renderNombres();
    alCambiar(obtenerNombres());
  }

  btnMenos.addEventListener("click", () => fijarCantidad(cantidad - 1));
  btnMas.addEventListener("click", () => fijarCantidad(cantidad + 1));

  actualizarStepper();
  renderNombres();
  alCambiar(obtenerNombres());

  return {
    obtenerNombres,
    // Restaura una configuración guardada (p. ej. "Continuar partida" o "Usar
    // la última configuración" de El Impostor).
    fijarNombres(nuevosNombres) {
      nombres = nuevosNombres.slice();
      cantidad = Math.min(Math.max(nombres.length, min), max);
      nombres.length = cantidad;
      actualizarStepper();
      renderNombres();
      alCambiar(obtenerNombres());
    },
  };
}

// Ningún nombre vacío ni repetido: dos "Ana" hacen ilegible cualquier turno.
// La comparación ignora mayúsculas para pillar duplicados reales ("Ana"/"ana").
function validarNombres(nombres) {
  if (nombres.some((nombre) => nombre.trim() === "")) {
    return { ok: false, mensaje: "Todos los jugadores necesitan un nombre." };
  }
  const normalizados = nombres.map((nombre) => nombre.trim().toLowerCase());
  if (new Set(normalizados).size !== normalizados.length) {
    return { ok: false, mensaje: "Hay nombres repetidos: dos jugadores no pueden llamarse igual." };
  }
  return { ok: true, mensaje: "" };
}
