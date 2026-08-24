// Verdad o Reto (vr) — md/PLAN_VERDAD_O_RETO.md. En tu turno eliges Verdad o
// Reto y la app sirve una carta al azar. Sin puntos, sin ganador: se juega
// hasta que el grupo se cansa.

const VR_MIN_JUGADORES = 2;
const VR_MAX_JUGADORES = 12;
const VR_CLAVE_GUARDADO = "vr_partida";

// Niveles propios de este juego (a diferencia de la mayoría de juegos, que
// usan los tres niveles del núcleo): solo dos, porque aquí "picante" agrupa
// todo lo relacionado con drogas, alcohol, adicciones, cosas ilegales,
// relaciones amorosas, relaciones sexuales y retos con connotación sexual
// (besos, quitar prendas...); "normal" es el resto. Mismo patrón de chips
// multi-selección con mínimo uno activo que el selector del núcleo, pero con
// su propio namespace porque el conjunto de niveles no es el estándar.
const VR_NIVELES = [
  { id: "normal", nombre: "Normal" },
  { id: "picante", nombre: "Picante" },
];
const VR_NIVELES_POR_DEFECTO = ["normal"];

// Todo el estado de la partida vive aquí.
const vrEstado = {
  nombres: [],
  niveles: [],
  arcade: false,
  indiceTurno: 0,
  tipoActual: null,
  textoActual: "",
  contador: { verdades: 0, retos: 0, pasos: 0, cambios: 0 },
  repartidorVerdades: null,
  repartidorRetos: null,
  // Solo con el arcade encendido (md/PLAN_MODO_ARCADE.md): qué ha decidido la
  // ruleta este turno y, si ha caído "doble verdad", por cuál de las dos vamos.
  resultadoRuleta: null,
  dobleVerdad: null,
};

// Referencias a los componentes montados en vr-config: se crean una sola vez
// al cargar la página y se reutilizan en cada partida.
let vrConfigJugadores = null;
let vrSelectorNiveles = null;
let vrInterruptorArcade = null;

// Chips de nivel propios de vr (§7.4 del núcleo, pero con VR_NIVELES en vez
// de los tres niveles estándar): al activar "picante" por primera vez se
// avisa del tono, igual que hace el núcleo al activar "Salseo".
function vrMontarSelectorNiveles(contenedor, alCambiar) {
  let elegidos = VR_NIVELES_POR_DEFECTO.slice();

  function render() {
    contenedor.innerHTML = "";
    VR_NIVELES.forEach((nivel) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "vr-chip" + (elegidos.includes(nivel.id) ? " activo" : "");
      chip.dataset.nivel = nivel.id;
      chip.textContent = nivel.nombre;
      chip.addEventListener("click", () => alternar(nivel.id));
      contenedor.appendChild(chip);
    });
  }

  function alternar(id) {
    if (elegidos.includes(id)) {
      if (elegidos.length === 1) return; // mínimo uno activo
      elegidos = elegidos.filter((n) => n !== id);
    } else {
      elegidos = elegidos.concat(id);
      if (id === "picante") mostrarAvisoTonoSiPrimeraVez();
    }
    render();
    alCambiar(elegidos.slice());
  }

  render();
  alCambiar(elegidos.slice());

  return { obtenerNiveles: () => elegidos.slice() };
}

// Interruptor propio del juego, con la misma pinta que el del modo fiesta pero
// SIN persistencia global: el arcade se elige en cada partida y viaja dentro de
// "vr_partida", no en una clave suelta de localStorage.
function vrMontarInterruptorArcade(contenedor) {
  contenedor.innerHTML = "";
  const label = document.createElement("label");
  label.className = "switch";
  const input = document.createElement("input");
  input.type = "checkbox";
  const pista = document.createElement("span");
  pista.className = "switch-pista";
  label.append(input, pista);
  contenedor.appendChild(label);

  return {
    activo: () => input.checked,
    fijar(valor) {
      input.checked = !!valor;
    },
  };
}

