"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Heart, Swords, Shield, Zap, RotateCcw } from "lucide-react";
import { getRandomVirtueChallenge, type VirtueChallenge, type Virtue } from "@/lib/data-virtues";
import { useProfile } from "@/lib/profile-store";
import { addGameXP, addVirtueXP } from "@/lib/supabase";
import { triggerAchievementAnimation } from "@/lib/confetti";
import confetti from "canvas-confetti";

const VIRTUE_ASSETS: Record<Virtue, { src: string; bgColor: string; borderColor: string; textColor: string; label: string; icon: string }> = {
  sabiduria: {
    src: "/Sabiduria.png",
    bgColor: "from-yellow-400 to-amber-500",
    borderColor: "border-yellow-500",
    textColor: "text-amber-900",
    label: "Sabiduría",
    icon: "🦉"
  },
  coraje: {
    src: "/Coraje.png",
    bgColor: "from-red-400 to-rose-600",
    borderColor: "border-red-500",
    textColor: "text-red-900",
    label: "Coraje",
    icon: "🦁"
  },
  justicia: {
    src: "/Justicia.png",
    bgColor: "from-blue-400 to-indigo-600",
    borderColor: "border-blue-500",
    textColor: "text-blue-900",
    label: "Justicia",
    icon: "⚖️"
  },
  templanza: {
    src: "/Templanza.png",
    bgColor: "from-green-400 to-emerald-600",
    borderColor: "border-green-500",
    textColor: "text-green-900",
    label: "Templanza",
    icon: "🧘"
  }
};

const BOSSES = [
  { id: "pereza", name: "La Pereza", icon: "🥱", maxHp: 3, shadowColor: "rgba(100,116,139,0.8)" },
  { id: "miedo", name: "El Miedo", icon: "👻", maxHp: 4, shadowColor: "rgba(226,232,240,0.8)" },
  { id: "ira", name: "La Ira", icon: "😡", maxHp: 5, shadowColor: "rgba(220,38,38,0.8)" },
  { id: "ansiedad", name: "Ansiedad", icon: "🌪️", maxHp: 6, shadowColor: "rgba(147,51,234,0.8)" },
  { id: "sombra", name: "Caos Interior", icon: "👿", maxHp: 7, shadowColor: "rgba(17,24,39,0.9)" },
];

