// Minijuego «Bolita zigzag» (md/PLAN_MODO_ARCADE.md §6 Fase E).
// La bola avanza sola en diagonal por un camino estrecho; cada toque cambia
// entre las dos direcciones posibles (↗ y ↖). El camino zigzaguea con giros de
// 90°: si no giras a tiempo, te sales y caes.

const VR_MJ_ZIGZAG_DIAGONAL = Math.SQRT1_2; // componente de una diagonal a 45°
const VR_MJ_ZIGZAG_TRAMO_MIN = 0.22; // en altos de pantalla
const VR_MJ_ZIGZAG_TRAMO_MAX = 0.4;

// Las dos únicas direcciones del juego: arriba-derecha y arriba-izquierda.
const VR_MJ_ZIGZAG_DIRS = [
  { x: VR_MJ_ZIGZAG_DIAGONAL, y: -VR_MJ_ZIGZAG_DIAGONAL },
  { x: -VR_MJ_ZIGZAG_DIAGONAL, y: -VR_MJ_ZIGZAG_DIAGONAL },
];

// Añade esquinas por delante hasta tener camino de sobra por encima de la bola.
// La longitud mínima del tramo está pensada para que, a la velocidad tope,
// siempre quede tiempo de reaccionar al giro (§6 Fase E).
function vrMjZigzagGenerar(e) {
  while (e.esquinas[e.esquinas.length - 1].y > e.y - e.alto * 2.2) {
    const ultima = e.esquinas[e.esquinas.length - 1];
    // El primer tramo (esquinas.length === 1) tiene que salir en la dirección 0,
    // que es con la que arranca la bola: si no, empieza ya fuera del camino.
    const dir = VR_MJ_ZIGZAG_DIRS[(e.esquinas.length - 1) % 2];
    const largo =
      e.alto *
      (VR_MJ_ZIGZAG_TRAMO_MIN + Math.random() * (VR_MJ_ZIGZAG_TRAMO_MAX - VR_MJ_ZIGZAG_TRAMO_MIN));
    e.esquinas.push({ x: ultima.x + dir.x * largo, y: ultima.y + dir.y * largo });
  }
}

// Distancia de un punto al segmento AB. Es lo único que hace falta para saber
// si la bola sigue sobre el camino: el camino es la polilínea engordada.
function vrMjZigzagDistancia(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const largo2 = dx * dx + dy * dy;
  if (largo2 === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / largo2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

const VR_MJ_ZIGZAG = {
  id: "zigzag",
  nombre: "Bolita zigzag",
  como: "La bola avanza sola. Toca para cambiar de dirección en cada giro y no salirte del camino.",
  objetivo: 20,
  unidad: "tramos",
  acelera: true,
  factorMax: 2,

  iniciar(ancho, alto) {
    const e = {
      ancho,
      alto,
      puntos: 0,
      x: 0,
      y: 0,
      dir: 0,
      esquinas: [{ x: 0, y: 0 }],
    };
    vrMjZigzagGenerar(e);
    return e;
  },

  pulsar(e) {
    e.dir = e.dir === 0 ? 1 : 0;
  },

  redimensionar(e, m) {
    // El mundo del zigzag se mide en altos de pantalla, así que basta con
    // reescalar por el alto y todo sigue siendo transitable.
    const f = m.alto / m.altoAntes;
    e.ancho = m.ancho;
    e.alto = m.alto;
    e.x *= f;
    e.y *= f;
    e.esquinas.forEach((c) => {
      c.x *= f;
      c.y *= f;
    });
  },

  actualizar(e, dt, factor) {
    const dir = VR_MJ_ZIGZAG_DIRS[e.dir];
    const velocidad = e.alto * 0.45 * factor;
    e.x += dir.x * velocidad * dt;
    e.y += dir.y * velocidad * dt;

    vrMjZigzagGenerar(e);

    // Esquinas ya superadas (las que quedan por debajo de la bola): son los
    // tramos completados, y por tanto la puntuación.
    let pasadas = 0;
    for (let i = 1; i < e.esquinas.length; i++) {
      if (e.esquinas[i].y > e.y) pasadas++;
    }
    e.puntos = pasadas;

    // ¿Sigue sobre el camino? Solo se miran los tramos cercanos: comprobar la
    // polilínea entera costaría más cuanto más lejos llegases.
    //
    // El margen es el semiancho del camino dibujado (0,042) más medio radio de
    // la bola: se muere cuando la bola ya está claramente fuera, no en cuanto
    // asoma un píxel por el borde.
    const radio = e.alto * 0.0275; // la bola se dibuja a 0,055 de alto
    const margen = e.alto * 0.042 + radio * 0.5;
    let dentro = false;
    for (let i = Math.max(0, pasadas - 2); i < e.esquinas.length - 1; i++) {
      const a = e.esquinas[i];
      const b = e.esquinas[i + 1];
      if (vrMjZigzagDistancia(e.x, e.y, a.x, a.y, b.x, b.y) <= margen) {
        dentro = true;
        break;
      }
    }

    return dentro;
  },

  pintar(ctx, e) {
    ctx.fillStyle = vrMjDegradado(ctx, e.alto, "#1d0a10", "#0c0406");
    ctx.fillRect(0, 0, e.ancho, e.alto);

    // Cámara: la bola siempre en el mismo sitio de la pantalla y el mundo
    // moviéndose por detrás.
    const camX = e.ancho / 2 - e.x;
    const camY = e.alto * 0.66 - e.y;
    ctx.save();
    ctx.translate(camX, camY);

    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.strokeStyle = "#5a1c27";
    ctx.lineWidth = e.alto * 0.098;
    ctx.beginPath();
    e.esquinas.forEach((c, i) => (i ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y)));
    ctx.stroke();

    ctx.strokeStyle = "#3a1219";
    ctx.lineWidth = e.alto * 0.084;
    ctx.beginPath();
    e.esquinas.forEach((c, i) => (i ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y)));
    ctx.stroke();

    // Marca en cada esquina: ayuda muchísimo a anticipar el giro.
    ctx.fillStyle = "rgba(255, 77, 90, 0.45)";
    e.esquinas.forEach((c) => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, e.alto * 0.012, 0, Math.PI * 2);
      ctx.fill();
    });

    const bolaAlto = e.alto * 0.055;
    vrMjPintarSprite(ctx, "bola", e.x - bolaAlto / 2, e.y - bolaAlto / 2, bolaAlto);

    ctx.restore();
  },
};
