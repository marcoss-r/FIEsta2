// Banco de retos de "Verdad o Reto" (vr). Provisional: ~17 entradas de
// muestra (md/PLAN_VERDAD_O_RETO.md §9) para dejar el juego jugable de
// principio a fin. El banco definitivo (≥ 200, con retos.json + agregar.py)
// llega en la Fase 3 de ese plan.
const VR_RETOS = [
  // ── suave
  { texto: "Imita a {otro} hasta que alguien adivine a quién imitas", nivel: "suave" },
  { texto: "Habla como un presentador de telediario hasta tu próximo turno", nivel: "suave" },
  { texto: "Enseña la última foto de tu galería", nivel: "suave" },
  { texto: "Ponte de pie y haz tu mejor pose de portada de disco", nivel: "suave" },
  { texto: "Di tres cosas que te gusten de {otro}, en serio y sin bromas", nivel: "suave" },
  { texto: "Canta el estribillo de la última canción que escuchaste", nivel: "suave" },
  { texto: "Cuenta un chiste. Si nadie se ríe, cuenta otro.", nivel: "suave" },

  // ── picante
  { texto: "Deja que {otro} escriba un mensaje en tus notas y léelo en voz alta", nivel: "picante" },
  { texto: "Enseña la última conversación de WhatsApp que abriste (solo el último mensaje)", nivel: "picante" },
  { texto: "Ponle un mote a cada persona de la sala y explícalo", nivel: "picante" },
  { texto: "Deja que el grupo elija tu foto de perfil durante una hora", nivel: "picante" },
  { texto: "Llama a la persona con la que hablaste ayer y dile que la echas de menos", nivel: "picante" },
  { texto: "Dile a {otro} lo primero que pensaste de él o ella cuando os conocisteis", nivel: "picante" },

  // ── extremo
  { texto: "Deja que {otro} mire tu galería de fotos durante 20 segundos", nivel: "extremo" },
  { texto: "Lee en voz alta el último mensaje que le mandaste a tu ex", nivel: "extremo" },
  { texto: "Manda un audio de 10 segundos a la última persona con la que hablaste diciendo lo que el grupo te dicte", nivel: "extremo" },
  { texto: "Cuéntale a {otro} algo que nunca le has dicho a la cara", nivel: "extremo" },
];
