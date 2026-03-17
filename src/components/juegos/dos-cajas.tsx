"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { getRandomWorries, type Worry, type BoxColor } from "@/lib/data";

interface PlacedItems {
  [key: string]: BoxColor | null;
}

export function DosCajas() {
  const [items, setItems] = useState<Worry[]>([]);
  const [placedItems, setPlacedItems] = useState<PlacedItems>({});
  const [streak, setStreak] = useState(0);
  const [showResult, setShowResult] = useState<{ message: string; isPerfect?: boolean } | null>(null);

  // Drag state
  const [draggedItem, setDraggedItem] = useState<Worry | null>(null);

  useEffect(() => {
    resetGame();
  }, []);

  const resetGame = () => {
    const newItems = getRandomWorries(7);
    setItems(newItems);
    setPlacedItems({});
    setShowResult(null);
  };

  const handleDragStart = (worry: Worry) => {
    setDraggedItem(worry);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (box: BoxColor | null) => {
    if (draggedItem) {
      setPlacedItems((prev) => ({
        ...prev,
        [draggedItem.id]: box,
      }));
    }
    setDraggedItem(null);
  };

  const checkAnswers = () => {
    const totalItems = items.length;
    const placedCount = Object.keys(placedItems).filter((key) => placedItems[key] !== null).length;

    if (placedCount < totalItems) {
      setShowResult({ message: "¡Debes colocar todas las situaciones en alguna caja!" });
      setStreak(0);
      return;
    }

    let correctCount = 0;
    items.forEach((item) => {
      if (placedItems[item.id] === item.correctBox) {
        correctCount++;
      }
    });

    if (correctCount === totalItems) {
      setStreak((s) => s + 1);
      setShowResult({ message: `¡Perfecto! Acertaste ${totalItems} de ${totalItems} 🎉`, isPerfect: true });
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
      });
    } else {
      setStreak(0);
      setShowResult({ message: `Acertaste ${correctCount} de ${totalItems} 👍`, isPerfect: false });
    }
  };

  const unplacedItems = items.filter((item) => !placedItems[item.id]);
  const greenBoxItems = items.filter((item) => placedItems[item.id] === "green");
  const redBoxItems = items.filter((item) => placedItems[item.id] === "red");

  return (
    <section className="rounded-2xl bg-white p-6 shadow-lg md:p-8 dark:bg-zinc-900">
      <h2 className="mb-2 text-center text-3xl font-bold text-blue-700 dark:text-blue-400">
        Tu Primer Superpoder: La Regla de las Dos Cajas ⚡
      </h2>
      <p className="mb-6 text-center text-lg text-zinc-700 dark:text-zinc-300">
        ¡Vamos a jugar! Arrastra cada situación a la caja correcta.
      </p>
      <p className="mb-6 text-center font-semibold text-zinc-900 dark:text-zinc-100">
        La regla de oro: ¡Solo enfócate en lo que está en la caja verde! Lo de la caja roja, déjalo ir.
      </p>

      <div className="mb-8 flex justify-center">
        <div className="rounded-full bg-purple-100 px-6 py-2 text-lg font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
          Racha de aciertos: {streak} 🔥
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Pool de Opciones */}
        <div 
          className="w-full rounded-2xl bg-zinc-50 p-6 shadow-inner lg:w-1/3 dark:bg-zinc-800/50"
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(null)}
        >
          <h3 className="mb-4 text-center text-lg font-bold text-zinc-600 dark:text-zinc-400">
            Arrastra estas {unplacedItems.length} situaciones 👇
          </h3>
          <div className="flex min-h-[400px] flex-col gap-3">
            <AnimatePresence>
              {unplacedItems.map((item) => (
                <motion.div
                  key={item.id}
                  layoutId={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item)}
                  onDragEnd={handleDragEnd}
                  className="cursor-grab rounded-xl border border-zinc-200 bg-white p-4 text-center text-sm font-medium shadow-sm hover:border-blue-400 active:cursor-grabbing dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  {item.text}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Cajas */}
        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:w-2/3">
          {/* Caja Verde */}
          <div
            className="flex flex-col overflow-hidden rounded-2xl border-4 border-dashed border-green-500 bg-green-50/50 shadow-sm transition-colors dark:bg-green-950/20"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop("green")}
          >
            <div className="bg-green-500 p-4 text-center text-xl font-bold text-white">
              ✅ PUEDO CONTROLARLO
            </div>
            <div className="flex min-h-[300px] flex-col gap-3 p-4">
              <AnimatePresence>
                {greenBoxItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layoutId={item.id}
                    draggable
                    onDragStart={() => handleDragStart(item)}
                    onDragEnd={handleDragEnd}
                    className={`cursor-grab rounded-xl border-2 bg-white p-3 text-center text-sm font-medium shadow-sm hover:bg-zinc-50 active:cursor-grabbing dark:bg-zinc-800 dark:text-zinc-200 ${
                      showResult?.isPerfect ? "border-green-400 bg-green-50 dark:bg-green-900/30" : "border-green-200 dark:border-green-900"
                    }`}
                  >
                     {item.text} 
                     {showResult && !showResult.isPerfect && item.correctBox === "green" && " ✅"}
                     {showResult && !showResult.isPerfect && item.correctBox !== "green" && " ❌"}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Caja Roja */}
          <div
            className="flex flex-col overflow-hidden rounded-2xl border-4 border-dashed border-red-500 bg-red-50/50 shadow-sm transition-colors dark:bg-red-950/20"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop("red")}
          >
            <div className="bg-red-500 p-4 text-center text-xl font-bold text-white">
              ❌ NO PUEDO CONTROLARLO
            </div>
            <div className="flex min-h-[300px] flex-col gap-3 p-4">
              <AnimatePresence>
                {redBoxItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layoutId={item.id}
                    draggable
                    onDragStart={() => handleDragStart(item)}
                    onDragEnd={handleDragEnd}
                    className={`cursor-grab rounded-xl border-2 bg-white p-3 text-center text-sm font-medium shadow-sm hover:bg-zinc-50 active:cursor-grabbing dark:bg-zinc-800 dark:text-zinc-200 ${
                       showResult?.isPerfect ? "border-red-400 bg-red-50 dark:bg-red-900/30" : "border-red-200 dark:border-red-900"
                    }`}
                  >
                    {item.text}
                     {showResult && !showResult.isPerfect && item.correctBox === "red" && " ✅"}
                     {showResult && !showResult.isPerfect && item.correctBox !== "red" && " ❌"}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Controles del Juego */}
      <div className="mt-8 flex flex-col items-center gap-4">
        {showResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-md rounded-xl p-4 text-center text-lg font-bold shadow-sm ${
              showResult?.isPerfect || showResult?.message.includes("Acertaste")
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200"
                : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
            }`}
          >
            {showResult.message}
          </motion.div>
        )}

        <div className="grid w-full max-w-md grid-cols-2 gap-4">
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={resetGame}
          >
            🔄 Reiniciar
          </Button>
          <Button
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            onClick={checkAnswers}
          >
            ✅ Comprobar
          </Button>
        </div>
      </div>
    </section>
  );
}
