// Minijuego «Guepardo del desierto» (md/PLAN_MODO_ARCADE.md §6 Fase D).
// El corredor de toda la vida: el guepardo corre solo y cada toque lo hace
// saltar. Hay que esquivar cactus y rocas.

// Salto: sube 0,35 altos de pantalla y está 0,97 s en el aire. No basta con que
// el salto sea MÁS ALTO que el obstáculo: hay que estar por encima el tiempo
// suficiente para que el obstáculo termine de pasar por debajo. Con el
// obstáculo más alto (0,14) el guepardo pasa 0,73 s por encima, y a la
// velocidad de salida (0,62 anchos/s) eso son 1,15 anchos de recorrido, de
// sobra para los ~0,3 anchos que ocupan guepardo y cactus juntos.
// (§6 Fase D, criterio de aceptación.)
const VR_MJ_GUEPARDO_IMPULSO = 1.45;
const VR_MJ_GUEPARDO_GRAVEDAD = 3;
const VR_MJ_GUEPARDO_SUELO = 0.78; // altura del suelo, en altos de pantalla

// La distancia entre obstáculos crece con la velocidad: si fuera fija, a partir
// de cierta rampa el siguiente cactus llegaría antes de aterrizar del anterior
// y el juego sería imposible, no difícil. Lo que sí se estrecha al acelerar es
// el tiempo de reacción desde que el obstáculo asoma por el borde.
function vrMjGuepardoNuevoObstaculo(e, x, factor) {
  const alto = e.alto * (0.07 + Math.random() * 0.07);
  const doble = factor > 1.5 && Math.random() < 0.28;
  return {
    x,
    ancho: e.alto * (doble ? 0.1 : 0.05 + Math.random() * 0.025),
    alto,
    doble,
    contado: false,
  };
}

function vrMjGuepardoHueco(e, velocidad) {
  return Math.max(e.ancho * 0.6, velocidad * 0.8) + Math.random() * e.ancho * 0.5;
}

