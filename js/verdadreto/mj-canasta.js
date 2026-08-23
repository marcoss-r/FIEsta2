// Minijuego «Tiros a canasta» (md/PLAN_MODO_ARCADE.md §6 Fase F).
// 30 segundos metiendo las que puedas. Se arrastra el dedo desde la pelota y al
// soltar sale con la dirección y la fuerza del gesto.
//
// A diferencia de los otros tres, este NO es plano: la pelota se mueve en un
// mundo de TRES dimensiones (x lateral, y altura, z distancia) medido en metros
// con gravedad real, y se proyecta a la pantalla con una cámara de verdad. Eso
// es lo que da la sensación de que la canasta está lejos: la pista converge
// hacia el horizonte, la pelota encoge según se aleja y su sombra corre por el
// suelo. Un aro dibujado a la altura de la pelota parecería estar encima.
//
// Es también el único minijuego que no acelera (decisión del usuario): la
// dificultad la pone el aro, que se desplaza en horizontal.

// --- El mundo, en metros ---
const VR_MJ_CANASTA_G = 9.8;
const VR_MJ_CANASTA_CAMARA_Y = 1.76; // altura de la cámara
const VR_MJ_CANASTA_ARO_Y = 3.05; // altura reglamentaria del aro
const VR_MJ_CANASTA_ARO_Z = 5.5; // a qué distancia está la canasta
// Aro de feria, no reglamentario (0,225): con el reglamentario, a esta
// distancia el aro sale a 55 px en un móvil y no se ve. 0,32 lo deja en unos
// 78 px, que es donde se lee bien sin que parezca que lo tienes encima.
const VR_MJ_CANASTA_ARO_R = 0.32;
const VR_MJ_CANASTA_BOLA_R = 0.12;
const VR_MJ_CANASTA_TABLERO_Z = 5.75;
const VR_MJ_CANASTA_TABLERO_ALTO = 0.9;
const VR_MJ_CANASTA_TABLERO_MEDIO = 0.75; // medio ancho del tablero
const VR_MJ_CANASTA_ARO_RECORRIDO = 1; // hasta dónde se va el aro a cada lado
const VR_MJ_CANASTA_ARO_VELOCIDAD = 0.55; // m/s

const VR_MJ_CANASTA_SALIDA = { x: 0, y: 0.9, z: 2.3 };

// El tiro "perfecto": con estas velocidades la pelota tarda 0,95 s en recorrer
// los 3,2 m que la separan del aro, llega justo a 3,05 m de altura y ya está
// bajando (−2,4 m/s) cuando cruza. Un gesto de 0,30 altos de pantalla hacia
// arriba equivale a potencia 1, o sea a este tiro exacto con el aro centrado.
const VR_MJ_CANASTA_V_Y = 6.92;
const VR_MJ_CANASTA_V_Z = 3.37;
const VR_MJ_CANASTA_V_X = 3.5;
const VR_MJ_CANASTA_GESTO = 0.3;
const VR_MJ_CANASTA_POTENCIA_MAX = 1.8;

// Para que cuente hay que meterla por el agujero: el centro de la pelota tiene
// que pasar a menos de esto del centro del aro. Lo estricto sería 0,20 (0,32
// del aro menos 0,12 de la pelota); se es algo generoso a propósito.
const VR_MJ_CANASTA_ENTRA = 0.18;

// --- La pista, en metros (para las líneas del suelo) ---
const VR_MJ_CANASTA_FONDO_Z = 6.7; // línea de fondo, por detrás del tablero
const VR_MJ_CANASTA_ZONA_R = 1.25; // semicírculo de la zona restringida

// --- Cámara ---
// Proyección de perspectiva de toda la vida: lo que está lejos se ve pequeño y
// cerca del horizonte. `escala` es cuántos píxeles mide un metro a esa
// distancia, y es lo que hace encoger a la pelota mientras vuela.
function vrMjCanastaCamara(ancho, alto) {
  return { f: alto * 1.05, horizonte: alto * 0.467, centro: ancho / 2 };
}

function vrMjCanastaProyectar(e, x, y, z) {
  const c = e.camara;
  const zz = Math.max(z, 0.4); // nunca por detrás de la cámara
  return {
    x: c.centro + (c.f * x) / zz,
    y: c.horizonte + (c.f * (VR_MJ_CANASTA_CAMARA_Y - y)) / zz,
    escala: c.f / zz,
  };
}

