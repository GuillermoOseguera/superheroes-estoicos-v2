"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useProfile } from "@/lib/profile-store";
import { addGameXP, addVirtueXP } from "@/lib/supabase";
import { getRandomWorries, type Worry, type BoxColor } from "@/lib/data";

interface PlacedItems {
  [key: string]: BoxColor | null;
}

export default function DosCajasPage() {
  const router = useRouter();
  const { activeProfile, refreshProfile } = useProfile();
  
  const [items, setItems] = useState<Worry[]>([]);
  const [placedItems, setPlacedItems] = useState<PlacedItems>({});
  const [draggedItem, setDraggedItem] = useState<Worry | null>(null);
  
  // Game state
  const [showResult, setShowResult] = useState<{ message: string; isPerfect?: boolean } | null>(null);
  const [streak, setStreak] = useState(0);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Video Reward State
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoRevealed, setVideoRevealed] = useState(false);

  useEffect(() => {
    resetGame();
  }, []);

  const resetGame = () => {
    setItems(getRandomWorries(7));
    setPlacedItems({});
    setShowResult(null);
  };

  const handleDragStart = (worry: Worry) => setDraggedItem(worry);
  const handleDragEnd = () => setDraggedItem(null);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDrop = (box: BoxColor | null) => {
    if (draggedItem) {
      setPlacedItems((prev) => ({ ...prev, [draggedItem.id]: box }));
    }
    setDraggedItem(null);
  };

  const checkAnswers = async () => {
    const totalItems = items.length;
    const placedCount = Object.keys(placedItems).filter((k) => placedItems[k] !== null).length;

    if (placedCount < totalItems) {
      toast.error("¡Faltan situaciones por organizar!", { position: "top-center" });
      setShowResult({ message: "¡Debes colocar todas las situaciones en alguna caja primero!" });
      setStreak(0); // Reset streak if they try to cheat
      return;
    }

    let correctCount = 0;
    items.forEach((item) => {
      if (placedItems[item.id] === item.correctBox) correctCount++;
    });

    const isPerfect = correctCount === totalItems;
    
    if (isPerfect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      
      setShowResult({
        message: `¡Perfecto! Acertaste las ${totalItems} 🎉`,
        isPerfect: true,
      });
      
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });

      // If they reach 3 streaks, trigger video logic and don't immediately refresh game UI behind
      if (newStreak >= 3) {
        setTimeout(() => setShowVideoModal(true), 800);
      }

      // Add XP & Virtue points
      if (activeProfile && !isSubmitting) {
        setIsSubmitting(true);
        try {
          // Extra XP if feeling streak
          const bonusXp = newStreak > 1 ? 5 * newStreak : 0;
          const totalEarned = 15 + bonusXp; // base 15 for 7 correct + bonus
          
          await addGameXP(activeProfile.id, "dos_cajas", correctCount, totalEarned);
          await addVirtueXP(activeProfile.id, "temperance", 20); // 20 templanza
          
          setTotalXpEarned((prev) => prev + totalEarned);
          toast.success(`¡+${totalEarned} XP y +20 Templanza!`, {
            description: newStreak > 1 ? `¡Bono de racha x${newStreak} aplicado! 🔥` : '¡Sigue así, Héroe!',
            icon: "🌟",
          });
          refreshProfile();
        } catch (err) {
          toast.error("No se pudo guardar el XP.");
        } finally {
          setIsSubmitting(false);
        }
      }
    } else {
      setStreak(0);
      setShowResult({
        message: `Acertaste ${correctCount} de ${totalItems} 👍`,
        isPerfect: false,
      });
    }
  };

  const closeModal = () => {
    setShowVideoModal(false);
    setVideoRevealed(false);
    setStreak(0); // reset streak so they can earn it again
    resetGame();
  };

  const unplacedItems = items.filter((i) => !placedItems[i.id]);
  const greenBoxItems = items.filter((i) => placedItems[i.id] === "green");
  const redBoxItems = items.filter((i) => placedItems[i.id] === "red");

  return (
    <div style={{ minHeight: "100vh", padding: "20px 0" }}>
      
      {/* ── Background Patterns matching Premium Aesthetics ── */}
      <style>{`
        .dos-cajas-box { transition: all 0.3s ease; }
        .dos-cajas-box.drag-over { transform: scale(1.02); filter: brightness(1.1); box-shadow: 0 0 20px rgba(0,0,0,0.1); }
      `}</style>

      {/* ── Header ── */}
      <div className="main-header" style={{ marginLeft: -24, marginRight: -24, marginTop: -44, marginBottom: 24, padding: "16px 24px", display: "flex", gap: 16, alignItems: "center" }}>
        <button
          onClick={() => router.push("/juegos")}
          className="text-slate-400 hover:text-white transition"
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <ArrowLeft />
        </button>
        <div>
          <div className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>
            ACADEMIA ESTOICA GOPLEMMINGS
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>Las Dos Cajas</div>
        </div>
      </div>

      <div className="parchment-card" style={{ maxWidth: 1000, margin: "0 auto", padding: "32px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 className="font-display" style={{ fontSize: 32, fontWeight: 800, color: "#1e293b", marginBottom: 8 }}>
            La Regla de las Dos Cajas ⚡
          </h2>
          <p style={{ color: "#475569", fontSize: 16, maxWidth: 600, margin: "0 auto" }}>
            El Maestro Epicteto nos enseñó que hay cosas que podemos controlar y cosas que no.
            <strong> Nuestro poder reside solo en la primera.</strong>
          </p>
        </div>

        {/* ── Stats & Streak Banner ── */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16, marginBottom: 32 }}>
          {/* Streak indicator */}
          <div style={{ 
            background: streak > 0 ? "linear-gradient(135deg, #fef3c7, #fde68a)" : "#f1f5f9", 
            border: streak > 0 ? "1px solid #fcd34d" : "1px solid #e2e8f0",
            padding: "8px 20px", 
            borderRadius: 20, 
            display: "flex", 
            alignItems: "center", 
            gap: 8,
            boxShadow: streak > 0 ? "0 4px 12px rgba(251, 191, 36, 0.2)" : "none"
          }}>
            <span style={{ fontSize: 18 }}>🔥</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: streak > 0 ? "#b45309" : "#64748b" }}>RACHA PERFECTA</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: streak > 0 ? "#92400e" : "#475569" }}>
                {streak} rondas
              </div>
            </div>
            {streak > 0 && streak < 3 && (
              <div style={{ fontSize: 12, color: "#b45309", background: "white", padding: "2px 8px", borderRadius: 10, marginLeft: 8 }}>
                ¡Faltan {3 - streak} para sorpresa!
              </div>
            )}
          </div>

          {/* XP Earned (Session) */}
          {totalXpEarned > 0 && (
            <div style={{ 
              background: "linear-gradient(135deg, #10b981, #059669)", 
              padding: "8px 20px", 
              borderRadius: 20, 
              display: "flex", 
              alignItems: "center", 
              gap: 8,
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)"
            }}>
              <span style={{ fontSize: 18 }}>🌟</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#d1fae5" }}>SESIÓN ACTUAL</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "white" }}>+{totalXpEarned} XP</div>
              </div>
            </div>
          )}
        </div>

        {/* ── Drag & Drop Area ── */}
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
          
          {/* Source Pool */}
          <div
            style={{ 
              flex: "1 1 300px", 
              background: "#f8fafc", 
              borderRadius: 20, 
              padding: 20, 
              border: "2px dashed #cbd5e1",
              minHeight: 450
            }}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(null)}
          >
            <h3 style={{ textAlign: "center", fontWeight: 700, color: "#475569", fontSize: 14, marginBottom: 16 }}>
              👇 Arrastra las situaciones ({unplacedItems.length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <AnimatePresence>
                {unplacedItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layoutId={item.id}
                    draggable
                    onDragStart={() => handleDragStart(item)}
                    onDragEnd={handleDragEnd}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    style={{
                      background: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                      padding: "14px 16px",
                      cursor: "grab",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#334155",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      position: "relative"
                    }}
                    whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", borderColor: "#94a3b8" }}
                    whileTap={{ scale: 0.98, cursor: "grabbing" }}
                  >
                    <span style={{ fontSize: 16, opacity: 0.5 }}>☷</span> {item.text}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Droppable Boxes */}
          <div style={{ flex: "2 1 500px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Green Box */}
            <div
              className={`dos-cajas-box`}
              style={{ 
                borderRadius: 20, 
                border: "4px solid #22c55e", 
                background: "linear-gradient(180deg, rgba(34,197,94,0.05) 0%, rgba(34,197,94,0.15) 100%)", 
                display: "flex", 
                flexDirection: "column", 
                overflow: "hidden",
                boxShadow: "0 8px 24px rgba(34,197,94,0.15)",
                minHeight: 450
              }}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop("green")}
            >
              <div style={{ background: "#22c55e", padding: "16px", textAlign: "center", color: "white" }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>✅</div>
                <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: 0.5 }}>PUEDO CONTROLARLO</div>
              </div>
              <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <AnimatePresence>
                  {greenBoxItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layoutId={item.id}
                      draggable
                      onDragStart={() => handleDragStart(item)}
                      onDragEnd={handleDragEnd}
                      style={{
                        background: showResult?.isPerfect ? "#dcfce7" : "white",
                        border: `2px solid ${showResult ? (item.correctBox === "green" ? "#22c55e" : "#ef4444") : "#86efac"}`,
                        borderRadius: 12,
                        padding: "12px 14px",
                        cursor: "grab",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#166534",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                      }}
                    >
                      <span>{item.text}</span>
                      {showResult && !showResult.isPerfect && (
                        <span style={{ fontSize: 16 }}>{item.correctBox === "green" ? "✅" : "❌"}</span>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Red Box */}
            <div
              className={`dos-cajas-box`}
              style={{ 
                borderRadius: 20, 
                border: "4px solid #ef4444", 
                background: "linear-gradient(180deg, rgba(239,68,68,0.05) 0%, rgba(239,68,68,0.15) 100%)", 
                display: "flex", 
                flexDirection: "column", 
                overflow: "hidden",
                boxShadow: "0 8px 24px rgba(239,68,68,0.15)",
                minHeight: 450
              }}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop("red")}
            >
              <div style={{ background: "#ef4444", padding: "16px", textAlign: "center", color: "white" }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>❌</div>
                <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: 0.5 }}>NO PUEDO CONTROLARLO</div>
                <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>(Déjalo ir)</div>
              </div>
              <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <AnimatePresence>
                  {redBoxItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layoutId={item.id}
                      draggable
                      onDragStart={() => handleDragStart(item)}
                      onDragEnd={handleDragEnd}
                      style={{
                        background: showResult?.isPerfect ? "#fee2e2" : "white",
                        border: `2px solid ${showResult ? (item.correctBox === "red" ? "#22c55e" : "#ef4444") : "#fca5a5"}`,
                        borderRadius: 12,
                        padding: "12px 14px",
                        cursor: "grab",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#991b1b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                      }}
                    >
                      <span>{item.text}</span>
                      {showResult && !showResult.isPerfect && (
                        <span style={{ fontSize: 16 }}>{item.correctBox === "red" ? "✅" : "❌"}</span>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* ── Controls & Result ── */}
        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: showResult.isPerfect ? "linear-gradient(135deg, #dcfce7, #bbf7d0)" : "linear-gradient(135deg, #fee2e2, #fecaca)",
                  color: showResult.isPerfect ? "#166534" : "#991b1b",
                  border: showResult.isPerfect ? "2px solid #86efac" : "2px solid #fca5a5",
                  borderRadius: 16,
                  padding: "16px 32px",
                  fontWeight: 800,
                  fontSize: 18,
                  textAlign: "center",
                  maxWidth: 500,
                  width: "100%",
                }}
              >
                {showResult.message}
              </motion.div>
            )}
          </AnimatePresence>
          
          <div style={{ display: "flex", gap: 16, width: "100%", maxWidth: 500 }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={resetGame}
              style={{
                background: "white",
                border: "2px solid #e2e8f0",
                borderRadius: 14,
                padding: "16px",
                fontWeight: 700,
                fontSize: 16,
                cursor: "pointer",
                color: "#475569",
                flex: 1,
              }}
            >
              🔄 Reiniciar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={checkAnswers}
              disabled={isSubmitting}
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                border: "none",
                borderRadius: 14,
                padding: "16px",
                fontWeight: 700,
                fontSize: 16,
                cursor: "pointer",
                color: "white",
                flex: 2,
                opacity: isSubmitting ? 0.7 : 1,
                boxShadow: "0 8px 20px rgba(16, 185, 129, 0.3)"
              }}
            >
              {isSubmitting ? "⏱️ Procesando..." : "✅ Evaluar Cajas"}
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Video Reward Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showVideoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ 
              position: "fixed", inset: 0, zIndex: 1000, 
              display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
              background: "rgba(15, 23, 42, 0.9)", backdropFilter: "blur(10px)" 
            }}
            onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              style={{ 
                background: "linear-gradient(135deg, #1e1b4b, #312e81, #1e1b4b)",
                maxWidth: 640, width: "100%", borderRadius: 28, overflow: "hidden", position: "relative",
                border: "1px solid #4338ca", boxShadow: "0 20px 60px rgba(0,0,0,0.5)"
              }}
            >
              <button
                onClick={closeModal}
                style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.1)", border: "none", color: "white", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", zIndex: 10, fontSize: 18 }}
              >✕</button>

              <AnimatePresence mode="wait">
                {!videoRevealed ? (
                  <motion.div key="msg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{ padding: "48px 32px", textAlign: "center" }}>
                    <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }} style={{ fontSize: 72, marginBottom: 16 }}>
                      🏆
                    </motion.div>
                    <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12, background: "linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      ¡Increíble, Héroe! 🎉
                    </h2>
                    <p style={{ color: "#e0e7ff", fontSize: 18, marginBottom: 8, lineHeight: 1.5 }}>
                      Has logrado <strong style={{ color: "#fcd34d" }}>3 rondas perfectas seguidas</strong>.
                    </p>
                    <p style={{ color: "#a5b4fc", fontSize: 16, marginBottom: 32 }}>
                      Eso demuestra que dominas la verdadera esencia estoica. Tienes tu mente bajo control y por eso has desbloqueado una sorpresa única.
                    </p>
                    <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 36 }}>
                      {[...Array(5)].map((_, i) => (
                        <motion.span key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} style={{ fontSize: 24 }}>⭐</motion.span>
                      ))}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setVideoRevealed(true)}
                      style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "none", borderRadius: 16, padding: "16px 40px", fontWeight: 800, fontSize: 18, color: "#451a03", cursor: "pointer", boxShadow: "0 8px 30px rgba(245,158,11,0.4)" }}
                    >
                      🎁 ¡Ver mi Premio Sorpresa!
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div key="vid" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ padding: 24 }}>
                    <div style={{ textAlign: "center", marginBottom: 16 }}>
                      <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, background: "linear-gradient(90deg, #fbbf24, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        🎬 Un Mensaje del Entrenador
                      </h3>
                    </div>
                    <div style={{ borderRadius: 16, overflow: "hidden", border: "2px solid #b45309", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
                      <video controls autoPlay style={{ width: "100%", display: "block", maxHeight: "60vh" }}>
                        <source src="https://raw.githubusercontent.com/GuillermoOseguera/Estoico/main/videoelias.mp4" type="video/mp4" />
                        Tu navegador no soporta el video.
                      </video>
                    </div>
                    <div style={{ marginTop: 20, textAlign: "center" }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={closeModal}
                        style={{ background: "#4f46e5", border: "none", borderRadius: 16, padding: "14px 32px", fontWeight: 700, fontSize: 16, color: "white", cursor: "pointer" }}
                      >
                        ⚔️ ¡Seguir Entrenando!
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
