// Banco PROVISIONAL de "Preguntas incómodas" (pi) — md/PLAN_PREGUNTAS_INCOMODAS.md §9.
// Muestra de referencia para fijar el tono. Pendiente de la Fase 3 (≥ 400,
// ≥ 80 por tipo), a cuatro manos con el usuario.
const PI_PREGUNTAS = [
  // ── dirigida · suave
  { texto: "¿Qué es lo que más te cuesta reconocer de ti mismo?", tipo: "dirigida", nivel: "suave" },
  { texto: "¿Cuál es la excusa que más repites y ya nadie se cree?", tipo: "dirigida", nivel: "suave" },
  { texto: "¿Qué plan te da una pereza brutal pero nunca dices que no?", tipo: "dirigida", nivel: "suave" },
  { texto: "¿Qué cosa haces cuando estás solo que jamás harías delante de nadie?", tipo: "dirigida", nivel: "suave" },
  { texto: "¿Qué mentira piadosa has contado esta misma semana?", tipo: "dirigida", nivel: "suave" },

  // ── dirigida · picante
  { texto: "¿Qué es lo peor que has pensado de alguien de esta sala?", tipo: "dirigida", nivel: "picante" },
  { texto: "¿A quién de aquí has criticado a sus espaldas?", tipo: "dirigida", nivel: "picante" },
  { texto: "¿Qué te dolió y nunca dijiste que te había dolido?", tipo: "dirigida", nivel: "picante" },
  { texto: "¿Con quién de aquí has tenido más ganas de discutir y te has callado?", tipo: "dirigida", nivel: "picante" },
  { texto: "¿Qué parte de tu vida estás fingiendo que va mejor de lo que va?", tipo: "dirigida", nivel: "picante" },

  // ── dirigida · extremo
  { texto: "¿De qué te arrepientes de verdad y todavía no has pedido perdón?", tipo: "dirigida", nivel: "extremo" },
  { texto: "¿Qué le estás ocultando ahora mismo a alguien de esta sala?", tipo: "dirigida", nivel: "extremo" },
  { texto: "¿Cuál es la cosa más egoísta que has hecho por tu propio beneficio?", tipo: "dirigida", nivel: "extremo" },

  // ── cruzada · suave
  { texto: "¿Qué le pedirías prestado a {otro} sabiendo que no se lo vas a devolver?", tipo: "cruzada", nivel: "suave" },
  { texto: "¿Qué manía de {otro} imitarías ahora mismo?", tipo: "cruzada", nivel: "suave" },
  { texto: "¿En qué se te parece {otro} más de lo que le gustaría admitir?", tipo: "cruzada", nivel: "suave" },
  { texto: "Si tuvieras que irte de viaje con {otro} un mes, ¿qué norma pondrías el primer día?", tipo: "cruzada", nivel: "suave" },

  // ── cruzada · picante
  { texto: "¿Qué cambiarías de {otro} si pudieras?", tipo: "cruzada", nivel: "picante" },
  { texto: "¿Qué consejo le has dado a {otro} que en el fondo sabías que era malo?", tipo: "cruzada", nivel: "picante" },
  { texto: "¿Qué le perdonarías a {otro} que no le perdonarías a nadie más?", tipo: "cruzada", nivel: "picante" },
  { texto: "¿Cuál fue la primera impresión que te dio {otro} y cuánto ha cambiado?", tipo: "cruzada", nivel: "picante" },

  // ── cruzada · extremo
  { texto: "¿Qué le has ocultado a {otro} para no tener la conversación?", tipo: "cruzada", nivel: "extremo" },
  { texto: "Si mañana {otro} desapareciera de tu vida, ¿qué echarías de menos y qué no?", tipo: "cruzada", nivel: "extremo" },
  { texto: "¿Qué es lo más duro que le dirías a {otro} si supieras que no se va a enfadar?", tipo: "cruzada", nivel: "extremo" },

  // ── grupo · suave
  { texto: "¿Quién de aquí guarda el secreto más gordo?", tipo: "grupo", nivel: "suave" },
  { texto: "¿Quién de aquí sería el peor compañero de piso y por qué?", tipo: "grupo", nivel: "suave" },
  { texto: "¿Quién de aquí llegaría tarde a su propia boda?", tipo: "grupo", nivel: "suave" },

  // ── grupo · picante
  { texto: "¿Quién de aquí ha cambiado más desde que os conocéis, para bien o para mal?", tipo: "grupo", nivel: "picante" },
  { texto: "¿Quién de aquí necesita escuchar una verdad que nadie le dice?", tipo: "grupo", nivel: "picante" },

  // ── grupo · extremo
  { texto: "¿Qué se dice de alguien de esta sala cuando no está delante?", tipo: "grupo", nivel: "extremo" },
];
