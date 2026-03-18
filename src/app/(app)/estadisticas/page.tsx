"use client";

import { useEffect, useState } from "react";
import { supabase, type Profile, type GameResult, resetHeroProgress } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Trash2, AlertTriangle, Clock, Target, XCircle, RotateCcw, BookOpen, Trophy, Gamepad } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useProfile } from "@/lib/profile-store";

interface HeroStats {
  profile: Profile;
  aciertos: number;
  errores: number;
  totalSesiones: number;
  tiempoEstimadoMinutos: number; 
  booksRead: number;
  mostPlayedGame: string;
  unlockedAchievementsCount: number;
}

// Mapa temporal para saber la base image de los 3 héroes principales (igual que en page.tsx)
const HERO_IMAGES: Record<string, string> = {
  "00000000-0000-0000-0000-000000000001": "/images/avatars/elias_base.png",
  "00000000-0000-0000-0000-000000000002": "/images/avatars/atenea_base.png",
  "00000000-0000-0000-0000-000000000003": "/images/avatars/marco_base.png",
};

const GAME_NAMES: Record<string, string> = {
  "dos_cajas": "Las Dos Cajas",
  "semaforo_emocional": "Semáforo Emocional",
  "defensor_mente": "Defensor de la Mente",
};

export default function EstadisticasPage() {
  const [stats, setStats] = useState<HeroStats[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Para la doble confirmación
  const [heroToReset, setHeroToReset] = useState<string | null>(null);

  // Para ver registros emocionales
  const [selectedLogs, setSelectedLogs] = useState<any[] | null>(null);
  const [viewingProfileName, setViewingProfileName] = useState("");

  const { activeProfile, refreshProfile } = useProfile();

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
    } catch (e) {
      console.error(e);
      toast.error("No se pudieron cargar los registros.");
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const { data: profilesData } = await supabase.from("profiles").select("*").order("name");
      const { data: resultsData } = await supabase.from("game_results").select("*");
      const { data: achievementsData } = await supabase.from("unlocked_achievements").select("*");

      if (profilesData && resultsData) {
        const statsList: HeroStats[] = profilesData.map((profile: Profile) => {
          const userResults = resultsData.filter((r: GameResult) => r.user_id === profile.id);
          const aciertos = userResults.filter((r) => r.xp_earned > 0).length;
          const errores = userResults.filter((r) => r.xp_earned <= 0).length;
          const totalSesiones = userResults.length;
          
          // Estimación temporal: 2 minutos por sesión/desafío
          const tiempoEstimadoMinutos = totalSesiones * 2; 

          // 1. Libros Leídos (Ratings en localStorage)
          let booksRead = 0;
          try {
            const savedRatings = localStorage.getItem(`estoico_stories_ratings_${profile.id}`);
            if (savedRatings) {
              const ratingsObj = JSON.parse(savedRatings);
              booksRead = Object.keys(ratingsObj).length;
            }
          } catch (e) {
            console.error("Error reading books ratings", e);
          }

          // 2. Juego más jugado
          const gameCounts: Record<string, number> = {};
          userResults.forEach((r) => {
            const gid = r.game_id || "desconocido";
            gameCounts[gid] = (gameCounts[gid] || 0) + 1;
          });
          let mostPlayedGameId = "Ninguno";
          let maxCount = 0;
          for (const [gid, count] of Object.entries(gameCounts)) {
            if (count > maxCount) {
              maxCount = count;
              mostPlayedGameId = gid;
            }
          }
          const mostPlayedGame = GAME_NAMES[mostPlayedGameId] || mostPlayedGameId;

          // 3. Logros
          const userAchievements = achievementsData ? achievementsData.filter((a: any) => a.profile_id === profile.id) : [];
          const unlockedAchievementsCount = userAchievements.length;

          return {
            profile,
            aciertos,
            errores,
            totalSesiones,
            tiempoEstimadoMinutos,
            booksRead,
            mostPlayedGame,
            unlockedAchievementsCount
          };
        });

        setStats(statsList);
      }
    } catch (error) {
      console.error("Error cargando estadísticas", error);
      toast.error("Error al cargar las estadísticas");
    } finally {
      setLoading(false);
    }
  };

  const handleResetConfirm = async (heroId: string) => {
    try {
      setLoading(true);
      await resetHeroProgress(heroId);
      
      // Si estamos reseteando al perfil activo actual, forzamos recarga del store
      if (activeProfile?.id === heroId) {
        await refreshProfile();
      }

      toast.success("Progreso borrado correctamente", { icon: "🧹" });
      setHeroToReset(null);
      await loadStats(); // Recargar datos
    } catch (error) {
      console.error("Error al borrar el progreso", error);
      toast.error("Ocurrió un error al intentar borrar el progreso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="main-header" style={{ marginLeft: -24, marginRight: -24, marginTop: -24, marginBottom: 24, padding: "16px 24px" }}>
        <div className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>
          ACADEMIA ESTOICA GOPLEMMINGS
        </div>
        <div style={{ fontSize: 13, color: "#94a3b8" }}>Estadísticas de Héroes</div>
      </div>

      <div className="page-content" style={{ padding: 0 }}>
        <p className="mb-6 text-slate-800" style={{ fontWeight: 500, fontSize: 15 }}>
          Aquí puedes observar el progreso y uso de cada uno de los estudiantes en la academia.
        </p>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <span className="text-slate-500 font-medium tracking-widest uppercase">Cargando oráculo...</span>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat, i) => (
               <motion.div
                 key={stat.profile.id}
                 className="parchment-card relative flex flex-col items-center"
                 initial={{ opacity: 0, y: 30 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.1 }}
                 style={{ overflow: "hidden" }}
               >
                 {stat.totalSesiones === 0 && (
                    <div className="absolute top-3 right-3 rounded-full bg-slate-200 px-2 py-1 text-xs font-bold text-slate-500">
                      NUEVO
                    </div>
                 )}

                 {/* Avatar */}
                 <div style={{ width: 100, height: 100, borderRadius: "50%", overflow: "hidden", border: "3px solid var(--gold-400)", marginBottom: 16 }}>
                    <Image 
                      src={HERO_IMAGES[stat.profile.id] || "/images/avatars/elias_base.png"} 
                      alt={stat.profile.name}
                      width={100} 
                      height={100}
                      style={{ objectFit: "cover" }}
                    />
                 </div>
                 
                 <h2 className="font-display mb-1 text-xl font-bold text-slate-900">{stat.profile.name}</h2>
                 <p className="text-sm font-semibold text-gold-500" style={{ color: "var(--gold-500)", marginBottom: 24 }}>
                   Nivel {stat.profile.level} - {stat.profile.total_xp} XP
                 </p>

                  {/* Métricas */}
                  <div className="w-full space-y-3 mb-6">
                    <div className="flex items-center justify-between rounded-lg bg-white/50 p-3 shadow-sm border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock size={16} />
                        <span className="text-sm font-medium">Tiempo de uso</span>
                      </div>
                      <span className="font-bold text-slate-800">{stat.tiempoEstimadoMinutos} mins</span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-green-50/50 p-3 shadow-sm border border-green-100">
                      <div className="flex items-center gap-2 text-green-700">
                        <Target size={16} />
                        <span className="text-sm font-medium">Aciertos</span>
                      </div>
                      <span className="font-bold text-green-800">{stat.aciertos}</span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-red-50/50 p-3 shadow-sm border border-red-100">
                      <div className="flex items-center gap-2 text-red-700">
                        <XCircle size={16} />
                        <span className="text-sm font-medium">Errores</span>
                      </div>
                      <span className="font-bold text-red-800">{stat.errores}</span>
                    </div>

                    {/* NUEVAS MÉTRICAS */}
                    <div className="flex items-center justify-between rounded-lg bg-blue-50/50 p-3 shadow-sm border border-blue-100">
                      <div className="flex items-center gap-2 text-blue-700">
                        <BookOpen size={16} />
                        <span className="text-sm font-medium">Libros leídos</span>
                      </div>
                      <span className="font-bold text-blue-800">{stat.booksRead}</span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-amber-50/50 p-3 shadow-sm border border-amber-100">
                      <div className="flex items-center gap-2 text-amber-700">
                        <Trophy size={16} />
                        <span className="text-sm font-medium">Logros</span>
                      </div>
                      <span className="font-bold text-amber-800">{stat.unlockedAchievementsCount}</span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-purple-50/50 p-3 shadow-sm border border-purple-100">
                      <div className="flex items-center gap-2 text-purple-700">
                        <Gamepad size={16} />
                        <span className="text-sm font-medium">Más jugado</span>
                      </div>
                      <span className="font-bold text-purple-800 text-xs text-right truncate max-w-[120px]">
                        {stat.mostPlayedGame}
                      </span>
                    </div>
                  </div>

                  {/* Botón Semáforo Emocional */}
                  <div className="w-full mb-4">
                    <button
                      onClick={() => handleViewLogs(stat.profile.id)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 text-white py-2.5 text-sm font-bold shadow-md hover:bg-slate-700 transition"
                    >
                      🚦 Ver Mis Registros Emocionales
                    </button>
                  </div>

                 {/* Zona de Peligro (Reset) */}
                 <div className="mt-auto w-full border-t border-slate-200/60 pt-4">
                    {heroToReset === stat.profile.id ? (
                      <div className="flex flex-col gap-2">
                        <p className="text-xs font-bold text-red-600 text-center flex items-center justify-center gap-1">
                          <AlertTriangle size={14}/> ¡Esto no se puede deshacer!
                        </p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleResetConfirm(stat.profile.id)}
                            className="flex-1 rounded-md bg-red-600 py-2 text-xs font-bold text-white transition hover:bg-red-700"
                          >
                            Eliminar Todo
                          </button>
                          <button 
                            onClick={() => setHeroToReset(null)}
                            className="flex-1 rounded-md bg-slate-200 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-300"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setHeroToReset(stat.profile.id)}
                        className="flex w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
                      >
                        <RotateCcw size={14} /> Reestablecer Progreso
                      </button>
                    )}
                 </div>

               </motion.div>
            ))}
          </div>
        )}
        {/* Modal para Registros Emocionales */}
        {selectedLogs !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl relative border border-slate-200"
            >
              <div className="sticky top-0 bg-white pb-4 mb-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-display text-xl font-bold text-slate-800">
                  Registros Emocionales de {viewingProfileName}
                </h3>
                <button 
                  onClick={() => setSelectedLogs(null)}
                  className="rounded-full p-1 hover:bg-slate-100 transition-colors text-slate-500"
                >
                  <XCircle size={24} />
                </button>
              </div>

              {selectedLogs.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl">🍃</span>
                  <p className="text-slate-400 font-medium mt-3">Aún no hay registros en la bitácora.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedLogs.map((log: any, idx: number) => {
                    const EMOTIONS_MAP: Record<string, string> = {
                      angry: "😡 Enojo", sad: "😢 Tristeza", anxious: "😰 Ansiedad", 
                      frustrated: "😔 Frustración", scared: "😨 Miedo", neutral: "😐 Calma"
                    };
                    return (
                      <div key={log.id || idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-slate-800 text-sm">
                            {EMOTIONS_MAP[log.emotion] || log.emotion}
                          </span>
                          <span className="text-xs font-bold text-slate-400">
                            {log.created_at ? new Date(log.created_at).toLocaleDateString() : 'Desconocido'}
                          </span>
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-600">
                          <p>🎯 <strong className="text-slate-700">Causa:</strong> {log.trigger_reason}</p>
                          <p>⚖️ <strong className="text-slate-700">Dicotomía:</strong> {log.can_control ? "Bajo mi control" : "Fuera de mi control"}</p>
                          <p>🌱 <strong className="text-slate-700">Virtud:</strong> {log.virtue_selected || "Ninguna"}</p>
                          <div className="mt-2 p-2 rounded bg-white border border-slate-100">
                            <strong className="text-slate-700">Plan de Acción:</strong>
                            <p className="text-slate-600 italic mt-0.5">{log.action_plan}</p>
                          </div>
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
