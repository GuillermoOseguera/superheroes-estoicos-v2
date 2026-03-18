-- ====================================================
-- Academia Estoica de Elías — Sistema de Inventario Modular 2D
-- Proyecto: superheroes-estoicos-v2 (yiklrxdqwchulthfbdgb)
-- ====================================================

-- Tabla principal del catálogo de items en el juego
CREATE TABLE IF NOT EXISTS game_items (
  id TEXT PRIMARY KEY, -- ej: 'shield_owl_bronze', 'helmet_spartan_gold'
  name TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL CHECK (item_type IN ('head', 'body', 'left_hand', 'right_hand', 'feet', 'background')),
  hero_restriction TEXT, -- Si es NULL, cualquiera lo usa, si dice 'elias', solo Elías.
  image_url TEXT NOT NULL,
  z_index INTEGER NOT NULL DEFAULT 10,
  required_level INTEGER NOT NULL DEFAULT 1
);

-- Tabla puente: Qué items ha adquirido cada usuario
CREATE TABLE IF NOT EXISTS user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES game_items(id) ON DELETE CASCADE,
  is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- RLS desactivado para MVP (sin autenticación estricta por ahora)
ALTER TABLE game_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory DISABLE ROW LEVEL SECURITY;

-- Insertar algunos items de ejemplo iniciales (Escudo de Nivel bajo)
INSERT INTO game_items (id, name, description, item_type, hero_restriction, image_url, z_index, required_level) VALUES
  ('shield_wood_basic', 'Escudo de Madera Básico', 'Un escudo simple para bloquear pensamientos negativos básicos.', 'left_hand', NULL, '/images/items/shield_wood_basic.png', 20, 1),
  ('tunic_spartan_red', 'Túnica Espartana Roja', 'Túnica de entrenamiento avanzada.', 'body', 'elias', '/images/items/tunic_spartan_red.png', 10, 5),
  ('helmet_athena_owl', 'Casco de Atenea', 'Provee claridad mental.', 'head', 'atenea', '/images/items/helmet_athena_owl.png', 30, 10)
ON CONFLICT (id) DO NOTHING;
