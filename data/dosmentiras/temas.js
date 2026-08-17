// Banco PROVISIONAL de Dos mentiras y una verdad (dm): la muestra de
// PLAN_DOS_MENTIRAS.md §9, para poder jugar de principio a fin mientras se
// escribe el banco definitivo (Fase 3, a cuatro manos con el usuario).
const DM_TEMAS = [
  // ── tipo "tema" (ámbito abierto) · suave
  { texto: "Tus viajes", tipo: "tema", nivel: "suave" },
  { texto: "La época del colegio", tipo: "tema", nivel: "suave" },
  { texto: "Tus trabajos", tipo: "tema", nivel: "suave" },
  { texto: "Comida y manías raras", tipo: "tema", nivel: "suave" },
  { texto: "Deportes y desastres físicos", tipo: "tema", nivel: "suave" },
  { texto: "Tus vecinos", tipo: "tema", nivel: "suave" },
  { texto: "Animales que has tenido", tipo: "tema", nivel: "suave" },
  { texto: "Talentos ocultos", tipo: "tema", nivel: "suave" },

  // ── tipo "tema" · picante
  { texto: "Tu peor cita", tipo: "tema", nivel: "picante" },
  { texto: "Dinero", tipo: "tema", nivel: "picante" },
  { texto: "Tu peor jefe", tipo: "tema", nivel: "picante" },
  { texto: "Noches que no recuerdas del todo", tipo: "tema", nivel: "picante" },
  { texto: "Mentiras que has contado en el trabajo", tipo: "tema", nivel: "picante" },
  { texto: "Exparejas", tipo: "tema", nivel: "picante" },

  // ── tipo "tema" · extremo
  { texto: "Cosas que nunca le has contado a tu familia", tipo: "tema", nivel: "extremo" },
  { texto: "Tus peores decisiones", tipo: "tema", nivel: "extremo" },

  // ── tipo "arranque" (frase empezada) · suave
  { texto: "Tres cosas que hiciste de pequeño y hoy te dan vergüenza", tipo: "arranque", nivel: "suave" },
  { texto: "Tres sitios en los que has estado", tipo: "arranque", nivel: "suave" },
  { texto: "Tres cosas que sabes hacer y nadie de aquí sabe", tipo: "arranque", nivel: "suave" },
  { texto: "Tres cosas que te han pasado en un transporte público", tipo: "arranque", nivel: "suave" },
  { texto: "Tres motes que te han puesto", tipo: "arranque", nivel: "suave" },
  { texto: "Tres cosas que has roto sin querer", tipo: "arranque", nivel: "suave" },

  // ── tipo "arranque" · picante
  { texto: "Tres cosas que has hecho y de las que no te enorgulleces", tipo: "arranque", nivel: "picante" },
  { texto: "Tres excusas que has puesto para no ir a un sitio", tipo: "arranque", nivel: "picante" },
  { texto: "Tres cosas que has hecho por dinero", tipo: "arranque", nivel: "picante" },
  { texto: "Tres veces que te han pillado en una mentira", tipo: "arranque", nivel: "picante" },
  { texto: "Tres cosas que has hecho para llamar la atención de alguien", tipo: "arranque", nivel: "picante" },

  // ── tipo "arranque" · extremo
  { texto: "Tres cosas que le has ocultado a alguien de esta sala", tipo: "arranque", nivel: "extremo" },
  { texto: "Tres veces que has dejado tirado a alguien", tipo: "arranque", nivel: "extremo" },
  { texto: "Tres cosas de las que te arrepientes de verdad", tipo: "arranque", nivel: "extremo" },
];
