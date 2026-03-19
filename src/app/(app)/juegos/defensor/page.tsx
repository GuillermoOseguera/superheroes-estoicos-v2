"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import Link from "next/link";
import { toast } from "sonner";
import { useProfile } from "@/lib/profile-store";
import { addGameXP, addVirtueXP } from "@/lib/supabase";
import { Shield, Zap, Snowflake, Flame } from "lucide-react";

// ─── Tipos y Constantes ───────────────────────────────────────────────────────

type BehaviorType = "normal" | "fast" | "zigzag" | "tank";

interface Enemy {
  id: string;
  type: BehaviorType;
  emoji: string;
  x: number; // Porcentaje 0-100
  y: number; // Píxeles
  baseX: number;
  speed: number;
  hp: number;
  maxHp: number;
  createdAt: number;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  color: string;
}

const MAX_HEARTS = 3;
const BASE_SPAWN_RATE_MS = 1400; // Slower initial spawn
const BASE_SPEED_MODIFIER = 0.65; // Slower initial drops
const BASE_DURATION_SEC = 15;

// Cursor personalizado de Espada
const SWORD_CURSOR = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 32 32'><text y='24' font-size='26'>🗡️</text></svg>") 0 24, crosshair`;

export default function DefensorMentePage() {
  const { activeProfile, refreshProfile } = useProfile();
  
  // Estados de alto nivel
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover" | "victory">("start");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Helpers de Nivel
  const getDuration = (lvl: number) => BASE_DURATION_SEC + (lvl - 1) * 4; // +4 sec per level
  const getSpeedMod = (lvl: number) => BASE_SPEED_MODIFIER + (lvl - 1) * 0.15; // +15% per level

  // Estado Dinámico del Juego (Sincronizado frecuentemente)
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [timeLeft, setTimeLeft] = useState(BASE_DURATION_SEC);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [combo, setCombo] = useState(0);
  const [energy, setEnergy] = useState(0); // Max 100
  
  // Efectos visuales
  const [particles, setParticles] = useState<Particle[]>([]);
  const [shake, setShake] = useState(false); // Screen shake on damage
  const [timeSlowActive, setTimeSlowActive] = useState(false);

  // Refs de Game Loop
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  
  // Referencias mutables para evitar stales en Closures de RequestAnimationFrame
  const stateRef = useRef({
    gameState: "start",
    timeSlowUntil: 0,
    startTime: 0,
    enemies: [] as Enemy[],
  });

  // ─── Lógica del Motor ─────────────────────────────────────────────────────────

  const spawnEnemy = useCallback(() => {
    // Probabilidades según el momento
    const r = Math.random();
    let type: BehaviorType = "normal";
    let emoji = "👿";
    let speed = (100 + Math.random() * 40) * getSpeedMod(level);
    let hp = 1;

    if (r > 0.85) {
      type = "tank"; emoji = "🌑"; speed = 70 * getSpeedMod(level); hp = 2;
    } else if (r > 0.65) {
      type = "fast"; emoji = "😡"; speed = 220 * getSpeedMod(level);
    } else if (r > 0.45) {
      type = "zigzag"; emoji = "🌪️"; speed = 90 * getSpeedMod(level);
    }

    const startX = 10 + Math.random() * 80;

    const newEnemy: Enemy = {
      id: Math.random().toString(36).substring(7),
      type, emoji, speed, hp, maxHp: hp,
      x: startX, baseX: startX, y: -60,
      createdAt: Date.now(),
    };

    stateRef.current.enemies.push(newEnemy);
  }, [level]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 300);
  };

  const updateGame = useCallback((time: number) => {
    if (stateRef.current.gameState !== "playing") return;

    const deltaTime = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;
    
    // Validar Time Slow
    const isSlowed = Date.now() < stateRef.current.timeSlowUntil;
    if (isSlowed !== timeSlowActive) setTimeSlowActive(isSlowed);
    const speedMultiplier = isSlowed ? 0.25 : 1;

    // Actualizar Timer localmente cada frame para animar barra si se quiere, o confiar en useEffect de Segundos
    // Increment Spawn Timer
    spawnTimerRef.current += deltaTime * 1000;
    
    // Curva de dificultad (mientras más juegas, más rápido salen)
    const elapsedSinceStart = (Date.now() - stateRef.current.startTime) / 1000;
    const startSpawnRate = Math.max(500, BASE_SPAWN_RATE_MS - ((level - 1) * 120));
    const currentSpawnRate = Math.max(350, startSpawnRate - (elapsedSinceStart * 15));

    if (spawnTimerRef.current >= currentSpawnRate) {
      spawnEnemy();
      spawnTimerRef.current = 0;
    }

    const areaHeight = gameAreaRef.current?.clientHeight || 600;
    let hitBottomCount = 0;

    let updated = stateRef.current.enemies.map(e => {
      let newY = e.y + (e.speed * deltaTime * speedMultiplier);
      let newX = e.x;
      
      if (e.type === "zigzag") {
        const aliveFor = (Date.now() - e.createdAt) / 1000;
        newX = e.baseX + Math.sin(aliveFor * 3) * 15;
        newX = Math.max(5, Math.min(95, newX));
      }
      
      return { ...e, y: newY, x: newX };
    });

    const survivors = updated.filter(e => {
      if (e.y > areaHeight - 50) {
        hitBottomCount++;
        return false;
      }
      return true;
    });

    stateRef.current.enemies = survivors;
    setEnemies(survivors); // Forzar re-render de React

    // Procesar daño fuera del scope del setState (ahora es síncrono y real)
    if (hitBottomCount > 0) {
      triggerShake();
      setCombo(0);
      setHearts(h => {
        const nextH = h - hitBottomCount;
        if (nextH <= 0 && stateRef.current.gameState === "playing") {
          stateRef.current.gameState = "gameover";
          setGameState("gameover");
        }
        return Math.max(0, nextH);
      });
    }

    if (stateRef.current.gameState === "playing") {
      requestRef.current = requestAnimationFrame(updateGame);
    }
  }, [spawnEnemy, timeSlowActive]);

  // Main game loop initialization
  useEffect(() => {
    if (gameState === "playing") {
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(updateGame);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState, updateGame]);

  // Second Timer limit
  useEffect(() => {
    if (gameState === "playing") {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            stateRef.current.gameState = "victory";
            setGameState("victory");
            handleVictory();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  // ─── Interacciones del Usuario ────────────────────────────────────────────────

  const startGame = () => {
    stateRef.current.gameState = "playing";
    stateRef.current.startTime = Date.now();
    stateRef.current.timeSlowUntil = 0;
    stateRef.current.enemies = [];
    
    setGameState("playing");
    setScore(0);
    setHearts(MAX_HEARTS);
    setTimeLeft(getDuration(level));
    setEnemies([]);
    setParticles([]);
    setCombo(0);
    setEnergy(0);
    spawnTimerRef.current = 0;
  };

  const spawnParticle = (x: number, y: number, color: string = "#eab308") => {
    const id = Math.random().toString(36).substring(7);
    setParticles(prev => [...prev.slice(-10), { id, x, y, color }]); // Limit to 10 max to prevent lag
    setTimeout(() => setParticles(p => p.filter(pt => pt.id !== id)), 600);
  };

  const handleEnemyClick = (enemy: Enemy, index: number, e: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== "playing") return;
    e.stopPropagation();

    // Damage logic
    if (enemy.hp > 1) {
      stateRef.current.enemies = stateRef.current.enemies.map(en => en.id === enemy.id ? { ...en, hp: en.hp - 1 } : en);
      setEnemies(stateRef.current.enemies);
      spawnParticle(enemy.x, enemy.y, "#94a3b8"); // Gray hit particle for armor
      return; 
    }

    // Killing logic
    stateRef.current.enemies = stateRef.current.enemies.filter(en => en.id !== enemy.id);
    setEnemies(stateRef.current.enemies);
    spawnParticle(enemy.x, enemy.y, "#f59e0b");

    setScore(s => {
      const multiplier = Math.min(4, Math.floor(combo / 5) + 1);
      return s + (10 * multiplier);
    });
    setCombo(c => c + 1);
    setEnergy(en => Math.min(100, en + 5)); // 5% energy per kill
  };

  const useTemplanzaPower = () => {
    if (energy >= 100 && gameState === "playing") {
      setEnergy(0);
      stateRef.current.timeSlowUntil = Date.now() + 5000; // 5 segundos de paz
      toast("❄️ ¡Freno de Templanza Activado!", { description: "Los enemigos se ralentizan por 5 segundos." });
    }
  };

  const handleVictory = async () => {
    if (!activeProfile) return;
    setIsSubmitting(true);
    
    try {
      await addGameXP(activeProfile.id, "defensor_mente", score, 30); // 30 base + dynamic
      await addVirtueXP(activeProfile.id, "courage", 25);
      
      confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 } });
      toast.success(`¡Nivel ${level} superado! +30XP y +25 Coraje`);
      refreshProfile();
      setLevel(l => l + 1); // Subimos la dificultad para la siguiente!
    } catch (error) {
      console.error(error);
      toast.error("Hubo un error al guardar tu progreso.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentMultiplier = Math.min(4, Math.floor(combo / 5) + 1);

  // ─── Renderizado ──────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#0f172a" }}>
      {/* Estilos inyectados */}
      <style>{`
        @keyframes floatEffect {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 10px rgba(56, 189, 248, 0.4); }
          50% { box-shadow: 0 0 25px rgba(56, 189, 248, 0.8); }
        }
        @keyframes screenShake {
          0%, 100% { transform: translateX(0) translateY(0); }
          20% { transform: translateX(-10px) translateY(5px); }
          40% { transform: translateX(10px) translateY(-5px); }
          60% { transform: translateX(-5px) translateY(5px); }
          80% { transform: translateX(5px) translateY(-5px); }
        }
      `}</style>

      {/* Header Fijo */}
      <div className="main-header" style={{ marginLeft: -24, marginRight: -24, marginTop: -24, marginBottom: 24, padding: "16px 24px", background: "#1e293b", color: "white" }}>
        <div className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>ACADEMIA ESTOICA</div>
        <div style={{ fontSize: 13, color: "#94a3b8" }}>Sala de Entrenamiento · Nivel {level}</div>
      </div>

      <div style={{ padding: "0 24px" }}>
        <Link href="/juegos" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, color: "#94a3b8", fontSize: 13, marginBottom: 20, transition: "color 0.2s" }}>
          ← Volver a los Juegos
        </Link>
      </div>

      {/* Pantalla de Inicio */}
      <AnimatePresence>
        {gameState === "start" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="parchment-card"
            style={{ maxWidth: 600, margin: "0 auto", textAlign: "center", padding: 40, background: "linear-gradient(145deg, #1e293b, #0f172a)", border: "2px solid #334155", color: "white" }}
          >
            <div style={{ fontSize: 72, marginBottom: 16, animation: "floatEffect 3s ease-in-out infinite" }}>🛡️</div>
            <h2 className="font-display" style={{ fontSize: 36, fontWeight: 800, color: "#f8fafc", marginBottom: 12, textShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
              Defensor de la Mente
            </h2>
            <p style={{ color: "#94a3b8", marginBottom: 24, lineHeight: 1.6, fontSize: 16 }}>
              Las Sombras Negativas (Ansiedad, Ira, Pereza) atacan la fortaleza de tu tranquilidad. 
              <strong> Usa tu Espada de la Razón (Haz clic o toca)</strong> para destruirlas antes de que invadan tu mente.
            </p>
            
            <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 16, padding: 20, marginBottom: 24, textAlign: "left" }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>🗡️</span>
                <span style={{ color: "#cbd5e1" }}><strong>Tu Ratón es una Espada:</strong> Destruye a los enemigos tocándolos.</span>
              </div>
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>🌑</span>
                <span style={{ color: "#cbd5e1" }}><strong>Sombras Fuertes (Tanque):</strong> Requieren 2 golpes rápidos.</span>
              </div>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <span style={{ fontSize: 24 }}>🎯</span>
                <span style={{ color: "#cbd5e1" }}><strong>Combo Dinámico:</strong> Acumula aciertos para multiplicar tus puntos (x2, x3, x4).</span>
              </div>
            </div>

            <button
              onClick={startGame}
              style={{
                background: "linear-gradient(135deg, #ef4444, #b91c1c)", color: "white", border: "none", borderRadius: 16,
                padding: "16px 48px", fontSize: 20, fontWeight: 800, cursor: "pointer", boxShadow: "0 8px 30px rgba(239, 68, 68, 0.4)",
                transition: "transform 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              ¡Defender mi Paz! 🚀
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pantalla de Juego */}
      {gameState === "playing" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 24px", paddingBottom: 24, animation: shake ? "screenShake 0.3s cubic-bezier(.36,.07,.19,.97) both" : "none" }}>
          
          {/* HUD Superior (Juego Activo) */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
            {/* Combo & Score */}
            <div style={{ background: "rgba(30, 41, 59, 0.8)", padding: "12px 20px", borderRadius: 16, border: "1px solid #334155" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Puntos</div>
                <div className="font-display" style={{ fontSize: 24, fontWeight: 800, color: "#f59e0b" }}>{score}</div>
              </div>
              {combo >= 5 && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ color: "#38bdf8", fontWeight: 800, fontSize: 13, marginTop: 4 }}>
                  🔥 COMBO x{currentMultiplier} ({combo})
                </motion.div>
              )}
            </div>

            {/* Timer Central */}
            <div style={{ textAlign: "center", background: timeSlowActive ? "#0ea5e9" : "#1e293b", transition: "background 0.3s", border: timeSlowActive ? "2px solid #7dd3fc" : "2px solid #334155", padding: "10px 32px", borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: timeSlowActive ? "#e0f2fe" : "#94a3b8", textTransform: "uppercase" }}>Tiempo Restante</div>
              <div className="font-display" style={{ fontSize: 28, fontWeight: 800, color: timeLeft <= 5 ? "#ef4444" : "white" }}>
                00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
              </div>
            </div>

            {/* Vidas & Powerup */}
            <div style={{ background: "rgba(30, 41, 59, 0.8)", padding: "12px 20px", borderRadius: 16, border: "1px solid #334155", textAlign: "right", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", fontSize: 20 }}>
                {Array.from({ length: MAX_HEARTS }).map((_, i) => (
                  <motion.span key={i} animate={{ scale: i < hearts ? [1, 1.2, 1] : 1, opacity: i < hearts ? 1 : 0.2, filter: i < hearts ? "none" : "grayscale(1)" }} transition={{ duration: 0.5 }}>
                    💖
                  </motion.span>
                ))}
              </div>
              
              {/* Barra de Poder */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  disabled={energy < 100}
                  onClick={useTemplanzaPower}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 32, height: 32, borderRadius: "50%", border: "none",
                    background: energy >= 100 ? "#38bdf8" : "#334155", color: "white", cursor: energy >= 100 ? "pointer" : "default",
                    animation: energy >= 100 ? "glowPulse 1.5s infinite" : "none", transition: "background 0.3s"
                  }}
                  title="Poder de Templanza (Carga Acumulada)"
                >
                  <Snowflake size={16} />
                </button>
                <div style={{ width: 80, height: 8, background: "#0f172a", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${energy}%`, background: energy >= 100 ? "#38bdf8" : "#f59e0b", transition: "width 0.3s, background 0.3s" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Área de Juego Táctica con Cursor de Espada */}
          <div
            ref={gameAreaRef}
            onClick={() => setCombo(0)} // Fallar el clic resetea combo
            style={{
              flex: 1,
              background: "url('/images/temple_bg.avif') center/cover no-repeat, linear-gradient(to bottom, #1e1e2f, #09090b)",
              backgroundBlendMode: "overlay",
              borderRadius: 24, border: timeSlowActive ? "4px solid #38bdf8" : "4px solid #334155",
              position: "relative", overflow: "hidden", boxShadow: "inset 0 0 50px rgba(0,0,0,0.8)",
              touchAction: "none",
              cursor: SWORD_CURSOR, // <--- Aplicando el cursor de espada
              transition: "border 0.3s"
            }}
          >
            {/* Efecto Congelado (Time Slow) */}
            <AnimatePresence>
              {timeSlowActive && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "absolute", inset: 0, background: "rgba(56, 189, 248, 0.1)", zIndex: 1, pointerEvents: "none" }} />
              )}
            </AnimatePresence>

            {/* Suelo (La Mente) */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 50, background: "rgba(52, 211, 153, 0.15)", borderTop: "2px solid rgba(52, 211, 153, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6ee7b7", fontWeight: 800, letterSpacing: 4, textShadow: "0 2px 10px rgba(0,0,0,0.5)", zIndex: 2 }}>
              FORTALEZA MENTAL
            </div>

            {/* Sprites Enemigos */}
            <AnimatePresence>
              {enemies.map((enemy, idx) => (
                <motion.div
                  key={enemy.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: enemy.hp === 2 ? 1.3 : 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  onPointerDown={(e) => handleEnemyClick(enemy, idx, e)}
                  style={{
                    position: "absolute", left: `${enemy.x}%`, top: `${enemy.y}px`, transform: "translate(-50%, -50%)",
                    fontSize: 48, filter: enemy.hp === 2 ? "drop-shadow(0 4px 12px rgba(0,0,0,0.8))" : "drop-shadow(0 2px 8px rgba(239, 68, 68, 0.6))",
                    zIndex: 10,
                    userSelect: "none",
                    opacity: enemy.hp === 1 && enemy.maxHp === 2 ? 0.6 : 1, // Feedback de daño
                    transition: "opacity 0.2s"
                  }}
                >
                  {enemy.emoji}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Partículas de Explosión */}
            <AnimatePresence>
              {particles.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ scale: 0.5, opacity: 1, y: 0 }}
                  animate={{ scale: 2.5, opacity: 0, y: -20 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  style={{
                    position: "absolute", left: `${p.x}%`, top: `${p.y}px`, transform: "translate(-50%, -50%)",
                    width: 40, height: 40, borderRadius: "50%", background: `radial-gradient(circle, ${p.color} 0%, transparent 70%)`,
                    zIndex: 5, pointerEvents: "none", filter: "blur(2px)"
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Pantallas de Fin de Juego */}
      <AnimatePresence>
        {(gameState === "gameover" || gameState === "victory") && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="parchment-card"
            style={{ maxWidth: 500, margin: "auto", marginTop: 20, textAlign: "center", zIndex: 100, padding: 40, background: "linear-gradient(145deg, #1e293b, #0f172a)", color: "white", border: "2px solid #334155" }}
          >
            {gameState === "gameover" ? (
              <>
                <div style={{ fontSize: 72, marginBottom: 16 }}>💥</div>
                <h2 className="font-display" style={{ fontSize: 32, fontWeight: 800, color: "#ef4444", marginBottom: 12 }}>
                  ¡La barrera cedió!
                </h2>
                <p style={{ color: "#94a3b8", marginBottom: 24, fontSize: 16 }}>
                  Los pensamientos negativos lograron invadirte. Pero recuerda: "El hombre sabio no se sorprende por las dificultades, se entrena para ellas."
                </p>
                <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 16, padding: 16, marginBottom: 24 }}>
                  <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Puntos Obtenidos</div>
                  <div className="font-display" style={{ fontSize: 36, color: "#f59e0b", fontWeight: 800 }}>{score}</div>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 72, marginBottom: 16 }}>🏆</div>
                <h2 className="font-display" style={{ fontSize: 32, fontWeight: 800, color: "#10b981", marginBottom: 12 }}>
                  ¡Mente Imperturbable!
                </h2>
                <p style={{ color: "#94a3b8", marginBottom: 24, fontSize: 16 }}>
                  Superaste la tormenta. Has demostrado la virtud de la Fortaleza protegiendo tu paz interior incluso en el caos.
                </p>
                
                <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 16, padding: 20, border: "1px solid #334155", marginBottom: 24 }}>
                  <div style={{ fontWeight: 800, color: "#e2e8f0", marginBottom: 16, fontSize: 14 }}>RECOMPENSAS DE HÉROE 🔥</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
                    <div style={{ background: "linear-gradient(135deg, #d4a017, #f0c840)", color: "#1e293b", padding: "10px 20px", borderRadius: 24, fontWeight: 800, boxShadow: "0 4px 15px rgba(212, 160, 23, 0.3)" }}>
                      🌟 +30 XP General
                    </div>
                    <div style={{ background: "linear-gradient(135deg, #ef4444, #b91c1c)", color: "white", padding: "10px 20px", borderRadius: 24, fontWeight: 800, boxShadow: "0 4px 15px rgba(239, 68, 68, 0.3)" }}>
                      🦁 +25 Coraje
                    </div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#38bdf8" }}>
                    ⭐ Puntaje Defensivo: {score} pts
                  </div>
                </div>
              </>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                onClick={startGame}
                disabled={isSubmitting}
                style={{
                  background: "white", color: "#0f172a", border: "none", borderRadius: 12, padding: "14px 28px",
                  fontWeight: 800, fontSize: 16, cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.7 : 1, transition: "transform 0.2s"
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                {gameState === "victory" ? `⏩ Jugar Nivel ${level}` : "🔄 Entrenar Nivel Actual"}
              </button>
              <Link href="/juegos" style={{ textDecoration: "none" }}>
                <button
                  disabled={isSubmitting}
                  style={{
                    background: "#334155", color: "white", border: "none", borderRadius: 12, padding: "14px 28px",
                    fontWeight: 800, fontSize: 16, cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.7 : 1, transition: "transform 0.2s"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                  onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
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
