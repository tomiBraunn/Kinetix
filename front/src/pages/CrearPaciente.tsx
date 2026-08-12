import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import PacienteForm from '../components/PacienteForm'
import type { PacienteInput } from '../lib/pacientes'

export default function CrearPaciente() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(input: PacienteInput) {
    setLoading(true)
    setError(null)
    try {
      const creado = await api.post('/pacientes', input, {
        token: localStorage.getItem('kinetix_token'),
      })
      navigate(`/pacientes/${creado.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el paciente')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-black text-primary">Agendar nuevo paciente</h1>
        <p className="text-text-muted font-medium mt-1">
          Completá los datos del paciente para comenzar su rehabilitación.
        </p>
      </div>
      <PacienteForm
        submitLabel="Agendar nuevo paciente"
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      />
    </div>
  )
}