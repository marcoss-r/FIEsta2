// Minijuego «Tiros a canasta» (md/PLAN_MODO_ARCADE.md §6 Fase F).
// 30 segundos metiendo las que puedas. Se arrastra el dedo desde la pelota y al
// soltar sale con la dirección y la fuerza del gesto.
//
// Es el único minijuego que NO acelera (decisión del usuario): la dificultad la
// pone el aro, que se desplaza en horizontal a velocidad constante.

// Para encestar hay que meter la pelota POR ARRIBA, así que el tiro tiene que
// subir por encima del aro y caer. Estos tres números están atados entre sí: con
// una gravedad más alta o una fuerza más baja haría falta arrastrar el dedo por
// casi toda la pantalla para llegar al aro, que es justo lo que no queremos.
// Tal y como están, un arrastre de ~1/3 de la pantalla deja la pelota con arco
// de sobra para entrar.
const VR_MJ_CANASTA_GRAVEDAD = 1.8; // en altos de pantalla por segundo²
const VR_MJ_CANASTA_FUERZA = 4.5; // cuánto multiplica el gesto
const VR_MJ_CANASTA_ARO_Y = 0.34; // altura del aro, en altos de pantalla

function vrMjCanastaNuevaPelota(e) {
  e.pelota = {
    x: e.ancho * 0.5,
    y: e.alto * 0.88,
    vx: 0,
    vy: 0,
    volando: false,
    encestada: false,
    giro: 0,
  };
  e.arrastre = null;
  e.espera = 0;
}

