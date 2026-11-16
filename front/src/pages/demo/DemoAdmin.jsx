import { useEffect, useRef, useState } from 'react'
import { MockFrame } from 'react-mockframe'
import 'react-mockframe/styles/mockframe-iphones.css'
import 'react-mockframe/styles/mockframe-laptops.css'
import GradientBackground from '../../components/GradientBackground'
import { api } from '../../lib/api'
import { getSesiones } from '../../lib/sesiones'
import imgPez from '../landing/assets/pez_celebra.svg'
import imgFlamenco from '../landing/assets/fla_senala.svg'

// /demoadmin: para presentar el proyecto desde la compu. Juego en un iPhone (vertical, como /demo) y
// Paciente / Análisis en una MacBook Pro. Abajo: el selector de juego (con las mascotas) y el de sección.
// Usa las pantallas reales de la webapp dentro de los dispositivos. Solo para admins (ADMIN_EMAILS).

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

const JUEGOS = [
  { id: 'surf', nombre: 'Surf', img: imgPez },
  { id: 'flamenco', nombre: 'Flamenco', img: imgFlamenco },
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
  const [juego, setJuego] = useState('surf')
  const [pacienteId, setPacienteId] = useState(null)
  const [sesionId, setSesionId] = useState(null)
  const [error, setError] = useState(null)
  const [escala, setEscala] = useState({ celu: 1, mac: 1 })
  const [version, setVersion] = useState(0) // se usa para recargar los iframes al reiniciar
  const iframeRef = useRef(null)
  const [zoom, setZoom] = useState(null) // { min, max, step, valor } si la cámara del juego tiene zoom por hardware

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
    const ajustar = () => setEscala({
      celu: Math.max(0.5, Math.min(1.5, (window.innerHeight - 170) / ALTO_CUERPO)),
      mac: Math.max(0.5, Math.min(1.6, (window.innerWidth - 80) / 960, (window.innerHeight - 200) / 624)),
    })
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
  }, [version, seccion, juego])

  const cambiarZoom = (valor) => {
    const track = iframeRef.current?.contentWindow?.kinetixStream?.getVideoTracks?.()[0]
    setZoom((z) => ({ ...z, valor }))
    track?.applyConstraints({ advanced: [{ zoom: valor }] }).catch((e) => setError(`No se pudo cambiar el zoom: ${e.message}`))
  }

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
    seccion === 'juego' ? `/webapp/juego/${juego}?pacienteId=${pacienteId}`
    : seccion === 'paciente' ? `/webapp/pacientes/${pacienteId}`
    : sesionId ? `/webapp/sesiones/${sesionId}`
    : null

  const esCelu = seccion === 'juego'
  const boton = (activo) => ({
    padding: '10px 18px',
    borderRadius: 999,
    border: 0,
    fontWeight: 700,
    cursor: 'pointer',
    background: activo ? '#2B319C' : 'transparent',
    color: activo ? '#fff' : '#1a237e',
  })

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-5 overflow-hidden p-6">
      {/* Mismo fondo que /demo */}
      <GradientBackground />

      <div className="relative z-10 flex flex-1 items-center justify-center">
        {esCelu ? (
          <MockFrame device="iPhone 18 Pro" color="black" zoom={escala.celu} hideNotch>
            {url ? (
              <iframe
                ref={iframeRef}
                key={`${seccion}-${juego}-${version}`}
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
        ) : (
          <MockFrame device="MacBook Pro" color="space-black" zoom={escala.mac}>
            {url ? (
              <iframe
                ref={iframeRef}
                key={`${seccion}-${version}-${url}`}
                src={url}
                title="Demo admin"
                style={{ width: '100%', height: '100%', border: 0, display: 'block', background: '#fff' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontFamily: 'sans-serif', background: '#fff' }}>
                Todavía no hay una sesión. Jugá primero en la sección Juego.
              </div>
            )}
          </MockFrame>
        )}
      </div>

      {error && <p className="relative z-10 rounded-lg bg-red-700 px-3 py-1.5 text-white">{error}</p>}

      {/* Zoom de la cámara: fuera del dispositivo. Aparece solo si la cámara del juego tiene zoom por hardware */}
      {zoom && esCelu && (
        <div className="relative z-10 flex items-center gap-3 rounded-full bg-white/85 px-4 py-2 font-bold text-[#1a237e]">
          <span>Zoom cámara</span>
          <input type="range" min={zoom.min} max={zoom.max} step={zoom.step} value={zoom.valor} onChange={(e) => cambiarZoom(Number(e.target.value))} style={{ width: 240 }} />
          <span style={{ minWidth: 40 }}>{Number(zoom.valor).toFixed(1)}×</span>
        </div>
      )}

      {/* Abajo: selector de juego (con las mascotas) y selector de sección + reiniciar */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        {esCelu && (
          <div className="flex gap-3">
            {JUEGOS.map((j) => (
              <button
                key={j.id}
                onClick={() => setJuego(j.id)}
                className={`flex items-center gap-2 rounded-2xl bg-white/85 px-4 py-2 font-bold text-[#1a237e] ${juego === j.id ? 'ring-4 ring-[#B11C6C]' : ''}`}
              >
                <img src={j.img} alt="" style={{ height: 44, width: 'auto' }} />
                {j.nombre}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 rounded-full bg-white/85 p-2">
          {SECCIONES.map((s) => (
            <button key={s.id} onClick={() => setSeccion(s.id)} style={boton(seccion === s.id)}>
              {s.label}
            </button>
          ))}
          <button onClick={reiniciar} style={{ padding: '10px 18px', borderRadius: 999, border: 0, fontWeight: 700, cursor: 'pointer', background: '#B11C6C', color: '#fff' }}>
            Reiniciar
          </button>
        </div>
      </div>
    </div>
  )
}
