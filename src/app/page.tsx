"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/profile-store";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Image from "next/image";
import { Swords, BarChart2, BookOpen, Shield, ArrowRight, Lock, User, Send, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { login } = useProfile();

  // Login States
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Request Access States
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqUser, setReqUser] = useState("");
  const [reqName, setReqName] = useState("");
  const [reqLoading, setReqLoading] = useState(false);
  const [reqSuccess, setReqSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Por favor llena todos los campos.");
      return;
    }

    setLoading(true);
    const success = await login(username, password);
    setLoading(false);

    if (success) {
      toast.success(`¡Bienvenido de nuevo, ${username}!`);
      router.push("/select-hero"); // Va al selector de héroe
    } else {
      toast.error("Credenciales incorrectas.", { description: "Verifica tu usuario y contraseña." });
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqUser || !reqName) {
      toast.error("Por favor completa los campos de solicitud.");
      return;
    }

    setReqLoading(true);
    try {
      const { error } = await supabase
        .from("access_requests")
        .insert({ username: reqUser, fullname: reqName });

      if (error) throw error;

      setReqSuccess(true);
      toast.success("Solicitud enviada con éxito.");
    } catch (err) {
      toast.error("Error al enviar solicitud.");
    } finally {
      setReqLoading(false);
    }
  };

  const features = [
    {
      icon: BarChart2,
      title: "Análisis del Alma (Estadísticas)",
      desc: "Tarjetas holográficas interactivas que miden tu progreso en virtudes, rachas y nivel RPG.",
      img: "/images/previews/stats_holographic.png",
      color: "#f59e0b"
    },
    {
      icon: Swords,
      title: "Sala de Entrenamiento (Juegos)",
      desc: "Desafía tu enfoque y reflejos en juegos arcade como 'Defensor de la Mente'.",
      img: "/images/previews/game_mind.png",
      color: "#ef4444"
    }
  ];

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(to bottom, #020617, #0f172a, #020617)", color: "white", fontFamily: "sans-serif", overflowX: "hidden" }}>
      
      {/* NAVBAR */}
      <header style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Image src="/images/gop_logo.png" alt="GOP Logo" width={40} height={40} style={{ objectFit: 'contain' }} />
          <span className="font-display" style={{ fontWeight: 800, fontSize: 16, letterSpacing: 1, color: "#f1f5f9" }}>ACADEMIA ESTOICA</span>
        </div>
        <button 
          onClick={() => setShowLoginModal(true)}
          style={{ background: "linear-gradient(135deg, #fbbf24, #d97706)", color: "#0f172a", border: "none", padding: "10px 24px", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 12px rgba(245, 158, 11, 0.2)" }}
        >
          Iniciar Sesión
        </button>
      </header>

      {/* HERO SECTION */}
      <section style={{ textAlign: "center", padding: "100px 20px 80px", maxWidth: 800, margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1px solid rgba(245, 158, 11, 0.3)" }}>
            EL ENTRENAMIENTO DEL ALMA
          </span>
          <h1 className="font-display" style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, marginTop: 16, lineHeight: 1.1, background: "linear-gradient(to right, #ffffff, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Conviértete en un Héroe <span style={{ color: "#fbbf24", WebkitTextFillColor: "initial" }}>Estoico</span>
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 18, marginTop: 20, lineHeight: 1.6, maxWidth: 600, margin: "20px auto 0" }}>
            Mide tu sabiduría, templa tu mente y forja tu carácter a través de videojuegos interactivos, historias épicas y desafíos diarios.
          </p>

          <div style={{ marginTop: 40, display: "flex", gap: 16, justifyContent: "center" }}>
            <button 
              onClick={() => setShowLoginModal(true)}
              style={{ background: "linear-gradient(135deg, #fbbf24, #d97706)", color: "#0f172a", border: "none", padding: "16px 32px", borderRadius: 16, fontWeight: 800, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 10px 25px rgba(245, 158, 11, 0.3)" }}
            >
              Empezar Ahora <ArrowRight size={18} />
            </button>
          </div>
        </motion.div>
      </section>

      {/* CARACTERÍSTICAS (PREVIEWS) */}
      <section style={{ padding: "0 40px 100px", maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: 24, fontWeight: 800, color: "#e2e8f0", marginBottom: 48 }}>
          Una Experiencia Gamificada de Crecimiento
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 40 }}>
          {features.map((item, idx) => (
            <motion.div 
              key={item.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              style={{ background: "rgba(30, 41, 59, 0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 24, overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column" }}
            >
              <div style={{ position: "relative", height: 220, overflow: "hidden", borderBottom: `2px solid ${item.color}30` }}>
                <Image src={item.img} alt={item.title} fill style={{ objectFit: "cover", filter: "brightness(0.85)" }} />
              </div>
              <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ background: `${item.color}20`, color: item.color, padding: 8, borderRadius: 8 }}>
                    <item.icon size={20} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "white" }}>{item.title}</h3>
                </div>
                <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.5, flex: 1 }}>{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECCIONES SECUNDARIAS (SMALL GRID) */}
      <section style={{ background: "rgba(15, 23, 42, 0.6)", padding: "80px 40px", borderTop: "1px solid rgba(255,255,255,0.03)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
          <div style={{ padding: 24, background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
            <BookOpen size={24} style={{ color: "#60a5fa", marginBottom: 12 }} />
            <h4 style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Biblioteca Imperial</h4>
            <p style={{ color: "#94a3b8", fontSize: 13 }}>Historias interactivas y reflexiones para nutrir la mente.</p>
          </div>
          <div style={{ padding: 24, background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
            <Shield size={24} style={{ color: "#10b981", marginBottom: 12 }} />
            <h4 style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Misiones Diarias</h4>
            <p style={{ color: "#94a3b8", fontSize: 13 }}>Pon a prueba las 4 virtudes cardinales con retos cotidianos.</p>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 60 }}>
          <button 
            onClick={() => { setShowRequestModal(true); setReqSuccess(false); setReqUser(""); setReqName(""); }}
            style={{ background: "transparent", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.1)", padding: "12px 28px", borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          >
            Solicitar Acceso
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "40px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.05)", color: "#64748b", fontSize: 12 }}>
        © 2026 Academia Estoica GOPLEMMINGS. Todos los derechos reservados.
      </footer>

      {/* MODAL LOGIN */}
      <AnimatePresence>
        {showLoginModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setShowLoginModal(false)}>
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="parchment-card"
              style={{
                maxWidth: 400, width: "100%", padding: "40px 32px", textAlign: "center",
                background: "linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))",
                border: "2px solid rgba(226, 180, 64, 0.4)", color: "white"
              }}
            >
              <div style={{ width: 80, height: 80, position: 'relative', margin: '0 auto 12px' }}>
                <Image src="/images/gop_logo.png" alt="GOP Logo" fill style={{ objectFit: 'contain' }} />
              </div>
              <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>ACADEMIA ESTOICA</h1>
              <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 24 }}>Ingresa para continuar tu entrenamiento</p>

              <form onSubmit={handleLogin} style={{ textAlign: "left" }} className="space-y-4">
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#cbd5e1", display: "block", marginBottom: 4 }}>Usuario</label>
                  <div style={{ position: "relative" }}>
                    <User size={16} style={{ position: "absolute", left: 12, top: 12, color: "#64748b" }} />
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ej: Elias2026" style={{ width: "100%", padding: "10px 12px 10px 36px", background: "rgba(0,0,0,0.4)", border: "1px solid #334155", borderRadius: 10, color: "white", fontSize: 14 }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#cbd5e1", display: "block", marginBottom: 4 }}>Contraseña</label>
                  <div style={{ position: "relative" }}>
                    <Lock size={16} style={{ position: "absolute", left: 12, top: 12, color: "#64748b" }} />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ width: "100%", padding: "10px 12px 10px 36px", background: "rgba(0,0,0,0.4)", border: "1px solid #334155", borderRadius: 10, color: "white", fontSize: 14 }} />
                  </div>
                </div>
                <button type="submit" disabled={loading} style={{ width: "100%", marginTop: 8, background: "linear-gradient(135deg, #fbbf24, #d97706)", color: "#0f172a", border: "none", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 14, cursor: loading ? "not-allowed" : "pointer" }}>
                  {loading ? "Abriendo Pórtico..." : "Entrar ⚔️"}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL SOLICITUD */}
        {showRequestModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setShowRequestModal(false)}>
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="parchment-card"
              style={{ maxWidth: 400, width: "100%", padding: 32, background: "#1e293b", border: "1px solid #455569", color: "white" }}
            >
              {reqSuccess ? (
                <div style={{ textAlign: "center", padding: "10px 0" }}>
                  <CheckCircle2 size={48} style={{ color: "#10b981", margin: "0 auto 12px" }} />
                  <h3 style={{ fontSize: 18, fontWeight: 800 }}>¡Solicitud Enviada!</h3>
                  <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 6 }}>Tu maestro revisará la solicitud y te dará tus credenciales pronto.</p>
                  <button onClick={() => setShowRequestModal(false)} style={{ marginTop: 20, background: "#334155", color: "white", padding: "10px 20px", borderRadius: 10, border: "none", fontWeight: 700, cursor: "pointer" }}>Entendido</button>
                </div>
              ) : (
                <>
                  <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Solicitar Entrada</h3>
                  <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 16 }}>Ingresa tus datos y tu solicitud será enviada al Administrador.</p>
                  <form onSubmit={handleRequestAccess} className="space-y-3 text-left">
                    <div>
                      <label style={{ fontSize: 11, color: "#cbd5e1", display: "block", marginBottom: 4 }}>Tu Nombre</label>
                      <input type="text" value={reqName} onChange={(e) => setReqName(e.target.value)} placeholder="Ej: Juan Pérez" style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.2)", border: "1px solid #475569", borderRadius: 10, color: "white", fontSize: 14 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#cbd5e1", display: "block", marginBottom: 4 }}>Usuario Deseado</label>
                      <input type="text" value={reqUser} onChange={(e) => setReqUser(e.target.value)} placeholder="Ej: Juan2026" style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.2)", border: "1px solid #475569", borderRadius: 10, color: "white", fontSize: 14 }} />
                    </div>
                    <button type="submit" disabled={reqLoading} style={{ width: "100%", background: "#38bdf8", color: "#0f172a", border: "none", borderRadius: 10, padding: "12px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: reqLoading ? "not-allowed" : "pointer" }}>
                      {reqLoading ? "Enviando..." : <><Send size={15} /> Enviar Solicitud</>}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
