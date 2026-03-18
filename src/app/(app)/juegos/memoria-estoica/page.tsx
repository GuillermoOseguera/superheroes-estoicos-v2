"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useProfile } from "@/lib/profile-store";
import { addGameXP, addVirtueXP } from "@/lib/supabase";
import { triggerAchievementAnimation } from "@/lib/confetti";

// Usaremos 12 imágenes únicas para formar 24 cartas (4 col x 6 filas)
const AVAILABLE_IMAGES = [
  "/images/memoria/memoria_buhosabio_1773871316643.png",
  "/images/memoria/memoria_escudoespartano_1773871329601.png",
  "/images/memoria/memoria_espadajusticia_1773871342247.png",
  "/images/memoria/memoria_balanza_1773871354443.png",
  "/images/memoria/memoria_fuegotemplanza_1773871365774.png",
  "/images/memoria/memoria_pergaminoluz_1773871379796.png",
  "/images/memoria/memoria_monedaoro_1773871392249.png",
  "/images/memoria/memoria_cascogriego_1773871408248.png",
  "/images/memoria/memoria_columnablanc_1773871419478.png",
  "/images/memoria/memoria_arbololivo_1773871433196.png",
  "/images/memoria/memoria_estatuafilosofo_1773871446603.png",
  "/images/memoria/memoria_solamanecer_1773871461412.png",
];

