// Motor común de los minijuegos del modo arcade (md/PLAN_MODO_ARCADE.md §4.2 y §6 Fase C).
//
// Este archivo NO sabe las reglas de ningún minijuego: se limita a preparar el
// canvas, llevar el bucle, la rampa de velocidad, el HUD, la cuenta atrás y la
// pantalla de resultado. Cada minijuego es un objeto con la misma forma
// (VR_MJ_PEZ, VR_MJ_GUEPARDO, VR_MJ_ZIGZAG, VR_MJ_CANASTA) que aporta las
// reglas y el dibujo. Todos trabajan en PÍXELES LÓGICOS: el motor ya ha
// aplicado la escala de densidad de pantalla, así que un minijuego solo ve
// `ancho` y `alto` en CSS px y no se entera del devicePixelRatio.

const VR_MJ_RAMPA_CADA = 5; // segundos entre subidas de velocidad
const VR_MJ_RAMPA_FACTOR = 1.15; // cuánto sube cada vez
const VR_MJ_DURACION_MAX = 60; // tope duro: ninguna partida pasa de aquí

// Estado del motor. Vive fuera de vrEstado a propósito: es efímero y no se
// guarda nunca en localStorage (al recargar se vuelve al principio del turno).
const vrMjMotor = {
  juego: null, // la definición del minijuego en curso
  estado: null, // el estado interno que devuelve juego.iniciar()
  ctx: null,
  ancho: 0,
  alto: 0,
  raf: 0,
  ultimo: 0,
  tiempo: 0,
  cuenta: 0, // segundos que quedan de la cuenta atrás 3·2·1
  fase: "parado", // "parado" | "cuenta" | "jugando" | "pausa" | "fin"
};

// Sprites ya convertidos a canvas: pintar píxel a píxel con fillRect en cada
// fotograma sería tirar frames a la basura, así que se rasteriza una vez.
const vrMjCacheSprites = new Map();

