// Yo nunca (yn) — md/PLAN_YO_NUNCA.md. El juego más simple de los seis: sirve
// frases sin repetir y rota quién lee. La app NO cuenta dedos ni tragos.

const YN_MIN_JUGADORES = 2;
const YN_MAX_JUGADORES = 12;
const YN_CLAVE_GUARDADO = "yn_partida";

// Todo el estado de la partida vive aquí.
const ynEstado = {
  nombres: [],
  niveles: [],
  indiceLector: 0,
  fraseActual: null,
  contador: { frases: 0 },
  repartidor: null,
};

// Referencias a los componentes del núcleo montados en yn-config: se crean
// una sola vez al cargar la página y se reutilizan en cada partida.
let ynConfigJugadores = null;
let ynSelectorNiveles = null;

// Misma frase para #yn-regla (config) y #yn-instruccion (juego): así nunca
// pueden divergir (§4.3 del plan del juego). Acepta el estado del modo fiesta
// ya conocido (p. ej. el del propio evento del interruptor) para no depender
// de releer localStorage, que puede estar bloqueado (incógnito).
// El texto es neutro en tiempo verbal ("si es tu caso" y no "quien lo haya
// hecho"): el banco mezcla frases de cosas ya hechas ("he mentido...") con
// hipotéticas ("probaría...") y la instrucción tiene que valer para ambas.
function ynTextoInstruccion(fiestaActiva) {
  const activo = fiestaActiva !== undefined ? fiestaActiva : modoFiestaActivo();
  return activo
    ? "Si es tu caso, bebe."
    : "Si es tu caso, baja un dedo (empezáis con 5 cada uno).";
}

function ynActualizarRegla(fiestaActiva) {
  document.getElementById("yn-regla").textContent = ynTextoInstruccion(fiestaActiva);
}

// Filtra el banco por los niveles elegidos y prepara el repartidor. Devuelve
// false (y muestra el error) si el filtro deja el banco vacío.
function ynIniciarMotor() {
  const banco = filtrarPorNivel(YN_FRASES, ynEstado.niveles);
  if (banco.length === 0) {
    document.getElementById("yn-error").textContent =
      "No hay frases para esta configuración.";
    return false;
  }
  ynEstado.repartidor = crearRepartidor(banco);
  return true;
}

function ynServirFrase() {
  const { valor, agotado } = ynEstado.repartidor.siguiente();
  ynEstado.fraseActual = valor;
  ynEstado.contador.frases++;
  const anuncio = document.getElementById("yn-anuncio");
  anuncio.hidden = !agotado;
  if (agotado) {
    anuncio.textContent = "Se han acabado las frases con este filtro: volvemos a barajar.";
  }
}

function ynRender() {
  document.getElementById("yn-lector").textContent =
    `Lee ${ynEstado.nombres[ynEstado.indiceLector]}`;
  document.getElementById("yn-frase").textContent = ynEstado.fraseActual.texto;
  document.getElementById("yn-instruccion").textContent = ynTextoInstruccion();
  document.getElementById("yn-progreso").textContent = `Frase ${ynEstado.contador.frases}`;
}

function ynGuardar() {
  guardarJSON(YN_CLAVE_GUARDADO, {
    nombres: ynEstado.nombres,
    niveles: ynEstado.niveles,
    indiceLector: ynEstado.indiceLector,
    contador: ynEstado.contador,
  });
}

function ynEmpezarPartida() {
  const nombres = ynConfigJugadores.obtenerNombres();
  const validacion = validarNombres(nombres);
  const errorEl = document.getElementById("yn-error");
  if (!validacion.ok) {
    errorEl.textContent = validacion.mensaje;
    return;
  }
  errorEl.textContent = "";

  ynEstado.nombres = nombres;
  ynEstado.niveles = ynSelectorNiveles.obtenerNiveles();
  ynEstado.indiceLector = 0;
  ynEstado.contador.frases = 0;
  if (!ynIniciarMotor()) return;

  ynServirFrase();
  mostrarPantalla("yn-juego");
  ynRender();
  ynGuardar();
}

function ynOtraPartida() {
  ynEstado.indiceLector = 0;
  ynEstado.contador.frases = 0;
  if (!ynIniciarMotor()) {
    mostrarPantalla("yn-config");
    return;
  }
  ynServirFrase();
  mostrarPantalla("yn-juego");
  ynRender();
  ynGuardar();
}

function ynReanudar() {
  const guardado = cargarJSON(YN_CLAVE_GUARDADO);
  if (!guardado) return;

  ynEstado.nombres = guardado.nombres;
  ynEstado.niveles = guardado.niveles;
  ynEstado.indiceLector = guardado.indiceLector;
  ynEstado.contador = guardado.contador;
  if (!ynIniciarMotor()) {
    mostrarPantalla("yn-config");
    return;
  }

  ynServirFrase();
  mostrarPantalla("yn-juego");
  ynRender();
  ynGuardar();
}

function ynSiguiente() {
  ynEstado.indiceLector = (ynEstado.indiceLector + 1) % ynEstado.nombres.length;
  ynServirFrase();
  ynRender();
  ynGuardar();
}

function ynTerminar() {
  document.getElementById("yn-resumen").textContent =
    `Habéis pasado por ${ynEstado.contador.frases} confesiones. Contad los dedos que os quedan.`;
  borrarGuardado(YN_CLAVE_GUARDADO);
  mostrarPantalla("yn-fin");
}

document.addEventListener("DOMContentLoaded", () => {
  ynConfigJugadores = montarConfigJugadores({
    contenedorNombres: document.getElementById("yn-nombres"),
    stepper: document.getElementById("yn-stepper"),
    min: YN_MIN_JUGADORES,
    max: YN_MAX_JUGADORES,
    inicial: 5,
    alCambiar: () => (document.getElementById("yn-error").textContent = ""),
  });

  ynSelectorNiveles = montarSelectorNiveles(document.getElementById("yn-niveles"), () => {});

  montarInterruptorModoFiesta(document.getElementById("yn-fiesta"), ynActualizarRegla);
  ynActualizarRegla();

  document.getElementById("btn-juego-yn").addEventListener("click", () => {
    document.getElementById("yn-btn-continuar").hidden = !hayGuardado(YN_CLAVE_GUARDADO);
    mostrarPantalla("yn-config");
  });

  document.getElementById("yn-btn-empezar").addEventListener("click", ynEmpezarPartida);
  document.getElementById("yn-btn-continuar").addEventListener("click", ynReanudar);
  document.getElementById("yn-btn-siguiente").addEventListener("click", ynSiguiente);
  document.getElementById("yn-btn-terminar").addEventListener("click", ynTerminar);
  document.getElementById("yn-btn-otra-partida").addEventListener("click", ynOtraPartida);
  document.getElementById("yn-btn-hub").addEventListener("click", () => mostrarPantalla("fiesta"));
});
