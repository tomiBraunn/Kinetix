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

// Salida de kinetixAI.getMetricasResumen() (ver front/src/ia/KinetixAI.js) —
// calculadas de verdad a partir del tracking de MediaPipe (varianza del
// centro de cadera para estabilidad, ángulos de rodilla/codo para rango de
// movimiento), no inventadas. null cuando no hubo suficientes muestras.
export type MetricasEquilibrio = {
  estabilidad_score: number | null
  rango_movimiento_avg: number | null
  rango_movimiento_max: number | null
}

function token() { return getToken() ?? undefined }

export async function crearSesion(paciente_id: string, juego: string) {
  return api.post<{ id: string }>('/sesiones', { paciente_id, juego }, { token: token() })
}

export async function finalizarSesion(sesionId: string, metricas: Metricas, metricasEquilibrio?: MetricasEquilibrio) {
  await api.put(
    `/sesiones/${sesionId}/finalizar`,
    {
      duracion_segundos: metricas.duracion_segundos,
      metricas: {
        repeticiones_correctas:
          metricas.juego === 'surf' ? metricas.puntos
          : metricas.juego === 'flamenco' ? metricas.intentos
          : metricas.estrellas_alcanzadas,
        ...metricasEquilibrio,
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

export async function getAnalisisIA(sesionId: string): Promise<{ analisis: string | null; error?: string | null }> {
  return api.get(`/sesiones/${sesionId}/analisis-ia`, { token: token() })
}

export type EstadisticasGlobales = {
  sesiones_totales: number
  precision_promedio: number | null
  rango_promedio: number | null
}

export async function getEstadisticas(): Promise<EstadisticasGlobales> {
  return api.get<EstadisticasGlobales>('/estadisticas', { token: token() })
}

export type VideosASubir = { crudo?: Blob; landmarks?: Blob; gameplay?: Blob }

// El navegador setea el Content-Type de cada parte del multipart según
// blob.type — el nombre de archivo es solo cosmético, pero lo mantenemos
// consistente con el formato real (Safari/iOS graba en mp4, no webm).
function extension(blob: Blob) {
  return blob.type.includes('mp4') ? 'mp4' : 'webm'
}

export async function subirVideosSesion(sesionId: string, videos: VideosASubir) {
  const formData = new FormData()
  if (videos.crudo) formData.append('crudo', videos.crudo, `crudo.${extension(videos.crudo)}`)
  if (videos.landmarks) formData.append('landmarks', videos.landmarks, `landmarks.${extension(videos.landmarks)}`)
  if (videos.gameplay) formData.append('gameplay', videos.gameplay, `gameplay.${extension(videos.gameplay)}`)
  // api.post no fuerza Content-Type cuando el body es FormData (ver api.ts) —
  // el browser setea multipart/form-data con el boundary correcto solo.
  return api.post(`/sesiones/${sesionId}/videos`, formData, { token: token() })
}

export type EventoSesion = { tipo: 'acierto' | 'repeticion' | 'fin_juego' | 'mensaje'; mensaje?: string; datos?: unknown }

export async function mandarEventosSesion(sesionId: string, eventos: EventoSesion[]) {
  return api.post(`/sesiones/${sesionId}/eventos`, { eventos }, { token: token() })
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
