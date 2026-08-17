"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import Link from "next/link";
import { toast } from "sonner";
import { Volume2, VolumeX, Music, Shield, Sparkles } from "lucide-react";
import { useProfile } from "@/lib/profile-store";
import { addGameXP, addVirtueXP, unlockAchievement } from "@/lib/supabase";
import { soundFX } from "@/lib/sound-fx";

// ─── Constantes de Física Calibrada y Amigable ─────────────────────────────

const W = 400; // Resolución interna del canvas
const H = 640;
const GRAVITY = 960; // Gravedad suave y balanceada (antes 1500)
const FLAP_VELOCITY = -340; // Impulso noble (antes -420)
const GLIDE_FALL_SPEED = 90; // Velocidad de caída al planear (mantener presionado)
const MAX_FALL_SPEED = 460; // Límite de velocidad de caída (antes 620)
const OWL_X = W * 0.28;
const OWL_RADIUS = 20; // Radio visual
const OWL_COLLISION_RADIUS = 13; // Hitbox benévolo y perdonador (65% del tamaño visual)
const PILLAR_WIDTH = 64;
const BASE_GAP = 215; // Hueco inicial más amplio y cómodo (antes 190)
const MIN_GAP = 168; // Hueco mínimo accesible (antes 148)
const BASE_PILLAR_SPEED = 145; // Velocidad horizontal controlada (antes 165)
const SPACING = 290; // Distancia entre columnas con tiempo de reacción (antes 240)

const STOIC_QUOTES = [
  "“El impedimento a la acción avanza la acción. Lo que se interpone en el camino, se convierte en el camino.” — Marco Aurelio",
  "“No es que tengamos poco tiempo, sino que perdemos mucho.” — Séneca",
  "“La dificultad muestra al hombre.” — Epicteto",
  "“Caíste. Eso no importa. Lo que importa es que vuelvas a levantar el vuelo.” — Sabiduría del Búho",
  "“No busques que las cosas sucedan como quieres, sino desea que sucedan como suceden.” — Epicteto",
  "“Cada tropiezo es entrenamiento para la mente.” — Academia Estoica",
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
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  rot: number;
  color?: string;
}

interface Burst {
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

const DISTRACTION_EMOJIS = ["📱", "🍬", "💭", "👾"];

// Paletas de cielo dinámicas según la distancia recorrida
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

  // Audio States
  const [sfxMuted, setSfxMuted] = useState(soundFX.getSfxMuted());
  const [musicMuted, setMusicMuted] = useState(soundFX.getMusicMuted());
  const [shieldActive, setShieldActive] = useState(true);

