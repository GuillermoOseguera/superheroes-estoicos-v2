export interface Achievement {
  id: string;
  icon: string;
  label: string;
  desc: string;
  color: string;
}

export const ALL_ACHIEVEMENTS: Achievement[] = [
  // Inicio y Básicos
  { id: "iniciado", icon: "🥉", label: "Iniciado", desc: "Completa tu primer desafío", color: "#b45309" },
  { id: "primeros_pasos", icon: "🌱", label: "Primeros Pasos", desc: "Acumula tus primeros 50 XP", color: "#64748b" },
  { id: "aprendiz", icon: "📘", label: "Aprendiz", desc: "Alcanza el Nivel 2", color: "#3b82f6" },
  
  // Constancia y Rachas
  { id: "racha_1", icon: "🔥", label: "El Viento Sopla", desc: "Consigue una racha de 1 día", color: "#dc2626" },
  { id: "racha_3", icon: "🔥🔥", label: "Chispa Constante", desc: "Consigue una racha de 3 días", color: "#ea580c" },
  { id: "racha_7", icon: "🔥🔥🔥", label: "Llama Imparable", desc: "Racha de 7 días ininterrumpidos", color: "#ea580c" },
  { id: "racha_14", icon: "☄️", label: "Meteoro de Voluntad", desc: "Consigue una racha de 14 días", color: "#ef4444" },
  { id: "racha_30", icon: "🌞", label: "El Sol Nunca Cae", desc: "Consigue una racha de 30 días", color: "#f59e0b" },
  
  // Participación en Juegos
  { id: "primer_juego", icon: "🎮", label: "Primer Desafío", desc: "Juega tu primer minijuego", color: "#10b981" },
  { id: "diez_juegos", icon: "🎲", label: "Jugador Constante", desc: "Juega 10 minijuegos o más", color: "#059669" },
  { id: "cincuenta_juegos", icon: "🕹️", label: "Maestro del Juego", desc: "Juega 50 minijuegos o más", color: "#047857" },
  { id: "cien_juegos", icon: "🏆", label: "Leyenda Lúdica", desc: "Juega 100 minijuegos o más", color: "#064e3b" },
  
  // Minijuegos Específicos
  { id: "desafio_virtudes_1", icon: "⚔️", label: "Hoja Afilada", desc: "Acierta en el Desafío de Virtudes", color: "#d4a017" },
  { id: "desafio_virtudes_10", icon: "⚔️⚔️", label: "Maestro de las Espadas", desc: "10 aciertos en el Desafío de Virtudes", color: "#d4a017" },
  { id: "ojo_aguila", icon: "👁️", label: "Ojo de Águila", desc: "Completa DosCajas sin errores", color: "#0891b2" },
  { id: "zen_master", icon: "🧘", label: "Maestro Zen", desc: "Acumula 20 actas de DosCajas", color: "#0891b2" },

  // El Vuelo del Búho (escala 1/2/3/max, igual que las virtudes)
  { id: "buho_1", icon: "🪶", label: "Primer Vuelo", desc: "Consigue 10 puntos en El Vuelo del Búho", color: "#fde047" },
  { id: "buho_2", icon: "🦉", label: "Alas de Sabiduría", desc: "Consigue 25 puntos en El Vuelo del Búho", color: "#eab308" },
  { id: "buho_3", icon: "🌙", label: "Vuelo Imperturbable", desc: "Consigue 50 puntos en El Vuelo del Búho", color: "#ca8a04" },
  { id: "buho_max", icon: "🏛️", label: "Guardián del Templo", desc: "Consigue 100 puntos en El Vuelo del Búho", color: "#a16207" },

  // La Falange Serena (escala 1/2/3/max + misceláneos de nave y arma)
  { id: "falange_1", icon: "🛡️", label: "Primera Formación", desc: "Sobrevive hasta la oleada 3 en La Falange Serena", color: "#a5b4fc" },
  { id: "falange_2", icon: "👑", label: "Primer Jefe Caído", desc: "Derrota a tu primer jefe en La Falange Serena", color: "#818cf8" },
  { id: "falange_3", icon: "⚔️", label: "Falange Invicta", desc: "Llega a la oleada 10 en La Falange Serena", color: "#6366f1" },
  { id: "falange_max", icon: "🏅", label: "Comandante Sereno", desc: "Llega a la oleada 15 en La Falange Serena", color: "#4338ca" },
  { id: "falange_naves", icon: "🚀", label: "Tres Escudos, Un Espíritu", desc: "Juega una partida con cada una de las 3 naves", color: "#38bdf8" },
  { id: "falange_arma_max", icon: "⚡", label: "Arsenal Estoico", desc: "Alcanza el nivel de arma máximo en una partida", color: "#f59e0b" },

  // La Esfera del Logos (Rompe-bloques de falsas creencias)
  { id: "logos_1", icon: "✨", label: "Chispa de la Razón", desc: "Completa el Nivel 1 en La Esfera del Logos", color: "#fbbf24" },
  { id: "logos_2", icon: "🔮", label: "Rompedor de Ilusiones", desc: "Destruye 40 bloques de falsas creencias", color: "#f59e0b" },
  { id: "logos_3", icon: "🏛️", label: "Mente Inquebrantable", desc: "Supera el Nivel 3 en La Esfera del Logos", color: "#d97706" },
  { id: "logos_combo", icon: "⚡", label: "Foco Imperturbable", desc: "Alcanza un combo x8 en La Esfera del Logos", color: "#38bdf8" },
  { id: "logos_powers", icon: "💎", label: "Sabiduría Aplicada", desc: "Recoge 5 poderes estoicos en una sola partida", color: "#a855f7" },


  // XP Global y Niveles
  { id: "mente_acero", icon: "🪖", label: "Mente de Acero", desc: "Gana 500 XP totales", color: "#475569" },
  { id: "corazon_leon", icon: "🦁", label: "Corazón de León", desc: "Alcanza Nivel 5", color: "#facc15" },
  { id: "fuerza_toro", icon: "🐂", label: "Fuerza de Toro", desc: "Alcanza Nivel 10", color: "#ef4444" },
  { id: "voluntad_roca", icon: "⛰️", label: "Voluntad de Roca", desc: "Alcanza Nivel 15", color: "#57534e" },
  { id: "sangre_olympos", icon: "⚡", label: "Hijo del Olimpo", desc: "Alcanza Nivel 20", color: "#3b82f6" },

  // Logros de Sabiduría
  { id: "sab_1", icon: "🦉", label: "Búho Vigía", desc: "Gana 100 XP en Sabiduría", color: "#eab308" },
  { id: "sab_2", icon: "📜", label: "Pergamino de Luz", desc: "Gana 500 XP en Sabiduría", color: "#ca8a04" },
  { id: "sab_3", icon: "🏛️", label: "El Ágora de Atenas", desc: "Gana 1000 XP en Sabiduría", color: "#a16207" },
  { id: "sab_max", icon: "🧠", label: "Pensador Universal", desc: "Alcanza límite de Sabiduría", color: "#854d0e" },

  // Logros de Fortaleza
  { id: "fort_1", icon: "🧱", label: "Ladrillo Base", desc: "Gana 100 XP en Fortaleza", color: "#f87171" },
  { id: "fort_2", icon: "🛡️", label: "El Escudo de Esparta", desc: "Gana 500 XP en Fortaleza", color: "#dc2626" },
  { id: "fort_3", icon: "🗡️", label: "Filo Irrompible", desc: "Gana 1000 XP en Fortaleza", color: "#b91c1c" },
  { id: "fort_max", icon: "🏰", label: "Fortaleza Inexpugnable", desc: "Alcanza límite de Fortaleza", color: "#991b1b" },

  // Logros de Justicia
  { id: "just_1", icon: "🤝", label: "Mano Amiga", desc: "Gana 100 XP en Justicia", color: "#60a5fa" },
  { id: "just_2", icon: "⚖️", label: "La Balanza Eterna", desc: "Gana 500 XP en Justicia", color: "#2563eb" },
  { id: "just_3", icon: "⚜️", label: "Cetro del Juez", desc: "Gana 1000 XP en Justicia", color: "#1d4ed8" },
  { id: "just_max", icon: "👑", label: "Rey Equitativo", desc: "Alcanza límite de Justicia", color: "#1e3a8a" },

  // Logros de Templanza
  { id: "temp_1", icon: "💧", label: "Gota de Paz", desc: "Gana 100 XP en Templanza", color: "#a78bfa" },
  { id: "temp_2", icon: "🌊", label: "El Río Tranquilo", desc: "Gana 500 XP en Templanza", color: "#7c3aed" },
  { id: "temp_3", icon: "🏔️", label: "Cima Nevada", desc: "Gana 1000 XP en Templanza", color: "#5b21b6" },
  { id: "temp_max", icon: "🌌", label: "Espíritu Inquebrantable", desc: "Alcanza límite de Templanza", color: "#4c1d95" },
  
  // Equilibrio (Virtuoso)
  { id: "virt_1", icon: "⚓", label: "El Ancla Estable", desc: "Logra 50 XP en todas las virtudes", color: "#14b8a6" },
  { id: "virt_2", icon: "💎", label: "Piedra Preciosa", desc: "Logra 250 XP en todas", color: "#0d9488" },
  { id: "virt_3", icon: "✨", label: "Esencia Estoica", desc: "Logra 700 XP en todas", color: "#0f766e" },
  { id: "virt_max", icon: "🌌", label: "Sabio Iluminado", desc: "Completa el radar al 100%", color: "#115e59" },

  // Misceláneos
  { id: "coleccionista_armas", icon: "🏹", label: "Armería Plena", desc: "Desbloquea 3 objetos para tu avatar", color: "#64748b" },
  { id: "coleccionista_mitico", icon: "👑", label: "Dorado Absoluto", desc: "Consigue el avatar dorado completo", color: "#eab308" },
  { id: "filosofo_nocturno", icon: "🌙", label: "Búho de la Noche", desc: "Completa una misión de noche", color: "#4f46e5" },
  { id: "resiliencia", icon: "🩹", label: "Corazón Sanado", desc: "Recupera 5 puntos de Paz Mental (HP)", color: "#10b981" },
];
