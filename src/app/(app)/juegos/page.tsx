"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { useProfile } from "@/lib/profile-store";
import { useEffect } from "react";

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
    locked: false,
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
    locked: false,
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
    locked: false,
  },
  {
    id: "constructor-escudo",
    href: "/juegos/escudo",
    title: "Escudo Estoico",
    emoji: "🛡️",
    description: "¡Próximamente! Construye tu escudo de virtudes.",
    color: "#d4a017",
    xp: "Pronto",
    virtue: "Justicia",
    locked: true,
  },
];

export default function JuegosPage() {
  const { activeProfile } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (!activeProfile) router.replace("/");
  }, [activeProfile]);

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
            {game.locked ? (
              <div
                className="game-card"
                style={{ opacity: 0.5, cursor: "not-allowed", filter: "grayscale(0.4)" }}
              >
                <GameCardContent game={game} />
              </div>
            ) : (
              <Link href={game.href} style={{ textDecoration: "none" }}>
                <div className="game-card">
                  <GameCardContent game={game} />
                </div>
              </Link>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function GameCardContent({ game }: { game: typeof GAMES[0] }) {
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
    </>
  );
}
