import type { UserVirtues } from "@/lib/supabase";
import { getWeakestVirtue, VIRTUE_FOCUS_COPY, VIRTUE_LABELS } from "@/lib/progression";
import type { Virtue } from "@/lib/data-virtues";

export interface DynamicMission {
  id: string;
  titulo: string;
  xp: number;
  emoji: string;
  descripcion: string;
  items: string[];
  requireNotes: boolean;
  focusVirtue?: Virtue;
  source: "weakest_virtue" | "recent_game" | "reflection";
}

interface MissionContext {
  virtues: UserVirtues | null;
  latestGameId?: string | null;
  currentLevel?: number;
}

const GAME_MISSION_VARIANTS: Record<string, Omit<DynamicMission, "id" | "source">> = {
  desafio_virtudes: {
    titulo: "Análisis del Último Error ⚔️",
    xp: 55,
    emoji: "⚔️",
    descripcion: "Vuelve sobre una situación difícil y explica qué virtud habría sido la respuesta más sabia.",
    items: [
      "Piensa en una situación reciente donde reaccionaste mal.",
      "Nombra la virtud que te habría ayudado mejor.",
      "Escribe qué harás distinto la próxima vez.",
    ],
    requireNotes: true,
  },
  dos_cajas: {
    titulo: "Lo Mío y lo del Mundo 📦",
    xp: 45,
    emoji: "📦",
    descripcion: "Entrena la dicotomía del control con algo que hoy te haya frustrado.",
    items: [
      "Escribe qué ocurrió.",
      "Separa qué estaba bajo tu control y qué no.",
      "Haz una acción pequeña solo sobre tu parte.",
    ],
    requireNotes: true,
  },
  semaforo_emocional: {
    titulo: "Semáforo en la Vida Real 🚦",
    xp: 50,
    emoji: "🚦",
    descripcion: "Cuando sientas una emoción fuerte hoy, detente antes de actuar y usa el semáforo mental.",
    items: [
      "Rojo: nombra la emoción sin pelearte con ella.",
      "Amarillo: pregúntate si está bajo tu control.",
      "Verde: elige una acción pequeña y virtuosa.",
    ],
    requireNotes: false,
  },
  defensor_mente: {
    titulo: "Defiende tu Mente sin Pantalla 🛡️",
    xp: 60,
    emoji: "🛡️",
    descripcion: "Convierte un pensamiento invasivo de hoy en una respuesta estoica más fuerte.",
    items: [
      "Escribe el pensamiento invasivo que apareció.",
      "Responde con una frase más racional y útil.",
      "Haz una acción concreta en menos de 5 minutos.",
    ],
    requireNotes: true,
  },
  memoria_estoica: {
    titulo: "Memoria de Enseñanzas 🧠",
    xp: 40,
    emoji: "🧠",
    descripcion: "Recuerda una frase o historia estoica y úsala hoy en una decisión real.",
    items: [
      "Recuerda una enseñanza que te haya servido.",
      "Explícala con tus propias palabras.",
      "Úsala en una situación real antes de dormir.",
    ],
    requireNotes: false,
  },
  constructor_escudo: {
    titulo: "Escudo Personal del Día ✨",
    xp: 45,
    emoji: "✨",
    descripcion: "Elige una virtud como escudo principal para hoy y compórtate en línea con ella.",
    items: [
      "Escoge la virtud que más necesitas hoy.",
      "Define una situación donde la usarás.",
      "Al final del día evalúa si la mantuviste.",
    ],
    requireNotes: false,
  },
};

function buildVirtueMission(virtue: Virtue): DynamicMission {
  const label = VIRTUE_LABELS[virtue];
  const focusCopy = VIRTUE_FOCUS_COPY[virtue];

  return {
    id: `virtud_${virtue}`,
    titulo: `Entrena tu ${label} ${virtue === "coraje" ? "🦁" : virtue === "justicia" ? "⚖️" : virtue === "templanza" ? "🧘" : "🦉"}`,
    xp: 60,
    emoji: virtue === "coraje" ? "🦁" : virtue === "justicia" ? "⚖️" : virtue === "templanza" ? "🧘" : "🦉",
    descripcion: `Tu virtud más débil ahora mismo es ${label}. Hoy vas a reforzar ${focusCopy}.`,
    items: [
      `Detecta una situación de hoy donde necesites ${label}.`,
      `Actúa durante 10 minutos con foco en ${label}.`,
      "Escribe al final qué cambió por haber elegido mejor.",
    ],
    requireNotes: true,
    focusVirtue: virtue,
    source: "weakest_virtue",
  };
}

function buildReflectionMission(level = 1): DynamicMission {
  return {
    id: `reflexion_n${Math.min(level, 9)}`,
    titulo: level >= 4 ? "Bitácora del Estratega 📓" : "Diario del Héroe 📓",
    xp: level >= 4 ? 55 : 40,
    emoji: "📓",
    descripcion: "Cierra el día con una revisión breve pero honesta de tu carácter.",
    items: [
      "¿Qué hice bien hoy?",
      "¿Dónde fallé y qué virtud faltó?",
      "¿Qué intentaré mañana de forma más consciente?",
    ],
    requireNotes: true,
    source: "reflection",
  };
}

export function getDynamicMissions(context: MissionContext): DynamicMission[] {
  const weakestVirtue = getWeakestVirtue(context.virtues);
  const virtueMission = buildVirtueMission(weakestVirtue);
  const recentTemplate = context.latestGameId ? GAME_MISSION_VARIANTS[context.latestGameId] : null;

  const recentMission: DynamicMission = recentTemplate
    ? {
        id: `juego_${context.latestGameId}`,
        source: "recent_game",
        ...recentTemplate,
      }
    : {
        id: "juego_refuerzo_general",
        titulo: "Práctica de Respuesta Estoica 🎯",
        xp: 45,
        emoji: "🎯",
        descripcion: "Toma la lección del último entrenamiento y aplícala fuera del juego.",
        items: [
          "Recuerda la última decisión sabia que tomaste en un juego.",
          "Busca una situación real donde se parezca.",
          "Haz hoy una acción pequeña inspirada en esa lección.",
        ],
        requireNotes: false,
        source: "recent_game",
      };

  const reflectionMission = buildReflectionMission(context.currentLevel);

  return [virtueMission, recentMission, reflectionMission];
}
