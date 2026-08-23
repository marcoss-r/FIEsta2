// Modo arcade de «Verdad o Reto» (md/PLAN_MODO_ARCADE.md).
//
// Con el arcade encendido, elegir RETO ya no da un reto directamente: manda a
// una ruleta que decide qué toca de verdad. Aquí vive la ruleta, el reparto de
// resultados y la pantalla del test rápido; los minijuegos van en
// js/verdadreto/minijuegos.js y los cuatro mj-*.js.
//
// Debe cargarse DESPUÉS de main.js y de los minijuegos: su DOMContentLoaded
// necesita que existan tanto las funciones de vr como las constantes VR_MJ_*.

const VR_RULETA_TIPOS = {
  reto: { etiqueta: "Reto normal", emoji: "🎯", color: "#c22334", alterno: "#9e1b29" },
  minijuego: { etiqueta: "Minijuego", emoji: "🎮", color: "#ff9142", alterno: "#ff9142" },
  trivia: { etiqueta: "Test rápido", emoji: "🧠", color: "#3d7dd6", alterno: "#3d7dd6" },
  dobleverdad: { etiqueta: "Doble verdad", emoji: "⭐", color: "#34c759", alterno: "#34c759" },
};

// 20 quesitos IGUALES de 18°, así que lo que se ve es exactamente la
// probabilidad real: 15 reto + 2 minijuego + 2 test + 1 doble verdad =
// 75/10/10/5. Los especiales van espaciados (2, 6, 10, 14, 18) para que no
// queden pegados y la rueda parezca justa de un vistazo.
const VR_RULETA_QUESITOS = [
  "reto",
  "reto",
  "minijuego",
  "reto",
  "reto",
  "reto",
  "trivia",
  "reto",
  "reto",
  "reto",
  "minijuego",
  "reto",
  "reto",
  "reto",
  "trivia",
  "reto",
  "reto",
  "reto",
  "dobleverdad",
  "reto",
];

const VR_RULETA_VUELTAS = 4;
const VR_RULETA_DURACION = 3200; // ms; tiene que coincidir con la transición CSS

const VR_MINIJUEGOS = [VR_MJ_PEZ, VR_MJ_GUEPARDO, VR_MJ_ZIGZAG, VR_MJ_CANASTA];

const VR_TRIVIA_POR_TEST = 3;
const VR_TRIVIA_CATEGORIAS = {
  geografia: "Geografía",
  mates: "Matemáticas",
  historia: "Historia",
  banderas: "Banderas",
};

// Ángulo acumulado de la rueda: siempre creciente, para que cada giro siga
// hacia delante en vez de volver atrás dando un tirón.
let vrRuletaAngulo = 0;
let vrRuletaGirando = false;

let vrTriviaRepartidor = null;
let vrTriviaTemporizador = 0;
const vrTriviaEstado = { preguntas: [], indice: 0, fallos: 0 };

// ---------------------------------------------------------------------------
// Ruleta
// ---------------------------------------------------------------------------