  // Estado mutable del motor de juego
  const engine = useRef({
    owlY: H * 0.45,
    owlV: 0,
    owlRot: 0,
    isGliding: false,
    shields: 1, // Escudo Estoico: perdona 1 choque con columnas
    invulnerableTimer: 0,
    pillars: [] as Pillar[],
    orbs: [] as Orb[],
    distractions: [] as Distraction[],
    feathers: [] as Feather[],
    bursts: [] as Burst[],
    floatTexts: [] as FloatText[],
    score: 0,
    orbsCollected: 0,
    distance: 0,
    running: false,
    lastSpawnX: 0,
    stars: Array.from({ length: 40 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H * 0.6,
      r: Math.random() * 1.6 + 0.4,
      tw: Math.random() * Math.PI * 2,
    })),
  });

  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const isPointerDownRef = useRef<boolean>(false);

  // ─── Ciclo de vida y Reinicio ──────────────────────────────────────────

  const resetEngine = useCallback(() => {
    const e = engine.current;
    e.owlY = H * 0.45;
    e.owlV = 0;
    e.owlRot = 0;
    e.isGliding = false;
    e.shields = 1;
    e.invulnerableTimer = 0;
    e.pillars = [{ x: W + 140, gapY: H * 0.45, gap: BASE_GAP, passed: false }];
    e.orbs = [];
    e.distractions = [];
    e.feathers = [];
    e.bursts = [];
    e.floatTexts = [];
    e.score = 0;
    e.orbsCollected = 0;
    e.distance = 0;
    e.lastSpawnX = W + 140;
    setShieldActive(true);
  }, []);

  const flap = useCallback(() => {
    const e = engine.current;
    if (gameState === "start") {
      resetEngine();
      e.running = true;
      setGameState("playing");
      setUiScore(0);
      soundFX.startAmbientMusic();
    }
    if (gameState === "dead") return;

    e.owlV = FLAP_VELOCITY;
    soundFX.flap();

    // Partículas de plumas
    for (let i = 0; i < 3; i++) {
      e.feathers.push({
        x: OWL_X - 10,
        y: e.owlY + 4,
        vx: -60 - Math.random() * 50,
        vy: (Math.random() - 0.5) * 60,
        life: 0.9,
        rot: Math.random() * Math.PI,
        color: "#d99a4e",
      });
    }
  }, [gameState, resetEngine]);

  const triggerDeath = useCallback(async () => {
    const e = engine.current;
    e.running = false;
    soundFX.gameOver();

    setShake(true);
    setTimeout(() => setShake(false), 350);
    setGameState("dead");
    setQuote(STOIC_QUOTES[Math.floor(Math.random() * STOIC_QUOTES.length)]);
    setAttempt((a) => a + 1);

    const finalScore = e.score;
    setUiScore(finalScore);
    setBestScore((b) => {
      const isNewBest = finalScore > b;
      if (isNewBest && finalScore >= 5) {
        soundFX.victory();
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 } });
      }
      return Math.max(b, finalScore);
    });

    if (!activeProfile) return;
    setIsSubmitting(true);
    try {
      const xpEarned = Math.min(80, 10 + finalScore * 2 + e.orbsCollected * 2);
      const wisdomEarned = Math.min(45, 5 + e.orbsCollected * 3);
      await addGameXP(activeProfile.id, "vuelo_buho", finalScore, xpEarned);
      await addVirtueXP(activeProfile.id, "wisdom", wisdomEarned);
      setLastReward({ xp: xpEarned, wisdom: wisdomEarned });

      if (finalScore >= 10) await unlockAchievement(activeProfile.id, "buho_1");
      if (finalScore >= 25) await unlockAchievement(activeProfile.id, "buho_2");
      if (finalScore >= 50) await unlockAchievement(activeProfile.id, "buho_3");
      if (finalScore >= 100) await unlockAchievement(activeProfile.id, "buho_max");

      if (finalScore > 0 && finalScore % 15 === 0) {
        confetti({ particleCount: 120, spread: 90, origin: { y: 0.4 } });
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
    if (e.lastSpawnX < W + 450) {
      // Progresión suave de dificultad
      const difficulty = Math.min(1, e.score / 45);
      const gap = BASE_GAP - (BASE_GAP - MIN_GAP) * difficulty;
      const margin = 100;
      const gapY = margin + Math.random() * (H - margin * 2 - 100);
      const x = e.lastSpawnX + SPACING;
      e.pillars.push({ x, gapY, gap, passed: false });

      // Orbe de sabiduría en el hueco (75% de probabilidad)
      if (Math.random() < 0.75) {
        e.orbs.push({ x: x + PILLAR_WIDTH / 2, y: gapY, taken: false, bob: Math.random() * Math.PI * 2 });
      } else if (Math.random() < 0.4) {
        // Distracción colocada con margen seguro
        e.distractions.push({
          x: x + PILLAR_WIDTH / 2,
          y: gapY + (Math.random() > 0.5 ? 40 : -40),
          emoji: DISTRACTION_EMOJIS[Math.floor(Math.random() * DISTRACTION_EMOJIS.length)],
          taken: false,
          bob: Math.random() * Math.PI * 2,
        });
      }
      e.lastSpawnX = x;
    }
  }, []);

  // ─── Renderizado Canvas ────────────────────────────────────────────

  const draw = useCallback((ctx: CanvasRenderingContext2D, dt: number) => {
    const e = engine.current;
    const speed = BASE_PILLAR_SPEED + Math.min(85, e.score * 1.8);

    // Paleta según distancia
    const phaseF = Math.min(SKY_PALETTES.length - 1.001, e.distance / 3500);
    const phaseIdx = Math.floor(phaseF);
    const phaseT = phaseF - phaseIdx;
    const pa = SKY_PALETTES[phaseIdx];
    const pb = SKY_PALETTES[Math.min(SKY_PALETTES.length - 1, phaseIdx + 1)];
    const skyTop = lerpColor(pa.top, pb.top, phaseT);
    const skyBottom = lerpColor(pa.bottom, pb.bottom, phaseT);
    const mountainColor = lerpColor(pa.mountain, pb.mountain, phaseT);
    const isNight = phaseF > 3.2;

    // ── Cielo ──
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, skyTop);
    grad.addColorStop(1, skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Estrellas (en fases nocturnas)
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

    // Sol / Luna
    const sunX = W - 70;
    const sunY = 90 + phaseF * 6;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = isNight ? "#f8fafc" : phaseF > 2 ? "#fde68a" : "#fef9c3";
    ctx.shadowColor = ctx.fillStyle as string;
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Montañas (Parallax suave)
    ctx.fillStyle = mountainColor;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.64);
    const mParallax = (e.distance * 0.12) % 160;
    for (let x = -160; x <= W + 160; x += 80) {
      const px = x - mParallax;
      ctx.lineTo(px, H * 0.64 - Math.abs(Math.sin(px * 0.01)) * 60 - 24);
    }
    ctx.lineTo(W, H * 0.64);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    // Nubes
    ctx.fillStyle = isNight ? "rgba(148,163,184,0.22)" : "rgba(255,255,255,0.72)";
    const cParallax = (e.distance * 0.3) % (W + 200);
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 180 - cParallax) % (W + 200)) - 100;
      const cy = 60 + (i % 2) * 90;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 34, 16, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 24, cy + 4, 24, 13, 0, 0, Math.PI * 2);
      ctx.ellipse(cx - 22, cy + 6, 22, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Columnas de Templos Griegos ──
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

        // Estrías
        ctx.strokeStyle = "rgba(120,110,80,0.25)";
        ctx.lineWidth = 2;
        for (let fx = p.x + 8; fx < p.x + PILLAR_WIDTH - 4; fx += 9) {
          ctx.beginPath();
          ctx.moveTo(fx, y);
          ctx.lineTo(fx, y + h);
          ctx.stroke();
        }

        // Capitel decorativo
        const capY = flip ? y + h - 16 : y;
        ctx.fillStyle = "#b8ac88";
        ctx.fillRect(p.x - 4, capY, PILLAR_WIDTH + 8, 16);
        ctx.fillStyle = "#8f8360";
        ctx.fillRect(p.x - 4, capY + (flip ? 0 : 12), PILLAR_WIDTH + 8, 4);
      });
    });

    // ── Orbes de Sabiduría (Pergaminos dorados) ──
    e.orbs.forEach((o) => {
      if (o.taken) return;
      const bobY = o.y + Math.sin(performance.now() / 280 + o.bob) * 5;
      const glow = ctx.createRadialGradient(o.x, bobY, 0, o.x, bobY, 20);
      glow.addColorStop(0, "rgba(253,224,71,0.95)");
      glow.addColorStop(1, "rgba(253,224,71,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(o.x, bobY, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "22px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("📖", o.x, bobY);
    });

    // ── Distracciones (No letales, causan desconcentración) ──
    e.distractions.forEach((d) => {
      if (d.taken) return;
      const bobY = d.y + Math.sin(performance.now() / 240 + d.bob) * 7;
      ctx.font = "22px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(d.emoji, d.x, bobY);
    });

    // ── Partículas (Plumas y Destellos) ──
    e.feathers.forEach((f) => {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.fillStyle = f.color || "#d99a4e";
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    e.bursts.forEach((b) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, b.life);
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // ── Textos Flotantes (+1 Sabiduría / -1 Foco) ──
    e.floatTexts.forEach((ft) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.font = "bold 14px var(--font-display, sans-serif)";
      ctx.fillStyle = ft.color;
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    // ── El Búho Estoico ──
    ctx.save();
    ctx.translate(OWL_X, e.owlY);
    ctx.rotate(e.owlRot);

    // Efecto de parpadeo durante invulnerabilidad tras usar Escudo
    if (e.invulnerableTimer > 0) {
      ctx.globalAlpha = 0.5 + Math.sin(performance.now() / 60) * 0.4;
    }

    // Aura dorada del Escudo Estoico
    if (e.shields > 0) {
      const shieldPulse = 1 + Math.sin(performance.now() / 180) * 0.1;
      const shieldGlow = ctx.createRadialGradient(0, 0, OWL_RADIUS, 0, 0, (OWL_RADIUS + 12) * shieldPulse);
      shieldGlow.addColorStop(0, "rgba(251, 191, 36, 0.4)");
      shieldGlow.addColorStop(1, "rgba(251, 191, 36, 0)");
      ctx.fillStyle = shieldGlow;
      ctx.beginPath();
      ctx.arc(0, 0, (OWL_RADIUS + 12) * shieldPulse, 0, Math.PI * 2);
      ctx.fill();
    }

    // Alas (Animadas: abiertas al planear, aleteo dinámico)
    const isGliding = e.isGliding && e.owlV >= 0;
    const flapPhase = isGliding
      ? 1.2
      : Math.sin(performance.now() / 90) * 0.5 + (e.owlV < 0 ? 0.6 : 0);

    ctx.fillStyle = "#7c4a1e";
    ctx.beginPath();
    ctx.ellipse(-6, 3 + flapPhase * 4, isGliding ? 18 : 14, isGliding ? 11 : 9, 0.4 + flapPhase * 0.3, 0, Math.PI * 2);
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

    // Panza
    ctx.fillStyle = "#fef3c7";
    ctx.beginPath();
    ctx.ellipse(2, 6, OWL_RADIUS * 0.55, OWL_RADIUS * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cejas sabias
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

    // Corona de Laurel Estoica
    ctx.strokeStyle = "#4d7c0f";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -16, 9, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();

    ctx.restore();

    // Viñeta atmosférica
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.78);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.22)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }, []);

  // ─── Loop de Física y Actualización ────────────────────────────────

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
        const speed = BASE_PILLAR_SPEED + Math.min(85, e.score * 1.8);
        e.isGliding = isPointerDownRef.current;

        // Temporizador de invulnerabilidad
        if (e.invulnerableTimer > 0) {
          e.invulnerableTimer = Math.max(0, e.invulnerableTimer - dt);
        }

        // 🪽 Mecánica de Planeo vs Caída Libre
        if (e.isGliding && e.owlV > GLIDE_FALL_SPEED) {
          // Si mantiene presionado, amortigua la caída suavemente
          e.owlV = Math.max(GLIDE_FALL_SPEED, e.owlV - 800 * dt);
        } else {
          e.owlV = Math.min(MAX_FALL_SPEED, e.owlV + GRAVITY * dt);
        }

        e.owlY += e.owlV * dt;
        e.owlRot = Math.max(-0.4, Math.min(0.9, e.owlV / 440));
        e.distance += speed * dt;

        // Techo
        if (e.owlY - OWL_RADIUS < 0) {
          e.owlY = OWL_RADIUS;
          e.owlV = 0;
        }

        // Suelo (Muerte)
        if (e.owlY + OWL_RADIUS > H - 8) {
          triggerDeath();
        }

        // Mover columnas y objetos
        e.pillars.forEach((p) => (p.x -= speed * dt));
        e.orbs.forEach((o) => (o.x -= speed * dt));
        e.distractions.forEach((d) => (d.x -= speed * dt));
        e.lastSpawnX -= speed * dt;

        // Paso exitoso de columna
        e.pillars.forEach((p) => {
          if (!p.passed && p.x + PILLAR_WIDTH < OWL_X - OWL_COLLISION_RADIUS) {
            p.passed = true;
            e.score += 1;
            setUiScore(e.score);
            soundFX.passPillar();
          }
        });

        // 🛡️ Colisiones con columnas (con Escudo Protector)
        for (const p of e.pillars) {
          if (OWL_X + OWL_COLLISION_RADIUS > p.x && OWL_X - OWL_COLLISION_RADIUS < p.x + PILLAR_WIDTH) {
            const topH = p.gapY - p.gap / 2;
            const botY = p.gapY + p.gap / 2;
            const hitsColumn = e.owlY - OWL_COLLISION_RADIUS < topH || e.owlY + OWL_COLLISION_RADIUS > botY;

            if (hitsColumn) {
              if (e.invulnerableTimer > 0) {
                // Durante invulnerabilidad no recibe daño
                continue;
              }

              if (e.shields > 0) {
                // 🛡️ El Escudo Estoico absorbe el golpe
                e.shields -= 1;
                setShieldActive(false);
                e.invulnerableTimer = 1.5;
                e.owlV = -180; // Pequeño rebote seguro
                e.owlY = p.gapY; // Centra al búho en el hueco
                soundFX.shieldAbsorb();

                e.bursts.push({
                  x: OWL_X,
                  y: e.owlY,
                  vx: 0,
                  vy: 0,
                  life: 1,
                  color: "rgba(251, 191, 36, 0.85)",
                  size: 16,
                });

                e.floatTexts.push({
                  x: OWL_X + 20,
                  y: e.owlY - 20,
                  text: "🛡️ ¡Escudo activado!",
                  color: "#fbbf24",
                  life: 1.2,
                });
                break;
              } else {
                triggerDeath();
                break;
              }
            }
          }
        }

        // Colisión con Orbes de Sabiduría
        e.orbs.forEach((o) => {
          if (o.taken) return;
          const dx = o.x - OWL_X;
          const dy = o.y - e.owlY;
          if (dx * dx + dy * dy < (OWL_RADIUS + 16) * (OWL_RADIUS + 16)) {
            o.taken = true;
            e.orbsCollected += 1;
            e.score += 1;
            setUiScore(e.score);
            soundFX.collectWisdom();

            e.bursts.push({ x: o.x, y: o.y, vx: 0, vy: 0, life: 1, color: "rgba(253,224,71,0.95)", size: 6 });
            e.floatTexts.push({ x: o.x, y: o.y - 10, text: "+1 Sabiduría 📖", color: "#fef08a", life: 1 });
          }
        });

        // Colisión con Distracciones (No letales: alerta + pérdida leve)
        for (const d of e.distractions) {
          if (d.taken) continue;
          const dx = d.x - OWL_X;
          const dy = d.y - e.owlY;
          if (dx * dx + dy * dy < (OWL_RADIUS + 14) * (OWL_RADIUS + 14)) {
            d.taken = true;
            soundFX.distractionBump();
            setShake(true);
            setTimeout(() => setShake(false), 200);

            e.floatTexts.push({
              x: OWL_X + 15,
              y: e.owlY - 15,
              text: "⚠️ ¡Distracción!",
              color: "#f87171",
              life: 1.1,
            });
            break;
          }
        }

        spawnPillarIfNeeded();

        // Limpiar objetos fuera de pantalla
        e.pillars = e.pillars.filter((p) => p.x > -PILLAR_WIDTH - 30);
        e.orbs = e.orbs.filter((o) => o.x > -40 && !o.taken);
        e.distractions = e.distractions.filter((d) => d.x > -40 && !d.taken);
      }

      // Partículas y animaciones secundarias
      e.feathers.forEach((f) => {
        f.x += f.vx * dt;
        f.y += f.vy * dt + 30 * dt;
        f.life -= dt * 1.1;
      });
      e.feathers = e.feathers.filter((f) => f.life > 0);

      e.bursts.forEach((b) => {
        b.size += 50 * dt;
        b.life -= dt * 2.0;
      });
      e.bursts = e.bursts.filter((b) => b.life > 0);

      e.floatTexts.forEach((ft) => {
        ft.y -= 35 * dt;
        ft.life -= dt * 0.9;
      });
      e.floatTexts = e.floatTexts.filter((ft) => ft.life > 0);

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

  // Manejo de eventos de entrada (Teclado y Puntero/Táctil)
  useEffect(() => {
    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.code === "Space" || ev.code === "ArrowUp") {
        ev.preventDefault();
        if (!isPointerDownRef.current) {
          isPointerDownRef.current = true;
          flap();
        }
      }
    };

    const handleKeyUp = (ev: KeyboardEvent) => {
      if (ev.code === "Space" || ev.code === "ArrowUp") {
        isPointerDownRef.current = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [flap]);

  const handlePointerDown = () => {
    isPointerDownRef.current = true;
    flap();
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
  };

  const handleRetry = () => {
    resetEngine();
    engine.current.running = true;
    setGameState("playing");
    setUiScore(0);
    setLastReward(null);
    soundFX.startAmbientMusic();
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
      <div
        className="main-header"
        style={{
          marginLeft: -24,
          marginRight: -24,
          marginTop: -24,
          marginBottom: 20,
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
          <div style={{ fontSize: 13, color: "#94a3b8" }}>Sala de Entrenamiento · El Vuelo del Búho</div>
        </div>

        {/* Controles rápidos de Audio */}
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
        <Link href="/juegos" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, color: "#94a3b8", fontSize: 13, marginBottom: 14 }}>
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
            20% { transform: translate(-6px, 3px); }
            40% { transform: translate(6px, -3px); }
            60% { transform: translate(-4px, 2px); }
            80% { transform: translate(4px, -2px); }
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
            boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
            border: "3px solid #334155",
            userSelect: "none",
          }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            style={{ width: "100%", height: "100%", display: "block", touchAction: "none", cursor: "pointer" }}
          />

          {/* HUD superior durante la partida */}
          {gameState === "playing" && (
            <>
              {/* Puntaje */}
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

              {/* Indicador de Escudo Estoico */}
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  left: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: shieldActive ? "rgba(251,191,36,0.2)" : "rgba(100,116,139,0.3)",
                  border: `1px solid ${shieldActive ? "rgba(251,191,36,0.6)" : "rgba(148,163,184,0.3)"}`,
                  backdropFilter: "blur(4px)",
                  padding: "6px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  color: shieldActive ? "#fbbf24" : "#94a3b8",
                  pointerEvents: "none",
                }}
              >
                <Shield size={14} color={shieldActive ? "#fbbf24" : "#94a3b8"} />
                <span>{shieldActive ? "Escudo Listo" : "Escudo Usado"}</span>
              </div>
            </>
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
                  background: "rgba(15,23,42,0.76)",
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
                <div style={{ fontSize: 54, marginBottom: 6 }}>🦉</div>
                <h2 className="font-display" style={{ fontSize: 26, fontWeight: 900, marginBottom: 8, color: "#f8fafc" }}>
                  El Vuelo del Búho
                </h2>

                <div
                  style={{
                    background: "rgba(30, 41, 59, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: 16,
                    padding: "12px 16px",
                    maxWidth: 290,
                    marginBottom: 16,
                    textAlign: "left",
                    fontSize: 12.5,
                    color: "#cbd5e1",
                    lineHeight: 1.5,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span>👆</span>
                    <span><strong>Clic / Espacio:</strong> Aletear suavemente.</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span>🪽</span>
                    <span><strong>Mantén presionado:</strong> Planear y frenar caída.</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>🛡️</span>
                    <span><strong>Escudo Estoico:</strong> Te salva de 1 choque.</span>
                  </div>
                </div>

                <div
                  style={{
                    background: "linear-gradient(135deg, #fbbf24, #d97706)",
                    color: "#0f172a",
                    borderRadius: 14,
                    padding: "12px 24px",
                    fontSize: 14,
                    fontWeight: 800,
                    boxShadow: "0 4px 14px rgba(245, 158, 11, 0.35)",
                    cursor: "pointer",
                  }}
                >
                  ¡Toca para comenzar a volar! 🚀
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pantalla de Derrota / Reflexión */}
          <AnimatePresence>
            {gameState === "dead" && (
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
                <motion.div
                  initial={{ scale: 0.7, y: -10 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 16 }}
                  style={{ fontSize: 42, marginBottom: 4 }}
                >
                  🪶
                </motion.div>
                <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                  Intento #{attempt}
                </div>
                <div className="font-display" style={{ fontSize: 42, fontWeight: 900, color: "#fbbf24", margin: "4px 0 2px" }}>
                  {uiScore}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
                  Mejor puntaje: {bestScore}
                </div>

                <p style={{ fontSize: 12.5, color: "#e2e8f0", fontStyle: "italic", lineHeight: 1.5, maxWidth: 290, marginBottom: 14 }}>
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
          💡 <em>Tip Estoico:</em> Mantén pulsado para abrir las alas y planear suavemente entre los capiteles.
        </p>
      </div>
    </div>
  );
}
