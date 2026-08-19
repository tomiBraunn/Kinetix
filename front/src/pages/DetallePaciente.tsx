import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import PacienteForm, { fromPaciente } from '../components/PacienteForm'
import {
  calcularEdad,
  formatearFecha,
  iniciales,
  nombreCompleto,
  type Paciente,
  type PacienteInput,
} from '../lib/pacientes'
import {
  getSesiones,
  type SesionRow,
  JUEGO_LABEL,
  JUEGO_ICON,
  resultadoPrincipal,
  formatFecha,
} from '../lib/sesiones'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
      <p className="text-text-label font-semibold">{value || '—'}</p>
    </div>
  )
}

const MAX_FOTO_BYTES = 5 * 1024 * 1024

function FotoPacienteCard({
  paciente,
  onUploaded,
}: {
  paciente: Paciente
  onUploaded: (avatar_url: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Solo se aceptan imágenes JPG o PNG.')
      return
    }
    if (file.size > MAX_FOTO_BYTES) {
      setError('La imagen no puede pesar más de 5MB.')
      return
    }

    setError(null)
    setSubiendo(true)
    try {
      const token = localStorage.getItem('kinetix_token')
      const formData = new FormData()
      formData.append('foto', file)
      const { url } = await api.post<{ url: string }>('/upload/paciente-foto', formData, { token })
      await api.put(`/pacientes/${paciente.id}`, { avatar_url: url }, { token })
      onUploaded(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la foto')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="bg-[#ffe0f3] border border-accent/40 rounded-[24px] p-6 flex flex-col items-center text-center shadow-[0_8px_24px_-8px_rgba(224,64,160,0.25)]">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={subiendo}
        className="w-40 h-40 rounded-full border-2 border-dashed border-accent flex items-center justify-center overflow-hidden bg-white/40 hover:bg-white/60 transition-colors disabled:opacity-60"
      >
        {paciente.avatar_url ? (
          <img
            src={paciente.avatar_url}
            alt={nombreCompleto(paciente)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="material-symbols-rounded text-[48px] text-accent">
            photo_camera
          </span>
        )}
      </button>

      <p className="text-primary font-bold mt-5">Subir foto del paciente</p>
      <p className="text-text-muted text-sm mt-1">JPG o PNG, hasta 5MB</p>

      {error && (
        <p className="text-rose-600 text-xs font-semibold mt-3">{error}</p>
      )}

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={subiendo}
        className="inline-flex items-center gap-2 rounded-[12px] bg-accent text-white text-sm font-bold px-6 py-3 mt-6 hover:bg-[#C83890] transition-colors shadow-[0_6px_12px_-2px_rgba(255,59,146,0.3)] disabled:opacity-70"
      >
        <span className="material-symbols-rounded text-[18px]">
          {subiendo ? 'progress_activity' : 'upload'}
        </span>
        {subiendo ? 'Subiendo…' : 'Seleccionar archivo'}
      </button>
    </div>
  )
}

export default function DetallePaciente() {
  const { id } = useParams<{ id: string }>()
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [sesiones, setSesiones] = useState<SesionRow[]>([])
  const [loadingSesiones, setLoadingSesiones] = useState(true)

  useEffect(() => {
    let active = true
    api
      .get<Paciente>(`/pacientes/${id}`, { token: localStorage.getItem('kinetix_token') })
      .then((data) => {
        if (!active) return
        setPaciente(data)
      })
      .catch((err) => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'No se pudo cargar el paciente')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [id])

  useEffect(() => {
    if (!id) return
    getSesiones(id)
      .then(setSesiones)
      .catch(() => {})
      .finally(() => setLoadingSesiones(false))
  }, [id])

  async function handleGuardar(input: PacienteInput) {
    setGuardando(true)
    setSaveError(null)
    try {
      const actualizado = await api.put<Paciente>(`/pacientes/${id}`, input, {
        token: localStorage.getItem('kinetix_token'),
      })
      setPaciente(actualizado)
      setEditando(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'No se pudieron guardar los cambios')
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-[72px] rounded-[18px] bg-white/70 animate-pulse" />
        <div className="h-[200px] rounded-[18px] bg-white/70 animate-pulse" />
      </div>
    )
  }

  if (error || !paciente) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <span className="material-symbols-rounded text-[48px] text-rose-400">error</span>
        <h1 className="text-xl font-black text-primary mt-4">Paciente no encontrado</h1>
        <p className="text-text-muted font-medium mt-1">{error ?? 'Ese paciente no existe o no te pertenece.'}</p>
        <Link
          to="/pacientes"
          className="inline-flex items-center gap-2 rounded-full bg-accent text-white text-sm font-bold px-6 py-3 mt-6 hover:bg-[#C83890]"
        >
          <span className="material-symbols-rounded text-[18px]">arrow_back</span>
          Volver a pacientes
        </Link>
      </div>
    )
  }

  const edad = calcularEdad(paciente.fecha_nacimiento)

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to="/pacientes"
        className="inline-flex items-center gap-1 text-text-muted text-sm font-bold hover:text-accent mb-6"
      >
        <span className="material-symbols-rounded text-[18px]">arrow_back</span>
        Volver a pacientes
      </Link>

      <div className="bg-white rounded-[18px] shadow-[0_6px_24px_-12px_rgba(43,49,156,0.15)] p-6 lg:p-8 mb-6 flex flex-col sm:flex-row sm:items-center gap-5">
        {paciente.avatar_url ? (
          <img
            src={paciente.avatar_url}
            alt={nombreCompleto(paciente)}
            className="w-16 h-16 rounded-full object-cover border-2 border-accent/30"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary text-white text-xl font-black flex items-center justify-center">
            {iniciales(paciente)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-primary truncate">{nombreCompleto(paciente)}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            {edad !== null && (
              <span className="inline-flex rounded-full bg-bg-input text-primary text-xs font-bold px-3 py-1">
                {edad} años
              </span>
            )}
            {paciente.tipo_lesion && (
              <span className="inline-flex rounded-full bg-violet-50 text-primary text-xs font-bold px-3 py-1">
                {paciente.tipo_lesion}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setEditando((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full border border-accent/40 text-accent text-sm font-bold px-5 py-2.5 hover:bg-accent hover:text-white transition-colors"
          >
            <span className="material-symbols-rounded text-[18px]">edit</span>
            {editando ? 'Ver perfil' : 'Editar'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {editando ? (
            <PacienteForm
              initial={fromPaciente(paciente)}
              submitLabel="Guardar cambios"
              onSubmit={handleGuardar}
              loading={guardando}
              error={saveError}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-[18px] shadow-[0_6px_24px_-12px_rgba(43,49,156,0.15)] p-6 space-y-4 md:col-span-2">
                <h2 className="text-primary font-black text-lg">Información personal</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nombre completo" value={nombreCompleto(paciente)} />
                  {edad !== null && <Field label="Edad" value={`${edad} años`} />}
                  <Field label="Fecha de nacimiento" value={formatearFecha(paciente.fecha_nacimiento)} />
                  <Field label="DNI" value={paciente.dni ?? ''} />
                  <Field label="Mail" value={paciente.email_paciente ?? ''} />
                  <Field label="Teléfono" value={paciente.telefono ?? ''} />
                  <Field label="Género" value={paciente.genero ?? ''} />
                </div>
              </div>

              <div className="bg-white rounded-[18px] shadow-[0_6px_24px_-12px_rgba(43,49,156,0.15)] p-6 space-y-4">
                <h2 className="text-primary font-black text-lg">Contacto de emergencia</h2>
                <Field label="Nombre y apellido" value={paciente.contacto_emergencia_nombre ?? ''} />
                <Field label="Teléfono" value={paciente.contacto_emergencia_telefono ?? ''} />
              </div>

              <div className="bg-white rounded-[18px] shadow-[0_6px_24px_-12px_rgba(43,49,156,0.15)] p-6 space-y-4">
                <h2 className="text-primary font-black text-lg">Rehabilitación</h2>
                <Field label="Motivo (lesión)" value={paciente.tipo_lesion ?? ''} />
                <Field
                  label="Inicio de la rehabilitación"
                  value={formatearFecha(paciente.fecha_inicio_rehabilitacion)}
                />
                <div>
                  <p className="text-text-muted text-xs font-bold uppercase tracking-wide mb-1">
                    Observaciones médicas
                  </p>
                  <p className="text-text-label font-semibold whitespace-pre-line">
                    {paciente.observaciones || '—'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <FotoPacienteCard
          paciente={paciente}
          onUploaded={(avatar_url) =>
            setPaciente((prev) => (prev ? { ...prev, avatar_url } : prev))
          }
        />
      </div>

      {/* Historial de sesiones */}
      <div className="mt-6 bg-white rounded-[18px] shadow-[0_6px_24px_-12px_rgba(43,49,156,0.15)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-primary font-black text-lg">Historial de sesiones</h2>
        </div>

        {loadingSesiones ? (
          <div className="p-6 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 rounded-[12px] bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : sesiones.length === 0 ? (
          <div className="p-10 text-center">
            <span className="material-symbols-rounded text-[40px] text-text-placeholder">sports_gymnastics</span>
            <p className="text-text-muted font-semibold mt-3 text-sm">
              Todavía no hay sesiones registradas para este paciente.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {sesiones.map((s) => (
              <li key={s.id} className="flex items-center gap-4 px-6 py-4">
                <span className="w-9 h-9 rounded-[10px] bg-violet-50 text-primary flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-rounded text-[18px]">{JUEGO_ICON[s.juego] ?? 'sports_esports'}</span>
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-text-label font-bold text-sm">{JUEGO_LABEL[s.juego] ?? s.juego}</p>
                  <p className="text-text-muted text-xs font-medium">{formatFecha(s.iniciada_en)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-primary font-black text-sm">{resultadoPrincipal(s)}</p>
                  {s.duracion_segundos != null && (
                    <p className="text-text-muted text-xs font-medium">{s.duracion_segundos}s</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}