const VR_MJ_CANASTA = {
  id: "canasta",
  nombre: "Tiros a canasta 🏀",
  como: "Arrastra desde la pelota y suelta para tirar. Mete las que puedas en 30 segundos.",
  objetivo: 6,
  unidad: "canastas",
  acelera: false,
  duracion: 30,

  iniciar(ancho, alto) {
    const e = {
      ancho,
      alto,
      puntos: 0,
      aroX: ancho * 0.5,
      aroDir: 1,
      pelota: null,
      arrastre: null,
      espera: 0,
      aviso: 0,
    };
    vrMjCanastaNuevaPelota(e);
    return e;
  },

  pulsar(e, x, y) {
    if (e.pelota.volando || e.espera > 0) return;
    e.arrastre = { x0: x, y0: y, x, y };
  },

  mover(e, x, y) {
    if (!e.arrastre) return;
    e.arrastre.x = x;
    e.arrastre.y = y;
  },

  soltar(e, x, y) {
    if (!e.arrastre) return;
    const dx = x - e.arrastre.x0;
    const dy = y - e.arrastre.y0;
    e.arrastre = null;
    // Un roce sin intención no dispara: hace falta un gesto de verdad.
    if (Math.hypot(dx, dy) < e.alto * 0.02) return;

    const maxima = e.alto * 2.2;
    let vx = dx * VR_MJ_CANASTA_FUERZA;
    let vy = dy * VR_MJ_CANASTA_FUERZA;
    const modulo = Math.hypot(vx, vy);
    if (modulo > maxima) {
      vx = (vx / modulo) * maxima;
      vy = (vy / modulo) * maxima;
    }
    e.pelota.vx = vx;
    e.pelota.vy = vy;
    e.pelota.volando = true;
  },

  redimensionar(e, m) {
    const fx = m.ancho / m.anchoAntes;
    const fy = m.alto / m.altoAntes;
    e.ancho = m.ancho;
    e.alto = m.alto;
    e.aroX *= fx;
    e.pelota.x *= fx;
    e.pelota.y *= fy;
    e.pelota.vx *= fx;
    e.pelota.vy *= fy;
    e.arrastre = null;
  },

  actualizar(e, dt) {
    // El aro va y viene entre los dos márgenes. Velocidad constante: este juego
    // no tiene rampa.
    const aroR = e.ancho * 0.11;
    const izquierda = e.ancho * 0.18;
    const derecha = e.ancho * 0.82;
    e.aroX += e.aroDir * e.ancho * 0.14 * dt;
    if (e.aroX < izquierda) {
      e.aroX = izquierda;
      e.aroDir = 1;
    } else if (e.aroX > derecha) {
      e.aroX = derecha;
      e.aroDir = -1;
    }

    if (e.aviso > 0) e.aviso -= dt;

    // Ojo: durante la espera la pelota SIGUE con su física, para que se la vea
    // caer por la red antes de que aparezca la siguiente. Si se cortara aquí,
    // la pelota desaparecería de golpe justo al entrar.
    if (e.espera > 0) {
      e.espera -= dt;
      if (e.espera <= 0) {
        vrMjCanastaNuevaPelota(e);
        return true;
      }
    }

    const p = e.pelota;
    if (!p.volando) return true;

    const radio = e.alto * 0.03;
    const aroY = e.alto * VR_MJ_CANASTA_ARO_Y;
    const yAntes = p.y;

    p.vy += e.alto * VR_MJ_CANASTA_GRAVEDAD * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.giro += p.vx * dt * 0.02;

    // Paredes laterales: rebota, que perder la pelota por salirse de lado es
    // frustrante y no enseña nada.
    if (p.x - radio < 0 && p.vx < 0) {
      p.x = radio;
      p.vx *= -0.6;
    } else if (p.x + radio > e.ancho && p.vx > 0) {
      p.x = e.ancho - radio;
      p.vx *= -0.6;
    }

    // Tablero: solo frena por delante (por la cara que mira al jugador).
    const tableroAncho = e.ancho * 0.3;
    const tableroArriba = e.alto * 0.13;
    const tablero = {
      x: e.aroX - tableroAncho / 2,
      y: tableroArriba,
      ancho: tableroAncho,
      alto: e.alto * 0.05,
    };
    if (
      vrMjChocan(
        { x: p.x - radio, y: p.y - radio, ancho: radio * 2, alto: radio * 2 },
        tablero
      ) &&
      p.vy < 0
    ) {
      p.y = tablero.y + tablero.alto + radio;
      p.vy *= -0.55;
    }

    // Los dos hierros del aro, tratados como puntos: la pelota rebota en ellos.
    [-1, 1].forEach((lado) => {
      const hx = e.aroX + lado * aroR;
      const dx = p.x - hx;
      const dy = p.y - aroY;
      const dist = Math.hypot(dx, dy);
      if (dist < radio && dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;
        const proyeccion = p.vx * nx + p.vy * ny;
        p.vx = (p.vx - 2 * proyeccion * nx) * 0.52;
        p.vy = (p.vy - 2 * proyeccion * ny) * 0.52;
        p.x = hx + nx * radio;
        p.y = aroY + ny * radio;
      }
    });

    // Canasta: cruzar el plano del aro DE ARRIBA ABAJO y por dentro.
    if (
      !p.encestada &&
      yAntes <= aroY &&
      p.y > aroY &&
      p.vy > 0 &&
      Math.abs(p.x - e.aroX) < aroR * 0.88
    ) {
      p.encestada = true;
      e.puntos++;
      e.aviso = 0.7;
      // No se espera a que la pelota llegue al suelo: en 30 s, ese segundo de
      // caída muerta se come dos o tres tiros.
      e.espera = 0.6;
    }

    // Pelota fuera de juego por abajo: siguiente tiro.
    if (p.y - radio > e.alto && e.espera <= 0) e.espera = 0.3;

    return true;
  },

  pintar(ctx, e) {
    const aroR = e.ancho * 0.11;
    const aroY = e.alto * VR_MJ_CANASTA_ARO_Y;
    const radio = e.alto * 0.03;

    ctx.fillStyle = vrMjDegradado(ctx, e.alto, "#3a1219", "#170709");
    ctx.fillRect(0, 0, e.ancho, e.alto);

    // Pista
    ctx.fillStyle = "#7a3a1c";
    ctx.fillRect(0, e.alto * 0.92, e.ancho, e.alto * 0.08);
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.fillRect(0, e.alto * 0.92, e.ancho, e.alto * 0.004);

    // Tablero
    const tableroAncho = e.ancho * 0.3;
    ctx.fillStyle = "#f9e8ea";
    vrMjRectRedondo(
      ctx,
      e.aroX - tableroAncho / 2,
      e.alto * 0.13,
      tableroAncho,
      e.alto * 0.05,
      e.ancho * 0.012
    );
    ctx.fill();
    ctx.strokeStyle = "#c22334";
    ctx.lineWidth = e.ancho * 0.008;
    ctx.strokeRect(
      e.aroX - tableroAncho * 0.22,
      e.alto * 0.145,
      tableroAncho * 0.44,
      e.alto * 0.03
    );

    // Red: unas cuantas líneas que se juntan hacia abajo
    ctx.strokeStyle = "rgba(249, 232, 234, 0.55)";
    ctx.lineWidth = e.ancho * 0.004;
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      ctx.beginPath();
      ctx.moveTo(e.aroX - aroR + 2 * aroR * t, aroY);
      ctx.lineTo(e.aroX - aroR * 0.45 + 0.9 * aroR * t, aroY + e.alto * 0.06);
      ctx.stroke();
    }

    // Aro
    ctx.strokeStyle = "#ff4d5a";
    ctx.lineWidth = e.ancho * 0.016;
    ctx.beginPath();
    ctx.ellipse(e.aroX, aroY, aroR, e.alto * 0.012, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Previsualización del tiro mientras se arrastra: una parábola de puntos,
    // que sin ella acertar es adivinar.
    if (e.arrastre) {
      const dx = (e.arrastre.x - e.arrastre.x0) * VR_MJ_CANASTA_FUERZA;
      const dy = (e.arrastre.y - e.arrastre.y0) * VR_MJ_CANASTA_FUERZA;
      ctx.fillStyle = "rgba(249, 232, 234, 0.5)";
      for (let i = 1; i <= 14; i++) {
        const t = i * 0.05;
        const px = e.pelota.x + dx * t;
        const py = e.pelota.y + dy * t + 0.5 * e.alto * VR_MJ_CANASTA_GRAVEDAD * t * t;
        if (py > e.alto) break;
        ctx.beginPath();
        ctx.arc(px, py, e.alto * 0.005, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const p = e.pelota;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.giro);
    vrMjPintarSprite(ctx, "pelota", -radio, -radio, radio * 2);
    ctx.restore();

    if (e.aviso > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, e.aviso / 0.7);
      ctx.fillStyle = "#34c759";
      ctx.textAlign = "center";
      ctx.font = "700 " + Math.round(e.alto * 0.05) + "px system-ui, sans-serif";
      ctx.fillText("¡DENTRO!", e.ancho / 2, e.alto * 0.5);
      ctx.restore();
    }
  },
};
