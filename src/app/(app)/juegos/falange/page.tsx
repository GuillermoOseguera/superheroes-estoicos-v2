"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import Link from "next/link";
import { toast } from "sonner";
import { useProfile } from "@/lib/profile-store";
import { addGameXP, addVirtueXP, unlockAchievement } from "@/lib/supabase";

// ─── Constantes ──────────────────────────────────────────────────────────

const W = 400;
const H = 640;
const PLAYER_Y = H - 64;
const PLAYER_HALF_W = 20;
const PLAYER_SPEED = 320;
const BULLET_SPEED = 480;
const ENEMY_BULLET_SPEED = 230;
const MAX_HEARTS = 3;
const MAX_CONCURRENT_DIVES = 2;
const MAX_WEAPON_LEVEL = 4;
const TEMPLANZA_CHARGE_MS = 9000;
const FURY_DURATION_MS = 5000;

type EnemyKind = "ira" | "miedo" | "frustracion" | "distraccion";

const ENEMY_KINDS: Record<EnemyKind, { emoji: string; color: string; name: string; hp: number }> = {
  ira: { emoji: "😡", color: "#ef4444", name: "Ira Ciega", hp: 1 },
  miedo: { emoji: "😨", color: "#8b5cf6", name: "Miedo Social", hp: 1 },
  frustracion: { emoji: "😔", color: "#f97316", name: "Frustración", hp: 1 },
  distraccion: { emoji: "🌪️", color: "#0ea5e9", name: "Distracción", hp: 2 },
};

const BOSS_NAMES = ["La Duda Mayor", "El Orgullo Ciego", "El Pánico Antiguo", "La Envidia Silenciosa"];

const STOIC_QUOTES = [
  "“No busques que las cosas sucedan como quieres, sino desea que sucedan como suceden.” — Epicteto",
  "“La mejor venganza es no parecerte a quien te ofendió.” — Marco Aurelio",
  "“El obstáculo en el camino se convierte en el camino.” — Marco Aurelio",
  "“Un guerrero calmado vale más que diez impulsivos.” — Academia Estoica",
];

// ─── Naves ───────────────────────────────────────────────────────────────

type ShipId = "coraje" | "templanza" | "justicia";

interface ShipDef {
  id: ShipId;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  colorFrom: string;
  colorTo: string;
  core: string;
  fireRateMult: number; // <1 dispara más rápido
  startWeaponLevel: number;
}

const SHIPS: ShipDef[] = [
  {
    id: "coraje",
    name: "Escudo de Coraje",
    emoji: "🦁",
    tagline: "Agresiva · Fuego rápido",
    description: "Dispara más rápido que las demás. Al quedar con 1 vida, entra en Furia Estoica: dispara con más poder por unos segundos.",
    colorFrom: "#f87171",
    colorTo: "#b91c1c",
    core: "#fecaca",
    fireRateMult: 0.72,
    startWeaponLevel: 1,
  },
  {
    id: "templanza",
    name: "Escudo de Templanza",
    emoji: "🧘",
    tagline: "Defensiva · Escudo regenerable",
    description: "Cada 9 segundos sin recibir daño genera un escudo pasivo que bloquea el siguiente golpe sin perder vida ni nivel de arma.",
    colorFrom: "#38bdf8",
    colorTo: "#0369a1",
    core: "#bae6fd",
    fireRateMult: 1.05,
    startWeaponLevel: 1,
  },
  {
    id: "justicia",
    name: "Escudo de Justicia",
    emoji: "⚖️",
    tagline: "Balanceada · Empieza fuerte",
    description: "Comienza cada partida con el arma ya mejorada, y restaura un corazón cada vez que derrota a un jefe.",
    colorFrom: "#fbbf24",
    colorTo: "#b45309",
    core: "#fde68a",
    fireRateMult: 0.92,
    startWeaponLevel: 2,
  },
];

const SHIP_KEY = "estoico_falange_ships_used";

interface Enemy {
  id: number;
  kind: EnemyKind;
  slotX: number;
  slotY: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  diving: boolean;
  diveT: number;
  diveTargetX: number;
  alive: boolean;
}

interface Boss {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  name: string;
  phase: number;
  vx: number;
}

interface Bullet { x: number; y: number; vy: number; vx: number; friendly: boolean; color: string; }
interface Burst { x: number; y: number; life: number; color: string; size: number; }
type PowerType = "shield" | "slow" | "power" | "heart";
interface PowerUp { x: number; y: number; type: PowerType; }
interface StarBg { x: number; y: number; r: number; speed: number; }

