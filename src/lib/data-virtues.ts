import { BoxColor, WorryArea, Worry, ALL_WORRIES, getRandomWorries } from "./data";

export type Virtue = "sabiduria" | "coraje" | "justicia" | "templanza";

export interface VirtueChallenge {
  id: string;
  scenario: string;
  correctVirtue: Virtue;
  feedback: string;
  monsterName: string;
}

export const VIRTUE_CHALLENGES: VirtueChallenge[] = [
  // Templanza (Autocontrol, moderación)
  {
    id: "v1",
    scenario: "Un compañero de clase te insulta frente a todos para hacerse el gracioso y te hierve la sangre.",
    correctVirtue: "templanza",
    feedback: "¡Golpe devuelto! La Templanza te permite gobernar tu enojo en lugar de que tu enojo te gobierne a ti.",
    monsterName: "Ira Ciega"
  },
  {
    id: "v4",
    scenario: "Perdiste en tu videojuego favorito por décima vez. Tienes tantas ganas de lanzar el control contra la pared.",
    correctVirtue: "templanza",
    feedback: "¡Bien defendido! Usaste Templanza para respirar profundo y no dejarte llevar por la frustración del momento.",
    monsterName: "Frustración"
  },
  {
    id: "v8",
    scenario: "Estás estudiando pero ves que tu teléfono brilla con notificaciones de TikTok cada segundo. El impulso de abrirlo es fuertísimo.",
    correctVirtue: "templanza",
    feedback: "¡Ataque bloqueado! Con Templanza decides terminar de estudiar primero, controlando tus impulsos.",
    monsterName: "Distracción"
  },
  
  // Coraje (Valentía, enfrentar el miedo)
  {
    id: "v2",
    scenario: "Ves que tres abusones están empujando a un niño pequeño en el recreo. Sientes miedo de que si te metes, te molesten a ti.",
    correctVirtue: "coraje",
    feedback: "¡Impacto crítico! Se necesita Coraje para defender a los demás, incluso cuando tus piernas tiemblan.",
    monsterName: "Miedo Social"
  },
  {
    id: "v6",
    scenario: "Tienes que hablar en público frente a toda la escuela. Tus manos sudan y tu pecho se siente apretado por los nervios.",
    correctVirtue: "coraje",
    feedback: "¡Excelente! El Coraje no es no tener miedo, es avanzar y alzar la voz a pesar de tenerlo.",
    monsterName: "Inseguridad"
  },
  {
    id: "v9",
    scenario: "Accidentalmente rompiste el trofeo favorito de tu hermano. Sabes que se va a enojar mucho y te da terror decírselo.",
    correctVirtue: "coraje",
    feedback: "¡Golpe heroico! Tuviste el Coraje de dar la cara, pedir perdón y asumir las consecuencias.",
    monsterName: "Cobardía"
  },

  // Justicia (Honestidad, equidad, hacer lo correcto)
  {
    id: "v3",
    scenario: "El maestro salió del salón y la respuesta del examen más importante está descubierta en la mesa. Nadie te está viendo.",
    correctVirtue: "justicia",
    feedback: "¡Escudo de rectitud! La Justicia significa hacer lo correcto siempre, incluso cuando no hay nadie observando.",
    monsterName: "Deshonestidad"
  },
  {
    id: "v7",
    scenario: "Tus amigos se están burlando del chico nuevo del salón en el chat de WhatsApp y esperan que tú también envíes un chiste de él.",
    correctVirtue: "justicia",
    feedback: "¡Sabia elección! La Justicia te exige tratar a todos con respeto, sin importar la presión de grupo.",
    monsterName: "Presión Social"
  },
  {
    id: "v10",
    scenario: "Encontraste dinero tirado en el patio del colegio y sabes exactamente que se le cayó a un niño de primer año.",
    correctVirtue: "justicia",
    feedback: "¡Brillante! Elegiste devolverlo, porque la Justicia es darle a cada quien lo que le pertenece.",
    monsterName: "Codicia"
  },

  // Sabiduría (Pensamiento crítico, perspectiva)
  {
    id: "v5",
    scenario: "Llevas dos horas atascado en un problema de matemáticas enorme y sientes que eres torpe por no entenderlo.",
    correctVirtue: "sabiduria",
    feedback: "¡Mente clara! La Sabiduría te ayuda a reconocer que no lo sabes todo y que pedir ayuda es de inteligentes.",
    monsterName: "Ignorancia"
  },
  {
    id: "v11",
    scenario: "Un amigo te dice un chisme gigante sobre tu mejor amiga y te pide que lo cuentes a todos sin haber verificado si es cierto.",
    correctVirtue: "sabiduria",
    feedback: "¡Sabio movimiento! Usaste tu mente crítica para filtrar las mentiras y no esparcir rumores dañinos sin evidencia.",
    monsterName: "Engaño"
  },
  {
    id: "v12",
    scenario: "Estás muy triste porque sacaste un 6 en historia. Sientes que esto arruinará tu futuro para siempre.",
    correctVirtue: "sabiduria",
    feedback: "¡Ataque esquivado! La Sabiduría te ayuda a ver esto en perspectiva: es solo un examen, no el resto de tu vida.",
    monsterName: "Ansiedad Mental"
  }
];

export function getRandomVirtueChallenge(): VirtueChallenge {
  return VIRTUE_CHALLENGES[Math.floor(Math.random() * VIRTUE_CHALLENGES.length)];
}
