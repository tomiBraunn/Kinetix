import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getSesiones,
  getSesion,
  getAnalisisIA,
  type SesionRow,
  type SesionDetalle,
  type AnalisisIA,
  formatFecha,
} from '../lib/sesiones'
import AnalisisSesion, { CARD, TITULO, Esqueleto } from '../components/AnalisisSesion'

function iniciales(nombre?: string, apellido?: string) {
  return `${nombre?.[0] ?? ''}${apellido?.[0] ?? ''}`.toUpperCase() || '—'
}

function Avatar({ nombre, apellido, className = '' }: { nombre?: string; apellido?: string; className?: string }) {
  return (
    <span className={`shrink-0 rounded-full bg-[#ffedf7] text-[#e82e91] font-bold flex items-center justify-center ${className}`}>
      {iniciales(nombre, apellido)}
    </span>
  )
}

export default function Analisis() {
  const [sesiones, setSesiones] = useState<SesionRow[]>([])
  const [cargandoLista, setCargandoLista] = useState(true)
  const [errorLista, setErrorLista] = useState<string | null>(null)
  const [selId, setSelId] = useState<string | null>(null)
  const [abierto, setAbierto] = useState(false)

  const [detalle, setDetalle] = useState<SesionDetalle | null>(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null)
  const [ia, setIa] = useState<AnalisisIA | null>(null)
  const [cargandoIa, setCargandoIa] = useState(false)

  useEffect(() => {
    getSesiones()
      .then((data) => {
        setSesiones(data)
        setSelId(data[0]?.id ?? null)
      })
      .catch((err) => setErrorLista(err instanceof Error ? err.message : 'Error al cargar sesiones'))
      .finally(() => setCargandoLista(false))
  }, [])

  useEffect(() => {
    if (!selId) return
    let activo = true
    setDetalle(null)
    setIa(null)
    setErrorDetalle(null)
    setCargandoDetalle(true)
    setCargandoIa(true)

    getSesion(selId)
      .then((d) => { if (activo) setDetalle(d) })
      .catch((err) => { if (activo) setErrorDetalle(err instanceof Error ? err.message : 'No se pudo cargar la sesión') })
      .finally(() => { if (activo) setCargandoDetalle(false) })

    // El análisis generativo puede tardar: no bloquea el resto de la pantalla.
    getAnalisisIA(selId)
      .then((d) => { if (activo) setIa(d) })
      .catch(() => {})
      .finally(() => { if (activo) setCargandoIa(false) })

    return () => { activo = false }
  }, [selId])

  const sel = sesiones.find((s) => s.id === selId) ?? null

  const esUltima = useMemo(() => {
    if (!sel) return false
    return !sesiones.some((s) => s.juego === sel.juego && s.pacientes?.id === sel.pacientes?.id && s.iniciada_en > sel.iniciada_en)
  }, [sesiones, sel])

  const titulo = sel ? TITULO[sel.juego] ?? sel.juego : ''
  const nombrePaciente = sel?.pacientes?.nombre ?? 'el paciente'
  const fechaSel = sel ? formatFecha(sel.iniciada_en).replace(', ', ' · ') : ''

  if (cargandoLista) {
    return (
      <div className="max-w-[1082px] mx-auto space-y-5">
        <Esqueleto className="h-[54px] w-2/3" />
        <Esqueleto className="h-[72px]" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[0, 1, 2, 3].map((i) => <Esqueleto key={i} className="h-[150px]" />)}
        </div>
        <Esqueleto className="h-[294px]" />
      </div>
    )
  }

  return (
    <div className="max-w-[1082px] mx-auto">
      {errorLista && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-[14px] px-4 py-3 mb-6 text-sm font-semibold">
          {errorLista}
        </div>
      )}

      {!sel ? (
        <div className={`${CARD} p-10 text-center`}>
          <span className="material-symbols-rounded text-[48px] text-text-placeholder">bar_chart</span>
          <h1 className="text-[22px] font-bold text-[#1a1f6e] mt-3">Análisis de sesiones</h1>
          <p className="text-[#61698a] text-sm mt-1">Todavía no hay sesiones finalizadas para analizar.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Encabezado + selector de sesión */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-[26px] lg:text-[30px] leading-[1.2] font-bold text-[#1a1f6e]">Análisis del juego {titulo}</h1>
              <p className="text-[14px] text-[#61698a] mt-1.5">
                Resumen del progreso de {nombrePaciente} durante {esUltima ? 'su última sesión' : `su sesión del ${fechaSel}`} de {titulo}.
              </p>
              <Link to={`/sesiones/${sel.id}`} className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#3038b8] mt-2 hover:underline">
                Ver videos y detalle de la sesión
                <span className="material-symbols-rounded text-[16px]">arrow_forward</span>
              </Link>
            </div>

            <div className="relative w-full lg:w-[332px] shrink-0">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={abierto}
                onClick={() => setAbierto((o) => !o)}
                className="w-full h-[54px] bg-white border border-[#e0e3f5] rounded-[16px] px-3.5 flex items-center gap-3 text-left cursor-pointer"
              >
                <Avatar nombre={sel.pacientes?.nombre} apellido={sel.pacientes?.apellido} className="w-[34px] h-[34px] text-[11px]" />
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-semibold text-[#1a1f6e] truncate">
                    {sel.pacientes ? `${sel.pacientes.nombre} ${sel.pacientes.apellido}` : 'Sin paciente'}
                  </span>
                  <span className="block text-[11px] text-[#61698a]">{fechaSel}</span>
                </span>
                <span className={`material-symbols-rounded text-[20px] text-[#61698a] transition-transform ${abierto ? 'rotate-180' : ''}`}>expand_more</span>
              </button>

              {abierto && (
                <>
                  <button type="button" aria-label="Cerrar selector" className="fixed inset-0 z-10 cursor-default" onClick={() => setAbierto(false)} />
                  <ul role="listbox" className="absolute right-0 top-[60px] z-20 w-full max-h-[320px] overflow-y-auto bg-white border border-[#e0e3f5] rounded-[16px] shadow-[0_12px_32px_-12px_rgba(20,26,82,0.25)] py-1.5">
                    {sesiones.map((s) => (
                      <li key={s.id} role="option" aria-selected={s.id === selId}>
                        <button
                          type="button"
                          onClick={() => { setSelId(s.id); setAbierto(false) }}
                          className={`w-full px-3.5 py-2 flex items-center gap-3 text-left cursor-pointer hover:bg-[#f0f2ff] ${s.id === selId ? 'bg-[#f0f2ff]' : ''}`}
                        >
                          <Avatar nombre={s.pacientes?.nombre} apellido={s.pacientes?.apellido} className="w-[30px] h-[30px] text-[10px]" />
                          <span className="flex-1 min-w-0">
                            <span className="block text-[13px] font-semibold text-[#1a1f6e] truncate">
                              {s.pacientes ? `${s.pacientes.nombre} ${s.pacientes.apellido}` : 'Sin paciente'}
                            </span>
                            <span className="block text-[11px] text-[#61698a] truncate">
                              {TITULO[s.juego] ?? s.juego} · {formatFecha(s.iniciada_en).replace(', ', ' · ')}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          {errorDetalle && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-[14px] px-4 py-3 text-sm font-semibold">
              {errorDetalle}
            </div>
          )}

          <AnalisisSesion
            sel={sel}
            detalle={detalle}
            sesiones={sesiones}
            ia={ia}
            cargandoDetalle={cargandoDetalle}
            cargandoIa={cargandoIa}
          />
        </div>
      )}
    </div>
  )
}
