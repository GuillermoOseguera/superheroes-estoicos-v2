export interface LevelMilestone {
  id: string;
  level: number;
  title: string;
  image: string;
  badge: string;
  message: string;
  quote: string;
  accentFrom: string;
  accentTo: string;
}

export const LEVEL_MILESTONES: LevelMilestone[] = [
  {
    id: "elias_n1",
    level: 1,
    title: "Elías, Iniciado Estoico",
    image: "/images/avatars/elias_base.png",
    badge: "Túnica del Aprendiz",
    message: "Has comenzado el camino. Aún no llevas armadura, pero ya cargas una decisión importante: entrenar tu carácter.",
    quote: "Ningún hombre es bueno por casualidad. La virtud se aprende. — Séneca",
    accentFrom: "#3b82f6",
    accentTo: "#1d4ed8",
  },
  {
    id: "elias_n5",
    level: 5,
    title: "Elías, Portador del Escudo",
    image: "/images/avatars/elias_nivel5.png",
    badge: "Escudo de Madera",
    message: "Tu primera defensa ya está en tus manos. Empiezas a proteger tu mente antes de reaccionar por impulso.",
    quote: "No son las cosas las que nos alteran, sino lo que pensamos sobre ellas. — Epicteto",
    accentFrom: "#8b5cf6",
    accentTo: "#6d28d9",
  },
  {
    id: "elias_n8",
    level: 8,
    title: "Elías, Guardián Disciplinado",
    image: "/images/avatars/elias_nivel8.png",
    badge: "Coraza de Cuero",
    message: "La disciplina ya se nota por fuera. Tu temple empieza a convertirse en protección real.",
    quote: "Primero dite a ti mismo lo que quieres ser; luego haz lo que debas hacer. — Epicteto",
    accentFrom: "#92400e",
    accentTo: "#d97706",
  },
  {
    id: "elias_n12",
    level: 12,
    title: "Elías, Estratega de Bronce",
    image: "/images/avatars/elias_nivel12.png",
    badge: "Casco Helénico",
    message: "Tu mente ya no entra al combate descubierta. Piensas antes de actuar y sostienes la calma bajo presión.",
    quote: "La mente que está libre de pasiones es una fortaleza. — Marco Aurelio",
    accentFrom: "#f59e0b",
    accentTo: "#b45309",
  },
  {
    id: "elias_n16",
    level: 16,
    title: "Elías, Guerrero de Acción Recta",
    image: "/images/avatars/elias_nivel16.png",
    badge: "Espada de Bronce",
    message: "Ya no solo te defiendes. Ahora también sabes actuar con decisión cuando la virtud lo exige.",
    quote: "Lo que no es útil para la colmena, no es útil para la abeja. — Marco Aurelio",
    accentFrom: "#ef4444",
    accentTo: "#b91c1c",
  },
  {
    id: "elias_n20",
    level: 20,
    title: "Elías, Centinela de Roma",
    image: "/images/avatars/elias_nivel20.png",
    badge: "Armadura Imperial",
    message: "Tu presencia ya inspira respeto. Has convertido el entrenamiento diario en una forma visible de carácter.",
    quote: "El obstáculo en el camino se convierte en el camino. — Marco Aurelio",
    accentFrom: "#14b8a6",
    accentTo: "#0f766e",
  },
  {
    id: "elias_n24",
    level: 24,
    title: "Elías, Campeón Legendario",
    image: "/images/avatars/elias_nivel24.png",
    badge: "Capa del Héroe Estoico",
    message: "Tu evolución ya no es solo progreso: es presencia. Has forjado un héroe que combina disciplina, coraje y gobierno interior.",
    quote: "La verdadera grandeza consiste en ser dueño de uno mismo. — Séneca",
    accentFrom: "#fbbf24",
    accentTo: "#dc2626",
  },
];

export const DEFAULT_MILESTONE = LEVEL_MILESTONES[0];

export function getLevelMilestonesForHero(heroId: string): LevelMilestone[] {
  if (heroId === "00000000-0000-0000-0000-000000000001") {
    return LEVEL_MILESTONES;
  }

  return [
    {
      id: `${heroId}_base`,
      level: 1,
      title: "Héroe en Entrenamiento",
      image:
        heroId === "00000000-0000-0000-0000-000000000002"
          ? "/images/avatars/atenea_base.png"
          : "/images/avatars/marco_base.png",
      badge: "Forma Inicial",
      message: "Este héroe aún no tiene hitos visuales especiales cargados, pero su progreso de virtud sí sigue avanzando.",
      quote: "Lo importante no es parecer fuerte, sino llegar a serlo.",
      accentFrom: "#64748b",
      accentTo: "#334155",
    },
  ];
}

export function getCurrentMilestone(heroId: string, level: number): LevelMilestone {
  const milestones = getLevelMilestonesForHero(heroId);
  return milestones.filter((milestone) => level >= milestone.level).at(-1) ?? milestones[0];
}

export function getNextMilestone(heroId: string, level: number): LevelMilestone | null {
  const milestones = getLevelMilestonesForHero(heroId);
  return milestones.find((milestone) => milestone.level > level) ?? null;
}

export function getUnlockedMilestones(heroId: string, level: number): LevelMilestone[] {
  return getLevelMilestonesForHero(heroId).filter((milestone) => level >= milestone.level);
}

export function getMilestoneStorageKey(heroId: string): string {
  return `estoico_last_seen_milestone_${heroId}`;
}
