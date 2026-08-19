import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getSesiones,
  type SesionRow,
  JUEGO_LABEL,
  JUEGO_ICON,
  resultadoPrincipal,
  formatFecha,
} from '../lib/sesiones'

type Filtro = 'todos' | 'surf' | 'flamenco' | 'estrellas'

const FILTROS: { value: Filtro; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'surf', label: 'Surf' },
  { value: 'flamenco', label: 'Flamenco' },
  { value: 'estrellas', label: 'Estrellas' },
]

function StatCard({ icon, label, value, tint }: { icon: string; label: string; value: string | number; tint: string }) {
  return (
    <div className="bg-white rounded-[18px] p-5 shadow-[0_6px_24px_-12px_rgba(43,49,156,0.15)]">
      <span className={`w-10 h-10 rounded-[12px] flex items-center justify-center ${tint} mb-3`}>
        <span className="material-symbols-rounded text-[20px]">{icon}</span>
      </span>
      <p className="text-2xl font-black text-primary">{value}</p>
      <p className="text-text-muted text-xs font-semibold mt-0.5">{label}</p>
    </div>
  )
}

export default function Analisis() {
  const [sesiones, setSesiones] = useState<SesionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('todos')

  useEffect(() => {
    getSesiones()
      .then(setSesiones)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar sesiones'))
      .finally(() => setLoading(false))
  }, [])

  const sesionesVistas = filtro === 'todos' ? sesiones : sesiones.filter((s) => s.juego === filtro)

  const hoy = new Date().toISOString().slice(0, 10)
  const sesionesHoy = sesiones.filter((s) => s.iniciada_en.slice(0, 10) === hoy).length
  const conteoJuego = (j: string) => sesiones.filter((s) => s.juego === j).length

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-black text-primary">Análisis</h1>
        <p className="text-text-muted font-medium mt-1">
          Evolución, métricas y progreso de los pacientes.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-[14px] px-4 py-3 mb-6 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[110px] rounded-[18px] bg-white/70 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon="sports_gymnastics" label="Total sesiones" value={sesiones.length} tint="bg-violet-100 text-primary" />
          <StatCard icon="today" label="Sesiones hoy" value={sesionesHoy} tint="bg-pink-100 text-accent" />
          <StatCard icon="surfing" label="Partidas de Surf" value={conteoJuego('surf')} tint="bg-sky-100 text-sky-600" />
          <StatCard icon="star" label="Partidas de Estrellas" value={conteoJuego('estrellas')} tint="bg-amber-100 text-amber-600" />
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTROS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`rounded-full text-sm font-bold px-4 py-2 transition-colors ${
              filtro === f.value
                ? 'bg-primary text-white'
                : 'bg-white text-text-muted hover:bg-bg-input border border-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tabla de sesiones */}
      <div className="bg-white rounded-[18px] shadow-[0_6px_24px_-12px_rgba(43,49,156,0.15)] overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-primary font-black text-lg">
            Historial de sesiones
            {filtro !== 'todos' && (
              <span className="text-text-muted font-semibold text-base ml-2">— {JUEGO_LABEL[filtro]}</span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-[12px] bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : sesionesVistas.length === 0 ? (
          <div className="p-10 text-center">
            <span className="material-symbols-rounded text-[48px] text-text-placeholder">bar_chart</span>
            <p className="text-text-muted font-semibold mt-3">
              {sesiones.length === 0
                ? 'Todavía no hay sesiones registradas.'
                : 'No hay sesiones para este filtro.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-text-muted text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-3 text-left">Paciente</th>
                  <th className="px-4 py-3 text-left">Juego</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-right">Resultado</th>
                  <th className="px-4 py-3 text-right">Duración</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sesionesVistas.map((s) => (
                  <tr key={s.id} className="hover:bg-bg-header/40 transition-colors">
                    <td className="px-6 py-4">
                      {s.pacientes ? (
                        <Link
                          to={`/pacientes/${s.pacientes.id}`}
                          className="text-text-label font-bold hover:text-accent transition-colors"
                        >
                          {s.pacientes.nombre} {s.pacientes.apellido}
                        </Link>
                      ) : (
                        <span className="text-text-placeholder">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 text-primary font-semibold">
                        <span className="material-symbols-rounded text-[16px]">{JUEGO_ICON[s.juego] ?? 'sports_esports'}</span>
                        {JUEGO_LABEL[s.juego] ?? s.juego}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-text-muted font-medium">{formatFecha(s.iniciada_en)}</td>
                    <td className="px-4 py-4 text-right font-black text-primary">{resultadoPrincipal(s)}</td>
                    <td className="px-4 py-4 text-right text-text-muted font-medium">
                      {s.duracion_segundos != null ? `${s.duracion_segundos}s` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
