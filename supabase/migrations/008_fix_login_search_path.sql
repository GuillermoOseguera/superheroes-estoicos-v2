-- ====================================================
-- Academia Estoica — Fix: login() no encontraba crypt()
-- Ejecutar en: Supabase Dashboard > SQL Editor (después de 005, 006, 007)
-- ====================================================
-- En Supabase, "CREATE EXTENSION pgcrypto" instala las funciones crypt()/
-- gen_salt() en el esquema "extensions", no en "public". La función login()
-- de 005 forzaba SET search_path = public, así que nunca encontraba crypt()
-- y todo login fallaba con "function crypt(text, text) does not exist".
-- Este archivo la vuelve a crear con el search_path correcto.

CREATE OR REPLACE FUNCTION login(p_username TEXT, p_password TEXT)
RETURNS TABLE(session_token TEXT, account_id UUID, username TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
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

GRANT EXECUTE ON FUNCTION login(TEXT, TEXT) TO anon, authenticated;
