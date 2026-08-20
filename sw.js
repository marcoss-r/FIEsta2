// Service worker de FIEsta 2: cachea todos los archivos para que la app se
// pueda instalar y funcione sin conexión. Para publicar una actualización,
// sube el número de versión (CACHE) y se refrescará en el siguiente arranque.
// CACHE y APP_VERSION (js/nucleo/arranque.js) van unificados.
const CACHE = "fiesta2-v1.10.2";

const ARCHIVOS = [
  "./",
  "./index.html",
  "./css/estilos.css",
  "./js/nucleo/pantallas.js",
  "./js/nucleo/util.js",
  "./js/nucleo/persistencia.js",
  "./js/nucleo/jugadores.js",
  "./js/nucleo/intensidad.js",
  "./js/nucleo/plantillas.js",
  "./js/nucleo/handoff.js",
  "./data/comun/castigos.js",
  "./data/yonunca/frases.js",
  "./data/quienmas/preguntas.js",
  "./data/verdadreto/verdades.js",
  "./data/verdadreto/retos.js",
  "./data/dosmentiras/temas.js",
  "./data/impostor/palabras.js",
  "./js/yonunca/main.js",
  "./js/quienmas/main.js",
  "./js/verdadreto/main.js",
  "./js/dosmentiras/main.js",
  "./js/impostor/main.js",
  "./js/nucleo/arranque.js",
  "./site.webmanifest",
  "./icons/icono.svg",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

// Al instalar: guardar todos los archivos en caché.
// `cache: "reload"` obliga a pedirlos a la RED, saltándose la caché HTTP del
// navegador. Sin esto, subir CACHE no basta: el service worker nuevo puede
// volver a guardar copias viejas que el navegador aún tenía cacheadas por su
// max-age, y la versión nueva sigue sin verse (§2.6).
self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ARCHIVOS.map((url) => new Request(url, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

// Al activar: borrar cachés de versiones antiguas.
self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c)))
      )
      .then(() => self.clients.claim())
  );
});

// Al pedir un recurso: servir de la caché y, si no está, ir a la red.
self.addEventListener("fetch", (evento) => {
  if (evento.request.method !== "GET") return;
  evento.respondWith(
    caches.match(evento.request).then((cacheado) => {
      return (
        cacheado ||
        fetch(evento.request).catch(() => caches.match("./index.html"))
      );
    })
  );
});
