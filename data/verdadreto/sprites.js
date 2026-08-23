// Pixel art de los minijuegos del modo arcade (md/PLAN_MODO_ARCADE.md §4.2).
//
// No hay carpeta img/ en el proyecto (§4.5 del plan global) y no se crea: cada
// sprite es una PALETA + una MATRIZ DE CARACTERES, y el motor lo convierte una
// sola vez en un canvas fuera de pantalla (vrMjSprite en js/verdadreto/minijuegos.js).
// El punto "." es transparente; el resto de caracteres son claves de la paleta.
//
// Las filas NO tienen por qué medir todas lo mismo: el motor rellena las cortas
// por la derecha con transparente. Aun así conviene escribirlas cuadradas, que
// se lee mucho mejor el dibujo al editarlo.

const VR_SPRITES = {
  // Pez naranja mirando a la DERECHA. Dos fotogramas que solo cambian la cola,
  // para que aletee mientras nada.
  pezA: {
    paleta: { "1": "#ff8a3d", "2": "#ffc078", "3": "#2a0d12", "4": "#f9e8ea", "5": "#e0632a" },
    pixeles: [
      ".......555......",
      "......11111.....",
      "5...122222221...",
      "55.12222222221..",
      ".51222222224321.",
      ".51222222222221.",
      "551222222222221.",
      "5..12222222221..",
      "....122222221...",
      "......11111.....",
      ".......555......",
    ],
  },
  pezB: {
    paleta: { "1": "#ff8a3d", "2": "#ffc078", "3": "#2a0d12", "4": "#f9e8ea", "5": "#e0632a" },
    pixeles: [
      ".......555......",
      "......11111.....",
      "....122222221...",
      "5..12222222221..",
      "551222222224321.",
      ".51222222222221.",
      ".51222222222221.",
      "55.12222222221..",
      "5...122222221...",
      "......11111.....",
      ".......555......",
    ],
  },

  // Guepardo mirando a la DERECHA, con la cola a la izquierda. Dos fotogramas
  // de carrera (las patas cambian) y uno de salto (patas recogidas).
  guepardoA: {
    paleta: { "1": "#e8a33d", "2": "#f7d79a", "3": "#2a0d12", "4": "#f9e8ea" },
    pixeles: [
      "3...................",
      "13..................",
      ".13.............111.",
      "..131..........11111",
      "...1311111111111143.",
      "...13131131131111113",
      "...1112211221111111.",
      "...1111111111111111.",
      "....11..11...11..11.",
      "....11..11...11..11.",
      "...11....1...1....11",
      "..11.....1...1.....1",
    ],
  },
  guepardoB: {
    paleta: { "1": "#e8a33d", "2": "#f7d79a", "3": "#2a0d12", "4": "#f9e8ea" },
    pixeles: [
      "3...................",
      "13..................",
      ".13.............111.",
      "..131..........11111",
      "...1311111111111143.",
      "...13131131131111113",
      "...1112211221111111.",
      "...1111111111111111.",
      "...11.....11.11.....",
      "..11......11..11....",
      ".11.......1....11...",
      "11........1.....11..",
    ],
  },
  guepardoSalto: {
    paleta: { "1": "#e8a33d", "2": "#f7d79a", "3": "#2a0d12", "4": "#f9e8ea" },
    pixeles: [
      "..................3.",
      ".................31.",
      "3...............131.",
      "13.............11111",
      ".131111111111111143.",
      "..131311311311111113",
      "..11122112211111111.",
      "..11111111111111111.",
      "...11..11....11..11.",
      "....11..1.....1..11.",
      "....................",
      "....................",
    ],
  },

  // Pelota de baloncesto: naranja con las líneas negras clásicas.
  pelota: {
    paleta: { "1": "#e8752a", "2": "#ff9f5a", "3": "#2a0d12" },
    pixeles: [
      "...3333...",
      ".33122133.",
      ".31122113.",
      "3112231123",
      "3112231123",
      "3311223113",
      "3112231123",
      "3112231123",
      ".31122113.",
      ".33122133.",
      "...3333...",
    ],
  },

  // Bolita del zigzag: esfera clara con brillo, se ve bien sobre el camino oscuro.
  bola: {
    paleta: { "1": "#ff4d5a", "2": "#ff9aa2", "3": "#f9e8ea", "4": "#7d1420" },
    pixeles: [
      "..1111..",
      ".123211.",
      "12332211",
      "12322114",
      "11221144",
      "11211444",
      ".114444.",
      "..4444..",
    ],
  },
};
