"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import Link from "next/link";
import { toast } from "sonner";
import { useProfile } from "@/lib/profile-store";
import { addGameXP, addVirtueXP } from "@/lib/supabase";
import { getRandomWorries, type Worry, type BoxColor } from "@/lib/data";

interface PlacedItems {
  [key: string]: BoxColor | null;
}

export default function DosCajasPage() {
  const { activeProfile, refreshProfile } = useProfile();
  const [items, setItems] = useState<Worry[]>([]);
  const [placedItems, setPlacedItems] = useState<PlacedItems>({});
  const [draggedItem, setDraggedItem] = useState<Worry | null>(null);
  const [showResult, setShowResult] = useState<{ message: string; isPerfect?: boolean } | null>(null);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
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
      setShowResult({ message: "¡Debes colocar todas las situaciones en alguna caja!" });
      return;
    }

    let correctCount = 0;
    items.forEach((item) => {
      if (placedItems[item.id] === item.correctBox) correctCount++;
    });

    const isPerfect = correctCount === totalItems;
    setShowResult({
      message: isPerfect
        ? `¡Perfecto! Acertaste ${totalItems} de ${totalItems} 🎉`
        : `Acertaste ${correctCount} de ${totalItems} 👍`,
      isPerfect,
    });

    if (isPerfect) {
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });

      if (activeProfile && !isSubmitting) {
        setIsSubmitting(true);
        try {
          const { newTotalXp } = await addGameXP(
            activeProfile.id,
            "dos_cajas",
            correctCount,
            10
          );
          await addVirtueXP(activeProfile.id, "temperance", 15);
          
          setTotalXpEarned((prev) => prev + 10);
          toast.success("¡+10 XP ganados y +15 Templanza!", {
            description: `Total de XP: ${newTotalXp}. ¡Sigue así, Héroe!`,
            icon: "🌟",
          });
          refreshProfile();
        } catch {
          toast.error("No se pudo guardar el XP. Verifica la conexión.");
        } finally {
          setIsSubmitting(false);
        }
      }
    }
  };

  const unplacedItems = items.filter((i) => !placedItems[i.id]);
  const greenBoxItems = items.filter((i) => placedItems[i.id] === "green");
  const redBoxItems = items.filter((i) => placedItems[i.id] === "red");

  return (
    <div>
      {/* Header */}
      <div className="main-header" style={{ marginLeft: -24, marginRight: -24, marginTop: -24, marginBottom: 24, padding: "16px 24px" }}>
        <div className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>
          ACADEMIA ESTOICA GOPLEMMINGS
        </div>
        <div style={{ fontSize: 13, color: "#94a3b8" }}>Sala de Entrenamiento</div>
      </div>

      {/* Back */}
      <Link href="/juegos" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 13, marginBottom: 20 }}>
        ← Volver a los Juegos
      </Link>

      <div className="parchment-card">
        <h2
          className="font-display"
          style={{ fontSize: 24, fontWeight: 700, color: "#1e2563", textAlign: "center", marginBottom: 6 }}
        >
          Las Dos Cajas ⚡
        </h2>
        <p style={{ textAlign: "center", color: "#64748b", marginBottom: 8 }}>
          Arrastra cada situación a la caja correcta.
        </p>
        <p style={{ textAlign: "center", fontWeight: 600, color: "#1e293b", marginBottom: 20 }}>
          La regla de oro: ¡Solo enfócate en la <span style={{ color: "#22c55e" }}>caja verde</span>! Lo de la roja, déjalo ir.
        </p>

        {/* XP counter */}
        {totalXpEarned > 0 && (
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <span
              style={{
                background: "linear-gradient(135deg, #d4a017, #f0c840)",
                color: "#1e293b",
                borderRadius: 20,
                padding: "4px 16px",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              🌟 +{totalXpEarned} XP ganados esta sesión
            </span>
          </div>
        )}

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {/* Pool */}
          <div
            style={{ flex: "1 1 220px", background: "#f8fafc", borderRadius: 16, padding: 16, border: "1px solid #e2e8f0" }}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(null)}
          >
            <h3 style={{ textAlign: "center", fontWeight: 600, color: "#64748b", fontSize: 14, marginBottom: 12 }}>
              Arrastra estas {unplacedItems.length} situaciones 👇
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 360 }}>
              <AnimatePresence>
                {unplacedItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layoutId={item.id}
                    draggable
                    onDragStart={() => handleDragStart(item)}
                    onDragEnd={handleDragEnd}
                    style={{
                      background: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: 10,
                      padding: "10px 14px",
                      cursor: "grab",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#374151",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    }}
                  >
                    {item.text}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Boxes */}
          <div style={{ flex: "2 1 400px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Green Box */}
            <div
              style={{ borderRadius: 16, border: "4px dashed #22c55e", background: "rgba(34,197,94,0.04)", display: "flex", flexDirection: "column", overflow: "hidden" }}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop("green")}
            >
              <div style={{ background: "#22c55e", padding: "12px", textAlign: "center", fontWeight: 700, color: "white", fontSize: 13 }}>
                ✅ PUEDO CONTROLARLO
              </div>
              <div style={{ flex: 1, padding: 12, display: "flex", flexDirection: "column", gap: 8, minHeight: 300 }}>
                <AnimatePresence>
                  {greenBoxItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layoutId={item.id}
                      draggable
                      onDragStart={() => handleDragStart(item)}
                      onDragEnd={handleDragEnd}
                      style={{
                        background: showResult?.isPerfect ? "rgba(34,197,94,0.1)" : "white",
                        border: `2px solid ${showResult ? (item.correctBox === "green" ? "#22c55e" : "#ef4444") : "#bbf7d0"}`,
                        borderRadius: 10,
                        padding: "8px 12px",
                        cursor: "grab",
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#374151",
                      }}
                    >
                      {item.text}
                      {showResult && !showResult.isPerfect && (item.correctBox === "green" ? " ✅" : " ❌")}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Red Box */}
            <div
              style={{ borderRadius: 16, border: "4px dashed #ef4444", background: "rgba(239,68,68,0.04)", display: "flex", flexDirection: "column", overflow: "hidden" }}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop("red")}
            >
              <div style={{ background: "#ef4444", padding: "12px", textAlign: "center", fontWeight: 700, color: "white", fontSize: 13 }}>
                ❌ NO PUEDO CONTROLARLO
              </div>
              <div style={{ flex: 1, padding: 12, display: "flex", flexDirection: "column", gap: 8, minHeight: 300 }}>
                <AnimatePresence>
                  {redBoxItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layoutId={item.id}
                      draggable
                      onDragStart={() => handleDragStart(item)}
                      onDragEnd={handleDragEnd}
                      style={{
                        background: showResult?.isPerfect ? "rgba(239,68,68,0.1)" : "white",
                        border: `2px solid ${showResult ? (item.correctBox === "red" ? "#22c55e" : "#ef4444") : "#fecaca"}`,
                        borderRadius: 10,
                        padding: "8px 12px",
                        cursor: "grab",
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#374151",
                      }}
                    >
                      {item.text}
                      {showResult && !showResult.isPerfect && (item.correctBox === "red" ? " ✅" : " ❌")}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Result & Buttons */}
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  background: showResult.isPerfect ? "#fef9c3" : "#fee2e2",
                  color: showResult.isPerfect ? "#92400e" : "#991b1b",
                  borderRadius: 12,
                  padding: "12px 24px",
                  fontWeight: 700,
                  fontSize: 16,
                  textAlign: "center",
                  maxWidth: 420,
                }}
              >
                {showResult.message}
              </motion.div>
            )}
          </AnimatePresence>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={resetGame}
              style={{
                background: "white",
                border: "2px solid #e2e8f0",
                borderRadius: 10,
                padding: "10px 24px",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                color: "#475569",
              }}
            >
              🔄 Reiniciar
            </button>
            <button
              onClick={checkAnswers}
              disabled={isSubmitting}
              style={{
                background: "#22c55e",
                border: "none",
                borderRadius: 10,
                padding: "10px 24px",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                color: "white",
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              ✅ Comprobar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
