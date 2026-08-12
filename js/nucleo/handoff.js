// Núcleo: pantalla genérica de "pasa el móvil" con protección anti-espionaje
// (§7.6). El contenido secreto NUNCA existe en el DOM antes de pulsar "Ver" ni
// después de "Ocultar y pasar": no basta con ocultarlo por CSS (se ve en
// ángulo o inspeccionando el HTML), así que cada transición reconstruye el
// contenedor entero desde cero.
//
// `contenedor` es el elemento del juego donde vive el handoff (p. ej.
// `#im-handoff`, dentro de la pantalla `im-reparto`): esta función lo llena
// por completo, así que debe empezar vacío.
function iniciarHandoff({ contenedor, nombres, contenidoDe, alTerminar, textoVer, textoOcultar }) {
  const verTexto = textoVer || "Ver";
  const ocultarTexto = textoOcultar || "Ocultar y pasar";
  let indice = 0;

  function renderPasar() {
    contenedor.innerHTML = "";
    const vista = document.createElement("div");
    vista.className = "vista";

    const texto = document.createElement("p");
    texto.innerHTML = `Pasa el móvil a <strong>${nombres[indice]}</strong>`;

    const btnVer = document.createElement("button");
    btnVer.type = "button";
    btnVer.textContent = verTexto;
    btnVer.addEventListener("click", renderVer);

    vista.append(texto, btnVer);
    contenedor.appendChild(vista);
  }

  function renderVer() {
    contenedor.innerHTML = "";
    const vista = document.createElement("div");
    vista.className = "vista";

    // El nodo secreto se crea AQUÍ, en el momento de pulsar "Ver": es la
    // única vez que existe en el DOM antes de que se borre al ocultar.
    vista.appendChild(contenidoDe(indice));

    const btnOcultar = document.createElement("button");
    btnOcultar.type = "button";
    btnOcultar.className = "secundario";
    btnOcultar.textContent = ocultarTexto;
    btnOcultar.addEventListener("click", () => {
      indice++;
      if (indice >= nombres.length) {
        contenedor.innerHTML = "";
        alTerminar();
      } else {
        renderPasar();
      }
    });

    vista.appendChild(btnOcultar);
    contenedor.appendChild(vista);
  }

  renderPasar();
}
