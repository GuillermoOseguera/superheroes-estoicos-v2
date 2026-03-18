"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getRandomVirtueChallenge, type VirtueChallenge, type Virtue } from "@/lib/data-virtues";
import { useProfile } from "@/lib/profile-store";
import { addGameXP, addVirtueXP } from "@/lib/supabase";
import { toast } from "sonner";

const VIRTUE_ASSETS: Record<Virtue, { src: string; bgColor: string; hoverBg: string; textColor: string; label: string }> = {
  sabiduria: {
    src: "/Sabiduria.png",
    bgColor: "bg-yellow-400 dark:bg-yellow-500",
    hoverBg: "hover:bg-yellow-500 dark:hover:bg-yellow-600",
    textColor: "text-yellow-900",
    label: "Sabiduría"
  },
  coraje: {
    src: "/Coraje.png",
    bgColor: "bg-red-400 dark:bg-red-500",
    hoverBg: "hover:bg-red-500 dark:hover:bg-red-600",
    textColor: "text-red-900",
    label: "Coraje"
  },
  justicia: {
    src: "/Justicia.png",
    bgColor: "bg-blue-400 dark:bg-blue-500",
    hoverBg: "hover:bg-blue-500 dark:hover:bg-blue-600",
    textColor: "text-blue-900",
    label: "Justicia"
  },
  templanza: {
    src: "/Templanza.png",
    bgColor: "bg-green-400 dark:bg-green-500",
    hoverBg: "hover:bg-green-500 dark:hover:bg-green-600",
    textColor: "text-green-900",
    label: "Templanza"
  }
};

export function DesafioVirtudes() {
  const [challenge, setChallenge] = useState<VirtueChallenge | null>(null);
  const [selectedVirtue, setSelectedVirtue] = useState<Virtue | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const { activeProfile, refreshProfile } = useProfile();

  useEffect(() => {
    loadNewChallenge();
  }, []);

  const loadNewChallenge = () => {
    setChallenge(getRandomVirtueChallenge());
    setSelectedVirtue(null);
    setFeedback(null);
  };

  const handleVirtueSelect = async (virtue: Virtue) => {
    if (feedback || !challenge || loadingAction || !activeProfile) return; // Ya respondió o está cargando

    setLoadingAction(true);
    setSelectedVirtue(virtue);
    const isCorrect = virtue === challenge.correctVirtue;
    
    setFeedback({
      isCorrect,
      message: isCorrect 
        ? challenge.feedback 
        : `Hmm, esa no es la mejor para esta situación. La correcta era la ${VIRTUE_ASSETS[challenge.correctVirtue].label}.`
    });

    try {
      const xpDelta = isCorrect ? 50 : -20;
      await addGameXP(activeProfile.id, "desafio_virtudes", isCorrect ? 1 : 0, xpDelta);

      if (isCorrect) {
        const virtueMap: Record<Virtue, "wisdom" | "courage" | "justice" | "temperance"> = {
          sabiduria: "wisdom",
          coraje: "courage",
          justicia: "justice",
          templanza: "temperance"
        };
        await addVirtueXP(activeProfile.id, virtueMap[virtue], 10);
      }

      await refreshProfile(); // Recarga la UI del header para que se vea el cambio de nivel/xp

      if (isCorrect) {
        toast.success(`¡Respuesta Correcta!`, { 
          description: `+50 XP ganados y +10 en ${VIRTUE_ASSETS[virtue].label}.`,
          icon: '✨' 
        });
      } else {
        toast.error(`Respuesta Incorrecta`, { 
          description: `-20 XP. Aprende del error y sigue adelante.`,
          icon: '📉' 
        });
      }
    } catch (error) {
      console.error("Error asignando XP", error);
      toast.error("Error al actualizar la base de datos");
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow-lg md:p-8 dark:bg-zinc-900">
      <h2 className="mb-6 text-center text-3xl font-bold text-blue-700 dark:text-blue-400">
        Sección 3: El Desafío de las 4 Virtudes ⚔️
      </h2>
      <p className="mb-8 text-center text-lg text-zinc-700 dark:text-zinc-300">
        ¡Hora del desafío, Elías! Te enfrentarás a situaciones reales. Elige el
        &quot;superpoder&quot; (la virtud) que mejor te ayudaría a manejarla.
      </p>

      <div className="mx-auto max-w-3xl rounded-xl bg-zinc-50 p-6 shadow-inner dark:bg-zinc-800/50">
        {/* Escenario */}
        <div className="mb-8 flex min-h-[100px] items-center justify-center rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
          <p className="text-center text-xl font-medium text-zinc-800 dark:text-zinc-100">
            {challenge ? challenge.scenario : "Cargando desafío..."}
          </p>
        </div>

        {/* Botones de Virtud */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {(Object.keys(VIRTUE_ASSETS) as Virtue[]).map((virtue) => {
             const asset = VIRTUE_ASSETS[virtue];
             const isSelected = selectedVirtue === virtue;
             const showAsCorrect = feedback && challenge?.correctVirtue === virtue;
             const showAsIncorrect = feedback && isSelected && !feedback.isCorrect;

             return (
               <motion.button
                 key={virtue}
                 onClick={() => handleVirtueSelect(virtue)}
                 whileHover={!feedback ? { scale: 1.05 } : {}}
                 whileTap={!feedback ? { scale: 0.95 } : {}}
                 className={`group relative flex aspect-square flex-col items-center justify-center rounded-2xl p-4 shadow transition-all duration-200
                   ${asset.bgColor} ${!feedback && asset.hoverBg} ${asset.textColor}
                   ${feedback && !isSelected && !showAsCorrect ? "opacity-50 grayscale" : ""}
                   ${showAsIncorrect ? "ring-4 ring-red-500" : ""}
                   ${showAsCorrect ? "ring-4 ring-green-500 scale-105" : ""}
                 `}
                 disabled={!!feedback}
               >
                 <div className="relative h-24 w-24 md:h-32 md:w-32">
                   <Image
                     src={asset.src}
                     alt={`Símbolo de ${asset.label}`}
                     fill
                     className="object-contain transition-transform duration-300 group-hover:scale-110"
                   />
                 </div>
                 
                 {/* Capa oscura con el texto grande en Hover */}
                 <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/50 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
                   <span className="text-2xl md:text-3xl font-black text-white tracking-widest uppercase drop-shadow-md">
                     {asset.label}
                   </span>
                 </div>
               </motion.button>
             );
          })}
        </div>

        {/* Feedback y Siguiente */}
        <div className="min-h-[120px]">
          <AnimatePresence mode="wait">
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center gap-4 text-center"
              >
                <div
                  className={`rounded-lg p-4 text-lg font-medium shadow-sm ${
                    feedback.isCorrect
                      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
                  }`}
                >
                  {feedback.message}
                </div>
                <Button
                  size="lg"
                  className="w-full max-w-sm bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  onClick={loadNewChallenge}
                >
                  Siguiente Desafío ➡️
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
