// Núcleo de FIEsta 2: arranque de la app y utilidades comunes a todos los juegos.
// Debe cargarse el ÚLTIMO: al terminar muestra el hub de juegos.

// Versión de la app. Al subirla, sube también CACHE en sw.js (otro contexto, no ve esto).
const APP_VERSION = "1.14.2";

// Textos de la ventana de información de cada juego (la ⓘ de las tarjetas del hub).
const INFO_JUEGOS = {
  yn: {
    titulo: "Yo nunca",
    texto:
      "Cada jugador empieza con 5 dedos. Uno de los jugadores lee una frase " +
      "que empieza por «Yo nunca…». Los jugadores que hayan realizado la " +
      "acción que dice la frase, bajan un dedo. En caso del modo fiesta, si " +
      "se ha realizado la acción, los jugadores beben un trago.",
  },
  vr: {
    titulo: "Verdad o Reto",
    texto:
      "Cada jugador elige si responder a una pregunta o si hacer un reto " +
      "aleatorio. En el modo fiesta, se deberá beber cuando se quiera esquivar " +
      "una pregunta o saltarse un reto. El modo arcade añade minijuegos y " +
      "preguntas de cultura general a los retos mediante una ruleta de la suerte.",
  },
  qm: {
    titulo: "Quién es más…",
    texto:
      "Un jugador lee una pregunta que empieza por «Quién es más…». Se " +
      "contará hasta tres y todos los jugadores señalarán a la persona con la " +
      "que más se identifique esa frase. En modo fiesta, beberá un trago el " +
      "que tenga más votos. En el modo parejas, se selecciona una pareja al " +
      "azar entre todos los jugadores, que jugarán ellos solos 8 rondas. Si " +
      "difieren, pierden y si coinciden ganan. Con el modo fiesta, deberán " +
      "beber en caso de no coincidir.",
  },
  dm: {
    titulo: "Dos mentiras y una verdad",
    texto:
      "Cada jugador cuenta dos verdades y una mentira sobre un tema aleatorio. " +
      "El resto del grupo debe averiguar cual es la mentira escondida. En modo " +
      "fiesta, beberán aquellos jugadores que no logren adivinar la mentira.",
  },
  im: {
    titulo: "El Impostor",
    texto:
      "Todos los jugadores reciben la misma palabra excepto el impostor, que " +
      "recibe una pista sobre ella. Por turnos, cada jugador debe decir una " +
      "palabra relacionada con la inicial. Al final de cada ronda, los " +
      "jugadores votan para tratar de encontrar al impostor. En modo fiesta, " +
      "si es encontrado, el impostor beberá un trago doble y si no es " +
      "encontrado, beberán un trago el resto de jugadores.",
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
