"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/profile-store";
import { supabase } from "@/lib/supabase";

interface MissionEntry {
  kind: "mission";
  date: string;
  mission_id: string;
  reflection_notes: string | null;
}

interface EmotionEntry {
  kind: "emotion";
  date: string;
  emotion: string;
  trigger_reason: string;
  can_control: boolean;
  virtue_selected: string;
  action_plan: string;
}

type DiaryEntry = MissionEntry | EmotionEntry;

const EMOTIONS_MAP: Record<string, string> = {
  angry: "😡 Enojo",
  sad: "😢 Tristeza",
  anxious: "😰 Ansiedad",
  frustrated: "😔 Frustración",
  scared: "😨 Miedo",
  neutral: "😐 Calma",
  peaceful: "😌 Paz",
  happy: "🙂 Alegría",
};

export default function DiarioPage() {
  const { activeProfile, sessionLoading } = useProfile();
  const router = useRouter();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeProfile) {
      if (!sessionLoading) router.replace("/select-hero");
      return;
    }

    Promise.all([
      supabase
        .from("daily_missions")
        .select("mission_id, reflection_notes, completed_at, mission_date")
        .eq("user_id", activeProfile.id)
        .not("reflection_notes", "is", null)
        .order("completed_at", { ascending: false }),
      supabase
        .from("emotional_logs")
        .select("*")
        .eq("user_id", activeProfile.id)
        .order("created_at", { ascending: false }),
    ]).then(([missionsRes, logsRes]) => {
      const missionEntries: MissionEntry[] = (missionsRes.data || [])
        .filter((m: { reflection_notes: string | null }) => m.reflection_notes && m.reflection_notes.trim().length > 0)
        .map((m: { mission_id: string; reflection_notes: string; completed_at: string; mission_date: string }) => ({
          kind: "mission" as const,
          date: m.completed_at || m.mission_date,
          mission_id: m.mission_id,
          reflection_notes: m.reflection_notes,
        }));

      const emotionEntries: EmotionEntry[] = (logsRes.data || []).map((log: any) => ({
        kind: "emotion" as const,
        date: log.created_at,
        emotion: log.emotion,
        trigger_reason: log.trigger_reason,
        can_control: log.can_control,
        virtue_selected: log.virtue_selected,
        action_plan: log.action_plan,
      }));

      const all = [...missionEntries, ...emotionEntries].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setEntries(all);
      setLoading(false);
    });
  }, [activeProfile, router]);

  if (!activeProfile) return null;

  return (
    <div>
      <div className="main-header" style={{ marginLeft: -24, marginRight: -24, marginTop: -24, marginBottom: 24, padding: "16px 24px" }}>
        <div className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>ACADEMIA ESTOICA GOPLEMMINGS</div>
        <div style={{ fontSize: 13, color: "#94a3b8" }}>Diario del Héroe</div>
      </div>

      <h2 className="font-display" style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>
        📓 Diario de {activeProfile.name}
      </h2>
      <p style={{ color: "#64748b", marginBottom: 28, maxWidth: 640 }}>
        Aquí guardas tus propias reflexiones: lo que escribiste en tus misiones y lo que sentiste en el
        Semáforo Emocional. Como decía Marco Aurelio, releer lo que pensaste te ayuda a pensar mejor mañana.
      </p>

      {loading ? (
        <p style={{ color: "#94a3b8" }}>Cargando tu diario...</p>
      ) : entries.length === 0 ? (
        <div className="parchment-card" style={{ textAlign: "center", padding: 40 }}>
          <span style={{ fontSize: 40 }}>🍃</span>
          <p style={{ color: "#64748b", marginTop: 12 }}>
            Todavía no has escrito nada. Completa una misión con reflexión o registra una emoción en el
            Semáforo para empezar tu diario.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 720 }}>
          {entries.map((entry, i) => (
            <motion.div
              key={`${entry.kind}-${entry.date}-${i}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.4) }}
              className="parchment-card"
              style={{ padding: 20 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{
                  fontSize: 12, fontWeight: 800, padding: "3px 10px", borderRadius: 20,
                  background: entry.kind === "mission" ? "#fef9c3" : "#e0f2fe",
                  color: entry.kind === "mission" ? "#92400e" : "#0369a1",
                }}>
                  {entry.kind === "mission" ? "🎯 Reflexión de Misión" : "🚦 Registro Emocional"}
                </span>
                <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>
                  {new Date(entry.date).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>

              {entry.kind === "mission" ? (
                <p style={{ color: "#334155", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {entry.reflection_notes}
                </p>
              ) : (
                <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.6 }}>
                  <p><strong>{EMOTIONS_MAP[entry.emotion] || entry.emotion}</strong> — {entry.trigger_reason}</p>
                  <p style={{ marginTop: 6, color: "#64748b" }}>
                    {entry.can_control ? "✅ Estaba bajo mi control" : "🌬️ No estaba bajo mi control"} · Virtud: {entry.virtue_selected}
                  </p>
                  {entry.action_plan && (
                    <p style={{ marginTop: 8, fontStyle: "italic", color: "#475569" }}>“{entry.action_plan}”</p>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
