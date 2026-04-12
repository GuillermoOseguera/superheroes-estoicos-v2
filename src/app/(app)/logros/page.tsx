"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/profile-store";
import { supabase, levelFromXP } from "@/lib/supabase";

import { ALL_ACHIEVEMENTS } from "@/lib/data-logros";
import {
  getCurrentMilestone,
  getLevelMilestonesForHero,
  getMilestoneStorageKey,
  getNextMilestone,
  type LevelMilestone,
} from "@/lib/level-milestones";
import { LevelMilestoneModal } from "@/components/game/LevelMilestoneModal";
import { getUnlockedRelicIds, RELIC_ASSETS, type RelicAsset } from "@/lib/relic-vault";

interface AchievementRow {
  achievement_id: string;
}

export default function LogrosPage() {
  const { activeProfile } = useProfile();
  const router = useRouter();
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [previewMilestone, setPreviewMilestone] = useState<LevelMilestone | null>(null);
  const [previewRelic, setPreviewRelic] = useState<RelicAsset | null>(null);
  const unlockedRelics = activeProfile ? getUnlockedRelicIds(activeProfile.id) : new Set<string>();

  useEffect(() => {
    if (!activeProfile) { router.replace("/select-hero"); return; }
    supabase
      .from("unlocked_achievements")
      .select("achievement_id")
      .eq("user_id", activeProfile.id)
      .then((response: { data: AchievementRow[] | null }) => {
        if (response.data) setUnlockedIds(new Set(response.data.map((row) => row.achievement_id)));
      });
  }, [activeProfile, router]);

  const unlocked = ALL_ACHIEVEMENTS.filter((a) => unlockedIds.has(a.id));
  const locked = ALL_ACHIEVEMENTS.filter((a) => !unlockedIds.has(a.id));
  const level = activeProfile ? levelFromXP(activeProfile.total_xp) : 1;
  const evolutionMilestones = activeProfile ? getLevelMilestonesForHero(activeProfile.id) : [];
  const visualRelics = RELIC_ASSETS.filter((asset) => asset.category === "reliquia");
  const videoArchives = RELIC_ASSETS.filter((asset) => asset.category === "archivo");

  const handleReplayMilestone = (milestone: LevelMilestone) => {
    setPreviewMilestone(milestone);
  };

  const handleCloseMilestone = () => {
    if (activeProfile && previewMilestone) {
      localStorage.setItem(getMilestoneStorageKey(activeProfile.id), previewMilestone.id);
    }
    setPreviewMilestone(null);
  };

  const handleCloseRelic = () => {
    setPreviewRelic(null);
  };

  return (
    <div>
      <LevelMilestoneModal
        open={Boolean(previewMilestone)}
        milestone={previewMilestone}
        nextMilestone={previewMilestone && activeProfile ? getNextMilestone(activeProfile.id, previewMilestone.level) : null}
        onClose={handleCloseMilestone}
      />

      <AnimatePresence>
        {previewRelic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md"
            onClick={handleCloseRelic}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 180, damping: 18 }}
              onClick={(event) => event.stopPropagation()}
              style={{
                width: "min(960px, 100%)",
                borderRadius: 28,
                overflow: "hidden",
                background: "white",
                border: `1px solid ${previewRelic.accent}44`,
                boxShadow: `0 30px 80px ${previewRelic.accent}33`,
              }}
            >
              <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 24, alignItems: "start" }}>
                <div style={{ borderRadius: 22, overflow: "hidden", background: "#0f172a", minHeight: 380 }}>
                  {previewRelic.type === "video" && previewRelic.videoPath ? (
                    <video
                      src={previewRelic.videoPath}
                      poster={previewRelic.previewPath}
                      controls
                      autoPlay
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  ) : previewRelic.imagePath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewRelic.imagePath}
                      alt={previewRelic.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  ) : (
                    <div style={{ minHeight: 380, display: "grid", placeItems: "center", color: "white", fontSize: 64 }}>🏛️</div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: previewRelic.accent, marginBottom: 6 }}>
                    {previewRelic.category === "archivo" ? "Archivo Desbloqueado" : "Reliquia Descubierta"}
                  </div>
                  <h3 className="font-display" style={{ fontSize: 30, fontWeight: 900, color: "#0f172a", marginBottom: 12 }}>
                    {previewRelic.title}
                  </h3>
                  <p style={{ fontSize: 16, lineHeight: 1.7, color: "#334155", marginBottom: 16 }}>
                    {previewRelic.description}
                  </p>
                  <div style={{ borderRadius: 18, padding: 16, background: `${previewRelic.accent}12`, border: `1px solid ${previewRelic.accent}33`, marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 4 }}>
                      Condición de desbloqueo
                    </div>
                    <div style={{ color: "#0f172a", fontWeight: 700 }}>{previewRelic.unlockHint}</div>
                  </div>
                  <button
                    onClick={handleCloseRelic}
                    style={{
                      border: "none",
                      borderRadius: 14,
                      padding: "12px 16px",
                      background: previewRelic.accent,
                      color: "white",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    Volver a la Bóveda
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {activeProfile && (
        <div style={{ marginBottom: 36 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "end",
              gap: 16,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h3 className="font-display" style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
                Tu Evolución
              </h3>
              <p style={{ color: "#64748b" }}>
                Revive cada forma desbloqueada de {activeProfile.name}. Las bloqueadas se revelan al subir de nivel.
              </p>
            </div>
            <div
              style={{
                borderRadius: 999,
                padding: "8px 14px",
                background: "linear-gradient(135deg, #dbeafe, #ede9fe)",
                color: "#1e3a8a",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              Forma actual: {getCurrentMilestone(activeProfile.id, level).badge}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
            {evolutionMilestones.map((milestone, index) => {
              const isUnlocked = level >= milestone.level;
              return (
                <motion.button
                  key={milestone.id}
                  type="button"
                  onClick={() => {
                    if (isUnlocked) handleReplayMilestone(milestone);
                  }}
                  whileHover={isUnlocked ? { y: -5, scale: 1.02 } : {}}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  style={{
                    border: `1px solid ${isUnlocked ? milestone.accentFrom + "55" : "#cbd5e1"}`,
                    borderRadius: 22,
                    overflow: "hidden",
                    background: "white",
                    cursor: isUnlocked ? "pointer" : "default",
                    padding: 0,
                    textAlign: "left",
                    boxShadow: "0 10px 28px rgba(15,23,42,0.08)",
                    filter: isUnlocked ? "none" : "grayscale(1)",
                    opacity: isUnlocked ? 1 : 0.7,
                  }}
                >
                  <div
                    style={{
                      height: 190,
                      position: "relative",
                      background: isUnlocked
                        ? `linear-gradient(180deg, ${milestone.accentFrom}22, transparent 60%)`
                        : "linear-gradient(180deg, #e2e8f0, #f8fafc)",
                    }}
                  >
                    {isUnlocked ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={milestone.image}
                        alt={milestone.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "radial-gradient(circle at 50% 35%, rgba(148,163,184,0.18), rgba(226,232,240,0.9))",
                          color: "#64748b",
                          fontSize: 54,
                        }}
                      >
                        ❔
                      </div>
                    )}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: isUnlocked ? "rgba(15,23,42,0.06)" : "rgba(15,23,42,0.45)",
                        color: "white",
                        fontSize: 15,
                        fontWeight: 800,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {isUnlocked ? "▶️ Reproducir" : `🔒 Nivel ${milestone.level}`}
                    </div>
                  </div>
                  <div style={{ padding: 14 }}>
                    <div style={{ fontSize: 11, color: "#64748b", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                      Nivel {milestone.level}
                    </div>
                    <div className="font-display" style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                      {milestone.badge}
                    </div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 6, lineHeight: 1.5 }}>
                      {isUnlocked ? milestone.title : "Sigue entrenando para revelar esta forma."}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

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

      <div style={{ marginTop: 60, borderTop: "2px dashed #cbd5e1", paddingTop: 40, paddingBottom: 60 }}>
        <h2 className="font-display" style={{ fontSize: 26, fontWeight: 700, marginBottom: 6, color: "#0f172a" }}>
           🏛️ Bóveda de Reliquias y Archivos
        </h2>
        <p style={{ color: "#64748b", marginBottom: 28, fontSize: "1.05rem", maxWidth: 700 }}>
          Aquí se guardan las ilustraciones exclusivas y videos cinematográficos que desbloqueas al dominar pruebas concretas. Tu primer archivo ya está conectado al Desafío de Virtudes.
        </p>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
            Reliquias Visuales
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
            {visualRelics.map((asset) => {
              const isUnlocked = activeProfile ? unlockedRelics.has(asset.id) : false;
              return (
                <motion.button
                  key={asset.id}
                  type="button"
                  onClick={() => {
                    if (isUnlocked) setPreviewRelic(asset);
                  }}
                  whileHover={isUnlocked ? { y: -5, scale: 1.01 } : {}}
                  style={{
                    background: "#1e293b",
                    borderRadius: 24,
                    overflow: "hidden",
                    position: "relative",
                    border: `2px solid ${isUnlocked ? asset.accent : "#334155"}`,
                    padding: 0,
                    textAlign: "left",
                    cursor: isUnlocked ? "pointer" : "default",
                    filter: isUnlocked ? "none" : "grayscale(1)",
                    opacity: isUnlocked ? 1 : 0.76,
                  }}
                >
                  <div style={{ height: 170, background: "linear-gradient(45deg, #334155, #0f172a)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    {isUnlocked && asset.previewPath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={asset.previewPath}
                        alt={asset.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span style={{ fontSize: 48, opacity: 0.45 }}>🖼️</span>
                    )}
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ background: "rgba(0,0,0,0.64)", padding: "10px 20px", borderRadius: 20, color: "white", fontWeight: 800, fontSize: 13, letterSpacing: 1 }}>
                        {isUnlocked ? "ABRIR RELIQUIA" : "BLOQUEADA"}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: 20 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>
                      RELIQUIA VISUAL
                    </div>
                    <div style={{ color: "white", fontWeight: 800, fontSize: 18 }}>{asset.title}</div>
                    <div style={{ color: "#cbd5e1", fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
                      {isUnlocked ? asset.description : `🔒 ${asset.unlockHint}`}
                    </div>
                    {!isUnlocked && asset.plannedFileName && (
                      <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 10 }}>
                        Archivo esperado: <strong>{asset.plannedFileName}</strong>
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
            Archivos de Video
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
            {videoArchives.map((asset) => {
            const isUnlocked = activeProfile ? unlockedRelics.has(asset.id) : false;
            return (
              <motion.button
                key={asset.id}
                type="button"
                onClick={() => {
                  if (isUnlocked) setPreviewRelic(asset);
                }}
                whileHover={isUnlocked ? { y: -5, scale: 1.01 } : {}}
                style={{
                  background: "#1e293b",
                  borderRadius: 24,
                  overflow: "hidden",
                  position: "relative",
                  border: `2px solid ${isUnlocked ? asset.accent : "#334155"}`,
                  padding: 0,
                  textAlign: "left",
                  cursor: isUnlocked ? "pointer" : "default",
                  filter: isUnlocked ? "none" : "grayscale(1)",
                  opacity: isUnlocked ? 1 : 0.76,
                }}
              >
                <div style={{ height: 170, background: "linear-gradient(45deg, #334155, #0f172a)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  {isUnlocked && asset.previewPath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.previewPath}
                      alt={asset.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span style={{ fontSize: 48, opacity: 0.45 }}>
                      {asset.type === "video" ? "🎬" : "🖼️"}
                    </span>
                  )}
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ background: "rgba(0,0,0,0.64)", padding: "10px 20px", borderRadius: 20, color: "white", fontWeight: 800, fontSize: 13, letterSpacing: 1 }}>
                      {isUnlocked ? "▶ ABRIR ARCHIVO" : "BLOQUEADO"}
                    </div>
                  </div>
                </div>
                <div style={{ padding: 20 }}>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>
                    {asset.category === "archivo" ? "ARCHIVO DE VIDEO" : "RELIQUIA VISUAL"}
                  </div>
                  <div style={{ color: "white", fontWeight: 800, fontSize: 18 }}>{asset.title}</div>
                  <div style={{ color: "#cbd5e1", fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
                    {isUnlocked ? asset.description : `🔒 ${asset.unlockHint}`}
                  </div>
                  {!isUnlocked && asset.plannedFileName && (
                    <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 10 }}>
                      Archivo esperado: <strong>{asset.plannedFileName}</strong>
                    </div>
                  )}
                </div>
                </motion.button>
            );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
