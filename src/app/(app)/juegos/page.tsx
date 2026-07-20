"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { useProfile } from "@/lib/profile-store";
import { useEffect, useState } from "react";
import { getRequiredLevelForGame, isUnlocked } from "@/lib/progression";
import { supabase, xpForNextLevel, levelFromXP, xpWithinLevel } from "@/lib/supabase";

interface GameStat {
  bestScore: number;
  lastPlayed: string;
}

const XP_AWARD = 25;

const GAMES = [
  {
    id: "dos-cajas",
    href: "/juegos/dos-cajas",
    title: "Las Dos Cajas",
    description: "Aprende a separar lo que puedes controlar de lo que no.",
    emoji: "📦",
    color: "#3b82f6",
    xp: "10 XP por ronda",
    virtue: "Templanza",
  },
  {
    id: "desafio-virtudes",
    href: "/juegos/desafio-virtudes",
    title: "Desafío de Virtudes",
    emoji: "⚡",
    description: "Elige la virtud correcta para cada situación.",
    color: "#f59e0b",
    xp: "15 XP por acierto",
    virtue: "Sabiduría",
    requiredLevel: getRequiredLevelForGame("desafio-virtudes"),
  },
  {
    id: "memoria-estoica",
    href: "/juegos/memoria-estoica",
    title: "Memoria Estoica",
    emoji: "🧠",
    description: "Entrena tu mente estoica encontrando los pares ocultos.",
    color: "#8b5cf6",
    xp: "Variable (Gana XP según tus movimientos)",
    virtue: "Prudencia",
    requiredLevel: getRequiredLevelForGame("memoria-estoica"),
  },
  {
    id: "semaforo-emocional",
    href: "/juegos/semaforo",
    title: "Semáforo Emocional",
    emoji: "🚦",
    description: "Detén, piensa y actúa. Gestiona tus emociones con sabiduría.",
    color: "#22c55e",
    xp: "15 XP por registro",
    virtue: "Múltiples",
    requiredLevel: getRequiredLevelForGame("semaforo-emocional"),
  },
  {
    id: "defensor-mente",
    href: "/juegos/defensor",
    title: "Defensor de la Mente",
    emoji: "🚀",
    description: "Defiende tu paz interior de los pensamientos invasivos en este arcade.",
    color: "#ef4444",
    xp: "20 XP por superarlo",
    virtue: "Fortaleza",
    requiredLevel: getRequiredLevelForGame("defensor-mente"),
  },
  {
    id: "constructor-escudo",
    href: "/juegos/escudo",
    title: "Escudo Estoico",
    emoji: "🛡️",
    description: "Construye tu escudo personal con los 4 pilares estoicos: Sabiduría, Coraje, Justicia y Templanza.",
    color: "#d4a017",
    xp: `${XP_AWARD} XP al completar`,
    virtue: "Justicia",
    requiredLevel: getRequiredLevelForGame("constructor-escudo"),
  },
  {
    id: "vuelo-buho",
    href: "/juegos/vuelo-buho",
    title: "El Vuelo del Búho",
    emoji: "🦉",
    description: "Aletea entre las columnas del templo, recoge sabiduría y esquiva las distracciones.",
    color: "#eab308",
    xp: "Hasta 70 XP por vuelo",
    virtue: "Sabiduría",
    requiredLevel: getRequiredLevelForGame("vuelo-buho"),
  },
  {
    id: "falange-serena",
    href: "/juegos/falange",
    title: "La Falange Serena",
    emoji: "🛡️",
    description: "Defiende tu formación de las sombras invasoras y derrota a un jefe cada 5 oleadas.",
    color: "#818cf8",
    xp: "XP por cada oleada superada",
    virtue: "Coraje",
    requiredLevel: getRequiredLevelForGame("falange-serena"),
  },
];

// Ids del hub (con guion) → ids reales guardados en game_results (con guion bajo)
const GAME_ID_MAP: Record<string, string> = {
  "dos-cajas": "dos_cajas",
  "desafio-virtudes": "desafio_virtudes",
  "memoria-estoica": "memoria_estoica",
  "semaforo-emocional": "semaforo_emocional",
  "defensor-mente": "defensor_mente",
  "constructor-escudo": "constructor_escudo",
  "vuelo-buho": "vuelo_buho",
  "falange-serena": "falange_serena",
};

function totalXpToReachLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) total += xpForNextLevel(i);
  return total;
}

