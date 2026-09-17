import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getSesion,
  type SesionDetalle,
  JUEGO_LABEL,
  JUEGO_ICON,
  formatFecha,
} from '../lib/sesiones'

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-[18px] p-5 shadow-[0_6px_24px_-12px_rgba(43,49,156,0.15)]">
      <p className="text-2xl font-black text-primary">{value}</p>
      <p className="text-text-muted text-xs font-semibold mt-0.5">{label}</p>
    </div>
  )
}

// Cada juego guarda su propio JSON en datos_ia_raw — mapeamos los campos
// relevantes por tipo de juego en vez de intentar generalizar una sola forma.
function statsPorJuego(s: SesionDetalle): { label: string; value: string | number }[] {
  const raw = (s.metricas_sesion?.[0]?.datos_ia_raw ?? {}) as Record<string, unknown>
  if (s.juego === 'surf') {
    return [
      { label: 'Peces atrapados', value: (raw.puntos as number) ?? '—' },
      { label: 'Duración', value: raw.duracion_segundos ? `${raw.duracion_segundos}s` : '—' },
    ]
  }
  if (s.juego === 'flamenco') {
    return [
      { label: 'Mejor tiempo en equilibrio', value: raw.mejor_tiempo_segundos ? `${raw.mejor_tiempo_segundos}s` : '—' },
      { label: 'Intentos', value: (raw.intentos as number) ?? '—' },
    ]
  }
  if (s.juego === 'estrellas') {
    return [
      { label: 'Estrellas alcanzadas', value: (raw.estrellas_alcanzadas as number) ?? '—' },
      { label: 'Movimientos de pies', value: (raw.movimientos_pies as number) ?? '—' },
    ]
  }
  return []
}

// Métricas que calcula MediaPipe a partir del tracking del cuerpo — distintas
// del puntaje del juego. No todas las sesiones las tienen (juegos viejos,
// jugados con las teclas de testing, no las generan).
function metricasIA(s: SesionDetalle): { label: string; value: string }[] {
  const m = s.metricas_sesion?.[0]
  if (!m) return []
  const out: { label: string; value: string }[] = []
  if (m.estabilidad_score != null) out.push({ label: 'Estabilidad', value: `${m.estabilidad_score}%` })
  if (m.precision_porcentaje != null) out.push({ label: 'Precisión de movimiento', value: `${m.precision_porcentaje}%` })
  if (m.rango_movimiento_avg != null) out.push({ label: 'Rango de movimiento (prom.)', value: `${m.rango_movimiento_avg}°` })
  if (m.rango_movimiento_max != null) out.push({ label: 'Rango de movimiento (máx.)', value: `${m.rango_movimiento_max}°` })
  return out
}

export default function ResultadoSesion() {
  const { sesionId } = useParams<{ sesionId: string }>()
  const [sesion, setSesion] = useState<SesionDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sesionId) return
    let active = true
    getSesion(sesionId)
      .then((data) => { if (active) setSesion(data) })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'No se pudo cargar la sesión') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [sesionId])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-48 rounded bg-white/70 animate-pulse" />
        <div className="h-40 rounded-[18px] bg-white/70 animate-pulse" />
      </div>
    )
  }

  if (error || !sesion) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <span className="material-symbols-rounded text-[48px] text-rose-400">error</span>
        <h2 className="text-xl font-black text-primary mt-4">Sesión no encontrada</h2>
        <p className="text-text-muted font-medium mt-1">{error ?? 'Esa sesión no existe o no te pertenece.'}</p>
        <Link to="/analisis" className="inline-flex items-center gap-2 rounded-full bg-accent text-white text-sm font-bold px-6 py-3 mt-6 hover:bg-[#C83890]">
          <span className="material-symbols-rounded text-[18px]">arrow_back</span>
          Volver a análisis
        </Link>
      </div>
    )
  }

  const volverA = sesion.pacientes ? `/pacientes/${sesion.pacientes.id}` : '/analisis'

  return (
    <div className="max-w-3xl mx-auto">
      <Link to={volverA} className="inline-flex items-center gap-1 text-text-muted text-sm font-bold hover:text-accent mb-6">
        <span className="material-symbols-rounded text-[18px]">arrow_back</span>
        Volver
      </Link>

      <div className="bg-white rounded-[18px] shadow-[0_6px_24px_-12px_rgba(43,49,156,0.15)] p-6 lg:p-8 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="w-10 h-10 rounded-[12px] bg-violet-50 text-primary flex items-center justify-center">
            <span className="material-symbols-rounded text-[20px]">{JUEGO_ICON[sesion.juego] ?? 'sports_esports'}</span>
          </span>
          <h1 className="text-2xl font-black text-primary">{JUEGO_LABEL[sesion.juego] ?? sesion.juego}</h1>
        </div>
        <p className="text-text-muted font-medium">
          {sesion.pacientes ? `${sesion.pacientes.nombre} ${sesion.pacientes.apellido} — ` : ''}
          {formatFecha(sesion.iniciada_en)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {statsPorJuego(sesion).map((s) => (
          <Stat key={s.label} label={s.label} value={s.value} />
        ))}
        <Stat label="Duración total" value={sesion.duracion_segundos != null ? `${sesion.duracion_segundos}s` : '—'} />
        <Stat label="Estado" value={sesion.estado === 'finalizada' ? 'Finalizada' : sesion.estado} />
      </div>

      {metricasIA(sesion).length > 0 && (
        <div className="mt-6 bg-primary rounded-[18px] p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-rounded text-[20px] text-accent-light">neurology</span>
            <p className="text-xs font-bold uppercase tracking-wider text-white/80">Análisis de IA — MediaPipe</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {metricasIA(sesion).map((m) => (
              <div key={m.label}>
                <p className="text-2xl font-black">{m.value}</p>
                <p className="text-white/70 text-xs font-semibold mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
