CREATE TABLE IF NOT EXISTS kinesiologo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre varchar(255) NOT NULL,
  apellido varchar(255) NOT NULL,
  email varchar(255) UNIQUE NOT NULL,
  password_hash varchar(255),
  google_id varchar(255) UNIQUE,
  github_id varchar(255) UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS paciente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kinesiologo_id uuid NOT NULL REFERENCES kinesiologo(id) ON DELETE CASCADE,
  nombre varchar(255) NOT NULL,
  apellido varchar(255) NOT NULL,
  email varchar(255),
  telefono varchar(50),
  diagnostico text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sesion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES paciente(id) ON DELETE CASCADE,
  kinesiologo_id uuid NOT NULL REFERENCES kinesiologo(id) ON DELETE CASCADE,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  duracion_minutos int,
  notas text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS metrica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id uuid NOT NULL REFERENCES sesion(id) ON DELETE CASCADE,
  tipo varchar(100) NOT NULL,
  valor numeric NOT NULL,
  unidad varchar(50),
  timestamp timestamptz DEFAULT now()
);
