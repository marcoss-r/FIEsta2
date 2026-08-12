// Núcleo: persistencia en localStorage, a prueba de incógnito (§7.2).
// En modo incógnito (o con localStorage lleno/deshabilitado) las llamadas
// pueden lanzar excepción: la app debe seguir funcionando igual, solo sin
// "Continuar partida".

function guardarJSON(clave, objeto) {
  try {
    localStorage.setItem(clave, JSON.stringify(objeto));
  } catch (error) {
    // Nada que hacer: sin persistencia, pero sin romper la partida en curso.
  }
}

// null si no hay nada guardado o si lo guardado está corrupto.
function cargarJSON(clave) {
  try {
    const texto = localStorage.getItem(clave);
    return texto === null ? null : JSON.parse(texto);
  } catch (error) {
    return null;
  }
}

function hayGuardado(clave) {
  return cargarJSON(clave) !== null;
}

function borrarGuardado(clave) {
  try {
    localStorage.removeItem(clave);
  } catch (error) {
    // Nada que borrar si localStorage no está disponible.
  }
}
