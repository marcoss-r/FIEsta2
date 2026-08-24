// Dos mentiras y una verdad (dm) — md/PLAN_DOS_MENTIRAS.md. La app da el
// tema para que nadie se quede en blanco; contar, debatir, votar y revelar
// se resuelve entero hablando, la app no lleva esa cuenta.

const DM_MIN_JUGADORES = 3;
const DM_MAX_JUGADORES = 12;
const DM_MAX_CAMBIOS = 2; // "Otro tema" por turno
const DM_CLAVE_GUARDADO = "dm_partida";

// Todo el estado de la partida vive aquí.
const dmEstado = {
  nombres: [],
  niveles: [],
  indiceTurno: 0,
  temaActual: null,
  cambiosUsados: 0,
  contador: { turnos: 0, cambios: 0 },
  repartidor: null,
};

// Referencias a los componentes montados en dm-config: se crean una sola vez
// al cargar la página y se reutilizan en cada partida.
let dmConfigJugadores = null;
let dmSelectorNiveles = null;

// Filtra el banco por nivel y arma el repartidor. Sin plantillas que
// resolver: el tema es sobre uno mismo, nunca señala a otro jugador (§4.2).
function dmIniciarMotor() {
  const banco = filtrarPorNivel(DM_TEMAS, dmEstado.niveles);
  const errorEl = document.getElementById("dm-error");
  if (banco.length === 0) {
    errorEl.textContent = "No hay temas para esta configuración.";
    return false;
  }
  errorEl.textContent = "";
  dmEstado.repartidor = crearRepartidor(banco);
  return true;
}

function dmActualizarBotonOtroTema() {
  const boton = document.getElementById("dm-btn-otro-tema");
  const quedan = DM_MAX_CAMBIOS - dmEstado.cambiosUsados;
  const sufijo = quedan === 1 ? "cambio restante" : "cambios restantes";
  boton.textContent = `Otro tema (${quedan} ${sufijo})`;
  boton.disabled = quedan <= 0;
}

// Sirve un tema nuevo en la vista "pensar" (al entrar en el turno o al pulsar
// "Otro tema"). No toca cambiosUsados: eso lo deciden dmVerTema()/dmOtroTema().
function dmMostrarTema() {
  const { valor } = dmEstado.repartidor.siguiente();
  dmEstado.temaActual = valor;
  document.getElementById("dm-tema-texto").textContent = valor.texto;
  dmActualizarBotonOtroTema();
}

function dmVerTema() {
  dmEstado.cambiosUsados = 0;
  document.getElementById("dm-vista-pensar").hidden = false;
  document.getElementById("dm-vista-contar").hidden = true;
  dmMostrarTema();
  mostrarPantalla("dm-tema");
}

function dmOtroTema() {
  if (dmEstado.cambiosUsados >= DM_MAX_CAMBIOS) return; // el botón ya está deshabilitado, red de seguridad barata
  dmEstado.cambiosUsados++;
  dmEstado.contador.cambios++;
  dmMostrarTema();
}

function dmYaLoTengo() {
  const vistaContar = document.getElementById("dm-vista-contar");
  if (!vistaContar.hidden) return; // ya se pasó a "contar", no repetir

  const nombre = dmEstado.nombres[dmEstado.indiceTurno];
  document.getElementById("dm-tema-eco").textContent = dmEstado.temaActual.texto;
  document.getElementById("dm-instrucciones").textContent =
    `${nombre} cuenta sus tres frases. El grupo debate y vota a mano alzada. ` +
    `Después, ${nombre} revela cuál era la mentira.`;

  const castigoEl = document.getElementById("dm-castigo");
  if (modoFiestaActivo()) {
    castigoEl.hidden = false;
    castigoEl.textContent = `Quien falle: ${castigoAlAzar()} · Si no acierta nadie, bebe el grupo`;
  } else {
    castigoEl.hidden = true;
  }

  document.getElementById("dm-vista-pensar").hidden = true;
  vistaContar.hidden = false;
}

function dmRenderTurno() {
  const nombre = dmEstado.nombres[dmEstado.indiceTurno];
  document.getElementById("dm-nombre-turno").textContent = `Turno de ${nombre}`;
}

function dmGuardar() {
  guardarJSON(DM_CLAVE_GUARDADO, {
    nombres: dmEstado.nombres,
    niveles: dmEstado.niveles,
    indiceTurno: dmEstado.indiceTurno,
    contador: dmEstado.contador,
  });
}

