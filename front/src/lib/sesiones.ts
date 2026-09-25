import { api } from './api'
import { getToken } from './auth'

export type SesionRow = {
  id: string
  juego: 'surf' | 'flamenco' | 'estrellas'
  estado: 'en_curso' | 'finalizada' | 'cancelada'
  iniciada_en: string
  finalizada_en: string | null
  duracion_segundos: number | null
  pacientes: { id: string; nombre: string; apellido: string } | null
  // sesion_id en metricas_sesion es UNIQUE -> Supabase la embebe como objeto
  // 1:1, no como array, aunque el nombre de la tabla sea plural.
  metricas_sesion: {
    repeticiones_correctas: number | null
    datos_ia_raw: Record<string, unknown> | null
  } | null
}

type MetricasSurf = { juego: 'surf'; puntos: number; duracion_segundos: number }
type MetricasFlamenco = { juego: 'flamenco'; mejor_tiempo_segundos: number; intentos: number; duracion_segundos: number }
type MetricasEstrellas = { juego: 'estrellas'; estrellas_alcanzadas: number; movimientos_pies: number; duracion_segundos: number }
type Metricas = MetricasSurf | MetricasFlamenco | MetricasEstrellas

function token() { return getToken() ?? undefined }

export async function crearSesion(paciente_id: string, juego: string) {
  return api.post<{ id: string }>('/sesiones', { paciente_id, juego }, { token: token() })
}

export async function finalizarSesion(sesionId: string, metricas: Metricas) {
  await api.put(
    `/sesiones/${sesionId}/finalizar`,
    {
      duracion_segundos: metricas.duracion_segundos,
      metricas: {
        repeticiones_correctas:
          metricas.juego === 'surf' ? metricas.puntos
          : metricas.juego === 'flamenco' ? metricas.intentos
          : metricas.estrellas_alcanzadas,
        datos_ia_raw: metricas,
      },
    },
    { token: token() },
  )
}

export async function getSesiones(pacienteId?: string): Promise<SesionRow[]> {
  const qs = pacienteId ? `?pacienteId=${pacienteId}` : ''
  return api.get<SesionRow[]>(`/sesiones${qs}`, { token: token() })
}

export type VideosSesion = {
  url_crudo: string | null
  url_landmarks: string | null
  url_gameplay: string | null
}

export type SesionDetalle = Omit<SesionRow, 'metricas_sesion'> & {
  notas: string | null
  metricas_sesion: {
    repeticiones_correctas: number | null
    repeticiones_totales: number | null
    precision_porcentaje: number | null
    rango_movimiento_max: number | null
    rango_movimiento_avg: number | null
    estabilidad_score: number | null
    datos_ia_raw: Record<string, unknown> | null
  } | null
  // null si nunca se subió ningún video para esta sesión (embed 1:1 de Supabase)
  videos_sesion: VideosSesion | null
}

export async function getSesion(sesionId: string): Promise<SesionDetalle> {
  return api.get<SesionDetalle>(`/sesiones/${sesionId}`, { token: token() })
}

export type EstadisticasGlobales = {
  sesiones_totales: number
  precision_promedio: number | null
  rango_promedio: number | null
}

export async function getEstadisticas(): Promise<EstadisticasGlobales> {
  return api.get<EstadisticasGlobales>('/estadisticas', { token: token() })
}

// Helpers de presentación
export const JUEGO_LABEL: Record<string, string> = {
  surf: 'Surf',
  flamenco: 'Flamenco Challenge',
  estrellas: 'Alcanzá la estrella',
}

export const JUEGO_ICON: Record<string, string> = {
  surf: 'surfing',
  flamenco: 'directions_walk',
  estrellas: 'star',
}

export function resultadoPrincipal(s: SesionRow): string {
  const raw = s.metricas_sesion?.datos_ia_raw as Record<string, unknown> | null
  if (!raw) return '—'
  if (s.juego === 'surf') return `${raw.puntos ?? '?'} peces`
  if (s.juego === 'flamenco') return `${raw.mejor_tiempo_segundos ?? '?'}s`
  if (s.juego === 'estrellas') return `${raw.estrellas_alcanzadas ?? '?'} estrellas`
  return '—'
}

export function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}
