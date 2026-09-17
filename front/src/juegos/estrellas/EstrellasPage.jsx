import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PhaserGameEstrellas from './PhaserGameEstrellas'
import { usePoseAI } from '../../ia/usePoseAI'
import { crearSesion, finalizarSesion } from '../../lib/sesiones.ts'

const HEADER_H = 52

const INSTRUCCIONES = [
  { num: 1, texto: 'Párate frente a la cámara con los brazos a los lados' },
  { num: 2, texto: '¡Estirá los brazos y tocá las estrellas!' },
]

const pillStyle = {
  background: 'rgba(255,255,255,0.92)',
  borderRadius: 20,
  padding: '6px 14px',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 14,
  fontWeight: 700,
  color: '#1a1a2e',
  boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
  backdropFilter: 'blur(6px)',
  fontFamily: 'system-ui, sans-serif',
  whiteSpace: 'nowrap',
}

export default function EstrellasPage() {
  const navigate    = useNavigate()
  const [params]    = useSearchParams()
  const pacienteId  = params.get('pacienteId')
  const sesionIdRef = useRef(null)

  const [puntos,          setPuntos]          = useState(0)
  const [tiempoRestante,  setTiempoRestante]  = useState(60)
  const [movimientos,     setMovimientos]     = useState(0)
  const [pausado,         setPausado]         = useState(false)
  const [instruccion,     setInstruccion]     = useState(0)
  const [feedbackKey,     setFeedbackKey]     = useState(0)
  const [mostrarFeedback, setMostrarFeedback] = useState(false)

  const camaraCanvasRef = usePoseAI('estrellas', !pausado, HEADER_H)

  // Sesión (solo si viene con paciente)
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

  // Sincroniza HUD
  useEffect(() => {
    const handler = (e) => {
      const { puntos, tiempoRestante, movimientos } = e.detail
      setPuntos(puntos)
      setTiempoRestante(tiempoRestante)
      setMovimientos(movimientos)
      if (puntos >= 1) setInstruccion(s => Math.max(s, 1))
    }
    window.addEventListener('kinetix:estrellas', handler)
    return () => window.removeEventListener('kinetix:estrellas', handler)
  }, [])

  // Flash "¡Estrella!" al tocar
  useEffect(() => {
    const handler = () => {
      setMostrarFeedback(true)
      setFeedbackKey(k => k + 1)
      const t = setTimeout(() => setMostrarFeedback(false), 900)
      return () => clearTimeout(t)
    }
    window.addEventListener('kinetix:estrellas:punto', handler)
    return () => window.removeEventListener('kinetix:estrellas:punto', handler)
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

  const instruccionActual = instruccion < INSTRUCCIONES.length ? INSTRUCCIONES[instruccion] : null

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>

      {/* Header compacto (más angosto para mobile) */}
      <header style={{
        height: HEADER_H,
        background: '#dde3f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        flexShrink: 0,
        zIndex: 30,
        boxShadow: '0 1px 6px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 900, fontSize: 20, background: 'linear-gradient(135deg, #e91e8c, #c2185b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>K</span>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#1a237e' }}>inetix</span>
          <span style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>— Estrellas</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={togglePausa}
            style={{ background: 'linear-gradient(135deg, #e91e8c, #b01060)', color: '#fff', border: 'none', borderRadius: 18, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            {pausado ? '▶' : '⏸'}
          </button>
          <button
            onClick={() => navigate('/juego')}
            style={{ background: '#1a237e', color: '#fff', border: 'none', borderRadius: 18, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            ↩
          </button>
        </div>
      </header>

      {/* Área de juego */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/* HUD pills — fila compacta arriba */}
        <div style={{
          position: 'absolute', top: 10, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', gap: 8,
          zIndex: 20, pointerEvents: 'none', flexWrap: 'nowrap',
        }}>
          <div style={pillStyle}><span>⭐</span><span>{puntos}</span></div>
          <div style={pillStyle}><span>⏱</span><span>{formatTiempo(tiempoRestante)}</span></div>
          <div style={{ ...pillStyle, color: movimientos > 5 ? '#b91c1c' : '#1a1a2e' }}>
            <span>🚶</span><span>{movimientos}</span>
          </div>
        </div>

        {/* Banner instrucción */}
        {instruccionActual && (
          <div style={{ position: 'absolute', top: 54, left: 12, right: 12, zIndex: 20, pointerEvents: 'none', display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: 'rgba(255,255,255,0.93)', borderRadius: 24, padding: '9px 16px 9px 10px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 3px 14px rgba(0,0,0,0.14)', maxWidth: '100%' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#1a237e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                {instruccionActual.num}
              </div>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#1a237e' }}>{instruccionActual.texto}</span>
            </div>
          </div>
        )}

        {/* Flash de estrella tocada */}
        {mostrarFeedback && (
          <div
            key={feedbackKey}
            style={{
              position: 'absolute', top: '22%', left: 0, right: 0,
              textAlign: 'center', zIndex: 20, pointerEvents: 'none',
              fontSize: 44, fontWeight: 900,
              color: '#facc15', textShadow: '0 2px 16px rgba(0,0,0,0.35)',
              animation: 'estrellaUp 0.9s ease-out forwards',
            }}
          >
            ⭐ ¡Bien!
          </div>
        )}

        <PhaserGameEstrellas headerHeight={HEADER_H} />

        {/* Vista de la cámara + esqueleto detectado por MediaPipe, en vivo */}
        <canvas
          ref={camaraCanvasRef}
          width={180}
          height={135}
          style={{
            position: 'absolute', bottom: 14, right: 14, zIndex: 20,
            borderRadius: 12, border: '2px solid rgba(255,255,255,0.85)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
          }}
        />
      </div>

      <style>{`
        @keyframes estrellaUp {
          0%   { opacity: 1; transform: translateY(0) scale(1); }
          20%  { opacity: 1; transform: translateY(-10px) scale(1.1); }
          100% { opacity: 0; transform: translateY(-50px) scale(0.9); }
        }
      `}</style>
    </div>
  )
}
