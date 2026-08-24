// Minijuego «Pez volador» (md/PLAN_MODO_ARCADE.md §6 Fase C).
// El clásico del pájaro, pero bajo el agua: el pez cae solo y cada toque lo
// impulsa hacia arriba. Hay que colarse por el hueco entre corales.
//
// Todo se guarda en píxeles y `redimensionar` reescala: es más corto que llevar
// coordenadas normalizadas y tener que convertir en cada colisión.

const VR_MJ_PEZ_SEPARACION = 0.8; // distancia entre corales, en anchos de pantalla
const VR_MJ_PEZ_HUECO = 0.3; // alto del hueco, en altos de pantalla

// El hueco se estrecha según acelera el juego, pero nunca por debajo de 0.19:
// más apretado que eso deja de ser difícil y pasa a ser cuestión de suerte.
function vrMjPezHueco(alto, factor) {
  return alto * Math.max(0.19, VR_MJ_PEZ_HUECO / Math.pow(factor, 0.35));
}

function vrMjPezNuevoCoral(e, x, factor) {
  const huecoAlto = vrMjPezHueco(e.alto, factor);
  const margen = e.alto * 0.1;
  const huecoY = margen + Math.random() * (e.alto - huecoAlto - margen * 2);
  return { x, ancho: e.ancho * 0.15, huecoY, huecoAlto, contado: false };
}

const VR_MJ_PEZ = {
  id: "pez",
  nombre: "Pez volador",
  como: "Toca la pantalla para nadar hacia arriba. Cuélate por el hueco entre los corales.",
  objetivo: 12,
  unidad: "corales",
  acelera: true,
  factorMax: 2.4,

  iniciar(ancho, alto) {
    const e = {
      ancho,
      alto,
      puntos: 0,
      y: alto * 0.42,
      vy: 0,
      aleteo: 0,
      corales: [],
      burbujas: [],
    };
    for (let i = 0; i < 3; i++) {
      e.corales.push(vrMjPezNuevoCoral(e, ancho * (1.1 + i * VR_MJ_PEZ_SEPARACION), 1));
    }
    for (let i = 0; i < 14; i++) {
      e.burbujas.push({
        x: Math.random() * ancho,
        y: Math.random() * alto,
        r: alto * (0.004 + Math.random() * 0.008),
        v: alto * (0.04 + Math.random() * 0.08),
      });
    }
    return e;
  },

  pulsar(e) {
    e.vy = -e.alto * 0.72;
  },

  redimensionar(e, m) {
    const fx = m.ancho / m.anchoAntes;
    const fy = m.alto / m.altoAntes;
    e.ancho = m.ancho;
    e.alto = m.alto;
    e.y *= fy;
    e.vy *= fy;
    e.corales.forEach((c) => {
      c.x *= fx;
      c.ancho *= fx;
      c.huecoY *= fy;
      c.huecoAlto *= fy;
    });
    e.burbujas.forEach((b) => {
      b.x *= fx;
      b.y *= fy;
    });
  },

  actualizar(e, dt, factor) {
    e.aleteo += dt * 11;
    e.vy += e.alto * 2.2 * dt;
    e.y += e.vy * dt;

    const pezAlto = e.alto * 0.055;
    const pezAncho = pezAlto * (16 / 11);
    const pezX = e.ancho * 0.26;

    // Tocar la superficie o el fondo también mata: si no, se puede "surfear"
    // por el borde de arriba y pasarse el juego entero sin jugar.
    if (e.y < 0 || e.y + pezAlto > e.alto) return false;

    // Caja de colisión un pelín más pequeña que el dibujo: perdonar un par de
    // píxeles hace que el juego se sienta justo en vez de tramposo.
    const caja = {
      x: pezX + pezAncho * 0.12,
      y: e.y + pezAlto * 0.15,
      ancho: pezAncho * 0.76,
      alto: pezAlto * 0.7,
    };

    const velocidad = e.ancho * 0.55 * factor * dt;
    for (const c of e.corales) {
      c.x -= velocidad;
      const arriba = { x: c.x, y: 0, ancho: c.ancho, alto: c.huecoY };
      const abajo = {
        x: c.x,
        y: c.huecoY + c.huecoAlto,
        ancho: c.ancho,
        alto: e.alto - c.huecoY - c.huecoAlto,
      };
      if (vrMjChocan(caja, arriba) || vrMjChocan(caja, abajo)) return false;
      if (!c.contado && c.x + c.ancho < pezX) {
        c.contado = true;
        e.puntos++;
      }
    }

    while (e.corales.length && e.corales[0].x + e.corales[0].ancho < -e.ancho * 0.1) {
      e.corales.shift();
    }
    const ultimo = e.corales[e.corales.length - 1];
    if (!ultimo || ultimo.x < e.ancho * (1 - VR_MJ_PEZ_SEPARACION + 0.02)) {
      const x = (ultimo ? ultimo.x : e.ancho) + e.ancho * VR_MJ_PEZ_SEPARACION;
      e.corales.push(vrMjPezNuevoCoral(e, x, factor));
    }

    e.burbujas.forEach((b) => {
      b.y -= b.v * dt;
      if (b.y + b.r < 0) {
        b.y = e.alto + b.r;
        b.x = Math.random() * e.ancho;
      }
    });

    return true;
  },

  pintar(ctx, e) {
    ctx.fillStyle = vrMjDegradado(ctx, e.alto, "#123a52", "#06131d");
    ctx.fillRect(0, 0, e.ancho, e.alto);

    ctx.fillStyle = "rgba(255, 255, 255, 0.13)";
    e.burbujas.forEach((b) => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });

    e.corales.forEach((c) => {
      const abajoY = c.huecoY + c.huecoAlto;
      ctx.fillStyle = "#1f7a5e";
      vrMjRectRedondo(ctx, c.x, -e.alto * 0.02, c.ancho, c.huecoY + e.alto * 0.02, e.ancho * 0.03);
      ctx.fill();
      vrMjRectRedondo(ctx, c.x, abajoY, c.ancho, e.alto - abajoY + e.alto * 0.02, e.ancho * 0.03);
      ctx.fill();
      // Boca del coral: una banda más clara para que el hueco se lea de un vistazo.
      ctx.fillStyle = "#2fae86";
      ctx.fillRect(c.x, c.huecoY - e.alto * 0.014, c.ancho, e.alto * 0.014);
      ctx.fillRect(c.x, abajoY, c.ancho, e.alto * 0.014);
    });

    const pezAlto = e.alto * 0.055;
    const pezAncho = pezAlto * (16 / 11);
    const pezX = e.ancho * 0.26;
    // El morro apunta a donde va: cae en picado y sube con la nariz arriba.
    const giro = Math.max(-0.5, Math.min(0.7, e.vy / (e.alto * 1.7)));
    ctx.save();
    ctx.translate(pezX + pezAncho / 2, e.y + pezAlto / 2);
    ctx.rotate(giro);
    vrMjPintarSprite(
      ctx,
      Math.floor(e.aleteo) % 2 ? "pezB" : "pezA",
      -pezAncho / 2,
      -pezAlto / 2,
      pezAlto
    );
    ctx.restore();
  },
};