interface CardData {
  id: string; // Unique ID per card object
  imageUrl: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function MemoriaEstoicaPage() {
  const router = useRouter();
  const { activeProfile, refreshProfile } = useProfile();
  
  const [cards, setCards] = useState<CardData[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [processingXP, setProcessingXP] = useState(false);

  // Initialize game
  useEffect(() => {
    startNewGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startNewGame = () => {
    // Create pairs, 12 images -> 24 cards
    const deck = [...AVAILABLE_IMAGES, ...AVAILABLE_IMAGES].map((url) => ({
      id: Math.random().toString(36).substring(2, 9),
      imageUrl: url,
      isFlipped: false,
      isMatched: false,
    }));

    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    setCards(deck);
    setFlippedIndices([]);
    setMoves(0);
    setMatches(0);
    setIsGameOver(false);
    setIsLocked(false);
  };

  const handleCardClick = (index: number) => {
    if (isLocked) return;
    if (cards[index].isFlipped || cards[index].isMatched) return;

    // Flip the selected card
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlippedIndices = [...flippedIndices, index];
    setFlippedIndices(newFlippedIndices);

    // If memory test
    if (newFlippedIndices.length === 2) {
      setIsLocked(true);
      setMoves((m) => m + 1);

      const [firstIndex, secondIndex] = newFlippedIndices;
      const firstCard = newCards[firstIndex];
      const secondCard = newCards[secondIndex];

      if (firstCard.imageUrl === secondCard.imageUrl) {
        // Match found
        setTimeout(() => {
          setCards((prev) => {
            const matchedCards = [...prev];
            matchedCards[firstIndex].isMatched = true;
            matchedCards[secondIndex].isMatched = true;
            return matchedCards;
          });
          setFlippedIndices([]);
          setIsLocked(false);
          setMatches((prev) => {
            const newMatches = prev + 1;
            if (newMatches === AVAILABLE_IMAGES.length) {
              handleVictory(moves + 1);
            }
            return newMatches;
          });
        }, 600);
      } else {
        // No match
        setTimeout(() => {
          setCards((prev) => {
            const resetCards = [...prev];
            resetCards[firstIndex].isFlipped = false;
            resetCards[secondIndex].isFlipped = false;
            return resetCards;
          });
          setFlippedIndices([]);
          setIsLocked(false);
        }, 1000); // 1 second observation time
      }
    }
  };

  const handleVictory = async (totalMoves: number) => {
    setIsGameOver(true);
    triggerAchievementAnimation();
    
    // Cálculo de XP: 
    // Base 100 XP. Penalización: 2 XP por cada movimiento encima de 12 (el mínimo perfecto).
    // Minimo a otorgar siempre: 20 XP.
    const idealMoves = AVAILABLE_IMAGES.length;
    let earnedXp = 100 - ((totalMoves - idealMoves) * 2);
    if (earnedXp < 20) earnedXp = 20;

    if (activeProfile) {
      try {
        setProcessingXP(true);
        await addGameXP(activeProfile.id, "memoria_estoica", totalMoves, earnedXp);
        await addVirtueXP(activeProfile.id, "wisdom", 50);
        await refreshProfile();
        toast.success(`Mente clara. +${earnedXp} XP y +50 Prudencia`, { icon: "🧠" });
      } catch (err) {
        console.error(err);
        toast.error("Error guardando progreso");
      } finally {
        setProcessingXP(false);
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", padding: "20px 0" }}>
      {/* Header */}
      <div className="main-header" style={{ marginLeft: -24, marginRight: -24, marginTop: -44, marginBottom: 24, padding: "16px 24px", display: "flex", gap: 16, alignItems: "center" }}>
        <button
          onClick={() => router.push("/juegos")}
          className="text-slate-400 hover:text-white transition"
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <ArrowLeft />
        </button>
        <div>
          <div className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>
            ACADEMIA ESTOICA GOPLEMMINGS
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>Memoria Estoica</div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 className="font-display text-slate-800" style={{ fontSize: 24, fontWeight: 700 }}>Memoria Estoica</h2>
        
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div className="parchment-card" style={{ padding: "8px 16px", borderRadius: 12 }}>
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>MOVIMIENTOS:</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: "var(--gold-600)", marginLeft: 8 }}>{moves}</span>
          </div>
          <button
            onClick={startNewGame}
            title="Reiniciar Tablero"
            className="parchment-card"
            style={{ padding: "10px", borderRadius: 12, cursor: "pointer", background: "white" }}
          >
            <RotateCcw size={20} color="#475569" />
          </button>
        </div>
      </div>

      {isGameOver ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="parchment-card"
          style={{ textAlign: "center", padding: 40, marginTop: 40 }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>🧠</div>
          <h2 className="font-display" style={{ fontSize: 32, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
            ¡Mente Clara y Serena!
          </h2>
          <p style={{ color: "#475569", fontSize: 16, maxWidth: 400, margin: "0 auto 24px" }}>
            Has encontrado todos los pares en {moves} movimientos. Una memoria aguda es el reflejo de una mente ordenada.
          </p>
          <button
            onClick={startNewGame}
            disabled={processingXP}
            style={{
              background: "linear-gradient(135deg, #d4a017, #f0c840)",
              color: "#1e293b",
              border: "none",
              borderRadius: 12,
              padding: "16px 32px",
              fontWeight: 700,
              fontSize: 16,
              cursor: processingXP ? "not-allowed" : "pointer",
              opacity: processingXP ? 0.7 : 1,
            }}
          >
            {processingXP ? "Guardando Progreso..." : "Jugar de Nuevo"}
          </button>
        </motion.div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "12px",
            maxWidth: 600,
            margin: "0 auto",
          }}
        >
          <AnimatePresence>
            {cards.map((card, idx) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => handleCardClick(idx)}
                style={{
                  width: "100%",
                  aspectRatio: "3/4",
                  position: "relative",
                  cursor: (card.isFlipped || card.isMatched) ? "default" : "pointer",
                  perspective: 1000,
                }}
              >
                <motion.div
                  style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    transformStyle: "preserve-3d",
                    transition: "transform 0.5s",
                    transform: (card.isFlipped || card.isMatched) ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                >
                  {/* Frente (oculto / reverso de baraja) */}
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      position: "absolute",
                      backfaceVisibility: "hidden",
                      background: "linear-gradient(135deg, #1e293b, #0f172a)",
                      borderRadius: 12,
                      border: "2px solid #334155",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div style={{ width: 40, height: 40, opacity: 0.5 }}>
                      <Image src="/images/gop_logo.png" alt="Card back" fill style={{ objectFit: "contain" }} />
                    </div>
                  </div>

                  {/* Detrás (imagen descubierta) */}
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      position: "absolute",
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      background: "#f8fafc",
                      borderRadius: 12,
                      border: `3px solid ${card.isMatched ? "var(--gold-400)" : "#cbd5e1"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      boxShadow: card.isMatched ? "0 0 15px rgba(212, 160, 23, 0.4)" : "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  >
                    <Image
                      src={card.imageUrl}
                      alt="Memory Card"
                      fill
                      style={{ objectFit: "cover", opacity: card.isMatched ? 0.7 : 1 }}
                    />
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
