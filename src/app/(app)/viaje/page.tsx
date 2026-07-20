"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/profile-store";
import { supabase, syncStreak } from "@/lib/supabase";

const DAYS_TO_SHOW = 91; // 13 semanas, como un mapa tipo GitHub

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

export default function ViajePage() {
  const { activeProfile, refreshProfile, sessionLoading } = useProfile();
  const router = useRouter();
  const [activityByDay, setActivityByDay] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [bestStreak, setBestStreak] = useState(0);

  useEffect(() => {
    if (!activeProfile) {
      if (!sessionLoading) router.replace("/select-hero");
      return;
    }

    const since = new Date();
    since.setDate(since.getDate() - DAYS_TO_SHOW);

    Promise.all([
      supabase
        .from("game_results")
        .select("completed_at")
        .eq("user_id", activeProfile.id)
        .gte("completed_at", since.toISOString()),
      syncStreak(activeProfile.id),
    ]).then(([resultsRes, streak]) => {
      const counts: Record<string, number> = {};
      (resultsRes.data || []).forEach((r: { completed_at: string }) => {
        const day = r.completed_at?.split("T")[0];
        if (day) counts[day] = (counts[day] || 0) + 1;
      });
      setActivityByDay(counts);

      // "Mejor racha" simple: la racha más larga vista dentro de la ventana mostrada
      const activeDays = Object.keys(counts).sort();
      let longest = 0;
      let running = 0;
      let prevDate: Date | null = null;
      activeDays.forEach((dayStr) => {
        const day = new Date(dayStr);
        if (prevDate) {
          const diff = Math.round((day.getTime() - prevDate.getTime()) / 86400000);
          running = diff === 1 ? running + 1 : 1;
        } else {
          running = 1;
        }
        longest = Math.max(longest, running);
        prevDate = day;
      });
      setBestStreak(Math.max(longest, streak));
      setLoading(false);
      refreshProfile();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfile, router]);

  const weeks = useMemo(() => {
    const today = new Date();
    const cells: { date: string; count: number }[] = [];
    for (let i = DAYS_TO_SHOW - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = toDateStr(d);
      cells.push({ date: dateStr, count: activityByDay[dateStr] || 0 });
    }
    // Agrupar en columnas de 7 (semanas), rellenando el inicio si hace falta
    const firstDow = new Date(cells[0].date).getDay();
    const padded = Array.from({ length: firstDow }).map(() => null as null | { date: string; count: number });
    const allCells = [...padded, ...cells];
    const cols: (typeof cells[0] | null)[][] = [];
    for (let i = 0; i < allCells.length; i += 7) {
      cols.push(allCells.slice(i, i + 7));
    }
    return cols;
  }, [activityByDay]);

  const colorFor = (count: number) => {
    if (count === 0) return "#e2e8f0";
    if (count === 1) return "#bbf7d0";
    if (count === 2) return "#4ade80";
    if (count >= 3) return "#15803d";
    return "#e2e8f0";
  };

  if (!activeProfile) return null;

  return (
    <div>
      <div className="main-header" style={{ marginLeft: -24, marginRight: -24, marginTop: -24, marginBottom: 24, padding: "16px 24px" }}>
        <div className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>ACADEMIA ESTOICA GOPLEMMINGS</div>
        <div style={{ fontSize: 13, color: "#94a3b8" }}>Mapa del Viaje</div>
      </div>

      <h2 className="font-display" style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>
        🗺️ El Mapa del Viaje de {activeProfile.name}
      </h2>
      <p style={{ color: "#64748b", marginBottom: 24 }}>Cada casilla verde es un día donde entrenaste tu carácter.</p>

      <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <div className="parchment-card" style={{ padding: "16px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#ea580c" }}>🔥 {activeProfile.current_streak}</div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>Racha actual</div>
        </div>
        <div className="parchment-card" style={{ padding: "16px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#0891b2" }}>🏆 {bestStreak}</div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>Mejor racha ({DAYS_TO_SHOW} días)</div>
        </div>
        <div className="parchment-card" style={{ padding: "16px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#7c3aed" }}>
            {Object.values(activityByDay).filter((c) => c > 0).length}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>Días activos</div>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "#94a3b8" }}>Cargando tu mapa...</p>
      ) : (
        <div className="parchment-card" style={{ padding: 24, overflowX: "auto" }}>
          <div style={{ display: "flex", gap: 4, minWidth: 640 }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {week.map((cell, di) =>
                  cell ? (
                    <motion.div
                      key={di}
                      title={`${cell.date}: ${cell.count} actividad(es)`}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (wi * 7 + di) * 0.003 }}
                      style={{
                        width: 14, height: 14, borderRadius: 4,
                        background: colorFor(cell.count),
                      }}
                    />
                  ) : (
                    <div key={di} style={{ width: 14, height: 14 }} />
                  )
                )}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 16, fontSize: 11, color: "#94a3b8" }}>
            Menos
            {[0, 1, 2, 3].map((c) => (
              <div key={c} style={{ width: 12, height: 12, borderRadius: 3, background: colorFor(c) }} />
            ))}
            Más
          </div>
        </div>
      )}
    </div>
  );
}
