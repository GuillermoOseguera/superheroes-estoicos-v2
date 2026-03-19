export type StoryColor = "cyan" | "amber" | "red" | "blue" | "gray" | "green" | "purple" | "yellow" | "stone" | "orange" | "emerald" | "sky" | "fuchsia" | "indigo" | "rose";

export interface Story {
  id: string;
  title: string;
  colorScheme: StoryColor;
  paragraphs: string[];
  lesson: string;
}

export const STORIES: Story[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // HISTORIAS DE ELÍAS (Personales, cercanas a su vida)
  // ═══════════════════════════════════════════════════════════════════════════
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
  {
    id: "elias_examen",
    title: "Elías y el Examen Sorpresa",
    colorScheme: "amber",
    paragraphs: [
      "El lunes por la mañana, la maestra anunció: '¡Examen sorpresa de matemáticas!'. Todos empezaron a quejarse.",
      "Elías sintió un nudo en el estómago. No había estudiado. Pero en vez de entrar en pánico, pensó: 'No puedo cambiar que hay examen, pero sí puedo hacer lo mejor con lo que ya sé'.",
      "Respondió lo que pudo con calma. Cuando recibió su nota, no fue perfecta, pero aprendió algo más valioso: no todo depende de la preparación, sino de cómo reaccionas en el momento."
    ],
    lesson: "No puedes controlar los eventos inesperados, pero sí puedes controlar tu actitud frente a ellos."
  },
  {
    id: "elias_youtuber",
    title: "Elías y el Sueño del YouTuber",
    colorScheme: "red",
    paragraphs: [
      "Elías subió su primer video a YouTube: un tutorial de Minecraft. Le puso música, edición, ¡todo! Esperaba miles de vistas.",
      "Pasaron dos semanas... 14 vistas. Cuatro eran de su mamá. Elías estaba devastado y quería borrar el canal.",
      "Su papá le dijo: 'Los grandes creadores no nacieron con millones de fans. Empezaron exactamente donde tú estás. La diferencia es que ellos siguieron subiendo videos'. Elías grabó el segundo video esa misma noche."
    ],
    lesson: "La fama no se controla, pero la disciplina de seguir creando sí. Los grandes resultados nacen de la constancia."
  },
  {
    id: "elias_amigo_enojado",
    title: "Elías y el Amigo Enojado",
    colorScheme: "stone",
    paragraphs: [
      "Diego, el mejor amigo de Elías, dejó de hablarle de un día para otro. No le contestaba los mensajes ni lo miraba en el recreo.",
      "Elías se sintió herido y confundido. Su primer impulso fue enojarse también y decirle algo feo.",
      "Pero recordó una enseñanza estoica: 'Si alguien te insulta o te ignora, el problema es de esa persona, no tuyo. Tú solo controlas cómo respondes'. Decidió acercarse a Diego con calma y preguntarle: '¿Te pasa algo? ¿Puedo ayudarte?'. Resultó que Diego estaba pasando por un problema familiar."
    ],
    lesson: "Cuando alguien te trata mal, en lugar de reaccionar con ira, responde con curiosidad y compasión. No sabes qué batalla enfrenta."
  },
  {
    id: "elias_comparacion",
    title: "Elías y la Trampa de Compararse",
    colorScheme: "fuchsia",
    paragraphs: [
      "En la escuela, Sofía siempre sacaba 10 en todo. Elías sacaba 8 y a veces 7. Empezó a sentirse menos inteligente.",
      "Un día vio un video de Sócrates que decía: 'La envidia es la tristeza que sientes por el bien ajeno'. Elías entendió que compararse con Sofía era como comparar un pez con un pájaro.",
      "Decidió competir solo consigo mismo. Si ayer sacó 7, hoy buscaría un 7.5. Su único rival sería el Elías de ayer."
    ],
    lesson: "Tu única competencia real eres tú mismo. Mejorar un 1% cada día te convierte en un gigante con el tiempo."
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HISTORIAS CLÁSICAS ESTOICAS (Filósofos y parábolas)
  // ═══════════════════════════════════════════════════════════════════════════
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
  },
  {
    id: "seneca_ira",
    title: "Séneca y la Copa Rota",
    colorScheme: "red",
    paragraphs: [
      "Séneca, uno de los hombres más ricos de Roma, tenía una copa de cristal bellísima. Un día, un sirviente la rompió por accidente.",
      "Los demás romanos ricos habrían castigado duramente al sirviente. Pero Séneca preguntó: '¿Se lastimó alguien?'. Cuando le dijeron que no, sonrió.",
      "'Una copa rota no vale la paz de mi mente', dijo Séneca. 'Si me enojo por un pedazo de vidrio, mi espíritu será más frágil que la copa'."
    ],
    lesson: "No vale la pena perder tu paz interior por cosas materiales. Las cosas se rompen; tú no tienes que romperte con ellas."
  },
  {
    id: "diogenes_linterna",
    title: "Diógenes y la Linterna",
    colorScheme: "amber",
    paragraphs: [
      "Diógenes era un filósofo griego muy extraño. Un día salió al mercado en pleno mediodía con una linterna encendida.",
      "La gente lo miraba confundida. '¿Qué haces buscando con una linterna si hay sol?', preguntaron.",
      "'Busco a un ser humano honesto', respondió Diógenes. Con esto quería decir que la verdadera riqueza de una persona no está en sus posesiones, sino en su honestidad y carácter."
    ],
    lesson: "Ser honesto y auténtico vale más que todas las posesiones del mundo."
  },
  {
    id: "flecha_y_arbol",
    title: "La Flecha y el Árbol",
    colorScheme: "emerald",
    paragraphs: [
      "Un arquero disparó una flecha contra un enorme roble. La flecha se clavó apenas un centímetro y cayó al suelo.",
      "El árbol ni se inmutó. Sus raíces eran profundas, su tronco masivo, y la flecha era insignificante.",
      "Un viejo sabio que pasaba por ahí observó la escena y dijo: 'Sé como el roble. Si tus raíces (tus valores) son profundas, ningún insulto ni ofensa podrá derribarte'."
    ],
    lesson: "Cuando alguien te dice algo hiriente, recuerda: si tus valores son fuertes, las palabras rebotan como flechas en un roble."
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HISTORIAS MODERNAS (Situaciones cotidianas para niños y adolescentes)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "tienda_dulces",
    title: "La Tienda de Dulces",
    colorScheme: "fuchsia",
    paragraphs: [
      "Camila tenía $50 pesos y pasó frente a una tienda de dulces. Su estómago rugía. ¡Quería comprar todos los chocolates!",
      "Pero recordó que estaba ahorrando para un regalo de cumpleaños para su mamá. La tentación era ENORME.",
      "Respiró hondo, apretó los $50 en su bolsillo y siguió caminando. 'El chocolate dura cinco minutos', pensó. 'La sonrisa de mamá dura para siempre'. Eso es Templanza."
    ],
    lesson: "La templanza es elegir un bien mayor futuro sobre un placer pequeño del momento."
  },
  {
    id: "videojuego_nocturno",
    title: "La Batalla de Medianoche",
    colorScheme: "indigo",
    paragraphs: [
      "Eran las 11 de la noche. Mateo estaba a punto de ganar un evento especial en su juego favorito. Solo necesitaba una hora más.",
      "'Si me desvelo, mañana estaré agotado en la escuela', pensó. 'Pero si duermo, perderé el evento...'.",
      "Apagó la consola. Al día siguiente, descubrió que sus amigos que sí se desvelaron sacaron pésimas calificaciones. Mateo entendió: un juego se puede repetir, pero un día de aprendizaje perdido, no."
    ],
    lesson: "Un estoico sabe decirse 'no' a sí mismo, porque entiende que el descanso y la disciplina son más valiosos que cualquier recompensa virtual."
  },
  {
    id: "bully_escuela",
    title: "El Gigante del Pasillo",
    colorScheme: "red",
    paragraphs: [
      "Había un chico grande en la escuela que empujaba a los más pequeños en el pasillo. Todos le tenían miedo. Un día empujó a Tomás.",
      "Tomás se levantó del suelo, se sacudió la tierra, lo miró a los ojos y le dijo con voz firme pero calmada: 'Puedes empujarme, pero no puedes hacerme enojar. Eso solo yo lo controlo'.",
      "El bully se quedó sin palabras. Esperaba gritos o llanto, no calma. A partir de ese día, dejó de molestar a Tomás."
    ],
    lesson: "Tu reacción es tu superpoder. Cuando alguien intenta provocarte y tú decides no reaccionar con ira, le quitas todo su poder."
  },
  {
    id: "tarea_dificil",
    title: "La Tarea Imposible",
    colorScheme: "sky",
    paragraphs: [
      "La maestra dejó un proyecto de ciencias que parecía imposible. Valentina abrió la libreta, leyó las instrucciones y la cerró de golpe. 'No puedo', dijo.",
      "Su papá, que era ingeniero, le sonrió: 'Nadie te pide que lo hagas todo de una vez. ¿Puedes hacer solo el primer paso? ¿Escribir el título y dibujar una línea?'.",
      "Valentina escribió el título. Luego la primera pregunta. Luego la segunda. Tres horas después, había terminado. La tarea 'imposible' se hizo paso a paso."
    ],
    lesson: "No mires la montaña completa. Solo da el siguiente paso. Uno a la vez, cualquier montaña se conquista."
  },
  {
    id: "perro_perdido",
    title: "El Perro que Se Perdió",
    colorScheme: "amber",
    paragraphs: [
      "Lucas salió al parque con su perro, Max. Un ruido fuerte asustó a Max y salió corriendo. Lucas lo buscó durante horas llorando.",
      "Su vecina, doña Carmen, lo vio y le dijo: 'Llorar está bien, pero mientras lloras, ¿estás buscando o te quedas parado?'. Lucas entendió.",
      "Se secó las lágrimas, hizo carteles, preguntó en las casas, y tres días después encontró a Max jugando en un jardín lejano. La acción derrotó a la desesperación."
    ],
    lesson: "Está bien sentir tristeza, pero no dejes que te paralice. Convierte tu dolor en acción."
  },
  {
    id: "hermano_favorito",
    title: "El Hermano Favorito",
    colorScheme: "rose",
    paragraphs: [
      "Daniela sentía que sus papás querían más a su hermano menor. Siempre lo cargaban, le daban más atención y le celebraban todo.",
      "Un día le reclamó a su mamá llorando. Su mamá la abrazó y le explicó: 'Tu hermano tiene 2 años, necesita más cuidados. Pero que lo cuide más no significa que te quiera menos'.",
      "Daniela recordó las palabras de Epicteto: 'No es lo que pasa lo que te molesta, sino lo que piensas sobre lo que pasa'. Cambió su pensamiento de 'no me quieren' a 'me quieren diferente', y la tristeza desapareció."
    ],
    lesson: "Muchas veces sufrimos no por lo que pasa, sino por la historia que nos contamos sobre lo que pasa. Cambia la historia, cambia el sentimiento."
  },
  {
    id: "primer_dia_escuela",
    title: "El Primer Día en la Escuela Nueva",
    colorScheme: "cyan",
    paragraphs: [
      "A Renata le cambiaron de escuela. No conocía a nadie. En el recreo, todos tenían sus grupos de amigos y ella estaba sola en una banca.",
      "Sintió ganas de llorar y pedirle a su mamá que la cambiara de vuelta. Pero pensó: 'No puedo controlar estar aquí, pero sí puedo controlar a quién le sonrío'.",
      "Se acercó a un grupo que jugaba con cartas y dijo: '¿Me enseñan a jugar?'. Ese día hizo tres amigas nuevas. La valentía de acercarse fue su superpoder."
    ],
    lesson: "El miedo a lo desconocido es normal, pero el coraje de dar el primer paso es lo que te hace héroe."
  },
  {
    id: "celular_roto",
    title: "El Celular Que Se Cayó al Agua",
    colorScheme: "indigo",
    paragraphs: [
      "Gabriel estaba tomando una foto junto a la fuente del parque cuando su celular se resbaló y cayó al agua. Sintió que el mundo se le venía encima.",
      "Estuvo furioso todo el día. Su hermano mayor le dijo: 'Entiendo tu enojo, pero dime: ¿enojarte va a secar el teléfono?'. Gabriel se quedó en silencio.",
      "Entendió que enojarse por algo que ya pasó es como intentar apagar un incendio echándole más gasolina. Decidió buscar soluciones en vez de quedarse atrapado en la frustración."
    ],
    lesson: "Lo que ya pasó, ya pasó. Ningún enojo del presente puede cambiar el pasado. Usa tu energía para buscar soluciones, no para alimentar la frustración."
  },
  {
    id: "nota_injusta",
    title: "La Nota Injusta",
    colorScheme: "orange",
    paragraphs: [
      "Andrea trabajó durísimo en su proyecto de historia. Lo entregó perfectamente investigado. Cuando recibió su calificación, vio un 7. Su compañero, que copió de internet, sacó 9.",
      "Andrea estaba furiosa. '¡No es justo!', le dijo a su papá. Él respondió: 'Tienes razón, no es justo. Pero dime: ¿aprendiste haciendo tu proyecto?'. Andrea asintió.",
      "'Entonces llevas el verdadero 10 dentro de ti. Un número en un papel no define tu esfuerzo real', concluyó su padre."
    ],
    lesson: "La verdadera calificación no es un número, es lo que aprendiste en el proceso. Nadie puede quitarte el conocimiento."
  },
  {
    id: "fiesta_no_invitado",
    title: "La Fiesta a la que No Te Invitaron",
    colorScheme: "rose",
    paragraphs: [
      "Sebastián vio las fotos de una fiesta a la que no lo invitaron. Todos sus amigos estaban ahí. Se sintió invisible y rechazado.",
      "Pasó dos días triste hasta que su abuelo le dijo una verdad poderosa: 'No puedes obligar a nadie a invitarte. Pero puedes elegir no dejar que la ausencia de una invitación defina tu valor'.",
      "Sebastián se dio cuenta de que las redes sociales le mostraban solo los momentos 'felices' de otros. Decidió organizar su propia reunión con los amigos que sí lo valoraban."
    ],
    lesson: "Tu valor no depende de cuántas invitaciones recibes, sino de cómo te tratas a ti mismo y cómo tratas a los demás."
  },
  {
    id: "error_publico",
    title: "El Error Frente a Todos",
    colorScheme: "red",
    paragraphs: [
      "En la obra de teatro de la escuela, Emilia olvidó su diálogo frente a 200 padres de familia. Se quedó congelada en el escenario. Algunos padres se rieron.",
      "Detrás del escenario, Emilia quería desaparecer. Su maestra le dijo algo que cambió su vida: 'Los valientes no son los que nunca se equivocan, sino los que se equivocan frente a todos y vuelven a subir al escenario'.",
      "La siguiente función, Emilia no solo recordó sus líneas, sino que las dijo con más fuerza que nadie."
    ],
    lesson: "Equivocarse en público duele, pero es la escuela del coraje. Cada error público que superas te convierte en alguien inquebrantable."
  },
  {
    id: "abuelo_enfermo",
    title: "El Abuelo y la Lluvia",
    colorScheme: "sky",
    paragraphs: [
      "El abuelo de María estaba enfermo en el hospital. María estaba muy triste y no podía concentrarse en nada. Quería que todo volviera a la normalidad.",
      "Su mamá le leyó algo que escribió Marco Aurelio: 'No pidas que las cosas pasen como tú quieres. Desea que pasen como pasan, y vivirás con serenidad'.",
      "María no podía curar a su abuelo, pero sí podía visitarlo, darle ánimos, dibujarle tarjetas y hacerlo sonreír. Eso estaba en su caja verde."
    ],
    lesson: "Cuando no puedes cambiar una situación dolorosa, enfócate en lo que SÍ puedes hacer: dar amor, estar presente y ser fuerte para los que te necesitan."
  },
  {
    id: "carrera_ultimo",
    title: "El Último de la Carrera",
    colorScheme: "green",
    paragraphs: [
      "En el día deportivo, Andrés llegó último en la carrera de 100 metros. ÚLTIMO. Sus compañeros se burlaron.",
      "Pero Andrés cruzó la meta sonriendo. Su mamá le preguntó: '¿No te molesta haber perdido?'. Andrés respondió: 'Mamá, el año pasado ni siquiera me atreví a correr. Hoy terminé la carrera. El verdadero último lugar es el que nunca lo intenta'.",
      "Al año siguiente, Andrés quedó en tercer lugar. No porque fuera el más rápido, sino porque fue el que más practicó."
    ],
    lesson: "Terminar último es infinitamente mejor que nunca empezar. La vergüenza dura un día; el arrepentimiento de no intentarlo dura para siempre."
  },
  {
    id: "regalo_caro",
    title: "El Regalo Que No Era Caro",
    colorScheme: "amber",
    paragraphs: [
      "Era Navidad y todos los compañeros de clase de Pablo traían juguetes caros y el último iPhone. Pablo recibió un libro viejo de su abuela.",
      "Se sintió avergonzado al principio. Pero al abrirlo, encontró una nota: 'Este libro me lo regaló mi abuelo. Dentro están las historias que me enseñaron a ser valiente. Ahora te toca a ti'.",
      "Pablo leyó el libro completo en las vacaciones. Años después, no recordaba qué juguetes trajeron sus compañeros, pero ese libro lo acompañó toda su vida."
    ],
    lesson: "Las cosas más valiosas de la vida no tienen precio. Un libro, un abrazo o una lección de vida valen más que el dispositivo más caro."
  },
  {
    id: "red_social_likes",
    title: "El Cazador de Likes",
    colorScheme: "fuchsia",
    paragraphs: [
      "Mariana subía fotos a redes sociales esperando likes. Si una foto no llegaba a 100 likes, la borraba sintiéndose fea.",
      "Un día publicó una foto natural, sin filtros, y recibió solo 12 likes. Estaba destrozada. Su prima mayor le dijo: 'Estás dejando que desconocidos decidan cuánto vales. ¿Te parece justo darte ese poder a un extraño?'.",
      "Mariana se desconectó una semana. Al volver, publicó solo lo que genuinamente quería compartir, sin importar los números. Su felicidad dejó de depender de un corazón rojo en una pantalla."
    ],
    lesson: "Tu valor no se mide en likes, seguidores ni comentarios. Un estoico sabe que la aprobación más importante es la propia."
  },
  {
    id: "perder_amigo",
    title: "Cuando un Amigo Se Va",
    colorScheme: "stone",
    paragraphs: [
      "Miguel y Óscar eran inseparables desde kínder. Pero en quinto de primaria, la familia de Óscar se mudó a otra ciudad. Miguel sintió que le arrancaban una parte del alma.",
      "Los primeros días fueron terribles. Miguel no quería jugar con nadie más. Su maestra le dijo: 'La amistad no se acaba por la distancia. Pero si solo miras lo que perdiste, te perderás lo que puedes ganar'.",
      "Miguel empezó a hablar por videollamada con Óscar cada semana, y también hizo nuevos amigos. No reemplazó a Óscar; simplemente amplió su círculo."
    ],
    lesson: "Las personas importantes no desaparecen de tu vida; solo cambian de lugar. Un estoico no se aferra al pasado sino que abraza el presente."
  },
  {
    id: "mentor_secreto",
    title: "El Mentor Secreto del Recreo",
    colorScheme: "emerald",
    paragraphs: [
      "En la escuela de Luciana, un niño nuevo siempre comía solo. Todos lo ignoraban porque era callado y vestía diferente.",
      "Un día Luciana se sentó a su lado. Se llamaba Kenji y resultó que era increíblemente bueno dibujando. Empezó a enseñarle a Luciana técnicas de dibujo que ella no encontraría ni en YouTube.",
      "Luciana aprendió algo poderoso: los mejores maestros no siempre están en un salón de clases. A veces están sentados solos en una banca, esperando que alguien tenga el coraje de sentarse a su lado."
    ],
    lesson: "La justicia es tratar a todos con dignidad, especialmente a quienes nadie mira. Nunca sabes qué tesoro esconde la persona que todos ignoran."
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HISTORIAS PROFUNDAS Y REFLEXIVAS (Nuevas)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "barco_tormenta",
    title: "El Capitán y la Tormenta Implacable",
    colorScheme: "cyan",
    paragraphs: [
      "Cuenta la leyenda que el mejor capitán de la antigua Grecia quedó atrapado en la peor tormenta jamás vista. Olas gigantescas golpeaban el barco, los relámpagos iluminaban la noche y el viento destrozaba las velas. La tripulación, aterrorizada, corría de un lado a otro pidiendo milagros o maldiciendo su suerte, consumiendo toda su energía en el pánico.",
      "El capitán, sin embargo, permanecía atado al timón, con los ojos fijos en la brújula y las manos firmes. No gritaba al cielo ni lloraba por el barco dañado. Simplemente giraba el timón hacia las olas para no volcar, dando órdenes claras a quienes aún podían escuchar.",
      "Cuando un joven marinero le preguntó cómo podía estar tan tranquilo mientras el mar intentaba hundirlos, el capitán respondió: 'Yo no puedo controlar los vientos, ni silenciar los truenos, ni decidir la altura de las olas. Hacer un berrinche por la tormenta no la detendrá. Pero soy el dueño absoluto de mi timón y de mis decisiones'.",
      "Al amanecer, el barco estaba maltrecho, pero todos sobrevivieron y llegaron al puerto. La tripulación entendió que el miedo inútil casi los ahoga, pero la calma y el enfoque en lo que sí podían controlar, los salvó."
    ],
    lesson: "Gritarle a la tormenta no la detendrá. Cuando el mundo a tu alrededor se vuelva caos, enfócate en gobernar tu propio timón."
  },
  {
    id: "dos_flechas",
    title: "La Leyenda de las Dos Flechas",
    colorScheme: "red",
    paragraphs: [
      "Un día, un sabio anciano paseaba por el bosque con su joven aprendiz. De pronto, un accidente ocurrió: el aprendiz tropezó y una espina profunda se clavó en su pierna. El joven gritó de dolor, pero inmediatamente después empezó a llorar inconsolablemente diciendo: '¡Por qué a mí! ¡Siempre tengo mala suerte! ¡Nunca podré volver a caminar bien!'.",
      "El sabio lo ayudó a sentarse y le dijo: 'Escucha bien. En la vida, cuando nos lastimamos, el universo nos dispara una primera flecha. Esa flecha es el dolor físico o el evento desafortunado inevitable. La espina en tu pierna es la primera flecha, y es natural que duela'.",
      "Luego añadió: 'Pero todo lo que estás gritando ahora —tu queja, tu victimismo, tu sufrimiento por el futuro— es una segunda flecha. Y lo peor de todo, es que esa segunda flecha te la estás disparando tú mismo al corazón'.",
      "El aprendiz se secó las lágrimas, guardó silencio y dejó que el sabio le retirara la espina. El dolor seguía ahí, pero el sufrimiento insoportable había desaparecido mágicamente al soltar sus quejas."
    ],
    lesson: "El dolor físico o los malos eventos (la primera flecha) son inevitables. El sufrimiento y la queja (la segunda flecha) son opcionales. No te dispares a ti mismo."
  },
  {
    id: "arquero_ciego",
    title: "El Arquero y el Espectador",
    colorScheme: "amber",
    paragraphs: [
      "En un gran torneo, un joven y talentoso arquero demostró su habilidad acertando tres veces seguidas en el centro exacto de la diana. La multitud enloqueció, y el joven, inflado de orgullo, retó a un viejo maestro que observaba en silencio.",
      "El maestro aceptó. Sin embargo, no llevó al joven a otra diana en el campo, sino al borde de un profundo abismo. Sacó su arco, se paró en un tronco podrido que asomaba al precipicio y disparó su flecha hacia un árbol lejano, acertando con total calma.",
      "'Ahora es tu turno', dijo el maestro. El joven arquero se acercó al borde, pero al mirar el abismo negro debajo de sus pies, sus manos empezaron a temblar. El sudor le nubló la vista. Disparó y la flecha ni siquiera rozó el árbol.",
      "El maestro le sonrió: 'Tienes gran habilidad con el arco, pero muy poca habilidad con tu mente. Cuando el terreno era firme y la gente te aplaudía, tu centro estaba en el orgullo. Cuando apareció el peligro, tu centro fue el miedo. Un verdadero maestro dispara igual en un jardín que en el borde de un abismo, no porque le importe dar en el blanco, sino porque su mente permanece imperturbable'."
    ],
    lesson: "Si tu paz depende de los aplausos o de la comodidad total, te derrumbarás cuando el suelo tiemble. Tu enfoque debe estar en tu propia mente, no en la diana."
  },
  {
    id: "rey_tiempo",
    title: "El Rey Que Quería Atrapar el Tiempo",
    colorScheme: "indigo",
    paragraphs: [
      "Hubo una vez un poderoso rey que tenía un miedo terrible a envejecer y a que sus momentos felices terminaran. Cuando organizaba una gran fiesta, a mitad de la noche se ponía a llorar, angustiado porque sabía que la música eventualmente pararía y los invitados se irían.",
      "Mandó a construir relojes gigantes e intentó prohibir a sus súbditos mencionar la palabra 'mañana'. Pero la angustia lo consumía, ya que nunca podía disfrutar el presente por el miedo al futuro.",
      "Un filósofo peregrino le ofreció un remedio. Le entregó un anillo con una inscripción en su interior y le dijo: 'Lee esto cada vez que estés excesivamente feliz, y también cuando estés profundamente triste'.",
      "El rey abrió el anillo. Decía: 'Esto también pasará'. Al principio le pareció deprimente. Pero luego entendió la lección: si las cosas malas pasan, no hay razón para la desesperación; y si las cosas buenas también pasan, no hay tiempo que perder en angustias. Aprendió a vivir el minuto exacto, aceptando que la belleza de un momento reside precisamente en que no durará para siempre."
    ],
    lesson: "Amor Fati. Ama tu destino tal cual es. Al aceptar que todo es temporal, dejas de aferrarte al pasado o temer al futuro, y empiezas a disfrutar el presente."
  },
  {
    id: "mochila_piedras",
    title: "La Mochila de las Ofensas",
    colorScheme: "stone",
    paragraphs: [
      "Un guerrero viajaba en busca de la iluminación, pero se sentía constantemente agotado e infeliz. Le molestaba todo: recordaba cómo un mercader lo había estafado hacía meses, cómo su antiguo maestro lo había regañado años atrás, y cómo alguien se había burlado de su armadura el día anterior.",
      "En su camino encontró a una ermitaña y le pidió ayuda para aliviar su carga. La ermitaña le dio una mochila vacía y le dijo: 'Cada vez que recuerdes algo malo que te hayan hecho y te sientas enojado, mete una piedra en esta mochila y cárgala en tu espalda'.",
      "Al cabo de unas semanas, la mochila era tan pesada que el guerrero apenas podía caminar. Estaba lastimado y al borde del colapso. Buscó de nuevo a la ermitaña y le exigió una cura para el dolor de espalda.",
      "La ermitaña simplemente desabrochó la mochila y la dejó caer al suelo. 'Tú mismo decidiste cargar cada piedra mucho tiempo después de que el evento sucedió', le explicó. 'El rencor es un veneno que te tomas tú esperando que el otro muera. Suelta el peso'."
    ],
    lesson: "Aferrarse a ofensas pasadas o a la injusticia es cargar piedras innecesarias. Perdonar y soltar no es un regalo para el ofensor, es libertad para ti."
  },
  {
    id: "caballo_salvaje",
    title: "El Jinete y el Caballo Salvaje",
    colorScheme: "emerald",
    paragraphs: [
      "Un joven impulsivo compró un caballo negro, hermoso pero salvaje. El caballo corría desbocado, pateaba a quien se acercara y parecía imposible de domar. El joven intentaba montarlo a la fuerza, usando látigos y gritos, pero el caballo solo se volvía más agresivo y a menudo lo tiraba al polvo.",
      "Cansado y herido, el joven acudió al domador más respetado del pueblo. El domador no llevó un látigo al corral; llevó zanahorias, paciencia y una soga suave. Pasó días sentándose en silencio cerca del caballo, mostrándole que no era una amenaza, hasta que el animal le permitió tocarlo.",
      "'Tu mente impulsiva es como este caballo salvaje', le explicó el domador al joven. 'Si tus emociones (el enojo, el miedo, el deseo extremo) toman el control, te arrastrarán y te estrellarán contra las piedras. Si intentas reprimirlas con violencia, te derribarán'.",
      "'La verdadera maestría no es no sentir, sino acercarte a tus emociones con razón, entender por qué están ahí y guiarlas con una intención serena'."
    ],
    lesson: "La templanza no es eliminar las emociones, sino domarlas como un buen jinete doma a su caballo: con calma, razón y dirección, sin dejarse arrastrar."
  },
  {
    id: "vasija_rota",
    title: "La Vasija Reparada (Kintsugi)",
    colorScheme: "rose",
    paragraphs: [
      "En el palacio de un shogun en Japón se encontraba una antigua y valiosísima vasija de porcelana. Un día, por descuido durante la limpieza, la vasija cayó y se rompió en doce pedazos. El shogun estaba desconsolado e iba a desechar los fragmentos.",
      "Sin embargo, un artista le pidió quedarse con los pedazos. Semanas después, el artista regresó al palacio y presentó la vasija. No solo la había pegado, sino que había rellenado todas las grietas con oro líquido.",
      "La vasija ahora tenía cicatrices doradas brillando en su superficie. En lugar de esconder sus roturas, las celebraba. El shogun quedó maravillado, pues la vasija era ahora mucho más hermosa y valiosa que antes de romperse.",
      "El artista hizo una reverencia profunda: 'Las personas somos iguales a esta vasija. Los golpes y fracasos nos rompen, pero no somos basura por ello. Cuando reconstruimos nuestro carácter con aprendizaje y resiliencia, nuestras cicatrices se vuelven líneas de oro. Somos más valiosos justamente porque estuvimos rotos y logramos sanar'."
    ],
    lesson: "Tus fracasos y momentos difíciles no te arruinan. Si aplicas la sabiduría, te reconstruyes más fuerte, más humilde y mucho más valioso."
  },
  {
    id: "pajaro_jaula",
    title: "El Pájaro y la Puerta Abierta",
    colorScheme: "sky",
    paragraphs: [
      "Durante años, un hermoso pájaro tropical vivió encerrado en una pequeña jaula dorada. Pasaba los días saltando de un palo a otro, frustrado, mirando al cielo y deseando, por encima de todo, poder volar hacia los árboles.",
      "Un día, debido a un fuerte ventarrón, la jaula se cayó de la mesa y la puerta se abrió de par en par. El dueño no estaba en casa. Era la oportunidad perfecta.",
      "Pero el pájaro se asomó por la puerta y vio el inmenso cielo, imaginó a los halcones que podrían cazarlo, las tormentas y la falta de comida fácil. El miedo fue tan grande que retrocedió. Con su propio pico, empujó la puerta hasta cerrarla y se acurrucó en su esquina de siempre, convencido de que al menos ahí, estaba 'seguro'.",
      "A veces la vida nos ofrece la oportunidad exacta que hemos estado esperando, el cambio que ansiábamos. Pero nos acostumbramos tanto a quejarnos de nuestras limitaciones que, cuando la puerta de la libertad y el desafío se abre, nosotros mismos decidimos quedarnos encerrados."
    ],
    lesson: "La libertad exige valentía. No culpes a la jaula si, cuando tienes la puerta abierta para intentar algo nuevo, prefieres la comodidad de lo conocido."
  },
  {
    id: "mendigo_copa",
    title: "El Mendigo y la Copa Sin Fondo",
    colorScheme: "amber",
    paragraphs: [
      "Un mendigo muy ambicioso se paró frente a la carroza del rey y no lo dejó avanzar. El rey, divirtiéndose, le dijo: 'Pídeme lo que quieras y te lo daré'. El mendigo extendió una pequeña taza de madera de su propiedad y dijo: 'Solo llene esta taza con monedas de oro'.",
      "El rey, riendo ante la modesta petición, ordenó a su tesorero que lo hiciera. Sin embargo, tan pronto como las monedas tocaban el fondo de la taza, desaparecían. El tesorero vació una bolsa entera, luego un cofre, y la taza seguía vacía pidiendo más.",
      "El rey, estupefacto y con su tesoro casi vacío, le gritó al mendigo: '¡Detente! ¿De qué está hecha esa taza maldita?'.",
      "El mendigo sonrió amargamente y respondió: 'Está hecha de los deseos humanos, majestad. No importa cuánto dinero, poder, fama o cosas materiales le arrojes; nunca, jamás se llena'. Esa tarde, el rey comprendió que la única forma de ser verdaderamente rico, era dejar de desear más."
    ],
    lesson: "La sed de tener más cosas es como una taza sin fondo. La verdadera riqueza no es poseer mucho, sino necesitar menos y valorar lo que ya se tiene."
  },
  {
    id: "escultor_criticas",
    title: "La Obra del Escultor Sordo",
    colorScheme: "stone",
    paragraphs: [
      "Un escultor pasaba todos los días tallando un inmenso bloque de mármol en la plaza principal de la ciudad. Mientras trabajaba, todos opinaban. El panadero decía: 'La nariz es muy grande'. El soldado decía: 'Los brazos son delgados'. El político comentaba: 'La pose no tiene autoridad'.",
      "Si el escultor los hubiera escuchado, habría limado la nariz hasta desaparecerla, agrandado los brazos desproporcionadamente y habría estropeado todo intentando complacer a cientos de personas diferentes al mismo tiempo.",
      "Afortunadamente, el escultor no prestó atención a ninguna de las críticas y siguió rigurosamente la visión de su propio diseño. Tras meses de trabajo, desveló la estatua terminada y todos enmudecieron ante la obra maestra indiscutible que se presentó ante ellos.",
      "Resulta que el escultor no era sordo de nacimiento; simplemente decidió ser sordo temporalmente a las opiniones ajenas. Sabía que quien intenta esculpir su vida para agradar a todos, termina creando un monstruo sin forma."
    ],
    lesson: "No permitas que las opiniones cambiantes y desinformadas de los demás cincelen tu vida. Rígete por tus propios principios y virtud; tu vida es tu obra maestra."
  },
  {
    id: "guerrero_impenetrable",
    title: "El Guerrero Que Nunca Empuñó Su Espada",
    colorScheme: "red",
    paragraphs: [
      "Había un guerrero en un monasterio famoso por no haber perdido jamás un combate, a pesar de que nunca se le veía desenvainar su espada en el dojo. Un joven desafiante, frustrado por esta reputación, viajó semanas solo para enfrentarlo.",
      "Al llegar, el joven comenzó a insultar al guerrero. Insultó a sus antepasados, se burló de su técnica, lo llamó cobarde e incluso escupió en el piso de madera frente a él. El guerrero mayor simplemente se sentó a observar, con una expresión de absoluta calma y desapego, tomando té.",
      "Varias horas después, el joven estaba afónico, exhausto y confundido. Se dio por vencido y preguntó casi llorando: '¿Por qué no respondiste a mis ataques? ¿No tienes honor?'.",
      "El guerrero anciano finalmente habló: 'Si alguien viene a darte un regalo, y tú no lo aceptas, ¿a quién pertenece el regalo?'. El joven dudó y dijo: 'Pues a quien intentó darlo'. 'Exactamente', sonrió el anciano. 'Tu ira y tus insultos fueron tu regalo. Yo decidí no aceptarlos. Siguen siendo 100% tuyos'."
    ],
    lesson: "Nadie puede ofenderte sin tu permiso. Si decides no tomar como personal una ofensa, el daño regresa íntegro a la persona que intentó herirte."
  },
  {
    id: "laberinto_respuestas",
    title: "El Laberinto en la Oscuridad",
    colorScheme: "fuchsia",
    paragraphs: [
      "Un hombre fue castigado y abandonado en un laberinto en total oscuridad. Cada vez que daba un paso, chocaba contra una pared diferente. Intentaba correr buscando desesperadamente la salida, pero solo lograba agotarse, lastimarse y terminar en el piso llorando de frustración.",
      "De pronto recordó los consejos de un antiguo amigo. Se levantó, cerró los ojos (pues abrirlos en la oscuridad era igual de inútil) y colocó su mano derecha firmemente sobre la pared de su costado.",
      "Comenzó a caminar muy lentamente, sin soltar jamás el contacto con esa pared continua. Daba pasos cortos, midiendo el terreno. Pasaron horas y no había esperanza a la vista. Pero él no se desesperó: confió en que, matemáticamente, seguir una sola pared sin soltarla lo llevaría inevitablemente a la salida.",
      "Finalmente, sintió la brisa fresca y salió al exterior. Comprendió que cuando no puedes ver el panorama general de un problema enorme, correr despavorido en todas direcciones te lastima. La clave es apegarse a un pequeño buen hábito diario (la mano en la pared) y avanzar paso a paso hasta que la salida aparezca."
    ],
    lesson: "Ante un problema inmenso que parece no tener solución inmediata, no te desesperes. Elige una acción correcta básica, aférrate a ella y da un paso a la vez de forma repetitiva."
  },
  {
    id: "arbol_frutos",
    title: "El Árbol Viejo y el Huerto",
    colorScheme: "green",
    paragraphs: [
      "Un campesino tenía un hermoso manzano en su huerto, el cual daba frutos tan rojos y dulces que eran la envidia de la ciudad. Sin embargo, un invierno crudo casi aniquila las raíces del árbol y un rayo le arrancó sus ramas principales.",
      "El campesino lloró creyendo que el árbol moriría. Pero para la primavera, el manzano reunió la poca fuerza que le quedaba y, en la única pequeña rama que sobrevivió, brotaron cinco manzanas perfectas.",
      "El manzano no se deprimió comparando cómo antes daba cien manzanas y ahora solo cinco. Tampoco decidió no dar ninguna 'porque cinco no eran suficientes'. Usó todo lo que la naturaleza le dejó a su disposición para seguir cumpliendo su propósito de dar fruto.",
      "Nosotros muchas veces, tras una pérdida o una falla, sentimos que no somos los mismos de antes y dejamos de esforzarnos por completo. Pero nuestro trabajo no es ser perfectos o producir lo mismo de siempre; es dar lo mejor con lo que nos queda justo en este momento."
    ],
    lesson: "Haz lo mejor que puedas con las ramas que te quedan. No desprecies tus pequeñas acciones de bondad o esfuerzo solo porque juzgues que deberías ser capaz de más."
  },
  {
    id: "espejo_roto",
    title: "La Princesa y el Espejo Sin Azogue",
    colorScheme: "purple",
    paragraphs: [
      "Una joven princesa presumía ser la más bella de su reino. Su vida entera giraba en torno a vestirse y mirarse durante horas en un espejo mágico que importaron de tierras lejanas, el cual realzaba cada detalle de su belleza en alta definición.",
      "Un día, debido a un accidente, el lujoso espejo cayó y el cristal se hizo añicos. Creyendo que su belleza residía dentro de ese reflejo perfecto, la princesa se deprimió profundamente y no quiso salir de su habitación porque creía que nadie la querría sin su 'imagen perfecta'.",
      "Su consejero entró una mañana, corrió las cortinas para que entrara el sol y le entregó un pequeño cuenco de barro con agua de manantial. 'Mire su rostro en el agua, princesa', dijo. El reflejo en el agua era borroso e imperfecto, pero la brisa y la luz lo llenaban de vitalidad natural y paz.",
      "La princesa entendió: ella era la dueña del agua, de la vasija y de su propia piel. El espejo anterior solo era un objeto de cristal inerte que no definía quién era como gobernante ni su humanidad. El valor no radicaba en la perfección de la imagen devuelta, sino en lo real de quién observaba."
    ],
    lesson: "No permitas que tu percepción de ti mismo dependa de espejos artificiales (como las expectativas sociales, modas, o redes). Tu esencia y valor son independientes del lente que uses para mirarte."
  },
  {
    id: "reloj_arena_inverso",
    title: "El Hombre del Reloj de Arena Creciendo",
    colorScheme: "orange",
    paragraphs: [
      "Cuenta la historia que todos en la antigua Atenas llevaban un reloj de arena al cuello. Estos relojes eran extraños: empezaban vacíos abajo y la arena caía de un compartimento celestial invisible. Cuando se llenaba la parte de abajo, la persona pasaba al otro mundo. Todos vivían temerosos, mirando cómo la arena de abajo iba subiendo, midiendo lo poco que les quedaba.",
      "Pero había un filósofo estoico que caminaba sonriente. Nunca miraba con terror la arena acumulada abajo.",
      "Un día le preguntaron: '¿Por qué sonríes? ¿Acaso no ves que tu reloj de arena está ya a más de la mitad? Tu muerte se acerca inexorablemente'.",
      "Él contestó: 'Ustedes sufren porque ven la arena de abajo como tiempo perdido y muerte. Yo la veo diferente. Esa arena acumulada abajo es lo único que verdaderamente es MÍO. Nadie me la puede quitar, ni los dioses ni los tiranos. Cada grano abajo representa algo que ya viví, amé, aprendí o superé. Entre más arena tengo, más rico soy en vida'. La historia nos recuerda que el pasado bien vivido no es tiempo perdido, es nuestro tesoro más inexpugnable."
    ],
    lesson: "Memento Mori (recuerda que eres mortal) no es para tener miedo, sino para vivir el hoy intensamente. El tiempo que ha pasado es seguro y es tuyo para siempre; no lo llores, celébralo."
  }
];