export default function JuegosPage() {
  const { activeProfile, sessionLoading } = useProfile();
  const router = useRouter();
  const currentLevel = activeProfile?.level ?? 1;
  const [stats, setStats] = useState<Record<string, GameStat>>({});

  useEffect(() => {
    if (!activeProfile) {
      if (!sessionLoading) router.replace("/select-hero");
      return;
    }

    supabase
      .from("game_results")
      .select("game_id, score, completed_at")
      .eq("user_id", activeProfile.id)
      .then(({ data }: { data: { game_id: string; score: number; completed_at: string }[] | null }) => {
        const byGame: Record<string, GameStat> = {};
        (data || []).forEach((r) => {
          if (!r.game_id || r.game_id.startsWith("mission_")) return;
          const current = byGame[r.game_id];
          byGame[r.game_id] = {
            bestScore: Math.max(current?.bestScore ?? 0, r.score ?? 0),
            lastPlayed: current?.lastPlayed && current.lastPlayed > r.completed_at ? current.lastPlayed : r.completed_at,
          };
        });
        setStats(byGame);
      });
  }, [activeProfile, router]);

  return (
    <div>
      {/* Header */}
      <div className="main-header" style={{ marginLeft: -24, marginRight: -24, marginTop: -24, marginBottom: 24, padding: "16px 24px" }}>
        <div className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>
          ACADEMIA ESTOICA GOPLEMMINGS
        </div>
        <div style={{ fontSize: 13, color: "#94a3b8" }}>Sala de Entrenamiento</div>
      </div>

      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display"
        style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}
      >
        ⚔️ Sala de Entrenamiento
      </motion.h2>
      <p style={{ color: "#64748b", marginBottom: 28 }}>
        Elige tu misión de entrenamiento. ¡Cada juego te hace más fuerte!
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 20,
        }}
      >
        {GAMES.map((game, i) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            {!isUnlocked(game.requiredLevel ?? 1, currentLevel) ? (
              <div
                className="game-card"
                style={{ opacity: 0.5, cursor: "not-allowed", filter: "grayscale(0.4)" }}
              >
                <GameCardContent game={game} currentLevel={currentLevel} stat={stats[GAME_ID_MAP[game.id]]} totalXp={activeProfile?.total_xp ?? 0} />
              </div>
            ) : (
              <Link href={game.href} style={{ textDecoration: "none" }}>
                <div className="game-card">
                  <GameCardContent game={game} currentLevel={currentLevel} stat={stats[GAME_ID_MAP[game.id]]} totalXp={activeProfile?.total_xp ?? 0} />
                </div>
              </Link>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function GameCardContent({
  game,
  currentLevel,
  stat,
  totalXp,
}: {
  game: typeof GAMES[0];
  currentLevel: number;
  stat?: GameStat;
  totalXp: number;
}) {
  const locked = !isUnlocked(game.requiredLevel ?? 1, currentLevel);
  const xpMissing = locked ? Math.max(0, totalXpToReachLevel(game.requiredLevel ?? 1) - totalXp) : 0;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
        <div
          style={{
            width: 52,
            height: 52,
            background: `${game.color}20`,
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            border: `2px solid ${game.color}40`,
            flexShrink: 0,
          }}
        >
          {game.emoji}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>{game.title}</div>
          <div style={{ fontSize: 11, color: game.color, fontWeight: 600 }}>
            Virtud: {game.virtue}
          </div>
        </div>
      </div>
      <p style={{ color: "#64748b", fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>
        {game.description}
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <div
          style={{
            background: `${game.color}15`,
            borderRadius: 8,
            padding: "4px 10px",
            fontSize: 12,
            fontWeight: 600,
            color: game.color,
            display: "inline-block",
          }}
        >
          🌟 {game.xp}
        </div>
        <div
          style={{
            background: locked ? "#fee2e2" : "#dcfce7",
            color: locked ? "#b91c1c" : "#166534",
            borderRadius: 8,
            padding: "4px 10px",
            fontSize: 12,
            fontWeight: 700,
            display: "inline-block",
          }}
        >
          {locked ? `🔒 Nivel ${game.requiredLevel}` : "✅ Desbloqueado"}
        </div>
      </div>

      {locked ? (
        <div style={{ marginTop: 10, fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
          Te faltan {xpMissing} XP para desbloquearlo
        </div>
      ) : stat ? (
        <div style={{ marginTop: 10, fontSize: 11, color: "#64748b", display: "flex", gap: 12, flexWrap: "wrap" }}>
          <span>🏅 Récord: {stat.bestScore}</span>
          <span>🕘 Última vez: {new Date(stat.lastPlayed).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>
        </div>
      ) : (
        <div style={{ marginTop: 10, fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>
          Aún no lo has jugado
        </div>
      )}
    </>
  );
}
