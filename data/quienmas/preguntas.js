// Banco de preguntas de "Quién es más…" (qm). Provisional: ~32 entradas de
// muestra (md/PLAN_QUIEN_ES_MAS.md §9) para dejar el juego jugable de
// principio a fin. El banco definitivo (≥ 400, con preguntas.json +
// agregar.py) llega en la Fase 3 de ese plan.
const QM_PREGUNTAS = [
  // ── probable
  { texto: "acabe durmiendo en el sofá esta noche", tipo: "probable", nivel: "suave" },
  { texto: "pierda el móvil en los próximos tres meses", tipo: "probable", nivel: "suave" },
  { texto: "se apunte a un gimnasio y no vaya nunca", tipo: "probable", nivel: "suave" },
  { texto: "llore viendo un anuncio", tipo: "probable", nivel: "suave" },
  { texto: "se enamore de alguien a quien conoció esa misma noche", tipo: "probable", nivel: "picante" },
  { texto: "conteste un mensaje a las cuatro de la mañana", tipo: "probable", nivel: "picante" },
  { texto: "acabe montando una escena en una boda", tipo: "probable", nivel: "picante" },
  { texto: "se case con {otro} si el mundo se acabara mañana", tipo: "probable", nivel: "picante" },
  { texto: "haya mentido en algo gordo esta misma semana", tipo: "probable", nivel: "extremo" },
  { texto: "deje de hablarse con alguien de esta sala en un año", tipo: "probable", nivel: "extremo" },

  // ── adjetivo
  { texto: "de hacer un drama cuando se pone malo", tipo: "adjetivo", nivel: "suave" },
  { texto: "insoportable antes del primer café", tipo: "adjetivo", nivel: "suave" },
  { texto: "exigente con los demás y blando consigo mismo", tipo: "adjetivo", nivel: "suave" },
  { texto: "de organizar planes que luego cancela", tipo: "adjetivo", nivel: "suave" },
  { texto: "de perdonar demasiado rápido", tipo: "adjetivo", nivel: "picante" },
  { texto: "de decir «no me importa» cuando le importa muchísimo", tipo: "adjetivo", nivel: "picante" },
  { texto: "dependiente de que le digan que lo está haciendo bien", tipo: "adjetivo", nivel: "picante" },
  { texto: "de guardar rencor durante años sin decirlo", tipo: "adjetivo", nivel: "extremo" },

  // ── primero
  { texto: "perderse en una ciudad nueva", tipo: "primero", nivel: "suave" },
  { texto: "quedarse dormido en el cine", tipo: "primero", nivel: "suave" },
  { texto: "pedir el postre antes que nadie", tipo: "primero", nivel: "suave" },
  { texto: "montar el karaoke en una reunión familiar", tipo: "primero", nivel: "suave" },
  { texto: "escribir a su ex después de tres copas", tipo: "primero", nivel: "picante" },
  { texto: "contar un secreto que le habían pedido guardar", tipo: "primero", nivel: "picante" },
  { texto: "abandonar el grupo si la cosa se pusiera fea", tipo: "primero", nivel: "extremo" },
  { texto: "reconocer que ha estado fingiendo estar bien", tipo: "primero", nivel: "extremo" },

  // ── nunca
  { texto: "ha ido a una fiesta sin saber de quién era", tipo: "nunca", nivel: "suave" },
  { texto: "ha cantado en un karaoke delante de desconocidos", tipo: "nunca", nivel: "suave" },
  { texto: "se ha ido de un sitio sin despedirse de nadie", tipo: "nunca", nivel: "suave" },
  { texto: "ha cotilleado el móvil de alguien", tipo: "nunca", nivel: "picante" },
  { texto: "ha inventado una excusa para cortar una conversación", tipo: "nunca", nivel: "picante" },
  { texto: "ha dicho «te quiero» sin sentirlo", tipo: "nunca", nivel: "extremo" },
];
