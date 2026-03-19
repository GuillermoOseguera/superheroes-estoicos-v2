"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/profile-store";
import { supabase } from "@/lib/supabase";
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
      .then(({ data }: any) => {
        if (data) setUnlockedIds(new Set(data.map((r: any) => r.achievement_id)));
      });
  }, [activeProfile?.id]);

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
      <p style={{ color: "#64748b", marginBottom: 28, fontSize: "1.05rem" }}>
        Has desbloqueado <strong style={{ color: "#10b981" }}>{unlocked.length}</strong> de <strong>{ALL_ACHIEVEMENTS.length}</strong> logros. 
        Te {locked.length === 1 ? 'falta' : 'faltan'} <strong>{locked.length}</strong> para completar la colección. ¡Sigue entrenando!
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
        {ALL_ACHIEVEMENTS.map((achievement, i) => {
          const isUnlocked = unlockedIds.has(achievement.id);
          return (
            <motion.div
              key={achievement.id}
              onClick={() => {
                if (isUnlocked) {
                  window.dispatchEvent(new CustomEvent("achievement_unlocked", { detail: { achievementId: achievement.id } }));
                }
              }}
              whileHover={isUnlocked ? { y: -5, scale: 1.05 } : {}}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className="parchment-card"
              style={{
                textAlign: "center",
                opacity: isUnlocked ? 1 : 0.6,
                filter: isUnlocked ? "none" : "grayscale(0.8)",
                cursor: isUnlocked ? "pointer" : "default",
              }}
            >
              <div
                className="badge-icon"
                style={{
                  margin: "0 auto 10px",
                  background: isUnlocked ? `${achievement.color}20` : "#f1f5f9",
                  border: `2px solid ${isUnlocked ? achievement.color + "50" : "#cbd5e1"}`,
                  fontSize: 32,
                  width: 64,
                  height: 64,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {isUnlocked ? achievement.icon : "🔒"}
              </div>
              <div style={{
                fontWeight: 700,
                fontSize: 13,
                color: isUnlocked ? achievement.color : "#64748b",
                marginBottom: 4,
              }}>
                {achievement.label}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4, fontStyle: isUnlocked ? "normal" : "italic" }}>
                {isUnlocked ? achievement.desc : "??? Descúbrelo jugando"}
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

      {/* SECCIÓN PRÓXIMAMENTE: GALERÍA DE RELIQUIAS */}
      <div style={{ marginTop: 60, borderTop: "2px dashed #cbd5e1", paddingTop: 40, paddingBottom: 60 }}>
        <h2 className="font-display" style={{ fontSize: 26, fontWeight: 700, marginBottom: 6, color: "#0f172a" }}>
           🏛️ Bóveda de Reliquias y Archivos (Próximamente)
        </h2>
        <p style={{ color: "#64748b", marginBottom: 28, fontSize: "1.05rem", maxWidth: 700 }}>
          Estamos preparando una cámara secreta. Al dominar ciertos juegos, no solo ganarás medallas, sino que <strong>desbloquearás Piezas de Historia (Ilustraciones Exclusivas y Videos Cinematográficos)</strong> para tu galería personal.
        </p>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
          {/* Placeholder 1 */}
          <div style={{ background: "#1e293b", borderRadius: 24, overflow: "hidden", position: "relative", filter: "grayscale(1)", opacity: 0.7, border: "2px solid #334155" }}>
             <div style={{ height: 160, background: "linear-gradient(45deg, #334155, #0f172a)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
               <span style={{ fontSize: 48, opacity: 0.4 }}>🖼️</span>
               <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                 <div style={{ background: "rgba(0,0,0,0.6)", padding: "10px 20px", borderRadius: 20, color: "white", fontWeight: 800, fontSize: 13, letterSpacing: 1 }}>
                   IMAGEN ENCRIPTADA
                 </div>
               </div>
             </div>
             <div style={{ padding: 20 }}>
               <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>RELIQUIA VISUAL</div>
               <div style={{ color: "white", fontWeight: 800, fontSize: 18 }}>El Escudo de la Lógica</div>
               <div style={{ color: "#cbd5e1", fontSize: 12, marginTop: 8 }}>🔒 Juega 5 veces "Memoria Estoica" para revelar esta ilustración legendaria.</div>
             </div>
          </div>

          {/* Placeholder 2 */}
          <div style={{ background: "#1e293b", borderRadius: 24, overflow: "hidden", position: "relative", filter: "grayscale(1)", opacity: 0.7, border: "2px solid #334155" }}>
             <div style={{ height: 160, background: "linear-gradient(45deg, #334155, #0f172a)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
               <span style={{ fontSize: 48, opacity: 0.4 }}>🎬</span>
               <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                 <div style={{ background: "rgba(0,0,0,0.6)", padding: "10px 20px", borderRadius: 20, color: "white", fontWeight: 800, fontSize: 13, letterSpacing: 1 }}>
                   CINTA BLOQUEADA
                 </div>
               </div>
             </div>
             <div style={{ padding: 20 }}>
               <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>ARCHIVO DE VIDEO</div>
               <div style={{ color: "white", fontWeight: 800, fontSize: 18 }}>Controlando la Tormenta</div>
               <div style={{ color: "#cbd5e1", fontSize: 12, marginTop: 8 }}>🔒 Gana 3 veces seguidas en "Defensor" para visualizar esta lección de fortaleza.</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