const VR_MJ_GUEPARDO = {
  id: "guepardo",
  nombre: "Guepardo del desierto",
  como: "Toca la pantalla para saltar. Esquiva los cactus y las rocas.",
  objetivo: 12,
  unidad: "obstáculos",
  acelera: true,
  factorMax: 2.4,

  iniciar(ancho, alto) {
    const e = {
      ancho,
      alto,
      puntos: 0,
      y: 0, // altura sobre el suelo, positiva hacia arriba
      vy: 0,
      enSuelo: true,
      paso: 0,
      duna: 0,
      obstaculos: [],
    };
    let x = ancho * 1.15;
    for (let i = 0; i < 3; i++) {
      e.obstaculos.push(vrMjGuepardoNuevoObstaculo(e, x, 1));
      x += vrMjGuepardoHueco(e, ancho * 0.62);
    }
    return e;
  },

  pulsar(e) {
    // Sin doble salto: saltar en el aire no hace nada.
    if (!e.enSuelo) return;
    e.vy = e.alto * VR_MJ_GUEPARDO_IMPULSO;
    e.enSuelo = false;
  },

  redimensionar(e, m) {
    const fx = m.ancho / m.anchoAntes;
    const fy = m.alto / m.altoAntes;
    e.ancho = m.ancho;
    e.alto = m.alto;
    e.y *= fy;
    e.vy *= fy;
    e.obstaculos.forEach((o) => {
      o.x *= fx;
      o.ancho *= fx;
      o.alto *= fy;
    });
  },

  actualizar(e, dt, factor) {
    const velocidad = e.ancho * 0.62 * factor;
    e.paso += dt * 14 * factor;
    e.duna += velocidad * dt * 0.12;

    if (!e.enSuelo) {
      e.vy -= e.alto * VR_MJ_GUEPARDO_GRAVEDAD * dt;
      e.y += e.vy * dt;
      if (e.y <= 0) {
        e.y = 0;
        e.vy = 0;
        e.enSuelo = true;
      }
    }

    const suelo = e.alto * VR_MJ_GUEPARDO_SUELO;
    const guepardoAlto = e.alto * 0.095;
    const guepardoAncho = guepardoAlto * (20 / 12);
    const guepardoX = e.ancho * 0.18;
    // Caja bastante más estrecha que el dibujo: el sprite lleva cola y patas
    // traseras que no deberían costarte la partida.
    const caja = {
      x: guepardoX + guepardoAncho * 0.35,
      y: suelo - e.y - guepardoAlto * 0.92,
      ancho: guepardoAncho * 0.5,
      alto: guepardoAlto * 0.82,
    };

    for (const o of e.obstaculos) {
      o.x -= velocidad * dt;
      const cajaObstaculo = { x: o.x, y: suelo - o.alto, ancho: o.ancho, alto: o.alto };
      if (vrMjChocan(caja, cajaObstaculo)) return false;
      if (!o.contado && o.x + o.ancho < guepardoX) {
        o.contado = true;
        e.puntos++;
      }
    }

    while (e.obstaculos.length && e.obstaculos[0].x + e.obstaculos[0].ancho < -e.ancho * 0.1) {
      e.obstaculos.shift();
    }
    const ultimo = e.obstaculos[e.obstaculos.length - 1];
    if (!ultimo || ultimo.x < e.ancho) {
      const x = (ultimo ? ultimo.x : e.ancho) + vrMjGuepardoHueco(e, velocidad);
      e.obstaculos.push(vrMjGuepardoNuevoObstaculo(e, x, factor));
    }

    return true;
  },

  pintar(ctx, e) {
    const suelo = e.alto * VR_MJ_GUEPARDO_SUELO;

    ctx.fillStyle = vrMjDegradado(ctx, e.alto, "#f0a24a", "#8c3d1f");
    ctx.fillRect(0, 0, e.ancho, e.alto);

    // Sol
    ctx.fillStyle = "rgba(255, 240, 200, 0.85)";
    ctx.beginPath();
    ctx.arc(e.ancho * 0.78, e.alto * 0.14, e.alto * 0.055, 0, Math.PI * 2);
    ctx.fill();

    // Dunas de fondo con parallax lento: dos ondas desfasadas, dibujadas como
    // arcos anchos que se repiten cada media pantalla.
    ctx.fillStyle = "rgba(120, 52, 26, 0.55)";
    ctx.beginPath();
    ctx.moveTo(0, suelo);
    for (let x = 0; x <= e.ancho; x += e.ancho / 24) {
      const onda = Math.sin((x + e.duna) / (e.ancho * 0.28)) * e.alto * 0.05;
      ctx.lineTo(x, suelo - e.alto * 0.11 + onda);
    }
    ctx.lineTo(e.ancho, suelo);
    ctx.closePath();
    ctx.fill();

    // Suelo
    ctx.fillStyle = "#c97a3c";
    ctx.fillRect(0, suelo, e.ancho, e.alto - suelo);
    ctx.fillStyle = "rgba(90, 40, 18, 0.35)";
    ctx.fillRect(0, suelo, e.ancho, e.alto * 0.008);

    e.obstaculos.forEach((o) => {
      ctx.fillStyle = o.doble ? "#5f3116" : "#2f6b3a";
      vrMjRectRedondo(ctx, o.x, suelo - o.alto, o.ancho, o.alto, e.ancho * 0.012);
      ctx.fill();
      if (!o.doble) {
        // Brazos del cactus
        ctx.fillRect(o.x - o.ancho * 0.5, suelo - o.alto * 0.72, o.ancho * 0.5, o.alto * 0.14);
        ctx.fillRect(o.x + o.ancho, suelo - o.alto * 0.55, o.ancho * 0.5, o.alto * 0.14);
      }
    });

    const guepardoAlto = e.alto * 0.095;
    const guepardoAncho = guepardoAlto * (20 / 12);
    const guepardoX = e.ancho * 0.18;
    const y = suelo - e.y - guepardoAlto;

    // Sombra: se encoge al saltar, que es lo que da sensación de altura.
    const sombra = Math.max(0.25, 1 - e.y / (e.alto * 0.26));
    ctx.fillStyle = "rgba(60, 25, 10, 0.3)";
    ctx.beginPath();
    ctx.ellipse(
      guepardoX + guepardoAncho / 2,
      suelo + e.alto * 0.006,
      (guepardoAncho / 2) * sombra,
      e.alto * 0.01 * sombra,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    const sprite = e.enSuelo
      ? Math.floor(e.paso) % 2
        ? "guepardoB"
        : "guepardoA"
      : "guepardoSalto";
    vrMjPintarSprite(ctx, sprite, guepardoX, y, guepardoAlto);
  },
};
