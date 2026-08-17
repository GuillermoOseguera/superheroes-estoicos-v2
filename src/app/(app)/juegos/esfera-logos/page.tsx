"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import Link from "next/link";
import { toast } from "sonner";
import { Volume2, VolumeX, Music, Shield, Sparkles, Flame, Eye, Zap } from "lucide-react";
import { useProfile } from "@/lib/profile-store";
import { addGameXP, addVirtueXP, unlockAchievement } from "@/lib/supabase";
import { soundFX } from "@/lib/sound-fx";

// ─── Constantes del Juego ──────────────────────────────────────────

const W = 460; // Resolución interna del canvas
const H = 620;
const BASE_PADDLE_W = 96;
const WIDE_PADDLE_W = 150;
const PADDLE_H = 15;
const BALL_RADIUS = 7;
const BASE_BALL_SPEED = 320;
const FIRE_BALL_SPEED = 360;

const STOIC_QUOTES = [
  "“No son las cosas las que nos perturban, sino los juicios que hacemos sobre ellas.” — Epicteto",
  "“Destruye la falsa creencia y destruirás el dolor.” — Marco Aurelio",
  "“El fuego transforma todo lo que toca en llamas y luz. Sé como ese fuego.” — Marco Aurelio",
  "“La mente que es dueña de sí misma es una fortaleza inexpugnable.” — Séneca",
  "“La razón es la única guía certera en medio del caos.” — Zenón de Citio",
];

// Tipos de Bloques Mentales
type BrickType = "ira" | "miedo" | "queja" | "columna" | "prisma";

interface Brick {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: BrickType;
  hitsMax: number;
  hitsLeft: number;
  color: string;
  label: string;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isFire: boolean;
}

type PowerType = "wide" | "multiball" | "slow_laser" | "barrier" | "fire";

interface PowerUp {
  x: number;
  y: number;
  vy: number;
  type: PowerType;
  icon: string;
  label: string;
  color: string;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface FloatText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

// ─── Generador de Niveles ──────────────────────────────────────────

function createLevelBricks(level: number): Brick[] {
  const bricks: Brick[] = [];
  const cols = 6;
  const bw = 66;
  const bh = 24;
  const startX = (W - cols * (bw + 6)) / 2;
  const startY = 60;

  if (level === 1) {
    // Nivel 1: El Pórtico de los Primeros Pasos (Accesible y formativo)
    const rows = 4;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let type: BrickType = "queja";
        let hits = 1;
        let color = "#3b82f6";
        let label = "Queja";

        if (r === 0) {
          type = "prisma";
          color = "#fbbf24";
          label = "Sabiduría";
        } else if (r === 1) {
          type = "ira";
          color = "#ef4444";
          label = "Impulso";
        }

        bricks.push({
          id: `b_1_${r}_${c}`,
          x: startX + c * (bw + 6),
          y: startY + r * (bh + 7),
          w: bw,
          h: bh,
          type,
          hitsMax: hits,
          hitsLeft: hits,
          color,
          label,
        });
      }
    }
  } else if (level === 2) {
    // Nivel 2: El Jardín de la Serenidad (Estructura de Templo con columnas)
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < cols; c++) {
        // Huecos arquitectónicos
        if ((r === 1 || r === 2) && (c === 2 || c === 3)) continue;

        let type: BrickType = "ira";
        let hits = 1;
        let color = "#ef4444";
        let label = "Ira";

        if (r === 0 || (c === 0 || c === cols - 1)) {
          type = "miedo";
          hits = 2;
          color = "#a855f7";
          label = "Miedo";
        } else if (r === 3 && (c === 1 || c === 4)) {
          type = "prisma";
          color = "#fbbf24";
          label = "Prisma";
        } else {
          type = "queja";
          color = "#0ea5e9";
          label = "Duda";
        }

        bricks.push({
          id: `b_2_${r}_${c}`,
          x: startX + c * (bw + 6),
          y: startY + r * (bh + 7),
          w: bw,
          h: bh,
          type,
          hitsMax: hits,
          hitsLeft: hits,
          color,
          label,
        });
      }
    }
  } else {
    // Nivel 3: La Ciudadela del Alma (Pirámide de virtudes y fortalezas)
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < cols; c++) {
        if (c < r - 1 || c > cols - r) continue; // Forma piramidal

        let type: BrickType = "miedo";
        let hits = 2;
        let color = "#8b5cf6";
        let label = "Ansiedad";

        if (r === 0 || (r === 2 && c === 2)) {
          type = "prisma";
          color = "#f59e0b";
          label = "Logos";
        } else if (r % 2 === 0) {
          type = "ira";
          hits = 1;
          color = "#f43f5e";
          label = "Ego";
        }

        bricks.push({
          id: `b_3_${r}_${c}`,
          x: startX + c * (bw + 6),
          y: startY + r * (bh + 7),
          w: bw,
          h: bh,
          type,
          hitsMax: hits,
          hitsLeft: hits,
          color,
          label,
        });
      }
    }
  }

  return bricks;
}