// Dibuja la rueda una sola vez (los quesitos no cambian durante la partida).
function vrRuletaConstruir() {
  const svg = document.getElementById("vr-ruleta-svg");
  if (svg.childElementCount) return;

  const NS = "http://www.w3.org/2000/svg";
  const total = VR_RULETA_QUESITOS.length;
  const paso = 360 / total;
  const cx = 50;
  const cy = 50;
  const r = 48;
  let alterna = false;

  VR_RULETA_QUESITOS.forEach((tipo, i) => {
    // -90°: el quesito 0 empieza justo arriba, donde está el marcador.
    const a0 = ((i * paso - 90) * Math.PI) / 180;
    const a1 = (((i + 1) * paso - 90) * Math.PI) / 180;
    const def = VR_RULETA_TIPOS[tipo];

    const cuña = document.createElementNS(NS, "path");
    cuña.setAttribute(
      "d",
      `M ${cx} ${cy} L ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} ` +
        `A ${r} ${r} 0 0 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} Z`
    );
    // Los quesitos de reto alternan dos rojos: si fueran todos iguales, no se
    // vería girar la rueda (15 de 20 son del mismo tipo).
    cuña.setAttribute("fill", tipo === "reto" && alterna ? def.alterno : def.color);
    if (tipo === "reto") alterna = !alterna;
    svg.appendChild(cuña);

    const ac = (i + 0.5) * paso - 90;
    const rad = (ac * Math.PI) / 180;
    const tx = cx + 34 * Math.cos(rad);
    const ty = cy + 34 * Math.sin(rad);
    const texto = document.createElementNS(NS, "text");
    texto.setAttribute("x", tx.toFixed(2));
    texto.setAttribute("y", ty.toFixed(2));
    texto.setAttribute("font-size", "7");
    texto.setAttribute("text-anchor", "middle");
    texto.setAttribute("dominant-baseline", "central");
    texto.setAttribute("transform", `rotate(${(ac + 90).toFixed(2)} ${tx.toFixed(2)} ${ty.toFixed(2)})`);
    texto.textContent = def.emoji;
    svg.appendChild(texto);
  });

  const borde = document.createElementNS(NS, "circle");
  borde.setAttribute("cx", cx);
  borde.setAttribute("cy", cy);
  borde.setAttribute("r", r);
  borde.setAttribute("fill", "none");
  borde.setAttribute("stroke", "#170709");
  borde.setAttribute("stroke-width", "2");
  svg.appendChild(borde);

  const eje = document.createElementNS(NS, "circle");
  eje.setAttribute("cx", cx);
  eje.setAttribute("cy", cy);
  eje.setAttribute("r", "6");
  eje.setAttribute("fill", "#170709");
  svg.appendChild(eje);
}

function vrRuletaLeyenda() {
  const contenedor = document.getElementById("vr-ruleta-leyenda");
  if (contenedor.childElementCount) return;
  const total = VR_RULETA_QUESITOS.length;

  Object.keys(VR_RULETA_TIPOS).forEach((tipo) => {
    const cuantos = VR_RULETA_QUESITOS.filter((q) => q === tipo).length;
    if (!cuantos) return;
    const fila = document.createElement("span");
    fila.className = "vr-ruleta-leyenda-item";
    const punto = document.createElement("i");
    punto.style.background = VR_RULETA_TIPOS[tipo].color;
    fila.append(punto, `${VR_RULETA_TIPOS[tipo].etiqueta} ${Math.round((cuantos / total) * 100)} %`);
    contenedor.appendChild(fila);
  });
}

// Un quesito solo puede salir si su resultado se puede servir de verdad. El
// caso real es «doble verdad» con el banco de verdades vacío tras filtrar por
// nivel: en vez de dejar que caiga y hacer un apaño, se excluye del sorteo.
function vrRuletaDisponible(tipo) {
  if (tipo === "dobleverdad") return !!vrEstado.repartidorVerdades;
  if (tipo === "trivia") return VR_TRIVIA.length > 0;
  if (tipo === "minijuego") return VR_MINIJUEGOS.length > 0;
  return true;
}

function vrRuletaAbrir() {
  vrRuletaConstruir();
  vrRuletaLeyenda();

  document.getElementById("vr-ruleta-turno").textContent =
    `Turno de ${vrEstado.nombres[vrEstado.indiceTurno]}`;
  document.getElementById("vr-ruleta-resultado").hidden = true;
  document.getElementById("vr-btn-ruleta-ir").hidden = true;
  const boton = document.getElementById("vr-btn-girar");
  boton.hidden = false;
  boton.disabled = false;
  vrRuletaGirando = false;

  mostrarPantalla("vr-ruleta");
}

