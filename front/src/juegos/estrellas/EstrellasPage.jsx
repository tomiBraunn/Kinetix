import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PhaserGameEstrellas from './PhaserGameEstrellas'
import { usePoseAI } from '../../ia/usePoseAI'
import { crearSesion, finalizarSesion } from '../../lib/sesiones.ts'

export default function EstrellasPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const pacienteId = params.get('pacienteId')
  const sesionIdRef = useRef(null)

  usePoseAI('estrellas')

  useEffect(() => {
    if (!pacienteId) return
    crearSesion(pacienteId, 'estrellas')
      .then(s => { sesionIdRef.current = s.id })
      .catch(console.warn)
  }, [pacienteId])

  useEffect(() => {
    const handler = (e) => {
      if (!sesionIdRef.current) return
      finalizarSesion(sesionIdRef.current, { juego: 'estrellas', ...e.detail }).catch(console.warn)
    }
    window.addEventListener('kinetix:estrellas:fin', handler)
    return () => window.removeEventListener('kinetix:estrellas:fin', handler)
  }, [])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <button
        onClick={() => navigate('/juego')}
        style={{
          position: 'absolute', top: 16, left: 16, zIndex: 10,
          background: 'rgba(0,0,0,0.5)', color: '#fff',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 14,
        }}
      >
        ← Volver
      </button>
      <PhaserGameEstrellas />
    </div>
  )
}
