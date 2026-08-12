import { useEffect, useState } from 'react'
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
      <p className="text-text-label font-semibold">{value || '—'}</p>
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
    return () => {
      active = false
    }
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
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold rounded-full px-3 py-1 ${
                paciente.activo ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-text-muted'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${paciente.activo ? 'bg-emerald-500' : 'bg-slate-400'}`}
              />
              {paciente.activo ? 'Activo' : 'Inactivo'}
            </span>
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
          <Link
            to={`/juego?pacienteId=${paciente.id}`}
            className="inline-flex items-center gap-2 rounded-full bg-accent text-white text-sm font-bold px-5 py-2.5 hover:bg-[#C83890] transition-colors shadow-[0_12px_24px_-12px_rgba(224,64,160,0.6)]"
          >
            <span className="material-symbols-rounded text-[18px]">play_circle</span>
            Iniciar juego
          </Link>
        </div>
      </div>

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
          <div className="bg-white rounded-[18px] shadow-[0_6px_24px_-12px_rgba(43,49,156,0.15)] p-6 space-y-4">
            <h2 className="text-primary font-black text-lg">Información personal</h2>
            <Field label="Nombre completo" value={nombreCompleto(paciente)} />
            {edad !== null && <Field label="Edad" value={`${edad} años`} />}
            <Field label="Fecha de nacimiento" value={formatearFecha(paciente.fecha_nacimiento)} />
            <Field label="DNI" value={paciente.dni ?? ''} />
            <Field label="Mail" value={paciente.email_paciente ?? ''} />
            <Field label="Teléfono" value={paciente.telefono ?? ''} />
            <Field label="Género" value={paciente.genero ?? ''} />
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-[18px] shadow-[0_6px_24px_-12px_rgba(43,49,156,0.15)] p-6 space-y-4">
              <h2 className="font-primary font-black text-lg">Contacto de emergencia</h2>
              <Field label="Nombre y apellido" value={paciente.contacto_emergencia_nombre ?? ''} />
              <Field label="Teléfono" value={paciente.contacto_emergencia_telefono ?? ''} />
            </div>

            <div className="bg-white rounded-[18px] shadow-[0_6px_24px_-12px_rgba(43,49,156,0.15)] p-6 space-y-4">
              <h2 className="font-primary font-black text-lg">Rehabilitación</h2>
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
        </div>
      )}
    </div>
  )
}