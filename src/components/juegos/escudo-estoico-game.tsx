"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useProfile } from "@/lib/profile-store";
import { supabase } from "@/lib/supabase";

// ─── Virtue definitions ─────────────────────────────────────────────────────
const VIRTUDES = [
  {
    id: "sabiduria",
    label: "Sabiduría",
    emoji: "🦉",
    color: "#6366f1",
    gradient: "from-indigo-600 to-indigo-400",
    bgCard: "bg-indigo-50",
    border: "border-indigo-300",
    ring: "ring-indigo-400",
    hint: "¿Qué cosa importante has aprendido?",
    placeholder: "Escribe un símbolo, frase o dibujo que represente tu sabiduría...",
    prompts: [
      "Un libro que me cambió la vida",
      "Algo que aprendí del error",
      "Mi lección favorita",
      "Una pregunta que siempre me hago",
    ],
    description: "La Sabiduría te ayuda a ver las cosas con claridad, pensar antes de actuar y aprender de cada experiencia.",
  },
  {
    id: "coraje",
    label: "Coraje",
    emoji: "🦁",
    color: "#ef4444",
    gradient: "from-red-600 to-orange-400",
    bgCard: "bg-red-50",
    border: "border-red-300",
    ring: "ring-red-400",
    hint: "¿Cuándo fuiste valiente?",
    placeholder: "Escribe algo que te da fuerza cuando sientes miedo...",
    prompts: [
      "La vez que enfrenté mis miedos",
      "Lo que me hace sentir valiente",
      "Una situación difícil que superé",
      "Mi frase de coraje personal",
    ],
    description: "El Coraje te da fuerza para enfrentar tus miedos, defender lo que crees y actuar aunque sea difícil.",
  },
  {
    id: "justicia",
    label: "Justicia",
    emoji: "⚖️",
    color: "#f59e0b",
    gradient: "from-amber-500 to-yellow-400",
    bgCard: "bg-amber-50",
    border: "border-amber-300",
    ring: "ring-amber-400",
    hint: "¿Cómo tratas a los demás?",
    placeholder: "Escribe cómo actúas de forma justa con los demás...",
    prompts: [
      "Cómo ayudo a mi comunidad",
      "Cuando defiendo a alguien",
      "Mi promesa de ser justo",
      "Lo que significa ser leal",
    ],
    description: "La Justicia te guía para tratar a todos con equidad, ser honesto y contribuir al bien común.",
  },
  {
    id: "templanza",
    label: "Templanza",
    emoji: "🧘‍♂️",
    color: "#10b981",
    gradient: "from-emerald-600 to-teal-400",
    bgCard: "bg-emerald-50",
    border: "border-emerald-300",
    ring: "ring-emerald-400",
    hint: "¿Cómo controlas tus emociones?",
    placeholder: "Escribe qué haces para mantener la calma en momentos difíciles...",
    prompts: [
      "Lo que hago para calmarme",
      "Mi ritual de paz interior",
      "Cómo controlo mis reacciones",
      "Mi ancla emocional",
    ],
    description: "La Templanza te da autocontrol para manejar tus emociones, evitar excesos y mantener el equilibrio.",
  },
];

const XP_AWARD = 25;

