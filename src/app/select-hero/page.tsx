"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, type Profile } from "@/lib/supabase";
import { useProfile } from "@/lib/profile-store";
import { toast } from "sonner";

import Image from "next/image";
import { RefreshCw } from "lucide-react";
import { FRASES_ESTOICAS } from "@/lib/data-frases";

// Héroes fijos del MVP
const HEROES = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Elías",
    image: "/images/avatars/elias_base.png",
    description: "El Guerrero Justo",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.15)",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    name: "Atenea",
    image: "/images/avatars/atenea_base.png",
    description: "La Sabia Estratega",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.15)",
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    name: "Marco",
    image: "/images/avatars/marco_base.png",
    description: "El Filósofo Sereno",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.15)",
  },
];

// Guard con Promesa Compartida para evitar inserciones paralelas en Renderizaciones Simultáneas (React 18 Strict Mode)
const pendingInitialization: Record<string, Promise<any>> = {};

export default function HeroSelectPage() {
  const router = useRouter();
  const { setActiveProfile, activeAccount, logout } = useProfile();
  const [loading, setLoading] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [fetching, setFetching] = useState(true);

  // Redirigir si no hay sesión
  useEffect(() => {
    if (!activeAccount) {
      router.replace("/login");
    }
  }, [activeAccount, router]);

  // Cargar Perfiles de esta cuenta
  useEffect(() => {
    if (!activeAccount) return;

    const loadProfiles = async () => {
      setFetching(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("account_id", activeAccount.id);

      if (error) {
        toast.error("Error al cargar perfiles.");
        setFetching(false);
        return;
      }

      if (data && data.length > 0) {
        setProfiles(data as Profile[]);
        setFetching(false);
      } else {
        const accountId = activeAccount.id;
        
        if (!pendingInitialization[accountId]) {
          pendingInitialization[accountId] = (async () => {
            const defaultHeroes = [
              { name: "Elías", avatar_id: 1, role: "kid", account_id: accountId },
              { name: "Atenea", avatar_id: 2, role: "kid", account_id: accountId },
              { name: "Marco", avatar_id: 3, role: "kid", account_id: accountId },
            ];

            const { data: inserted, error: insErr } = await supabase
              .from("profiles")
              .insert(defaultHeroes)
              .select();

            if (insErr || !inserted) {
              toast.error("Error al inicializar héroes.");
              return null;
            }

            // Insertar virtudes iniciales
            for (const p of inserted) {
               await supabase.from("user_virtues").insert({ user_id: p.id });
            }
            return inserted;
          })();
        }

        const inserted = await pendingInitialization[accountId];
        if (inserted) {
          setProfiles(inserted as Profile[]);
        }
        setFetching(false);
      }
    };

    loadProfiles();
  }, [activeAccount]);

  // Seleccionar la frase con base en la fecha actual (cada 8 horas)
  useEffect(() => {
    const epoch8Hours = Math.floor(Date.now() / (8 * 60 * 60 * 1000));
    setQuoteIndex(epoch8Hours % FRASES_ESTOICAS.length);
  }, []);

  const changeQuoteManually = () => {
    setQuoteIndex((prev) => (prev + 1) % FRASES_ESTOICAS.length);
  };

  const handleSelectHero = async (heroId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", heroId)
        .single();

      if (error || !data) throw error;

      setActiveProfile(data as Profile);
      toast.success(`¡Bienvenido, ${data.name}!`, {
        description: "Tu misión comienza ahora. ¡Que la sabiduría te guíe!",
        icon: "⚔️",
      });
      router.push("/home");
    } catch {
      toast.error("Error al cargar el perfil.");
    } finally {
      setLoading(false);
    }
  };

  if (!activeAccount || fetching) {
    return <div className="hero-select-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>Cargando portal...</div>;
  }

  return (
    <div className="hero-select-bg" style={{ position: "relative" }}>
      {/* Botón Cerrar Sesión Cuenta */}
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <button
          onClick={logout}
          style={{
            background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "10px 16px",
            borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
          }}
        >
          🚪 Salir ({activeAccount?.username})
        </button>
      </div>

      {/* Título */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: "center", marginBottom: 48 }}
      >
        <div style={{ width: 140, height: 140, position: 'relative', margin: '0 auto 16px' }}>
          <Image 
            src="/images/gop_logo.png" 
            alt="GOP Logo" 
            fill 
            style={{ objectFit: 'contain' }} 
            priority
          />
        </div>
        <h1
          className="font-display"
          style={{
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          <span className="shimmer-gold">ACADEMIA ESTOICA GOPLEMMINGS</span>
        </h1>
        <p style={{ color: "#ffffff", fontSize: 18, maxWidth: "100%", fontWeight: 500 }}>
          Elige tu héroe y comienza tu entrenamiento en las artes del alma estoica
        </p>
      </motion.div>

      {/* Hero cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 24,
          width: "100%",
          maxWidth: 900,
        }}
      >
        {profiles.map((hero, i) => {
          const heroConfig = HEROES.find(h => h.name === hero.name) || HEROES[0];
          return (
            <motion.button
              key={hero.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelectHero(hero.id)}
              disabled={loading}
              className="hero-card"
              style={{ 
                background: heroConfig.bg, 
                border: `2px solid ${heroConfig.color}40`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                padding: "24px 16px"
              }}
            >
              <div
                style={{
                  width: 140,
                  height: 140,
                  background: `${heroConfig.color}15`,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `3px solid ${heroConfig.color}50`,
                  overflow: "hidden",
                  boxShadow: `0 8px 32px ${heroConfig.color}30`
                }}
                className="float-animation"
              >
                <Image 
                  src={heroConfig.image} 
                  alt={hero.name} 
                  width={140} 
                  height={140}
                  style={{ objectFit: "cover" }}
                  priority
                />
              </div>
              
              <div style={{ textAlign: "center" }}>
                <div
                  className="font-display"
                  style={{ fontSize: 26, fontWeight: 700, color: "#f1e9d0" }}
                >
                  {hero.name}
                </div>
                <div style={{ color: heroConfig.color, fontSize: 14, marginTop: 4, fontWeight: 500 }}>
                  {heroConfig.description}
                </div>
              </div>
              
              <div
                style={{
                  background: heroConfig.color,
                  color: "white",
                  borderRadius: 8,
                  padding: "8px 28px",
                  fontSize: 14,
                  fontWeight: 600,
                  marginTop: 8,
                  transition: "all 0.2s ease"
                }}
              >
                ¡Seleccionar!
              </div>
            </motion.button>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        style={{ 
          marginTop: 40, 
          padding: "0 20px", 
          display: "flex", 
          alignItems: "center", 
          gap: 12,
          opacity: 0.8
        }}
      >
        <p style={{ color: "#ffffff", fontSize: 15, fontStyle: "italic", textAlign: "center", maxWidth: 700 }}>
          "{FRASES_ESTOICAS[quoteIndex]}"
        </p>
        <button 
          onClick={changeQuoteManually} 
          title="Cambiar frase estoica"
          className="text-slate-400 hover:text-white transition-colors"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
        >
          <RefreshCw size={16} />
        </button>
      </motion.div>
    </div>
  );
}
