"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/profile-store";
import { supabase, unlockAchievement } from "@/lib/supabase";
import { toast } from "sonner";
import { triggerAchievementAnimation } from "@/lib/confetti";

import { ALL_ACHIEVEMENTS } from "@/lib/data-logros";

export default function LogrosPage() {
  const { activeProfile } = useProfile();
  const router = useRouter();
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!activeProfile) { router.replace("/"); return; }
    supabase
      .from("unlocked_achievements")
      .select("achievement_id")
      .eq("user_id", activeProfile.id)
      .then(({ data }) => {
        if (data) setUnlockedIds(new Set(data.map((r) => r.achievement_id)));
      });
  }, [activeProfile?.id]);

  const handleUnlock = async (achievementId: string) => {
    if (!activeProfile) return;
    try {
      await unlockAchievement(activeProfile.id, achievementId);
      
      // Update local state
      setUnlockedIds(prev => {
        const newSet = new Set(prev);
        newSet.add(achievementId);
        return newSet;
      });

      // Play Animation
      triggerAchievementAnimation();
      
      const achievement = ALL_ACHIEVEMENTS.find(a => a.id === achievementId);
      toast.success(`¡Logro Desbloqueado: ${achievement?.label}!`, {
        description: "Continúa tu camino estoico.",
        icon: "🏆"
      });

    } catch (error) {
      console.error(error);
      toast.error("Error al desbloquear el logro");
    }
  };

  const unlocked = ALL_ACHIEVEMENTS.filter((a) => unlockedIds.has(a.id));
  const locked = ALL_ACHIEVEMENTS.filter((a) => !unlockedIds.has(a.id));

  return (
    <div>
      <div className="main-header" style={{ marginLeft: -24, marginRight: -24, marginTop: -24, marginBottom: 24, padding: "16px 24px" }}>
        <div className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>ACADEMIA ESTOICA GOPLEMMINGS</div>
        <div style={{ fontSize: 13, color: "#94a3b8" }}>Sala de Trofeos</div>
      </div>

      <h2 className="font-display" style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>
        🏆 Sala de Trofeos
      </h2>
      <p style={{ color: "#64748b", marginBottom: 28 }}>
        {unlocked.length}/{ALL_ACHIEVEMENTS.length} logros desbloqueados. ¡Sigue entrenando!
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
        {ALL_ACHIEVEMENTS.map((achievement, i) => {
          const isUnlocked = unlockedIds.has(achievement.id);
          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className="parchment-card"
              onClick={() => !isUnlocked && handleUnlock(achievement.id)}
              style={{
                textAlign: "center",
                opacity: isUnlocked ? 1 : 0.45,
                filter: isUnlocked ? "none" : "grayscale(0.6)",
                cursor: isUnlocked ? "default" : "pointer",
              }}
              whileHover={!isUnlocked ? { scale: 1.05, opacity: 0.8 } : {}}
            >
              <div
                className="badge-icon"
                style={{
                  margin: "0 auto 10px",
                  background: isUnlocked ? `${achievement.color}20` : "#f1f5f9",
                  border: `2px solid ${isUnlocked ? achievement.color + "50" : "#e2e8f0"}`,
                  fontSize: 32,
                  width: 64,
                  height: 64,
                }}
              >
                {achievement.icon}
              </div>
              <div style={{
                fontWeight: 700,
                fontSize: 13,
                color: isUnlocked ? achievement.color : "#94a3b8",
                marginBottom: 4,
              }}>
                {achievement.label}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>
                {achievement.desc}
              </div>
              {isUnlocked && (
                <div style={{
                  marginTop: 8,
                  background: "#dcfce7",
                  color: "#166534",
                  borderRadius: 20,
                  padding: "2px 10px",
                  fontSize: 11,
                  fontWeight: 600,
                }}>
                  ✅ Obtenido
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