export default function EsferaLogosPage() {
  const { activeProfile, refreshProfile } = useProfile();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Estados UI
  const [gameState, setGameState] = useState<"start" | "playing" | "level_cleared" | "dead">("start");
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [uiScore, setUiScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [activePowers, setActivePowers] = useState<{ wide: boolean; fire: boolean; barrier: boolean; slow: boolean }>({
    wide: false,
    fire: false,
    barrier: false,
    slow: false,
  });
  const [bestScore, setBestScore] = useState<number>(0);
  const [lastReward, setLastReward] = useState<{ xp: number; wisdom: number; courage: number } | null>(null);
  const [quote, setQuote] = useState<string>(STOIC_QUOTES[0]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);

  // Audio toggles
  const [sfxMuted, setSfxMuted] = useState<boolean>(soundFX.getSfxMuted());
  const [musicMuted, setMusicMuted] = useState<boolean>(soundFX.getMusicMuted());

  // Motor del juego mutable
  const engine = useRef({
    paddleX: W / 2 - BASE_PADDLE_W / 2,
    paddleW: BASE_PADDLE_W,
    paddleTargetX: W / 2 - BASE_PADDLE_W / 2,
    balls: [] as Ball[],
    bricks: [] as Brick[],
    powers: [] as PowerUp[],
    sparks: [] as Spark[],
    floatTexts: [] as FloatText[],
    combo: 0,
    powersCollected: 0,
    totalBricksDestroyed: 0,
    score: 0,
    lives: 3,
    level: 1,
    running: false,
    timers: {
      wide: 0,
      fire: 0,
      barrier: 0,
      slow: 0,
    },
  });

  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // ─── Inicialización de Nivel ────────────────────────────────────────

  const initLevel = useCallback((lvl: number, keepScore = true) => {
    const e = engine.current;
    e.level = lvl;
    e.paddleW = BASE_PADDLE_W;
    e.paddleX = W / 2 - BASE_PADDLE_W / 2;
    e.paddleTargetX = e.paddleX;
    e.bricks = createLevelBricks(lvl);
    e.powers = [];
    e.sparks = [];
    e.floatTexts = [];
    e.combo = 0;
    e.timers = { wide: 0, fire: 0, barrier: 10, slow: 0 }; // Regalo de barrera protectora al inicio

    if (!keepScore) {
      e.score = 0;
      e.lives = 3;
      e.powersCollected = 0;
      e.totalBricksDestroyed = 0;
      setLives(3);
      setUiScore(0);
    }

    // Esfera inicial
    e.balls = [
      {
        x: W / 2,
        y: H - 70,
        vx: (Math.random() > 0.5 ? 1 : -1) * (BASE_BALL_SPEED * 0.6),
        vy: -BASE_BALL_SPEED * 0.8,
        radius: BALL_RADIUS,
        isFire: false,
      },
    ];

    setCurrentLevel(lvl);
    setActivePowers({ wide: false, fire: false, barrier: true, slow: false });
  }, []);

  // ─── Soltar Poderes ────────────────────────────────────────────────

  const dropPowerUp = useCallback((x: number, y: number, force = false) => {
    const chance = force ? 1 : 0.28;
    if (Math.random() > chance) return;

    const list: Array<{ type: PowerType; icon: string; label: string; color: string }> = [
      { type: "wide", icon: "🛡️", label: "Templanza (Escudo Ancho)", color: "#10b981" },
      { type: "multiball", icon: "🦁", label: "Fortaleza (Multiesfera)", color: "#ef4444" },
      { type: "slow_laser", icon: "🦉", label: "Prudencia (Guía Sagrada)", color: "#38bdf8" },
      { type: "barrier", icon: "⚖️", label: "Justicia (Suelo Atenas)", color: "#fbbf24" },
      { type: "fire", icon: "🔥", label: "Fuego del Logos", color: "#f97316" },
    ];

    const chosen = list[Math.floor(Math.random() * list.length)];
    engine.current.powers.push({
      x,
      y,
      vy: 140,
      ...chosen,
    });
  }, []);

  // ─── Fin de Partida / Victoria ────────────────────────────────────

  const triggerGameOver = useCallback(async () => {
    const e = engine.current;
    e.running = false;
    soundFX.gameOver();
    setGameState("dead");
    setQuote(STOIC_QUOTES[Math.floor(Math.random() * STOIC_QUOTES.length)]);

    const finalScore = e.score;
    setUiScore(finalScore);
    setBestScore((b) => Math.max(b, finalScore));

    if (!activeProfile) return;
    setIsSubmitting(true);
    try {
      const xpEarned = Math.min(85, 12 + Math.floor(finalScore * 0.35) + e.level * 15);
      const wisdomEarned = Math.min(50, 6 + e.powersCollected * 4);
      const courageEarned = Math.min(40, 4 + e.totalBricksDestroyed);

      await addGameXP(activeProfile.id, "esfera_logos", finalScore, xpEarned);
      await addVirtueXP(activeProfile.id, "wisdom", wisdomEarned);
      await addVirtueXP(activeProfile.id, "courage", courageEarned);

      setLastReward({ xp: xpEarned, wisdom: wisdomEarned, courage: courageEarned });

      // Logros
      if (e.level >= 2) await unlockAchievement(activeProfile.id, "logos_1");
      if (e.totalBricksDestroyed >= 40) await unlockAchievement(activeProfile.id, "logos_2");
      if (e.level >= 4) await unlockAchievement(activeProfile.id, "logos_3");
      if (e.combo >= 8) await unlockAchievement(activeProfile.id, "logos_combo");
      if (e.powersCollected >= 5) await unlockAchievement(activeProfile.id, "logos_powers");

      refreshProfile();
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar recompensas.");
    } finally {
      setIsSubmitting(false);
    }
  }, [activeProfile, refreshProfile]);

  const handleLevelClear = useCallback(() => {
    const e = engine.current;
    soundFX.victory();
    confetti({ particleCount: 90, spread: 80, origin: { y: 0.45 } });
    setGameState("level_cleared");

    if (e.level === 1) {
      if (activeProfile) unlockAchievement(activeProfile.id, "logos_1");
    }
  }, [activeProfile]);

  // ─── Loop de Renderizado ──────────────────────────────────────────

  const draw = useCallback((ctx: CanvasRenderingContext2D, dt: number) => {
    const e = engine.current;

    // Fondo del Templo
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, "#090d16");
    bgGrad.addColorStop(0.5, "#0f172a");
    bgGrad.addColorStop(1, "#020617");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Decoración arquitectónica clásica (columnas laterales y arquitrabe)
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, W - 20, H - 20);

    // ── Suelo Protector de Atenas (Barrera activa) ──
    if (e.timers.barrier > 0) {
      const barrierPulse = 0.6 + Math.sin(performance.now() / 120) * 0.3;
      ctx.save();
      ctx.strokeStyle = `rgba(251, 191, 36, ${barrierPulse})`;
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 12;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(12, H - 18);
      ctx.lineTo(W - 12, H - 18);
      ctx.stroke();
      ctx.restore();
    }

    // ── Dibujar Bloques ──
    e.bricks.forEach((b) => {
      ctx.save();
      const bGrad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
      bGrad.addColorStop(0, b.color);
      bGrad.addColorStop(1, "#0f172a");
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 6);
      ctx.fill();

      // Borde
      ctx.strokeStyle = b.hitsLeft > 1 ? "#ffffff" : "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Si tiene 2 golpes y ya recibió 1: grietas de razón
      if (b.hitsLeft === 1 && b.hitsMax === 2) {
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.beginPath();
        ctx.moveTo(b.x + b.w * 0.3, b.y + 4);
        ctx.lineTo(b.x + b.w * 0.5, b.y + b.h * 0.6);
        ctx.lineTo(b.x + b.w * 0.7, b.y + b.h - 4);
        ctx.stroke();
      }

      // Etiqueta
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px var(--font-display, sans-serif)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2);
      ctx.restore();
    });

    // ── Dibujar Poderes que caen ──
    e.powers.forEach((p) => {
      ctx.save();
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 16);
      glow.addColorStop(0, p.color);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = "18px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.icon, p.x, p.y);
      ctx.restore();
    });

    // ── Partículas / Chispas del Logos ──
    e.sparks.forEach((s) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, s.life);
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // ── Textos Flotantes ──
    e.floatTexts.forEach((ft) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.font = "bold 13px var(--font-display, sans-serif)";
      ctx.fillStyle = ft.color;
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    // ── Guía Láser de la Prudencia ──
    if (e.timers.slow > 0 && e.balls[0]) {
      const b = e.balls[0];
      ctx.save();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x + b.vx * 0.35, b.y + b.vy * 0.35);
      ctx.stroke();
      ctx.restore();
    }

    // ── Dibujar Esferas del Logos ──
    e.balls.forEach((b) => {
      ctx.save();
      // Estela
      const auraColor = b.isFire ? "rgba(249, 115, 22, 0.9)" : "rgba(251, 191, 36, 0.9)";
      const aura = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius * 2.5);
      aura.addColorStop(0, auraColor);
      aura.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Núcleo
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // ── Dibujar la Paleta (El Escudo de la Razón) ──
    const py = H - 38;
    const px = e.paddleX;
    const pw = e.paddleW;

    ctx.save();
    // Brillo si Templanza está activa
    if (e.timers.wide > 0) {
      ctx.shadowColor = "#10b981";
      ctx.shadowBlur = 14;
    }

    // Mármol de base
    const pGrad = ctx.createLinearGradient(px, py, px + pw, py);
    pGrad.addColorStop(0, "#d4af37");
    pGrad.addColorStop(0.2, "#fdf6e2");
    pGrad.addColorStop(0.5, "#e6c35c");
    pGrad.addColorStop(0.8, "#fdf6e2");
    pGrad.addColorStop(1, "#b38f24");
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.roundRect(px, py, pw, PADDLE_H, 8);
    ctx.fill();

    // Ribete de bronce
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Símbolo del Logos en el centro de la paleta
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🏛️ LOGOS", px + pw / 2, py + PADDLE_H / 2);
    ctx.restore();
  }, []);

  // ─── Loop de Física y Colisiones ──────────────────────────────────

  const step = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dt = Math.min(0.033, (time - lastTimeRef.current) / 1000 || 0);
      lastTimeRef.current = time;
      const e = engine.current;

      if (e.running) {
        // Suavizado del movimiento de la paleta
        e.paddleX += (e.paddleTargetX - e.paddleX) * Math.min(1, dt * 22);
        e.paddleX = Math.max(14, Math.min(W - e.paddleW - 14, e.paddleX));

        // Actualizar temporizadores de poderes
        Object.keys(e.timers).forEach((k) => {
          const key = k as keyof typeof e.timers;
          if (e.timers[key] > 0) {
            e.timers[key] = Math.max(0, e.timers[key] - dt);
            if (e.timers[key] === 0) {
              if (key === "wide") e.paddleW = BASE_PADDLE_W;
              if (key === "fire") e.balls.forEach((b) => (b.isFire = false));
            }
          }
        });

        // Actualizar estado de poderes para la UI
        setActivePowers({
          wide: e.timers.wide > 0,
          fire: e.timers.fire > 0,
          barrier: e.timers.barrier > 0,
          slow: e.timers.slow > 0,
        });

        const speedMod = e.timers.slow > 0 ? 0.7 : 1.0;

        // Actualizar esferas
        for (let i = e.balls.length - 1; i >= 0; i--) {
          const b = e.balls[i];
          b.x += b.vx * speedMod * dt;
          b.y += b.vy * speedMod * dt;

          // Colisión con paredes izquierda / derecha
          if (b.x - b.radius < 14) {
            b.x = 14 + b.radius;
            b.vx = Math.abs(b.vx);
            soundFX.paddleHit();
          } else if (b.x + b.radius > W - 14) {
            b.x = W - 14 - b.radius;
            b.vx = -Math.abs(b.vx);
            soundFX.paddleHit();
          }

          // Techo
          if (b.y - b.radius < 14) {
            b.y = 14 + b.radius;
            b.vy = Math.abs(b.vy);
            soundFX.paddleHit();
          }

          // Colisión con la Paleta (El Escudo de la Razón)
          const py = H - 38;
          if (
            b.y + b.radius >= py &&
            b.y - b.radius <= py + PADDLE_H &&
            b.x >= e.paddleX - 4 &&
            b.x <= e.paddleX + e.paddleW + 4 &&
            b.vy > 0
          ) {
            e.combo = 0; // Reinicia el combo al tocar la paleta
            soundFX.paddleHit();

            // Ángulo dinámico según punto de impacto en la paleta
            const hitOffset = (b.x - (e.paddleX + e.paddleW / 2)) / (e.paddleW / 2);
            const clampedOffset = Math.max(-0.85, Math.min(0.85, hitOffset));
            const currentSpeed = b.isFire ? FIRE_BALL_SPEED : BASE_BALL_SPEED;

            b.vx = clampedOffset * currentSpeed * 1.1;
            b.vy = -Math.sqrt(Math.max(10000, currentSpeed * currentSpeed - b.vx * b.vx));

            // Chispas
            for (let k = 0; k < 5; k++) {
              e.sparks.push({
                x: b.x,
                y: py,
                vx: (Math.random() - 0.5) * 120,
                vy: -Math.random() * 80,
                life: 0.6,
                color: "#fbbf24",
                size: 2.5,
              });
            }
          }

          // Colisión con Suelo Protector de Atenas (Barrera)
          if (e.timers.barrier > 0 && b.y + b.radius >= H - 18 && b.vy > 0) {
            b.y = H - 18 - b.radius;
            b.vy = -Math.abs(b.vy);
            soundFX.laserBarrier();
            e.floatTexts.push({ x: b.x, y: H - 35, text: "🛡️ ¡Suelo Atenas!", color: "#fbbf24", life: 0.9 });
          }

          // Caída al fondo (Muerte de la esfera)
          if (b.y - b.radius > H) {
            e.balls.splice(i, 1);
          }
        }

        // Si se perdieron todas las esferas
        if (e.balls.length === 0) {
          e.lives -= 1;
          setLives(e.lives);
          setShake(true);
          setTimeout(() => setShake(false), 250);

          if (e.lives <= 0) {
            triggerGameOver();
          } else {
            // Respawn de esfera con barrera protectora de regalo
            soundFX.distractionBump();
            e.timers.barrier = 6;
            e.balls.push({
              x: W / 2,
              y: H - 70,
              vx: (Math.random() > 0.5 ? 1 : -1) * (BASE_BALL_SPEED * 0.6),
              vy: -BASE_BALL_SPEED * 0.8,
              radius: BALL_RADIUS,
              isFire: false,
            });
            e.floatTexts.push({ x: W / 2, y: H / 2, text: "❤️ ¡Paz Mental Restaurada!", color: "#f87171", life: 1.2 });
          }
        }

        // Colisión de Esferas con Bloques
        e.balls.forEach((b) => {
          for (let i = e.bricks.length - 1; i >= 0; i--) {
            const br = e.bricks[i];

            // AABB vs Círculo
            const closestX = Math.max(br.x, Math.min(b.x, br.x + br.w));
            const closestY = Math.max(br.y, Math.min(b.y, br.y + br.h));
            const dx = b.x - closestX;
            const dy = b.y - closestY;

            if (dx * dx + dy * dy < b.radius * b.radius) {
              // Impacto
              br.hitsLeft -= b.isFire ? 2 : 1;
              e.combo += 1;
              soundFX.brickHit(e.combo);

              // Rebote (si no es bola de fuego atravesadora)
              if (!b.isFire) {
                const prevX = b.x - b.vx * dt;
                const prevY = b.y - b.vy * dt;
                if (prevX < br.x || prevX > br.x + br.w) b.vx = -b.vx;
                else b.vy = -b.vy;
              }

              // Puntos
              const pts = 10 * e.combo;
              e.score += pts;
              setUiScore(e.score);

              // Destrucción del bloque
              if (br.hitsLeft <= 0) {
                e.totalBricksDestroyed += 1;
                e.bricks.splice(i, 1);

                // Soltar poder
                dropPowerUp(br.x + br.w / 2, br.y + br.h / 2, br.type === "prisma");

                // Partículas de demolición
                for (let k = 0; k < 6; k++) {
                  e.sparks.push({
                    x: br.x + br.w / 2,
                    y: br.y + br.h / 2,
                    vx: (Math.random() - 0.5) * 160,
                    vy: (Math.random() - 0.5) * 160,
                    life: 0.7,
                    color: br.color,
                    size: 3,
                  });
                }
              }
              break;
            }
          }
        });

        // Verificar si el nivel fue completado
        if (e.bricks.length === 0) {
          handleLevelClear();
        }

        // Mover y recolectar Poderes
        for (let i = e.powers.length - 1; i >= 0; i--) {
          const p = e.powers[i];
          p.y += p.vy * dt;

          const py = H - 38;
          // Colisión con la paleta
          if (
            p.y >= py - 8 &&
            p.y <= py + PADDLE_H + 8 &&
            p.x >= e.paddleX - 6 &&
            p.x <= e.paddleX + e.paddleW + 6
          ) {
            soundFX.powerupCollect();
            e.powersCollected += 1;
            e.floatTexts.push({ x: p.x, y: py - 20, text: `✨ ${p.label}`, color: p.color, life: 1.3 });

            // Aplicar efecto
            if (p.type === "wide") {
              e.timers.wide = 14;
              e.paddleW = WIDE_PADDLE_W;
            } else if (p.type === "multiball") {
              if (e.balls[0]) {
                const b0 = e.balls[0];
                e.balls.push(
                  { x: b0.x, y: b0.y, vx: b0.vx * 0.8 - 100, vy: b0.vy, radius: BALL_RADIUS, isFire: b0.isFire },
                  { x: b0.x, y: b0.y, vx: b0.vx * 0.8 + 100, vy: b0.vy, radius: BALL_RADIUS, isFire: b0.isFire }
                );
              }
            } else if (p.type === "slow_laser") {
              e.timers.slow = 12;
            } else if (p.type === "barrier") {
              e.timers.barrier = 14;
            } else if (p.type === "fire") {
              e.timers.fire = 10;
              e.balls.forEach((b) => (b.isFire = true));
            }

            e.powers.splice(i, 1);
          } else if (p.y > H + 20) {
            e.powers.splice(i, 1);
          }
        }

        // Actualizar partículas y textos flotantes
        e.sparks.forEach((s) => {
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.life -= dt * 1.5;
        });
        e.sparks = e.sparks.filter((s) => s.life > 0);

        e.floatTexts.forEach((ft) => {
          ft.y -= 30 * dt;
          ft.life -= dt * 0.9;
        });
        e.floatTexts = e.floatTexts.filter((ft) => ft.life > 0);
      }

      draw(ctx, dt);
      rafRef.current = requestAnimationFrame(step);
    },
    [draw, dropPowerUp, handleLevelClear, triggerGameOver]
  );

  useEffect(() => {
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [step]);

  // Manejo de Movimiento de la Paleta (Mouse / Touch / Teclado)
  useEffect(() => {
    const handleKeyDown = (ev: KeyboardEvent) => {
      const e = engine.current;
      const stepDist = 36;
      if (ev.code === "ArrowLeft" || ev.code === "KeyA") {
        e.paddleTargetX = Math.max(14, e.paddleTargetX - stepDist);
      } else if (ev.code === "ArrowRight" || ev.code === "KeyD") {
        e.paddleTargetX = Math.min(W - e.paddleW - 14, e.paddleTargetX + stepDist);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handlePointerMove = (ev: React.PointerEvent<HTMLDivElement>) => {
    const rect = ev.currentTarget.getBoundingClientRect();
    const clientX = ev.clientX - rect.left;
    const canvasX = (clientX / rect.width) * W;
    const e = engine.current;
    e.paddleTargetX = canvasX - e.paddleW / 2;
  };

  const handleStartGame = () => {
    initLevel(1, false);
    engine.current.running = true;
    setGameState("playing");
    soundFX.startAmbientMusic();
  };

  const handleNextLevel = () => {
    const nextLvl = currentLevel + 1;
    initLevel(nextLvl, true);
    engine.current.running = true;
    setGameState("playing");
  };

  const handleRetry = () => {
    initLevel(1, false);
    engine.current.running = true;
    setGameState("playing");
    setLastReward(null);
  };

  const toggleSfx = () => {
    const isM = soundFX.toggleSfx();
    setSfxMuted(isM);
    toast.info(isM ? "Efectos silenciados" : "Efectos activados 🔊");
  };

  const toggleMusic = () => {
    const isM = soundFX.toggleMusic();
    setMusicMuted(isM);
    toast.info(isM ? "Música silenciada" : "Música ambiental activada 🎵");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#0b1120" }}>
      {/* Header */}
      <div
        className="main-header"
        style={{
          marginLeft: -24,
          marginRight: -24,
          marginTop: -24,
          marginBottom: 18,
          padding: "16px 24px",
          background: "#1e293b",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>ACADEMIA ESTOICA</div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>Sala de Entrenamiento · La Esfera del Logos</div>
        </div>

        {/* Audio Controls */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={toggleSfx}
            title={sfxMuted ? "Activar Efectos" : "Silenciar Efectos"}
            style={{
              background: sfxMuted ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "white",
              padding: "8px 12px",
              borderRadius: 10,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
            }}
          >
            {sfxMuted ? <VolumeX size={16} color="#f87171" /> : <Volume2 size={16} color="#38bdf8" />}
            <span>SFX</span>
          </button>

          <button
            onClick={toggleMusic}
            title={musicMuted ? "Activar Música" : "Silenciar Música"}
            style={{
              background: musicMuted ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "white",
              padding: "8px 12px",
              borderRadius: 10,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
            }}
          >
            <Music size={16} color={musicMuted ? "#f87171" : "#fbbf24"} />
            <span>Música</span>
          </button>
        </div>
      </div>

      <div style={{ padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/juegos" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, color: "#94a3b8", fontSize: 13, marginBottom: 12 }}>
          ← Volver a los Juegos
        </Link>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "0 16px 32px",
          animation: shake ? "logosShake 0.25s ease" : "none",
        }}
      >
        <style>{`
          @keyframes logosShake {
            0%, 100% { transform: translate(0,0); }
            25% { transform: translate(-5px, 3px); }
            50% { transform: translate(5px, -3px); }
            75% { transform: translate(-3px, 2px); }
          }
        `}</style>

        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 460,
            aspectRatio: `${W} / ${H}`,
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            border: "3px solid #334155",
            userSelect: "none",
          }}
          onPointerMove={handlePointerMove}
        >
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            style={{ width: "100%", height: "100%", display: "block", touchAction: "none", cursor: "ew-resize" }}
          />

          {/* HUD Superior */}
          {gameState === "playing" && (
            <div
              style={{
                position: "absolute",
                top: 14,
                left: 18,
                right: 18,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                pointerEvents: "none",
              }}
            >
              {/* Vidas */}
              <div style={{ display: "flex", gap: 4 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <span key={i} style={{ fontSize: 18, opacity: i < lives ? 1 : 0.25 }}>
                    ❤️
                  </span>
                ))}
              </div>

              {/* Nivel */}
              <div
                style={{
                  background: "rgba(15,23,42,0.6)",
                  border: "1px solid rgba(251,191,36,0.3)",
                  borderRadius: 12,
                  padding: "4px 12px",
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#fbbf24",
                }}
              >
                Nivel {currentLevel}
              </div>

              {/* Puntaje */}
              <div className="font-display" style={{ fontSize: 22, fontWeight: 900, color: "white" }}>
                {uiScore}
              </div>
            </div>
          )}

          {/* HUD de Poderes Activos */}
          {gameState === "playing" && (
            <div
              style={{
                position: "absolute",
                bottom: 50,
                left: 18,
                display: "flex",
                gap: 6,
                pointerEvents: "none",
              }}
            >
              {activePowers.wide && <span style={{ background: "rgba(16,185,129,0.2)", border: "1px solid #10b981", borderRadius: 8, padding: "2px 6px", fontSize: 11, color: "#10b981" }}>🛡️ Templanza</span>}
              {activePowers.fire && <span style={{ background: "rgba(249,115,22,0.2)", border: "1px solid #f97316", borderRadius: 8, padding: "2px 6px", fontSize: 11, color: "#f97316" }}>🔥 Fuego</span>}
              {activePowers.barrier && <span style={{ background: "rgba(251,191,36,0.2)", border: "1px solid #fbbf24", borderRadius: 8, padding: "2px 6px", fontSize: 11, color: "#fbbf24" }}>⚖️ Barrera</span>}
              {activePowers.slow && <span style={{ background: "rgba(56,189,248,0.2)", border: "1px solid #38bdf8", borderRadius: 8, padding: "2px 6px", fontSize: 11, color: "#38bdf8" }}>🦉 Prudencia</span>}
            </div>
          )}

          {/* Pantalla de Inicio */}
          <AnimatePresence>
            {gameState === "start" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(15,23,42,0.85)",
                  backdropFilter: "blur(4px)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: 24,
                  color: "white",
                }}
              >
                <div style={{ fontSize: 50, marginBottom: 6 }}>✨</div>
                <h2 className="font-display" style={{ fontSize: 26, fontWeight: 900, marginBottom: 6, color: "#fbbf24" }}>
                  La Esfera del Logos
                </h2>
                <p style={{ fontSize: 12.5, color: "#94a3b8", maxWidth: 300, marginBottom: 16, fontStyle: "italic" }}>
                  “Usa la luz de la razón para derribar los muros de las falsas creencias.”
                </p>

                <div
                  style={{
                    background: "rgba(30, 41, 59, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: 14,
                    padding: "12px 16px",
                    maxWidth: 320,
                    marginBottom: 20,
                    textAlign: "left",
                    fontSize: 12,
                    color: "#cbd5e1",
                    lineHeight: 1.5,
                  }}
                >
                  <div style={{ marginBottom: 4 }}>🕹️ <strong>Mueve el ratón o usa A/D / Flechas</strong> para controlar el Escudo de la Razón.</div>
                  <div style={{ marginBottom: 4 }}>💎 Atrapa los <strong>Poderes Estoicos</strong> que caen de los bloques.</div>
                  <div>⚖️ Golpea con las esquinas de la paleta para apuntar en ángulo.</div>
                </div>

                <button
                  onClick={handleStartGame}
                  style={{
                    background: "linear-gradient(135deg, #fbbf24, #d97706)",
                    color: "#0f172a",
                    border: "none",
                    borderRadius: 14,
                    padding: "12px 28px",
                    fontSize: 14,
                    fontWeight: 900,
                    cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(245, 158, 11, 0.35)",
                  }}
                >
                  ¡Iniciar Entrenamiento! 🚀
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pantalla de Nivel Completado */}
          <AnimatePresence>
            {gameState === "level_cleared" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(15,23,42,0.88)",
                  backdropFilter: "blur(4px)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: 24,
                  color: "white",
                }}
              >
                <div style={{ fontSize: 46, marginBottom: 6 }}>🏛️</div>
                <h3 className="font-display" style={{ fontSize: 24, fontWeight: 900, color: "#fbbf24", marginBottom: 4 }}>
                  ¡Templo Despejado!
                </h3>
                <p style={{ fontSize: 13, color: "#cbd5e1", marginBottom: 16 }}>
                  Has superado el Nivel {currentLevel}. Las falsas creencias se han disuelto.
                </p>

                <div className="font-display" style={{ fontSize: 32, fontWeight: 900, color: "white", marginBottom: 20 }}>
                  Puntaje: {uiScore}
                </div>

                <button
                  onClick={handleNextLevel}
                  style={{
                    background: "linear-gradient(135deg, #fbbf24, #d97706)",
                    color: "#0f172a",
                    border: "none",
                    borderRadius: 12,
                    padding: "12px 24px",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Siguiente Templo ➔
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pantalla de Derrota */}
          <AnimatePresence>
            {gameState === "dead" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(15,23,42,0.88)",
                  backdropFilter: "blur(4px)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: 24,
                  color: "white",
                }}
              >
                <div style={{ fontSize: 42, marginBottom: 4 }}>🧘</div>
                <h3 className="font-display" style={{ fontSize: 24, fontWeight: 900, color: "#fbbf24", marginBottom: 4 }}>
                  Fin del Entrenamiento
                </h3>
                <div className="font-display" style={{ fontSize: 38, fontWeight: 900, color: "white", margin: "4px 0" }}>
                  {uiScore}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
                  Mejor puntaje: {bestScore}
                </div>

                <p style={{ fontSize: 12.5, color: "#e2e8f0", fontStyle: "italic", lineHeight: 1.5, maxWidth: 300, marginBottom: 14 }}>
                  {quote}
                </p>

                {lastReward && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", justifyContent: "center" }}>
                    <span style={{ background: "linear-gradient(135deg,#fbbf24,#d97706)", color: "#1e293b", padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
                      🌟 +{lastReward.xp} XP
                    </span>
                    <span style={{ background: "linear-gradient(135deg,#eab308,#a16207)", color: "white", padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
                      🦉 +{lastReward.wisdom} Sabiduría
                    </span>
                    <span style={{ background: "linear-gradient(135deg,#ef4444,#b91c1c)", color: "white", padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
                      🦁 +{lastReward.courage} Fortaleza
                    </span>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={handleRetry}
                    disabled={isSubmitting}
                    style={{
                      background: "linear-gradient(135deg,#fbbf24,#d97706)",
                      color: "#1e293b",
                      border: "none",
                      borderRadius: 12,
                      padding: "12px 22px",
                      fontWeight: 800,
                      fontSize: 14,
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                    }}
                  >
                    🔄 Intentar de nuevo
                  </button>
                  <Link href="/juegos" style={{ textDecoration: "none" }}>
                    <button
                      style={{
                        background: "#334155",
                        color: "white",
                        border: "none",
                        borderRadius: 12,
                        padding: "12px 22px",
                        fontWeight: 800,
                        fontSize: 14,
                        cursor: "pointer",
                      }}
                    >
                      Salir
                    </button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p style={{ color: "#64748b", fontSize: 12, marginTop: 14, textAlign: "center", maxWidth: 460 }}>
          💡 <em>Tip Estoico:</em> Romper bloques en cadena sin tocar la paleta desata combos y melodías de mayor puntaje.
        </p>
      </div>
    </div>
  );
}
