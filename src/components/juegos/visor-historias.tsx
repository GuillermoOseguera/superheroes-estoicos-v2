"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { STORIES } from "@/lib/data-stories";
import { ChevronRight, ChevronLeft, BookOpen, Star, CheckCircle2, RotateCcw, X, AlertTriangle } from "lucide-react";
import { useProfile } from "@/lib/profile-store";
import { addVirtueXP } from "@/lib/supabase";
import { toast } from "sonner";
import { getRequiredLevelForStory, isUnlocked } from "@/lib/progression";

// Shuffle helper (Fisher-Yates)
function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function VisorHistorias() {
  const { activeProfile, refreshProfile } = useProfile();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Persist read/ratings in localStorage
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [temperanceCounter, setTemperanceCounter] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [awardingXP, setAwardingXP] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Shuffled stories - memoized so they stay consistent during the session
  const shuffledStories = useMemo(() => shuffleArray(STORIES), []);
  const storiesWithProgress = useMemo(() => {
    return shuffledStories.map((story, index) => ({
      ...story,
      requiredLevel: getRequiredLevelForStory(story.id, index),
    }));
  }, [shuffledStories]);

  // Dynamic LocalStorage keys using profile ID
  const LS_READ_KEY = useMemo(() => `estoico_stories_read_${activeProfile?.id || "anon"}`, [activeProfile?.id]);
  const LS_RATINGS_KEY = useMemo(() => `estoico_stories_ratings_${activeProfile?.id || "anon"}`, [activeProfile?.id]);
  const LS_TEMPERANCE_COUNTER = useMemo(() => `estoico_stories_temperance_counter_${activeProfile?.id || "anon"}`, [activeProfile?.id]);

  // Load from localStorage on mount or profile change
  useEffect(() => {
    if (!activeProfile) return;
    try {
      const savedRead = localStorage.getItem(LS_READ_KEY);
      if (savedRead) setReadIds(new Set(JSON.parse(savedRead)));
      else setReadIds(new Set());

      const savedRatings = localStorage.getItem(LS_RATINGS_KEY);
      if (savedRatings) setRatings(JSON.parse(savedRatings));
      else setRatings({});

      const savedCounter = localStorage.getItem(LS_TEMPERANCE_COUNTER);
      if (savedCounter) setTemperanceCounter(parseInt(savedCounter, 10));
      else setTemperanceCounter(0);
    } catch (e) {
      console.error("Error loading story progress", e);
    }
  }, [activeProfile, LS_READ_KEY, LS_RATINGS_KEY, LS_TEMPERANCE_COUNTER]);

  // Save read IDs
  const persistRead = useCallback((newSet: Set<string>) => {
    setReadIds(newSet);
    if (activeProfile) {
      localStorage.setItem(LS_READ_KEY, JSON.stringify([...newSet]));
    }
  }, [activeProfile, LS_READ_KEY]);

  // Save ratings
  const persistRatings = useCallback((newRatings: Record<string, number>) => {
    setRatings(newRatings);
    if (activeProfile) {
      localStorage.setItem(LS_RATINGS_KEY, JSON.stringify(newRatings));
    }
  }, [activeProfile, LS_RATINGS_KEY]);

  // Mark as read + check temperance reward
  const markAsRead = useCallback(async (storyId: string) => {
    if (readIds.has(storyId)) return;

    const newSet = new Set(readIds);
    newSet.add(storyId);
    persistRead(newSet);

    // Increment temperance counter
    const newCounter = temperanceCounter + 1;
    setTemperanceCounter(newCounter);
    if (activeProfile) {
      localStorage.setItem(LS_TEMPERANCE_COUNTER, String(newCounter));
    }

    // Every 4 stories -> reward Templanza
    if (newCounter % 4 === 0 && activeProfile && !awardingXP) {
      setAwardingXP(true);
      try {
        await addVirtueXP(activeProfile.id, "temperance", 20);
        await refreshProfile();
        toast.success("¡+20 Templanza por leer 4 historias!", {
          description: "La sabiduría crece con cada historia. ¡Sigue leyendo!",
          icon: "📖",
        });
      } catch (err) {
        console.error(err);
      } finally {
        setAwardingXP(false);
      }
    }
  }, [readIds, temperanceCounter, activeProfile, awardingXP, persistRead, refreshProfile, LS_TEMPERANCE_COUNTER]);

  // Rate a story
  const rateStory = useCallback((storyId: string, rating: number) => {
    const newRatings = { ...ratings, [storyId]: rating };
    persistRatings(newRatings);

    // Also mark as read when rating
    if (!readIds.has(storyId)) {
      markAsRead(storyId);
    }
  }, [ratings, readIds, persistRatings, markAsRead]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % storiesWithProgress.length);
    setHoverStar(0);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + storiesWithProgress.length) % storiesWithProgress.length);
    setHoverStar(0);
  };

  const resetAllStories = useCallback(() => {
    if (!activeProfile) return;
    setReadIds(new Set());
    setRatings({});
    setTemperanceCounter(0);
    setHoverStar(0);
    localStorage.removeItem(LS_READ_KEY);
    localStorage.removeItem(LS_RATINGS_KEY);
    localStorage.removeItem(LS_TEMPERANCE_COUNTER);
    setCurrentIndex(0);
    setShowResetConfirm(false);
    toast.success("Biblioteca reiniciada", {
      description: "Todas las historias están como nuevas. ¡A leer de nuevo!",
      icon: "📖",
    });
  }, [activeProfile, LS_READ_KEY, LS_RATINGS_KEY, LS_TEMPERANCE_COUNTER]);

  const story = storiesWithProgress[currentIndex];
  const isRead = readIds.has(story.id);
  const currentRating = ratings[story.id] || 0;
  const totalRead = readIds.size;
  const currentLevel = activeProfile?.level ?? 1;
  const locked = !isUnlocked(story.requiredLevel, currentLevel);

  const colorVariants: Record<string, string> = {
    cyan: "from-cyan-500 to-blue-500 dark:from-cyan-600 dark:to-blue-600",
    amber: "from-amber-400 to-orange-500 dark:from-amber-500 dark:to-orange-600",
    green: "from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-600",
    stone: "from-stone-400 to-stone-600 dark:from-stone-500 dark:to-stone-700",
    red: "from-red-400 to-red-600 dark:from-red-500 dark:to-red-700",
    sky: "from-sky-400 to-blue-500 dark:from-sky-500 dark:to-blue-600",
    emerald: "from-emerald-400 to-green-500 dark:from-emerald-500 dark:to-green-600",
    indigo: "from-indigo-400 to-indigo-600 dark:from-indigo-500 dark:to-indigo-700",
    rose: "from-rose-400 to-pink-500 dark:from-rose-500 dark:to-pink-600",
    fuchsia: "from-fuchsia-400 to-purple-500 dark:from-fuchsia-500 dark:to-purple-600",
    orange: "from-orange-400 to-amber-500 dark:from-orange-500 dark:to-amber-600",
    purple: "from-purple-400 to-violet-500 dark:from-purple-500 dark:to-violet-600",
  };

  const bgGradient = colorVariants[story.colorScheme] || colorVariants["cyan"];

  // Progress info
  const nextRewardIn = 4 - (temperanceCounter % 4);

  return (
    <section className="rounded-2xl bg-white p-6 shadow-lg md:p-8 dark:bg-zinc-900">
      <div className="mb-6 flex items-center justify-center gap-3">
        <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        <h2 className="text-center text-3xl font-bold text-blue-700 dark:text-blue-400">
          Historias de Héroes Legendarios 📖
        </h2>
      </div>
      <p className="mb-4 text-center text-lg text-zinc-700 dark:text-zinc-300">
        Descubre cómo los antiguos (¡y tú mismo!) usaron sus superpoderes
        para vencer obstáculos.
      </p>

      {/* Progress bar + Reset button */}
      <div className="mb-8 mx-auto max-w-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            📚 {totalRead}/{STORIES.length} leídas
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-green-600 dark:text-green-400">
              🏛️ +Templanza en {nextRewardIn} {nextRewardIn === 1 ? "historia" : "historias"}
            </span>
            {totalRead > 0 && (
              <motion.button
                onClick={() => setShowResetConfirm(true)}
                whileHover={{ scale: 1.08, rotate: -15 }}
                whileTap={{ scale: 0.95 }}
                className="group flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-rose-500/25 transition-shadow hover:shadow-lg hover:shadow-rose-500/40"
              >
                <RotateCcw className="h-3.5 w-3.5 transition-transform group-hover:rotate-[-360deg] duration-500" />
                Reiniciar
              </motion.button>
            )}
          </div>
        </div>
        <div className="h-2.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${(totalRead / STORIES.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Reset confirmation modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowResetConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative mx-4 w-full max-w-sm overflow-hidden rounded-2xl bg-white p-0 shadow-2xl dark:bg-zinc-900"
            >
              {/* Modal gradient header */}
              <div className="bg-gradient-to-r from-rose-500 to-red-600 px-6 pb-6 pt-8 text-center">
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: [0, -15, 15, -15, 0] }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
                >
                  <AlertTriangle className="h-8 w-8 text-white" />
                </motion.div>
                <h3 className="text-xl font-black text-white">
                  ¿Reiniciar biblioteca?
                </h3>
              </div>

              <div className="px-6 pb-2 pt-5 text-center">
                <p className="text-zinc-600 dark:text-zinc-300">
                  Se borrarán todas las historias leídas y calificaciones.
                  <br />
                  <span className="mt-1 inline-block text-sm font-medium text-rose-600 dark:text-rose-400">
                    Esta acción no se puede deshacer.
                  </span>
                </p>
              </div>

              <div className="flex gap-3 px-6 py-5">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowResetConfirm(false)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-zinc-200 bg-white py-3 text-sm font-bold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={resetAllStories}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 py-3 text-sm font-bold text-white shadow-md shadow-rose-500/30 transition-shadow hover:shadow-lg hover:shadow-rose-500/50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reiniciar todo
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl shadow-2xl">
        {/* Fondo decorativo superior */}
        <div className={`h-40 w-full bg-gradient-to-r ${bgGradient} p-6 pb-16 transition-colors duration-500 relative`}>
          {locked && (
            <div className="absolute left-4 top-4 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-bold text-white shadow-md">
              🔒 Se desbloquea en nivel {story.requiredLevel}
            </div>
          )}
          {/* Read badge */}
          {isRead && !locked && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/90 dark:bg-zinc-900/90 rounded-full px-3 py-1.5 shadow-md"
            >
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-xs font-bold text-green-600 dark:text-green-400">LEÍDA</span>
            </motion.div>
          )}
        </div>
        
        <div className="relative -mt-8 rounded-t-3xl bg-white p-6 pt-28 dark:bg-zinc-950 md:p-10 md:pt-32">
           {/* Imagen / Icono ilustrativo centralizado */}
           <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-white p-3 shadow-lg dark:border-zinc-950 dark:bg-zinc-950">
             <div className="relative h-36 w-36 md:h-44 md:w-44">
               <Image
                 src="/cuentos.png" 
                 alt="Cuentos Estoicos"
                 fill
                 className="object-contain"
               />
             </div>
           </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={story.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex min-h-[300px] flex-col justify-between"
            >
              <div>
                <h3 className="mb-6 text-center text-2xl font-black text-zinc-900 dark:text-zinc-100 md:text-3xl">
                  {story.title}
                </h3>

                {locked ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
                    <div className="mb-3 text-5xl">🔐</div>
                    <p className="text-lg font-bold text-slate-800 dark:text-zinc-100">
                      Esta historia aún está sellada.
                    </p>
                    <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-zinc-300">
                      Sigue entrenando hasta el nivel {story.requiredLevel} para desbloquearla. La progresión ahora abre nuevos relatos y crea una razón real para volver.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {story.paragraphs.map((p, idx) => (
                      <p key={idx} dangerouslySetInnerHTML={{ __html: p }} />
                    ))}
                  </div>
                )}
              </div>

              {!locked && (
                <div className="mt-8 rounded-xl bg-amber-50 p-5 shadow-inner dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50">
                  <p className="text-center font-bold text-amber-800 dark:text-amber-400">
                    ⚡ Enseñanza del Héroe:
                  </p>
                  <p className="mt-2 text-center text-amber-900 dark:text-amber-200 italic">
                    &quot;{story.lesson}&quot;
                  </p>
                </div>
              )}

              {/* Star Rating */}
              {!locked && (
                <div className="mt-6 flex flex-col items-center gap-2">
                <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                  ¿Qué te pareció esta historia?
                </p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= (hoverStar || currentRating);
                    return (
                      <motion.button
                        key={star}
                        onClick={() => rateStory(story.id, star)}
                        onMouseEnter={() => setHoverStar(star)}
                        onMouseLeave={() => setHoverStar(0)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                      >
                        <Star
                          className={`h-8 w-8 transition-colors duration-150 ${
                            isFilled
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-transparent text-zinc-300 dark:text-zinc-600"
                          }`}
                        />
                      </motion.button>
                    );
                  })}
                </div>
                {currentRating > 0 && (
                  <motion.span
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-medium text-yellow-600 dark:text-yellow-400"
                  >
                    Tu calificación: {currentRating}/5 ⭐
                  </motion.span>
                )}
              </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controles */}
        <div className="flex items-center justify-between border-t bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <Button variant="outline" size="sm" onClick={handlePrev} className="gap-2">
            <ChevronLeft className="h-4 w-4" /> Anterior
          </Button>
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Historia {currentIndex + 1} de {storiesWithProgress.length}
          </span>
          <Button variant="outline" size="sm" onClick={handleNext} className="gap-2">
            Siguiente <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
