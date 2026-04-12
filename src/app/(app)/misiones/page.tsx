"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/profile-store";
import { completeMission, levelFromXP, supabase, type UserVirtues } from "@/lib/supabase";
import { getDynamicMissions } from "@/lib/dynamic-missions";
import { VIRTUE_LABELS } from "@/lib/progression";

interface CompletedMissionRow {
  mission_id: string;
}

interface LatestGameRow {
  game_id: string;
}

export default function MisionesPage() {
  const { activeProfile, refreshProfile } = useProfile();
  const router = useRouter();
  const [completadas, setCompletadas] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [virtues, setVirtues] = useState<UserVirtues | null>(null);
  const [latestGameId, setLatestGameId] = useState<string | null>(null);

  const misiones = useMemo(() => {
    if (!activeProfile) return [];
    return getDynamicMissions({
      virtues,
      latestGameId,
      currentLevel: levelFromXP(activeProfile.total_xp),
    });
  }, [activeProfile, latestGameId, virtues]);

  useEffect(() => {
    if (!activeProfile) { router.replace("/select-hero"); return; }
    const today = new Date().toISOString().split("T")[0];
    Promise.all([
      supabase
        .from("daily_missions")
        .select("mission_id")
        .eq("user_id", activeProfile.id)
        .eq("mission_date", today)
        .eq("is_completed", true),
      supabase
        .from("user_virtues")
        .select("*")
        .eq("user_id", activeProfile.id)
        .single(),
      supabase
        .from("game_results")
        .select("game_id")
        .eq("user_id", activeProfile.id)
        .not("game_id", "like", "mission_%")
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]).then(([missionsRes, virtuesRes, gameRes]) => {
      if (missionsRes?.data) {
        const done: Record<string, boolean> = {};
        (missionsRes.data as CompletedMissionRow[]).forEach((mission) => { done[mission.mission_id] = true; });
        setCompletadas(done);
      }

      if (virtuesRes?.data) {
        setVirtues(virtuesRes.data as UserVirtues);
      }

      setLatestGameId((gameRes?.data as LatestGameRow | null)?.game_id ?? null);
    });
  }, [activeProfile, router]);

  useEffect(() => {
    if (misiones.length > 0 && !expanded) {
      setExpanded(misiones[0].id);
    }
  }, [expanded, misiones]);

  const handleCompletar = async (misionId: string, xp: number) => {
    if (completadas[misionId] || !activeProfile || submitting) return;
    setSubmitting(misionId);
    try {
      await completeMission(activeProfile.id, misionId, xp, notes[misionId]);
      setCompletadas((prev) => ({ ...prev, [misionId]: true }));
      toast.success(`¡Misión completada! +${xp} XP`, {
        description: "Has dado un paso más para convertirte en un sabio.",
        icon: "🌟",
      });
      refreshProfile();
    } catch {
      toast.error("Error al guardar la misión.");
    } finally {
      setSubmitting(null);
    }
  };

  const totalXp = misiones.filter((m) => completadas[m.id]).reduce((sum, m) => sum + m.xp, 0);

  return (
    <div>
      <div className="main-header" style={{ marginLeft: -24, marginRight: -24, marginTop: -24, marginBottom: 24, padding: "16px 24px" }}>
        <div className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>ACADEMIA ESTOICA GOPLEMMINGS</div>
        <div style={{ fontSize: 13, color: "#94a3b8" }}>Misiones</div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h2 className="font-display" style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
            🎯 Entrenamiento de Héroe
          </h2>
          <p style={{ color: "#64748b" }}>Misiones generadas según tu virtud más débil y tu entrenamiento más reciente.</p>
        </div>
        {totalXp > 0 && (
          <div style={{
            background: "linear-gradient(135deg, #d4a017, #f0c840)",
            color: "#1e293b",
            borderRadius: 12,
            padding: "8px 20px",
            fontWeight: 700,
            fontSize: 16,
          }}>
            🌟 {totalXp} XP hoy
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {misiones.map((mision, i) => (
          <motion.div
            key={mision.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="parchment-card"
            style={{
              border: completadas[mision.id]
                ? "1px solid #bbf7d0"
                : "1px solid var(--card-border)",
              background: completadas[mision.id]
                ? "rgba(34,197,94,0.04)"
                : "rgba(255,255,255,0.75)",
            }}
          >
            {/* Header */}
            <button
              onClick={() => setExpanded(expanded === mision.id ? null : mision.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                fontFamily: "inherit",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {completadas[mision.id] && (
                  <span style={{ color: "#22c55e", fontSize: 18 }}>✅</span>
                )}
                <span style={{ fontWeight: 700, fontSize: 16, color: "#1e293b" }}>
                  {mision.titulo}
                </span>
                {mision.focusVirtue && (
                  <span style={{
                    background: "#ede9fe",
                    color: "#6d28d9",
                    borderRadius: 20,
                    padding: "2px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}>
                    Refuerza {VIRTUE_LABELS[mision.focusVirtue]}
                  </span>
                )}
                <span style={{
                  background: "#fef9c3",
                  color: "#92400e",
                  borderRadius: 20,
                  padding: "2px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  {mision.xp} XP
                </span>
              </div>
              <span style={{ color: "#94a3b8" }}>
                {expanded === mision.id ? "▲" : "▼"}
              </span>
            </button>

            {/* Content */}
            {expanded === mision.id && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ marginTop: 16 }}
              >
                <p style={{ color: "#475569", marginBottom: 12 }}>{mision.descripcion}</p>
                <ul style={{ paddingLeft: 20, color: "#64748b", display: "flex", flexDirection: "column", gap: 6 }}>
                  {mision.items.map((item, j) => (
                    <li key={j} style={{ fontSize: 14 }}>{item}</li>
                  ))}
                </ul>

                {mision.requireNotes && (
                  <div style={{ marginTop: 16 }}>
                    <label style={{ fontWeight: 600, fontSize: 13, color: "#475569", display: "block", marginBottom: 6 }}>
                      📝 Escribe tus tres cosas buenas de hoy:
                    </label>
                    <textarea
                      value={notes[mision.id] ?? ""}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [mision.id]: e.target.value }))}
                      disabled={completadas[mision.id]}
                      rows={4}
                      placeholder="1. Hoy hice bien...\n2. Podría mejorar...\n3. Estoy agradecido por..."
                      style={{
                        width: "100%",
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        padding: "10px 14px",
                        fontSize: 14,
                        fontFamily: "inherit",
                        resize: "vertical",
                        background: completadas[mision.id] ? "#f8fafc" : "white",
                        color: "#374151",
                      }}
                    />
                  </div>
                )}

                <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => handleCompletar(mision.id, mision.xp)}
                    disabled={completadas[mision.id] || submitting === mision.id}
                    style={{
                      background: completadas[mision.id] ? "#22c55e" : "#2563eb",
                      color: "white",
                      border: "none",
                      borderRadius: 10,
                      padding: "10px 24px",
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: completadas[mision.id] ? "default" : "pointer",
                      fontFamily: "inherit",
                      opacity: submitting === mision.id ? 0.7 : 1,
                    }}
                  >
                    {completadas[mision.id] ? "¡Misión Cumplida! ✅" : "Marcar como Completada"}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
