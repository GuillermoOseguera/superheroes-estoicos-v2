-- ====================================================
-- Academia Estoica — Fix definitivo: lectura del header de sesión
-- Ejecutar en: Supabase Dashboard > SQL Editor (después de 009)
-- ====================================================
-- Diagnóstico verificado en vivo: el token de sesión es válido y
-- current_account_id() ya corre con SECURITY DEFINER (fix 009), pero devolvía
-- NULL porque el PostgREST moderno de Supabase entrega los headers como JSON
-- en la variable "request.headers", no como "request.header.x-..." (formato
-- antiguo que usaba la versión de 005/009).
--
-- Esta versión lee el formato nuevo y conserva el viejo como respaldo.

CREATE OR REPLACE FUNCTION current_account_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.account_id
  FROM app_sessions s
  WHERE s.token = COALESCE(
      current_setting('request.headers', true)::json->>'x-session-token',
      current_setting('request.header.x-session-token', true)
    )
    AND s.expires_at > NOW()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION current_account_id() TO anon, authenticated;