const POWER_INFO: Record<PowerType, { emoji: string; color: string; label: string }> = {
  shield: { emoji: "🧘", color: "#38bdf8", label: "Escudo de Templanza" },
  slow: { emoji: "🦉", color: "#facc15", label: "Ojo de Sabiduría" },
  power: { emoji: "⚡", color: "#f59e0b", label: "Chispa de Poder" },
  heart: { emoji: "💖", color: "#fb7185", label: "Corazón de Repuesto" },
};

// Patrones de disparo según nivel de arma: cada entrada es {dx, vx}
function weaponPattern(level: number): { dx: number; vx: number }[] {
  if (level <= 1) return [{ dx: 0, vx: 0 }];
  if (level === 2) return [{ dx: -9, vx: 0 }, { dx: 9, vx: 0 }];
  if (level === 3) return [{ dx: -14, vx: -50 }, { dx: 0, vx: 0 }, { dx: 14, vx: 50 }];
  return [{ dx: -20, vx: -90 }, { dx: -8, vx: -30 }, { dx: 8, vx: 30 }, { dx: 20, vx: 90 }];
}

export default function FalangePage() {
  const { activeProfile, refreshProfile } = useProfile();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"shipselect" | "playing" | "wavecleared" | "gameover">("shipselect");
  const [selectedShip, setSelectedShip] = useState<ShipDef>(SHIPS[0]);
  const [wave, setWave] = useState(1);
  const [uiScore, setUiScore] = useState(0);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [weaponLevelUi, setWeaponLevelUi] = useState(1);
  const [bestWave, setBestWave] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const [quote, setQuote] = useState(STOIC_QUOTES[0]);
  const [bossHpUi, setBossHpUi] = useState<{ hp: number; max: number; name: string } | null>(null);
  const [activePower, setActivePower] = useState<PowerType | null>(null);
  const [templanzaReadyUi, setTemplanzaReadyUi] = useState(false);
  const [runTotals, setRunTotals] = useState({ xp: 0, courage: 0 });

  const engine = useRef({
    ship: SHIPS[0],
    playerX: W / 2,
    keys: { left: false, right: false },
    pointerX: null as number | null,
    enemies: [] as Enemy[],
    boss: null as Boss | null,
    bullets: [] as Bullet[],
    bursts: [] as Burst[],
    powerups: [] as PowerUp[],
    stars: Array.from({ length: 60 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + 0.3, speed: 20 + Math.random() * 40 } as StarBg)),
    fireTimer: 0,
    diveTimer: 0,
    running: false,
    invulnerableUntil: 0,
    slowUntil: 0,
    hearts: MAX_HEARTS,
    score: 0,
    wave: 1,
    enemyIdSeq: 1,
    weaponLevel: 1,
    weaponMaxAchieved: false,
    lastHitTime: 0,
    templanzaCharge: false,
    furyActive: false,
    furyUntil: 0,
    furyUsed: false,
  });

  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const usedShips = useMemo(() => {
    if (typeof window === "undefined" || !activeProfile) return new Set<string>();
    try {
      const raw = localStorage.getItem(`${SHIP_KEY}_${activeProfile.id}`);
      return new Set<string>(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set<string>();
    }
  }, [activeProfile]);

  // ─── Formación de oleada ──────────────────────────────────────────

  const buildWave = useCallback((waveNum: number) => {
    const e = engine.current;
    e.enemies = [];
    e.boss = null;
    setBossHpUi(null);

    if (waveNum % 5 === 0) {
      const bossLevel = Math.floor(waveNum / 5);
      e.boss = {
        x: W / 2,
        y: -80,
        hp: 14 + bossLevel * 6,
        maxHp: 14 + bossLevel * 6,
        name: BOSS_NAMES[(bossLevel - 1) % BOSS_NAMES.length],
        phase: 0,
        vx: 90,
      };
      return;
    }

    const cols = Math.min(7, 4 + Math.floor(waveNum / 3));
    const rows = Math.min(4, 2 + Math.floor(waveNum / 4));
    const kindsByRow: EnemyKind[] = ["ira", "miedo", "frustracion", "distraccion"];
    const spacingX = Math.min(52, (W - 60) / cols);
    const startX = (W - spacingX * (cols - 1)) / 2;

    for (let r = 0; r < rows; r++) {
      const kind = kindsByRow[r % kindsByRow.length];
      for (let c = 0; c < cols; c++) {
        const info = ENEMY_KINDS[kind];
        e.enemies.push({
          id: e.enemyIdSeq++,
          kind,
          slotX: startX + c * spacingX,
          slotY: 60 + r * 46,
          x: startX + c * spacingX,
          y: -100 - r * 40,
          hp: info.hp,
          maxHp: info.hp,
          diving: false,
          diveT: 0,
          diveTargetX: 0,
          alive: true,
        });
      }
    }
  }, []);

  const resetRun = useCallback(
    (ship: ShipDef) => {
      const e = engine.current;
      e.ship = ship;
      e.playerX = W / 2;
      e.bullets = [];
      e.bursts = [];
      e.powerups = [];
      e.fireTimer = 0;
      e.diveTimer = 0;
      e.hearts = MAX_HEARTS;
      e.score = 0;
      e.wave = 1;
      e.invulnerableUntil = 0;
      e.weaponLevel = ship.startWeaponLevel;
      e.weaponMaxAchieved = false;
      e.lastHitTime = performance.now();
      e.templanzaCharge = false;
      e.furyActive = false;
      e.furyUntil = 0;
      e.furyUsed = false;
      setHearts(MAX_HEARTS);
      setUiScore(0);
      setWave(1);
      setWeaponLevelUi(ship.startWeaponLevel);
      setTemplanzaReadyUi(false);
      setRunTotals({ xp: 0, courage: 0 });
      buildWave(1);
    },
    [buildWave]
  );

  const chooseShip = (ship: ShipDef) => {
    setSelectedShip(ship);
    resetRun(ship);
    engine.current.running = true;
    setGameState("playing");

    if (activeProfile) {
      try {
        const key = `${SHIP_KEY}_${activeProfile.id}`;
        const raw = localStorage.getItem(key);
        const set = new Set<string>(raw ? JSON.parse(raw) : []);
        set.add(ship.id);
        localStorage.setItem(key, JSON.stringify([...set]));
        if (set.size >= 3) unlockAchievement(activeProfile.id, "falange_naves");
      } catch {
        // localStorage no disponible: no bloquea el juego
      }
    }
  };

  // ─── Recompensas ──────────────────────────────────────────────────

  const grantWaveReward = useCallback(
    async (waveCleared: number, isBoss: boolean) => {
      if (!activeProfile) return;
      const xp = isBoss ? 40 + waveCleared * 2 : 14 + waveCleared;
      const courage = isBoss ? 25 : 8;
      try {
        await addGameXP(activeProfile.id, "falange_serena", waveCleared, xp);
        await addVirtueXP(activeProfile.id, "courage", courage);
        setRunTotals((t) => ({ xp: t.xp + xp, courage: t.courage + courage }));
        if (waveCleared >= 3) await unlockAchievement(activeProfile.id, "falange_1");
        if (waveCleared >= 5) await unlockAchievement(activeProfile.id, "falange_2");
        if (waveCleared >= 10) await unlockAchievement(activeProfile.id, "falange_3");
        if (waveCleared >= 15) await unlockAchievement(activeProfile.id, "falange_max");
        refreshProfile();
      } catch (err) {
        console.error(err);
      }
    },
    [activeProfile, refreshProfile]
  );

  const endRun = useCallback(async () => {
    const e = engine.current;
    e.running = false;
    setGameState("gameover");
    setQuote(STOIC_QUOTES[Math.floor(Math.random() * STOIC_QUOTES.length)]);
    setBestWave((b) => Math.max(b, e.wave));
    setIsSubmitting(true);
    try {
      if (activeProfile) {
        await addGameXP(activeProfile.id, "falange_serena", e.wave, 6);
        refreshProfile();
      }
    } catch (err) {
      console.error(err);
      toast.error("No se pudo guardar tu progreso.");
    } finally {
      setIsSubmitting(false);
    }
  }, [activeProfile, refreshProfile]);

  const advanceWave = useCallback(async () => {
    const e = engine.current;
    const clearedWave = e.wave;
    const wasBoss = clearedWave % 5 === 0;
    e.running = false;
    setGameState("wavecleared");

    if (wasBoss) {
      confetti({ particleCount: 160, spread: 110, origin: { y: 0.4 } });
      if (e.ship.id === "justicia") {
        e.hearts = Math.min(MAX_HEARTS, e.hearts + 1);
        setHearts(e.hearts);
        toast("⚖️ La Justicia restaura un corazón", { duration: 1800 });
      }
    }
    await grantWaveReward(clearedWave, wasBoss);

    setTimeout(() => {
      e.wave += 1;
      setWave(e.wave);
      buildWave(e.wave);
      e.running = true;
      setGameState("playing");
    }, 1600);
  }, [buildWave, grantWaveReward]);

  // ─── Loop ───────────────────────────────────────────────────────

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const e = engine.current;
    const now = performance.now();
    const ship = e.ship;

    // Fondo espacial
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#0b0f2b");
    grad.addColorStop(1, "#1a1040");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    e.stars.forEach((s) => {
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    const neb = ctx.createRadialGradient(W * 0.7, H * 0.25, 10, W * 0.7, H * 0.25, 180);
    neb.addColorStop(0, "rgba(139,92,246,0.18)");
    neb.addColorStop(1, "rgba(139,92,246,0)");
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, W, H);

    const isSlowed = now < e.slowUntil;
    void isSlowed;

    // Enemigos de formación
    e.enemies.forEach((en) => {
      if (!en.alive) return;
      const info = ENEMY_KINDS[en.kind];
      const sway = Math.sin(now / 500 + en.slotX) * (en.diving ? 0 : 6);

      ctx.save();
      ctx.translate(en.x + sway, en.y);
      ctx.shadowColor = info.color;
      ctx.shadowBlur = 14;
      ctx.font = "26px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(info.emoji, 0, 0);
      ctx.restore();

      if (en.maxHp > 1) {
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(en.x - 14, en.y - 20, 28, 4);
        ctx.fillStyle = info.color;
        ctx.fillRect(en.x - 14, en.y - 20, 28 * (en.hp / en.maxHp), 4);
      }
    });

    // Jefe
    if (e.boss) {
      const b = e.boss;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.shadowColor = "#a21caf";
      ctx.shadowBlur = 26;
      const bodyGrad = ctx.createRadialGradient(0, 0, 6, 0, 0, 46);
      bodyGrad.addColorStop(0, "#4c1d95");
      bodyGrad.addColorStop(1, "#1e1033");
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 44, 38, 0, 0, Math.PI * 2);
      ctx.fill();
      [-14, 14].forEach((ex) => {
        ctx.fillStyle = "#f87171";
        ctx.shadowColor = "#f87171";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(ex, -4, 6, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // Balas
    e.bullets.forEach((bu) => {
      ctx.save();
      ctx.fillStyle = bu.color;
      ctx.shadowColor = bu.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      if (bu.friendly) {
        ctx.ellipse(bu.x, bu.y, 3, 10, 0, 0, Math.PI * 2);
      } else {
        ctx.arc(bu.x, bu.y, 4, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();
    });

    // Power-ups cayendo
    e.powerups.forEach((p) => {
      const info = POWER_INFO[p.type];
      ctx.save();
      ctx.translate(p.x, p.y);
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 18);
      glow.addColorStop(0, `${info.color}99`);
      glow.addColorStop(1, `${info.color}00`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "20px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(info.emoji, 0, 0);
      ctx.restore();
    });

    // Ráfagas
    e.bursts.forEach((bu) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, bu.life);
      ctx.fillStyle = bu.color;
      ctx.beginPath();
      ctx.arc(bu.x, bu.y, bu.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Jugador
    const invulnerable = now < e.invulnerableUntil;
    ctx.save();
    ctx.translate(e.playerX, PLAYER_Y);
    if (invulnerable && Math.floor(now / 100) % 2 === 0) ctx.globalAlpha = 0.4;

    if (invulnerable) {
      ctx.save();
      ctx.strokeStyle = "rgba(56,189,248,0.7)";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (ship.id === "templanza" && e.templanzaCharge) {
      // Anillo pasivo listo
      ctx.save();
      ctx.strokeStyle = "rgba(56,189,248,0.5)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, 30, (now / 300) % (Math.PI * 2), (now / 300) % (Math.PI * 2) + Math.PI * 1.5);
      ctx.stroke();
      ctx.restore();
    }

    if (e.furyActive) {
      ctx.save();
      ctx.strokeStyle = "rgba(248,113,113,0.8)";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#f87171";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, 34, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    const shipGrad = ctx.createLinearGradient(0, -24, 0, 22);
    shipGrad.addColorStop(0, ship.core);
    shipGrad.addColorStop(0.5, ship.colorFrom);
    shipGrad.addColorStop(1, ship.colorTo);
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(20, -4);
    ctx.lineTo(14, 20);
    ctx.lineTo(0, 26);
    ctx.lineTo(-14, 20);
    ctx.lineTo(-20, -4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = ship.core;
    ctx.shadowColor = ship.colorFrom;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, -2, 6, 0, Math.PI * 2);
    ctx.fill();

    // Indicadores de nivel de arma (marcas en las alas)
    for (let i = 0; i < e.weaponLevel - 1; i++) {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(-16 + i * 4, 14, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(16 - i * 4, 14, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }, []);

  const step = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const dt = Math.min(0.033, (time - lastTimeRef.current) / 1000 || 0);
      lastTimeRef.current = time;
      const e = engine.current;
      const now = performance.now();

      if (e.running) {
        const isSlowed = now < e.slowUntil;
        const tm = isSlowed ? 0.35 : 1;
        const ship = e.ship;

        // Furia Estoica (Coraje)
        if (e.furyActive && now > e.furyUntil) e.furyActive = false;

        // Carga pasiva de Templanza
        if (ship.id === "templanza" && !e.templanzaCharge && now - e.lastHitTime > TEMPLANZA_CHARGE_MS) {
          e.templanzaCharge = true;
          setTemplanzaReadyUi(true);
          toast("🧘 Escudo pasivo listo", { duration: 1500 });
        }

        // Movimiento del jugador
        if (e.pointerX !== null) {
          e.playerX += (e.pointerX - e.playerX) * Math.min(1, dt * 12);
        } else {
          if (e.keys.left) e.playerX -= PLAYER_SPEED * dt;
          if (e.keys.right) e.playerX += PLAYER_SPEED * dt;
        }
        e.playerX = Math.max(PLAYER_HALF_W + 8, Math.min(W - PLAYER_HALF_W - 8, e.playerX));

        // Disparo automático (según nivel de arma y nave)
        e.fireTimer -= dt * 1000;
        const fireInterval = Math.max(160, (380 - e.wave * 8) * ship.fireRateMult);
        if (e.fireTimer <= 0) {
          e.fireTimer = fireInterval;
          const effectiveLevel = e.furyActive ? Math.min(MAX_WEAPON_LEVEL, e.weaponLevel + 1) : e.weaponLevel;
          const pattern = weaponPattern(effectiveLevel);
          const color = effectiveLevel >= 3 ? "#fbbf24" : "#7dd3fc";
          pattern.forEach((p) => {
            e.bullets.push({ x: e.playerX + p.dx, y: PLAYER_Y - 24, vy: -BULLET_SPEED, vx: p.vx, friendly: true, color });
          });
        }

        // Formación: entrada + oscilación + buceo
        const stillEntering = e.enemies.some((en) => en.alive && en.y < en.slotY - 2);
        e.enemies.forEach((en) => {
          if (!en.alive) return;
          if (en.y < en.slotY) {
            en.y += 90 * dt * tm;
            if (en.y > en.slotY) en.y = en.slotY;
            return;
          }
          if (en.diving) {
            en.diveT += dt * tm;
            en.x += (en.diveTargetX - en.x) * Math.min(1, dt * 1.6);
            en.y += (140 + e.wave * 3) * dt * tm;
            if (en.y > H + 30) {
              en.diving = false;
              en.diveT = 0;
              en.x = en.slotX;
              en.y = en.slotY - 40;
            }
          }
        });

        if (!stillEntering) {
          e.diveTimer -= dt * 1000;
          const diveInterval = Math.max(700, 2200 - e.wave * 60);
          const currentlyDiving = e.enemies.filter((en) => en.alive && en.diving).length;
          if (e.diveTimer <= 0 && currentlyDiving < MAX_CONCURRENT_DIVES) {
            const candidates = e.enemies.filter((en) => en.alive && !en.diving);
            if (candidates.length > 0) {
              const chosen = candidates[Math.floor(Math.random() * candidates.length)];
              chosen.diving = true;
              chosen.diveT = 0;
              chosen.diveTargetX = e.playerX + (Math.random() - 0.5) * 60;
            }
            e.diveTimer = diveInterval;
          }

          if (Math.random() < 0.012 * tm) {
            const shooters = e.enemies.filter((en) => en.alive);
            if (shooters.length > 0) {
              const s = shooters[Math.floor(Math.random() * shooters.length)];
              e.bullets.push({ x: s.x, y: s.y + 14, vy: ENEMY_BULLET_SPEED, vx: 0, friendly: false, color: "#f472b6" });
            }
          }
        }

        if (e.boss) {
          const b = e.boss;
          if (b.y < 100) {
            b.y += 60 * dt;
          } else {
            b.phase += dt * tm;
            b.x += Math.sin(b.phase) * b.vx * dt;
            b.x = Math.max(60, Math.min(W - 60, b.x));
            if (Math.random() < 0.02 * tm) {
              for (let a = -1; a <= 1; a++) {
                e.bullets.push({ x: b.x + a * 14, y: b.y + 30, vy: ENEMY_BULLET_SPEED * 0.9, vx: 0, friendly: false, color: "#c084fc" });
              }
            }
          }
        }

        e.bullets.forEach((bu) => {
          bu.y += bu.vy * dt;
          bu.x += bu.vx * dt;
        });
        e.bullets = e.bullets.filter((bu) => bu.y > -20 && bu.y < H + 20);

        e.powerups.forEach((p) => (p.y += 90 * dt));
        e.powerups = e.powerups.filter((p) => p.y < H + 20);

        // Colisión balas amigas vs enemigos de formación
        for (const bu of e.bullets) {
          if (!bu.friendly) continue;
          for (const en of e.enemies) {
            if (!en.alive) continue;
            const dx = bu.x - en.x, dy = bu.y - en.y;
            if (dx * dx + dy * dy < 20 * 20) {
              en.hp -= 1;
              bu.y = -999;
              e.bursts.push({ x: en.x, y: en.y, life: 1, color: ENEMY_KINDS[en.kind].color, size: 4 });
              if (en.hp <= 0) {
                en.alive = false;
                e.score += 10;
                setUiScore(e.score);
                if (Math.random() < 0.18) {
                  e.powerups.push({ x: en.x, y: en.y, type: pickDropType(e.hearts) });
                }
              }
              break;
            }
          }
        }

        const boss = e.boss;
        if (boss) {
          for (const bu of e.bullets) {
            if (!bu.friendly) continue;
            const dx = bu.x - boss.x, dy = bu.y - boss.y;
            if (dx * dx + dy * dy < 44 * 44) {
              boss.hp -= 1;
              bu.y = -999;
              e.bursts.push({ x: bu.x, y: bu.y, life: 1, color: "#c084fc", size: 5 });
              setBossHpUi({ hp: boss.hp, max: boss.maxHp, name: boss.name });
              if (boss.hp <= 0) {
                e.score += 100;
                setUiScore(e.score);
                e.boss = null;
                setBossHpUi(null);
                advanceWave();
              }
            }
          }
        }
        e.bullets = e.bullets.filter((bu) => bu.y > -900);

        const invulnerable = now < e.invulnerableUntil;
        if (!invulnerable) {
          for (const bu of e.bullets) {
            if (bu.friendly) continue;
            const dx = bu.x - e.playerX, dy = bu.y - PLAYER_Y;
            if (dx * dx + dy * dy < 18 * 18) {
              bu.y = -999;
              hitPlayer();
              break;
            }
          }
          for (const en of e.enemies) {
            if (!en.alive || !en.diving) continue;
            const dx = en.x - e.playerX, dy = en.y - PLAYER_Y;
            if (dx * dx + dy * dy < 22 * 22) {
              en.alive = false;
              hitPlayer();
            }
          }
        }
        e.bullets = e.bullets.filter((bu) => bu.y > -900);

        e.powerups = e.powerups.filter((p) => {
          const dx = p.x - e.playerX, dy = p.y - PLAYER_Y;
          if (dx * dx + dy * dy < 22 * 22) {
            applyPower(p.type);
            return false;
          }
          return true;
        });

        if (!e.boss && e.enemies.length > 0 && e.enemies.every((en) => !en.alive)) {
          advanceWave();
        }
      }

      e.bursts.forEach((bu) => {
        bu.size += 50 * dt;
        bu.life -= dt * 2.4;
      });
      e.bursts = e.bursts.filter((bu) => bu.life > 0);

      e.stars.forEach((s) => {
        s.y += s.speed * dt * (e.running ? 1 : 0.2);
        if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
      });

      draw(ctx);
      rafRef.current = requestAnimationFrame(step);

      function pickDropType(currentHearts: number): PowerType {
        const r = Math.random();
        if (currentHearts < MAX_HEARTS && r < 0.12) return "heart";
        if (r < 0.62) return "power";
        if (r < 0.81) return "shield";
        return "slow";
      }

      function hitPlayer() {
        const ship = e.ship;

        // Escudo pasivo de Templanza: absorbe el golpe sin costo
        if (ship.id === "templanza" && e.templanzaCharge) {
          e.templanzaCharge = false;
          setTemplanzaReadyUi(false);
          e.lastHitTime = now;
          e.invulnerableUntil = now + 900;
          toast("🧘 ¡El escudo pasivo bloqueó el golpe!", { duration: 1600 });
          return;
        }

        e.hearts -= 1;
        e.lastHitTime = now;
        e.weaponLevel = Math.max(ship.id === "justicia" ? 1 : 1, e.weaponLevel - 1);
        setWeaponLevelUi(e.weaponLevel);
        setHearts(Math.max(0, e.hearts));
        e.invulnerableUntil = now + 1600;
        setShake(true);
        setTimeout(() => setShake(false), 300);

        // Furia Estoica (Coraje): una vez por partida al llegar a 1 vida
        if (ship.id === "coraje" && e.hearts === 1 && !e.furyUsed) {
          e.furyUsed = true;
          e.furyActive = true;
          e.furyUntil = now + FURY_DURATION_MS;
          toast("🦁 ¡Furia Estoica activada!", { duration: 2000 });
        }

        if (e.hearts <= 0) {
          endRun();
        }
      }

      function applyPower(type: PowerType) {
        if (type === "power") {
          e.weaponLevel = Math.min(MAX_WEAPON_LEVEL, e.weaponLevel + 1);
          setWeaponLevelUi(e.weaponLevel);
          toast(`⚡ Nivel de arma ${e.weaponLevel}`, { duration: 1600 });
          if (e.weaponLevel >= MAX_WEAPON_LEVEL && !e.weaponMaxAchieved && activeProfile) {
            e.weaponMaxAchieved = true;
            unlockAchievement(activeProfile.id, "falange_arma_max");
          }
          return;
        }
        if (type === "heart") {
          e.hearts = Math.min(MAX_HEARTS, e.hearts + 1);
          setHearts(e.hearts);
          toast("💖 +1 vida", { duration: 1600 });
          return;
        }
        setActivePower(type);
        setTimeout(() => setActivePower((p) => (p === type ? null : p)), 4500);
        if (type === "shield") e.invulnerableUntil = Math.max(e.invulnerableUntil, now + 4500);
        if (type === "slow") e.slowUntil = now + 4500;
        toast(`${POWER_INFO[type].emoji} ${POWER_INFO[type].label} activado`, { duration: 1800 });
      }
    },
    [draw, advanceWave, endRun, activeProfile]
  );

  useEffect(() => {
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [step]);

  useEffect(() => {
    const down = (ev: KeyboardEvent) => {
      if (ev.code === "ArrowLeft" || ev.code === "KeyA") engine.current.keys.left = true;
      if (ev.code === "ArrowRight" || ev.code === "KeyD") engine.current.keys.right = true;
    };
    const up = (ev: KeyboardEvent) => {
      if (ev.code === "ArrowLeft" || ev.code === "KeyA") engine.current.keys.left = false;
      if (ev.code === "ArrowRight" || ev.code === "KeyD") engine.current.keys.right = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const handlePointerMove = (ev: React.PointerEvent<HTMLDivElement>) => {
    const rect = ev.currentTarget.getBoundingClientRect();
    const relX = (ev.clientX - rect.left) / rect.width;
    engine.current.pointerX = relX * W;
  };
  const handlePointerLeave = () => {
    engine.current.pointerX = null;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#0b0f2b" }}>
      <div className="main-header" style={{ marginLeft: -24, marginRight: -24, marginTop: -24, marginBottom: 24, padding: "16px 24px", background: "#1e293b", color: "white" }}>
        <div className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>ACADEMIA ESTOICA</div>
        <div style={{ fontSize: 13, color: "#94a3b8" }}>Sala de Entrenamiento · La Falange Serena</div>
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
          animation: shake ? "falangeShake 0.3s ease" : "none",
        }}
      >
        <style>{`
          @keyframes falangeShake {
            0%, 100% { transform: translate(0,0); }
            25% { transform: translate(-6px, 3px); }
            50% { transform: translate(6px, -3px); }
            75% { transform: translate(-4px, 2px); }
          }
        `}</style>

        {gameState === "shipselect" && (
          <div style={{ width: "100%", maxWidth: 440, marginBottom: 8 }}>
            <h2 className="font-display" style={{ fontSize: 22, fontWeight: 900, color: "white", textAlign: "center", marginBottom: 4 }}>
              🛡️ La Falange Serena
            </h2>
            <p style={{ color: "#94a3b8", fontSize: 12.5, textAlign: "center", marginBottom: 18, lineHeight: 1.5 }}>
              Elige tu nave. Mueve arrastrando el dedo o con las flechas; disparas solo. Recoge ⚡ para subir tu nivel de
              arma (hasta 4) y sobrevive a las oleadas — cada 5 aparece un jefe.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {SHIPS.map((ship, i) => (
                <motion.button
                  key={ship.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => chooseShip(ship)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    textAlign: "left",
                    padding: 14,
                    borderRadius: 16,
                    border: `2px solid ${ship.colorFrom}55`,
                    background: `linear-gradient(135deg, ${ship.colorTo}22, #0b0f2b)`,
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                      background: `linear-gradient(135deg, ${ship.colorFrom}, ${ship.colorTo})`,
                      boxShadow: `0 6px 20px ${ship.colorFrom}55`,
                    }}
                  >
                    {ship.emoji}
                  </div>
                  <div>
                    <div style={{ color: "white", fontWeight: 800, fontSize: 14 }}>
                      {ship.name} {usedShips.has(ship.id) && <span style={{ fontSize: 11, color: "#4ade80" }}>✓ probada</span>}
                    </div>
                    <div style={{ color: ship.colorFrom, fontWeight: 700, fontSize: 11, marginBottom: 3 }}>{ship.tagline}</div>
                    <div style={{ color: "#cbd5e1", fontSize: 11.5, lineHeight: 1.4 }}>{ship.description}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {gameState === "playing" && (
          <div style={{ width: "100%", maxWidth: 400, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
            <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
              {Array.from({ length: MAX_HEARTS }).map((_, i) => (
                <span key={i} style={{ fontSize: 18, opacity: i < hearts ? 1 : 0.2, filter: i < hearts ? "none" : "grayscale(1)" }}>💖</span>
              ))}
              {selectedShip.id === "templanza" && (
                <span style={{ fontSize: 14, marginLeft: 4, opacity: templanzaReadyUi ? 1 : 0.3 }} title="Escudo pasivo">🧘</span>
              )}
            </div>
            <div style={{ color: "#fbbf24", fontWeight: 800, fontSize: 13 }}>Oleada {wave} · {uiScore} pts</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#f59e0b" }}>⚡Nv.{weaponLevelUi}</span>
              {activePower && (
                <div style={{ fontSize: 18 }} title={POWER_INFO[activePower].label}>
                  {POWER_INFO[activePower].emoji}
                </div>
              )}
            </div>
          </div>
        )}

        {bossHpUi && (
          <div style={{ width: "100%", maxWidth: 400, marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: "#c084fc", fontWeight: 800, textAlign: "center", marginBottom: 3 }}>
              👹 {bossHpUi.name}
            </div>
            <div style={{ height: 8, background: "#1e1033", borderRadius: 4, overflow: "hidden", border: "1px solid #4c1d95" }}>
              <div style={{ height: "100%", width: `${(bossHpUi.hp / bossHpUi.max) * 100}%`, background: "linear-gradient(90deg,#a21caf,#f472b6)", transition: "width 0.2s" }} />
            </div>
          </div>
        )}

        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 400,
            aspectRatio: `${W} / ${H}`,
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            border: "3px solid #312e81",
          }}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            style={{ width: "100%", height: "100%", display: "block", touchAction: "none", cursor: "pointer" }}
          />

          <AnimatePresence>
            {gameState === "wavecleared" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(11,15,43,0.75)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 40 }}>{wave % 5 === 0 ? "👑" : "✨"}</div>
                <div className="font-display" style={{ fontSize: 22, fontWeight: 900, color: "#a5b4fc" }}>
                  {wave % 5 === 0 ? "¡Jefe Derrotado!" : `¡Oleada ${wave} Superada!`}
                </div>
              </motion.div>
            )}

            {gameState === "gameover" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(11,15,43,0.88)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: 24,
                  color: "white",
                }}
              >
                <div style={{ fontSize: 44, marginBottom: 4 }}>🕊️</div>
                <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>
                  Llegaste a la oleada {wave}
                </div>
                <div className="font-display" style={{ fontSize: 34, fontWeight: 900, color: "#a5b4fc", margin: "4px 0 2px" }}>
                  {uiScore} pts
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>Mejor oleada: {bestWave}</div>

                <p style={{ fontSize: 12.5, color: "#e2e8f0", fontStyle: "italic", lineHeight: 1.6, maxWidth: 290, marginBottom: 16 }}>
                  {quote}
                </p>

                {(runTotals.xp > 0 || runTotals.courage > 0) && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap", justifyContent: "center" }}>
                    <span style={{ background: "linear-gradient(135deg,#818cf8,#4338ca)", color: "white", padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
                      🌟 +{runTotals.xp} XP ganados
                    </span>
                    <span style={{ background: "linear-gradient(135deg,#f87171,#b91c1c)", color: "white", padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
                      🦁 +{runTotals.courage} Coraje
                    </span>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => setGameState("shipselect")}
                    disabled={isSubmitting}
                    style={{
                      background: "linear-gradient(135deg,#818cf8,#4338ca)",
                      color: "white",
                      border: "none",
                      borderRadius: 12,
                      padding: "12px 24px",
                      fontWeight: 800,
                      fontSize: 14,
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      opacity: isSubmitting ? 0.7 : 1,
                    }}
                  >
                    🔄 Elegir Nave
                  </button>
                  <Link href="/juegos" style={{ textDecoration: "none" }}>
                    <button style={{ background: "#334155", color: "white", border: "none", borderRadius: 12, padding: "12px 24px", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
                      Salir
                    </button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p style={{ color: "#64748b", fontSize: 12, marginTop: 14, textAlign: "center", maxWidth: 400 }}>
          🏅 Mejor oleada de esta sesión: <strong style={{ color: "#e2e8f0" }}>{bestWave}</strong>
        </p>
      </div>
    </div>
  );
}
