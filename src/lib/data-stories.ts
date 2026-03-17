export type StoryColor = "cyan" | "amber" | "red" | "blue" | "gray" | "green" | "purple" | "yellow" | "stone" | "orange" | "emerald" | "sky" | "fuchsia" | "indigo" | "rose";

export interface Story {
  id: string;
  title: string;
  colorScheme: StoryColor;
  paragraphs: string[];
  lesson: string;
}

export const STORIES: Story[] = [
  // --- Historias de Elías ---
  {
      id: "elias_futbol",
      title: "Elías y el Penal Fallado",
      colorScheme: "green",
      paragraphs: [
          "Final del partido. Empatados. Elías se prepara para tirar el penal decisivo. ¡Lo falla! El otro equipo gana.",
          "Camino a casa, su hermana Elisa le dice: '¡Qué mal tiraste!'. Elías siente cómo le hierve la sangre. Está furioso.",
          "Pero entonces, recuerda: 'No controlo el resultado. No controlo lo que dice Elisa'. Respira hondo y, en lugar de gritar, dice: 'Sí, fue un mal tiro. Practicaré más para la próxima'."
      ],
      lesson: "No controlas las burlas ni el resultado, pero sí controlas tu esfuerzo y tu calma."
  },
  {
      id: "elias_minecraft",
      title: "Elías y el Creeper Traicionero",
      colorScheme: "emerald",
      paragraphs: [
          "Elías pasó tres horas construyendo una base increíble en Minecraft. Tenía todo: cultivos, cofres, ¡hasta una torre de vigilancia!",
          "De repente... 'Tsssss... ¡BOOM!'. Un creeper apareció de la nada y destruyó la mitad de su creación. Elías estaba listo para apagar el juego y no volver a jugar.",
          "Su abuelo Paco lo vio y le dijo: 'El creeper es como un mal día. No lo controlas. Pero sí controlas si te rindes, o si lo construyes de nuevo, esta vez aún mejor'."
      ],
      lesson: "La verdadera construcción no es la de bloques, sino la de tu paciencia al volver a empezar."
  },
  {
      id: "elias_natacion",
      title: "Elías y el Agua Fría",
      colorScheme: "sky",
      paragraphs: [
          "Era martes, día de natación. Hacía frío y Elías estaba cansado. 'Mamá, no quiero ir', le dijo a Jari.",
          "Su mamá Jari se sentó a su lado y le dijo: 'Yo no puedo nadar por ti, Elías. Solo puedo llevarte. La decisión de esforzarte en la alberca, aunque el agua esté fría, es 100% tuya'.",
          "Elías entendió que el coraje no es no tener frío, sino meterse al agua a pesar de él. Ese día, nadó más rápido que nunca."
      ],
      lesson: "El coraje es hacer lo correcto aunque resulte incómodo o difícil."
  },
  {
      id: "elias_switch",
      title: "Elías, Elisa y el Nintendo",
      colorScheme: "red",
      paragraphs: [
          "Era el turno de Elías de jugar Zelda. Justo cuando iba a vencer a un jefe, su abuela Estela le recordó que debía ayudarla a guardar las compras.",
          "Elías quería decir 'no', pero activó su poder de Justicia. Pensó: 'Ella siempre me ayuda a mí. Es justo que yo la ayude a ella'.",
          "Pausó el juego y la ayudó con una sonrisa."
      ],
      lesson: "La justicia es actuar por el bien de los demás, antes que por tu propio gusto."
  },

  // --- Historias Clásicas ---
  {
      id: "epicteto",
      title: "Epicteto, el Esclavo Sabio",
      colorScheme: "cyan",
      paragraphs: [
          "Había una vez un hombre llamado Epicteto que nació como esclavo. Tenía un dueño cruel que un día ¡le rompió la pierna! 😢",
          "En lugar de enojarse toda su vida, Epicteto decidió: 'No puedo controlar lo que me hicieron, pero SÍ puedo controlar cómo pienso sobre ello.'",
          "Estudió, aprendió, y cuando fue libre, se convirtió en uno de los maestros más sabios de la historia. Enseñó que nuestra verdadera libertad está en nuestra mente."
      ],
      lesson: "No importa qué cosas malas te pasen, siempre puedes elegir cómo responder."
  },
  {
      id: "marco_aurelio",
      title: "El Emperador que Escribía su Diario",
      colorScheme: "amber",
      paragraphs: [
          "Marco Aurelio era el hombre más poderoso del mundo: ¡era emperador de Roma! Tenía ejércitos, palacios y todo el oro que puedas imaginar. 👑",
          "Pero cada noche, escribía en su diario recordándose a sí mismo: 'No importa que sea emperador, sigo siendo solo una persona. Debo ser bueno, justo y sabio.'",
          "Incluso el hombre más poderoso necesitaba recordarse ser humilde y bueno cada día."
      ],
      lesson: "No importa quién eres, siempre debes trabajar en ser una mejor persona."
  },
  {
      id: "bambu",
      title: "La Paciencia del Bambú Japonés",
      colorScheme: "green",
      paragraphs: [
          "Cuando siembras una semilla de bambú japonés, ¡no ves nada durante siete años! Solo riegas y esperas, mientras parece que nada ocurre.",
          "Pero durante esos siete años, el bambú está creando un sistema de raíces increíblemente fuerte bajo tierra.",
          "Y entonces, en solo seis semanas, ¡el bambú crece más de 30 metros! Su fuerza invisible se vuelve visible."
      ],
      lesson: "El esfuerzo que pones hoy (como estudiar o entrenar) construye las 'raíces' para tu éxito de mañana."
  },
  {
      id: "granjero_roca",
      title: "El Granjero y la Roca",
      colorScheme: "stone",
      paragraphs: [
          "Un granjero tenía una enorme roca en medio de su campo. Odiaba esa roca. Cada año, rompía sus arados y le hacía perder tiempo.",
          "Un día, harto, tomó una barra de hierro y decidió moverla. Le costó horas, sudor y esfuerzo, pero finalmente logró sacarla.",
          "Debajo de la roca, encontró un cofre lleno de oro. El obstáculo que tanto odiaba era, en realidad, su tesoro."
      ],
      lesson: "El obstáculo es el camino. Lo que te parece más difícil es, a menudo, lo que te hará más fuerte o te dará un tesoro."
  }
];
