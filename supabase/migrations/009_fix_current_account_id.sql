-- ====================================================
-- Academia Estoica — Fix: current_account_id() sin permiso sobre app_sessions
-- Ejecutar en: Supabase Dashboard > SQL Editor (después de 005, 006, 007, 008)
-- ====================================================
-- current_account_id() se usa dentro de las políticas RLS de profiles,
-- user_virtues, game_results, etc. Como NO era SECURITY DEFINER, se ejecutaba
-- con los permisos del rol "anon", y a "anon" ya no le dejamos leer
-- app_sessions directamente (migración 005) → "permission denied for table
-- app_sessions" en cualquier consulta protegida por RLS.

CREATE OR REPLACE FUNCTION current_account_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.account_id
  FROM app_sessions s
  WHERE s.token = current_setting('request.header.x-session-token', true)
    AND s.expires_at > NOW()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION current_account_id() TO anon, authenticated;
