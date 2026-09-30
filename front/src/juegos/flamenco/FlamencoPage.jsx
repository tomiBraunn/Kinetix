import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PhaserGameFlamenco from './PhaserGameFlamenco'
import { usePoseAI } from '../../ia/usePoseAI'
import { useSessionRecorder } from '../../ia/useSessionRecorder'
import { crearSesion, finalizarSesion, subirVideosSesion, mandarEventosSesion } from '../../lib/sesiones.ts'

const HEADER_H = 58

const INSTRUCCIONES = [
  { num: 1, texto: 'Párate frente a la cámara y esperá que te detecte' },
  { num: 2, texto: 'Levantá una pierna y mantené el equilibrio' },
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

export default function FlamencoPage() {
  const navigate    = useNavigate()
  const [params]    = useSearchParams()
  const pacienteId  = params.get('pacienteId')
  const sesionIdRef = useRef(null)
  const phaserRef   = useRef(null)
  const eventosRef  = useRef([])
  const intentosPrevRef = useRef(0)
  const recorder = useSessionRecorder()

  const [tiempoRestante, setTiempoRestante] = useState(60)
  const [timerActual,    setTimerActual]    = useState(0)
  const [mejorTiempo,    setMejorTiempo]    = useState(0)
  const [intentos,       setIntentos]       = useState(0)
  const [piernaArriba,   setPiernaArriba]   = useState(false)
  const [pausado,        setPausado]        = useState(false)
  const [instruccion,    setInstruccion]    = useState(0)

  const camaraCanvasRef = usePoseAI('flamenco', !pausado, HEADER_H)

  // Sesión (solo si viene con paciente) + arranca la grabación de los 3 videos
  useEffect(() => {
    if (!pacienteId) return
    crearSesion(pacienteId, 'flamenco')
      .then(s => {
        sesionIdRef.current = s.id
        // pequeño margen para que el canvas de landmarks y el canvas de
        // Phaser ya existan (ambos se crean en el mismo montaje inicial).
        setTimeout(() => {
          recorder.start({
            landmarksCanvas: camaraCanvasRef.current,
            gameCanvas: phaserRef.current?.getGameCanvas(),
          })
        }, 500)
      })
      .catch(console.warn)
  }, [pacienteId])

  useEffect(() => {
    const handler = async (e) => {
      if (!sesionIdRef.current) return
      const sesionId = sesionIdRef.current
      finalizarSesion(sesionId, { juego: 'flamenco', ...e.detail }).catch(console.warn)

      eventosRef.current.push({ tipo: 'fin_juego', datos: e.detail })
      const videos = await recorder.stop()
      subirVideosSesion(sesionId, videos).catch(console.warn)
      mandarEventosSesion(sesionId, eventosRef.current).catch(console.warn)

      // Deja ver un instante la pantalla de "¡Tiempo!" del juego y despues
      // lleva al resultado. La subida de video/eventos sigue en curso arriba
      // (no se espera), el resultado ya sabe mostrar "no disponible" mientras.
      setTimeout(() => navigate(`/sesiones/${sesionId}`), 1800)
    }
    window.addEventListener('kinetix:flamenco:fin', handler)
    return () => window.removeEventListener('kinetix:flamenco:fin', handler)
  }, [])

  // Sincroniza HUD con estado del juego + acumula "repeticion" por cada intento
  useEffect(() => {
    const handler = (e) => {
      const { tiempoRestante, timerActual, mejorTiempo, intentos } = e.detail
      setTiempoRestante(tiempoRestante)
      setTimerActual(timerActual)
      setMejorTiempo(mejorTiempo)
      setIntentos(intentos)
      if (intentos > intentosPrevRef.current) {
        eventosRef.current.push({ tipo: 'repeticion', datos: { numero: intentos } })
        intentosPrevRef.current = intentos
      }
    }
    window.addEventListener('kinetix:flamenco', handler)
    return () => window.removeEventListener('kinetix:flamenco', handler)
  }, [])

  // Feedback cuando la pierna sube/baja
  useEffect(() => {
    const handler = (e) => {
      setPiernaArriba(e.detail.levantada)
      if (e.detail.levantada) {
        setInstruccion(s => Math.max(s, 1))
        eventosRef.current.push({ tipo: 'mensaje', mensaje: '¡Mantené el equilibrio!' })
      }
    }
    window.addEventListener('kinetix:flamenco:pierna', handler)
    return () => window.removeEventListener('kinetix:flamenco:pierna', handler)
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
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontWeight: 900, fontSize: 22, background: 'linear-gradient(135deg, #e91e8c, #c2185b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: -0.5 }}>K</span>
            <span style={{ fontWeight: 800, fontSize: 20, color: '#1a237e', letterSpacing: -0.5 }}>inetix</span>
          </div>
          <span style={{ fontSize: 13, color: '#555', fontWeight: 600, marginLeft: 4 }}>— Flamenco Challenge</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={togglePausa}
            style={{ background: 'linear-gradient(135deg, #e91e8c, #b01060)', color: '#fff', border: 'none', borderRadius: 22, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            {pausado ? '▶ Reanudar' : 'Pausar ⏸'}
          </button>
          <button
            onClick={() => navigate('/juego')}
            style={{ background: '#1a237e', color: '#fff', border: 'none', borderRadius: 22, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            Salir ↩
          </button>
        </div>
      </header>

      {/* Área de juego */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/* HUD pills */}
        <div style={{ position: 'absolute', top: 14, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 10, zIndex: 20, pointerEvents: 'none' }}>
          <div style={pillStyle}>
            <span>⏱</span>
            <span>{formatTiempo(tiempoRestante)}</span>
          </div>
          <div style={{
            ...pillStyle,
            background: piernaArriba ? 'rgba(34,197,94,0.92)' : 'rgba(255,255,255,0.92)',
            color: piernaArriba ? '#052e16' : '#1a1a2e',
            transition: 'background 0.3s, color 0.3s',
          }}>
            <span>🦵</span>
            <span>{piernaArriba ? `${timerActual.toFixed(1)}s` : 'Levantá la pierna'}</span>
          </div>
          <div style={pillStyle}>
            <span>🏆</span>
            <span>Mejor: {mejorTiempo.toFixed(1)}s</span>
          </div>
          <div style={pillStyle}>
            <span>🔄</span>
            <span>Intentos: {intentos}</span>
          </div>
        </div>

        {/* Banner instrucción */}
        {instruccionActual && (
          <div style={{ position: 'absolute', top: 62, left: 16, right: 16, zIndex: 20, pointerEvents: 'none', display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: 'rgba(255,255,255,0.93)', borderRadius: 28, padding: '11px 20px 11px 12px', display: 'flex', alignItems: 'center', gap: 13, boxShadow: '0 3px 18px rgba(0,0,0,0.14)', maxWidth: 440 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#1a237e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                {instruccionActual.num}
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1a237e' }}>{instruccionActual.texto}</span>
            </div>
          </div>
        )}

        {/* Feedback cuando la pierna está arriba */}
        {piernaArriba && (
          <div style={{
            position: 'absolute', top: '28%', left: 0, right: 0,
            textAlign: 'center', zIndex: 20, pointerEvents: 'none',
            fontSize: 38, fontWeight: 900, color: '#22c55e',
            textShadow: '0 2px 14px rgba(0,0,0,0.3)',
          }}>
            ¡Mantené el equilibrio!
          </div>
        )}

        <PhaserGameFlamenco ref={phaserRef} headerHeight={HEADER_H} />

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
    </div>
  )
}
