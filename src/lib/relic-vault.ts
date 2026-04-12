export type RelicAssetType = "image" | "video";

export interface RelicAsset {
  id: string;
  title: string;
  type: RelicAssetType;
  description: string;
  unlockHint: string;
  imagePath?: string;
  videoPath?: string;
  previewPath?: string;
  accent: string;
  category: "reliquia" | "archivo";
  unlockRule?: {
    gameId: string;
    bossId?: string;
    defeatsRequired?: number;
  };
  plannedFileName?: string;
}

export const RELIC_ASSETS: RelicAsset[] = [
  {
    id: "escudo_logica_ilustracion",
    title: "El Escudo de la Lógica",
    type: "image",
    category: "reliquia",
    description: "Una ilustración ceremonial donde Elías bloquea flechas de miedo, ira y burla con un escudo guiado por razón y templanza.",
    unlockHint: "Derrota 3 veces a la misma sombra en Desafío de Virtudes.",
    imagePath: "/reliquias/imagenes/escudo_logica.png",
    previewPath: "/reliquias/imagenes/escudo_logica.png",
    accent: "#d4a017",
    unlockRule: {
      gameId: "desafio_virtudes",
      defeatsRequired: 3,
    },
    plannedFileName: "escudo_logica.png",
  },
  {
    id: "escudo_logica_archivo",
    title: "Archivo: Escudo de la Lógica",
    type: "video",
    category: "archivo",
    description: "La versión cinematográfica del momento en que Elías convierte la razón en defensa activa contra las sombras.",
    unlockHint: "Derrota 3 veces a la misma sombra en Desafío de Virtudes.",
    imagePath: "/reliquias/imagenes/escudo_logica.png",
    previewPath: "/reliquias/imagenes/escudo_logica.png",
    videoPath: "/reliquias/videos/escudo_logica.mp4",
    accent: "#f59e0b",
    unlockRule: {
      gameId: "desafio_virtudes",
      defeatsRequired: 3,
    },
    plannedFileName: "escudo_logica.mp4",
  },
  {
    id: "tormenta_control",
    title: "Controlando la Tormenta",
    type: "video",
    category: "archivo",
    description: "Una cinemática breve sobre dominio interior frente al caos emocional.",
    unlockHint: "Gana 3 veces seguidas en Defensor de la Mente.",
    accent: "#0ea5e9",
    plannedFileName: "tormenta_control.(png|mp4)",
  },
  {
    id: "juicio_heroe",
    title: "El Juicio del Héroe",
    type: "image",
    category: "reliquia",
    description: "Una ilustración ceremonial del momento en que el héroe elige la virtud correcta.",
    unlockHint: "Completa hitos en Desafío de Virtudes.",
    accent: "#3b82f6",
    plannedFileName: "juicio_heroe.png",
  },
  {
    id: "dos_cajas_destino",
    title: "Las Dos Cajas del Destino",
    type: "image",
    category: "reliquia",
    description: "Un archivo visual sobre elegir con serenidad lo que sí depende de ti.",
    unlockHint: "Domina Las Dos Cajas para revelar este archivo.",
    accent: "#8b5cf6",
    plannedFileName: "dos_cajas_destino.png",
  },
  {
    id: "mapa_fortaleza",
    title: "El Mapa de la Fortaleza Interior",
    type: "image",
    category: "reliquia",
    description: "Un mapa antiguo que conecta las cuatro virtudes con el crecimiento del héroe.",
    unlockHint: "Se revelará con progreso global de nivel y colección.",
    accent: "#10b981",
    plannedFileName: "mapa_fortaleza.png",
  },
];

const DEFAULT_UNLOCKED_RELIC_IDS = ["escudo_logica_ilustracion"];

export function getRelicStorageKey(profileId: string): string {
  return `estoico_relics_unlocked_${profileId}`;
}

export function getShadowDefeatStorageKey(profileId: string): string {
  return `estoico_shadow_defeats_${profileId}`;
}

export function getUnlockedRelicIds(profileId: string): Set<string> {
  if (typeof window === "undefined") return new Set(DEFAULT_UNLOCKED_RELIC_IDS);
  const raw = localStorage.getItem(getRelicStorageKey(profileId));
  if (!raw) return new Set(DEFAULT_UNLOCKED_RELIC_IDS);

  try {
    return new Set([...(JSON.parse(raw) as string[]), ...DEFAULT_UNLOCKED_RELIC_IDS]);
  } catch {
    return new Set(DEFAULT_UNLOCKED_RELIC_IDS);
  }
}

export function unlockRelic(profileId: string, relicId: string): boolean {
  if (typeof window === "undefined") return false;
  const unlocked = getUnlockedRelicIds(profileId);
  const hadIt = unlocked.has(relicId);
  unlocked.add(relicId);
  localStorage.setItem(getRelicStorageKey(profileId), JSON.stringify([...unlocked]));
  return !hadIt;
}

export function getShadowDefeatCounts(profileId: string): Record<string, number> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(getShadowDefeatStorageKey(profileId));
  if (!raw) return {};

  try {
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

export function registerShadowDefeat(profileId: string, bossId: string): number {
  if (typeof window === "undefined") return 0;
  const counts = getShadowDefeatCounts(profileId);
  counts[bossId] = (counts[bossId] || 0) + 1;
  localStorage.setItem(getShadowDefeatStorageKey(profileId), JSON.stringify(counts));
  return counts[bossId];
}
