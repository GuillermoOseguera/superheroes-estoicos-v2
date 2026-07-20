-- ====================================================
-- Academia Estoica — Taller del Héroe (tienda cosmética)
-- Ejecutar en: Supabase Dashboard > SQL Editor (después de 005)
-- ====================================================
--
-- Nota de diseño: el sistema de inventario original (game_items/user_inventory,
-- migración 002) esperaba arte ilustrado por-item que nunca se produjo. En vez
-- de bloquear esta sección a que exista ese arte, el Taller vende cosméticos
-- 100% CSS (marcos de color y títulos) que no requieren imágenes nuevas.
--
-- "Monedas" es una moneda separada del XP de nivel: no se descuenta del XP
-- que define el nivel, así que comprar cosas nunca hace bajar de nivel a nadie.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coins INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipped_frame TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipped_title TEXT;

CREATE TABLE IF NOT EXISTS shop_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('frame', 'title')),
  cost_coins INTEGER NOT NULL,
  required_level INTEGER NOT NULL DEFAULT 1,
  accent_from TEXT NOT NULL,
  accent_to TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '✨',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_read_shop_items ON shop_items;
CREATE POLICY public_read_shop_items ON shop_items FOR SELECT USING (true);

ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS account_owns_purchases ON user_purchases;
CREATE POLICY account_owns_purchases ON user_purchases
  FOR ALL USING (user_id IN (SELECT id FROM profiles WHERE account_id = current_account_id()))
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE account_id = current_account_id()));

INSERT INTO shop_items (id, name, description, category, cost_coins, required_level, accent_from, accent_to, icon, sort_order) VALUES
  ('frame_bronce', 'Marco de Bronce', 'El primer marco de todo héroe estoico.', 'frame', 50, 1, '#b45309', '#78350f', '🥉', 1),
  ('frame_plata', 'Marco de Plata', 'Para quien ya entrenó con constancia.', 'frame', 150, 3, '#94a3b8', '#475569', '🥈', 2),
  ('frame_esmeralda', 'Marco Esmeralda', 'El color de la Templanza en su máxima expresión.', 'frame', 250, 5, '#10b981', '#047857', '💚', 3),
  ('frame_zafiro', 'Marco Zafiro', 'La claridad de la Sabiduría, hecha marco.', 'frame', 350, 8, '#3b82f6', '#1d4ed8', '💙', 4),
  ('frame_rubi', 'Marco Rubí', 'El fuego del Coraje que nunca se apaga.', 'frame', 450, 12, '#ef4444', '#b91c1c', '❤️', 5),
  ('frame_oro', 'Marco de Oro', 'Reservado para los héroes más constantes.', 'frame', 600, 16, '#fbbf24', '#d97706', '🥇', 6),
  ('frame_dorado_absoluto', 'Marco Dorado Absoluto', 'El marco más raro de la Academia.', 'frame', 900, 20, '#fde047', '#f59e0b', '👑', 7),
  ('title_iniciado', 'Iniciado Estoico', 'Tu primer título oficial.', 'title', 40, 1, '#94a3b8', '#64748b', '📘', 1),
  ('title_guardian', 'Guardián de la Calma', 'Para quien domina sus reacciones.', 'title', 180, 4, '#22c55e', '#15803d', '🛡️', 2),
  ('title_estratega', 'Estratega Silencioso', 'Piensa antes de actuar, siempre.', 'title', 320, 9, '#8b5cf6', '#6d28d9', '🧠', 3),
  ('title_inquebrantable', 'Espíritu Inquebrantable', 'Nada lo saca de su centro.', 'title', 500, 14, '#0ea5e9', '#0369a1', '🌊', 4),
  ('title_sabio', 'Sabio de la Academia', 'El título más alto que existe.', 'title', 800, 20, '#f59e0b', '#b45309', '🏛️', 5)
ON CONFLICT (id) DO NOTHING;
