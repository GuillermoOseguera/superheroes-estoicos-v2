"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, type Profile, type GameResult, resetHeroProgress } from "@/lib/supabase";
import { motion } from "framer-motion";
import { XCircle, RotateCcw, Activity, ShieldQuestion } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useProfile } from "@/lib/profile-store";
import { getStrongestVirtue, VIRTUE_LABELS } from "@/lib/progression";
import type { UserVirtues } from "@/lib/supabase";

interface HeroStats {
  profile: Profile;
  aciertos: number;
  errores: number;
  totalSesiones: number;
  tiempoEstimadoMinutos: number; 
  booksRead: number;
  unlockedAchievementsCount: number;
  
  // Novedades para Rol y Gráfica
  mostPlayedGameId: string;
  roleTitle: string;
  colorFrom: string;
  colorTo: string;
  sparklinePoints: {x: number, y: number}[];
  activityMax: number;
  strongestVirtue: string;
  weeklyEmotionalLogs: number;
  weeklyDominantEmotion: string;
}

const HERO_IMAGES: Record<string, string> = {
  "00000000-0000-0000-0000-000000000001": "/images/avatars/elias_base.png",
  "00000000-0000-0000-0000-000000000002": "/images/avatars/atenea_base.png",
  "00000000-0000-0000-0000-000000000003": "/images/avatars/marco_base.png",
};

const ROLE_MAP: Record<string, { title: string, colorFrom: string, colorTo: string, shadow: string }> = {
  "Ninguno": { title: "Iniciado Estoico", colorFrom: "#94a3b8", colorTo: "#475569", shadow: "rgba(100,116,139,0.5)" },
  "dos_cajas": { title: "Maestro de las Cajas", colorFrom: "#c084fc", colorTo: "#7e22ce", shadow: "rgba(168,85,247,0.5)" },
  "semaforo_emocional": { title: "Guardián de Emociones", colorFrom: "#34d399", colorTo: "#047857", shadow: "rgba(16,185,129,0.5)" },
  "defensor_mente": { title: "Paladín de la Mente", colorFrom: "#fbbf24", colorTo: "#b45309", shadow: "rgba(245,158,11,0.5)" },
  "memoria_estoica": { title: "Erudito de la Memoria", colorFrom: "#38bdf8", colorTo: "#0369a1", shadow: "rgba(14,165,233,0.5)" },
  "desafio_virtudes": { title: "Gran Guerrero Estoico", colorFrom: "#f43f5e", colorTo: "#be123c", shadow: "rgba(225,29,72,0.5)" },
  "default": { title: "Héroe en Entrenamiento", colorFrom: "#818cf8", colorTo: "#4338ca", shadow: "rgba(99,102,241,0.5)" }
};

const EMOTIONS_MAP: Record<string, string> = {
  angry: "😡 Enojo",
  sad: "😢 Tristeza",
  anxious: "😰 Ansiedad",
  frustrated: "😔 Frustración",
  scared: "😨 Miedo",
  neutral: "😐 Calma",
  peaceful: "😌 Paz",
  happy: "🙂 Alegría",
};

interface EmotionalLog {
  id: string;
  user_id: string;
  emotion: string;
  trigger_reason: string;
  can_control: boolean;
  virtue_selected: string;
  action_plan: string;
  created_at: string;
}

