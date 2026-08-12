// Tipos y helpers para el módulo de pacientes del panel del kinesiólogo.

export type Paciente = {
  id: string
  kinesiologo_id: string
  nombre: string
  apellido: string
  fecha_nacimiento: string | null
  tipo_lesion: string | null
  observaciones: string | null
  activo: boolean
  created_at: string
  avatar_url?: string | null
  dni?: string | null
  email_paciente?: string | null
  telefono?: string | null
  genero?: string | null
  contacto_emergencia_nombre?: string | null
  contacto_emergencia_telefono?: string | null
  fecha_inicio_rehabilitacion?: string | null
}

export type PacienteInput = {
  nombre: string
  apellido: string
  fecha_nacimiento: string | null
  tipo_lesion: string | null
  observaciones: string | null
  activo?: boolean
  dni?: string | null
  email_paciente?: string | null
  telefono?: string | null
  genero?: string | null
  contacto_emergencia_nombre?: string | null
  contacto_emergencia_telefono?: string | null
  fecha_inicio_rehabilitacion?: string | null
}

export function nombreCompleto(p: Paciente): string {
  return `${p.nombre} ${p.apellido}`.trim()
}

export function iniciales(p: Paciente): string {
  return `${p.nombre?.[0] ?? ''}${p.apellido?.[0] ?? ''}`.toUpperCase() || '?'
}

// El backend guarda fecha_nacimiento; la edad se calcula para mostrarla.
export function calcularEdad(fechaNacimiento: string | null | undefined): number | null {
  if (!fechaNacimiento) return null
  const nacimiento = new Date(fechaNacimiento)
  if (Number.isNaN(nacimiento.getTime())) return null
  const hoy = new Date()
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const cumplePasado =
    hoy.getMonth() > nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() >= nacimiento.getDate())
  if (!cumplePasado) edad -= 1
  return edad
}

export function formatearFecha(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}
