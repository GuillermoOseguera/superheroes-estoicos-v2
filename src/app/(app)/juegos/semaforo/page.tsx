"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import Link from "next/link";
import { toast } from "sonner";
import { useProfile } from "@/lib/profile-store";
import { supabase, addGameXP, addVirtueXP } from "@/lib/supabase";

const EMOTIONS = [
  { id: "angry", label: "Enojo", emoji: "😡", color: "#ef4444", text: "¡Siento fuego en el pecho!" },
  { id: "sad", label: "Tristeza", emoji: "😢", color: "#3b82f6", text: "Me siento deprimido o con ganas de llorar." },
  { id: "anxious", label: "Ansiedad", emoji: "😰", color: "#e11d48", text: "Mi mente va muy rápido y me preocupa el futuro." },
  { id: "frustrated", label: "Frustración", emoji: "😔", color: "#f59e0b", text: "Las cosas no salen como quiero." },
  { id: "scared", label: "Miedo", emoji: "😨", color: "#8b5cf6", text: "Algo me asusta o me hace sentir inseguro." },
];

const VIRTUES = [
  { id: "wisdom", label: "Sabiduría", emoji: "🦉", color: "#f59e0b", description: "Ver las cosas como realmente son." },
  { id: "courage", label: "Coraje", emoji: "🦁", color: "#ef4444", description: "Enfrentar el miedo y hacer lo correcto." },
  { id: "justice", label: "Justicia", emoji: "⚖️", color: "#3b82f6", description: "Tratar a todos con bondad y equidad." },
  { id: "temperance", label: "Templanza", emoji: "🐢", color: "#10b981", description: "Mantener la calma y el autocontrol." },
];

