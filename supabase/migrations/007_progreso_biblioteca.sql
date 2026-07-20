-- ====================================================
-- Academia Estoica — Progreso de lectura en la Biblioteca
-- Ejecutar en: Supabase Dashboard > SQL Editor (después de 005 y 006)
-- ====================================================
-- Antes el progreso de lectura (leídas / calificaciones) vivía solo en
-- localStorage: si el niño cambiaba de dispositivo, lo perdía. Esta tabla
-- lo guarda en Supabase, igual que el resto del progreso.

CREATE TABLE IF NOT EXISTS story_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  story_id TEXT NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, story_id)
);

ALTER TABLE story_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS account_owns_story_progress ON story_progress;
CREATE POLICY account_owns_story_progress ON story_progress
  FOR ALL USING (user_id IN (SELECT id FROM profiles WHERE account_id = current_account_id()))
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE account_id = current_account_id()));