function dmEmpezarPartida() {
  const nombres = dmConfigJugadores.obtenerNombres();
  const validacion = validarNombres(nombres);
  const errorEl = document.getElementById("dm-error");
  if (!validacion.ok) {
    errorEl.textContent = validacion.mensaje;
    return;
  }

  dmEstado.nombres = nombres;
  dmEstado.niveles = dmSelectorNiveles.obtenerNiveles();
  dmEstado.indiceTurno = 0;
  dmEstado.contador = { turnos: 0, cambios: 0 };
  if (!dmIniciarMotor()) return;

  mostrarPantalla("dm-turno");
  dmRenderTurno();
  dmGuardar();
}

// "Otra partida" NO empieza directamente: vuelve a dm-config con los mismos
// nombres ya cargados, para poder cambiar niveles si se quiere.
function dmOtraPartida() {
  dmConfigJugadores.fijarNombres(dmEstado.nombres);
  document.getElementById("dm-error").textContent = "";
  document.getElementById("dm-btn-continuar").hidden = true;
  mostrarPantalla("dm-config");
}

// Al reanudar SIEMPRE se vuelve al principio del turno en curso: nunca con un
// tema ya servido a medias (§4.2/§7 del plan).
function dmReanudar() {
  const guardado = cargarJSON(DM_CLAVE_GUARDADO);
  if (!guardado) return;

  dmEstado.nombres = guardado.nombres;
  dmEstado.niveles = guardado.niveles;
  dmEstado.indiceTurno = guardado.indiceTurno;
  dmEstado.contador = guardado.contador;
  if (!dmIniciarMotor()) {
    mostrarPantalla("dm-config");
    return;
  }

  mostrarPantalla("dm-turno");
  dmRenderTurno();
  dmGuardar();
}

function dmSiguienteJugador() {
  dmEstado.contador.turnos++;
  dmEstado.indiceTurno = (dmEstado.indiceTurno + 1) % dmEstado.nombres.length;
  mostrarPantalla("dm-turno");
  dmRenderTurno();
  dmGuardar();
}

function dmTerminar() {
  document.getElementById("dm-resumen").textContent =
    `${dmEstado.contador.turnos} rondas de mentiras. ` +
    `${dmEstado.contador.cambios} temas rechazados por difíciles.`;
  borrarGuardado(DM_CLAVE_GUARDADO);
  mostrarPantalla("dm-fin");
}

document.addEventListener("DOMContentLoaded", () => {
  dmConfigJugadores = montarConfigJugadores({
    contenedorNombres: document.getElementById("dm-nombres"),
    stepper: document.getElementById("dm-stepper"),
    min: DM_MIN_JUGADORES,
    max: DM_MAX_JUGADORES,
    inicial: 3,
    alCambiar: () => (document.getElementById("dm-error").textContent = ""),
  });

  dmSelectorNiveles = montarSelectorNiveles(document.getElementById("dm-niveles"), () => {});
  montarInterruptorModoFiesta(document.getElementById("dm-fiesta"), () => {});

  document.getElementById("btn-juego-dm").addEventListener("click", () => {
    document.getElementById("dm-btn-continuar").hidden = !hayGuardado(DM_CLAVE_GUARDADO);
    mostrarPantalla("dm-config");
  });

  document.getElementById("dm-btn-empezar").addEventListener("click", dmEmpezarPartida);
  document.getElementById("dm-btn-continuar").addEventListener("click", dmReanudar);
  document.getElementById("dm-btn-ver-tema").addEventListener("click", dmVerTema);
  document.getElementById("dm-btn-terminar").addEventListener("click", dmTerminar);
  document.getElementById("dm-btn-otro-tema").addEventListener("click", dmOtroTema);
  document.getElementById("dm-btn-listo").addEventListener("click", dmYaLoTengo);
  document.getElementById("dm-btn-siguiente").addEventListener("click", dmSiguienteJugador);
  document.getElementById("dm-btn-terminar-2").addEventListener("click", dmTerminar);
  document.getElementById("dm-btn-otra-partida").addEventListener("click", dmOtraPartida);
  document.getElementById("dm-btn-hub").addEventListener("click", () => mostrarPantalla("fiesta"));
});