export default function EstadisticasPage() {
  const [stats, setStats] = useState<HeroStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [heroToReset, setHeroToReset] = useState<string | null>(null);
  
  const [selectedLogs, setSelectedLogs] = useState<EmotionalLog[] | null>(null);
  const [viewingProfileName, setViewingProfileName] = useState("");

  const { activeProfile, refreshProfile, activeAccount } = useProfile();

  const handleViewLogs = async (profileId: string) => {
    try {
      const { data, error } = await supabase
        .from("emotional_logs")
        .select("*")
        .eq("user_id", profileId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      const p = stats.find(s => s.profile.id === profileId);
      setViewingProfileName(p?.profile.name || "Héroe");
      setSelectedLogs(data || []);
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar los registros.");
    }
  };

  const loadStats = useCallback(async () => {
    if (!activeAccount) return;
    setLoading(true);
    try {
      const { data: profilesData } = await supabase.from("profiles").select("*").eq("account_id", activeAccount.id).order("name");
      const { data: resultsData } = await supabase.from("game_results").select("*");
      const { data: achievementsData } = await supabase.from("unlocked_achievements").select("*");
      const { data: virtuesData } = await supabase.from("user_virtues").select("*");
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data: emotionalLogsData } = await supabase
        .from("emotional_logs")
        .select("*")
        .gte("created_at", weekAgo.toISOString());

      if (profilesData && resultsData) {
        const statsList: HeroStats[] = profilesData.map((profile: Profile) => {
          const userResults = resultsData.filter((r: GameResult) => r.user_id === profile.id);
          const userVirtues = (virtuesData || []).find((v: UserVirtues) => v.user_id === profile.id) || null;
          const userWeeklyLogs = ((emotionalLogsData || []) as EmotionalLog[]).filter((log) => log.user_id === profile.id);
          const aciertos = userResults.filter((r: GameResult) => r.xp_earned > 0).length;
          const errores = userResults.filter((r: GameResult) => r.xp_earned <= 0).length;
          const totalSesiones = userResults.length;
          const tiempoEstimadoMinutos = totalSesiones * 2; 

          let booksRead = 0;
          try {
            const savedRatings = localStorage.getItem(`estoico_stories_ratings_${profile.id}`);
            if (savedRatings) booksRead = Object.keys(JSON.parse(savedRatings)).length;
          } catch {}

          const gameCounts: Record<string, number> = {};
          userResults.forEach((r: GameResult) => {
            if (r.game_id && !r.game_id.startsWith("mission_")) {
              gameCounts[r.game_id] = (gameCounts[r.game_id] || 0) + 1;
            }
          });
          let mostPlayedGameId = "Ninguno";
          let maxCount = 0;
          for (const [gid, count] of Object.entries(gameCounts)) {
            if (count > maxCount) { maxCount = count; mostPlayedGameId = gid; }
          }
          
          const roleConfig = ROLE_MAP[mostPlayedGameId] || ROLE_MAP["default"];
          const userAchievements = achievementsData ? achievementsData.filter((achievement: { user_id: string }) => achievement.user_id === profile.id) : [];
          const strongestVirtueKey = getStrongestVirtue(userVirtues);
          const weeklyEmotionCounts = userWeeklyLogs.reduce((acc: Record<string, number>, log) => {
            acc[log.emotion] = (acc[log.emotion] || 0) + 1;
            return acc;
          }, {});
          const weeklyDominantEmotion = Object.entries(weeklyEmotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "neutral";

          // Generar Sparkline (Últimos 7 días)
          const last7Days = Array.from({length: 7}).map((_, i) => {
            const d = new Date(); d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split("T")[0];
          });
          const activityByDay = last7Days.map(date => userResults.filter((r: GameResult) => r.completed_at?.startsWith(date)).length);
          const activityMax = Math.max(...activityByDay, 1);
          const sparklinePoints = activityByDay.map((val, i) => ({
             x: (i / 6) * 100, 
             y: 100 - (val / activityMax) * 100 
          }));

          return {
            profile, aciertos, errores, totalSesiones, tiempoEstimadoMinutos, booksRead,
            unlockedAchievementsCount: userAchievements.length,
            mostPlayedGameId,
            roleTitle: roleConfig.title,
            colorFrom: roleConfig.colorFrom,
            colorTo: roleConfig.colorTo,
            sparklinePoints,
            activityMax,
            strongestVirtue: VIRTUE_LABELS[strongestVirtueKey],
            weeklyEmotionalLogs: userWeeklyLogs.length,
            weeklyDominantEmotion: EMOTIONS_MAP[weeklyDominantEmotion] || weeklyDominantEmotion,
          };
        });
        setStats(statsList);
      }
    } catch (error) {
      console.error(error); toast.error("Error al cargar las estadísticas");
    } finally {
      setLoading(false);
    }
  }, [activeAccount]);

  useEffect(() => { 
    if (activeAccount) {
      loadStats(); 
    }
  }, [activeAccount, loadStats]);

  const handleResetConfirm = async (heroId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar voltear la tarjeta
    try {
      setLoading(true);
      await resetHeroProgress(heroId);
      if (activeProfile?.id === heroId) await refreshProfile();
      toast.success("Progreso borrado correctamente", { icon: "🧹" });
      setHeroToReset(null);
      await loadStats(); 
    } catch {
      toast.error("Ocurrió un error al intentar borrar el progreso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header EdTech Moderno */}
      <div className="main-header" style={{ marginLeft: -24, marginRight: -24, marginTop: -24, marginBottom: 24, padding: "24px", background: "#0f172a", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
        <div>
          <div className="font-display" style={{ fontSize: 22, fontWeight: 800 }}>PANEL FAMILIAR ESTOICO</div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>Racha, virtudes y registros emocionales para acompañar mejor a cada héroe</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>
          SISTEMA DE CARTAS INTELIGENTES
        </div>
      </div>

      <div className="page-content" style={{ padding: "0 24px 40px" }}>
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <span className="text-slate-500 font-bold uppercase tracking-widest flex gap-2 items-center">
              <RotateCcw className="animate-spin" /> Procesando Bases de Datos...
            </span>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" style={{ perspective: 1200 }}>
            {stats.map((stat, i) => {
              const roleInfo = ROLE_MAP[stat.mostPlayedGameId] || ROLE_MAP["default"];
              const isFlipped = flippedId === stat.profile.id;

              return (
                 <motion.div
                   key={stat.profile.id}
                   initial={{ opacity: 0, y: 40 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.15, type: "spring" }}
                   style={{ width: "100%", height: 600, position: "relative" }}
                 >
                   <motion.div
                     style={{ width: "100%", height: "100%", position: "relative", transformStyle: "preserve-3d" }}
                     animate={{ rotateY: isFlipped ? 180 : 0 }}
                     transition={{ duration: 0.7, type: "spring", stiffness: 100, damping: 15 }}
                   >
                     {/* ======================= FRONTAL ======================= */}
                     <div 
                       onClick={() => setFlippedId(isFlipped ? null : stat.profile.id)}
                       style={{ 
                         position: "absolute", inset: 0, backfaceVisibility: "hidden", cursor: "pointer",
                         background: `linear-gradient(145deg, ${stat.colorFrom}, ${stat.colorTo})`,
                         borderRadius: 24, padding: 20, color: "white",
                         boxShadow: `0 20px 40px ${roleInfo.shadow}`,
                         display: "flex", flexDirection: "column", alignItems: "center", border: "4px solid rgba(255,255,255,0.2)"
                       }}
                       className="group"
                     >
                        {/* Brillo Holográfico (CSS Magic) */}
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.3) 25%, transparent 30%)", backgroundSize: "200% auto", backgroundPosition: "-100% 0", opacity: 0.5, borderRadius: 20 }} className="group-hover:animate-shimmer" />

                        {stat.totalSesiones === 0 && (
                          <div style={{ position: "absolute", top: 16, right: 16, background: "white", color: stat.colorFrom, padding: "4px 10px", borderRadius: 12, fontSize: 10, fontWeight: 900 }}>
                            HÉROE NUEVO
                          </div>
                        )}

                        <div style={{ marginTop: 20, background: "rgba(255,255,255,0.1)", borderRadius: "50%", padding: 12, boxShadow: "inset 0 0 20px rgba(0,0,0,0.2)" }}>
                          <div style={{ width: 140, height: 140, borderRadius: "50%", overflow: "hidden", border: "4px solid white", background: "white" }}>
                            <Image src={HERO_IMAGES[stat.profile.id] || "/images/avatars/elias_base.png"} alt={stat.profile.name} width={140} height={140} style={{ objectFit: "cover" }} />
                          </div>
                        </div>

                        <h2 className="font-display" style={{ fontSize: 32, fontWeight: 800, marginTop: 16, textShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>
                          {stat.profile.name.toUpperCase()}
                        </h2>

                        <div style={{ background: "rgba(0,0,0,0.2)", padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700, marginTop: 4, backdropFilter: "blur(4px)" }}>
                          NIVEL {stat.profile.level} • {stat.profile.total_xp} XP
                        </div>

                        {/* ROL AUTO-GENERADO */}
                        <div style={{ marginTop: "auto", marginBottom: 24, textAlign: "center" }}>
                          <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 700, letterSpacing: 1 }}>TÍTULO ADQUIRIDO</div>
                          <div className="font-display" style={{ fontSize: 22, fontWeight: 800, color: "#fef08a", textShadow: "0 2px 10px rgba(0,0,0,0.4)" }}>
                            {stat.roleTitle}
                          </div>
                          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.9 }}>
                            🔥 Racha actual: {stat.profile.current_streak} días
                          </div>
                        </div>

                        <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                          <RotateCcw size={14} /> Haz clic para ver estadísticas
                        </div>
                     </div>

                     {/* ======================= REVERSO (PANEL ANALÍTICO) ======================= */}
                     <div 
                       style={{ 
                         position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)",
                         background: "white", borderRadius: 24, padding: 24, border: "1px solid #e2e8f0",
                         boxShadow: "0 20px 40px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column"
                       }}
                     >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                          <h3 className="font-display" style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Data de {stat.profile.name}</h3>
                          <button onClick={() => setFlippedId(null)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}><XCircle /></button>
                        </div>

                        <style>{`
                          .stat-mini-box { background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 10px; flex: 1; text-align: center; }
                          .stat-mini-val { font-size: 20px; font-weight: 800; color: #1e293b; line-height: 1; margin-bottom: 2px; }
                          .stat-mini-lbl { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; }
                        `}</style>

                        {/* 6 Mini cuadros */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                          <div className="stat-mini-box"><div className="stat-mini-val text-blue-600">{stat.tiempoEstimadoMinutos}</div><div className="stat-mini-lbl">Minutos</div></div>
                          <div className="stat-mini-box"><div className="stat-mini-val text-amber-500">{stat.unlockedAchievementsCount}</div><div className="stat-mini-lbl">Logros</div></div>
                          <div className="stat-mini-box"><div className="stat-mini-val text-emerald-600">{stat.aciertos}</div><div className="stat-mini-lbl">Aciertos</div></div>
                          <div className="stat-mini-box"><div className="stat-mini-val text-rose-600">{stat.errores}</div><div className="stat-mini-lbl">Errores</div></div>
                          <div className="stat-mini-box"><div className="stat-mini-val text-indigo-600" style={{ fontSize: 15 }}>{stat.strongestVirtue}</div><div className="stat-mini-lbl">Virtud Top</div></div>
                          <div className="stat-mini-box"><div className="stat-mini-val text-cyan-600">{stat.weeklyEmotionalLogs}</div><div className="stat-mini-lbl">Logs Semana</div></div>
                        </div>

                        <div style={{ marginBottom: 16, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0", padding: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase" }}>
                            Lectura familiar rápida
                          </div>
                          <div style={{ fontSize: 13, color: "#0f172a", lineHeight: 1.5 }}>
                            Virtud más trabajada: <strong>{stat.strongestVirtue}</strong>. Racha actual: <strong>{stat.profile.current_streak} días</strong>. Emoción dominante esta semana: <strong>{stat.weeklyDominantEmotion}</strong>.
                          </div>
                        </div>

                        {/* SPARKLINE CHART (Actividad de 7 días) */}
                        <div style={{ background: "#f8fafc", padding: 12, borderRadius: 12, border: "1px solid #f1f5f9", marginBottom: 20, flex: 1, display: "flex", flexDirection: "column" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                            <Activity size={14} /> ACTIVIDAD RECIENTE (7 DÍAS)
                          </div>
                          {stat.activityMax > 0 ? (
                            <div style={{ flex: 1, position: "relative", marginTop: 10, marginBottom: 5 }}>
                              <svg viewBox="0 -10 100 120" preserveAspectRatio="none" style={{ width: "100%", height: "100%", overflow: "visible", color: stat.colorFrom }}>
                                {/* Decorative grid lines */}
                                <line x1="0" y1="0" x2="100" y2="0" stroke="#e2e8f0" strokeDasharray="2" />
                                <line x1="0" y1="50" x2="100" y2="50" stroke="#e2e8f0" strokeDasharray="2" />
                                <line x1="0" y1="100" x2="100" y2="100" stroke="#e2e8f0" strokeDasharray="2" />
                                
                                <polyline
                                  fill="none" stroke="currentColor" strokeWidth="3" vectorEffect="non-scaling-stroke"
                                  strokeLinecap="round" strokeLinejoin="round"
                                  points={stat.sparklinePoints.map(p => `${p.x},${p.y}`).join(" ")}
                                />
                                {stat.sparklinePoints.map((p, i) => (
                                  <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                                ))}
                              </svg>
                            </div>
                          ) : (
                            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>
                              Sin actividad reciente.
                            </div>
                          )}
                        </div>

                        <div className="space-y-3 mt-auto">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleViewLogs(stat.profile.id); }}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white py-3 text-sm font-bold shadow-md hover:bg-slate-800 transition"
                          >
                            <ShieldQuestion size={16} /> Ver Registros Emocionales
                          </button>

                          {heroToReset === stat.profile.id ? (
                            <div className="flex gap-2 p-2 border border-red-200 rounded-xl bg-red-50">
                              <button onClick={(e) => handleResetConfirm(stat.profile.id, e)} className="flex-1 rounded-lg bg-red-600 py-2 text-xs font-bold text-white transition hover:bg-red-700">Confirmar</button>
                              <button onClick={(e) => { e.stopPropagation(); setHeroToReset(null); }} className="flex-1 rounded-lg bg-white border border-slate-200 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50">Cancelar</button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setHeroToReset(stat.profile.id); }}
                              className="w-full text-center text-xs font-bold text-red-500 py-2 hover:text-red-700 transition"
                            >
                              ⚠️ Reestablecer Progreso
                            </button>
                          )}
                        </div>
                     </div>
                   </motion.div>
                 </motion.div>
              );
            })}
          </div>
        )}

        {/* Modal para Registros Emocionales */}
        {selectedLogs !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setSelectedLogs(null)}>
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative border border-slate-200"
            >
               {/* Same inside as before */}
               <div className="sticky top-0 bg-white pb-4 mb-4 border-b border-slate-100 flex justify-between items-center z-10">
                <h3 className="font-display text-xl font-bold text-slate-800">
                  Bitácora de {viewingProfileName}
                </h3>
                <button onClick={() => setSelectedLogs(null)} className="rounded-full p-2 hover:bg-slate-100 transition-colors text-slate-500"><XCircle size={24} /></button>
              </div>

              {selectedLogs.length === 0 ? (
                <div className="text-center py-16">
                  <span className="text-5xl">🍃</span>
                  <p className="text-slate-500 font-medium mt-4">Aún no hay registros en la bitácora de misiones.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedLogs.map((log, idx: number) => {
                    return (
                      <div key={log.id || idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md transition">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-bold text-slate-900 text-sm bg-white px-3 py-1 rounded-full border border-slate-200">
                            {EMOTIONS_MAP[log.emotion] || log.emotion}
                          </span>
                          <span className="text-xs font-bold text-slate-400">
                            {log.created_at ? new Date(log.created_at).toLocaleDateString() : 'Desconocido'}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm text-slate-600">
                          <p>🎯 <strong className="text-slate-800">Causa:</strong> {log.trigger_reason}</p>
                          <p>⚖️ <strong className="text-slate-800">Dicotomía:</strong> {log.can_control ? "Bajo mi control" : "Fuera de mi control"}</p>
                          <p>🌱 <strong className="text-slate-800">Virtud Reflejada:</strong> {log.virtue_selected || "Ninguna"}</p>
                          {log.action_plan && (
                             <div className="mt-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                               <strong className="text-slate-800 text-xs uppercase tracking-wider">Plan de Acción (Prudencia)</strong>
                               <p className="text-slate-600 italic mt-1">{log.action_plan}</p>
                             </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
