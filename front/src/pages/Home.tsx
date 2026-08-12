import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { nombreCompleto, iniciales, type Paciente } from '../lib/pacientes'

type DashboardResumen = {
  total_pacientes: number | null
  pacientes_activos: number | null
  sesiones_hoy: number | null
}

function StatCard({
  icon,
  label,
  value,
  tint,
}: {
  icon: string
  label: string
  value: number | null
  tint: string
}) {
  return (
    <div className="bg-white rounded-[18px] p-6 shadow-[0_6px_24px_-12px_rgba(43,49,156,0.15)] border-t-4 border-accent">
      <div className="flex items-center justify-between mb-4">
        <span className={`w-11 h-11 rounded-[14px] flex items-center justify-center ${tint}`}>
          <span className="material-symbols-rounded text-[22px]">{icon}</span>
        </span>
      </div>
      <p className="text-3xl font-black text-primary">{value ?? '—'}</p>
      <p className="text-text-muted text-sm font-semibold mt-1">{label}</p>
    </div>
  )
}

export default function Home() {
  const { user } = useAuth()
  const [resumen, setResumen] = useState<DashboardResumen | null>(null)
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const primerNombre = user?.nombre?.split(' ')[0] ?? ''

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [dash, pac] = await Promise.all([
          api.get<DashboardResumen>('/dashboard', { token: localStorage.getItem('kinetix_token') }),
          api.get<Paciente[]>('/pacientes', { token: localStorage.getItem('kinetix_token') }),
        ])
        if (!active) return
        setResumen(dash)
        setPacientes(pac)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'No se pudo cargar el panel')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const ultimosPacientes = pacientes.slice(0, 5)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-primary">
            Hola, {primerNombre || 'Kinesiólogo'} 👋
          </h1>
          <p className="text-text-muted font-medium mt-1">
            Acá tenés el resumen de tu consultorio de hoy.
          </p>
        </div>
        <Link
          to="/pacientes/nuevo"
          className="inline-flex items-center gap-2 rounded-full bg-accent text-white text-sm font-bold px-6 py-3 hover:bg-[#C83890] transition-colors shadow-[0_12px_24px_-12px_rgba(224,64,160,0.6)]"
        >
          <span className="material-symbols-rounded text-[18px]">person_add</span>
          Agendar nuevo paciente
        </Link>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-[14px] px-4 py-3 mb-6 text-sm font-semibold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[150px] rounded-[18px] bg-white/70 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon="group"
            label="Pacientes activos"
            value={resumen?.pacientes_activos ?? null}
            tint="bg-violet-100 text-primary"
          />
          <StatCard
            icon="sports_gymnastics"
            label="Sesiones hoy"
            value={resumen?.sesiones_hoy ?? null}
            tint="bg-pink-100 text-accent"
          />
          <StatCard
            icon="diversity_3"
            label="Total de pacientes"
            value={resumen?.total_pacientes ?? null}
            tint="bg-sky-100 text-sky-600"
          />
        </div>
      )}

      <div className="bg-white rounded-[18px] shadow-[0_6px_24px_-12px_rgba(43,49,156,0.15)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-primary font-black text-lg">Tus pacientes</h2>
          <Link
            to="/pacientes"
            className="text-accent text-sm font-bold hover:underline inline-flex items-center gap-1"
          >
            Ver todos
            <span className="material-symbols-rounded text-[18px]">arrow_forward</span>
          </Link>
        </div>

        {loading ? (
          <div className="p-6 text-text-muted text-sm">Cargando pacientes…</div>
        ) : ultimosPacientes.length === 0 ? (
          <div className="p-10 text-center">
            <span className="material-symbols-rounded text-[40px] text-text-placeholder">group</span>
            <p className="text-text-muted font-semibold mt-3">
              Todavía no tenés pacientes cargados.
            </p>
            <Link
              to="/pacientes/nuevo"
              className="inline-flex items-center gap-2 rounded-full bg-accent text-white text-sm font-bold px-5 py-2.5 mt-4 hover:bg-[#C83890] transition-colors"
            >
              <span className="material-symbols-rounded text-[18px]">person_add</span>
              Agregar el primero
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {ultimosPacientes.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/pacientes/${p.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-bg-header/60 transition-colors"
                >
                  {p.avatar_url ? (
                    <img
                      src={p.avatar_url}
                      alt={nombreCompleto(p)}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">
                      {iniciales(p)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-text-label font-bold truncate">{nombreCompleto(p)}</p>
                    <p className="text-text-muted text-sm font-medium truncate">
                      {p.tipo_lesion || 'Sin lesión registrada'}
                    </p>
                  </div>
                  <span
                    className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-bold rounded-full px-3 py-1 ${
                      p.activo ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-text-muted'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${p.activo ? 'bg-emerald-500' : 'bg-slate-400'}`}
                    />
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 bg-gradient-to-r from-primary to-primary-dark rounded-[18px] p-6 text-white relative overflow-hidden">
        <span className="material-symbols-rounded absolute -right-4 -bottom-6 text-[110px] text-white/10">
          self_improvement
        </span>
        <span className="material-symbols-rounded text-[28px]">lightbulb</span>
        <p className="text-white/80 text-xs font-bold uppercase tracking-wider mt-2 mb-1">
          Consejo del día
        </p>
        <p className="font-bold max-w-md leading-snug">
          La constancia es la clave de la rehabilitación. Un paciente que juega, vuelve.
        </p>
      </div>
    </div>
  )
}