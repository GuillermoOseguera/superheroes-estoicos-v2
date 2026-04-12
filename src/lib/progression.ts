import type { UserVirtues } from "@/lib/supabase";
import type { Virtue } from "@/lib/data-virtues";

export interface UnlockableGame {
  id: string;
  requiredLevel: number;
}

export interface UnlockableStory {
  id: string;
  requiredLevel: number;
}

export const GAME_UNLOCK_LEVELS: Record<string, number> = {
  "dos-cajas": 1,
  "desafio-virtudes": 1,
  "semaforo-emocional": 2,
  "constructor-escudo": 3,
  "memoria-estoica": 4,
  "defensor-mente": 5,
};

export const STORY_UNLOCK_LEVELS: Record<string, number> = {
  elias_futbol: 1,
  elias_minecraft: 1,
  epicteto: 1,
  elias_natacion: 2,
  elias_switch: 2,
  bambu: 2,
  elias_examen: 3,
  seneca_ira: 3,
  diogenes_linterna: 3,
  elias_youtuber: 4,
  bully_escuela: 4,
  videojuego_nocturno: 4,
  elias_amigo_enojado: 5,
  elias_comparacion: 5,
  marco_aurelio: 5,
};

export const VIRTUE_LABELS: Record<Virtue, string> = {
  sabiduria: "Sabiduría",
  coraje: "Coraje",
  justicia: "Justicia",
  templanza: "Templanza",
};

export const VIRTUE_FOCUS_COPY: Record<Virtue, string> = {
  sabiduria: "claridad mental, perspectiva y criterio",
  coraje: "valentía para actuar incluso con miedo",
  justicia: "rectitud al hacer lo correcto por otros",
  templanza: "autocontrol frente a impulsos y emociones",
};

export function getRequiredLevelForGame(gameId: string): number {
  return GAME_UNLOCK_LEVELS[gameId] ?? 1;
}

export function getRequiredLevelForStory(storyId: string, fallbackIndex = 0): number {
  if (storyId in STORY_UNLOCK_LEVELS) {
    return STORY_UNLOCK_LEVELS[storyId];
  }

  if (fallbackIndex < 3) return 1;
  if (fallbackIndex < 6) return 2;
  if (fallbackIndex < 10) return 3;
  if (fallbackIndex < 14) return 4;
  return 5;
}

export function isUnlocked(requiredLevel: number, currentLevel: number): boolean {
  return currentLevel >= requiredLevel;
}

export function getWeakestVirtue(virtues: UserVirtues | null): Virtue {
  if (!virtues) return "sabiduria";

  const scores: Array<{ virtue: Virtue; xp: number }> = [
    { virtue: "sabiduria", xp: virtues.wisdom_xp ?? 0 },
    { virtue: "coraje", xp: virtues.courage_xp ?? 0 },
    { virtue: "justicia", xp: virtues.justice_xp ?? 0 },
    { virtue: "templanza", xp: virtues.temperance_xp ?? 0 },
  ];

  scores.sort((a, b) => a.xp - b.xp);
  return scores[0]?.virtue ?? "sabiduria";
}

export function getStrongestVirtue(virtues: UserVirtues | null): Virtue {
  if (!virtues) return "sabiduria";

  const scores: Array<{ virtue: Virtue; xp: number }> = [
    { virtue: "sabiduria", xp: virtues.wisdom_xp ?? 0 },
    { virtue: "coraje", xp: virtues.courage_xp ?? 0 },
    { virtue: "justicia", xp: virtues.justice_xp ?? 0 },
    { virtue: "templanza", xp: virtues.temperance_xp ?? 0 },
  ];

  scores.sort((a, b) => b.xp - a.xp);
  return scores[0]?.virtue ?? "sabiduria";
}

export function getVirtueXP(virtues: UserVirtues | null, virtue: Virtue): number {
  if (!virtues) return 0;

  switch (virtue) {
    case "sabiduria":
      return virtues.wisdom_xp ?? 0;
    case "coraje":
      return virtues.courage_xp ?? 0;
    case "justicia":
      return virtues.justice_xp ?? 0;
    case "templanza":
      return virtues.temperance_xp ?? 0;
  }
}
