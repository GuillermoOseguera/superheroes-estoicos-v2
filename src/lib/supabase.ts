import { createClient } from "@supabase/supabase-js";

let supabaseInstance: any = null;

const getClient = () => {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      if (typeof window === "undefined") {
        // En el servidor (fase de compilación build/static), devolvemos un Mock 
        // para que Next.js pueda crear las páginas estáticas sin crashear.
        return new Proxy({} as any, {
          get() {
            return () => ({
              select: () => Promise.resolve({ data: [], error: null }),
              single: () => Promise.resolve({ data: null, error: null }),
              order: () => ({ select: () => Promise.resolve({ data: [] }) }), // Cadena básica
            });
          }
        });
      }
      throw new Error("Configuración de Supabase faltante o nula.");
    }
    supabaseInstance = createClient(url, key);
  }
  return supabaseInstance;
};

// Proxy para evaluar las llamadas a Supabase de forma perezosa en tiempo de ejecución (Runtime)
export const supabase = new Proxy({} as any, {
  get(target, prop) {
    const client = getClient();
    return (client as any)[prop];
  }
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  name: string;
  avatar_id: number;
  role: "kid" | "parent";
  level: number;
  total_xp: number;
  current_streak: number;
  last_login: string;
  created_at: string;
}

export interface UserVirtues {
  id: string;
  user_id: string;
  wisdom_xp: number;
  courage_xp: number;
  justice_xp: number;
  temperance_xp: number;
  updated_at: string;
}

export interface GameResult {
  id: string;
  user_id: string;
  game_id: string;
  score: number;
  xp_earned: number;
  completed_at: string;
}

// ─── XP helpers ──────────────────────────────────────────────────────────────

/**
 * XP requerida para subir del nivel actual al siguiente.
 * Fórmula: nivel * 500 XP (nivel 1→2 = 500, 2→3 = 1000, etc.)
 */
export function xpForNextLevel(level: number): number {
  return level * 500;
}

/**
 * Calcula el nivel dado un total de XP.
 */
export function levelFromXP(totalXp: number): number {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpForNextLevel(level)) {
    remaining -= xpForNextLevel(level);
    level++;
  }
  return level;
}

/**
 * Cuánto XP lleva dentro del nivel actual.
 */
export function xpWithinLevel(totalXp: number): number {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpForNextLevel(level)) {
    remaining -= xpForNextLevel(level);
    level++;
  }
  return remaining;
}

// ─── DB Actions ───────────────────────────────────────────────────────────────

/** Agrega XP a un perfil y actualiza su nivel. Registra el resultado del juego. */
export async function addGameXP(
  userId: string,
  gameId: string,
  score: number,
  xpEarned: number
): Promise<{ newTotalXp: number; newLevel: number }> {
  // 1. Obtener XP actual
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("total_xp")
    .eq("id", userId)
    .single();

  if (fetchError || !profile) throw fetchError;

  const newTotalXp = Math.max(0, profile.total_xp + xpEarned);
  const newLevel = levelFromXP(newTotalXp);

  // 2. Actualizar perfil
  await supabase
    .from("profiles")
    .update({ total_xp: newTotalXp, level: newLevel })
    .eq("id", userId);

  // 3. Registrar resultado
  await supabase.from("game_results").insert({
    user_id: userId,
    game_id: gameId,
    score,
    xp_earned: xpEarned,
  });

  return { newTotalXp, newLevel };
}

/** Agrega exp específica a las virtudes en la tabla user_virtues */
export async function addVirtueXP(
  userId: string,
  virtue: "wisdom" | "courage" | "justice" | "temperance",
  amount: number
): Promise<void> {
  const columnMap = {
    wisdom: "wisdom_xp",
    courage: "courage_xp",
    justice: "justice_xp",
    temperance: "temperance_xp",
  };

  const colName = columnMap[virtue];

  // 1. Fetch current logic
  const { data, error } = await supabase
    .from("user_virtues")
    .select(colName)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    if (error && error.code === "PGRST116") {
      // Row doesn't exist, handle upsert fallback (though it should exist via trigger)
      const insertData = { user_id: userId, [colName]: amount };
      await supabase.from("user_virtues").insert(insertData);
      return;
    }
    throw error;
  }

  // 2. Add amount and update
  const newAmount = ((data as any)[colName] || 0) + amount;
  await supabase
    .from("user_virtues")
    .update({ [colName]: newAmount, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
}

/** Marca una misión diaria como completada y agrega notas de reflexión. */
export async function completeMission(
  userId: string,
  missionId: string,
  xpEarned: number,
  reflectionNotes?: string
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  // Upsert la misión diaria
  await supabase.from("daily_missions").upsert({
    user_id: userId,
    mission_id: missionId,
    mission_date: today,
    is_completed: true,
    reflection_notes: reflectionNotes ?? null,
    completed_at: new Date().toISOString(),
  }, { onConflict: "user_id,mission_id,mission_date" });

  // Sumar XP
  await addGameXP(userId, `mission_${missionId}`, 1, xpEarned);
}

/** Desbloquea un logro. */
export async function unlockAchievement(
  userId: string,
  achievementId: string
): Promise<void> {
  const { error } = await supabase
    .from("unlocked_achievements")
    .upsert(
      { user_id: userId, achievement_id: achievementId },
      { onConflict: "user_id,achievement_id" }
    );

  if (!error && typeof window !== "undefined") {
    const event = new CustomEvent("achievement_unlocked", { detail: { achievementId } });
    window.dispatchEvent(event);
  }
}

// ─── DB Reset ───────────────────────────────────────────────────────────────

export async function resetHeroProgress(userId: string): Promise<void> {
  // Reiniciar Perfil
  await supabase.from("profiles").update({ total_xp: 0, level: 1 }).eq("id", userId);
  // Borrar Historial
  await supabase.from("game_results").delete().eq("user_id", userId);
  await supabase.from("daily_missions").delete().eq("user_id", userId);
  await supabase.from("unlocked_achievements").delete().eq("user_id", userId);
  await supabase.from("user_inventory").delete().eq("user_id", userId);
  
  // Reiniciar virtudes
  await supabase.from("user_virtues").update({
    wisdom_xp: 0, courage_xp: 0, justice_xp: 0, temperance_xp: 0
  }).eq("user_id", userId);
}