// ─── Shield SVG Shape ────────────────────────────────────────────────────────
function ShieldSVG({
  values,
  heroName,
}: {
  values: Record<string, string>;
  heroName: string;
}) {
  return (
    <svg viewBox="0 0 300 340" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-2xl">
      <defs>
        <clipPath id="shieldClip">
          <path d="M150 10 L290 60 L290 180 Q290 310 150 335 Q10 310 10 180 L10 60 Z" />
        </clipPath>
        <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Shield border glow */}
      <path
        d="M150 10 L290 60 L290 180 Q290 310 150 335 Q10 310 10 180 L10 60 Z"
        fill="none"
        stroke="#f59e0b"
        strokeWidth="6"
        filter="url(#glow)"
        opacity={0.6}
      />

      {/* Shield body */}
      <path
        d="M150 10 L290 60 L290 180 Q290 310 150 335 Q10 310 10 180 L10 60 Z"
        fill="#1e1b4b"
        stroke="url(#goldBorder)"
        strokeWidth="5"
      />

      {/* Quadrant dividers */}
      <g clipPath="url(#shieldClip)">
        {/* Top-left: Sabiduría */}
        <rect x="10" y="10" width="140" height="163" fill={values.sabiduria ? "#6366f120" : "#6366f108"} />
        {/* Top-right: Coraje */}
        <rect x="150" y="10" width="140" height="163" fill={values.coraje ? "#ef444420" : "#ef444408"} />
        {/* Bottom-left: Justicia */}
        <rect x="10" y="173" width="140" height="175" fill={values.justicia ? "#f59e0b20" : "#f59e0b08"} />
        {/* Bottom-right: Templanza */}
        <rect x="150" y="173" width="140" height="175" fill={values.templanza ? "#10b98120" : "#10b98108"} />

        {/* Divider lines */}
        <line x1="150" y1="10" x2="150" y2="335" stroke="#f59e0b" strokeWidth="2" opacity={0.7} />
        <line x1="10" y1="173" x2="290" y2="173" stroke="#f59e0b" strokeWidth="2" opacity={0.7} />

        {/* Virtue emojis and labels */}
        <text x="80" y="95" textAnchor="middle" fontSize="32" fill="white" opacity={0.9}>🦉</text>
        <text x="80" y="130" textAnchor="middle" fontSize="11" fill="#c7d2fe" fontFamily="sans-serif">Sabiduría</text>
        {values.sabiduria && (
          <text x="80" y="155" textAnchor="middle" fontSize="8" fill="#e0e7ff" fontFamily="sans-serif" opacity={0.8}>
            {values.sabiduria.slice(0, 18)}{values.sabiduria.length > 18 ? "…" : ""}
          </text>
        )}

        <text x="220" y="95" textAnchor="middle" fontSize="32" fill="white" opacity={0.9}>🦁</text>
        <text x="220" y="130" textAnchor="middle" fontSize="11" fill="#fecaca" fontFamily="sans-serif">Coraje</text>
        {values.coraje && (
          <text x="220" y="155" textAnchor="middle" fontSize="8" fill="#fee2e2" fontFamily="sans-serif" opacity={0.8}>
            {values.coraje.slice(0, 18)}{values.coraje.length > 18 ? "…" : ""}
          </text>
        )}

        <text x="80" y="245" textAnchor="middle" fontSize="32" fill="white" opacity={0.9}>⚖️</text>
        <text x="80" y="280" textAnchor="middle" fontSize="11" fill="#fde68a" fontFamily="sans-serif">Justicia</text>
        {values.justicia && (
          <text x="80" y="300" textAnchor="middle" fontSize="8" fill="#fef3c7" fontFamily="sans-serif" opacity={0.8}>
            {values.justicia.slice(0, 18)}{values.justicia.length > 18 ? "…" : ""}
          </text>
        )}

        <text x="220" y="245" textAnchor="middle" fontSize="32" fill="white" opacity={0.9}>🧘‍♂️</text>
        <text x="220" y="280" textAnchor="middle" fontSize="11" fill="#a7f3d0" fontFamily="sans-serif">Templanza</text>
        {values.templanza && (
          <text x="220" y="300" textAnchor="middle" fontSize="8" fill="#d1fae5" fontFamily="sans-serif" opacity={0.8}>
            {values.templanza.slice(0, 18)}{values.templanza.length > 18 ? "…" : ""}
          </text>
        )}
      </g>

      {/* Center crest */}
      <circle cx="150" cy="173" r="20" fill="#1e1b4b" stroke="#f59e0b" strokeWidth="2" />
      <text x="150" y="179" textAnchor="middle" fontSize="20" fill="#f59e0b">🛡️</text>

      {/* Hero name at bottom */}
      {heroName && (
        <>
          <text x="150" y="322" textAnchor="middle" fontSize="9" fill="#fbbf24" fontFamily="sans-serif" fontWeight="bold" letterSpacing="2">
            {heroName.toUpperCase()}
          </text>
        </>
      )}
    </svg>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function EscudoEstoicoGame() {
  const { activeProfile, refreshProfile, triggerCelebration } = useProfile();

  // State
  const [phase, setPhase] = useState<"intro" | "build" | "complete">("intro");
  const [activeVirtue, setActiveVirtue] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({
    sabiduria: "",
    coraje: "",
    justicia: "",
    templanza: "",
  });
  const [xpAwarded, setXpAwarded] = useState(false);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentVirtue = VIRTUDES[activeVirtue];
  const allFilled = VIRTUDES.every((v) => values[v.id]?.trim().length > 0);
  const filledCount = VIRTUDES.filter((v) => values[v.id]?.trim().length > 0).length;

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.focus();
  }, [activeVirtue, phase]);

  // Award XP
  const handleComplete = async () => {
    if (!allFilled) return;
    setPhase("complete");

    if (!xpAwarded && activeProfile) {
      setSaving(true);
      try {
        const newXp = (activeProfile.total_xp ?? 0) + XP_AWARD;
        const newLevel = Math.floor(newXp / 100) + 1;

        await supabase
          .from("profiles")
          .update({ total_xp: newXp, level: newLevel })
          .eq("id", activeProfile.id);

        await refreshProfile();
        setXpAwarded(true);

        triggerCelebration({
          type: "achievement",
          title: `¡Escudo Estoico Completado! +${XP_AWARD} XP`,
          icon: "🛡️",
          color: "#d4a017",
        });
      } catch (e) {
        console.error(e);
      } finally {
        setSaving(false);
      }
    }
  };

  const goNext = () => {
    if (activeVirtue < VIRTUDES.length - 1) {
      setActiveVirtue(activeVirtue + 1);
    } else {
      handleComplete();
    }
  };

  const goPrev = () => {
    if (activeVirtue > 0) setActiveVirtue(activeVirtue - 1);
  };

  const usePrompt = (prompt: string) => {
    setValues((prev) => ({ ...prev, [currentVirtue.id]: prompt }));
  };

  // ── PHASE: INTRO ────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f0c29, #302b63, #1e1b4b)" }}
      >
        {/* Header */}
        <div className="relative px-6 pt-8 pb-4 text-center">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 50% 0%, #f59e0b 0%, transparent 60%)",
            }}
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-6xl mb-3"
          >
            🛡️
          </motion.div>
          <h1
            className="text-3xl md:text-4xl font-extrabold mb-2"
            style={{
              background: "linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            ¡Diseña tu Escudo Estoico!
          </h1>
          <p className="text-indigo-200 text-sm md:text-base max-w-md mx-auto">
            Un héroe estoico necesita su propio escudo. Aquí te mostramos el escudo sagrado de Elías — ¡ahora crea el tuyo!
          </p>
        </div>

        {/* Two-column: shield image + info */}
        <div className="px-6 pb-6 grid md:grid-cols-2 gap-6 items-center max-w-4xl mx-auto">
          {/* Image */}
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <div
              className="absolute inset-0 rounded-xl blur-2xl opacity-30"
              style={{ background: "radial-gradient(circle, #f59e0b, transparent)" }}
            />
            <div className="relative rounded-2xl overflow-hidden border-2 border-yellow-500/40 shadow-2xl">
              <Image
                src="https://github.com/GuillermoOseguera/Estoico/blob/main/escudo%20estoico.png?raw=true"
                alt="Escudo Estoico de referencia"
                width={500}
                height={500}
                className="w-full h-auto object-contain bg-white/5 p-4"
                unoptimized
              />
            </div>
            <p className="text-center text-xs text-yellow-400/70 mt-2 italic">
              El Escudo Sagrado de Elías — tu inspiración
            </p>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold text-white">Los 4 Pilares de tu Escudo</h2>
            <div className="grid grid-cols-2 gap-3">
              {VIRTUDES.map((v) => (
                <div
                  key={v.id}
                  className="rounded-xl p-3 border border-white/10"
                  style={{ background: `${v.color}15` }}
                >
                  <div className="text-2xl mb-1">{v.emoji}</div>
                  <div className="text-sm font-bold" style={{ color: v.color }}>
                    {v.label}
                  </div>
                  <div className="text-xs text-gray-400 leading-tight mt-1">
                    {v.description.slice(0, 60)}…
                  </div>
                </div>
              ))}
            </div>

            <div
              className="rounded-xl p-4 border border-yellow-500/20"
              style={{ background: "rgba(245,158,11,0.08)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-yellow-400 text-lg">⭐</span>
                <span className="text-yellow-300 font-bold text-sm">Recompensa</span>
              </div>
              <p className="text-yellow-100/80 text-sm">
                Completa tu escudo y gana <strong className="text-yellow-400">{XP_AWARD} XP</strong> para crecer como héroe estoico.
              </p>
            </div>

            <button
              onClick={() => setPhase("build")}
              className="w-full py-4 rounded-xl font-extrabold text-lg transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                color: "#1e1b4b",
                boxShadow: "0 0 30px rgba(245,158,11,0.4)",
              }}
            >
              ⚔️ ¡Comenzar mi Escudo!
            </button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // ── PHASE: BUILD ────────────────────────────────────────────────────────────
  if (phase === "build") {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Progress bar */}
        <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #0f0c29, #1e1b4b)" }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-bold text-sm">Construyendo tu Escudo</span>
            <span className="text-yellow-400 font-bold text-sm">{filledCount}/4 pilares</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #f59e0b, #fbbf24)" }}
              animate={{ width: `${(filledCount / 4) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {/* Virtue tabs */}
          <div className="flex gap-2 mt-3">
            {VIRTUDES.map((v, i) => (
              <button
                key={v.id}
                onClick={() => setActiveVirtue(i)}
                className="flex-1 rounded-lg py-2 text-xs font-bold transition-all"
                style={{
                  background: activeVirtue === i ? v.color : values[v.id] ? `${v.color}30` : "rgba(255,255,255,0.05)",
                  color: activeVirtue === i ? "#fff" : values[v.id] ? v.color : "rgba(255,255,255,0.4)",
                  border: `2px solid ${activeVirtue === i ? v.color : values[v.id] ? `${v.color}50` : "transparent"}`,
                }}
              >
                {v.emoji} {values[v.id] ? "✓" : ""}
                <span className="block">{v.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main build area */}
        <div className="grid md:grid-cols-5 gap-6">
          {/* Left: Shield preview */}
          <div className="md:col-span-2 space-y-4">
            <div
              className="rounded-2xl p-4"
              style={{ background: "linear-gradient(135deg, #0f0c29, #1e1b4b)" }}
            >
              <h3 className="text-yellow-400 font-bold text-center text-sm mb-3">
                ✨ Tu Escudo en Vivo
              </h3>
              <ShieldSVG
                values={values}
                heroName={activeProfile?.name ?? "Héroe"}
              />
              <p className="text-center text-xs text-indigo-300 mt-2">
                Se actualiza mientras escribes
              </p>
            </div>
          </div>

          {/* Right: Virtue editor */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentVirtue.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="md:col-span-3 rounded-2xl p-6"
              style={{ background: `linear-gradient(135deg, ${currentVirtue.color}15, ${currentVirtue.color}05)`, border: `1px solid ${currentVirtue.color}30` }}
            >
              {/* Virtue header */}
              <div className="flex items-start gap-4 mb-6">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ background: `${currentVirtue.color}20`, border: `2px solid ${currentVirtue.color}50` }}
                >
                  {currentVirtue.emoji}
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold" style={{ color: currentVirtue.color }}>
                    {currentVirtue.label}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                    {currentVirtue.description}
                  </p>
                </div>
              </div>

              {/* Hint */}
              <div
                className="rounded-xl px-4 py-3 mb-4 text-sm font-semibold"
                style={{ background: `${currentVirtue.color}15`, color: currentVirtue.color }}
              >
                💭 {currentVirtue.hint}
              </div>

              {/* Text input */}
              <textarea
                ref={textareaRef}
                value={values[currentVirtue.id]}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [currentVirtue.id]: e.target.value }))
                }
                placeholder={currentVirtue.placeholder}
                rows={4}
                className="w-full rounded-xl p-4 text-sm resize-none outline-none focus:ring-2 transition-all"
                style={{
                  border: `1.5px solid ${currentVirtue.color}40`,
                  color: "#1e293b",
                  background: "white",
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              />

              {/* Prompt ideas */}
              <div className="mt-3">
                <p className="text-xs text-gray-400 mb-2">💡 Ideas para inspirarte:</p>
                <div className="flex flex-wrap gap-2">
                  {currentVirtue.prompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => usePrompt(prompt)}
                      className="text-xs px-3 py-1.5 rounded-full border transition-all hover:scale-105 active:scale-95"
                      style={{
                        borderColor: `${currentVirtue.color}50`,
                        color: currentVirtue.color,
                        background: `${currentVirtue.color}10`,
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={goPrev}
                  disabled={activeVirtue === 0}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-30"
                  style={{ background: "rgba(0,0,0,0.06)", color: "#475569" }}
                >
                  ← Anterior
                </button>
                <button
                  onClick={goNext}
                  disabled={!values[currentVirtue.id]?.trim()}
                  className="flex-2 flex-grow-[2] py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100"
                  style={{
                    background: values[currentVirtue.id]?.trim()
                      ? `linear-gradient(135deg, ${currentVirtue.color}, ${currentVirtue.color}cc)`
                      : "#e2e8f0",
                    color: values[currentVirtue.id]?.trim() ? "white" : "#94a3b8",
                    boxShadow: values[currentVirtue.id]?.trim()
                      ? `0 4px 20px ${currentVirtue.color}50`
                      : "none",
                  }}
                >
                  {activeVirtue === VIRTUDES.length - 1 ? "🛡️ ¡Completar mi Escudo!" : "Siguiente →"}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ── PHASE: COMPLETE ─────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto"
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f0c29, #302b63, #1e1b4b)" }}
      >
        {/* Celebration header */}
        <div className="relative px-6 pt-10 pb-6 text-center">
          <div
            className="absolute inset-0 opacity-20"
            style={{ background: "radial-gradient(circle at 50% 0%, #f59e0b, transparent 60%)" }}
          />
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="text-7xl mb-4 relative z-10"
          >
            🛡️
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-3xl md:text-4xl font-extrabold relative z-10"
            style={{
              background: "linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            ¡Tu Escudo Estoico está listo!
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-indigo-200 mt-2 relative z-10"
          >
            Has definido los 4 pilares de tu fortaleza interior.
            {!xpAwarded && saving ? " Guardando..." : xpAwarded ? ` +${XP_AWARD} XP ganados 🌟` : ""}
          </motion.p>
        </div>

        {/* Shield + summary */}
        <div className="px-6 pb-8 grid md:grid-cols-2 gap-8 items-start">
          {/* Final shield */}
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <div
              className="absolute inset-0 rounded-xl blur-3xl opacity-30"
              style={{ background: "radial-gradient(circle, #f59e0b, transparent)" }}
            />
            <div className="relative">
              <ShieldSVG
                values={values}
                heroName={activeProfile?.name ?? "Héroe"}
              />
            </div>
          </motion.div>

          {/* Virtue summary */}
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold text-white">Los Superpoderes de tu Escudo</h2>
            {VIRTUDES.map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="rounded-xl p-4 border"
                style={{
                  background: `${v.color}10`,
                  borderColor: `${v.color}30`,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{v.emoji}</span>
                  <span className="font-bold text-sm" style={{ color: v.color }}>
                    {v.label}
                  </span>
                </div>
                <p className="text-sm text-gray-300 italic">"{values[v.id]}"</p>
              </motion.div>
            ))}

            {/* Inspirational quote */}
            <div
              className="rounded-xl p-4 border border-yellow-500/20 text-center"
              style={{ background: "rgba(245,158,11,0.08)" }}
            >
              <p className="text-yellow-200/80 text-sm italic leading-relaxed">
                "¡Este será tu escudo de héroe estoico, listo para protegerte y recordarte tus poderes ante cualquier desafío!"
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setPhase("build");
                  setActiveVirtue(0);
                }}
                className="py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                style={{ background: "rgba(255,255,255,0.08)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                ✏️ Editar Escudo
              </button>
              <button
                onClick={() => window.location.href = "/juegos"}
                className="py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: "#1e1b4b",
                }}
              >
                ⚔️ Más Juegos
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
