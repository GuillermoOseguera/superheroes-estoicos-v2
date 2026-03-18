"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import Link from "next/link";
import { toast } from "sonner";
import { useProfile } from "@/lib/profile-store";
import { addGameXP, addVirtueXP } from "@/lib/supabase";

// ─── Tipos y Constantes ───────────────────────────────────────────────────────

type EnemyType = "angry" | "sad" | "anxious" | "frustrated" | "scared";

interface Enemy {
  id: string;
  type: EnemyType;
  emoji: string;
  x: number; // Porcentaje 0-100 para ser responsive
  y: number; // Píxeles desde arriba
  speed: number;
}

const ENEMY_EMOJIS: Record<EnemyType, string> = {
  angry: "😡",
  sad: "😢",
  anxious: "😰",
  frustrated: "😔",
  scared: "😨",
};

const GAME_DURATION_SEC = 30; // Tiempo para sobrevivir (victoria)
const MAX_HEARTS = 3;         // Vidas
const SPAWN_RATE_MS = 1200;   // Cada cuánto sale un enemigo nuevo (ms)

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function DefensorMentePage() {
  const { activeProfile, refreshProfile } = useProfile();
  
  // Estados del juego
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover" | "victory">("start");
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SEC);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs para el Game Loop
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  // ─── Lógica del Juego (Loops) ───────────────────────────────────────────────

  const spawnEnemy = useCallback(() => {
    const types: EnemyType[] = ["angry", "sad", "anxious", "frustrated", "scared"];
    const randomType = types[Math.floor(Math.random() * types.length)];
    // X aleatorio entre 5% y 85% para que no se salga de la pantalla
    const randomX = 5 + Math.random() * 80;
    // Velocidad: Base + algo random. Aumenta con el tiempo? Podría ser.
    const speed = 100 + Math.random() * 80; // píxeles por segundo

    const newEnemy: Enemy = {
      id: Math.random().toString(36).substring(7),
      type: randomType,
      emoji: ENEMY_EMOJIS[randomType],
      x: randomX,
      y: -50, // Empieza arriba de la pantalla
      speed: speed,
    };

    setEnemies((prev) => [...prev, newEnemy]);
  }, []);

  const updateGame = useCallback(
    (time: number) => {
      if (gameState !== "playing") return;

      const deltaTime = (time - lastTimeRef.current) / 1000; // en segundos
      lastTimeRef.current = time;

      const areaHeight = gameAreaRef.current?.clientHeight || 600;

      // Actualizar timer de spawn
      spawnTimerRef.current += deltaTime * 1000;
      if (spawnTimerRef.current >= SPAWN_RATE_MS) {
        spawnEnemy();
        spawnTimerRef.current = 0;
      }

      setEnemies((prevEnemies) => {
        let newEnemies = [...prevEnemies];
        let hitBottom = 0;

        // Mover enemigos hacia abajo
        newEnemies = newEnemies.map((e) => ({
          ...e,
          y: e.y + e.speed * deltaTime,
        }));

        // Filtrar los que salieron de pantalla (llegaron al bottom)
        const survivors = newEnemies.filter((e) => {
          if (e.y >= areaHeight - 40) { // 40px tolerancia
            hitBottom++;
            return false;
          }
          return true;
        });

        // Penalizar vidas
        if (hitBottom > 0) {
          setHearts((h) => {
            const nextHearts = h - hitBottom;
            if (nextHearts <= 0) {
              setGameState("gameover");
            }
            return Math.max(0, nextHearts);
          });
        }

        return survivors;
      });

      requestRef.current = requestAnimationFrame(updateGame);
    },
    [gameState, spawnEnemy]
  );

  // Manejar el Game Loop principal
  useEffect(() => {
    if (gameState === "playing") {
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(updateGame);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, updateGame]);

  // Manejar el cronómetro
  useEffect(() => {
    if (gameState === "playing") {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameState("victory");
            handleVictory();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState]);

  // ─── Interacciones ──────────────────────────────────────────────────────────

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setHearts(MAX_HEARTS);
    setTimeLeft(GAME_DURATION_SEC);
    setEnemies([]);
    spawnTimerRef.current = 0;
  };

  const handleEnemyClick = (id: string, e: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== "playing") return;
    
    // Evitamos bubble por las dudas
    e.stopPropagation();
    
    setEnemies((prev) => prev.filter((enemy) => enemy.id !== id));
    setScore((s) => s + 10);

    // Mini confeti local?
    // Podríamos añadir un pequeño efecto de explosión partiendo de las coordenadas del ratón
  };

  const handleVictory = async () => {
    if (!activeProfile) return;
    setIsSubmitting(true);
    
    try {
      // Registrar XP General
      await addGameXP(
        activeProfile.id,
        "defensor_mente",
        score, // Score = Puntos ganados bloqueando
        20     // Base XP por jugar
      );
      // Registrar XP de Virtud (Fortaleza/Coraje)
      await addVirtueXP(activeProfile.id, "courage", 15);

      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
      toast.success("¡Fortaleza entrenada con éxito! +20XP y +15 Coraje");
      refreshProfile();
    } catch (error) {
      console.error(error);
      toast.error("Hubo un error al guardar tu progreso.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Renderizado ────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Header Fijo */}
      <div className="main-header" style={{ marginLeft: -24, marginRight: -24, marginTop: -24, marginBottom: 24, padding: "16px 24px" }}>
        <div className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>
          ACADEMIA ESTOICA GOPLEMMINGS
        </div>
        <div style={{ fontSize: 13, color: "#94a3b8" }}>Sala de Entrenamiento</div>
      </div>

      <div style={{ padding: "0 24px" }}>
        <Link href="/juegos" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 13, marginBottom: 20 }}>
          ← Volver a los Juegos
        </Link>
      </div>

      {/* Pantalla de Inicio */}
      <AnimatePresence>
        {gameState === "start" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="parchment-card"
            style={{ maxWidth: 500, margin: "0 auto", textAlign: "center" }}
          >
            <div style={{ fontSize: 60, marginBottom: 16 }}>🛡️</div>
            <h2 className="font-display" style={{ fontSize: 28, fontWeight: 800, color: "#1e2563", marginBottom: 12 }}>
              Defensor de la Mente
            </h2>
            <p style={{ color: "#64748b", marginBottom: 24, lineHeight: 1.6 }}>
              Tu mente es como una fortaleza asediada por pensamientos negativos temporales. 
              <strong> Usa tu virtud del Coraje (Fortaleza)</strong> destruyéndolos con un toque antes de que invadan tu paz interior.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ padding: "12px 20px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                🎯 <strong style={{ color: "#1e293b" }}>Destruir:</strong> Toque/Clic
              </div>
              <div style={{ padding: "12px 20px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                ⏳ <strong style={{ color: "#1e293b" }}>Sobrevive:</strong> {GAME_DURATION_SEC}s
              </div>
            </div>
            <button
              onClick={startGame}
              style={{
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: 12,
                padding: "16px 32px",
                fontSize: 18,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(239, 68, 68, 0.4)",
              }}
            >
              ¡Defender mi Paz! 🚀
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pantalla de Juego */}
      {gameState === "playing" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 24px", paddingBottom: 24 }}>
          {/* HUD Superior */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#64748b" }}>Puntos</div>
              <div className="font-display" style={{ fontSize: 24, fontWeight: 800, color: "#f59e0b" }}>{score}</div>
            </div>
            <div style={{ textAlign: "center", background: "white", border: "2px solid #e2e8f0", padding: "8px 24px", borderRadius: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Tiempo Restante</div>
              <div className="font-display" style={{ fontSize: 24, fontWeight: 800, color: timeLeft <= 5 ? "#ef4444" : "#1e293b" }}>
                00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#64748b" }}>Paz Interior (Vidas)</div>
              <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", fontSize: 20 }}>
                {Array.from({ length: MAX_HEARTS }).map((_, i) => (
                  <span key={i} style={{ opacity: i < hearts ? 1 : 0.2, filter: i < hearts ? "none" : "grayscale(1)" }}>💖</span>
                ))}
              </div>
            </div>
          </div>

          {/* Área de Juego */}
          <div
            ref={gameAreaRef}
            style={{
              flex: 1,
              background: "linear-gradient(to bottom, #1e1e2f, #111116)",
              borderRadius: 24,
              border: "4px solid #334155",
              position: "relative",
              overflow: "hidden",
              boxShadow: "inset 0 0 40px rgba(0,0,0,0.5)",
              touchAction: "none", // Prevenir scroll al tapear
            }}
          >
            {/* Suelo decorativo (La Mente) */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: 40,
              background: "rgba(34, 197, 94, 0.1)",
              borderTop: "2px dashed rgba(34, 197, 94, 0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "rgba(34, 197, 94, 0.5)", fontWeight: 700, letterSpacing: 2
            }}>
              BARRERA MENTAL
            </div>

            {/* Enemigos */}
            <AnimatePresence>
              {enemies.map((enemy) => (
                <motion.div
                  key={enemy.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  onPointerDown={(e) => handleEnemyClick(enemy.id, e)}
                  style={{
                    position: "absolute",
                    left: `${enemy.x}%`,
                    transform: `translate(-50%, ${enemy.y}px)`, // Usamos transform en lugar de TOP por rendimiento si es manual, pero top es pasable para MVP
                    fontSize: 42,
                    cursor: "crosshair",
                    userSelect: "none",
                    filter: "drop-shadow(0 0 10px rgba(239, 68, 68, 0.6))",
                    zIndex: 10,
                  }}
                >
                  {enemy.emoji}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Pantalla GameOver / Victoria */}
      <AnimatePresence>
        {(gameState === "gameover" || gameState === "victory") && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="parchment-card"
            style={{ maxWidth: 500, margin: "auto", marginTop: 20, textAlign: "center", zIndex: 100 }}
          >
            {gameState === "gameover" ? (
              <>
                <div style={{ fontSize: 60, marginBottom: 16 }}>💥</div>
                <h2 className="font-display" style={{ fontSize: 28, fontWeight: 800, color: "#ef4444", marginBottom: 12 }}>
                  ¡La barrera cedió!
                </h2>
                <p style={{ color: "#64748b", marginBottom: 24 }}>
                  Los pensamientos negativos lograron invadirte. Pero recuerda: "El hombre sabio no se sorprende por las dificultades, se entrena para ellas."
                </p>
                <div style={{ marginBottom: 24 }}>
                  Puntos obtenidos: <strong>{score}</strong>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 60, marginBottom: 16 }}>🏆</div>
                <h2 className="font-display" style={{ fontSize: 28, fontWeight: 800, color: "#10b981", marginBottom: 12 }}>
                  ¡Mente Imperturbable!
                </h2>
                <p style={{ color: "#64748b", marginBottom: 24 }}>
                  Superaste la tormenta. Has demostrado la virtud de la Fortaleza protegiendo tu paz interior.
                </p>
                
                <div style={{ background: "#f8fafc", borderRadius: 16, padding: 16, border: "1px solid #e2e8f0", marginBottom: 24 }}>
                  <div style={{ fontWeight: 700, color: "#475569", marginBottom: 10, fontSize: 13 }}>RECOMPENSAS 🔥</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
                    <div style={{ background: "linear-gradient(135deg, #d4a017, #f0c840)", color: "#1e293b", padding: "8px 16px", borderRadius: 20, fontWeight: 700 }}>
                      🌟 +20 XP General
                    </div>
                    <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "8px 16px", borderRadius: 20, fontWeight: 700, border: "1px solid rgba(239, 68, 68, 0.4)" }}>
                      🦁 +15 Coraje
                    </div>
                  </div>
                  <div style={{ marginTop: 12, fontWeight: 600, color: "#1e293b" }}>
                    ¡Puntaje Perfecto Defendiendo! ({score} pts)
                  </div>
                </div>
              </>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={startGame}
                disabled={isSubmitting}
                style={{
                  background: "white", border: "2px solid #e2e8f0", borderRadius: 12, padding: "12px 24px",
                  fontWeight: 600, cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.7 : 1
                }}
              >
                🔄 Entrenar de Nuevo
              </button>
              <Link href="/juegos" style={{ textDecoration: "none" }}>
                <button
                  disabled={isSubmitting}
                  style={{
                    background: "#1e293b", color: "white", border: "none", borderRadius: 12, padding: "12px 24px",
                    fontWeight: 700, cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  Volver a la Base
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
