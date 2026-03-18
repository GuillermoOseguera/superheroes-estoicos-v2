-- ====================================================
-- Academia Estoica de Elías — Semáforo Emocional
-- Proyecto: superheroes-estoicos-v2 (yiklrxdqwchulthfbdgb)
-- ====================================================

-- Tabla para registrar el historial del Semáforo Emocional
CREATE TABLE IF NOT EXISTS emotional_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emotion TEXT NOT NULL, -- 'angry', 'sad', 'anxious', 'peaceful', 'happy'
  intensity INTEGER NOT NULL CHECK (intensity BETWEEN 1 AND 5),
  trigger_reason TEXT NOT NULL, -- ¿Qué pasó?
  can_control BOOLEAN NOT NULL, -- ¿Está bajo mi control?
  action_plan TEXT NOT NULL, -- ¿Qué voy a hacer?
  virtue_selected TEXT NOT NULL, -- 'wisdom', 'courage', 'justice', 'temperance'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS desactivado para MVP (sin autenticación estricta por ahora)
ALTER TABLE emotional_logs DISABLE ROW LEVEL SECURITY;
