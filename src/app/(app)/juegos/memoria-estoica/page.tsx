"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, RotateCcw, Timer, Trophy, Swords } from "lucide-react";
import { useProfile } from "@/lib/profile-store";
import { addGameXP, addVirtueXP } from "@/lib/supabase";
import { triggerAchievementAnimation } from "@/lib/confetti";
import confetti from "canvas-confetti";

// ─── Card Catalog (image → metadata) ────────────────────────────────────────
const CARD_CATALOG = [
  { url: "/images/memoria/memoria_buhosabio_1773871316643.png",        name: "Búho Sabio",         virtue: "Sabiduría 🦉" },
  { url: "/images/memoria/memoria_escudoespartano_1773871329601.png",   name: "Escudo Espartano",   virtue: "Coraje 🦁" },
  { url: "/images/memoria/memoria_espadajusticia_1773871342247.png",    name: "Espada de Justicia", virtue: "Justicia ⚖️" },
  { url: "/images/memoria/memoria_balanza_1773871354443.png",           name: "Balanza",            virtue: "Justicia ⚖️" },
  { url: "/images/memoria/memoria_fuegotemplanza_1773871365774.png",    name: "Fuego Interior",     virtue: "Templanza 🧘" },
  { url: "/images/memoria/memoria_pergaminoluz_1773871379796.png",      name: "Pergamino de Luz",   virtue: "Sabiduría 🦉" },
  { url: "/images/memoria/memoria_monedaoro_1773871392249.png",         name: "Moneda de Oro",      virtue: "Templanza 🧘" },
  { url: "/images/memoria/memoria_cascogriego_1773871408248.png",       name: "Casco Griego",       virtue: "Coraje 🦁" },
  { url: "/images/memoria/memoria_columnablanc_1773871419478.png",      name: "Columna Griega",     virtue: "Sabiduría 🦉" },
  { url: "/images/memoria/memoria_arbololivo_1773871433196.png",        name: "Árbol de Olivo",     virtue: "Justicia ⚖️" },
  { url: "/images/memoria/memoria_estatuafilosofo_1773871446603.png",   name: "Estatua del Sabio",  virtue: "Sabiduría 🦉" },
  { url: "/images/memoria/memoria_solamanecer_1773871461412.png",       name: "Sol del Amanecer",   virtue: "Coraje 🦁" },
];

// ─── Difficulty presets ──────────────────────────────────────────────────────
const DIFFICULTIES = {
  easy:   { label: "Fácil",   emoji: "🌱", cols: 4, pairs: 8,  color: "#22c55e", idealMoves: 8  },
  normal: { label: "Normal",  emoji: "⚡", cols: 4, pairs: 10, color: "#f59e0b", idealMoves: 10 },
  hard:   { label: "Difícil", emoji: "🔥", cols: 4, pairs: 12, color: "#ef4444", idealMoves: 12 },
} as const;
type Difficulty = keyof typeof DIFFICULTIES;

interface CardData {
  id: string;
  imageUrl: string;
  name: string;
  virtue: string;
  isFlipped: boolean;
  isMatched: boolean;
}

// ─── Best‑record helpers ─────────────────────────────────────────────────────
function getBestRecord(difficulty: Difficulty): number | null {
  if (typeof window === "undefined") return null;
  const val = localStorage.getItem(`memoria_best_${difficulty}`);
  return val ? parseInt(val, 10) : null;
}
function saveBestRecord(difficulty: Difficulty, moves: number) {
  if (typeof window === "undefined") return;
  const current = getBestRecord(difficulty);
  if (current === null || moves < current) {
    localStorage.setItem(`memoria_best_${difficulty}`, String(moves));
  }
}