function vrMjCanastaNuevaPelota(e) {
  e.pelota = {
    x: VR_MJ_CANASTA_SALIDA.x,
    y: VR_MJ_CANASTA_SALIDA.y,
    z: VR_MJ_CANASTA_SALIDA.z,
    vx: 0,
    vy: 0,
    vz: 0,
    volando: false,
    encestada: false,
    giro: 0,
  };
  e.arrastre = null;
  e.espera = 0;
}

// Traduce un gesto de pantalla a una velocidad de salida. El componente hacia
// ARRIBA del gesto da la potencia (y reparte entre altura y distancia en una
// proporción fija, que es lo que mantiene el arco reconocible); el componente
// lateral apunta a izquierda o derecha.
function vrMjCanastaVelocidad(e, dx, dy) {
  const unidad = e.alto * VR_MJ_CANASTA_GESTO;
  const potencia = Math.min(-dy / unidad, VR_MJ_CANASTA_POTENCIA_MAX);
  const lateral = dx / unidad;
  return {
    vx: lateral * VR_MJ_CANASTA_V_X,
    vy: potencia * VR_MJ_CANASTA_V_Y,
    vz: potencia * VR_MJ_CANASTA_V_Z,
  };
}

const VR_MJ_CANASTA = {
  id: "canasta",
  nombre: "Tiros a canasta 🏀",
  como: "Arrastra hacia arriba desde la pelota y suelta para tirar. Cuanto más largo el gesto, más lejos llega.",
  objetivo: 6,
  unidad: "canastas",
  acelera: false,
  duracion: 30,

  iniciar(ancho, alto) {
    const e = {
      ancho,
      alto,
      camara: vrMjCanastaCamara(ancho, alto),
      puntos: 0,
      aroX: 0,
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
    // Un roce sin intención no dispara, y hacia abajo tampoco se tira.
    if (Math.hypot(dx, dy) < e.alto * 0.02 || dy >= 0) return;

    const v = vrMjCanastaVelocidad(e, dx, dy);
    e.pelota.vx = v.vx;
    e.pelota.vy = v.vy;
    e.pelota.vz = v.vz;
    e.pelota.volando = true;
  },

  // Al cambiar el tamaño de la pantalla solo hay que rehacer la cámara: el
  // mundo está en metros y no se entera de los píxeles. (En los otros tres
  // minijuegos, que trabajan en píxeles, hay que reescalar todo a mano.)
  redimensionar(e, m) {
    e.ancho = m.ancho;
    e.alto = m.alto;
    e.camara = vrMjCanastaCamara(m.ancho, m.alto);
    e.arrastre = null;
  },

  actualizar(e, dt) {
    // El aro va y viene entre los dos márgenes, a velocidad constante.
    const aroAntes = e.aroX;
    e.aroX += e.aroDir * VR_MJ_CANASTA_ARO_VELOCIDAD * dt;
    if (e.aroX < -VR_MJ_CANASTA_ARO_RECORRIDO) {
      e.aroX = -VR_MJ_CANASTA_ARO_RECORRIDO;
      e.aroDir = 1;
    } else if (e.aroX > VR_MJ_CANASTA_ARO_RECORRIDO) {
      e.aroX = VR_MJ_CANASTA_ARO_RECORRIDO;
      e.aroDir = -1;
    }

    if (e.aviso > 0) e.aviso -= dt;

    // Durante la espera la pelota SIGUE con su física, para que se la vea caer
    // por la red antes de que aparezca la siguiente.
    if (e.espera > 0) {
      e.espera -= dt;
      if (e.espera <= 0) {
        vrMjCanastaNuevaPelota(e);
        return true;
      }
    }

    const p = e.pelota;
    if (!p.volando) return true;

    const antes = { x: p.x, y: p.y, z: p.z };

    // Integración exacta para aceleración constante: la posición usa la
    // velocidad MEDIA del paso (de ahí el −½gΔt²), y la velocidad se actualiza
    // después. Hacerlo al revés (restar la gravedad y luego avanzar con la
    // velocidad ya nueva) deja la parábola por debajo de la real en ½gΔt·t, un
    // error que DEPENDE DE LOS FPS: el mismo gesto se comportaría distinto en
    // una pantalla de 60 Hz y en una de 120 Hz, y el tiro calculado como
    // perfecto se quedaba 15 cm corto.
    p.x += p.vx * dt;
    p.y += p.vy * dt - 0.5 * VR_MJ_CANASTA_G * dt * dt;
    p.z += p.vz * dt;
    p.vy -= VR_MJ_CANASTA_G * dt;
    p.giro += dt * 6;

    // Interpola dónde estaba la pelota (y el aro) en el instante exacto en que
    // cruzó un plano, siendo `t` la fracción del paso en que ocurrió. Mirar la
    // posición del FINAL del paso es lo que hacía que el tablero no siempre
    // rebotara: la pelota cruzaba su plano a la altura correcta, pero para
    // cuando terminaba el fotograma ya estaba por encima o por debajo.
    const enCruce = (t) => ({
      x: antes.x + (p.x - antes.x) * t,
      y: antes.y + (p.y - antes.y) * t,
      z: antes.z + (p.z - antes.z) * t,
      aroX: aroAntes + (e.aroX - aroAntes) * t,
    });

    // --- Tablero: frena a la pelota que llega por delante ---
    if (antes.z < VR_MJ_CANASTA_TABLERO_Z && p.z >= VR_MJ_CANASTA_TABLERO_Z) {
      const t = (VR_MJ_CANASTA_TABLERO_Z - antes.z) / (p.z - antes.z);
      const c = enCruce(t);
      if (
        c.y > VR_MJ_CANASTA_ARO_Y &&
        c.y < VR_MJ_CANASTA_ARO_Y + VR_MJ_CANASTA_TABLERO_ALTO &&
        Math.abs(c.x - c.aroX) < VR_MJ_CANASTA_TABLERO_MEDIO
      ) {
        p.z = VR_MJ_CANASTA_TABLERO_Z - 0.02;
        p.vz = -Math.abs(p.vz) * 0.5;
      }
    }

    // --- Plano del aro: aquí se decide si entra, si rebota en el hierro o si
    // pasa de largo. Se mira el CRUCE de la altura del aro entre dos
    // fotogramas, no la posición suelta: a esta velocidad la pelota puede
    // saltarse el plano entero dentro de un mismo fotograma.
    const cruzaAro = (antes.y - VR_MJ_CANASTA_ARO_Y) * (p.y - VR_MJ_CANASTA_ARO_Y) < 0;
    if (cruzaAro && !p.encestada) {
      const t = (antes.y - VR_MJ_CANASTA_ARO_Y) / (antes.y - p.y);
      const c = enCruce(t);
      const d = Math.hypot(c.x - c.aroX, c.z - VR_MJ_CANASTA_ARO_Z);

      if (d < VR_MJ_CANASTA_ENTRA && p.vy < 0) {
        p.encestada = true;
        e.puntos++;
        e.aviso = 0.7;
        // No se espera a que la pelota llegue al suelo: en 30 s, ese segundo
        // de caída muerta se come dos o tres tiros.
        e.espera = 0.6;
      } else if (d < VR_MJ_CANASTA_ARO_R + VR_MJ_CANASTA_BOLA_R) {
        // Hierro: rebota y sale despedida hacia fuera del aro.
        p.vy *= -0.45;
        p.y = VR_MJ_CANASTA_ARO_Y + (p.vy > 0 ? 0.02 : -0.02);
        const fuera = Math.max(d, 0.001);
        p.vx += ((c.x - c.aroX) / fuera) * 1.2;
        p.vz += ((c.z - VR_MJ_CANASTA_ARO_Z) / fuera) * 1.2;
      }
    }

    // --- Suelo ---
    // El suelo es un SUELO: la pelota se queda encima, bota una vez y se acaba
    // el tiro. Antes solo se programaba la siguiente pelota y la física seguía
    // corriendo, así que la pelota atravesaba el parqué y se iba hacia abajo.
    if (p.y <= VR_MJ_CANASTA_BOLA_R) {
      p.y = VR_MJ_CANASTA_BOLA_R;
      p.vy = Math.abs(p.vy) * 0.42;
      p.vx *= 0.7;
      p.vz *= 0.7;
      if (e.espera <= 0) e.espera = 0.5;
      // Por debajo de este bote ya no queda energía: se para del todo, que si
      // no la pelota tirita en el suelo hasta que aparece la siguiente.
      if (p.vy < 1) {
        p.vy = 0;
        p.vx = 0;
        p.vz = 0;
      }
    }

    // --- Fuera de juego: siguiente tiro ---
    const fuera =
      p.z > VR_MJ_CANASTA_FONDO_Z + 1.5 || p.z < 0.6 || Math.abs(p.x) > 4;
    if (fuera && e.espera <= 0) e.espera = 0.35;

    return true;
  },

  pintar(ctx, e) {
    const c = e.camara;
    const suelo = (x, z) => vrMjCanastaProyectar(e, x, 0, z);

    // Fondo: pabellón oscuro por encima del horizonte.
    ctx.fillStyle = vrMjDegradado(ctx, e.alto, "#2a0d12", "#150609");
    ctx.fillRect(0, 0, e.ancho, e.alto);

    // --- Parqué ---
    // Solo se ve el suelo a partir de unos 3,5 m (más cerca cae por debajo del
    // borde inferior), así que se pinta un trapecio generoso y el canvas
    // recorta lo que sobra.
    const cercaIzq = suelo(-9, 1);
    const cercaDer = suelo(9, 1);
    const lejosIzq = suelo(-9, 40);
    const lejosDer = suelo(9, 40);
    ctx.fillStyle = "#a35c2a";
    ctx.beginPath();
    ctx.moveTo(cercaIzq.x, cercaIzq.y);
    ctx.lineTo(lejosIzq.x, lejosIzq.y);
    ctx.lineTo(lejosDer.x, lejosDer.y);
    ctx.lineTo(cercaDer.x, cercaDer.y);
    ctx.closePath();
    ctx.fill();

    // Duelas: líneas que corren HACIA el fondo y convergen. Son las que hacen
    // el trabajo de la perspectiva; una cuadrícula (con líneas cruzadas
    // también a lo ancho) parece un tablero de ajedrez, no una pista.
    ctx.strokeStyle = "rgba(60, 26, 10, 0.35)";
    ctx.lineWidth = 1;
    for (let x = -3.2; x <= 3.2; x += 0.4) {
      const a = suelo(x, 1.2);
      const b = suelo(x, 40);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // --- Líneas de la pista ---
    ctx.strokeStyle = "rgba(249, 232, 234, 0.85)";
    ctx.lineWidth = 2;

    // Línea de fondo, por detrás del tablero.
    const fondoA = suelo(-9, VR_MJ_CANASTA_FONDO_Z);
    const fondoB = suelo(9, VR_MJ_CANASTA_FONDO_Z);
    ctx.beginPath();
    ctx.moveTo(fondoA.x, fondoA.y);
    ctx.lineTo(fondoB.x, fondoB.y);
    ctx.stroke();

    // Semicírculo de la zona restringida, centrado bajo la canasta. Se proyecta
    // punto a punto: una elipse de canvas no valdría, porque en perspectiva un
    // círculo del suelo no es una elipse centrada en su propio centro.
    ctx.beginPath();
    for (let i = 0; i <= 28; i++) {
      const a = Math.PI + (i / 28) * Math.PI;
      const punto = suelo(
        Math.cos(a) * VR_MJ_CANASTA_ZONA_R,
        VR_MJ_CANASTA_ARO_Z - Math.sin(a) * VR_MJ_CANASTA_ZONA_R
      );
      if (i) ctx.lineTo(punto.x, punto.y);
      else ctx.moveTo(punto.x, punto.y);
    }
    ctx.stroke();

    // Marca del tiro libre: un trocito de línea a la altura del tirador, para
    // que se note desde dónde se lanza.
    const marcaA = suelo(-0.6, VR_MJ_CANASTA_SALIDA.z + 1.4);
    const marcaB = suelo(0.6, VR_MJ_CANASTA_SALIDA.z + 1.4);
    ctx.strokeStyle = "rgba(249, 232, 234, 0.45)";
    ctx.beginPath();
    ctx.moveTo(marcaA.x, marcaA.y);
    ctx.lineTo(marcaB.x, marcaB.y);
    ctx.stroke();

    const pAro = vrMjCanastaProyectar(e, e.aroX, VR_MJ_CANASTA_ARO_Y, VR_MJ_CANASTA_ARO_Z);
    const radioAro = VR_MJ_CANASTA_ARO_R * pAro.escala;
    // La elipse del aro se DIBUJA más abierta de lo que tocaría: proyectada de
    // verdad, un aro a esta distancia visto casi a su misma altura mide dos
    // píxeles de alto y se lee como una raya. Exagerarla es lo que permite ver
    // si la pelota va a entrar o no.
    const radioAroY = radioAro * 0.3;

    // --- Poste y tablero ---
    const pPosteAlto = vrMjCanastaProyectar(
      e,
      e.aroX,
      VR_MJ_CANASTA_ARO_Y,
      VR_MJ_CANASTA_TABLERO_Z
    );
    const pPosteSuelo = suelo(e.aroX, VR_MJ_CANASTA_TABLERO_Z + 0.5);
    ctx.strokeStyle = "#5c6470";
    ctx.lineWidth = Math.max(2, 0.08 * pAro.escala);
    ctx.beginPath();
    ctx.moveTo(pPosteAlto.x, pPosteAlto.y);
    ctx.lineTo(pPosteSuelo.x, pPosteSuelo.y);
    ctx.stroke();

    const tabArriba = vrMjCanastaProyectar(
      e,
      e.aroX - VR_MJ_CANASTA_TABLERO_MEDIO,
      VR_MJ_CANASTA_ARO_Y + VR_MJ_CANASTA_TABLERO_ALTO,
      VR_MJ_CANASTA_TABLERO_Z
    );
    const tabAbajo = vrMjCanastaProyectar(
      e,
      e.aroX + VR_MJ_CANASTA_TABLERO_MEDIO,
      VR_MJ_CANASTA_ARO_Y,
      VR_MJ_CANASTA_TABLERO_Z
    );
    const tabAncho = tabAbajo.x - tabArriba.x;
    const tabAlto = tabAbajo.y - tabArriba.y;
    ctx.fillStyle = "rgba(249, 232, 234, 0.94)";
    vrMjRectRedondo(ctx, tabArriba.x, tabArriba.y, tabAncho, tabAlto, tabAncho * 0.04);
    ctx.fill();
    ctx.strokeStyle = "#c22334";
    ctx.lineWidth = Math.max(1.5, tabAncho * 0.03);
    ctx.strokeRect(
      tabArriba.x + tabAncho * 0.28,
      tabArriba.y + tabAlto * 0.4,
      tabAncho * 0.44,
      tabAlto * 0.52
    );

    const p = e.pelota;
    const pBola = vrMjCanastaProyectar(e, p.x, p.y, p.z);
    const radioBola = VR_MJ_CANASTA_BOLA_R * pBola.escala;

    // --- Sombra en el suelo ---
    // Junto con el tamaño de la pelota, es la pista que dice a qué altura y a
    // qué distancia está: sin ella no se sabe si va corta o va alta.
    const pSombra = suelo(p.x, p.z);
    ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
    ctx.beginPath();
    ctx.ellipse(
      pSombra.x,
      pSombra.y,
      VR_MJ_CANASTA_BOLA_R * pSombra.escala,
      VR_MJ_CANASTA_BOLA_R * pSombra.escala * 0.35,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // --- Aro: mitad de atrás, red, pelota, mitad de delante ---
    // Ese orden es el que hace que una pelota que entra se vea PASAR POR
    // DENTRO: queda tapada por el hierro cercano y por delante del lejano.
    ctx.lineWidth = Math.max(2.5, 0.055 * pAro.escala);
    ctx.strokeStyle = "#a81b2a";
    ctx.beginPath();
    ctx.ellipse(pAro.x, pAro.y, radioAro, radioAroY, 0, 0, Math.PI);
    ctx.stroke();

    ctx.strokeStyle = "rgba(249, 232, 234, 0.5)";
    ctx.lineWidth = 1;
    const largoRed = 0.42 * pAro.escala;
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI + (i / 8) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(pAro.x + Math.cos(a) * radioAro, pAro.y + Math.sin(a) * radioAroY);
      ctx.lineTo(pAro.x + Math.cos(a) * radioAro * 0.45, pAro.y + largoRed);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(pAro.x, pAro.y + largoRed, radioAro * 0.45, radioAroY * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();

    // --- Previsualización del tiro ---
    if (e.arrastre) {
      const v = vrMjCanastaVelocidad(
        e,
        e.arrastre.x - e.arrastre.x0,
        e.arrastre.y - e.arrastre.y0
      );
      ctx.fillStyle = "rgba(249, 232, 234, 0.55)";
      for (let i = 1; i <= 26; i++) {
        const t = i * 0.05;
        const y = p.y + v.vy * t - 0.5 * VR_MJ_CANASTA_G * t * t;
        if (y < 0) break;
        const punto = vrMjCanastaProyectar(e, p.x + v.vx * t, y, p.z + v.vz * t);
        ctx.beginPath();
        ctx.arc(punto.x, punto.y, Math.max(1.2, 0.02 * punto.escala), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.save();
    ctx.translate(pBola.x, pBola.y);
    ctx.rotate(p.giro);
    vrMjPintarSprite(ctx, "pelota", -radioBola, -radioBola, radioBola * 2);
    ctx.restore();

    ctx.strokeStyle = "#ff4d5a";
    ctx.lineWidth = Math.max(2.5, 0.055 * pAro.escala);
    ctx.beginPath();
    ctx.ellipse(pAro.x, pAro.y, radioAro, radioAroY, 0, Math.PI, Math.PI * 2);
    ctx.stroke();

    if (e.aviso > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, e.aviso / 0.7);
      ctx.fillStyle = "#34c759";
      ctx.textAlign = "center";
      ctx.font = "700 " + Math.round(e.alto * 0.05) + "px system-ui, sans-serif";
      ctx.fillText("¡DENTRO!", e.ancho / 2, e.alto * 0.4);
      ctx.restore();
    }
  },
};