function vrRuletaGirar() {
  if (vrRuletaGirando) return;
  vrRuletaGirando = true;
  document.getElementById("vr-btn-girar").disabled = true;

  const elegibles = [];
  VR_RULETA_QUESITOS.forEach((tipo, i) => {
    if (vrRuletaDisponible(tipo)) elegibles.push(i);
  });
  const indice = elegirAlAzar(elegibles);
  vrEstado.resultadoRuleta = VR_RULETA_QUESITOS[indice];

  const paso = 360 / VR_RULETA_QUESITOS.length;
  const centro = indice * paso + paso / 2;
  // Un desvío dentro del propio quesito para que no pare siempre clavada en el
  // centro; nunca llega al borde, así que el resultado no cambia.
  const desvio = (Math.random() - 0.5) * paso * 0.7;

  // Se busca el primer ángulo, a partir de cuatro vueltas más, que deje el
  // quesito elegido bajo el marcador (que está fijo arriba, en el 0).
  const base = vrRuletaAngulo + VR_RULETA_VUELTAS * 360;
  const objetivoMod = (((-centro + desvio) % 360) + 360) % 360;
  const baseMod = ((base % 360) + 360) % 360;
  let delta = objetivoMod - baseMod;
  if (delta < 0) delta += 360;
  vrRuletaAngulo = base + delta;

  const svg = document.getElementById("vr-ruleta-svg");
  const sinMovimiento =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (sinMovimiento) {
    // Quien ha pedido no ver animaciones no tiene por qué tragarse 3,2 s de
    // rueda girando: se coloca sin transición y se anuncia el resultado.
    svg.style.transition = "none";
    svg.style.transform = `rotate(${vrRuletaAngulo}deg)`;
    setTimeout(vrRuletaParada, 350);
    return;
  }

  svg.style.transition = `transform ${VR_RULETA_DURACION}ms cubic-bezier(.17,.67,.16,1)`;
  svg.style.transform = `rotate(${vrRuletaAngulo}deg)`;
  // El transitionend es lo que manda, pero se pone una red por si el navegador
  // se lo come (pasa si la pestaña se oculta a mitad del giro).
  svg.addEventListener("transitionend", vrRuletaParada, { once: true });
  setTimeout(() => {
    if (vrRuletaGirando) vrRuletaParada();
  }, VR_RULETA_DURACION + 400);
}

function vrRuletaParada() {
  if (!vrRuletaGirando) return;
  vrRuletaGirando = false;

  const def = VR_RULETA_TIPOS[vrEstado.resultadoRuleta];
  const resultado = document.getElementById("vr-ruleta-resultado");
  resultado.textContent = `${def.emoji} ${def.etiqueta}`;
  resultado.style.color = def.color;
  resultado.hidden = false;

  document.getElementById("vr-btn-girar").hidden = true;
  document.getElementById("vr-btn-ruleta-ir").hidden = false;
}

// Lleva a la pantalla que haya decidido la ruleta.
function vrRuletaIr() {
  const tipo = vrEstado.resultadoRuleta;
  if (tipo === "dobleverdad") {
    vrEstado.dobleVerdad = { indice: 1 };
    vrMostrarCarta("verdad");
    return;
  }
  if (tipo === "trivia") {
    vrTriviaAbrir();
    return;
  }
  if (tipo === "minijuego") {
    vrMjAbrir(elegirAlAzar(VR_MINIJUEGOS));
    return;
  }
  vrMostrarCarta("reto");
}

// ---------------------------------------------------------------------------
// Test rápido
// ---------------------------------------------------------------------------

function vrTriviaAbrir() {
  if (!vrTriviaRepartidor) vrTriviaRepartidor = crearRepartidor(VR_TRIVIA);

  vrTriviaEstado.preguntas = [];
  vrTriviaEstado.indice = 0;
  vrTriviaEstado.fallos = 0;

  // El repartidor rebaraja al agotarse, así que en un banco muy pequeño podría
  // devolver dos veces la misma pregunta dentro del mismo test: se descartan
  // las repetidas, con un tope de intentos para no quedarse dando vueltas.
  const vistas = new Set();
  for (let i = 0; i < VR_TRIVIA_POR_TEST * 4; i++) {
    if (vrTriviaEstado.preguntas.length === VR_TRIVIA_POR_TEST) break;
    const { valor } = vrTriviaRepartidor.siguiente();
    if (vistas.has(valor.pregunta)) continue;
    vistas.add(valor.pregunta);
    vrTriviaEstado.preguntas.push(valor);
  }

  document.getElementById("vr-trivia-fin").hidden = true;
  document.getElementById("vr-trivia-juego").hidden = false;
  mostrarPantalla("vr-trivia");
  vrTriviaRender();
}

