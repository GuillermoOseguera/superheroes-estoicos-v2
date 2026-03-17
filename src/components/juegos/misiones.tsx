"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const MISIONES = [
  {
    id: "m1",
    titulo: "El Diario del Héroe (5 min) 📓",
    xp: 50,
    contenido: (
      <div className="space-y-4">
        <p className="text-zinc-700 dark:text-zinc-300">Cada noche, responde estas tres preguntas en un cuaderno:</p>
        <ul className="list-disc pl-5 text-zinc-600 dark:text-zinc-400">
          <li>¿Qué hice bien hoy? (¡Celebra tus victorias!)</li>
          <li>¿Qué podría hacer mejor mañana? (¡Siempre aprendiendo!)</li>
          <li>¿Por qué cosa estoy agradecido? (¡Encuentra lo bueno!)</li>
        </ul>
      </div>
    )
  },
  {
    id: "m2",
    titulo: "El Juego de \"¿Y Qué Si?\" 🤔",
    xp: 40,
    contenido: (
      <div className="space-y-4">
        <p className="text-zinc-700 dark:text-zinc-300">Cuando algo te preocupa, juega este juego en tu mente:</p>
        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-zinc-800">
          <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li><strong className="text-zinc-900 dark:text-zinc-100">Tú:</strong> &quot;Me preocupa reprobar el examen.&quot;</li>
            <li><strong className="text-blue-600 dark:text-blue-400">Pregúntate:</strong> <em>&quot;¿Y qué si repruebo?&quot;</em></li>
            <li><strong className="text-zinc-900 dark:text-zinc-100">Tú:</strong> &quot;Estudiaré más la próxima vez.&quot;</li>
            <li><strong className="text-blue-600 dark:text-blue-400">Pregúntate:</strong> <em>&quot;¿Eso sería el fin del mundo?&quot;</em></li>
            <li><strong className="text-zinc-900 dark:text-zinc-100">Tú:</strong> &quot;No, solo tendría que esforzarme más.&quot;</li>
          </ul>
        </div>
        <p className="font-medium text-emerald-600 dark:text-emerald-400">
          ¡Verás que la mayoría de tus preocupaciones no son tan terribles como parecen!
        </p>
      </div>
    )
  },
  {
    id: "m3",
    titulo: "La Misión Secreta de Bondad 🤫",
    xp: 100,
    contenido: (
      <div className="space-y-4">
        <p className="text-zinc-700 dark:text-zinc-300">
          Tu misión: cada día, haz algo bueno por alguien <strong className="text-red-500">sin que nadie se entere</strong>. Puede ser:
        </p>
        <ul className="list-disc pl-5 text-zinc-600 dark:text-zinc-400">
          <li>Ayudar a un compañero con su tarea.</li>
          <li>Recoger algo que se le cayó a alguien.</li>
          <li>Decir algo amable.</li>
          <li>¡Compartir tu merienda!</li>
        </ul>
      </div>
    )
  },
  {
    id: "m4",
    titulo: "Entrenamiento de Paciencia ⏳",
    xp: 60,
    contenido: (
      <div className="space-y-4">
        <p className="text-zinc-700 dark:text-zinc-300">¡Los estoicos practicaban el autocontrol! Prueba estos mini-desafíos:</p>
        <ul className="list-disc pl-5 text-zinc-600 dark:text-zinc-400">
          <li>Espera 5 minutos antes de pedir un dulce.</li>
          <li>Cuenta hasta 10 cuando estés enojado antes de reaccionar.</li>
          <li>Termina tu tarea antes de jugar, aunque no quieras.</li>
          <li>Escucha completamente a alguien sin interrumpir.</li>
        </ul>
      </div>
    )
  }
];

export function MisionesDiarias() {
  const [completadas, setCompletadas] = useState<Record<string, boolean>>({});
  const [xpGlobal, setXpGlobal] = useState(0);

  const handleCompletar = (id: string, xp: number) => {
    if (completadas[id]) return; // ya completada

    setCompletadas((prev) => ({ ...prev, [id]: true }));
    setXpGlobal((prev) => prev + xp);
    
    toast.success(`¡Misión completada! +${xp} XP`, {
      description: "Has dado un paso más para convertirte en un sabio.",
      icon: "🌟",
    });
  };

  const nivelActual = Math.floor(xpGlobal / 100) + 1;
  const progresoNivel = xpGlobal % 100;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-lg md:p-8 dark:bg-zinc-900">
      <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <h2 className="text-3xl font-bold text-blue-700 dark:text-blue-400">
          Entrenamiento de Héroe 🎯
        </h2>
        
        {/* Barra XP */}
        <motion.div 
          key={nivelActual}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex min-w-[200px] flex-col items-center rounded-xl bg-indigo-50 p-3 shadow-inner dark:bg-indigo-900/40"
        >
          <span className="mb-1 text-sm font-bold text-indigo-700 dark:text-indigo-300">
            Nivel {nivelActual}
          </span>
          <div className="h-3 w-full overflow-hidden rounded-full bg-indigo-200 dark:bg-indigo-950">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${progresoNivel}%` }}
               transition={{ duration: 0.5 }}
               className="h-full bg-indigo-500"
             />
          </div>
          <span className="mt-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">{xpGlobal} XP Totales</span>
        </motion.div>
      </div>

      <p className="mb-8 text-lg text-zinc-700 dark:text-zinc-300">
        ¡Elias, llegó la hora de tu entrenamiento! Un superhéroe de la mente practica todos los días. ¡Cumple misiones para ganar XP!
      </p>

      <Accordion className="w-full space-y-4">
        {MISIONES.map((mision) => (
          <AccordionItem 
            key={mision.id} 
            value={mision.id}
            className={`rounded-lg border px-4 transition-colors ${
              completadas[mision.id] 
                ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-900/10" 
                : "border-blue-100 bg-blue-50/30 dark:border-blue-900/30 dark:bg-blue-950/20"
            }`}
          >
            <AccordionTrigger className="text-lg font-bold hover:no-underline">
              <span className="flex items-center gap-2">
                {completadas[mision.id] && <span className="text-green-500">✅</span>}
                {mision.titulo} 
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-sm text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400">
                  {mision.xp} XP
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6">
              {mision.contenido}
              
              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={() => handleCompletar(mision.id, mision.xp)}
                  disabled={completadas[mision.id]}
                  className={completadas[mision.id] ? "bg-green-600 text-white opacity-100" : ""}
                >
                  {completadas[mision.id] ? "¡Misión Cumplida!" : "Marcar como Completada"}
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
