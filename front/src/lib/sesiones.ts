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
    estabilidad_score: number | null
    rango_movimiento_avg: number | null
    precision_porcentaje: number | null
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
  control_tronco?: number | null
  control_lateral?: number | null
  apoyo_der_pct?: number | null
  apoyo_izq_pct?: number | null
  tiempo_reaccion_s?: number | null
  coordinacion?: number | null
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
        // Las métricas extra van dentro de datos_ia_raw (jsonb): no requieren columnas nuevas.
        datos_ia_raw: {
          ...metricas,
          control_tronco: metricasEquilibrio?.control_tronco ?? null,
          control_lateral: metricasEquilibrio?.control_lateral ?? null,
          apoyo_der_pct: metricasEquilibrio?.apoyo_der_pct ?? null,
          apoyo_izq_pct: metricasEquilibrio?.apoyo_izq_pct ?? null,
          tiempo_reaccion_s: metricasEquilibrio?.tiempo_reaccion_s ?? null,
          coordinacion: metricasEquilibrio?.coordinacion ?? null,
        },
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

// Análisis estructurado que devuelve el modelo (ver back/src/utils/nvidiaAI.js).
// `detalle` es null para sesiones analizadas antes, que solo tienen `analisis`.
export type DetalleAnalisisIA = {
  fortaleza?: string
  a_mejorar?: string
  proxima_meta?: string
  sugerencia?: string
  areas?: string[]
  mensaje?: string
}

export type AnalisisIA = {
  analisis: string | null
  detalle: DetalleAnalisisIA | null
  error?: string | null
}

export async function getAnalisisIA(sesionId: string): Promise<AnalisisIA> {
  return api.get<AnalisisIA>(`/sesiones/${sesionId}/analisis-ia`, { token: token() })
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

// Subida directa a Supabase Storage con URLs firmadas: el video no pasa por la
// función serverless del backend (Vercel corta los requests de más de 4.5 MB).
export async function subirVideosSesion(sesionId: string, videos: VideosASubir) {
  const presentes = (['crudo', 'landmarks', 'gameplay'] as const).filter((t) => videos[t] && videos[t]!.size > 0)
  if (presentes.length === 0) return

  const pedido = Object.fromEntries(presentes.map((t) => [t, videos[t]!.type.split(';')[0]]))
  const urls = await api.post<Record<string, { path: string; signedUrl: string }>>(
    `/sesiones/${sesionId}/videos/urls`, { videos: pedido }, { token: token() },
  )

  // Promise.all aborta todo el lote apenas UNA subida falla, y con eso se
  // pierde también la confirmación de las que sí llegaron bien a Storage
  // (quedan huérfanas: el archivo está en el bucket pero nunca se guarda su
  // URL en videos_sesion). Con allSettled confirmamos lo que se pudo subir
  // y solo logueamos lo que falló.
  const subidos: Record<string, string> = {}
  const resultados = await Promise.allSettled(presentes.map(async (tipo) => {
    const blob = videos[tipo]!
    const body = new FormData()
    body.append('cacheControl', '3600')
    body.append('', blob)
    const res = await fetch(urls[tipo].signedUrl, { method: 'PUT', body, headers: { 'x-upsert': 'true' } })
    if (!res.ok) throw new Error(`No se pudo subir el video ${tipo} (${(blob.size / 1e6).toFixed(1)} MB): ${res.status} ${await res.text()}`)
    subidos[tipo] = urls[tipo].path
  }))
  resultados.forEach((r) => { if (r.status === 'rejected') console.warn(r.reason) })
  if (Object.keys(subidos).length === 0) throw new Error('No se pudo subir ningún video')

  return api.post(`/sesiones/${sesionId}/videos/confirmar`, subidos, { token: token() })
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