// Filtra los dos bancos por nivel y descarta los textos cuyo {otro}/{otro2}
// no puede resolverse con los jugadores disponibles (quien tiene el turno
// nunca puede ser su propio {otro}). Devuelve false (y muestra el error
// bloqueante) solo si los DOS bancos se quedan vacíos; si solo uno se queda
// vacío, avisa pero deja jugar con el otro (§7, "banco vacío tras filtrar").
function vrIniciarMotor() {
  const bancoVerdades = filtrarPorNivel(VR_VERDADES, vrEstado.niveles).filter(
    (v) => otrosNecesarios(v.texto) <= vrEstado.nombres.length - 1
  );
  const bancoRetos = filtrarPorNivel(VR_RETOS, vrEstado.niveles).filter(
    (r) => otrosNecesarios(r.texto) <= vrEstado.nombres.length - 1
  );

  const errorEl = document.getElementById("vr-error");
  if (!bancoVerdades.length && !bancoRetos.length) {
    errorEl.textContent = "No hay verdades ni retos para esta configuración.";
    return false;
  }
  if (!bancoVerdades.length) {
    errorEl.textContent = "No hay verdades para esta configuración: solo saldrán retos.";
  } else if (!bancoRetos.length) {
    // Sin retos no hay ruleta: el arcade se queda inerte esa partida.
    errorEl.textContent = "No hay retos para esta configuración: solo saldrán verdades.";
  } else {
    errorEl.textContent = "";
  }

  vrEstado.repartidorVerdades = bancoVerdades.length ? crearRepartidor(bancoVerdades) : null;
  vrEstado.repartidorRetos = bancoRetos.length ? crearRepartidor(bancoRetos) : null;
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

  // En "doble verdad" (ruleta del modo arcade) la cabecera dice por cuál de
  // las dos preguntas va, que si no parece que la app se haya repetido.
  const contador = vrEstado.dobleVerdad ? ` · ${vrEstado.dobleVerdad.indice} de 2` : "";
  tipoEl.textContent = (vrEstado.tipoActual === "verdad" ? "VERDAD" : "RETO") + contador;
  tipoEl.className =
    "vr-carta-tipo " + (vrEstado.tipoActual === "verdad" ? "vr-tipo-verdad" : "vr-tipo-reto");
  textoEl.textContent = vrEstado.textoActual;

  carta.classList.remove("volteada");
  // Forzar un reflow: si no, quitar y volver a poner la clase en el mismo
  // tick no dispararía otra vez la transición al servir la siguiente carta.
  void carta.offsetWidth;
  carta.classList.add("volteada");
}

// «Otra» existe en los dos tipos, sin límite de veces y sin castigo, pero con
// un matiz distinto en cada uno: en reto es «no puedo hacer este por el sitio
// donde estoy», no una negativa; en verdad es una decisión de LOS DEMÁS
// jugadores, no de quien tiene el turno (a quien le toca no puede escaquearse
// pidiendo otra pregunta más fácil — para eso ya está «Paso», que sí cuenta y
// sí castiga con modo fiesta). La nota #vr-nota-verdad deja claro ese matiz y
// recuerda que el grupo también puede inventarse su propia pregunta.
// En "doble verdad" no hay «Otra»: la ruleta ya ha decidido y las dos
// preguntas van tal cual (§3 de md/PLAN_MODO_ARCADE.md).
function vrActualizarBotonOtra() {
  const boton = document.getElementById("vr-btn-otra");
  const esVerdad = vrEstado.tipoActual === "verdad";
  const hayOtra = !vrEstado.dobleVerdad;
  boton.hidden = !hayOtra;
  boton.textContent = esVerdad ? "Otra pregunta 🔄" : "Otro reto 🔄";
  document.getElementById("vr-nota-verdad").hidden = !esVerdad || !hayOtra;
}

