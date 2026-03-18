"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { XCircle } from "lucide-react";

export interface CelebrationData {
  type: "level_up" | "achievement";
  title: string;
  icon?: string;
  color?: string; // Color de acento (ej: #f59e0b)
}

interface CelebrationOverlayProps {
  data: CelebrationData | null;
  onClose: () => void;
}

export function CelebrationOverlay({ data, onClose }: CelebrationOverlayProps) {
  useEffect(() => {
    if (data) {
      // Activar confeti
      setTimeout(() => {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
          zIndex: 9999,
        });
      }, 300);

      // Auto cerrarse después de 4 segundos? El usuario dijo "botones de continuar" o auto-close
      const timer = setTimeout(() => {
        onClose();
      }, 4500);

      return () => clearTimeout(timer);
    }
  }, [data, onClose]);

  if (!data) return null;

  const isLevelUp = data.type === "level_up";
  const defaultIcon = isLevelUp ? "🌟" : "🏆";
  const accentColor = data.color || (isLevelUp ? "#f59e0b" : "#3b82f6");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
        style={{
          background: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(10px)",
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ 
            scale: 1, 
            opacity: 1, 
            y: 0,
            transition: { 
              type: "spring", 
              damping: 25, 
              stiffness: 300 
            } 
          }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          className="relative max-w-sm w-full bg-white/90 dark:bg-zinc-900/90 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center"
          style={{
            border: "1px solid rgba(255,255,255,0.4)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
        >
          {/* Botón de Cerrar discreto */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
          >
            <XCircle size={20} />
          </button>

          {/* Halo / Anillo iOS Style */}
          <div className="relative mb-6 flex items-center justify-center">
            {/* El Anillo de fondo rotando */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, ease: "linear", repeat: Infinity }}
              className="absolute w-36 h-36 rounded-full"
              style={{
                border: `4px dashed ${accentColor}`,
                opacity: 0.6, // Más visible
              }}
            />
            {/* El Anillo de fondo difuso fijo */}
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-32 h-32 rounded-full filter blur-2xl"
              style={{
                background: accentColor,
              }}
            />

            {/* Ícono Principal con Bounce */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                delay: 0.2, 
                type: "spring", 
                stiffness: 260, 
                damping: 15 
              }}
              className="w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center text-5xl relative z-10 border border-slate-100"
            >
              {data.icon || defaultIcon}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <span 
              className="text-xs font-bold tracking-wider uppercase mb-1 block"
              style={{ color: accentColor }}
            >
              {isLevelUp ? "¡Nuevo Nivel!" : "Logro Desbloqueado"}
            </span>
            <h2 className="font-display text-2xl font-black text-slate-900 dark:text-zinc-100 leading-tight">
              {data.title}
            </h2>
          </motion.div>

          {/* Botón de Continuar Estilo iOS */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            onClick={onClose}
            className="mt-8 rounded-full px-8 py-3 w-full font-bold text-sm shadow-md transition"
            style={{
              background: accentColor,
              color: "white",
            }}
            whileTap={{ scale: 0.98, opacity: 0.9 }}
          >
            Continuar
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
