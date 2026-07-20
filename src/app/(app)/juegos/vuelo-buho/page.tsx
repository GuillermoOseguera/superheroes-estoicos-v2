"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import Link from "next/link";
import { toast } from "sonner";
import { useProfile } from "@/lib/profile-store";
import { addGameXP, addVirtueXP, unlockAchievement } from "@/lib/supabase";

// ─── Constantes de Física y Diseño ──────────────────────────────────────────

const W = 400; // Resolución interna del canvas
const H = 640;
const GRAVITY = 1500;
const FLAP_VELOCITY = -420;
const MAX_FALL_SPEED = 620;
const OWL_X = W * 0.28;
const OWL_RADIUS = 20;
const PILLAR_WIDTH = 66;
const BASE_GAP = 190;
const MIN_GAP = 148;
const BASE_PILLAR_SPEED = 165;

const STOIC_QUOTES = [
  "“El impedimento a la acción avanza la acción. Lo que se interpone en el camino, se convierte en el camino.” — Marco Aurelio",
  "“No es que tengamos poco tiempo, sino que perdemos mucho.” — Séneca",
  "“La dificultad muestra al hombre.” — Epicteto",
  "“Caíste. Eso no importa. Lo que importa es que vuelvas a levantar el vuelo.” — Sabiduría del Búho",
  "“No busques que las cosas sucedan como quieres, sino desea que sucedan como suceden.” — Epicteto",
  "“Cada intento fallido es información, no fracaso.” — Academia Estoica",
];

interface Pillar {
  x: number;
  gapY: number; // centro del hueco
  gap: number;
  passed: boolean;
}

interface Orb {
  x: number;
  y: number;
  taken: boolean;
  bob: number;
}

interface Distraction {
  x: number;
  y: number;
  emoji: string;
  taken: boolean;
  bob: number;
}

interface Feather {
  x: number; y: number; vx: number; vy: number; life: number; rot: number;
}

interface Burst {
  x: number; y: number; vx: number; vy: number; life: number; color: string; size: number;
}

const DISTRACTION_EMOJIS = ["📱", "🍬", "💭", "👾"];

// Paletas de cielo que van cambiando según la distancia recorrida (sensación de "viaje")
const SKY_PALETTES = [
  { top: "#7dd3fc", bottom: "#e0f2fe", mountain: "#5b8fb0", name: "Amanecer" },
  { top: "#38bdf8", bottom: "#bae6fd", mountain: "#3f7ea6", name: "Día Claro" },
  { top: "#fb923c", bottom: "#fde68a", mountain: "#9a5b3f", name: "Atardecer" },
  { top: "#312e81", bottom: "#818cf8", mountain: "#2e2a5c", name: "Crepúsculo" },
  { top: "#0f172a", bottom: "#334155", mountain: "#1e2438", name: "Noche Estrellada" },
];

