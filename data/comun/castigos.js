// Banco de castigos del modo fiesta (§7.4). Dividido en tres categorías para
// poder pedir un castigo con pesos por categoría (ver castigoPonderado() en
// js/nucleo/intensidad.js): quien llama a la función decide qué proporción
// quiere de cada una. CASTIGOS_COMUNES (la unión de las tres) se mantiene
// para castigoAlAzar(), que elige de las tres por igual sin pesos.

const CASTIGOS_BEBER = [
  "Un trago",
  "Dos tragos",
  "Un trago doble",
  "Un chupito",
  "Bebes tú y quien tengas a la derecha",
  "Bebes tú y quien tengas a la izquierda",
  "Bebe todo el grupo menos tú",
  "Bebe quien tengas enfrente",
  "Un trago por cada persona que se ría en los próximos 10 segundos",
  "Rellena el vaso de tu vecino y bebe tú también",
  "Bebe con los ojos cerrados",
  "Bebe sin usar las manos",
  "Bebe con la mano contraria a la que sueles usar",
  "Un trago por cada mensaje sin leer que tengas ahora mismo",
  "Un trago si te ríes en los próximos 30 segundos",
  "Un trago doble y brindas con todo el grupo",
  "Un trago si eres quien lleva más tiempo sin mirar el móvil",
  "Bebe si has sido tú quien ha propuesto el plan de hoy",
  "Un trago por cada vez que digas 'eh' en tu próxima frase",
  "El último en tocarse la nariz bebe",
  "Bebe dos tragos seguidos sin respirar entre ellos",
  "Bebe con la cabeza echada hacia atrás",
  "Un trago doble si esta ronda te tocaba a ti elegir la música",
];

const CASTIGOS_PRENDA = [
  "Quítate un calcetín",
  "Quítate un zapato",
  "Quítate la gorra, las gafas o un accesorio",
  "Quítate una pulsera, un anillo o un collar",
  "Quítate el cinturón",
  "Quítate una capa de ropa (chaqueta, sudadera…)",
  "Quítate ambos calcetines",
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
  "Deja que el grupo elija tu próxima frase",
  "Regala un cumplido sincero a quien tengas a la derecha",
  "Cuenta un secreto sin importancia",
  "Haz de estatua 15 segundos",
  "Pide perdón por algo random a quien quieras",
  "Habla en susurros hasta el siguiente turno",
  "Levántate y siéntate tres veces seguidas",
  "Enseña la última foto que has hecho",
  "Deja que alguien te ponga un mote nuevo para el resto de la partida",
  "Repite la última frase que dijiste, pero cantando",
  "Haz una imitación de un animal durante 10 segundos",
  "Cuenta un chiste, bueno o malo",
  "Camina como un robot hasta tu próximo turno",
];

const CASTIGOS_COMUNES = [...CASTIGOS_BEBER, ...CASTIGOS_PRENDA, ...CASTIGOS_OTROS];