function vrTriviaRender() {
  const pregunta = vrTriviaEstado.preguntas[vrTriviaEstado.indice];
  const total = vrTriviaEstado.preguntas.length;

  document.getElementById("vr-trivia-progreso").textContent =
    `Pregunta ${vrTriviaEstado.indice + 1} de ${total}`;
  document.getElementById("vr-trivia-categoria").textContent =
    VR_TRIVIA_CATEGORIAS[pregunta.categoria] || pregunta.categoria;
  document.getElementById("vr-trivia-pregunta").textContent = pregunta.pregunta;

  const contenedor = document.getElementById("vr-trivia-opciones");
  contenedor.innerHTML = "";
  // Se barajan en cada render: la correcta no puede caer siempre en el mismo
  // sitio, o se acierta sin leer.
  barajar([pregunta.correcta].concat(pregunta.incorrectas)).forEach((texto) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "vr-trivia-opcion";
    boton.textContent = texto;
    boton.addEventListener("click", () => vrTriviaResponder(texto, boton));
    contenedor.appendChild(boton);
  });
}

function vrTriviaResponder(texto, boton) {
  const pregunta = vrTriviaEstado.preguntas[vrTriviaEstado.indice];
  const contenedor = document.getElementById("vr-trivia-opciones");

  Array.from(contenedor.children).forEach((b) => {
    b.disabled = true;
    if (b.textContent === pregunta.correcta) b.classList.add("acierto");
  });
  if (texto !== pregunta.correcta) {
    boton.classList.add("fallo");
    vrTriviaEstado.fallos++;
  }

  vrTriviaTemporizador = setTimeout(() => {
    vrTriviaTemporizador = 0;
    vrTriviaEstado.indice++;
    if (vrTriviaEstado.indice >= vrTriviaEstado.preguntas.length) vrTriviaFinal();
    else vrTriviaRender();
  }, 1200);
}

function vrTriviaFinal() {
  const total = vrTriviaEstado.preguntas.length;
  const aciertos = total - vrTriviaEstado.fallos;

  document.getElementById("vr-trivia-juego").hidden = true;
  document.getElementById("vr-trivia-resultado").textContent = `${aciertos} de ${total}`;

  const castigoEl = document.getElementById("vr-trivia-castigo");
  if (!vrTriviaEstado.fallos) {
    castigoEl.textContent = "¡Pleno! Te libras.";
  } else if (!modoFiestaActivo()) {
    // Sin modo fiesta la app no manda beber a nadie.
    castigoEl.textContent =
      vrTriviaEstado.fallos === 1 ? "Un fallo." : `${vrTriviaEstado.fallos} fallos.`;
  } else {
    const quien = vrEstado.nombres[vrEstado.indiceTurno];
    castigoEl.textContent =
      vrTriviaEstado.fallos === 1
        ? `${quien}: 1 chupito.`
        : `${quien}: ${vrTriviaEstado.fallos} chupitos.`;
  }

  document.getElementById("vr-trivia-fin").hidden = false;
}

// Corta lo que haya en marcha en las pantallas del arcade. Se llama al terminar
// la partida y al pasar de turno: sin esto, salir a mitad de un test dejaría un
// setTimeout suelto que cambiaría de pantalla 1,2 s después.
function vrArcadeLimpiar() {
  if (vrTriviaTemporizador) clearTimeout(vrTriviaTemporizador);
  vrTriviaTemporizador = 0;
  vrMjParar();
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("vr-btn-girar").addEventListener("click", vrRuletaGirar);
  document.getElementById("vr-btn-ruleta-ir").addEventListener("click", vrRuletaIr);
  document.getElementById("vr-btn-trivia-siguiente").addEventListener("click", vrSiguienteTurno);
  document.getElementById("vr-btn-mj-empezar").addEventListener("click", vrMjEmpezar);
  document.getElementById("vr-btn-mj-siguiente").addEventListener("click", vrSiguienteTurno);
  document
    .getElementById("vr-btn-terminar-ruleta")
    .addEventListener("click", vrTerminar);
  document.getElementById("vr-btn-terminar-trivia").addEventListener("click", vrTerminar);
  document.getElementById("vr-btn-terminar-mj").addEventListener("click", vrTerminar);
});
