"use client";

import { useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { X } from "lucide-react";
import type { LevelMilestone } from "@/lib/level-milestones";

interface LevelMilestoneModalProps {
  milestone: LevelMilestone | null;
  nextMilestone?: LevelMilestone | null;
  open: boolean;
  onClose: () => void;
}

export function LevelMilestoneModal({
  milestone,
  nextMilestone,
  open,
  onClose,
}: LevelMilestoneModalProps) {
  useEffect(() => {
    if (!open || !milestone) return;

    const burst = () => {
      confetti({
        particleCount: 110,
        spread: 100,
        startVelocity: 35,
        origin: { y: 0.62 },
      });
    };

    burst();
    const secondBurst = window.setTimeout(burst, 250);
    return () => window.clearTimeout(secondBurst);
  }, [milestone, open]);

  if (!milestone) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 180, damping: 18 }}
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(920px, 100%)",
              borderRadius: 28,
              overflow: "hidden",
              background: `linear-gradient(155deg, ${milestone.accentFrom}18, rgba(255,255,255,0.98) 26%, rgba(255,255,255,0.98) 72%, ${milestone.accentTo}18)`,
              border: `1px solid ${milestone.accentFrom}50`,
              boxShadow: `0 30px 80px ${milestone.accentTo}40`,
              position: "relative",
            }}
          >
            <button
              onClick={onClose}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                zIndex: 3,
                border: "none",
                background: "rgba(15,23,42,0.08)",
                borderRadius: 999,
                width: 40,
                height: 40,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                color: "#0f172a",
              }}
            >
              <X size={18} />
            </button>

            <div
              style={{
                padding: 28,
                background: `radial-gradient(circle at top, ${milestone.accentFrom}26 0%, transparent 42%)`,
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  fontSize: 12,
                  letterSpacing: "0.24em",
                  fontWeight: 800,
                  color: milestone.accentTo,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Hito Desbloqueado
              </div>
              <h2
                className="font-display"
                style={{
                  textAlign: "center",
                  fontSize: "clamp(1.9rem, 4vw, 3rem)",
                  fontWeight: 900,
                  color: "#0f172a",
                  marginBottom: 24,
                }}
              >
                {milestone.title}
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(280px, 360px) 1fr",
                  gap: 28,
                  alignItems: "center",
                }}
              >
                <div style={{ position: "relative", minHeight: 420 }}>
                  <motion.div
                    animate={{ scale: [1, 1.08, 1], opacity: [0.45, 0.7, 0.45] }}
                    transition={{ duration: 3.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                    style={{
                      position: "absolute",
                      inset: "8% 10%",
                      borderRadius: "50%",
                      background: `radial-gradient(circle, ${milestone.accentFrom}80 0%, ${milestone.accentTo}45 42%, transparent 70%)`,
                      filter: "blur(18px)",
                    }}
                  />
                  {[0, 1].map((ring) => (
                    <motion.div
                      key={ring}
                      animate={{ rotate: ring === 0 ? 360 : -360 }}
                      transition={{ duration: ring === 0 ? 14 : 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      style={{
                        position: "absolute",
                        inset: `${30 + ring * 18}px`,
                        borderRadius: "50%",
                        border: `2px solid ${ring === 0 ? milestone.accentFrom : milestone.accentTo}55`,
                        borderStyle: ring === 0 ? "solid" : "dashed",
                      }}
                    />
                  ))}
                  <motion.div
                    initial={{ scale: 0.86, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.5 }}
                    style={{
                      position: "relative",
                      height: 420,
                      borderRadius: 26,
                      overflow: "hidden",
                      border: `2px solid ${milestone.accentFrom}55`,
                      background: "linear-gradient(180deg, rgba(255,255,255,0.16), rgba(15,23,42,0.04))",
                    }}
                  >
                    <Image
                      src={milestone.image}
                      alt={milestone.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 360px"
                      style={{ objectFit: "cover" }}
                      priority
                    />
                  </motion.div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div
                    style={{
                      alignSelf: "flex-start",
                      borderRadius: 999,
                      padding: "8px 14px",
                      background: `linear-gradient(135deg, ${milestone.accentFrom}, ${milestone.accentTo})`,
                      color: "white",
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {milestone.badge}
                  </div>

                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    style={{ fontSize: 18, lineHeight: 1.6, color: "#0f172a", fontWeight: 600 }}
                  >
                    {milestone.message}
                  </motion.p>

                  <motion.blockquote
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    style={{
                      margin: 0,
                      padding: "16px 18px",
                      borderLeft: `4px solid ${milestone.accentFrom}`,
                      borderRadius: 14,
                      background: `${milestone.accentFrom}10`,
                      color: "#334155",
                      fontStyle: "italic",
                      lineHeight: 1.6,
                    }}
                  >
                    {milestone.quote}
                  </motion.blockquote>

                  <div
                    style={{
                      borderRadius: 18,
                      border: "1px solid rgba(15,23,42,0.08)",
                      background: "rgba(248,250,252,0.95)",
                      padding: 18,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                      Próximo Despertar
                    </div>
                    <div style={{ color: "#0f172a", fontWeight: 700 }}>
                      {nextMilestone
                        ? `En nivel ${nextMilestone.level} desbloquearás ${nextMilestone.badge}.`
                        : "Has alcanzado la forma visual más alta de Elías."}
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    style={{
                      marginTop: 8,
                      border: "none",
                      borderRadius: 16,
                      padding: "14px 18px",
                      background: `linear-gradient(135deg, ${milestone.accentFrom}, ${milestone.accentTo})`,
                      color: "white",
                      fontWeight: 800,
                      fontSize: 15,
                      cursor: "pointer",
                    }}
                  >
                    Seguir Entrenando
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
