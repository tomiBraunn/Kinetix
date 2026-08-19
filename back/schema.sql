-- Kinetix — Schema de la base de datos (Supabase)
-- Alineado con la BD real del proyecto (project_ref: ihnvurzeuenwymqqyejz) — julio 2026
-- Nota: la BD real ya tiene estas tablas creadas. Este archivo documenta el estado
-- real y sirve de referencia; solo ejecutar lo que no exista.

-- ============================================================
-- kinesiologos
-- ============================================================
CREATE TABLE IF NOT EXISTS kinesiologos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre varchar(255) NOT NULL,
  apellido varchar(255) NOT NULL,
  email varchar(255) UNIQUE NOT NULL,
  password_hash varchar(255),
  google_id varchar(255) UNIQUE,
  github_id varchar(255) UNIQUE,
  avatar_url text,
  email_verificado boolean NOT NULL DEFAULT false,
  verification_token varchar(255),
  verification_token_expira timestamptz,
  reset_token varchar(255),
  reset_token_expira timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- pacientes
-- ============================================================
CREATE TABLE IF NOT EXISTS pacientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kinesiologo_id uuid NOT NULL REFERENCES kinesiologos(id) ON DELETE CASCADE,
  nombre varchar(255) NOT NULL,
  apellido varchar(255) NOT NULL,
  fecha_nacimiento date,
  tipo_lesion text,
  observaciones text,
  activo boolean DEFAULT true,
  dni varchar(50),
  email_paciente varchar(255),
  telefono varchar(50),
  genero varchar(50),
  contacto_emergencia_nombre varchar(255),
  contacto_emergencia_telefono varchar(50),
  fecha_inicio_rehabilitacion date,
  avatar_url text,
  created_at timestamp DEFAULT now()
);

-- ============================================================
-- sesiones
-- ============================================================
CREATE TABLE IF NOT EXISTS sesiones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  kinesiologo_id uuid NOT NULL REFERENCES kinesiologos(id) ON DELETE CASCADE,
  juego text CHECK (juego IN ('surf', 'flamenco', 'estrellas')),
  iniciada_en timestamp DEFAULT now(),
  finalizada_en timestamp,
  duracion_segundos int,
  estado text DEFAULT 'en_curso' CHECK (estado IN ('en_curso', 'finalizada', 'cancelada')),
  notas text
);

-- Migración: agregar columna juego si la tabla ya existe
-- Ejecutar una sola vez en Supabase SQL Editor:
-- ALTER TABLE sesiones ADD COLUMN IF NOT EXISTS juego text CHECK (juego IN ('surf', 'flamenco', 'estrellas'));

-- ============================================================
-- metricas (crudas por sesión — llegan desde la app móvil)
-- ============================================================
CREATE TABLE IF NOT EXISTS metricas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id uuid NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
  tipo varchar(100) NOT NULL,
  valor numeric NOT NULL,
  unidad varchar(50),
  timestamp timestamptz DEFAULT now()
);

-- ============================================================
-- metricas_sesion (resumen de métricas por sesión)
-- ============================================================
CREATE TABLE IF NOT EXISTS metricas_sesion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id uuid NOT NULL UNIQUE REFERENCES sesiones(id) ON DELETE CASCADE,
  repeticiones_correctas int DEFAULT 0,
  repeticiones_totales int DEFAULT 0,
  precision_porcentaje double precision,
  rango_movimiento_max double precision,
  rango_movimiento_avg double precision,
  estabilidad_score double precision,
  datos_ia_raw jsonb,
  created_at timestamp DEFAULT now()
);
