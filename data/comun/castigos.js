// Banco de castigos del modo fiesta (§7.4). Dividido en tres categorías para
// poder pedir un castigo con pesos por categoría (ver castigoPonderado() en
// js/nucleo/intensidad.js): quien llama a la función decide qué proporción
// quiere de cada una. CASTIGOS_COMUNES (la unión de las tres) se mantiene
// para castigoAlAzar(), que elige de las tres por igual sin pesos.

const CASTIGOS_BEBER = [
  "Bebe un trago",
  "Bebe dos tragos",
  "Un chupito",
  "Bebes tú y quien tengas a la derecha",
  "Bebes tú y quien tengas a la izquierda",
  "Bebes tú y quien tengas enfrente",
  "Bebe dos tragos con los ojos cerrados",
  "Bebe sin usar las manos",
  "Bebe dos tragos con el jugador de tu izquierda acercándote el vaso",
  "Un trago por cada mensaje sin leer que tengas ahora mismo",
];

const CASTIGOS_PRENDA = [
  "Quítate una prenda",
];

const CASTIGOS_OTROS = [
  "Cuenta hasta diez en otro idioma",
  "Baila 10 segundos",
  "Haz una imitación de alguien del grupo",
  "Canta el estribillo de una canción",
  "Cámbiate de sitio con la persona que tengas más lejos",
  "Deja tu móvil boca arriba en el centro dos minutos",
  "Habla con acento raro hasta tu próximo turno",
  "Haz 5 sentadillas",
  "Regala un cumplido sincero a quien tengas a la derecha",
  "Cuenta un secreto sin importancia",
  "Haz de estatua 15 segundos",
  "Pide perdón por algo random a quien quieras",
  "Habla en susurros hasta el siguiente turno",
  "Levántate y siéntate tres veces seguidas",
  "Enseña la última foto que has hecho",
  "Deja que alguien te ponga un mote nuevo para el resto de la partida",
  "Haz una imitación de un animal durante 10 segundos",
  "Cuenta un chiste",
  "Camina como un robot hasta tu próximo turno",
];

const CASTIGOS_COMUNES = [...CASTIGOS_BEBER, ...CASTIGOS_PRENDA, ...CASTIGOS_OTROS];
