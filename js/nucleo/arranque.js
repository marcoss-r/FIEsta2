// Núcleo de FIEsta 2: arranque de la app y utilidades comunes a todos los juegos.
// Debe cargarse el ÚLTIMO: al terminar muestra el hub de juegos.

// Versión de la app. Al subirla, sube también CACHE en sw.js (otro contexto, no ve esto).
const APP_VERSION = "1.5.2";

// Textos de la ventana de información de cada juego (la ⓘ de las tarjetas del hub).
const INFO_JUEGOS = {
  yn: {
    titulo: "Yo nunca",
    texto:
      "El clásico de beber. La app lee una frase que empieza por «Yo nunca…» " +
      "(cosas ya hechas, o cosas que quizá probarías): si es tu caso, baja un " +
      "dedo (todos empezáis con 5, contados a mano) o, si está activo el modo " +
      "fiesta, bebe. La app solo sirve las frases sin repetir y rota quién " +
      "lee: no lleva la cuenta de dedos ni de tragos.",
  },
  vr: {
    titulo: "Verdad o Reto",
    texto:
      "El clásico juego de fiesta: en tu turno eliges Verdad o Reto y la app te " +
      "sirve un contenido al azar, filtrado por los niveles de intensidad " +
      "elegidos. Sin límite de rondas: se juega hasta que alguien decide terminar.",
  },
  qm: {
    titulo: "Quién es más…",
    texto:
      "La app lanza una pregunta sobre el grupo (quién es más probable que…, " +
      "quién sería el primero en…, quién nunca…) y a la de tres todos señalan a " +
      "la vez a quien crean. Se comenta a gritos y se pasa a la siguiente. En el " +
      "modo parejas, la app sortea una pareja de entre todos y le hace 8 " +
      "preguntas: si coinciden se libran, si difieren, bebe quien lleve el modo " +
      "fiesta encendido. Recorre todas las parejas posibles y acaba con un " +
      "ranking.",
  },
  dm: {
    titulo: "Dos mentiras y una verdad",
    texto:
      "En tu turno, la app te da un tema para que cuentes tres cosas sobre ti: " +
      "dos mentiras y una verdad. El grupo debate y vota cuál es la verdadera " +
      "antes de que la reveles.",
  },
  im: {
    titulo: "El Impostor",
    texto:
      "Todos reciben la misma palabra secreta menos el impostor, que solo " +
      "recibe una pista. Por turnos, cada uno dice una palabra relacionada sin " +
      "delatarse ni delatar; al final, el grupo debate y acusa a quien crea que " +
      "es el impostor.",
  },
  pi: {
    titulo: "Preguntas incómodas",
    texto:
      "Preguntas directas y afiladas dirigidas a una persona concreta (o a todo " +
      "el grupo). Responde o paga el castigo del modo fiesta.",
  },
};

// Botones "Atrás": cualquier botón con data-volver navega solo, sin JS específico.
function conectarNavegacionGenerica() {
  document.querySelectorAll("[data-volver]").forEach((boton) => {
    boton.addEventListener("click", () => mostrarPantalla(boton.dataset.volver));
  });
}

// La ⓘ de cada tarjeta del hub abre la ventana de info de su juego; tocar en
// cualquier parte del overlay la cierra (mismo patrón que en FIEsta 1).
function conectarInfoJuegos() {
  const overlay = document.getElementById("info-juego");
  document.querySelectorAll(".juego-card-info").forEach((icono) => {
    icono.addEventListener("click", (evento) => {
      // Que el toque no llegue a la tarjeta: abriría el juego a la vez.
      evento.stopPropagation();
      const info = INFO_JUEGOS[icono.dataset.info];
      document.getElementById("info-juego-titulo").textContent = info.titulo;
      document.getElementById("info-juego-texto").textContent = info.texto;
      overlay.hidden = false;
    });
  });
  overlay.addEventListener("click", () => {
    overlay.hidden = true;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  conectarNavegacionGenerica();
  conectarInfoJuegos();
  document.getElementById("app-version").textContent = "v" + APP_VERSION;
  // La app siempre arranca en el hub (pantalla "fiesta").
  mostrarPantalla("fiesta");
});

// Registra el service worker (permite instalarla como app y jugar sin conexión).
// Solo funciona sobre http(s), no al abrir el archivo directamente (file://).
if ("serviceWorker" in navigator) {
  // Al publicar una versión nueva, el service worker nuevo se instala y toma
  // el control (skipWaiting + clients.claim en sw.js), pero ESTA página ya se
  // cargó con los archivos viejos: sin recargar, se sigue viendo la versión
  // anterior (en iOS, con la app instalada, puede quedarse así indefinidamente).
  // Al cambiar de controlador, se recarga una vez para estrenar la versión.
  let recargandoPorActualizacion = false;
  const habiaControlador = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // En la primera instalación no había nada que refrescar: no se recarga.
    if (!habiaControlador || recargandoPorActualizacion) return;
    recargandoPorActualizacion = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      /* si falla, la app sigue funcionando igual, solo sin offline */
    });
  });
}
