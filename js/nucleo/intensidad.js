// Núcleo: niveles de intensidad y modo fiesta, transversales a los seis
// juegos (§7.4).

const NIVELES = [
  { id: "suave", nombre: "Suave", emoji: "🙂", desc: "Apto para cualquier grupo" },
  { id: "picante", nombre: "Picante", emoji: "🌶️", desc: "Sube la temperatura" },
  { id: "extremo", nombre: "Extremo", emoji: "🔥", desc: "Solo con gente de confianza" },
];

// Solo Suave y Picante empiezan activos: que "Extremo" sea una decisión
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
      chip.textContent = `${nivel.emoji} ${nivel.nombre}`;
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
      if (id === "extremo") mostrarAvisoTonoSiPrimeraVez();
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

// Una entrada al azar del banco de castigos (data/comun/castigos.js).
function castigoAlAzar() {
  return elegirAlAzar(CASTIGOS_COMUNES);
}

// La primera vez que se activa "Extremo" o el modo fiesta, un overlay
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
