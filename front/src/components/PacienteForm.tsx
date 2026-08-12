import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { inputBase } from './auth/Field'
import type { PacienteInput } from '../lib/pacientes'

export type PacienteFormValues = {
  nombre: string
  apellido: string
  fecha_nacimiento: string
  tipo_lesion: string
  observaciones: string
  dni: string
  email_paciente: string
  telefono: string
  genero: string
  contacto_emergencia_nombre: string
  contacto_emergencia_telefono: string
  fecha_inicio_rehabilitacion: string
}

export const PACIENTE_EMPTY: PacienteFormValues = {
  nombre: '',
  apellido: '',
  fecha_nacimiento: '',
  tipo_lesion: '',
  observaciones: '',
  dni: '',
  email_paciente: '',
  telefono: '',
  genero: '',
  contacto_emergencia_nombre: '',
  contacto_emergencia_telefono: '',
  fecha_inicio_rehabilitacion: '',
}

export function toPacienteInput(v: PacienteFormValues): PacienteInput {
  return {
    nombre: v.nombre,
    apellido: v.apellido,
    fecha_nacimiento: v.fecha_nacimiento || null,
    tipo_lesion: v.tipo_lesion || null,
    observaciones: v.observaciones || null,
    dni: v.dni || null,
    email_paciente: v.email_paciente || null,
    telefono: v.telefono || null,
    genero: v.genero || null,
    contacto_emergencia_nombre: v.contacto_emergencia_nombre || null,
    contacto_emergencia_telefono: v.contacto_emergencia_telefono || null,
    fecha_inicio_rehabilitacion: v.fecha_inicio_rehabilitacion || null,
  }
}

export function fromPaciente(p: {
  nombre: string
  apellido: string
  fecha_nacimiento?: string | null
  tipo_lesion?: string | null
  observaciones?: string | null
  dni?: string | null
  email_paciente?: string | null
  telefono?: string | null
  genero?: string | null
  contacto_emergencia_nombre?: string | null
  contacto_emergencia_telefono?: string | null
  fecha_inicio_rehabilitacion?: string | null
}): PacienteFormValues {
  return {
    nombre: p.nombre ?? '',
    apellido: p.apellido ?? '',
    fecha_nacimiento: p.fecha_nacimiento ?? '',
    tipo_lesion: p.tipo_lesion ?? '',
    observaciones: p.observaciones ?? '',
    dni: p.dni ?? '',
    email_paciente: p.email_paciente ?? '',
    telefono: p.telefono ?? '',
    genero: p.genero ?? '',
    contacto_emergencia_nombre: p.contacto_emergencia_nombre ?? '',
    contacto_emergencia_telefono: p.contacto_emergencia_telefono ?? '',
    fecha_inicio_rehabilitacion: p.fecha_inicio_rehabilitacion ?? '',
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[18px] shadow-[0_6px_24px_-12px_rgba(43,49,156,0.15)] p-6 lg:p-8">
      <h2 className="text-primary font-black text-lg mb-6">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">{children}</div>
    </div>
  )
}

function InputLabeled({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-text-label text-sm font-bold">
        {label}
        {required && <span className="text-accent"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={inputBase + ' h-[48px]'}
      />
    </label>
  )
}

function SelectLabeled({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-text-label text-sm font-bold">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputBase + ' h-[48px] appearance-none cursor-pointer'}
      >
        <option value="">Seleccionar…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function PacienteForm({
  initial,
  submitLabel,
  onSubmit,
  loading,
  error,
}: {
  initial?: PacienteFormValues
  submitLabel: string
  onSubmit: (input: PacienteInput) => Promise<void>
  loading: boolean
  error: string | null
}) {
  const [values, setValues] = useState<PacienteFormValues>(initial ?? PACIENTE_EMPTY)
  const navigate = useNavigate()

  function set<K extends keyof PacienteFormValues>(key: K, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await onSubmit(toPacienteInput(values))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Información personal">
        <InputLabeled label="Nombre" value={values.nombre} onChange={(v) => set('nombre', v)} required />
        <InputLabeled label="Apellido" value={values.apellido} onChange={(v) => set('apellido', v)} required />
        <InputLabeled
          label="Fecha de nacimiento"
          type="date"
          value={values.fecha_nacimiento}
          onChange={(v) => set('fecha_nacimiento', v)}
        />
        <SelectLabeled
          label="Género"
          value={values.genero}
          onChange={(v) => set('genero', v)}
          options={[
            { value: 'F', label: 'Femenino' },
            { value: 'M', label: 'Masculino' },
            { value: 'X', label: 'Otro / Prefiere no decir' },
          ]}
        />
        <InputLabeled label="DNI" value={values.dni} onChange={(v) => set('dni', v)} />
        <InputLabeled
          label="Mail"
          type="email"
          placeholder="paciente@mail.com"
          value={values.email_paciente}
          onChange={(v) => set('email_paciente', v)}
        />
        <InputLabeled
          label="Teléfono"
          placeholder="+54 9 11 1234 5678"
          value={values.telefono}
          onChange={(v) => set('telefono', v)}
        />
      </Section>

      <Section title="Contacto de emergencia">
        <InputLabeled
          label="Nombre y apellido"
          value={values.contacto_emergencia_nombre}
          onChange={(v) => set('contacto_emergencia_nombre', v)}
        />
        <InputLabeled
          label="Teléfono"
          placeholder="+54 9 11 1234 5678"
          value={values.contacto_emergencia_telefono}
          onChange={(v) => set('contacto_emergencia_telefono', v)}
        />
      </Section>

      <Section title="Detalles de rehabilitación">
        <InputLabeled
          label="Motivo de rehabilitación (lesión)"
          placeholder="Ej: Lesión de rodilla"
          value={values.tipo_lesion}
          onChange={(v) => set('tipo_lesion', v)}
        />
        <InputLabeled
          label="Fecha de inicio de rehabilitación"
          type="date"
          value={values.fecha_inicio_rehabilitacion}
          onChange={(v) => set('fecha_inicio_rehabilitacion', v)}
        />
        <div className="sm:col-span-2">
          <label className="flex flex-col gap-2">
            <span className="text-text-label text-sm font-bold">Observaciones médicas</span>
            <textarea
              value={values.observaciones}
              onChange={(e) => set('observaciones', e.target.value)}
              placeholder="Antecedentes, indicaciones, progreso esperado…"
              rows={4}
              className="w-full bg-bg-input rounded-[20px] px-5 py-4 text-[15px] font-medium text-text-label placeholder:text-text-placeholder outline-none transition-[box-shadow,background-color] duration-200 focus:bg-white focus:ring-2 focus:ring-accent/40 resize-none"
            />
          </label>
        </div>
      </Section>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-[14px] px-4 py-3 text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-full bg-accent text-white font-black h-[52px] hover:bg-[#C83890] transition-colors shadow-[0_12px_24px_-12px_rgba(224,64,160,0.6)] disabled:opacity-80 disabled:cursor-not-allowed"
        >
          {loading ? 'Guardando…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="sm:w-auto rounded-full border border-text-label/25 text-text-label font-bold h-[52px] px-8 hover:bg-bg-input/60 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}