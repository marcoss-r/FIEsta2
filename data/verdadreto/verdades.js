// Banco de verdades de "Verdad o Reto" (vr). Provisional: ~20 entradas de
// muestra (md/PLAN_VERDAD_O_RETO.md §9) para dejar el juego jugable de
// principio a fin. El banco definitivo (≥ 200, con verdades.json +
// agregar.py) llega en la Fase 3 de ese plan.
const VR_VERDADES = [
  // ── suave
  { texto: "¿Cuál es la mentira más grande que has contado?", nivel: "suave" },
  { texto: "¿Qué es lo más raro que has buscado en internet?", nivel: "suave" },
  { texto: "¿Cuál es tu placer culpable que jamás admitirías en público?", nivel: "suave" },
  { texto: "¿Qué canción te sabes entera y te da vergüenza reconocerlo?", nivel: "suave" },
  { texto: "¿Cuál ha sido tu momento más ridículo delante de gente?", nivel: "suave" },
  { texto: "¿Qué le pediste a tus padres y nunca te compraron?", nivel: "suave" },
  { texto: "¿Cuánto tiempo llevas sin cambiar las sábanas? Sé honesto.", nivel: "suave" },
  { texto: "¿Qué manía tuya sabes que a {otro} le saca de quicio?", nivel: "suave" },

  // ── picante
  { texto: "¿Qué opinas de verdad de {otro}?", nivel: "picante" },
  { texto: "¿Cuál ha sido tu peor cita y por qué?", nivel: "picante" },
  { texto: "¿Alguna vez te has hecho el dormido para no hablar con alguien?", nivel: "picante" },
  { texto: "¿A quién de esta sala le pedirías ayuda si tuvieras que esconder un cadáver?", nivel: "picante" },
  { texto: "¿Qué mensaje has borrado antes de enviarlo y todavía te acuerdas?", nivel: "picante" },
  { texto: "¿Has fingido que te gustaba un regalo? ¿Cuál?", nivel: "picante" },
  { texto: "Si tuvieras que salir de fiesta con {otro} o con tu jefe, ¿quién y por qué?", nivel: "picante" },
  { texto: "¿Cuál es la excusa más falsa que has puesto para no ir a un plan?", nivel: "picante" },

  // ── extremo
  { texto: "¿Cuál es el secreto que no has contado nunca y que hoy sí puedes contar?", nivel: "extremo" },
  { texto: "¿Qué es lo peor que has hecho y de lo que nadie de aquí se ha enterado?", nivel: "extremo" },
  { texto: "¿Has traicionado la confianza de alguien de esta sala? Cuéntalo.", nivel: "extremo" },
  { texto: "¿Cuánto dinero haría falta para que dejaras de hablarte con {otro} un año?", nivel: "extremo" },
];
