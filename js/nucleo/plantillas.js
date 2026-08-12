// Núcleo: relleno de plantillas de texto con nombres de la partida (§7.5).
// Huecos soportados: {jugador} (quien tiene el turno) y {otro}/{otro2} (otros
// jugadores distintos entre sí, sin repetir).

function tienePlantilla(texto) {
  return texto.includes("{jugador}") || texto.includes("{otro}") || texto.includes("{otro2}");
}

// Cuántos {otro} DISTINTOS pide un texto: 0, 1 o 2. Los juegos lo usan para
// descartar, al filtrar el banco, los textos imposibles con pocos jugadores
// (regla: se descarta si otrosNecesarios(texto) > nombres.length - 1).
function otrosNecesarios(texto) {
  if (texto.includes("{otro2}")) return 2;
  if (texto.includes("{otro}")) return 1;
  return 0;
}

// Sustituye los huecos de un texto. "otros" son los candidatos disponibles
// para {otro}/{otro2} — normalmente, todos los jugadores menos quien tiene el
// turno — y deben ser al menos tantos como pida otrosNecesarios(texto): se
// barajan para no favorecer siempre al mismo.
function rellenarPlantilla(texto, { jugador, otros }) {
  let resultado = texto.replace(/\{jugador\}/g, jugador);
  if (resultado.includes("{otro}") || resultado.includes("{otro2}")) {
    const elegidos = barajar(otros);
    resultado = resultado.replace(/\{otro2\}/g, elegidos[1]).replace(/\{otro\}/g, elegidos[0]);
  }
  return resultado;
}