export function DesafioVirtudes() {
  const router = useRouter();
  const { activeProfile, refreshProfile } = useProfile();

  // Battle State
  const [currentBossIndex, setCurrentBossIndex] = useState(0);
  const currentBoss = BOSSES[currentBossIndex];
  
  const [challenge, setChallenge] = useState<VirtueChallenge | null>(null);
  const [bossHp, setBossHp] = useState(BOSSES[0].maxHp);
  const [playerHp, setPlayerHp] = useState(3);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string; virtueUsed?: Virtue } | null>(null);
  
  // Animations
  const [playerAnim, setPlayerAnim] = useState<"idle" | "attack" | "hurt" | "win">("idle");
  const [bossAnim, setBossAnim] = useState<"idle" | "attack" | "hurt" | "dead">("idle");
  const [isProcessing, setIsProcessing] = useState(false);
  const [gameOver, setGameOver] = useState<"victory" | "defeat" | null>(null);

  // Stats
  const [xpEarnedSession, setXpEarnedSession] = useState(0);

  useEffect(() => {
    loadNewChallenge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadNewChallenge = () => {
    setChallenge(getRandomVirtueChallenge());
    setFeedback(null);
  };

  const handleVirtueSelect = async (selectedVirtue: Virtue) => {
    if (isProcessing || gameOver || !challenge || !activeProfile) return;
    setIsProcessing(true);

    const isCorrect = selectedVirtue === challenge.correctVirtue;
    
    // Animar ataque del jugador
    setPlayerAnim("attack");
    
    setTimeout(async () => {
      if (isCorrect) {
        // Player hits boss
        setBossHp((prev) => Math.max(0, prev - 1));
        setBossAnim("hurt");
        const isDead = bossHp - 1 <= 0;
        
        setFeedback({
          isCorrect: true,
          message: challenge.feedback,
          virtueUsed: selectedVirtue
        });

        // XP Reward per hit
        try {
          await addGameXP(activeProfile.id, "desafio_virtudes", 1, 20);
          
          const virtueMap: Record<Virtue, "wisdom" | "courage" | "justice" | "temperance"> = {
            sabiduria: "wisdom", coraje: "courage", justicia: "justice", templanza: "temperance"
          };
          await addVirtueXP(activeProfile.id, virtueMap[selectedVirtue], 10);
          
          setXpEarnedSession(prev => prev + 20);
          refreshProfile();
        } catch (err) {
          console.error(err);
        }

        setTimeout(() => {
          if (isDead) {
            handleVictory();
          } else {
            setPlayerAnim("idle");
            setBossAnim("idle");
            setIsProcessing(false);
          }
        }, 1500);

      } else {
        // Boss hits player
        setBossAnim("attack");
        setTimeout(() => setPlayerAnim("hurt"), 200);
        setPlayerHp((prev) => Math.max(0, prev - 1));
        const isDefeated = playerHp - 1 <= 0;

        setFeedback({
          isCorrect: false,
          message: `El escudo de ${VIRTUE_ASSETS[selectedVirtue].label} falló... Necesitabas la ${VIRTUE_ASSETS[challenge.correctVirtue].label}.`,
          virtueUsed: selectedVirtue
        });

        setTimeout(() => {
          if (isDefeated) {
            handleDefeat();
          } else {
            setPlayerAnim("idle");
            setBossAnim("idle");
            setIsProcessing(false);
          }
        }, 1500);
      }
    }, 400); // 400ms into player attack animation
  };

  const handleVictory = () => {
    setBossAnim("dead");
    setPlayerAnim("win");
    setGameOver("victory");
    triggerAchievementAnimation();
    
    // Extra boss kill xp
    if (activeProfile) {
      addGameXP(activeProfile.id, "desafio_virtudes", 1, 50).then(() => {
        setXpEarnedSession(prev => prev + 50);
        refreshProfile();
      });
    }

    setTimeout(() => {
      confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 } });
    }, 500);
  };

  const handleDefeat = () => {
    setPlayerAnim("hurt");
    setGameOver("defeat");
  };

  const nextBattle = () => {
    const nextIndex = (currentBossIndex + 1) % BOSSES.length;
    setCurrentBossIndex(nextIndex);
    setBossHp(BOSSES[nextIndex].maxHp);
    setPlayerHp(3);
    setGameOver(null);
    setPlayerAnim("idle");
    setBossAnim("idle");
    setIsProcessing(false);
    loadNewChallenge();
  };

  const retryBattle = () => {
    setBossHp(currentBoss.maxHp);
    setPlayerHp(3);
    setGameOver(null);
    setPlayerAnim("idle");
    setBossAnim("idle");
    setIsProcessing(false);
    loadNewChallenge();
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      
      {/* ── Visual Styles & Keyframes ── */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shadowFloat {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(0.85); opacity: 0.15; }
        }
        @keyframes damageShake {
          0%, 100% { transform: translateX(0); filter: brightness(1) sepia(0) hue-rotate(0) saturate(1); }
          20% { transform: translateX(-15px) rotate(-5deg); filter: brightness(0.5) sepia(1) hue-rotate(-50deg) saturate(5); }
          40% { transform: translateX(10px) rotate(5deg); }
          60% { transform: translateX(-10px) rotate(-5deg); filter: brightness(0.5) sepia(1) hue-rotate(-50deg) saturate(5); }
          80% { transform: translateX(5px) rotate(2deg); }
        }
        @keyframes attackDash {
          0% { transform: translateX(0) scale(1); }
          30% { transform: translateX(-20px) scale(0.9); }
          50% { transform: translateX(80px) scale(1.1); filter: drop-shadow(0 0 10px rgba(59,130,246,0.8)); }
          100% { transform: translateX(0) scale(1); }
        }
        @keyframes bossAttackDash {
          0% { transform: translateX(0) scale(1); filter: drop-shadow(0 0 20px rgba(220,38,38,0)); }
          40% { transform: translateX(30px) scale(1.1); filter: drop-shadow(0 0 20px rgba(220,38,38,0.8)); }
          60% { transform: translateX(-60px) scale(1.2); }
          100% { transform: translateX(0) scale(1); }
        }
        @keyframes winPulse {
          0%, 100% { filter: drop-shadow(0 0 15px rgba(251,191,36,0.4)); transform: scale(1); }
          50% { filter: drop-shadow(0 0 30px rgba(251,191,36,0.8)); transform: scale(1.05); }
        }

        .anim-idle { animation: float 3s ease-in-out infinite; }
        .anim-shadow { animation: shadowFloat 3s ease-in-out infinite; }
        .anim-hurt { animation: damageShake 0.5s ease-in-out; }
        .anim-attack { animation: attackDash 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); z-index: 50; }
        .anim-boss-attack { animation: bossAttackDash 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275); z-index: 50; }
        .anim-win { animation: winPulse 2s ease-in-out infinite; filter: drop-shadow(0 0 15px rgba(251,191,36,0.6)); }
        
        .rpg-button { transition: all 0.2s; }
        .rpg-button:hover { transform: translateY(-4px) scale(1.02); filter: brightness(1.1); }
        .rpg-button:active { transform: translateY(0) scale(0.98); filter: brightness(0.9); }
      `}</style>

      {/* ── Intro Header ── */}
      <h2 className="font-display" style={{ fontSize: 32, fontWeight: 800, color: "#1e293b", textAlign: "center", marginBottom: 8 }}>
        El Desafío de las 4 Virtudes ⚔️
      </h2>
      <p style={{ textAlign: "center", color: "#64748b", fontSize: 16, maxWidth: 600, margin: "0 auto 24px" }}>
        ¡Las Sombras Oscuras (emociones descontroladas) intentan dominar tu mente! Defiéndete eligiendo la virtud (arma) correcta para cada ataque.
      </p>

      {/* ── Battle Arena ── */}
      <div 
        style={{ 
          background: "url('/images/dojo_bg.avif') center/cover no-repeat, linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)",
          backgroundBlendMode: "overlay",
          borderRadius: 24,
          boxShadow: "0 24px 50px rgba(0,0,0,0.3), inset 0 0 0 4px rgba(255,255,255,0.05)",
          padding: "24px",
          position: "relative",
          overflow: "hidden",
          minHeight: 500,
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* Battle Stats HUD */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          {/* Player HP */}
          <div style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", padding: "12px 20px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>ELÍAS (TÚ)</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[...Array(3)].map((_, i) => (
                <Heart key={i} size={24} fill={i < playerHp ? "#ef4444" : "rgba(255,255,255,0.1)"} color={i < playerHp ? "#ef4444" : "rgba(255,255,255,0.2)"} />
              ))}
            </div>
            {xpEarnedSession > 0 && <div style={{ color: "#fbbf24", fontSize: 12, fontWeight: 700, marginTop: 4 }}>+ {xpEarnedSession} XP</div>}
          </div>

          {/* VS Badge */}
          <div style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)", color: "white", padding: "8px 16px", borderRadius: 20, fontWeight: 900, fontSize: 18, border: "2px solid #fff", boxShadow: "0 0 20px rgba(245,158,11,0.5)" }}>
            VS
          </div>

          {/* Boss HP */}
          <div style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", padding: "12px 20px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", textAlign: "right" }}>
            <div style={{ color: "#fca5a5", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
              {currentBoss.name.toUpperCase()}
            </div>
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap", maxWidth: 120 }}>
              {[...Array(currentBoss.maxHp)].map((_, i) => (
                <Heart key={i} size={i < bossHp ? 18 : 18} fill={i < bossHp ? "#991b1b" : "rgba(255,255,255,0.1)"} color={i < bossHp ? "#991b1b" : "rgba(255,255,255,0.2)"} />
              ))}
            </div>
          </div>
        </div>

        {/* Characters Arena */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flex: 1, padding: "0 20px 40px" }}>
          
          {/* Player Sprite */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
            <div className={`anim-${playerAnim}`} style={{ position: "relative", width: 140, height: 140, zIndex: 10 }}>
              <Image src="/images/avatars/elias_base.png" alt="Hero" fill style={{ objectFit: "contain", filter: "drop-shadow(0 10px 10px rgba(0,0,0,0.5))" }} />
              
              {/* Shield effect when correct */}
              <AnimatePresence>
                {feedback?.isCorrect && bossAnim === "hurt" && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0, 1, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    style={{ position: "absolute", inset: -30, background: "radial-gradient(circle, rgba(59,130,246,0.6) 0%, transparent 60%)", borderRadius: "50%", zIndex: -1 }}
                  />
                )}
              </AnimatePresence>
            </div>
            <div className="anim-shadow" style={{ width: 80, height: 16, background: "rgba(0,0,0,0.5)", borderRadius: "50%", filter: "blur(4px)", marginTop: -10 }} />
          </div>

          {/* Boss Sprite */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
            <div className={bossAnim === "attack" ? "anim-boss-attack" : bossAnim === "dead" ? "" : `anim-${bossAnim === "hurt" ? "hurt" : "idle"}`} style={{ position: "relative", width: 160, height: 160, zIndex: 10 }}>
              <motion.div
                animate={bossAnim === "dead" ? { scale: 0, opacity: 0, rotate: 180 } : {}}
                transition={{ duration: 0.6 }}
                style={{ width: "100%", height: "100%", position: "relative" }}
              >
                {/* Fallback geometric monster if image fails */}
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 100, filter: `drop-shadow(0 0 20px ${currentBoss.shadowColor})` }}>
                  {currentBoss.icon}
                </div>
              </motion.div>
            </div>
            {bossAnim !== "dead" && (
              <div className="anim-shadow" style={{ width: 100, height: 20, background: "rgba(0,0,0,0.6)", borderRadius: "50%", filter: "blur(6px)", marginTop: -15 }} />
            )}
          </div>

        </div>

        {/* ── Dialog / Action UI ── */}
        <div style={{ background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(12px)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", padding: 24, minHeight: 180, position: "relative", zIndex: 20 }}>
          
          <AnimatePresence mode="wait">
            {gameOver === "victory" ? (
              <motion.div key="victory" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
                <h3 style={{ color: "#fbbf24", fontSize: 24, fontWeight: 800, marginBottom: 8 }}>¡Sombra Derrotada!</h3>
                <p style={{ color: "#cbd5e1", marginBottom: 20 }}>Has purificado tus emociones usando la filosofía estoica.</p>
                <button
                  onClick={nextBattle}
                  className="rpg-button"
                  style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "none", borderRadius: 16, padding: "12px 32px", color: "white", fontWeight: 800, fontSize: 16, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 8px 20px rgba(245, 158, 11, 0.4)" }}
                >
                  <Swords size={20} /> Peleas contra más Sombras
                </button>
              </motion.div>
            ) : gameOver === "defeat" ? (
              <motion.div key="defeat" initial={{ opacity: 0, filter: "grayscale(1)" }} animate={{ opacity: 1, filter: "grayscale(0)" }} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>💔</div>
                <h3 style={{ color: "#f87171", fontSize: 24, fontWeight: 800, marginBottom: 8 }}>¡La Ansiedad te Venció!</h3>
                <p style={{ color: "#94a3b8", marginBottom: 20 }}>Perdiste el control por esta vez, pero un estoico siempre se levanta.</p>
                <button
                  onClick={retryBattle}
                  className="rpg-button"
                  style={{ background: "#475569", border: "1px solid #64748b", borderRadius: 16, padding: "12px 32px", color: "white", fontWeight: 800, fontSize: 16, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}
                >
                  <RotateCcw size={20} /> Volver a Intentarlo
                </button>
              </motion.div>
            ) : feedback ? (
              <motion.div key="feedback" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
                <div style={{ color: feedback.isCorrect ? "#4ade80" : "#f87171", fontSize: 18, fontWeight: 800, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {feedback.isCorrect ? <Shield size={24} /> : <Zap size={24} />}
                  {feedback.isCorrect ? "¡Defensa Exitosa!" : "¡Defensa Rota!"}
                </div>
                <p style={{ color: "white", fontSize: 15, lineHeight: 1.5, maxWidth: 600, margin: "0 auto 20px" }}>
                  {feedback.message}
                </p>
                <button
                  onClick={loadNewChallenge}
                  className="rpg-button"
                  style={{ background: feedback.isCorrect ? "#3b82f6" : "#ef4444", border: "none", borderRadius: 12, padding: "12px 24px", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "opacity 0.3s", margin: "0 auto" }}
                >
                  Siguiente Ataque ➡️
                </button>
              </motion.div>
            ) : (
              <motion.div key="action" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* El Ataque (Escenario) */}
                <div style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1, display: "flex", alignItems: "center", gap: 8 }}>
                  <Zap size={16} color="#ef4444" /> LA SOMBRA ATACA:
                </div>
                <p style={{ color: "white", fontSize: 16, fontWeight: 500, lineHeight: 1.5, marginBottom: 20 }}>
                  &quot;{challenge?.scenario}&quot;
                </p>
                
                {/* Botones de Defensa */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  {(Object.keys(VIRTUE_ASSETS) as Virtue[]).map((virtue) => {
                    const v = VIRTUE_ASSETS[virtue];
                    return (
                      <button
                        key={virtue}
                        onClick={() => handleVirtueSelect(virtue)}
                        disabled={isProcessing}
                        className="rpg-button"
                        style={{
                          background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                          border: "none",
                          borderTop: "1px solid rgba(255,255,255,0.4)",
                          borderRadius: 12,
                          padding: "12px 8px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 6,
                          cursor: isProcessing ? "not-allowed" : "pointer",
                          opacity: isProcessing ? 0.7 : 1,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                        }}
                      >
                        <div className={`bg-gradient-to-br ${v.bgColor}`} style={{ width: "100%", height: "100%", position: "absolute", inset: 0, borderRadius: 12, zIndex: -1 }} />
                        <span style={{ fontSize: 24, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}>{v.icon}</span>
                        <span style={{ color: "white", fontWeight: 800, fontSize: 12, textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
                          {v.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
