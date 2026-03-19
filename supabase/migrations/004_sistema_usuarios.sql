-- ====================================================
-- Academia Estoica — Sistema de Usuarios y Acceso
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Proyecto: superheroes-estoicos-v2 (yiklrxdqwchulthfbdgb)
-- ====================================================

-- 1. Crear tabla de Cuentas (Logins)
CREATE TABLE IF NOT EXISTS app_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- Se guarda texto plano o cifrado en cliente
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear tabla de Solicitudes de Acceso (Dashboard/Correos)
CREATE TABLE IF NOT EXISTS access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  fullname TEXT NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Vincular los Perfiles con la Cuenta
-- Agregamos la columna account_id para que los héroes pertenezcan a un usuario
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES app_accounts(id);

-- 4. Insertar Credenciales Iniciales
-- Elias2026 / Elias && prueba / prueba
INSERT INTO app_accounts (id, username, password_hash) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Elias2026', 'Elias'),
  ('22222222-2222-2222-2222-222222222222', 'prueba', 'prueba')
ON CONFLICT (username) DO NOTHING;

-- 5. Migración de datos heredados
-- Vinculamos los 3 perfiles estáticos que ya tenías cargados 
-- (Elías, Atenea, Marco) directamente a la cuenta 'Elias2026' 
-- para que NO pierda su XP acumulada.
UPDATE profiles 
SET account_id = '11111111-1111-1111-1111-111111111111' 
WHERE id IN (
  '00000000-0000-0000-0000-000000000001', 
  '00000000-0000-0000-0000-000000000002', 
  '00000000-0000-0000-0000-000000000003'
);
