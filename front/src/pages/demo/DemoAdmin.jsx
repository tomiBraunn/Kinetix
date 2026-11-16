import { useEffect, useRef, useState } from 'react'
import { MockFrame } from 'react-mockframe'
import 'react-mockframe/styles/mockframe-iphones.css'
import { api } from '../../lib/api'
import { getSesiones } from '../../lib/sesiones'

// /demoadmin: para presentar el proyecto desde la compu. Todo en una pantalla vertical (iPhone) con tres
// secciones que se eligen abajo: Juego → Paciente → Análisis. Usa las mismas pantallas de la webapp dentro del
// celular, así que se juega, se guarda y se ve igual que en la app. Solo para admins (ADMIN_EMAILS).

// Medidas del iPhone 18 Pro de react-mockframe (igual que MarcoMovil)
const PANTALLA_W = 402
const PANTALLA_H = 874
const ANCHO_CUERPO = 434
const ALTO_CUERPO = 905

const SECCIONES = [
  { id: 'juego', label: 'Juego' },
  { id: 'paciente', label: 'Paciente' },
  { id: 'analisis', label: 'Análisis' },
]

const esAdminGuardado = () => {
  try {
    return JSON.parse(localStorage.getItem('kinetix_user') || 'null')?.es_admin === true
  } catch {
    return false
  }
}

const token = () => localStorage.getItem('kinetix_token') || undefined

// Paciente de prueba: se crea al entrar y en cada "Reiniciar". Después se completan sus datos en la sección Paciente.
async function crearPacientePrueba() {
  const hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  const creado = await api.post(
    '/pacientes',
    { nombre: 'Paciente', apellido: `de prueba ${hora}`, fecha_nacimiento: null, tipo_lesion: null, observaciones: null },
    { token: token() },
  )
  return creado.id
}

// La sesión más reciente del paciente (la que dejó el juego al terminar)
async function ultimaSesion(pacienteId) {
  const sesiones = await getSesiones(pacienteId)
  if (!sesiones?.length) return null
  return [...sesiones].sort((a, b) => new Date(b.iniciada_en) - new Date(a.iniciada_en))[0].id
}

