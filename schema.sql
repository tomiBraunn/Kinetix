-- Kinetix Sprint1 schema
CREATE TABLE IF NOT EXISTS kinesiologo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre varchar(255),
  apellido varchar(255),
  email varchar(255) UNIQUE,
  password_hash varchar(255),
  google_id varchar(255),
  github_id varchar(255),
  created_at timestamptz DEFAULT now()
);
