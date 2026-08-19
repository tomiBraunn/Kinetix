import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import {
  calcularEdad,
  formatearFecha,
  iniciales,
  nombreCompleto,
  type Paciente,
} from '../lib/pacientes'

type Orden = 'nombre' | 'apellido' | 'fecha_nacimiento'

// Esqueleto de la página completa (título, buscador y tabla) para que no
// haya salto de layout cuando termina de cargar.
function PacientesSkeleton() {
  return (
    <div className="max-w-6xl mx-auto animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="space-y-2">
          <div className="h-8 w-64 rounded bg-slate-200" />
          <div className="h-4 w-80 rounded bg-slate-200" />
        </div>
        <div className="h-12 w-56 rounded-full bg-slate-200" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="h-[46px] w-full max-w-sm rounded-full bg-slate-200" />
        <div className="h-[46px] w-40 rounded-full bg-slate-200" />
      </div>

      <div className="bg-white rounded-[18px] shadow-[0_6px_24px_-12px_rgba(43,49,156,0.15)] overflow-hidden">
        <div className="h-[52px] bg-bg-header/60" />
        <div className="divide-y divide-slate-50">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3.5 w-40 rounded bg-slate-200" />
                <div className="h-3 w-28 rounded bg-slate-100" />
              </div>
              <div className="hidden md:block h-3 w-10 rounded bg-slate-200 shrink-0" />
              <div className="hidden lg:block h-5 w-20 rounded-full bg-slate-200 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Pacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState<Orden>('nombre')

  useEffect(() => {
    let active = true
    api
      .get<Paciente[]>('/pacientes', { token: localStorage.getItem('kinetix_token') })
      .then((data) => {
        if (!active) return
        setPacientes(data)
      })
      .catch((err) => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los pacientes')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const lista = q
      ? pacientes.filter((p) => nombreCompleto(p).toLowerCase().includes(q))
      : [...pacientes]
    lista.sort((a, b) => {
      if (orden === 'fecha_nacimiento') {
        const fa = a.fecha_nacimiento ?? ''
        const fb = b.fecha_nacimiento ?? ''
        return fa.localeCompare(fb)
      }
      return a[orden].localeCompare(b[orden])
    })
    return lista
  }, [pacientes, busqueda, orden])

  if (loading) {
    return <PacientesSkeleton />
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-primary">Todos tus pacientes</h1>
          <p className="text-text-muted font-medium mt-1">
            Gestioná los pacientes de tu consultorio y su evolución.
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

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-text-placeholder text-[20px]">
            search
          </span>
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre…"
            className="w-full h-[46px] bg-white rounded-full pl-12 pr-6 text-[15px] font-medium text-text-label placeholder:text-text-placeholder outline-none focus:ring-2 focus:ring-accent/40 transition-shadow"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-text-muted text-sm font-semibold" htmlFor="orden">
            Ordenar por
          </label>
          <select
            id="orden"
            value={orden}
            onChange={(e) => setOrden(e.target.value as Orden)}
            className="h-[46px] bg-white rounded-full px-4 text-sm font-semibold text-text-label outline-none focus:ring-2 focus:ring-accent/40"
          >
            <option value="nombre">Nombre</option>
            <option value="apellido">Apellido</option>
            <option value="fecha_nacimiento">Edad</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-[14px] px-4 py-3 mb-6 text-sm font-semibold">
          {error}
        </div>
      )}

      {filtrados.length === 0 ? (
        <div className="bg-white rounded-[18px] p-12 text-center shadow-sm">
          <span className="material-symbols-rounded text-[44px] text-text-placeholder">group</span>
          <p className="text-text-muted font-semibold mt-3">
            {pacientes.length === 0
              ? 'Todavía no tenés pacientes cargados.'
              : 'No se encontraron pacientes con ese nombre.'}
          </p>
          {pacientes.length === 0 && (
            <Link
              to="/pacientes/nuevo"
              className="inline-flex items-center gap-2 rounded-full bg-accent text-white text-sm font-bold px-5 py-2.5 mt-4 hover:bg-[#C83890] transition-colors"
            >
              <span className="material-symbols-rounded text-[18px]">person_add</span>
              Agregar el primero
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[18px] shadow-[0_6px_24px_-12px_rgba(43,49,156,0.15)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-bg-header/60 text-text-muted text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Paciente</th>
                  <th className="px-6 py-4 hidden md:table-cell">Edad</th>
                  <th className="px-6 py-4 hidden lg:table-cell">Mejorar</th>
                  <th className="px-6 py-4 hidden lg:table-cell">Desde</th>
                  <th className="px-6 py-4 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtrados.map((p) => {
                  const edad = calcularEdad(p.fecha_nacimiento)
                  return (
                    <tr key={p.id} className="hover:bg-bg-header/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
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
                          <div className="min-w-0">
                            <p className="text-text-label font-bold truncate">{nombreCompleto(p)}</p>
                            {p.email_paciente && (
                              <p className="text-text-muted text-xs font-medium truncate">
                                {p.email_paciente}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-text-label font-semibold">
                        {edad !== null ? `${edad} años` : '—'}
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="inline-flex rounded-full bg-violet-50 text-primary text-xs font-bold px-3 py-1">
                          {p.tipo_lesion || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell text-text-muted text-sm font-medium">
                        {formatearFecha(p.fecha_inicio_rehabilitacion)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/pacientes/${p.id}`}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-bg-input text-primary hover:bg-accent hover:text-white transition-colors"
                          aria-label={`Ver detalle de ${nombreCompleto(p)}`}
                        >
                          <span className="material-symbols-rounded text-[20px]">arrow_forward</span>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-bg-header/40 text-xs font-semibold text-text-muted">
            {filtrados.length} {filtrados.length === 1 ? 'paciente' : 'pacientes'}
          </div>
        </div>
      )}
    </div>
  )
}