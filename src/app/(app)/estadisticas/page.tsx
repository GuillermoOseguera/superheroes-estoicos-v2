"use client";

import { useEffect, useState } from "react";
import { supabase, type Profile, type GameResult, resetHeroProgress } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Trash2, AlertTriangle, Clock, Target, XCircle, RotateCcw } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useProfile } from "@/lib/profile-store";

interface HeroStats {
  profile: Profile;
  aciertos: number;
  errores: number;
  totalSesiones: number;
  tiempoEstimadoMinutos: number; 
}

// Mapa temporal para saber la base image de los 3 héroes principales (igual que en page.tsx)
const HERO_IMAGES: Record<string, string> = {
  "00000000-0000-0000-0000-000000000001": "/images/avatars/elias_base.png",
  "00000000-0000-0000-0000-000000000002": "/images/avatars/atenea_base.png",
  "00000000-0000-0000-0000-000000000003": "/images/avatars/marco_base.png",
};

export default function EstadisticasPage() {
  const [stats, setStats] = useState<HeroStats[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Para la doble confirmación
  const [heroToReset, setHeroToReset] = useState<string | null>(null);
  
  const { activeProfile, refreshProfile } = useProfile();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const { data: profilesData } = await supabase.from("profiles").select("*").order("name");
      const { data: resultsData } = await supabase.from("game_results").select("*");

      if (profilesData && resultsData) {
        const statsList: HeroStats[] = profilesData.map((profile: Profile) => {
          const userResults = resultsData.filter((r: GameResult) => r.user_id === profile.id);
          const aciertos = userResults.filter((r) => r.xp_earned > 0).length;
          const errores = userResults.filter((r) => r.xp_earned <= 0).length;
          const totalSesiones = userResults.length;
          
          // Estimación temporal: 2 minutos por sesión/desafío
          const tiempoEstimadoMinutos = totalSesiones * 2; 

          return {
            profile,
            aciertos,
            errores,
            totalSesiones,
            tiempoEstimadoMinutos
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
                 <div className="w-full space-y-3 mb-8">
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
      </div>
    </div>
  );
}