export default function SemaforoEmocionalPage() {
  const { activeProfile, refreshProfile } = useProfile();
  const [step, setStep] = useState(1); // 1: Rojo, 2: Amarillo, 3: Verde, 4: Éxito
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [triggerReason, setTriggerReason] = useState("");
  const [canControl, setCanControl] = useState<boolean | null>(null);
  const [actionPlan, setActionPlan] = useState("");
  const [selectedVirtue, setSelectedVirtue] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [xpEarned, setXpEarned] = useState({ general: 0, virtue: 0 });

  const emotionData = EMOTIONS.find((e) => e.id === selectedEmotion);
  const virtueData = VIRTUES.find((v) => v.id === selectedVirtue);

  const handleSubmit = async () => {
    if (!activeProfile || !selectedEmotion || canControl === null || !triggerReason || !actionPlan || !selectedVirtue) {
      toast.error("Por favor completa todos los campos.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Guardar en tabla emotional_logs
      const { error: logError } = await supabase.from("emotional_logs").insert({
        user_id: activeProfile.id,
        emotion: selectedEmotion,
        intensity,
        trigger_reason: triggerReason,
        can_control: canControl,
        action_plan: actionPlan,
        virtue_selected: selectedVirtue,
      });

      if (logError) throw logError;

      // 2. Otorgar XP
      const xpBase = 15;
      const virtueXp = 10;
      
      const { newTotalXp } = await addGameXP(
        activeProfile.id,
        "semaforo_emocional",
        100, // Score máximo simbólico
        xpBase
      );

      await addVirtueXP(activeProfile.id, selectedVirtue as any, virtueXp);

      setXpEarned({ general: xpBase, virtue: virtueXp });
      setStep(4);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success("¡Registro de emoción guardado con éxito! 🌟");
      refreshProfile();
    } catch (error: any) {
      console.error(error);
      toast.error(`No se pudo guardar: ${error.message || "Error desconocido"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

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

      <div className="parchment-card" style={{ maxWidth: 600, margin: "0 auto" }}>
        {/* Luces del Semáforo */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 30 }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: step >= 1 ? "#ef4444" : "#fee2e2", border: "2px solid #ef4444", boxShadow: step === 1 ? "0 0 10px #ef4444" : "none" }} />
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: step >= 2 ? "#f59e0b" : "#fef3c7", border: "2px solid #f59e0b", boxShadow: step === 2 ? "0 0 10px #f59e0b" : "none" }} />
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: step >= 3 ? "#10b981" : "#d1fae5", border: "2px solid #10b981", boxShadow: step === 3 ? "0 0 10px #10b981" : "none" }} />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="font-display" style={{ fontSize: 24, fontWeight: 700, color: "#ef4444", textAlign: "center", marginBottom: 8 }}>
                🔴 Alto: Identifica tu Emoción
              </h2>
              <p style={{ textAlign: "center", color: "#64748b", marginBottom: 24 }}>
                Cuando sientes una emoción fuerte, el primer paso es detenerte y reconocerla. ¿Qué sientes?
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12, marginBottom: 24 }}>
                {EMOTIONS.map((e) => (
                  <motion.button
                    key={e.id}
                    onClick={() => setSelectedEmotion(e.id)}
                    style={{
                      padding: "16px",
                      borderRadius: 16,
                      border: `2px solid ${selectedEmotion === e.id ? e.color : "#e2e8f0"}`,
                      background: selectedEmotion === e.id ? `${e.color}10` : "white",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      transition: "transform 0.1s",
                    }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span style={{ fontSize: 32 }}>{e.emoji}</span>
                    <span style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>{e.label}</span>
                  </motion.button>
                ))}
              </div>

              {selectedEmotion && (
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 8, color: "#475569" }}>
                    ¿Qué tan fuerte es? (1 al 5)
                  </label>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        onClick={() => setIntensity(val)}
                        style={{
                          flex: 1,
                          padding: "10px",
                          borderRadius: 8,
                          border: `2px solid ${intensity === val ? "#ef4444" : "#e2e8f0"}`,
                          background: intensity === val ? "#fef2f2" : "white",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  disabled={!selectedEmotion}
                  onClick={() => setStep(2)}
                  style={{
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: 10,
                    padding: "12px 24px",
                    fontWeight: 700,
                    cursor: selectedEmotion ? "pointer" : "not-allowed",
                    opacity: selectedEmotion ? 1 : 0.5,
                  }}
                >
                  Pensar (Siguiente) →
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="font-display" style={{ fontSize: 24, fontWeight: 700, color: "#f59e0b", textAlign: "center", marginBottom: 8 }}>
                🟡 Piensa: Dicotomía del Control
              </h2>
              <p style={{ textAlign: "center", color: "#64748b", marginBottom: 24 }}>
                Ya sabemos que sientes {emotionData?.label} ({emotionData?.emoji}). Ahora racionalicemos.
              </p>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 8, color: "#1e293b" }}>
                  ¿Qué causó esta emoción? ✍️
                </label>
                <textarea
                  value={triggerReason}
                  onChange={(e) => setTriggerReason(e.target.value)}
                  placeholder="Ej: Mi amigo no me prestó su juguete..."
                  style={{ width: "100%", padding: 12, borderRadius: 10, border: "2px solid #e2e8f0", minHeight: 80, resize: "none" }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 12, color: "#1e293b" }}>
                  ¿Esto que pasó está bajo tu control total? 🧠
                </label>
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={() => setCanControl(true)}
                    style={{
                      flex: 1,
                      padding: "16px",
                      borderRadius: 12,
                      border: `2px solid ${canControl === true ? "#10b981" : "#e2e8f0"}`,
                      background: canControl === true ? "#ecfdf5" : "white",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    🌳 Sí, está en mí
                    <div style={{ fontSize: 11, color: "#64748b", fontWeight: 400, marginTop: 4 }}>Mis acciones, mis palabras.</div>
                  </button>
                  <button
                    onClick={() => setCanControl(false)}
                    style={{
                      flex: 1,
                      padding: "16px",
                      borderRadius: 12,
                      border: `2px solid ${canControl === false ? "#3b82f6" : "#e2e8f0"}`,
                      background: canControl === false ? "#eff6ff" : "white",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ☁️ No, está fuera
                    <div style={{ fontSize: 11, color: "#64748b", fontWeight: 400, marginTop: 4 }}>El clima, los demás.</div>
                  </button>
                </div>
              </div>

              {canControl === false && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ background: "#eff6ff", border: "1px solid #3b82f6", borderRadius: 12, padding: 12, marginBottom: 24, fontSize: 13, color: "#1e3a8a" }}
                >
                  💡 <strong>Sabiduría de Epicteto:</strong> "No nos perturban las cosas, sino las opiniones que tenemos de ellas." Si no puedes controlarlo, déjalo ir con la respiración.
                </motion.div>
              )}

              {canControl === true && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ background: "#ecfdf5", border: "1px solid #10b981", borderRadius: 12, padding: 12, marginBottom: 24, fontSize: 13, color: "#064e3b" }}
                >
                  💡 <strong>Acción Virtuosa:</strong> ¡Genial! Enfócate en tu respuesta. Tu virtud es tu fuerza.
                </motion.div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button onClick={() => setStep(1)} style={{ background: "white", border: "2px solid #e2e8f0", borderRadius: 10, padding: "12px 24px", fontWeight: 600, cursor: "pointer" }}>
                  ← Volver
                </button>
                <button
                  disabled={canControl === null || !triggerReason}
                  onClick={() => setStep(3)}
                  style={{
                    background: "#f59e0b",
                    color: "white",
                    border: "none",
                    borderRadius: 10,
                    padding: "12px 24px",
                    fontWeight: 700,
                    cursor: (canControl !== null && triggerReason) ? "pointer" : "not-allowed",
                    opacity: (canControl !== null && triggerReason) ? 1 : 0.5,
                  }}
                >
                  Actuar (Siguiente) →
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="font-display" style={{ fontSize: 24, fontWeight: 700, color: "#10b981", textAlign: "center", marginBottom: 8 }}>
                🟢 Actúa: Una Respuesta Sabia
              </h2>
              <p style={{ textAlign: "center", color: "#64748b", marginBottom: 24 }}>
                Ya has pensado sobre tu situación. ¿Tus acciones serán virtuosas?
              </p>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 12, color: "#1e293b" }}>
                  1. Elige una Virtud que te guiará: 🛡️
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                  {VIRTUES.map((v) => (
                    <motion.button
                      key={v.id}
                      onClick={() => setSelectedVirtue(v.id)}
                      style={{
                        padding: "12px",
                        borderRadius: 12,
                        border: `2px solid ${selectedVirtue === v.id ? v.color : "#e2e8f0"}`,
                        background: selectedVirtue === v.id ? `${v.color}10` : "white",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        cursor: "pointer",
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span style={{ fontSize: 24 }}>{v.emoji}</span>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{v.label}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 8, color: "#1e293b" }}>
                  2. ¿Qué vas a hacer ahora? ✍️
                </label>
                <textarea
                  value={actionPlan}
                  onChange={(e) => setActionPlan(e.target.value)}
                  placeholder="Ej: Voy a respirar y pedirle mi turno para jugar..."
                  style={{ width: "100%", padding: 12, borderRadius: 10, border: "2px solid #e2e8f0", minHeight: 80, resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button onClick={() => setStep(2)} style={{ background: "white", border: "2px solid #e2e8f0", borderRadius: 10, padding: "12px 24px", fontWeight: 600, cursor: "pointer" }}>
                  ← Volver
                </button>
                <button
                  disabled={isSubmitting || !selectedVirtue || !actionPlan}
                  onClick={handleSubmit}
                  style={{
                    background: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: 10,
                    padding: "12px 24px",
                    fontWeight: 700,
                    cursor: (selectedVirtue && actionPlan) ? "pointer" : "not-allowed",
                    opacity: (selectedVirtue && actionPlan) ? 1 : 0.5,
                  }}
                >
                  {isSubmitting ? "Guardando..." : "✅ Registrar Éxito"}
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: "center", padding: "20px 0" }}
            >
              <div style={{ fontSize: 60, marginBottom: 16 }}>🏆</div>
              <h2 className="font-display" style={{ fontSize: 28, fontWeight: 800, color: "#1e2563", marginBottom: 12 }}>
                ¡Dominio Emocional Demostrado!
              </h2>
              <p style={{ color: "#64748b", marginBottom: 24 }}>
                Has detenido una emoción y has planeado una respuesta virtuosa como un verdadero héroe estoico.
              </p>

              <div style={{ background: "#f8fafc", borderRadius: 16, padding: 16, border: "1px solid #e2e8f0", maxWidth: 400, margin: "0 auto 24px" }}>
                <div style={{ fontWeight: 700, color: "#475569", marginBottom: 10, fontSize: 13 }}>RECOMPENSAS</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
                  <div style={{ background: "linear-gradient(135deg, #d4a017, #f0c840)", color: "#1e293b", padding: "8px 16px", borderRadius: 20, fontWeight: 700 }}>
                    🌟 +{xpEarned.general} XP
                  </div>
                  <div style={{ background: `${virtueData?.color}20`, color: virtueData?.color, padding: "8px 16px", borderRadius: 20, fontWeight: 700, border: `1px solid ${virtueData?.color}` }}>
                    🛡️ +{xpEarned.virtue} {virtueData?.label}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button
                  onClick={() => {
                    setStep(1);
                    setSelectedEmotion(null);
                    setIntensity(3);
                    setTriggerReason("");
                    setCanControl(null);
                    setActionPlan("");
                    setSelectedVirtue(null);
                  }}
                  style={{ background: "white", border: "2px solid #e2e8f0", borderRadius: 10, padding: "12px 24px", fontWeight: 600, cursor: "pointer" }}
                >
                  Nuevo Registro
                </button>
                <Link href="/juegos" style={{ textDecoration: "none" }}>
                  <button style={{ background: "#1e293b", color: "white", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 700, cursor: "pointer" }}>
                    Volver
                  </button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