// Deja la pantalla de la carta en su estado normal (Hecho/Paso visibles,
// "Otra" según el tipo, sin castigo a la vista). Se llama siempre que
// empieza un turno nuevo, para no arrastrar el aviso de "Paso" del turno
// anterior. La visibilidad de "Otra" la decide vrActualizarBotonOtra().
function vrRestablecerBotonesCarta() {
  document.getElementById("vr-btn-hecho").hidden = false;
  document.getElementById("vr-btn-paso").hidden = false;
  document.getElementById("vr-btn-siguiente-paso").hidden = true;
  document.getElementById("vr-castigo").hidden = true;
}

// Sirve una carta y la enseña. La usan tanto los botones de vr-turno como la
// ruleta del modo arcade, que llega aquí ya con el tipo decidido.
function vrMostrarCarta(tipo) {
  vrServirCarta(tipo);
  vrRestablecerBotonesCarta();
  vrActualizarBotonOtra();
  mostrarPantalla("vr-carta");
  vrRenderCarta();
}

function vrElegir(tipo) {
  // Los botones para el tipo sin repartidor están "hidden" (vrRenderTurno) y
  // un usuario real no puede tocarlos; esta comprobación es solo una red de
  // seguridad barata contra un estado de botones desincronizado.
  const repartidor = tipo === "verdad" ? vrEstado.repartidorVerdades : vrEstado.repartidorRetos;
  if (!repartidor) return;

  // Con el arcade encendido, elegir RETO no da un reto: manda a la ruleta, que
  // es quien decide. VERDAD nunca pasa por ahí.
  if (tipo === "reto" && vrEstado.arcade) {
    vrRuletaAbrir();
    return;
  }

  vrMostrarCarta(tipo);
}

function vrRenderTurno() {
  const nombre = vrEstado.nombres[vrEstado.indiceTurno];
  document.getElementById("vr-nombre-turno").textContent = `Turno de ${nombre}`;

  // Si un banco se quedó vacío al filtrar por nivel, su botón no se ofrece.
  document.getElementById("vr-btn-verdad").hidden = !vrEstado.repartidorVerdades;
  document.getElementById("vr-btn-reto").hidden = !vrEstado.repartidorRetos;
}

