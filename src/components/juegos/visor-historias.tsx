"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { STORIES } from "@/lib/data-stories";
import { ChevronRight, ChevronLeft, BookOpen } from "lucide-react";

export function VisorHistorias() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % STORIES.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + STORIES.length) % STORIES.length);
  };

  const story = STORIES[currentIndex];

  const colorVariants: Record<string, string> = {
    cyan: "from-cyan-500 to-blue-500 dark:from-cyan-600 dark:to-blue-600",
    amber: "from-amber-400 to-orange-500 dark:from-amber-500 dark:to-orange-600",
    green: "from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-600",
    stone: "from-stone-400 to-stone-600 dark:from-stone-500 dark:to-stone-700",
    red: "from-red-400 to-red-600 dark:from-red-500 dark:to-red-700",
    sky: "from-sky-400 to-blue-500 dark:from-sky-500 dark:to-blue-600",
    emerald: "from-emerald-400 to-green-500 dark:from-emerald-500 dark:to-green-600",
  };

  const bgGradient = colorVariants[story.colorScheme] || colorVariants["cyan"];

  return (
    <section className="rounded-2xl bg-white p-6 shadow-lg md:p-8 dark:bg-zinc-900">
      <div className="mb-6 flex items-center justify-center gap-3">
        <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        <h2 className="text-center text-3xl font-bold text-blue-700 dark:text-blue-400">
          Historias de Héroes Legendarios 📖
        </h2>
      </div>
      <p className="mb-8 text-center text-lg text-zinc-700 dark:text-zinc-300">
        Descubre cómo los antiguos (¡y tú mismo!) usaron sus superpoderes
        para vencer obstáculos.
      </p>

      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl shadow-2xl">
        {/* Fondo decorativo superior */}
        <div className={`h-24 w-full bg-gradient-to-r ${bgGradient} p-6 pb-12 transition-colors duration-500`} />
        
        <div className="relative -mt-8 rounded-t-3xl bg-white p-6 pt-8 dark:bg-zinc-950 md:p-10 md:pt-12">
           {/* Imagen / Icono ilustrativo centralizado */}
           <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-white p-2 shadow-md dark:border-zinc-950 dark:bg-zinc-950">
             <div className="relative h-16 w-16 md:h-20 md:w-20">
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
                
                <div className="space-y-4 text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {story.paragraphs.map((p, idx) => (
                    <p key={idx} dangerouslySetInnerHTML={{ __html: p }} />
                  ))}
                </div>
              </div>

              <div className="mt-8 rounded-xl bg-amber-50 p-5 shadow-inner dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50">
                <p className="text-center font-bold text-amber-800 dark:text-amber-400">
                  ⚡ Enseñanza del Héroe:
                </p>
                <p className="mt-2 text-center text-amber-900 dark:text-amber-200 italic">
                  &quot;{story.lesson}&quot;
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controles */}
        <div className="flex items-center justify-between border-t bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <Button variant="outline" size="sm" onClick={handlePrev} className="gap-2">
            <ChevronLeft className="h-4 w-4" /> Anterior
          </Button>
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Historia {currentIndex + 1} de {STORIES.length}
          </span>
          <Button variant="outline" size="sm" onClick={handleNext} className="gap-2">
            Siguiente <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