function lerpColor(c1: string, c2: string, t: number): string {
  const a = parseInt(c1.slice(1), 16);
  const b = parseInt(c2.slice(1), 16);
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

export default function VueloBuhoPage() {
  const { activeProfile, refreshProfile } = useProfile();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"start" | "playing" | "dead">("start");
  const [uiScore, setUiScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastReward, setLastReward] = useState<{ xp: number; wisdom: number } | null>(null);
  const [quote, setQuote] = useState(STOIC_QUOTES[0]);
  const [shake, setShake] = useState(false);

  // Estado mutable del motor (evita renders por frame)
  const engine = useRef({
    owlY: H * 0.4,
    owlV: 0,
    owlRot: 0,
    pillars: [] as Pillar[],
    orbs: [] as Orb[],
    distractions: [] as Distraction[],
    feathers: [] as Feather[],
    bursts: [] as Burst[],
    score: 0,
    orbsCollected: 0,
    distance: 0,
    running: false,
    lastSpawnX: 0,
    stars: Array.from({ length: 40 }, () => ({ x: Math.random() * W, y: Math.random() * H * 0.6, r: Math.random() * 1.6 + 0.4, tw: Math.random() * Math.PI * 2 })),
  });

  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // ─── Ciclo de vida ─────────────────────────────────────────────────

  const resetEngine = useCallback(() => {
    const e = engine.current;
    e.owlY = H * 0.4;
    e.owlV = 0;
    e.owlRot = 0;
    e.pillars = [{ x: W + 120, gapY: H * 0.45, gap: BASE_GAP, passed: false }];
    e.orbs = [];
    e.distractions = [];
    e.feathers = [];
    e.bursts = [];
    e.score = 0;
    e.orbsCollected = 0;
    e.distance = 0;
    e.lastSpawnX = W + 120;
  }, []);

  const flap = useCallback(() => {
    const e = engine.current;
    if (gameState === "start") {
      resetEngine();
      e.running = true;
      setGameState("playing");
      setUiScore(0);
    }
    if (gameState === "dead") return;
    e.owlV = FLAP_VELOCITY;
    // Partículas de plumas
    for (let i = 0; i < 4; i++) {
      e.feathers.push({
        x: OWL_X - 10,
        y: e.owlY + 6,
        vx: -80 - Math.random() * 60,
        vy: (Math.random() - 0.5) * 80,
        life: 1,
        rot: Math.random() * Math.PI,
      });
    }
  }, [gameState, resetEngine]);

  const triggerDeath = useCallback(async () => {
    const e = engine.current;
    e.running = false;
    setShake(true);
    setTimeout(() => setShake(false), 350);
    setGameState("dead");
    setQuote(STOIC_QUOTES[Math.floor(Math.random() * STOIC_QUOTES.length)]);
    setAttempt((a) => a + 1);

    const finalScore = e.score;
    setUiScore(finalScore);
    setBestScore((b) => Math.max(b, finalScore));

    if (!activeProfile) return;
    setIsSubmitting(true);
    try {
      const xpEarned = Math.min(70, 8 + finalScore * 2 + e.orbsCollected);
      const wisdomEarned = Math.min(40, 3 + e.orbsCollected * 3);
      await addGameXP(activeProfile.id, "vuelo_buho", finalScore, xpEarned);
      await addVirtueXP(activeProfile.id, "wisdom", wisdomEarned);
      setLastReward({ xp: xpEarned, wisdom: wisdomEarned });

      if (finalScore >= 10) await unlockAchievement(activeProfile.id, "buho_1");
      if (finalScore >= 25) await unlockAchievement(activeProfile.id, "buho_2");
      if (finalScore >= 50) await unlockAchievement(activeProfile.id, "buho_3");
      if (finalScore >= 100) await unlockAchievement(activeProfile.id, "buho_max");

      if (finalScore > 0 && finalScore % 20 === 0) {
        confetti({ particleCount: 140, spread: 100, origin: { y: 0.4 } });
      }
      refreshProfile();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo guardar tu progreso.");
    } finally {
      setIsSubmitting(false);
    }
  }, [activeProfile, refreshProfile]);

  const spawnPillarIfNeeded = useCallback(() => {
    const e = engine.current;
    const SPACING = 240;
    if (e.lastSpawnX < W + 500) {
      const difficulty = Math.min(1, e.score / 30);
      const gap = BASE_GAP - (BASE_GAP - MIN_GAP) * difficulty;
      const margin = 90;
      const gapY = margin + Math.random() * (H - margin * 2 - 120);
      const x = e.lastSpawnX + SPACING;
      e.pillars.push({ x, gapY, gap, passed: false });

      // Orbe de sabiduría en el hueco (70% de las veces)
      if (Math.random() < 0.7) {
        e.orbs.push({ x, y: gapY, taken: false, bob: Math.random() * Math.PI * 2 });
      } else if (Math.random() < 0.5) {
        e.distractions.push({
          x,
          y: gapY + (Math.random() - 0.5) * 50,
          emoji: DISTRACTION_EMOJIS[Math.floor(Math.random() * DISTRACTION_EMOJIS.length)],
          taken: false,
          bob: Math.random() * Math.PI * 2,
        });
      }
      e.lastSpawnX = x;
    }
  }, []);

  // ─── Loop principal ────────────────────────────────────────────────

  const draw = useCallback((ctx: CanvasRenderingContext2D, dt: number) => {
    const e = engine.current;
    const speed = BASE_PILLAR_SPEED + Math.min(140, e.score * 3);

    // Paleta según distancia
    const phaseF = Math.min(SKY_PALETTES.length - 1.001, e.distance / 3200);
    const phaseIdx = Math.floor(phaseF);
    const phaseT = phaseF - phaseIdx;
    const pa = SKY_PALETTES[phaseIdx];
    const pb = SKY_PALETTES[Math.min(SKY_PALETTES.length - 1, phaseIdx + 1)];
    const skyTop = lerpColor(pa.top, pb.top, phaseT);
    const skyBottom = lerpColor(pa.bottom, pb.bottom, phaseT);
    const mountainColor = lerpColor(pa.mountain, pb.mountain, phaseT);
    const isNight = phaseF > 3.3;

    // ── Cielo ──
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, skyTop);
    grad.addColorStop(1, skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Estrellas (solo de noche)
    if (isNight) {
      ctx.save();
      e.stars.forEach((s) => {
        const alpha = 0.4 + Math.sin(performance.now() / 500 + s.tw) * 0.4;
        ctx.fillStyle = `rgba(255,255,255,${Math.max(0, alpha)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // Sol/Luna
    const sunX = W - 70;
    const sunY = 90 + phaseF * 8;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = isNight ? "#f8fafc" : phaseF > 2 ? "#fde68a" : "#fef9c3";
    ctx.shadowColor = ctx.fillStyle as string;
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Montañas lejanas (parallax lento)
    ctx.fillStyle = mountainColor;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.62);
    const mParallax = (e.distance * 0.15) % 160;
    for (let x = -160; x <= W + 160; x += 80) {
      const px = x - mParallax;
      ctx.lineTo(px, H * 0.62 - Math.abs(Math.sin(px * 0.01)) * 70 - 30);
    }
    ctx.lineTo(W, H * 0.62);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    // Nubes (parallax medio)
    ctx.fillStyle = isNight ? "rgba(148,163,184,0.25)" : "rgba(255,255,255,0.75)";
    const cParallax = (e.distance * 0.35) % (W + 200);
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 180 - cParallax) % (W + 200)) - 100;
      const cy = 60 + (i % 2) * 90;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 34, 16, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 24, cy + 4, 24, 13, 0, 0, Math.PI * 2);
      ctx.ellipse(cx - 22, cy + 6, 22, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Suelo decorativo (línea de base) ──
    const groundY = H - 10;

    // ── Columnas (obstáculos) ──
    e.pillars.forEach((p) => {
      const topH = p.gapY - p.gap / 2;
      const botY = p.gapY + p.gap / 2;
      const botH = H - botY;

      [
        { y: 0, h: topH, flip: true },
        { y: botY, h: botH, flip: false },
      ].forEach(({ y, h, flip }) => {
        if (h <= 0) return;
        const pg = ctx.createLinearGradient(p.x, 0, p.x + PILLAR_WIDTH, 0);
        pg.addColorStop(0, "#e7e0d0");
        pg.addColorStop(0.15, "#f8f4e8");
        pg.addColorStop(0.5, "#d9d0b8");
        pg.addColorStop(0.85, "#f8f4e8");
        pg.addColorStop(1, "#c9bfa0");
        ctx.fillStyle = pg;
        ctx.fillRect(p.x, y, PILLAR_WIDTH, h);

        // Estrías (flutes)
        ctx.strokeStyle = "rgba(120,110,80,0.25)";
        ctx.lineWidth = 2;
        for (let fx = p.x + 8; fx < p.x + PILLAR_WIDTH - 4; fx += 9) {
          ctx.beginPath();
          ctx.moveTo(fx, y);
          ctx.lineTo(fx, y + h);
          ctx.stroke();
        }

        // Capitel (decoración en el extremo hacia el hueco)
        const capY = flip ? y + h - 16 : y;
        ctx.fillStyle = "#b8ac88";
        ctx.fillRect(p.x - 6, capY, PILLAR_WIDTH + 12, 16);
        ctx.fillStyle = "#8f8360";
        ctx.fillRect(p.x - 6, capY + (flip ? 0 : 12), PILLAR_WIDTH + 12, 4);

        // Sombra hacia el hueco
        const shadowGrad = ctx.createLinearGradient(0, flip ? capY - 20 : capY + 16, 0, flip ? capY : capY + 36);
        shadowGrad.addColorStop(0, "rgba(0,0,0,0)");
        shadowGrad.addColorStop(1, "rgba(0,0,0,0.25)");
        ctx.fillStyle = shadowGrad;
        ctx.fillRect(p.x - 6, flip ? capY - 20 : capY + 16, PILLAR_WIDTH + 12, 20);
      });
    });

    // ── Orbes de sabiduría ──
    e.orbs.forEach((o) => {
      if (o.taken) return;
      const bobY = o.y + Math.sin(performance.now() / 300 + o.bob) * 6;
      const glow = ctx.createRadialGradient(o.x, bobY, 0, o.x, bobY, 18);
      glow.addColorStop(0, "rgba(253,224,71,0.9)");
      glow.addColorStop(1, "rgba(253,224,71,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(o.x, bobY, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "22px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("\u{1F4D6}", o.x, bobY);
    });

    // ── Distracciones ──
    e.distractions.forEach((d) => {
      if (d.taken) return;
      const bobY = d.y + Math.sin(performance.now() / 260 + d.bob) * 8;
      ctx.font = "24px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.fillText(d.emoji, d.x, bobY);
      ctx.restore();
    });

    // ── Plumas ──
    e.feathers.forEach((f) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);
      ctx.fillStyle = "#d97706";
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // ── Ráfagas de impacto ──
    e.bursts.forEach((b) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, b.life);
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // ── Búho ──
    ctx.save();
    ctx.translate(OWL_X, e.owlY);
    ctx.rotate(e.owlRot);

    // Sombra
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(2, OWL_RADIUS + 6, OWL_RADIUS * 0.8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Alas (detrás del cuerpo)
    const flapPhase = Math.sin(performance.now() / 90) * 0.5 + (e.owlV < 0 ? 0.5 : 0);
    ctx.fillStyle = "#7c4a1e";
    ctx.beginPath();
    ctx.ellipse(-6, 4 + flapPhase * 6, 14, 9, 0.5 + flapPhase * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Cuerpo
    const bodyGrad = ctx.createRadialGradient(-5, -5, 2, 0, 0, OWL_RADIUS + 4);
    bodyGrad.addColorStop(0, "#fcd9a0");
    bodyGrad.addColorStop(0.6, "#d99a4e");
    bodyGrad.addColorStop(1, "#a8672a");
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, OWL_RADIUS, OWL_RADIUS * 1.05, 0, 0, Math.PI * 2);
    ctx.fill();

    // Panza clara
    ctx.fillStyle = "#fef3c7";
    ctx.beginPath();
    ctx.ellipse(2, 6, OWL_RADIUS * 0.55, OWL_RADIUS * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cejas (ceño sabio)
    ctx.strokeStyle = "#5b3a1a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-14, -10);
    ctx.lineTo(-4, -13);
    ctx.moveTo(4, -13);
    ctx.lineTo(14, -10);
    ctx.stroke();

    // Ojos
    [-8, 8].forEach((ex) => {
      ctx.fillStyle = "#fff8e7";
      ctx.beginPath();
      ctx.arc(ex, -3, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2b1a0a";
      ctx.beginPath();
      ctx.arc(ex + (e.owlV < 0 ? 1 : 2), -3, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(ex - 1, -5, 1.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Pico
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.moveTo(-4, 3);
    ctx.lineTo(4, 3);
    ctx.lineTo(0, 10);
    ctx.closePath();
    ctx.fill();

    // Laurel (toque estoico)
    ctx.strokeStyle = "#4d7c0f";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -16, 9, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();

    ctx.restore();

    // Viñeta
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.28)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    void groundY;
  }, []);

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
        const speed = BASE_PILLAR_SPEED + Math.min(140, e.score * 3);

        // Física del búho
        e.owlV = Math.min(MAX_FALL_SPEED, e.owlV + GRAVITY * dt);
        e.owlY += e.owlV * dt;
        e.owlRot = Math.max(-0.5, Math.min(1.3, e.owlV / 500));
        e.distance += speed * dt;

        // Colisión con techo/suelo
        if (e.owlY - OWL_RADIUS < 0) {
          e.owlY = OWL_RADIUS;
          e.owlV = 0;
        }
        if (e.owlY + OWL_RADIUS > H - 6) {
          triggerDeath();
        }

        // Mover columnas
        e.pillars.forEach((p) => (p.x -= speed * dt));
        e.orbs.forEach((o) => (o.x -= speed * dt));
        e.distractions.forEach((d) => (d.x -= speed * dt));
        e.lastSpawnX -= speed * dt;

        // Puntaje al pasar columnas
        e.pillars.forEach((p) => {
          if (!p.passed && p.x + PILLAR_WIDTH < OWL_X - OWL_RADIUS) {
            p.passed = true;
            e.score += 1;
            setUiScore(e.score);
          }
        });

        // Colisiones con columnas
        for (const p of e.pillars) {
          if (OWL_X + OWL_RADIUS * 0.75 > p.x && OWL_X - OWL_RADIUS * 0.75 < p.x + PILLAR_WIDTH) {
            const topH = p.gapY - p.gap / 2;
            const botY = p.gapY + p.gap / 2;
            if (e.owlY - OWL_RADIUS * 0.75 < topH || e.owlY + OWL_RADIUS * 0.75 > botY) {
              triggerDeath();
              break;
            }
          }
        }

        // Colisión con orbes
        e.orbs.forEach((o) => {
          if (o.taken) return;
          const dx = o.x - OWL_X, dy = o.y - e.owlY;
          if (dx * dx + dy * dy < (OWL_RADIUS + 14) * (OWL_RADIUS + 14)) {
            o.taken = true;
            e.orbsCollected += 1;
            e.score += 1;
            setUiScore(e.score);
            e.bursts.push({ x: o.x, y: o.y, vx: 0, vy: 0, life: 1, color: "rgba(253,224,71,0.9)", size: 4 });
          }
        });

        // Colisión con distracciones
        for (const d of e.distractions) {
          if (d.taken) continue;
          const dx = d.x - OWL_X, dy = d.y - e.owlY;
          if (dx * dx + dy * dy < (OWL_RADIUS + 12) * (OWL_RADIUS + 12)) {
            d.taken = true;
            triggerDeath();
            break;
          }
        }

        spawnPillarIfNeeded();

        // Limpiar objetos fuera de pantalla
        e.pillars = e.pillars.filter((p) => p.x > -PILLAR_WIDTH - 20);
        e.orbs = e.orbs.filter((o) => o.x > -40 && !o.taken);
        e.distractions = e.distractions.filter((d) => d.x > -40 && !d.taken);
      }

      // Partículas (siempre se actualizan, incluso muerto, para que se vean caer)
      e.feathers.forEach((f) => {
        f.x += f.vx * dt;
        f.y += f.vy * dt + 40 * dt;
        f.life -= dt * 1.2;
      });
      e.feathers = e.feathers.filter((f) => f.life > 0);

      e.bursts.forEach((b) => {
        b.size += 60 * dt;
        b.life -= dt * 2.2;
      });
      e.bursts = e.bursts.filter((b) => b.life > 0);

      draw(ctx, dt);
      rafRef.current = requestAnimationFrame(step);
    },
    [draw, triggerDeath, spawnPillarIfNeeded]
  );

  useEffect(() => {
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [step]);

  // Controles: click/touch/espacio
  useEffect(() => {
    const handleKey = (ev: KeyboardEvent) => {
      if (ev.code === "Space") {
        ev.preventDefault();
        flap();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [flap]);

  const handlePointer = () => {
    flap();
  };

  const handleRetry = () => {
    resetEngine();
    engine.current.running = true;
    setGameState("playing");
    setUiScore(0);
    setLastReward(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#0b1120" }}>
      <div className="main-header" style={{ marginLeft: -24, marginRight: -24, marginTop: -24, marginBottom: 24, padding: "16px 24px", background: "#1e293b", color: "white" }}>
        <div className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>ACADEMIA ESTOICA</div>
        <div style={{ fontSize: 13, color: "#94a3b8" }}>Sala de Entrenamiento · El Vuelo del Búho</div>
      </div>

      <div style={{ padding: "0 24px" }}>
        <Link href="/juegos" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, color: "#94a3b8", fontSize: 13, marginBottom: 16 }}>
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
          animation: shake ? "owlShake 0.35s ease" : "none",
        }}
      >
        <style>{`
          @keyframes owlShake {
            0%, 100% { transform: translate(0,0); }
            20% { transform: translate(-8px, 4px); }
            40% { transform: translate(8px, -4px); }
            60% { transform: translate(-5px, 3px); }
            80% { transform: translate(5px, -3px); }
          }
        `}</style>

        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 400,
            aspectRatio: `${W} / ${H}`,
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            border: "3px solid #334155",
          }}
          onPointerDown={handlePointer}
        >
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            style={{ width: "100%", height: "100%", display: "block", touchAction: "none", cursor: "pointer" }}
          />

          {/* HUD de puntaje */}
          {gameState === "playing" && (
            <div
              style={{
                position: "absolute",
                top: 16,
                left: "50%",
                transform: "translateX(-50%)",
                fontFamily: "var(--font-display, serif)",
                fontSize: 44,
                fontWeight: 900,
                color: "white",
                textShadow: "0 2px 8px rgba(0,0,0,0.6), 0 0 20px rgba(0,0,0,0.4)",
                pointerEvents: "none",
              }}
            >
              {uiScore}
            </div>
          )}

          {/* Pantalla de inicio */}
          <AnimatePresence>
            {gameState === "start" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(15,23,42,0.72)",
                  backdropFilter: "blur(2px)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: 24,
                  color: "white",
                }}
              >
                <div style={{ fontSize: 56, marginBottom: 8 }}>🦉</div>
                <h2 className="font-display" style={{ fontSize: 26, fontWeight: 900, marginBottom: 8 }}>
                  El Vuelo del Búho
                </h2>
                <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.6, marginBottom: 18, maxWidth: 280 }}>
                  Toca, haz clic o presiona <strong>espacio</strong> para aletear entre las columnas del templo.
                  Recoge <strong>📖 pergaminos</strong> de sabiduría y esquiva las distracciones.
                </p>
                <div
                  style={{
                    background: "rgba(251,191,36,0.15)",
                    border: "1px solid rgba(251,191,36,0.4)",
                    borderRadius: 14,
                    padding: "10px 18px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#fbbf24",
                  }}
                >
                  ¡Toca para empezar a volar!
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pantalla de derrota */}
          <AnimatePresence>
            {gameState === "dead" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(15,23,42,0.82)",
                  backdropFilter: "blur(3px)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: 24,
                  color: "white",
                }}
              >
                <motion.div
                  initial={{ scale: 0.7, y: -10 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 16 }}
                  style={{ fontSize: 44, marginBottom: 4 }}
                >
                  🪶
                </motion.div>
                <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                  Intento #{attempt}
                </div>
                <div className="font-display" style={{ fontSize: 40, fontWeight: 900, color: "#fbbf24", margin: "4px 0 2px" }}>
                  {uiScore}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
                  Mejor puntaje: {bestScore}
                </div>

                <p style={{ fontSize: 12.5, color: "#e2e8f0", fontStyle: "italic", lineHeight: 1.6, maxWidth: 290, marginBottom: 16 }}>
                  {quote}
                </p>

                {lastReward && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap", justifyContent: "center" }}>
                    <span style={{ background: "linear-gradient(135deg,#fbbf24,#d97706)", color: "#1e293b", padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
                      🌟 +{lastReward.xp} XP
                    </span>
                    <span style={{ background: "linear-gradient(135deg,#eab308,#a16207)", color: "white", padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
                      🦉 +{lastReward.wisdom} Sabiduría
                    </span>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      handleRetry();
                    }}
                    disabled={isSubmitting}
                    style={{
                      background: "linear-gradient(135deg,#fbbf24,#d97706)",
                      color: "#1e293b",
                      border: "none",
                      borderRadius: 12,
                      padding: "12px 24px",
                      fontWeight: 800,
                      fontSize: 14,
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      opacity: isSubmitting ? 0.7 : 1,
                    }}
                  >
                    🔄 Volar de nuevo
                  </button>
                  <Link href="/juegos" onClick={(ev) => ev.stopPropagation()} style={{ textDecoration: "none" }}>
                    <button
                      style={{
                        background: "#334155",
                        color: "white",
                        border: "none",
                        borderRadius: 12,
                        padding: "12px 24px",
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

        <p style={{ color: "#64748b", fontSize: 12, marginTop: 14, textAlign: "center", maxWidth: 400 }}>
          🏅 Mejor puntaje de esta sesión: <strong style={{ color: "#e2e8f0" }}>{bestScore}</strong>
        </p>
      </div>
    </div>
  );
}
