"use client";

import { motion, AnimatePresence } from "framer-motion";
import { NOVEDADES } from "@/lib/novedades";

interface NovedadesModalProps {
  open: boolean;
  onClose: () => void;
  onDismissForever: () => void;
}

export function NovedadesModal({ open, onClose, onDismissForever }: NovedadesModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(560px, 100%)",
              maxHeight: "85vh",
              overflowY: "auto",
              borderRadius: 24,
              background: "white",
              boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
            }}
          >
            {/* Encabezado */}
            <div
              style={{
                background: "linear-gradient(135deg, #1e293b, #0f172a)",
                padding: "28px 28px 22px",
                textAlign: "center",
                color: "white",
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 6 }}>🎁</div>
              <h2 className="font-display" style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>
                ¡Novedades en la Academia!
              </h2>
              <p style={{ fontSize: 13, color: "#cbd5e1" }}>
                Tu entrenamiento estoico tiene nuevas herramientas. Esto es lo que llegó:
              </p>
            </div>

            {/* Lista de novedades */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
              {NOVEDADES.map((item, i) => (
                <motion.div
                  key={item.titulo}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.07 }}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 14,
                    padding: "12px 14px",
                  }}
                >
                  <div style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{item.emoji}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>{item.titulo}</div>
                    <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, marginTop: 2 }}>
                      {item.descripcion}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Acciones */}
            <div style={{ padding: "0 24px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={onClose}
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: 14,
                  padding: "13px",
                  background: "linear-gradient(135deg, #fbbf24, #d97706)",
                  color: "#0f172a",
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: "pointer",
                }}
              >
                ¡Entendido, a entrenar! ⚔️
              </button>
              <button
                onClick={onDismissForever}
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: 12,
                  padding: "9px",
                  background: "transparent",
                  color: "#94a3b8",
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                No volver a mostrar este aviso
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