function vrGuardar() {
  guardarJSON(VR_CLAVE_GUARDADO, {
    nombres: vrEstado.nombres,
    niveles: vrEstado.niveles,
    arcade: vrEstado.arcade,
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
  vrEstado.arcade = vrInterruptorArcade.activo();
  vrEstado.indiceTurno = 0;
  vrEstado.contador = { verdades: 0, retos: 0, pasos: 0, cambios: 0 };
  vrEstado.resultadoRuleta = null;
  vrEstado.dobleVerdad = null;
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
  // Una partida guardada por una versión anterior trae "modo" y no trae
  // "arcade": se reanuda con el arcade apagado en vez de romperse.
  vrEstado.arcade = guardado.arcade === true;
  vrEstado.indiceTurno = guardado.indiceTurno;
  vrEstado.contador = guardado.contador;
  vrEstado.resultadoRuleta = null;
  vrEstado.dobleVerdad = null;
  vrInterruptorArcade.fijar(vrEstado.arcade);
  if (!vrIniciarMotor()) {
    mostrarPantalla("vr-config");
    return;
  }

  mostrarPantalla("vr-turno");
  vrRenderTurno();
  vrGuardar();
}

function vrSiguienteTurno() {
  vrArcadeLimpiar();
  vrEstado.indiceTurno = (vrEstado.indiceTurno + 1) % vrEstado.nombres.length;
  vrEstado.tipoActual = null;
  vrEstado.resultadoRuleta = null;
  vrEstado.dobleVerdad = null;
  mostrarPantalla("vr-turno");
  vrRenderTurno();
  vrGuardar();
}

// En "doble verdad" el turno no termina con la primera pregunta: queda otra.
// Devuelve true si ha encadenado la segunda, false si el turno ya puede pasar.
function vrEncadenarDobleVerdad() {
  if (!vrEstado.dobleVerdad || vrEstado.dobleVerdad.indice !== 1) return false;
  vrEstado.dobleVerdad.indice = 2;
  vrMostrarCarta("verdad");
  return true;
}

function vrHecho() {
  if (vrEstado.tipoActual === "verdad") vrEstado.contador.verdades++;
  else vrEstado.contador.retos++;
  if (vrEncadenarDobleVerdad()) return;
  vrSiguienteTurno();
}

function vrPaso() {
  vrEstado.contador.pasos++;

  if (!modoFiestaActivo()) {
    if (vrEncadenarDobleVerdad()) return;
    vrSiguienteTurno();
    return;
  }

  // Con modo fiesta activo, el turno no pasa hasta pulsar "Siguiente": antes
  // se enseña el castigo, sustituyendo Hecho/Paso/Otra por un único botón.
  // Pesos del castigo (95 % beber, 5 % prenda; nunca castigos "otros"):
  // pedido así por el usuario para este juego, no se elige, se ofrece al azar.
  const castigoEl = document.getElementById("vr-castigo");
  castigoEl.hidden = false;
  castigoEl.textContent =
    `${vrEstado.nombres[vrEstado.indiceTurno]}: ` +
    castigoPonderado({ beber: 0.95, prenda: 0.05 });
  document.getElementById("vr-btn-hecho").hidden = true;
  document.getElementById("vr-btn-paso").hidden = true;
  document.getElementById("vr-btn-otra").hidden = true;
  document.getElementById("vr-nota-verdad").hidden = true;
  document.getElementById("vr-btn-siguiente-paso").hidden = false;
}

// «Otra»: sirve una carta nueva del mismo tipo al instante. Sin límite de
// veces ni castigo en ninguno de los dos tipos, a diferencia de «Paso»: en
// reto porque el actual no se puede hacer en ese sitio, no porque no se
// quiera; en verdad porque la decide el grupo, no quien tiene el turno.
function vrOtraCarta() {
  vrEstado.contador.cambios++;
  vrServirCarta(vrEstado.tipoActual);
  vrRenderCarta();
}

// El "Siguiente" que aparece tras el castigo de «Paso». No siempre pasa turno:
// si estábamos en la primera de una doble verdad, queda la segunda.
function vrSiguienteTrasPaso() {
  if (vrEncadenarDobleVerdad()) return;
  vrSiguienteTurno();
}

function vrTerminar() {
  vrArcadeLimpiar();
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
    inicial: 3,
    alCambiar: () => (document.getElementById("vr-error").textContent = ""),
  });

  vrSelectorNiveles = vrMontarSelectorNiveles(document.getElementById("vr-niveles"), () => {});
  vrInterruptorArcade = vrMontarInterruptorArcade(document.getElementById("vr-arcade"));

  montarInterruptorModoFiesta(document.getElementById("vr-fiesta"), () => {});

  document.getElementById("btn-juego-vr").addEventListener("click", () => {
    document.getElementById("vr-btn-continuar").hidden = !hayGuardado(VR_CLAVE_GUARDADO);
    mostrarPantalla("vr-config");
  });

  document.getElementById("vr-btn-empezar").addEventListener("click", vrEmpezarPartida);
  document.getElementById("vr-btn-continuar").addEventListener("click", vrReanudar);
  document.getElementById("vr-btn-verdad").addEventListener("click", () => vrElegir("verdad"));
  document.getElementById("vr-btn-reto").addEventListener("click", () => vrElegir("reto"));
  document.getElementById("vr-btn-hecho").addEventListener("click", vrHecho);
  document.getElementById("vr-btn-paso").addEventListener("click", vrPaso);
  document.getElementById("vr-btn-otra").addEventListener("click", vrOtraCarta);
  document.getElementById("vr-btn-siguiente-paso").addEventListener("click", vrSiguienteTrasPaso);
  document.getElementById("vr-btn-terminar").addEventListener("click", vrTerminar);
  document.getElementById("vr-btn-terminar-2").addEventListener("click", vrTerminar);
  document.getElementById("vr-btn-otra-partida").addEventListener("click", vrOtraPartida);
  document.getElementById("vr-btn-hub").addEventListener("click", () => mostrarPantalla("fiesta"));
});
