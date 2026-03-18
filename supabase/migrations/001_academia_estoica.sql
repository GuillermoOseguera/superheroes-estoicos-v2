-- ====================================================
-- Academia Estoica de Elías — Migración inicial
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Proyecto: superheroes-estoicos-v2 (yikirxdqwchulthfbdgb)
-- ====================================================

-- Tabla de perfiles de héroes
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avatar_id INTEGER NOT NULL DEFAULT 1 CHECK (avatar_id BETWEEN 1 AND 10),
  role TEXT NOT NULL DEFAULT 'kid' CHECK (role IN ('kid', 'parent')),
  level INTEGER NOT NULL DEFAULT 1,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  last_login TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de XP por virtud
CREATE TABLE IF NOT EXISTS user_virtues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  wisdom_xp INTEGER NOT NULL DEFAULT 0,
  courage_xp INTEGER NOT NULL DEFAULT 0,
  justice_xp INTEGER NOT NULL DEFAULT 0,
  temperance_xp INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabla de resultados de juegos
CREATE TABLE IF NOT EXISTS game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de misiones diarias
CREATE TABLE IF NOT EXISTS daily_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mission_id TEXT NOT NULL,
  mission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  reflection_notes TEXT,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, mission_id, mission_date)
);

-- Tabla de logros desbloqueados
CREATE TABLE IF NOT EXISTS unlocked_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- RLS desactivado para MVP (sin autenticación)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_virtues DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_missions DISABLE ROW LEVEL SECURITY;
ALTER TABLE unlocked_achievements DISABLE ROW LEVEL SECURITY;

-- Insertar 3 perfiles base (héroes fijos del MVP)
INSERT INTO profiles (id, name, avatar_id, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Elías', 1, 'kid'),
  ('00000000-0000-0000-0000-000000000002', 'Atenea', 2, 'kid'),
  ('00000000-0000-0000-0000-000000000003', 'Marco', 3, 'kid')
ON CONFLICT (id) DO NOTHING;

-- Insertar virtudes iniciales para cada héroe
INSERT INTO user_virtues (user_id, wisdom_xp, courage_xp, justice_xp, temperance_xp) VALUES
  ('00000000-0000-0000-0000-000000000001', 0, 0, 0, 0),
  ('00000000-0000-0000-0000-000000000002', 0, 0, 0, 0),
  ('00000000-0000-0000-0000-000000000003', 0, 0, 0, 0)
ON CONFLICT (user_id) DO NOTHING;
