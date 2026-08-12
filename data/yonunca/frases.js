// Banco de frases de "Yo nunca" (yn). Provisional: ~30 entradas de muestra
// (md/PLAN_YO_NUNCA.md §9) para dejar el juego jugable de principio a fin. El
// banco definitivo (≥ 400, con frases.json + agregar.py) llega en la Fase 3
// de ese plan.
const YN_FRASES = [
  // ── suave
  { texto: "he fingido estar dormido para no hablar con alguien", nivel: "suave" },
  { texto: "he mandado un mensaje a la persona equivocada", nivel: "suave" },
  { texto: "me he reído de un chiste que no he entendido", nivel: "suave" },
  { texto: "he mentido sobre haber leído un libro", nivel: "suave" },
  { texto: "he llorado viendo un anuncio", nivel: "suave" },
  { texto: "me he colado en una cola", nivel: "suave" },
  { texto: "he fingido que se me había cortado la llamada", nivel: "suave" },
  { texto: "he vuelto a comprar algo que ya tenía por no buscarlo", nivel: "suave" },
  { texto: "he cantado en la ducha a pleno pulmón", nivel: "suave" },
  { texto: "me he hecho el dormido en un coche para no hablar", nivel: "suave" },

  // ── picante
  { texto: "he querido besar a alguien de este grupo", nivel: "picante" },
  { texto: "he cotilleado el móvil de alguien sin permiso", nivel: "picante" },
  { texto: "he mentido para librarme de un plan", nivel: "picante" },
  { texto: "me he arrepentido de un mensaje justo después de enviarlo", nivel: "picante" },
  { texto: "he salido con alguien solo por no estar solo", nivel: "picante" },
  { texto: "he fingido que me iba bien en el trabajo cuando no era así", nivel: "picante" },
  { texto: "he hablado mal de alguien que está en esta sala", nivel: "picante" },
  { texto: "he tenido un sueño con alguien que está aquí ahora mismo", nivel: "picante" },
  { texto: "he buscado a un ex en redes sociales esta misma semana", nivel: "picante" },
  { texto: "he dicho una mentira para quedar mejor en una entrevista", nivel: "picante" },

  // ── extremo
  { texto: "he sentido celos de alguien que está en esta sala", nivel: "extremo" },
  { texto: "he roto algo a propósito y he dejado que culparan a otro", nivel: "extremo" },
  { texto: "he fingido un sentimiento que no tenía para no herir a alguien", nivel: "extremo" },
  { texto: "he guardado un secreto que no era mío durante años", nivel: "extremo" },
  { texto: "he deseado que una relación se acabara sin atreverme a decirlo", nivel: "extremo" },
  { texto: "he dejado de hablar con alguien sin darle explicaciones", nivel: "extremo" },
  { texto: "he mentido sobre algo importante a mi familia", nivel: "extremo" },
];
