// Sistema de avisos de novedades ("¿Qué hay de nuevo?").
// Para anunciar una nueva tanda de cambios en el futuro: cambia VERSION_NOVEDADES
// (ej. "2026-08") y actualiza la lista NOVEDADES. El contador se reinicia solo,
// porque el estado guardado es por versión.

export const VERSION_NOVEDADES = "2026-07-b";

/** Cuántas veces se muestra automáticamente antes de dejar de aparecer sola. */
export const MAX_VECES_AUTO = 3;

export interface Novedad {
  emoji: string;
  titulo: string;
  descripcion: string;
}

export const NOVEDADES: Novedad[] = [
  {
    emoji: "📚",
    titulo: "15 historias nuevas",
    descripcion: "La Biblioteca creció a 62 historias, y ahora puedes filtrarlas por categoría o ver solo las que te faltan por leer.",
  },
  {
    emoji: "🛠️",
    titulo: "Taller del Héroe",
    descripcion: "¡Nueva sección! Cada XP que ganes también te da monedas 🪙 para comprar marcos y títulos para tu perfil.",
  },
  {
    emoji: "📓",
    titulo: "Diario del Héroe",
    descripcion: "Ahora puedes releer todas tus reflexiones y registros emocionales, como hacía Marco Aurelio.",
  },
  {
    emoji: "🗺️",
    titulo: "Mapa del Viaje",
    descripcion: "Un calendario que pinta de verde cada día que entrenas. ¡Tu racha 🔥 ahora cuenta de verdad!",
  },
  {
    emoji: "🏆",
    titulo: "Logros que ahora sí se pueden ganar",
    descripcion: "Los logros de rachas, virtudes y niveles ya se desbloquean, y los bloqueados muestran cuánto te falta.",
  },
  {
    emoji: "🎯",
    titulo: "Bonus del día completo",
    descripcion: "Si terminas tus 3 misiones del día, ganas +30 XP extra de regalo.",
  },
  {
    emoji: "🦉",
    titulo: "Nuevo juego: El Vuelo del Búho",
    descripcion: "Aletea entre las columnas del templo y recoge pergaminos de sabiduría. ¡Un toque, un vuelo!",
  },
  {
    emoji: "🛡️",
    titulo: "Nuevo juego: La Falange Serena",
    descripcion: "Defiende tu formación de las sombras invasoras y enfréntate a un jefe cada 5 oleadas.",
  },
];

interface EstadoNovedades {
  version: string;
  vistas: number;
  descartada: boolean;
}

function storageKey(profileId: string): string {
  return `estoico_novedades_${profileId}`;
}

export function getEstadoNovedades(profileId: string): EstadoNovedades {
  const fallback: EstadoNovedades = { version: VERSION_NOVEDADES, vistas: 0, descartada: false };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(storageKey(profileId));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as EstadoNovedades;
    // Versión nueva de novedades → reiniciar contador
    if (parsed.version !== VERSION_NOVEDADES) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

function saveEstado(profileId: string, estado: EstadoNovedades) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(profileId), JSON.stringify(estado));
}

/** ¿Debe mostrarse automáticamente al entrar? */
export function debeMostrarNovedades(profileId: string): boolean {
  const estado = getEstadoNovedades(profileId);
  return !estado.descartada && estado.vistas < MAX_VECES_AUTO;
}

/** Registra que se mostró una vez más. */
export function registrarVistaNovedades(profileId: string) {
  const estado = getEstadoNovedades(profileId);
  saveEstado(profileId, { ...estado, version: VERSION_NOVEDADES, vistas: estado.vistas + 1 });
}

/** El usuario pidió no volver a verla automáticamente. */
export function descartarNovedades(profileId: string) {
  const estado = getEstadoNovedades(profileId);
  saveEstado(profileId, { ...estado, version: VERSION_NOVEDADES, descartada: true });
}
