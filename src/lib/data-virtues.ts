import { BoxColor, WorryArea, Worry, ALL_WORRIES, getRandomWorries } from "./data";

export type Virtue = "sabiduria" | "coraje" | "justicia" | "templanza";

export interface VirtueChallenge {
  id: string;
  scenario: string;
  correctVirtue: Virtue;
  feedback: string;
}

export const VIRTUE_CHALLENGES: VirtueChallenge[] = [
  {
    id: "v1",
    scenario: "Un compañero de clase te insulta frente a los demás para hacerse el gracioso.",
    correctVirtue: "templanza",
    feedback: "¡Exacto! La Templanza (autocontrol) te ayuda a no reaccionar con enojo y mantener la calma."
  },
  {
    id: "v2",
    scenario: "Ves que están molestando a un niño más pequeño en el recreo y nadie hace nada.",
    correctVirtue: "coraje",
    feedback: "¡Muy bien! Se necesita Coraje para defender a otros, incluso si tienes miedo."
  },
  {
    id: "v3",
    scenario: "Tienes dos opciones: mentir para evitar un regaño o decir la verdad y aceptar las consecuencias.",
    correctVirtue: "justicia",
    feedback: "¡Correcto! La Justicia incluye ser honesto y hacer siempre lo correcto."
  },
  {
    id: "v4",
    scenario: "Estás muy enojado porque perdiste en un videojuego y quieres lanzar el control.",
    correctVirtue: "templanza",
    feedback: "¡Así es! La Templanza te enseña a gobernar tus emociones antes de que ellas te gobiernen a ti."
  },
  {
    id: "v5",
    scenario: "No sabes cómo resolver un problema de matemáticas, aunque lo has intentado mucho.",
    correctVirtue: "sabiduria",
    feedback: "¡Perfecto! La Sabiduría te dice cuándo es el momento correcto de pedir ayuda a alguien."
  },
];

export function getRandomVirtueChallenge(): VirtueChallenge {
  return VIRTUE_CHALLENGES[Math.floor(Math.random() * VIRTUE_CHALLENGES.length)];
}
