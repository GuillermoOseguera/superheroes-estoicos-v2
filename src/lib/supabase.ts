import { createClient } from "@supabase/supabase-js";

const SESSION_TOKEN_KEY = "academia_estoica_session_token";

let supabaseInstance: any = null;
let cachedToken: string | null | undefined = undefined; // undefined = aún no leído

function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_TOKEN_KEY);
}

/** Debe llamarse tras login exitoso y en logout: fuerza reconstruir el cliente con el header nuevo. */
export function setSessionToken(token: string | null) {
  if (typeof window !== "undefined") {
    if (token) window.localStorage.setItem(SESSION_TOKEN_KEY, token);
    else window.localStorage.removeItem(SESSION_TOKEN_KEY);
  }
  cachedToken = token;
  supabaseInstance = null; // fuerza recreación del cliente con el nuevo header
}

export function getSessionToken(): string | null {
  if (cachedToken === undefined) cachedToken = readStoredToken();
  return cachedToken ?? null;
}

const getClient = () => {
  const token = getSessionToken();

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
    supabaseInstance = createClient(url, key, {
      global: {
        headers: token ? { "x-session-token": token } : {},
      },
    });
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
  coins: number;
  equipped_frame: string | null;
  equipped_title: string | null;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  category: "frame" | "title";
  cost_coins: number;
  required_level: number;
  accent_from: string;
  accent_to: string;
  icon: string;
  sort_order: number;
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

/**
 * Recalcula la racha real de días consecutivos con actividad (juegos o misiones)
 * y la guarda en profiles.current_streak. Cuenta días distintos con al menos
 * un game_result, contando "hoy" o "ayer" como posible inicio de la racha
 * (para no romperla mientras el día actual sigue corriendo).
 */
export async function syncStreak(userId: string): Promise<number> {
  const { data } = await supabase
    .from("game_results")
    .select("completed_at")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(400);

  const days = new Set<string>(
    (data || []).map((r: { completed_at: string }) => r.completed_at?.split("T")[0]).filter(Boolean)
  );

  const toDateStr = (d: Date) => d.toISOString().split("T")[0];
  const today = new Date();
  const todayStr = toDateStr(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toDateStr(yesterday);

  let streak = 0;
  let cursor: Date;

  if (days.has(todayStr)) {
    cursor = today;
  } else if (days.has(yesterdayStr)) {
    cursor = yesterday;
  } else {
    await supabase.from("profiles").update({ current_streak: 0 }).eq("id", userId);
    return 0;
  }

  while (days.has(toDateStr(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  await supabase.from("profiles").update({ current_streak: streak }).eq("id", userId);

  if (streak >= 1) await unlockAchievement(userId, "racha_1");
  if (streak >= 3) await unlockAchievement(userId, "racha_3");
  if (streak >= 7) await unlockAchievement(userId, "racha_7");
  if (streak >= 14) await unlockAchievement(userId, "racha_14");
  if (streak >= 30) await unlockAchievement(userId, "racha_30");

  return streak;
}

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
    .select("total_xp, coins")
    .eq("id", userId)
    .single();

  if (fetchError || !profile) throw fetchError;

  const newTotalXp = Math.max(0, profile.total_xp + xpEarned);
  const newLevel = levelFromXP(newTotalXp);
  // Las monedas del Taller son independientes del XP de nivel: comprar cosas
  // nunca puede hacer que alguien baje de nivel.
  const newCoins = Math.max(0, (profile.coins || 0) + Math.max(0, xpEarned));

  // 2. Actualizar perfil
  await supabase
    .from("profiles")
    .update({ total_xp: newTotalXp, level: newLevel, coins: newCoins })
    .eq("id", userId);

  // 3. Registrar resultado
  await supabase.from("game_results").insert({
    user_id: userId,
    game_id: gameId,
    score,
    xp_earned: xpEarned,
  });

  // 4. Verificar logros basados en juegos jugados
  const { count } = await supabase
    .from("game_results")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("game_id", "like", "mission_%"); // Avoid counting daily missions as minigames

  if (count !== null) {
    if (count >= 1) await unlockAchievement(userId, "primer_juego");
    if (count >= 10) await unlockAchievement(userId, "diez_juegos");
    if (count >= 50) await unlockAchievement(userId, "cincuenta_juegos");
    if (count >= 100) await unlockAchievement(userId, "cien_juegos");
  }

  // 5. Logros de nivel y XP global
  if (newTotalXp >= 500) await unlockAchievement(userId, "mente_acero");
  if (newLevel >= 5) await unlockAchievement(userId, "corazon_leon");
  if (newLevel >= 10) await unlockAchievement(userId, "fuerza_toro");
  if (newLevel >= 15) await unlockAchievement(userId, "voluntad_roca");
  if (newLevel >= 20) await unlockAchievement(userId, "sangre_olympos");

  // 6. Logros específicos del Desafío de Virtudes
  if (gameId === "desafio_virtudes" && xpEarned > 0) {
    const { count: virtudesCount } = await supabase
      .from("game_results")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("game_id", "desafio_virtudes")
      .gt("xp_earned", 0);
    if (virtudesCount !== null) {
      if (virtudesCount >= 1) await unlockAchievement(userId, "desafio_virtudes_1");
      if (virtudesCount >= 10) await unlockAchievement(userId, "desafio_virtudes_10");
    }
  }

  // 7. Búho de la Noche: completar algo entre 22:00 y 5:00
  const hour = new Date().getHours();
  if (gameId.startsWith("mission_") && (hour >= 22 || hour < 5)) {
    await unlockAchievement(userId, "filosofo_nocturno");
  }

  // 8. Racha real de días consecutivos
  await syncStreak(userId);

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

  await checkVirtueAchievements(userId, virtue, newAmount);
}

const VIRTUE_ACHIEVEMENT_PREFIX: Record<string, string> = {
  wisdom: "sab",
  courage: "fort",
  justice: "just",
  temperance: "temp",
};

const VIRTUE_MAX_THRESHOLD = 2000;

/** Desbloquea los logros de una virtud individual y, si aplica, los de equilibrio entre las 4. */
async function checkVirtueAchievements(
  userId: string,
  virtue: "wisdom" | "courage" | "justice" | "temperance",
  newAmount: number
): Promise<void> {
  const prefix = VIRTUE_ACHIEVEMENT_PREFIX[virtue];
  if (newAmount >= 100) await unlockAchievement(userId, `${prefix}_1`);
  if (newAmount >= 500) await unlockAchievement(userId, `${prefix}_2`);
  if (newAmount >= 1000) await unlockAchievement(userId, `${prefix}_3`);
  if (newAmount >= VIRTUE_MAX_THRESHOLD) await unlockAchievement(userId, `${prefix}_max`);

  // Logros de equilibrio: requieren las 4 virtudes parejas
  const { data: virtues } = await supabase
    .from("user_virtues")
    .select("wisdom_xp, courage_xp, justice_xp, temperance_xp")
    .eq("user_id", userId)
    .single();

  if (!virtues) return;
  const values = [virtues.wisdom_xp, virtues.courage_xp, virtues.justice_xp, virtues.temperance_xp];
  const min = Math.min(...values);

  if (min >= 50) await unlockAchievement(userId, "virt_1");
  if (min >= 250) await unlockAchievement(userId, "virt_2");
  if (min >= 700) await unlockAchievement(userId, "virt_3");
  if (min >= VIRTUE_MAX_THRESHOLD) await unlockAchievement(userId, "virt_max");
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
  // Confirmamos primero si ya existe para evitar errores en consola y eventos duplicados
  const { data: existing } = await supabase
    .from("unlocked_achievements")
    .select("achievement_id")
    .eq("user_id", userId)
    .eq("achievement_id", achievementId)
    .maybeSingle();

  if (existing) return; // Ya lo tiene desbloqueado

  // Procedemos a desbloquear
  const { error } = await supabase
    .from("unlocked_achievements")
    .insert({ user_id: userId, achievement_id: achievementId });

  if (!error && typeof window !== "undefined") {
    const event = new CustomEvent("achievement_unlocked", { detail: { achievementId } });
    window.dispatchEvent(event);
  }
}

// ─── Taller del Héroe (tienda) ─────────────────────────────────────────────

/** Compra un cosmético del Taller. Descuenta monedas (nunca XP de nivel). */
export async function purchaseShopItem(
  userId: string,
  item: ShopItem
): Promise<{ ok: boolean; reason?: string }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("coins, level")
    .eq("id", userId)
    .single();

  if (!profile) return { ok: false, reason: "Perfil no encontrado." };
  if (profile.level < item.required_level) return { ok: false, reason: "Nivel insuficiente." };
  if (profile.coins < item.cost_coins) return { ok: false, reason: "Monedas insuficientes." };

  const { error } = await supabase.from("user_purchases").insert({ user_id: userId, item_id: item.id });
  if (error) return { ok: false, reason: "Ya lo tienes o hubo un error." };

  await supabase
    .from("profiles")
    .update({ coins: profile.coins - item.cost_coins })
    .eq("id", userId);

  const { count } = await supabase
    .from("user_purchases")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (count !== null && count >= 3) await unlockAchievement(userId, "coleccionista_armas");
  if (item.id === "frame_dorado_absoluto") await unlockAchievement(userId, "coleccionista_mitico");

  return { ok: true };
}

/** Equipa un marco o título ya comprado. */
export async function equipShopItem(userId: string, item: ShopItem): Promise<void> {
  const field = item.category === "frame" ? "equipped_frame" : "equipped_title";
  await supabase.from("profiles").update({ [field]: item.id }).eq("id", userId);
}

// ─── DB Reset ───────────────────────────────────────────────────────────────

export async function resetHeroProgress(userId: string): Promise<void> {
  // Reiniciar Perfil
  await supabase.from("profiles").update({
    total_xp: 0, level: 1, coins: 0, current_streak: 0, equipped_frame: null, equipped_title: null,
  }).eq("id", userId);
  // Borrar Historial
  await supabase.from("game_results").delete().eq("user_id", userId);
  await supabase.from("daily_missions").delete().eq("user_id", userId);
  await supabase.from("unlocked_achievements").delete().eq("user_id", userId);
  await supabase.from("user_inventory").delete().eq("user_id", userId);
  await supabase.from("user_purchases").delete().eq("user_id", userId);

  // Reiniciar virtudes
  await supabase.from("user_virtues").update({
    wisdom_xp: 0, courage_xp: 0, justice_xp: 0, temperance_xp: 0
  }).eq("user_id", userId);
}
