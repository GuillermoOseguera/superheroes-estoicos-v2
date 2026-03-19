export type WorryArea = "General" | "Futbol" | "Familia" | "Videojuegos" | "Actividades" | "Escuela" | "Amistades" | "Redes Sociales";
export type BoxColor = "green" | "red";

export interface Worry {
  id: string;
  text: string;
  correctBox: BoxColor;
  area: WorryArea;
}

export const ALL_WORRIES: Worry[] = [
  // Contexto: General (14 años)
  { id: "g1", text: "Mi reacción si saco una mala nota", correctBox: "green", area: "General" },
  { id: "g2", text: "El tema que vendrá en el examen", correctBox: "red", area: "General" },
  { id: "g3", text: "Cuántas horas estudio para el examen", correctBox: "green", area: "General" },
  { id: "g4", text: "Lo que mis amigos piensan de mi ropa", correctBox: "red", area: "General" },
  { id: "g5", text: "Ser honesto con mis padres", correctBox: "green", area: "General" },
  { id: "g6", text: "Que me inviten a una fiesta", correctBox: "red", area: "General" },
  { id: "g7", text: "Pedir ayuda en una materia que me cuesta", correctBox: "green", area: "General" },
  { id: "g8", text: "Lo que otros postean en redes sociales", correctBox: "red", area: "General" },
  { id: "g9", text: "Lo que *yo* decido postear en redes", correctBox: "green", area: "General" },
  { id: "g10", text: "Acostarme a una hora razonable", correctBox: "green", area: "General" },

  // Contexto: Futbol & Deportes
  { id: "f1", text: "Mi actitud si pierdo el partido de futbol", correctBox: "green", area: "Futbol" },
  { id: "f2", text: "Que el entrenador me ponga de titular", correctBox: "red", area: "Futbol" },
  { id: "f3", text: "El resultado final del partido", correctBox: "red", area: "Futbol" },
  { id: "f4", text: "El esfuerzo que pongo en el entrenamiento", correctBox: "green", area: "Futbol" },
  { id: "f5", text: "Felicitar al otro equipo si nos ganan", correctBox: "green", area: "Futbol" },
  { id: "f6", text: "Que las reglas del árbitro sean injustas", correctBox: "red", area: "Futbol" },
  { id: "f7", text: "Aceptar la tarjeta del árbitro sin gritar", correctBox: "green", area: "Futbol" },
  { id: "f8", text: "El clima lluvioso durante el partido", correctBox: "red", area: "Futbol" },
  { id: "f9", text: "Mi preparación física antes de la temporada", correctBox: "green", area: "Futbol" },

  // Contexto: Familia (Jari, Elisa, Paco, Estela)
  { id: "fa1", text: "Ser paciente con mi hermana Elisa", correctBox: "green", area: "Familia" },
  { id: "fa2", text: "Que Elisa me pida usar mi Switch", correctBox: "red", area: "Familia" },
  { id: "fa3", text: "Mi reacción si Elisa me molesta", correctBox: "green", area: "Familia" },
  { id: "fa4", text: "Ayudar a mi mamá Jari en la casa", correctBox: "green", area: "Familia" },
  { id: "fa5", text: "Que mi mamá Jari esté de mal humor", correctBox: "red", area: "Familia" },
  { id: "fa6", text: "Romper accidentalmente el objeto favorito de mi hermano", correctBox: "red", area: "Familia" },
  { id: "fa7", text: "Decir la verdad y pedir perdón por romperlo", correctBox: "green", area: "Familia" },
  { id: "fa8", text: "El castigo que me den mis papás", correctBox: "red", area: "Familia" },
  { id: "fa9", text: "Cumplir mi castigo sin quejarme", correctBox: "green", area: "Familia" },
  { id: "fa10", text: "Que mis papás cancelen mis planes por algo urgente", correctBox: "red", area: "Familia" },

  // Contexto: Videojuegos (Sonic, Minecraft, Switch)
  { id: "v1", text: "Terminar mis tareas antes de jugar Minecraft", correctBox: "green", area: "Videojuegos" },
  { id: "v2", text: "Que haya lag en la partida de Sonic", correctBox: "red", area: "Videojuegos" },
  { id: "v3", text: "El tiempo que decido jugar Switch", correctBox: "green", area: "Videojuegos" },
  { id: "v4", text: "Que un creeper explote mi casa en Minecraft", correctBox: "red", area: "Videojuegos" },
  { id: "v5", text: "Mi reacción si un creeper lo explota todo", correctBox: "green", area: "Videojuegos" },
  { id: "v6", text: "Que mis compañeros de equipo jueguen mal online", correctBox: "red", area: "Videojuegos" },
  { id: "v7", text: "No insultar a mis compañeros por el chat de voz", correctBox: "green", area: "Videojuegos" },
  { id: "v8", text: "Que el juego reciba una actualización fea", correctBox: "red", area: "Videojuegos" },

  // Contexto: Actividades (Natación, Karate)
  { id: "a1", text: "Ir a natación aunque esté cansado", correctBox: "green", area: "Actividades" },
  { id: "a2", text: "Ser el más rápido de la alberca", correctBox: "red", area: "Actividades" },
  { id: "a3", text: "Mi esfuerzo en la clase de natación", correctBox: "green", area: "Actividades" },
  { id: "a4", text: "Lo que opinaban mis amigos de que hacía karate", correctBox: "red", area: "Actividades" },
  { id: "a5", text: "Decidir si quiero probar karate otra vez", correctBox: "green", area: "Actividades" },

  // Contexto: Escuela
  { id: "e1", text: "Equivocarme o tartamudear al exponer frente a la clase", correctBox: "red", area: "Escuela" },
  { id: "e2", text: "Prestar atención a la maestra durante la explicación", correctBox: "green", area: "Escuela" },
  { id: "e3", text: "Si el maestro decide suspender el recreo hoy", correctBox: "red", area: "Escuela" },
  { id: "e4", text: "Mi respeto hacia el conserje y personal escolar", correctBox: "green", area: "Escuela" },
  { id: "e5", text: "Que un profesor sea injustamente estricto conmigo", correctBox: "red", area: "Escuela" },
  { id: "e6", text: "Cómo respondo educadamente a las críticas de un maestro", correctBox: "green", area: "Escuela" },
  { id: "e7", text: "Organizar mis apuntes antes del periodo de exámenes", correctBox: "green", area: "Escuela" },
  { id: "e8", text: "Que las vacaciones de verano terminen pronto", correctBox: "red", area: "Escuela" },

  // Contexto: Amistades
  { id: "am1", text: "Si un amigo decide dejar de hablarme sin razón", correctBox: "red", area: "Amistades" },
  { id: "am2", text: "Responder con calma a alguien que me insulta", correctBox: "green", area: "Amistades" },
  { id: "am3", text: "Que el grupo de amigos no quiera ir al cine que sugerí", correctBox: "red", area: "Amistades" },
  { id: "am4", text: "Disculparme si ofendí a alguien del grupo", correctBox: "green", area: "Amistades" },
  { id: "am5", text: "Los rumores que inventa la gente sobre mí", correctBox: "red", area: "Amistades" },
  { id: "am6", text: "Elegir juntarme con los que me tratan con respeto", correctBox: "green", area: "Amistades" },
  { id: "am7", text: "Que no me inviten al viaje de generación", correctBox: "red", area: "Amistades" },
  { id: "am8", text: "Buscar otra actividad positiva si mis amigos no están", correctBox: "green", area: "Amistades" },

  // Contexto: Redes Sociales & Futuro
  { id: "r1", text: "Cuántos likes recibe mi nueva foto de perfil", correctBox: "red", area: "Redes Sociales" },
  { id: "r2", text: "El tiempo que paso sin sentido haciendo scroll en TikTok", correctBox: "green", area: "Redes Sociales" },
  { id: "r3", text: "Estar revisando el teléfono mientras como con mi familia", correctBox: "green", area: "Redes Sociales" },
  { id: "r4", text: "Lo que comentó un desconocido en mi video de YouTube", correctBox: "red", area: "Redes Sociales" },
  { id: "r5", text: "Borrar la aplicación si noto que me pone de mal humor", correctBox: "green", area: "Redes Sociales" },
  { id: "r6", text: "Saber exactamente cómo será mi vida a los 30 años", correctBox: "red", area: "Redes Sociales" },
  { id: "r7", text: "Aprender hoy una nueva habilidad que me sirva mañana", correctBox: "green", area: "Redes Sociales" },
  { id: "r8", text: "Que un influencer suba contenido falso", correctBox: "red", area: "Redes Sociales" }
];

// Helper para obtener 7 aleatorias
export function getRandomWorries(count = 7): Worry[] {
  const shuffled = [...ALL_WORRIES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
