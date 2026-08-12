import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PhaserGame from './PhaserGame'
import { usePoseAI } from '../../ia/usePoseAI'
import { crearSesion, finalizarSesion } from '../../lib/sesiones.ts'

const HEADER_H = 58

const INSTRUCCIONES = [
  { num: 1, texto: 'Parate sobre la tabla de surf' },
  { num: 2, texto: 'Tocá los peces con tus manos.' },
]

const pillStyle = {
  background: 'rgba(255,255,255,0.92)',
  borderRadius: 22,
  padding: '7px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  fontSize: 15,
  fontWeight: 600,
  color: '#1a1a2e',
  boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
  backdropFilter: 'blur(6px)',
  fontFamily: 'system-ui, sans-serif',
}

export default function GamePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const pacienteId = params.get('pacienteId')
  const sesionIdRef = useRef(null)

  const [puntos, setPuntos] = useState(0)
  const [tiempo, setTiempo] = useState(60)
  const [pausado, setPausado] = useState(false)
  const [instruccion, setInstruccion] = useState(0)
  const [feedbackKey, setFeedbackKey] = useState(0)
  const [mostrarFeedback, setMostrarFeedback] = useState(false)

  // Arranca MediaPipe Pose; se pausa cuando el juego está pausado
  usePoseAI('surf', !pausado)

  // Crea sesión al montar (solo si hay paciente seleccionado)
  useEffect(() => {
    if (!pacienteId) return
    crearSesion(pacienteId, 'surf')
      .then(s => { sesionIdRef.current = s.id })
      .catch(console.warn)
  }, [pacienteId])

  // Guarda resultados al terminar el juego
  useEffect(() => {
    const handler = (e) => {
      if (!sesionIdRef.current) return
      finalizarSesion(sesionIdRef.current, { juego: 'surf', ...e.detail }).catch(console.warn)
    }
    window.addEventListener('kinetix:surf:fin', handler)
    return () => window.removeEventListener('kinetix:surf:fin', handler)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      const { puntos, tiempoRestante, instruccionActual } = e.detail
      setPuntos(puntos)
      setTiempo(tiempoRestante)
      if (instruccionActual !== undefined) setInstruccion(instruccionActual)
    }
    window.addEventListener('kinetix:surf', handler)
    return () => window.removeEventListener('kinetix:surf', handler)
  }, [])

  useEffect(() => {
    const handler = () => {
      setMostrarFeedback(true)
      setFeedbackKey(k => k + 1)
      const t = setTimeout(() => setMostrarFeedback(false), 1300)
      return () => clearTimeout(t)
    }
    window.addEventListener('kinetix:surf:punto', handler)
    return () => window.removeEventListener('kinetix:surf:punto', handler)
  }, [])

  const togglePausa = useCallback(() => {
    if (pausado) window.kinetix?.reanudar?.()
    else window.kinetix?.pausar?.()
    setPausado(p => !p)
  }, [pausado])

  const formatTiempo = (seg) => {
    const m = Math.floor(seg / 60).toString().padStart(2, '0')
    const s = (seg % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const instruccionActual = instruccion < 2 ? INSTRUCCIONES[instruccion] : null

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>

      {/* Header */}
      <header style={{
        height: HEADER_H,
        background: '#dde3f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
        zIndex: 30,
        boxShadow: '0 1px 6px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: '#1a237e', padding: '4px 6px', lineHeight: 1 }}>
            ☰
          </button>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontWeight: 900, fontSize: 22, background: 'linear-gradient(135deg, #e91e8c, #c2185b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: -0.5 }}>K</span>
            <span style={{ fontWeight: 800, fontSize: 20, color: '#1a237e', letterSpacing: -0.5 }}>inetix</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={togglePausa} style={{ background: 'linear-gradient(135deg, #e91e8c, #b01060)', color: '#fff', border: 'none', borderRadius: 22, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {pausado ? '▶ Reanudar' : 'Pausar ⏸'}
          </button>
          <button onClick={() => navigate('/juego')} style={{ background: '#1a237e', color: '#fff', border: 'none', borderRadius: 22, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Salir ↩
          </button>
        </div>
      </header>

      {/* Área de juego */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/* HUD pills */}
        <div style={{ position: 'absolute', top: 14, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 10, zIndex: 20, pointerEvents: 'none' }}>
          <div style={pillStyle}><span>🐟</span><span>Peces: {puntos}</span></div>
          <div style={pillStyle}><span>⏱</span><span>Tiempo: {formatTiempo(tiempo)}</span></div>
        </div>

        {/* Banner instrucción */}
        {instruccionActual && (
          <div style={{ position: 'absolute', top: 62, left: 16, right: 16, zIndex: 20, pointerEvents: 'none', display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: 'rgba(255,255,255,0.93)', borderRadius: 28, padding: '11px 20px 11px 12px', display: 'flex', alignItems: 'center', gap: 13, boxShadow: '0 3px 18px rgba(0,0,0,0.14)', maxWidth: 420 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#1a237e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                {instruccionActual.num}
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1a237e' }}>{instruccionActual.texto}</span>
            </div>
          </div>
        )}

        {/* ¡Muy bien! */}
        {mostrarFeedback && (
          <div key={feedbackKey} style={{ position: 'absolute', top: '25%', left: 0, right: 0, textAlign: 'center', zIndex: 20, pointerEvents: 'none', fontSize: 40, fontWeight: 900, color: '#2e7d32', textShadow: '0 2px 12px rgba(0,0,0,0.25)', animation: 'feedbackUp 1.3s ease-out forwards' }}>
            ¡Muy bien!
          </div>
        )}

        <PhaserGame headerHeight={HEADER_H} />
      </div>

      <style>{`
        @keyframes feedbackUp {
          0%   { opacity: 1; transform: translateY(0) scale(1); }
          20%  { opacity: 1; transform: translateY(-8px) scale(1.08); }
          100% { opacity: 0; transform: translateY(-40px) scale(0.95); }
        }
      `}</style>
    </div>
  )
}
