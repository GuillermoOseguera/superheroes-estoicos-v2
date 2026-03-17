export type WorryArea = "General" | "Futbol" | "Familia" | "Videojuegos" | "Actividades";
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

  // Contexto: Futbol
  { id: "f1", text: "Mi actitud si pierdo el partido de futbol", correctBox: "green", area: "Futbol" },
  { id: "f2", text: "Que el entrenador me ponga de titular", correctBox: "red", area: "Futbol" },
  { id: "f3", text: "El resultado final del partido", correctBox: "red", area: "Futbol" },
  { id: "f4", text: "El esfuerzo que pongo en el entrenamiento", correctBox: "green", area: "Futbol" },
  { id: "f5", text: "Felicitar al otro equipo si nos ganan", correctBox: "green", area: "Futbol" },

  // Contexto: Familia (Jari, Elisa, Paco, Estela)
  { id: "fa1", text: "Ser paciente con mi hermana Elisa", correctBox: "green", area: "Familia" },
  { id: "fa2", text: "Que Elisa me pida usar mi Switch", correctBox: "red", area: "Familia" },
  { id: "fa3", text: "Mi reacción si Elisa me molesta", correctBox: "green", area: "Familia" },
  { id: "fa4", text: "Ayudar a mi mamá Jari en la casa", correctBox: "green", area: "Familia" },
  { id: "fa5", text: "Que mi mamá Jari esté de mal humor", correctBox: "red", area: "Familia" },

  // Contexto: Videojuegos (Sonic, Minecraft, Switch)
  { id: "v1", text: "Terminar mis tareas antes de jugar Minecraft", correctBox: "green", area: "Videojuegos" },
  { id: "v2", text: "Que haya lag en la partida de Sonic", correctBox: "red", area: "Videojuegos" },
  { id: "v3", text: "El tiempo que decido jugar Switch", correctBox: "green", area: "Videojuegos" },
  { id: "v4", text: "Que un creeper explote mi casa en Minecraft", correctBox: "red", area: "Videojuegos" },
  { id: "v5", text: "Mi reacción si un creeper lo explota todo", correctBox: "green", area: "Videojuegos" },

  // Contexto: Actividades (Natación, Karate)
  { id: "a1", text: "Ir a natación aunque esté cansado", correctBox: "green", area: "Actividades" },
  { id: "a2", text: "Ser el más rápido de la alberca", correctBox: "red", area: "Actividades" },
  { id: "a3", text: "Mi esfuerzo en la clase de natación", correctBox: "green", area: "Actividades" },
  { id: "a4", text: "Lo que opinaban mis amigos de que hacía karate", correctBox: "red", area: "Actividades" },
  { id: "a5", text: "Decidir si quiero probar karate otra vez", correctBox: "green", area: "Actividades" },
];

// Helper para obtener 7 aleatorias
export function getRandomWorries(count = 7): Worry[] {
  const shuffled = [...ALL_WORRIES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