// ─── Greek‑meander SVG pattern (card back) ───────────────────────────────────
function CardBack() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        backfaceVisibility: "hidden",
        background: "linear-gradient(135deg, #1e1b4b 0%, #0f0c29 100%)",
        borderRadius: 12,
        border: "2px solid #4338ca",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        overflow: "hidden",
      }}
    >
      {/* Meander border pattern */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.15 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="meander" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <path
              d="M0 8 L4 8 L4 4 L12 4 L12 12 L8 12 L8 16"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#meander)" />
      </svg>
      {/* Center golden symbol */}
      <div
        style={{
          width: 50,
          height: 50,
          borderRadius: "50%",
          background: "radial-gradient(circle, #f59e0b44, #f59e0b11)",
          border: "2px solid #f59e0b66",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
          overflow: "hidden"
        }}
      >
        <img src="/logo.png" alt="Logo" style={{ width: "70%", height: "70%", objectFit: "contain" }} />
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function MemoriaEstoicaPage() {
  const router = useRouter();
  const { activeProfile, refreshProfile } = useProfile();

  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [cards, setCards] = useState<CardData[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [processingXP, setProcessingXP] = useState(false);
  const [earnedXpResult, setEarnedXpResult] = useState(0);

  // Timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Best record
  const [bestRecord, setBestRecord] = useState<number | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);

  // Responsive: window width
  const [windowWidth, setWindowWidth] = useState(800);
  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handler = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const isMobile = windowWidth < 480;

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    startTimeRef.current = Date.now() - elapsed * 1000;
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);
  }, [elapsed, stopTimer]);

  useEffect(() => () => stopTimer(), [stopTimer]);

  const getDifficultyImages = (diff: Difficulty) =>
    CARD_CATALOG.slice(0, DIFFICULTIES[diff].pairs);

  const startNewGame = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    setBestRecord(getBestRecord(diff));
    setIsNewRecord(false);
    setMoves(0);
    setMatches(0);
    setIsGameOver(false);
    setIsLocked(false);
    setFlippedIndices([]);
    setElapsed(0);
    stopTimer();

    const images = getDifficultyImages(diff);
    const deck = [...images, ...images].map((img) => ({
      id: Math.random().toString(36).substring(2, 9),
      imageUrl: img.url,
      name: img.name,
      virtue: img.virtue,
      isFlipped: false,
      isMatched: false,
    }));
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    setCards(deck);

    // Start timer after brief delay
    setTimeout(() => {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);
    }, 100);
  }, [stopTimer]);

  const handleCardClick = (index: number) => {
    if (isLocked || !difficulty) return;
    if (cards[index].isFlipped || cards[index].isMatched) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setIsLocked(true);
      const totalMoves = moves + 1;
      setMoves(totalMoves);

      const [a, b] = newFlipped;

      if (newCards[a].imageUrl === newCards[b].imageUrl) {
        // Match!
        const matchedVirtue = newCards[a].virtue;
        const matchedName = newCards[a].name;

        setTimeout(() => {
          setCards((prev) => {
            const next = [...prev];
            next[a].isMatched = true;
            next[b].isMatched = true;
            return next;
          });
          setFlippedIndices([]);
          setIsLocked(false);

          // Toast with virtue name
          toast.success(`¡Par encontrado! ${matchedName}`, {
            description: matchedVirtue,
            duration: 1800,
          });

          setMatches((prev) => {
            const newMatches = prev + 1;
            if (difficulty && newMatches === DIFFICULTIES[difficulty].pairs) {
              handleVictory(totalMoves, difficulty);
            }
            return newMatches;
          });
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards((prev) => {
            const next = [...prev];
            next[a].isFlipped = false;
            next[b].isFlipped = false;
            return next;
          });
          setFlippedIndices([]);
          setIsLocked(false);
        }, 950);
      }
    }
  };

  const handleVictory = async (totalMoves: number, diff: Difficulty) => {
    stopTimer();
    setIsGameOver(true);
    triggerAchievementAnimation();

    // Confetti burst
    confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 } });
    setTimeout(() => confetti({ particleCount: 100, spread: 80, angle: 60, origin: { x: 0 } }), 500);
    setTimeout(() => confetti({ particleCount: 100, spread: 80, angle: 120, origin: { x: 1 } }), 700);

    // Best record
    const prev = getBestRecord(diff);
    if (prev === null || totalMoves < prev) {
      saveBestRecord(diff, totalMoves);
      setBestRecord(totalMoves);
      setIsNewRecord(true);
    }

    const cfg = DIFFICULTIES[diff];
    let earnedXp = 100 - ((totalMoves - cfg.idealMoves) * 2);
    if (earnedXp < 20) earnedXp = 20;
    setEarnedXpResult(earnedXp);

    if (activeProfile) {
      try {
        setProcessingXP(true);
        await addGameXP(activeProfile.id, "memoria_estoica", totalMoves, earnedXp);
        await addVirtueXP(activeProfile.id, "wisdom", 50);
        await refreshProfile();
        toast.success(`Mente clara. +${earnedXp} XP y +50 Prudencia`, { icon: "🧠" });
      } catch (err) {
        console.error(err);
        toast.error("Error guardando progreso");
      } finally {
        setProcessingXP(false);
      }
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const totalPairs = difficulty ? DIFFICULTIES[difficulty].pairs : 0;
  const cols = difficulty
    ? isMobile
      ? DIFFICULTIES[difficulty].pairs <= 8
        ? 4
        : 4
      : DIFFICULTIES[difficulty].cols
    : 4;

  // ── Difficulty selection screen ────────────────────────────────────────────
  if (!difficulty) {
    return (
      <div style={{ minHeight: "100vh", padding: "20px 0" }}>
        <div className="main-header" style={{ marginLeft: -24, marginRight: -24, marginTop: -44, marginBottom: 24, padding: "16px 24px", display: "flex", gap: 16, alignItems: "center" }}>
          <button onClick={() => router.push("/juegos")} className="text-slate-400 hover:text-white transition" style={{ background: "none", border: "none", cursor: "pointer" }}>
            <ArrowLeft />
          </button>
          <div>
            <div className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>ACADEMIA ESTOICA GOPLEMMINGS</div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>Memoria Estoica</div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", paddingTop: 20 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🧠</div>
          <h2 className="font-display" style={{ fontSize: 28, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>Memoria Estoica</h2>
          <p style={{ color: "#64748b", marginBottom: 36, fontSize: 15 }}>Elige tu nivel de entrenamiento mental</p>

          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 16, justifyContent: "center", alignItems: "center" }}>
            {(Object.entries(DIFFICULTIES) as [Difficulty, typeof DIFFICULTIES[Difficulty]][]).map(([key, cfg]) => {
              const best = getBestRecord(key);
              return (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => startNewGame(key)}
                  className="parchment-card"
                  style={{
                    width: isMobile ? "100%" : 180,
                    padding: "24px 20px",
                    borderRadius: 16,
                    border: `2px solid ${cfg.color}40`,
                    background: "white",
                    cursor: "pointer",
                    textAlign: "center",
                    boxShadow: `0 4px 24px ${cfg.color}20`,
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 8 }}>{cfg.emoji}</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#1e293b", marginBottom: 4 }}>{cfg.label}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>{cfg.pairs} pares · {cfg.pairs * 2} cartas</div>
                  {best !== null && (
                    <div style={{ fontSize: 11, color: cfg.color, fontWeight: 600, background: `${cfg.color}15`, borderRadius: 8, padding: "3px 8px" }}>
                      🏆 Récord: {best} mov
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>
    );
  }

  const cfg = DIFFICULTIES[difficulty];

  // ── Game over screen ───────────────────────────────────────────────────────
  if (isGameOver) {
    return (
      <div style={{ minHeight: "100vh", padding: "20px 0" }}>
        <div className="main-header" style={{ marginLeft: -24, marginRight: -24, marginTop: -44, marginBottom: 24, padding: "16px 24px", display: "flex", gap: 16, alignItems: "center" }}>
          <button onClick={() => router.push("/juegos")} className="text-slate-400 hover:text-white transition" style={{ background: "none", border: "none", cursor: "pointer" }}>
            <ArrowLeft />
          </button>
          <div className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>ACADEMIA ESTOICA GOPLEMMINGS</div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 20 }}
          className="parchment-card"
          style={{ textAlign: "center", padding: 40, maxWidth: 480, margin: "0 auto" }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{ fontSize: 72, marginBottom: 16 }}
          >
            🧠
          </motion.div>

          <h2 className="font-display" style={{ fontSize: 30, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
            ¡Mente Clara y Serena!
          </h2>

          {isNewRecord && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                color: "#1e1b4b",
                borderRadius: 20,
                padding: "6px 16px",
                fontWeight: 700,
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              🏆 ¡Nuevo Récord Personal!
            </motion.div>
          )}

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, margin: "20px 0 28px" }}>
            {[
              { icon: <Swords size={18} />, label: "Movimientos", val: moves },
              { icon: <Timer size={18} />, label: "Tiempo", val: formatTime(elapsed) },
              { icon: <Trophy size={18} />, label: "XP Ganados", val: `+${earnedXpResult}` },
            ].map((s) => (
              <div key={s.label} style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 8px", border: "1px solid #e2e8f0" }}>
                <div style={{ color: "#64748b", marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 18, color: "#1e293b" }}>{s.val}</div>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <p style={{ color: "#475569", fontSize: 14, maxWidth: 340, margin: "0 auto 24px", lineHeight: 1.6 }}>
            Has encontrado todos los pares en <strong>{moves}</strong> movimientos. Una memoria aguda es el reflejo de una mente ordenada.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => startNewGame(difficulty)}
              disabled={processingXP}
              style={{
                background: "linear-gradient(135deg, #d4a017, #f0c840)",
                color: "#1e293b",
                border: "none",
                borderRadius: 12,
                padding: "14px 28px",
                fontWeight: 700,
                fontSize: 15,
                cursor: processingXP ? "not-allowed" : "pointer",
                opacity: processingXP ? 0.7 : 1,
              }}
            >
              {processingXP ? "Guardando..." : "🔄 Jugar de Nuevo"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setDifficulty(null)}
              style={{
                background: "#f1f5f9",
                color: "#475569",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "14px 28px",
                fontWeight: 600,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              🎯 Cambiar Nivel
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Active game ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", padding: "20px 0" }}>
      {/* Pulsing glow keyframes */}
      <style>{`
        @keyframes matchGlow {
          0%, 100% { box-shadow: 0 0 12px 2px rgba(212,160,23,0.4); }
          50%       { box-shadow: 0 0 28px 6px rgba(240,200,64,0.75); }
        }
        @keyframes cardReveal {
          0%   { transform: rotateY(180deg) scale(0.9); }
          60%  { transform: rotateY(180deg) scale(1.06); }
          100% { transform: rotateY(180deg) scale(1); }
        }
        .card-matched-front {
          animation: matchGlow 1.8s ease-in-out infinite;
        }
      `}</style>

      {/* Header */}
      <div className="main-header" style={{ marginLeft: -24, marginRight: -24, marginTop: -44, marginBottom: 20, padding: "16px 24px", display: "flex", gap: 16, alignItems: "center" }}>
        <button onClick={() => router.push("/juegos")} className="text-slate-400 hover:text-white transition" style={{ background: "none", border: "none", cursor: "pointer" }}>
          <ArrowLeft />
        </button>
        <div style={{ flex: 1 }}>
          <div className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>ACADEMIA ESTOICA GOPLEMMINGS</div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>Memoria Estoica · {cfg.emoji} {cfg.label}</div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <h2 className="font-display text-slate-800" style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, margin: 0 }}>
          🧠 Memoria Estoica
        </h2>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {/* Timer */}
          <div className="parchment-card" style={{ padding: "6px 14px", borderRadius: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Timer size={14} color="#64748b" />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", fontVariantNumeric: "tabular-nums" }}>
              {formatTime(elapsed)}
            </span>
          </div>
          {/* Moves */}
          <div className="parchment-card" style={{ padding: "6px 14px", borderRadius: 12 }}>
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>MOVIMIENTOS: </span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--gold-600)" }}>{moves}</span>
          </div>
          {/* Best record */}
          {bestRecord !== null && (
            <div style={{ padding: "6px 12px", borderRadius: 12, background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}>
              <span style={{ fontSize: 11, color: cfg.color, fontWeight: 700 }}>🏆 {bestRecord} mov</span>
            </div>
          )}
          {/* Reset */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => startNewGame(difficulty)}
            title="Reiniciar"
            className="parchment-card"
            style={{ padding: "8px", borderRadius: 12, cursor: "pointer", background: "white", border: "1px solid #e2e8f0" }}
          >
            <RotateCcw size={18} color="#475569" />
          </motion.button>
        </div>
      </div>

      {/* Pairs progress bar (shield icons) */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>PARES ENCONTRADOS</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{matches}/{totalPairs}</span>
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {Array.from({ length: totalPairs }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.8 }}
              animate={{
                scale: i < matches ? [1, 1.3, 1] : 1,
                opacity: 1,
              }}
              transition={{ duration: 0.3, delay: i < matches ? 0 : 0 }}
              style={{
                width: isMobile ? 20 : 24,
                height: isMobile ? 20 : 24,
                borderRadius: 6,
                background: i < matches
                  ? `linear-gradient(135deg, ${cfg.color}, ${cfg.color}aa)`
                  : "#e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: isMobile ? 10 : 12,
                transition: "background 0.4s",
                boxShadow: i < matches ? `0 0 8px ${cfg.color}60` : "none",
              }}
            >
              {i < matches ? "🛡️" : ""}
            </motion.div>
          ))}
        </div>
        {/* Progress bar */}
        <div style={{ marginTop: 6, height: 4, borderRadius: 4, background: "#e2e8f0", overflow: "hidden" }}>
          <motion.div
            style={{ height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}cc)` }}
            animate={{ width: `${(matches / totalPairs) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Board — textured parchment bg */}
      <div
        style={{
          background: "linear-gradient(145deg, #fdf8f0, #f5ede0)",
          border: "1px solid #e8d5b7",
          borderRadius: 20,
          padding: isMobile ? 10 : 16,
          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gap: isMobile ? "8px" : "12px",
            maxWidth: isMobile ? "100%" : 560,
            margin: "0 auto",
          }}
        >
          <AnimatePresence>
            {cards.map((card, idx) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.7, rotateY: -90 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ delay: idx * 0.025, type: "spring", stiffness: 260, damping: 18 }}
                onClick={() => handleCardClick(idx)}
                style={{
                  width: "100%",
                  aspectRatio: "3/4",
                  minWidth: isMobile ? 60 : 70,
                  position: "relative",
                  cursor: (card.isFlipped || card.isMatched) ? "default" : "pointer",
                  perspective: 1000,
                }}
              >
                <motion.div
                  animate={{
                    rotateY: (card.isFlipped || card.isMatched) ? 180 : 0
                  }}
                  transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                  style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    transformStyle: "preserve-3d",
                  }}
                  whileHover={(!card.isFlipped && !card.isMatched) ? { scale: 1.06 } : {}}
                >
                  {/* Card back (face-down) */}
                  <CardBack />

                  {/* Card front (revealed) */}
                  <div
                    className={card.isMatched ? "card-matched-front" : ""}
                    style={{
                      width: "100%",
                      height: "100%",
                      position: "absolute",
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      background: card.isMatched ? "#fefce8" : "#f8fafc",
                      borderRadius: 12,
                      border: `3px solid ${card.isMatched ? "#f59e0b" : "#cbd5e1"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      transition: "border-color 0.3s",
                    }}
                  >
                    <Image
                      src={card.imageUrl}
                      alt={card.name}
                      fill
                      style={{
                        objectFit: "cover",
                        opacity: card.isMatched ? 0.85 : 1,
                        transition: "opacity 0.3s",
                      }}
                    />
                    {/* Matched checkmark overlay */}
                    {card.isMatched && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "#f59e0b",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "white",
                          zIndex: 2,
                          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                        }}
                      >
                        ✓
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Change difficulty link */}
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button
          onClick={() => { stopTimer(); setDifficulty(null); }}
          style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
        >
          Cambiar dificultad
        </button>
      </div>
    </div>
  );
}
