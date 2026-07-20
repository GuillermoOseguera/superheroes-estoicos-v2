-- ====================================================
-- Academia Estoica — Endurecimiento de Seguridad
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Proyecto: superheroes-estoicos-v2 (yiklrxdqwchulthfbdgb)
--
-- Qué hace esta migración:
--   1) Hashea las contraseñas existentes (estaban en texto plano).
--   2) Crea un login por función (RPC) que nunca expone el hash al cliente.
--   3) Crea sesiones con token (tabla app_sessions) + función de validación.
--   4) Revoca el acceso directo de "anon" a app_accounts (solo vía RPC).
--   5) Reactiva RLS en todas las tablas de datos de usuario, con políticas
--      que solo permiten leer/escribir datos de la propia cuenta, usando
--      el token de sesión enviado en el header "x-session-token".
--
-- IMPORTANTE: después de correr esto, el código del cliente (ya actualizado
-- en este mismo cambio) espera:
--   - función RPC "login"(p_username text, p_password text)
--   - header "x-session-token" en cada request de supabase-js
-- Si algo sale mal, hay un bloque de ROLLBACK al final de este archivo
-- (coméntalo/descoméntalo y ejecútalo aparte).
-- ====================================================

-- 1) Hashing de contraseñas ------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Solo re-hashea si todavía luce como texto plano (evita doble-hash si se re-corre)
UPDATE app_accounts
SET password_hash = crypt(password_hash, gen_salt('bf'))
WHERE password_hash NOT LIKE '$2%';

-- 2) Tabla de sesiones -------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES app_accounts(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_app_sessions_token ON app_sessions(token);

-- 3) Función de login (SECURITY DEFINER: corre con permisos de owner,
--    así puede leer password_hash aunque "anon" ya no tenga acceso directo) --
CREATE OR REPLACE FUNCTION login(p_username TEXT, p_password TEXT)
RETURNS TABLE(session_token TEXT, account_id UUID, username TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account app_accounts%ROWTYPE;
  v_token TEXT;
BEGIN
  SELECT * INTO v_account
  FROM app_accounts a
  WHERE a.username = p_username
    AND a.password_hash = crypt(p_password, a.password_hash)
  LIMIT 1;

  IF v_account.id IS NULL THEN
    RETURN;
  END IF;

  v_token := encode(gen_random_bytes(32), 'hex');

  INSERT INTO app_sessions (account_id, token) VALUES (v_account.id, v_token);

  RETURN QUERY SELECT v_token, v_account.id, v_account.username;
END;
$$;

-- 4) Función auxiliar: cuenta dueña del token de sesión actual ---------------
CREATE OR REPLACE FUNCTION current_account_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT s.account_id
  FROM app_sessions s
  WHERE s.token = current_setting('request.header.x-session-token', true)
    AND s.expires_at > NOW()
  LIMIT 1;
$$;

-- Función para cerrar sesión / validar sesión desde el cliente si hace falta
CREATE OR REPLACE FUNCTION logout_session(p_token TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM app_sessions WHERE token = p_token;
$$;

-- Valida un token guardado (ej. al recargar la página) y devuelve la cuenta dueña.
-- No expone password_hash ni ninguna otra columna sensible.
CREATE OR REPLACE FUNCTION validate_session(p_token TEXT)
RETURNS TABLE(account_id UUID, username TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.username
  FROM app_sessions s
  JOIN app_accounts a ON a.id = s.account_id
  WHERE s.token = p_token AND s.expires_at > NOW()
  LIMIT 1;
$$;

-- 5) Bloquear acceso directo a app_accounts y app_sessions desde el cliente --
REVOKE ALL ON app_accounts FROM anon, authenticated;
REVOKE ALL ON app_sessions FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION login(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION logout_session(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION validate_session(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION current_account_id() TO anon, authenticated;

-- access_requests puede seguir siendo INSERT-only para "anon" (formulario público),
-- pero no debe poder leerse por cualquiera.
REVOKE SELECT, UPDATE, DELETE ON access_requests FROM anon, authenticated;
GRANT INSERT ON access_requests TO anon;

-- 6) RLS por cuenta en las tablas de datos de usuario ------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_virtues ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlocked_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotional_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS account_owns_profile ON profiles;
CREATE POLICY account_owns_profile ON profiles
  FOR ALL USING (account_id = current_account_id())
  WITH CHECK (account_id = current_account_id());

DROP POLICY IF EXISTS account_owns_virtues ON user_virtues;
CREATE POLICY account_owns_virtues ON user_virtues
  FOR ALL USING (user_id IN (SELECT id FROM profiles WHERE account_id = current_account_id()))
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE account_id = current_account_id()));

DROP POLICY IF EXISTS account_owns_results ON game_results;
CREATE POLICY account_owns_results ON game_results
  FOR ALL USING (user_id IN (SELECT id FROM profiles WHERE account_id = current_account_id()))
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE account_id = current_account_id()));

DROP POLICY IF EXISTS account_owns_missions ON daily_missions;
CREATE POLICY account_owns_missions ON daily_missions
  FOR ALL USING (user_id IN (SELECT id FROM profiles WHERE account_id = current_account_id()))
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE account_id = current_account_id()));

DROP POLICY IF EXISTS account_owns_achievements ON unlocked_achievements;
CREATE POLICY account_owns_achievements ON unlocked_achievements
  FOR ALL USING (user_id IN (SELECT id FROM profiles WHERE account_id = current_account_id()))
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE account_id = current_account_id()));

DROP POLICY IF EXISTS account_owns_logs ON emotional_logs;
CREATE POLICY account_owns_logs ON emotional_logs
  FOR ALL USING (user_id IN (SELECT id FROM profiles WHERE account_id = current_account_id()))
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE account_id = current_account_id()));

DROP POLICY IF EXISTS account_owns_inventory ON user_inventory;
CREATE POLICY account_owns_inventory ON user_inventory
  FOR ALL USING (user_id IN (SELECT id FROM profiles WHERE account_id = current_account_id()))
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE account_id = current_account_id()));

-- game_items es catálogo público de solo lectura, no tiene dueño
ALTER TABLE game_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_read_items ON game_items;
CREATE POLICY public_read_items ON game_items FOR SELECT USING (true);

-- ====================================================
-- ROLLBACK DE EMERGENCIA (ejecutar manualmente si algo se rompe)
-- ====================================================
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_virtues DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE game_results DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE daily_missions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE unlocked_achievements DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE emotional_logs DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_inventory DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE game_items DISABLE ROW LEVEL SECURITY;
-- GRANT ALL ON app_accounts TO anon, authenticated;
-- GRANT ALL ON access_requests TO anon, authenticated;
