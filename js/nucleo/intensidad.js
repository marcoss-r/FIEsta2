// Núcleo: niveles de intensidad y modo fiesta, transversales a los seis
// juegos (§7.4).

// El nivel más fuerte se llama internamente "extremo" (id de siempre, usado en
// todos los bancos de datos), pero se MUESTRA como "Salseo": no busca ser
// gratuitamente extremo, sino generar temas de conversación jugosos entre
// amigos (§12 global, actualizado).
const NIVELES = [
  { id: "suave", nombre: "Suave", desc: "Apto para cualquier grupo" },
  { id: "picante", nombre: "Picante", desc: "Sube la temperatura" },
  { id: "extremo", nombre: "Salseo", desc: "Para generar conversación entre amigos" },
];

// Solo Suave y Picante empiezan activos: que "Salseo" sea una decisión
// consciente, no el punto de partida.
const NIVELES_POR_DEFECTO = ["suave", "picante"];

const CLAVE_MODO_FIESTA = "modo_fiesta";
const CLAVE_AVISO_TONO = "aviso_tono_visto";

// Chips de nivel: multi-selección, mínimo uno siempre activo. Si el usuario
// intenta desmarcar el último, no se desmarca (un banco sin niveles no
// devolvería nada que jugar).
function montarSelectorNiveles(contenedor, alCambiar) {
  let elegidos = NIVELES_POR_DEFECTO.slice();

  function render() {
    contenedor.innerHTML = "";
    NIVELES.forEach((nivel) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip-nivel" + (elegidos.includes(nivel.id) ? " activo" : "");
      chip.dataset.nivel = nivel.id;
      chip.textContent = nivel.nombre;
      chip.addEventListener("click", () => alternar(nivel.id));
      contenedor.appendChild(chip);
    });
  }

  function alternar(id) {
    if (elegidos.includes(id)) {
      if (elegidos.length === 1) return; // mínimo uno activo
      elegidos = elegidos.filter((n) => n !== id);
    } else {
      elegidos = elegidos.concat(id);
      if (id === "extremo") mostrarAvisoTonoSiPrimeraVez(); // "Salseo"
    }
    render();
    alCambiar(elegidos.slice());
  }

  render();
  alCambiar(elegidos.slice());

  return {
    obtenerNiveles: () => elegidos.slice(),
    fijarNiveles(ids) {
      elegidos = ids.length ? ids.slice() : NIVELES_POR_DEFECTO.slice();
      render();
      alCambiar(elegidos.slice());
    },
  };
}

// Subconjunto del banco cuyo nivel está entre los elegidos.
function filtrarPorNivel(banco, nivelesElegidos) {
  return banco.filter((entrada) => nivelesElegidos.includes(entrada.nivel));
}

// Interruptor de modo fiesta: a diferencia de los niveles (que se eligen en
// cada partida), es GLOBAL y persistente entre partidas (clave "modo_fiesta").
function montarInterruptorModoFiesta(contenedor, alCambiar) {
  contenedor.innerHTML = "";
  const label = document.createElement("label");
  label.className = "switch";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = modoFiestaActivo();
  const pista = document.createElement("span");
  pista.className = "switch-pista";
  label.append(input, pista);
  contenedor.appendChild(label);

  input.addEventListener("change", () => {
    guardarJSON(CLAVE_MODO_FIESTA, input.checked);
    if (input.checked) mostrarAvisoTonoSiPrimeraVez();
    if (alCambiar) alCambiar(input.checked);
  });
}

function modoFiestaActivo() {
  return cargarJSON(CLAVE_MODO_FIESTA) === true;
}

// Como elegirAlAzar(), pero eligiendo antes una categoría con pesos: por
// ejemplo castigoPonderado({ beber: 0.3, prenda: 0.2, otros: 0.5 }). Los
// pesos no hace falta que sumen 1 (se normalizan); una categoría omitida o a
// 0 nunca sale. Cada juego pide la mezcla que le interese, en vez de que la
// probabilidad dependa de cuántas entradas tenga cada categoría en el banco.
function castigoPonderado(pesos) {
  const categorias = { beber: CASTIGOS_BEBER, prenda: CASTIGOS_PRENDA, otros: CASTIGOS_OTROS };
  const entradas = Object.entries(pesos).filter(([, peso]) => peso > 0);
  const total = entradas.reduce((suma, [, peso]) => suma + peso, 0);
  let punto = Math.random() * total;
  for (const [nombre, peso] of entradas) {
    if (punto < peso) return elegirAlAzar(categorias[nombre]);
    punto -= peso;
  }
  return elegirAlAzar(categorias[entradas[entradas.length - 1][0]]);
}

// La primera vez que se activa "Salseo" o el modo fiesta, un overlay
// recuerda que es contenido para mayores de edad y que nadie está obligado a
// nada. Se recuerda en localStorage y no vuelve a salir.
function mostrarAvisoTonoSiPrimeraVez() {
  if (cargarJSON(CLAVE_AVISO_TONO) === true) return;
  const overlay = document.getElementById("aviso-tono");
  if (!overlay) return;
  overlay.hidden = false;
  guardarJSON(CLAVE_AVISO_TONO, true);
}

// El aviso vive fuera de las .pantalla (ver index.html) para poder mostrarse
// encima de cualquier juego, así que se cierra con su propio wiring aquí.
document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("aviso-tono");
  if (overlay) overlay.addEventListener("click", () => (overlay.hidden = true));
});