function vrMjSprite(nombre) {
  if (vrMjCacheSprites.has(nombre)) return vrMjCacheSprites.get(nombre);

  const def = VR_SPRITES[nombre];
  const filas = def.pixeles;
  // Las filas cortas se rellenan con transparente: así el dibujo se puede
  // editar sin tener que contar caracteres uno a uno.
  const ancho = filas.reduce((max, fila) => Math.max(max, fila.length), 0);
  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = filas.length;
  const ctx = lienzo.getContext("2d");

  filas.forEach((fila, y) => {
    for (let x = 0; x < fila.length; x++) {
      const color = def.paleta[fila[x]];
      if (!color) continue; // "." y cualquier carácter no declarado: transparente
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  });

  vrMjCacheSprites.set(nombre, lienzo);
  return lienzo;
}

// Pinta un sprite con su esquina superior izquierda en (x, y) y una altura de
// `alto` px lógicos (el ancho sale solo, manteniendo la proporción). Con
// `volteado` se dibuja en espejo, para personajes que miran al otro lado.
function vrMjPintarSprite(ctx, nombre, x, y, alto, volteado) {
  const lienzo = vrMjSprite(nombre);
  const escala = alto / lienzo.height;
  const ancho = lienzo.width * escala;
  ctx.save();
  ctx.imageSmoothingEnabled = false; // sin esto el pixel art sale emborronado
  if (volteado) {
    ctx.translate(x + ancho, y);
    ctx.scale(-1, 1);
    ctx.drawImage(lienzo, 0, 0, ancho, alto);
  } else {
    ctx.drawImage(lienzo, x, y, ancho, alto);
  }
  ctx.restore();
  return ancho;
}

// Mide el contenedor y ajusta el canvas a la densidad real de la pantalla: sin
// esto, en un móvil moderno todo se ve borroso. El contexto queda escalado, así
// que el resto del código dibuja en px lógicos y se olvida del asunto.
function vrMjAjustarLienzo() {
  const canvas = document.getElementById("vr-mj-canvas");
  const caja = canvas.parentElement.getBoundingClientRect();
  // getBoundingClientRect y no innerHeight: con la barra del navegador
  // apareciendo y desapareciendo, innerHeight miente.
  const ancho = Math.max(1, Math.round(caja.width));
  const alto = Math.max(1, Math.round(caja.height));
  const densidad = Math.min(window.devicePixelRatio || 1, 3);

  canvas.width = Math.round(ancho * densidad);
  canvas.height = Math.round(alto * densidad);
  canvas.style.width = ancho + "px";
  canvas.style.height = alto + "px";

  const ctx = canvas.getContext("2d");
  ctx.setTransform(densidad, 0, 0, densidad, 0, 0);

  vrMjMotor.ctx = ctx;
  vrMjMotor.ancho = ancho;
  vrMjMotor.alto = alto;
}

// Todos los minijuegos duran lo mismo salvo que digan otra cosa (la canasta,
// que son 30 s fijos).
function vrMjDuracion(juego) {
  return Math.min(juego.duracion || VR_MJ_DURACION_MAX, VR_MJ_DURACION_MAX);
}

// Cuánto se ha acelerado el juego a estas alturas. Se topa (factorMax) porque
// una rampa sin límite acaba moviendo los obstáculos más de lo que mide un
// fotograma y se atraviesan sin colisionar.
function vrMjFactor() {
  const juego = vrMjMotor.juego;
  if (!juego.acelera) return 1;
  const pasos = Math.floor(vrMjMotor.tiempo / VR_MJ_RAMPA_CADA);
  return Math.min(Math.pow(VR_MJ_RAMPA_FACTOR, pasos), juego.factorMax || 3);
}

// ---------------------------------------------------------------------------
// Entrada: un único juego de listeners para los cuatro minijuegos. Se usan
// eventos de puntero (valen para dedo y para ratón) y se sueltan siempre al
// terminar, que si no el bucle sigue vivo por detrás.
// ---------------------------------------------------------------------------

function vrMjPunto(evento) {
  const caja = document.getElementById("vr-mj-canvas").getBoundingClientRect();
  return { x: evento.clientX - caja.left, y: evento.clientY - caja.top };
}

function vrMjAlPulsar(evento) {
  evento.preventDefault();
  if (vrMjMotor.fase === "pausa") {
    vrMjReanudar();
    return;
  }
  if (vrMjMotor.fase !== "jugando") return;
  const p = vrMjPunto(evento);
  if (vrMjMotor.juego.pulsar) vrMjMotor.juego.pulsar(vrMjMotor.estado, p.x, p.y);
}

function vrMjAlMover(evento) {
  if (vrMjMotor.fase !== "jugando" || !vrMjMotor.juego.mover) return;
  evento.preventDefault();
  const p = vrMjPunto(evento);
  vrMjMotor.juego.mover(vrMjMotor.estado, p.x, p.y);
}

function vrMjAlSoltar(evento) {
  if (vrMjMotor.fase !== "jugando" || !vrMjMotor.juego.soltar) return;
  evento.preventDefault();
  const p = vrMjPunto(evento);
  vrMjMotor.juego.soltar(vrMjMotor.estado, p.x, p.y);
}

// Si la app se va a segundo plano (una llamada, bloquear la pantalla) el juego
// se pausa: volver y encontrarte muerto sin haber jugado sería injusto.
function vrMjAlOcultarse() {
  if (vrMjMotor.fase === "jugando") vrMjMotor.fase = "pausa";
}

function vrMjConectarEntrada() {
  const canvas = document.getElementById("vr-mj-canvas");
  canvas.addEventListener("pointerdown", vrMjAlPulsar);
  canvas.addEventListener("pointermove", vrMjAlMover);
  canvas.addEventListener("pointerup", vrMjAlSoltar);
  // pointercancel: el navegador puede quitarte el puntero de las manos (un
  // gesto del sistema, una notificación). Sin esto, un tiro de la canasta se
  // quedaría cargado para siempre.
  canvas.addEventListener("pointercancel", vrMjAlSoltar);
  document.addEventListener("visibilitychange", vrMjAlOcultarse);
  window.addEventListener("resize", vrMjAlRedimensionar);
}

function vrMjDesconectarEntrada() {
  const canvas = document.getElementById("vr-mj-canvas");
  canvas.removeEventListener("pointerdown", vrMjAlPulsar);
  canvas.removeEventListener("pointermove", vrMjAlMover);
  canvas.removeEventListener("pointerup", vrMjAlSoltar);
  canvas.removeEventListener("pointercancel", vrMjAlSoltar);
  document.removeEventListener("visibilitychange", vrMjAlOcultarse);
  window.removeEventListener("resize", vrMjAlRedimensionar);
}

// Al girar el móvil o al aparecer/desaparecer la barra del navegador cambia el
// tamaño del lienzo. Se reajusta y se avisa al minijuego, que reposiciona lo
// que tenga que reposicionar (no se reinicia la partida: sería peor).
function vrMjAlRedimensionar() {
  if (vrMjMotor.fase === "parado" || vrMjMotor.fase === "fin") return;
  const anchoAntes = vrMjMotor.ancho;
  const altoAntes = vrMjMotor.alto;
  vrMjAjustarLienzo();
  if (vrMjMotor.juego.redimensionar) {
    vrMjMotor.juego.redimensionar(vrMjMotor.estado, {
      ancho: vrMjMotor.ancho,
      alto: vrMjMotor.alto,
      anchoAntes,
      altoAntes,
    });
  }
}

// ---------------------------------------------------------------------------
// Bucle
// ---------------------------------------------------------------------------

function vrMjBucle(ahora) {
  vrMjMotor.raf = requestAnimationFrame(vrMjBucle);

  // dt acotado a 50 ms: si el navegador se atasca (o la app vuelve de segundo
  // plano) un dt gigante teletransportaría al jugador dentro de un obstáculo.
  const dt = Math.min((ahora - vrMjMotor.ultimo) / 1000, 0.05);
  vrMjMotor.ultimo = ahora;

  const ctx = vrMjMotor.ctx;

  if (vrMjMotor.fase === "cuenta") {
    vrMjMotor.cuenta -= dt;
    vrMjMotor.juego.pintar(ctx, vrMjMotor.estado);
    vrMjPintarCuenta();
    if (vrMjMotor.cuenta <= 0) {
      vrMjMotor.fase = "jugando";
      document.getElementById("vr-mj-cuenta").hidden = true;
    }
    return;
  }

  if (vrMjMotor.fase === "pausa") {
    vrMjMotor.juego.pintar(ctx, vrMjMotor.estado);
    vrMjPintarVelo("Toca para seguir");
    return;
  }

  if (vrMjMotor.fase !== "jugando") return;

  vrMjMotor.tiempo += dt;
  const vivo = vrMjMotor.juego.actualizar(vrMjMotor.estado, dt, vrMjFactor());
  vrMjMotor.juego.pintar(ctx, vrMjMotor.estado);
  vrMjPintarHud();

  const restante = vrMjDuracion(vrMjMotor.juego) - vrMjMotor.tiempo;
  if (!vivo || restante <= 0) vrMjTerminar();
}

function vrMjReanudar() {
  if (vrMjMotor.fase !== "pausa") return;
  vrMjMotor.fase = "jugando";
  // El reloj se pone a cero: si no, el dt del primer frame tras la pausa
  // valdría los segundos enteros que ha estado la app fuera.
  vrMjMotor.ultimo = performance.now();
}

function vrMjPintarHud() {
  const restante = Math.max(0, Math.ceil(vrMjDuracion(vrMjMotor.juego) - vrMjMotor.tiempo));
  document.getElementById("vr-mj-puntos").textContent =
    `${vrMjMotor.estado.puntos} / ${vrMjMotor.juego.objetivo}`;
  document.getElementById("vr-mj-tiempo").textContent = restante + "s";
}

function vrMjPintarVelo(texto) {
  const ctx = vrMjMotor.ctx;
  ctx.save();
  ctx.fillStyle = "rgba(23, 7, 9, 0.72)";
  ctx.fillRect(0, 0, vrMjMotor.ancho, vrMjMotor.alto);
  ctx.fillStyle = "#f9e8ea";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "600 " + Math.round(vrMjMotor.alto * 0.045) + "px system-ui, sans-serif";
  ctx.fillText(texto, vrMjMotor.ancho / 2, vrMjMotor.alto / 2);
  ctx.restore();
}

function vrMjPintarCuenta() {
  const numero = Math.ceil(vrMjMotor.cuenta);
  const cartel = document.getElementById("vr-mj-cuenta");
  cartel.hidden = false;
  cartel.textContent = numero > 0 ? String(numero) : "¡YA!";
}

// ---------------------------------------------------------------------------
// Ciclo de vida
// ---------------------------------------------------------------------------

// Abre la portada del minijuego (nombre, cómo se juega y objetivo). Todavía no
// se juega nada: hace falta pulsar "Empezar", que da tiempo a leer y a colocar
// el dedo antes de la cuenta atrás.
function vrMjAbrir(juego) {
  vrMjMotor.juego = juego;
  vrMjMotor.fase = "parado";

  document.getElementById("vr-mj-nombre").textContent = juego.nombre;
  document.getElementById("vr-mj-como").textContent = juego.como;
  document.getElementById("vr-mj-objetivo").textContent =
    `Objetivo: ${juego.objetivo} ${juego.unidad}`;
  document.getElementById("vr-mj-portada").hidden = false;
  document.getElementById("vr-mj-lienzo").hidden = true;
  document.getElementById("vr-mj-final").hidden = true;
  document.getElementById("vr-mj-cuenta").hidden = true;

  mostrarPantalla("vr-minijuego");
}

function vrMjEmpezar() {
  // Idempotente a propósito: si "Empezar" llegara a dispararse dos veces, sin
  // esto quedarían dos bucles y dos juegos de listeners corriendo a la vez.
  vrMjParar();
  document.getElementById("vr-mj-portada").hidden = true;
  document.getElementById("vr-mj-lienzo").hidden = false;

  vrMjAjustarLienzo();
  vrMjMotor.estado = vrMjMotor.juego.iniciar(vrMjMotor.ancho, vrMjMotor.alto);
  vrMjMotor.estado.puntos = vrMjMotor.estado.puntos || 0;
  vrMjMotor.tiempo = 0;
  vrMjMotor.cuenta = 3;
  vrMjMotor.fase = "cuenta";
  vrMjMotor.ultimo = performance.now();

  vrMjPintarHud();
  vrMjConectarEntrada();
  vrMjMotor.raf = requestAnimationFrame(vrMjBucle);
}

// Chupitos escalados (decisión del usuario, §3 del plan): llegar al objetivo
// sale gratis, quedarse cerca cuesta uno y abandonar cuesta dos.
function vrMjChupitos(puntos, objetivo) {
  if (puntos >= objetivo) return 0;
  if (puntos * 2 >= objetivo) return 1;
  return 2;
}

function vrMjTerminar() {
  vrMjParar();
  vrMjMotor.fase = "fin";

  const puntos = vrMjMotor.estado.puntos;
  const objetivo = vrMjMotor.juego.objetivo;
  const chupitos = vrMjChupitos(puntos, objetivo);

  document.getElementById("vr-mj-marcador").textContent =
    `${puntos} de ${objetivo} ${vrMjMotor.juego.unidad}`;

  const castigoEl = document.getElementById("vr-mj-castigo");
  if (chupitos === 0) {
    castigoEl.textContent = "¡Objetivo cumplido! Te libras.";
  } else if (!modoFiestaActivo()) {
    // Sin modo fiesta la app no manda beber a nadie, aquí tampoco.
    castigoEl.textContent = "No has llegado al objetivo.";
  } else {
    const quien = vrEstado.nombres[vrEstado.indiceTurno];
    castigoEl.textContent =
      chupitos === 1 ? `${quien}: 1 chupito.` : `${quien}: 2 chupitos, que te has quedado lejos.`;
  }

  document.getElementById("vr-mj-final").hidden = false;
}

// Corta el bucle y suelta los listeners. Se llama al terminar, pero también al
// salirse a mitad con "Terminar": sin esto el requestAnimationFrame seguiría
// corriendo por detrás durante el resto de la partida.
function vrMjParar() {
  if (vrMjMotor.raf) cancelAnimationFrame(vrMjMotor.raf);
  vrMjMotor.raf = 0;
  if (vrMjMotor.juego) vrMjDesconectarEntrada();
  vrMjMotor.fase = "parado";
}

// ---------------------------------------------------------------------------
// Ayudas de dibujo que usan los cuatro minijuegos
// ---------------------------------------------------------------------------

function vrMjRectRedondo(ctx, x, y, ancho, alto, radio) {
  const r = Math.min(radio, ancho / 2, alto / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + ancho, y, x + ancho, y + alto, r);
  ctx.arcTo(x + ancho, y + alto, x, y + alto, r);
  ctx.arcTo(x, y + alto, x, y, r);
  ctx.arcTo(x, y, x + ancho, y, r);
  ctx.closePath();
}

function vrMjDegradado(ctx, alto, arriba, abajo) {
  const g = ctx.createLinearGradient(0, 0, 0, alto);
  g.addColorStop(0, arriba);
  g.addColorStop(1, abajo);
  return g;
}

// ¿Se solapan dos rectángulos? Colisión de sobra para lo que hacen estos juegos.
function vrMjChocan(a, b) {
  return (
    a.x < b.x + b.ancho && a.x + a.ancho > b.x && a.y < b.y + b.alto && a.y + a.alto > b.y
  );
}