export default function DemoAdmin() {
  const [seccion, setSeccion] = useState('juego')
  const [pacienteId, setPacienteId] = useState(null)
  const [sesionId, setSesionId] = useState(null)
  const [error, setError] = useState(null)
  const [escala, setEscala] = useState(1)
  const [version, setVersion] = useState(0) // se usa para recargar los iframes al reiniciar
  const iframeRef = useRef(null)
  const [zoom, setZoom] = useState(null) // { min, max, step, valor } si la cámara del juego tiene zoom por hardware

  // La cámara la abre el juego (dentro del celular): se busca su track y se leen los límites de zoom
  useEffect(() => {
    const buscar = () => {
      const track = iframeRef.current?.contentWindow?.kinetixStream?.getVideoTracks?.()[0]
      const caps = track?.getCapabilities?.()
      if (!track || !caps?.zoom) return setZoom(null)
      setZoom((z) => ({ min: caps.zoom.min, max: caps.zoom.max, step: caps.zoom.step || 0.1, valor: z?.valor ?? track.getSettings().zoom ?? caps.zoom.min }))
    }
    buscar()
    const t = setInterval(buscar, 1000)
    return () => clearInterval(t)
  }, [version, seccion])

  const cambiarZoom = (valor) => {
    const track = iframeRef.current?.contentWindow?.kinetixStream?.getVideoTracks?.()[0]
    setZoom((z) => ({ ...z, valor }))
    track?.applyConstraints({ advanced: [{ zoom: valor }] }).catch((e) => setError(`No se pudo cambiar el zoom: ${e.message}`))
  }

  const reiniciar = async () => {
    setError(null)
    setSesionId(null)
    setSeccion('juego')
    try {
      setPacienteId(await crearPacientePrueba())
      setVersion((v) => v + 1)
    } catch (e) {
      setError(e.message || 'No se pudo crear el paciente de prueba')
    }
  }

  useEffect(() => {
    if (!esAdminGuardado()) return
    const ajustar = () => setEscala(Math.max(0.5, Math.min(1.5, (window.innerHeight - 150) / ALTO_CUERPO)))
    ajustar()
    window.addEventListener('resize', ajustar)
    reiniciar()
    return () => window.removeEventListener('resize', ajustar)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // En la sección Análisis se busca la sesión que dejó el juego (puede tardar un poco en aparecer)
  useEffect(() => {
    if (seccion !== 'analisis' || !pacienteId) return
    let vivo = true
    const buscar = async () => {
      try {
        const id = await ultimaSesion(pacienteId)
        if (vivo && id) setSesionId(id)
      } catch (e) {
        if (vivo) setError(e.message)
      }
    }
    buscar()
    const t = setInterval(buscar, 4000)
    return () => {
      vivo = false
      clearInterval(t)
    }
  }, [seccion, pacienteId])

  if (!esAdminGuardado()) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', fontFamily: 'sans-serif' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a237e' }}>Esta pantalla es solo para admins</h1>
          <p style={{ color: '#64748b', marginTop: 8 }}>Iniciá sesión como admin en la webapp y volvé a esta página.</p>
        </div>
      </div>
    )
  }

  const url =
    seccion === 'juego' ? `/webapp/juego?pacienteId=${pacienteId}`
    : seccion === 'paciente' ? `/webapp/pacientes/${pacienteId}`
    : sesionId ? `/webapp/sesiones/${sesionId}`
    : null

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '16px', background: 'linear-gradient(180deg,#2f8fe8,#7cc4f6)', fontFamily: 'sans-serif' }}>
      <div style={{ width: ANCHO_CUERPO * escala, height: ALTO_CUERPO * escala, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: `translateX(-50%) scale(${escala})`, transformOrigin: 'top center' }}>
          <MockFrame device="iPhone 18 Pro" color="black" hideNotch>
            {url ? (
              <iframe
                ref={iframeRef}
                key={`${seccion}-${version}-${url}`}
                src={url}
                title="Demo admin"
                allow="camera"
                style={{ width: PANTALLA_W, height: PANTALLA_H, border: 0, display: 'block' }}
              />
            ) : (
              <div style={{ width: PANTALLA_W, height: PANTALLA_H, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontFamily: 'sans-serif', padding: 24, textAlign: 'center', background: '#fff' }}>
                Todavía no hay una sesión. Jugá primero en la sección Juego.
              </div>
            )}
          </MockFrame>
        </div>
      </div>

      {error && <p style={{ color: '#fff', background: '#b91c1c', padding: '6px 12px', borderRadius: 8, margin: 0 }}>{error}</p>}

      {/* Zoom de la cámara: fuera del celular. Aparece solo si la cámara que usa el juego tiene zoom */}
      {zoom && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,.85)', padding: '8px 16px', borderRadius: 999, color: '#1a237e', fontWeight: 700 }}>
          <span>Zoom cámara</span>
          <input
            type="range"
            min={zoom.min}
            max={zoom.max}
            step={zoom.step}
            value={zoom.valor}
            onChange={(e) => cambiarZoom(Number(e.target.value))}
            style={{ width: 240 }}
          />
          <span style={{ minWidth: 40 }}>{Number(zoom.valor).toFixed(1)}×</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(255,255,255,.85)', padding: 8, borderRadius: 999 }}>
        {SECCIONES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSeccion(s.id)}
            style={{
              padding: '10px 18px',
              borderRadius: 999,
              border: 0,
              fontWeight: 700,
              cursor: 'pointer',
              background: seccion === s.id ? '#2B319C' : 'transparent',
              color: seccion === s.id ? '#fff' : '#1a237e',
            }}
          >
            {s.label}
          </button>
        ))}
        <button
          onClick={reiniciar}
          style={{ padding: '10px 18px', borderRadius: 999, border: 0, fontWeight: 700, cursor: 'pointer', background: '#B11C6C', color: '#fff' }}
        >
          Reiniciar
        </button>
      </div>
    </div>
  )
}
