"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { useProfile } from "@/lib/profile-store";
import ModularAvatar from "@/components/game/ModularAvatar";
import {
  supabase,
  type UserVirtues,
  xpForNextLevel,
  xpWithinLevel,
  levelFromXP,
} from "@/lib/supabase";
import { ALL_ACHIEVEMENTS, type Achievement } from "@/lib/data-logros";

// ── Virtue radar (SVG) ──────────────────────────────────────────
function VirtueRadar({ virtues }: { virtues: UserVirtues | null }) {
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = 70;

  const v = virtues
    ? {
        prudencia: Math.min(virtues.wisdom_xp / 1000, 1),
        fortaleza: Math.min(virtues.courage_xp / 1000, 1),
        justicia: Math.min(virtues.justice_xp / 1000, 1),
        templanza: Math.min(virtues.temperance_xp / 1000, 1),
      }
    : { prudencia: 0.05, fortaleza: 0.05, justicia: 0.05, templanza: 0.05 };

  // 4 axes: top, right, bottom, left
  const axes = [
    { key: "prudencia", label: "PRUDENCIA", angle: -90, color: "#f59e0b", icon: "🦉" },
    { key: "fortaleza", label: "FORTALEZA", angle: 0, color: "#ef4444", icon: "🦁" },
    { key: "justicia", label: "JUSTICIA", angle: 90, color: "#3b82f6", icon: "⚖️" },
    { key: "templanza", label: "TEMPLANZA", angle: 180, color: "#8b5cf6", icon: "🧘" },
  ];

  const toPoint = (angle: number, val: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + r * val * Math.cos(rad),
      y: cy + r * val * Math.sin(rad),
    };
  };

  const polygon = axes
    .map(({ key, angle }) => {
      const { x, y } = toPoint(angle, v[key as keyof typeof v]);
      return `${x},${y}`;
    })
    .join(" ");

  const gridLines = [0.25, 0.5, 0.75, 1].map((scale) =>
    axes
      .map(({ angle }) => {
        const { x, y } = toPoint(angle, scale);
        return `${x},${y}`;
      })
      .join(" ")
  );

  const percent = (key: string) =>
    Math.round((v[key as keyof typeof v] || 0) * 100);

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
      {/* SVG Radar */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid */}
        {gridLines.map((pts, i) => (
          <polygon
            key={i}
            points={pts}
            fill="none"
            stroke="rgba(0,0,0,0.08)"
            strokeWidth={1}
          />
        ))}
        {/* Axes */}
        {axes.map(({ angle, color }) => {
          const { x, y } = toPoint(angle, 1);
          return (
            <line
              key={angle}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke={color}
              strokeWidth={1}
              opacity={0.4}
            />
          );
        })}
        {/* Data polygon */}
        <polygon
          points={polygon}
          fill="rgba(59,130,246,0.2)"
          stroke="#3b82f6"
          strokeWidth={2}
        />
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {axes.map(({ key, label, color, icon }) => (
          <div
            key={key}
            style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}
          >
            <span>{icon}</span>
            <span style={{ color, fontWeight: 600, fontSize: 11, minWidth: 80 }}>
              {label}
            </span>
            <span style={{ color: "#334155" }}>({percent(key)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────
export default function HomePage() {
  const { activeProfile, refreshProfile } = useProfile();
  const router = useRouter();
  const [virtues, setVirtues] = useState<UserVirtues | null>(null);
  const [completedToday, setCompletedToday] = useState(0);
  const [recentLogros, setRecentLogros] = useState<Achievement[]>([]);
  const [hasNoLogros, setHasNoLogros] = useState(false);

  useEffect(() => {
    if (!activeProfile) {
      router.replace("/select-hero");
      return;
    }
    refreshProfile();

    // Load virtues
    supabase
      .from("user_virtues")
      .select("*")
      .eq("user_id", activeProfile.id)
      .single()
      .then(({ data }: any) => {
        if (data) setVirtues(data as UserVirtues);
      });

    // Count missions done today
    const today = new Date().toISOString().split("T")[0];
    supabase
      .from("daily_missions")
      .select("id")
      .eq("user_id", activeProfile.id)
      .eq("mission_date", today)
      .eq("is_completed", true)
      .then(({ data }: any) => {
        setCompletedToday(data?.length ?? 0);
      });

    // Fetch recent achievements
    supabase
      .from("unlocked_achievements")
      .select("achievement_id, unlocked_at")
      .eq("user_id", activeProfile.id)
      .order("unlocked_at", { ascending: false })
      .limit(3)
      .then(({ data }: any) => {
        if (data && data.length > 0) {
          const mapped = data.map((d: any) => ALL_ACHIEVEMENTS.find(a => a.id === d.achievement_id)).filter(Boolean) as Achievement[];
          setRecentLogros(mapped);
          setHasNoLogros(false);
        } else {
          setRecentLogros([ALL_ACHIEVEMENTS[0]]); // El Iniciado (o cualquier próximo)
          setHasNoLogros(true);
        }
      });
  }, [activeProfile?.id]);

  if (!activeProfile) return null;

  const level = levelFromXP(activeProfile.total_xp);
  const xpInLevel = xpWithinLevel(activeProfile.total_xp);
  const xpNeeded = xpForNextLevel(level);
  const xpPercent = Math.round((xpInLevel / xpNeeded) * 100);
  const hp = Math.min(10, level); // Max HP sube con nivel (simplificado)

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  const HERO_EMOJIS: Record<string, string> = {
    "00000000-0000-0000-0000-000000000001": "⚔️",
    "00000000-0000-0000-0000-000000000002": "🦉",
    "00000000-0000-0000-0000-000000000003": "🏛️",
  };
  const heroEmoji = HERO_EMOJIS[activeProfile.id] ?? "🦸";

  return (
    <div>
      {/* Header */}
      <div className="main-header" style={{ marginLeft: -24, marginRight: -24, marginTop: -24, marginBottom: 24, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>
            ACADEMIA ESTOICA GOPLEMMINGS
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>Cuartel General</div>
        </div>
        
        <Link 
          href="/select-hero" 
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.1)",
            padding: "8px 16px",
            borderRadius: 20,
            color: "#f1e9d0",
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 600,
            border: "1px solid rgba(255,255,255,0.2)",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.15)";
            e.currentTarget.style.borderColor = "var(--gold-400)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
          }}
        >
          <span style={{ fontSize: 16 }}>🦸</span>
          <span className="hidden sm:inline">Cambiar Héroe</span>
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
        {/* ── Col 1: Perfil y Virtudes ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Avatar + nombre */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="parchment-card"
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  background: "linear-gradient(135deg,#2e3a5c,#1a2035)",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  border: "2px solid var(--gold-400)",
                }}
              >
                {heroEmoji}
              </div>
              <div>
                <div
                  className="font-display"
                  style={{ fontWeight: 700, fontSize: 18, color: "#1e293b" }}
                >
                  {activeProfile.name}
                </div>
                <div style={{ color: "#475569", fontSize: 13, fontWeight: 600 }}>
                  Nivel {level}
                </div>
              </div>
            </div>
          </motion.div>

          {/* HP y XP */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="parchment-card"
          >
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#334155",
                }}
              >
                <span>PAZ MENTAL (HP)</span>
                <span>{hp}/{Math.min(10, level + 4)}</span>
              </div>
              <div className="progress-track">
                <motion.div
                  className="progress-fill-hp"
                  initial={{ width: 0 }}
                  animate={{ width: `${(hp / (level + 4)) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
              </div>
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#334155",
                }}
              >
                <span>NIVEL {level}-{level + 1} XP</span>
                <span>
                  {xpInLevel}/{xpNeeded} XP
                </span>
              </div>
              <div className="progress-track">
                <motion.div
                  className="progress-fill-xp"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercent}%` }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                />
              </div>
            </div>
          </motion.div>

          {/* Radar de virtudes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="parchment-card"
          >
            <VirtueRadar virtues={virtues} />
          </motion.div>
        </div>

        {/* ── Col 2: Avatar central ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}
        >
          {/* Saludo */}
          <div
            className="parchment-card"
            style={{ width: "100%", textAlign: "center" }}
          >
            <p style={{ color: "#475569", fontSize: 14, fontWeight: 500 }}>{greeting}, Héroe</p>
            <h2
              className="font-display"
              style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", marginTop: 2 }}
            >
              ¡{activeProfile.name}!
            </h2>
          </div>

          {/* Avatar grande animado (Sistema 2D Modular) */}
          <div
            className="float-animation"
            style={{
              position: "relative",
              width: 260,
              height: 380,
              background: "linear-gradient(180deg, rgba(245,230,200,0.4), rgba(245,230,200,0.1))",
              borderRadius: 24,
              border: "3px solid var(--gold-400)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden" // Clip base layer nicely
            }}
          >
            <ModularAvatar heroId={activeProfile.id} level={level} />
          </div>

          {/* Racha */}
          <div className="streak-badge">
            🔥 Racha de {activeProfile.current_streak} días
          </div>

          {/* CTA Misión del día */}
          <Link href="/misiones" style={{ width: "100%", textDecoration: "none" }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #d4a017, #f0c840)",
                color: "#1e293b",
                border: "none",
                borderRadius: 12,
                padding: "14px 20px",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ⚡ Ir a la Misión del Día
            </motion.button>
          </Link>
        </motion.div>

        {/* ── Col 3: Misiones + Logros ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Misión del dia */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="parchment-card"
          >
            <h3
              className="font-display"
              style={{
                textAlign: "center",
                fontWeight: 700,
                fontSize: 14,
                borderBottom: "1px solid var(--card-border)",
                paddingBottom: 10,
                marginBottom: 12,
                letterSpacing: "0.05em",
              }}
            >
              MISIÓN DEL DÍA
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "El Diario del Héroe (5 min)", id: "m1" },
                { label: "¿Y qué si?", id: "m2" },
                { label: "Misión Secreta de Bondad", id: "m3" },
              ].map((m, i) => (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "start", gap: 10, fontSize: 13 }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      border: "2px solid #94a3b8",
                      borderRadius: 3,
                      flexShrink: 0,
                      marginTop: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {i < completedToday && (
                      <span style={{ color: "#22c55e", fontSize: 11 }}>✓</span>
                    )}
                  </div>
                  <span style={{ color: "#334155", lineHeight: 1.4, fontWeight: 500 }}>{m.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Logros recientes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="parchment-card"
          >
            <h3
              className="font-display"
              style={{
                textAlign: "center",
                fontWeight: 700,
                fontSize: 14,
                borderBottom: "1px solid var(--card-border)",
                paddingBottom: 10,
                marginBottom: 12,
                letterSpacing: "0.05em",
              }}
            >
              {hasNoLogros ? "PRÓXIMO A CUMPLIRSE" : "LOGROS RECIENTES"}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recentLogros.map((badge, i) => (
                <div
                  key={i}
                  className="badge-card"
                  style={{ flexDirection: "row", justifyContent: "start", gap: 12 }}
                >
                  <div
                    className="badge-icon"
                    style={{
                      background: `${badge.color}20`,
                      border: `2px solid ${badge.color}40`,
                      width: 40,
                      height: 40,
                      fontSize: 22,
                    }}
                  >
                    {badge.icon}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: badge.color,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase"
                      }}
                    >
                      {badge.label}
                    </span>
                    {hasNoLogros && (
                      <span style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{badge.desc}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Total XP */}
          <div
            className="parchment-card"
            style={{ textAlign: "center" }}
          >
            <div style={{ fontSize: 28, fontWeight: 700, color: "#d4a017" }}>
              {activeProfile.total_xp}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>XP TOTALES</div>
          </div>
        </div>
      </div>
    </div>
  );
}
