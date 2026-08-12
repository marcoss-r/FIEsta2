// Núcleo: utilidades de azar compartidas por los seis juegos (§7.1).

// Fisher–Yates: devuelve una COPIA de la lista en orden aleatorio (no muta el original).
function barajar(lista) {
  const copia = lista.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// Entero aleatorio entre min y max, ambos INCLUSIVE.
function enteroAleatorio(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Un elemento al azar de la lista.
function elegirAlAzar(lista) {
  return lista[enteroAleatorio(0, lista.length - 1)];
}

// N elementos distintos de la lista, sin repetir (barajar + slice). Si n es
// mayor que la lista, devuelve la lista entera barajada.
function elegirN(lista, n) {
  return barajar(lista).slice(0, n);
}

// Repartidor sin repetición: va sirviendo elementos del banco hasta agotarlo;
// al agotarse, vuelve a barajar y lo marca con `agotado: true` para que el
// juego pueda avisar ("se han acabado los retos, volvemos a barajar"). Cada
// juego crea el suyo sobre su banco ya filtrado por nivel (§8: "banco agotado
// a mitad de partida... avisar y volver a barajar, nunca repetir en bucle").
//
// Precondición: `banco` no puede estar vacío (los juegos deben comprobarlo
// antes de crear el repartidor y volver a la configuración si lo está).
function crearRepartidor(banco) {
  let mazo = barajar(banco);
  let indice = 0;

  function siguiente() {
    if (indice >= mazo.length) {
      mazo = barajar(banco);
      indice = 0;
      return { valor: mazo[indice++], agotado: true };
    }
    return { valor: mazo[indice++], agotado: false };
  }

  function quedan() {
    return mazo.length - indice;
  }

  function reiniciar() {
    mazo = barajar(banco);
    indice = 0;
  }

  return { siguiente, quedan, reiniciar };
}
