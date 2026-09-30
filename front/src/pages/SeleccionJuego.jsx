import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { nombreCompleto, iniciales } from '../lib/pacientes'
import imgSurf from '../assets/juegos/surf-challenge.jpg'
import imgFlamenco from '../assets/juegos/flamenco-challenge.jpg'

const JUEGOS = [
  {
    id: 'surf',
    nombre: 'Surf Challenge',
    categoriaLabel: 'Coordinación y equilibrio',
    duracion: '30 s',
    descripcion: 'Poné a prueba tu equilibrio y coordinación atrapando peces antes de que se acabe el tiempo.',
    imagen: imgSurf,
    ruta: '/juego/surf',
  },
  {
    id: 'flamenco',
    nombre: 'Flamenco Challenge',
    categoriaLabel: 'Equilibrio y postura',
    duracion: '30 s',
    descripcion: 'Levantá una pierna, mantené el equilibrio y tratá de superar tu mejor marca.',
    imagen: imgFlamenco,
    ruta: '/juego/flamenco',
  },
  {
    id: 'estrellas',
    nombre: 'Alcanzá la Estrella',
    categoriaLabel: 'Equilibrio y coordinación',
    duracion: '30 s',
    descripcion: 'Estirá los brazos y tocá las estrellas sin mover los pies.',
    ruta: '/juego/estrellas',
  },
]

// Pantalla de "¿qué paciente sos?" — se muestra cuando el kinesiólogo toca
// un juego sin haber elegido paciente todavía. Es un paso obligatorio (con
// opción de saltar) en vez de un select chico y fácil de pasar por alto.
function SelectorPaciente({ pacientes, cargando, onElegir, onSaltar }) {
  const [busqueda, setBusqueda] = useState('')
  const filtrados = busqueda.trim()
    ? pacientes.filter((p) => nombreCompleto(p).toLowerCase().includes(busqueda.trim().toLowerCase()))
    : pacientes

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: '#FBF8FF',
      display: 'flex', flexDirection: 'column',
      padding: '28px 20px',
      fontFamily: 'system-ui, sans-serif',
      overflowY: 'auto',
    }}>
      <h1 style={{ color: '#2B319C', fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>
        ¿Qué paciente sos?
      </h1>
      <p style={{ color: '#767684', fontSize: 14, margin: '8px 0 20px', lineHeight: 1.5 }}>
        Elegí quién va a hacer el ejercicio para que el video y las estadísticas queden guardados.
      </p>

      {pacientes.length > 3 && (
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre..."
          style={{
            fontSize: 15, padding: '12px 14px', borderRadius: 12,
            border: '1px solid #D9DCEA', marginBottom: 16, background: '#fff',
          }}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {cargando ? (
          <p style={{ color: '#767684', fontSize: 14 }}>Cargando pacientes…</p>
        ) : filtrados.length === 0 ? (
          <p style={{ color: '#767684', fontSize: 14 }}>
            {pacientes.length === 0 ? 'Todavía no hay pacientes cargados.' : 'No encontré a nadie con ese nombre.'}
          </p>
        ) : (
          filtrados.map((p) => (
            <button
              key={p.id}
              onClick={() => onElegir(p.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: '#fff', border: '1px solid #E8E9F3', borderRadius: 16,
                padding: '14px 16px', textAlign: 'left', cursor: 'pointer',
                boxShadow: '0px 4px 14px 0px rgba(31,31,64,0.06)',
              }}
            >
              {p.avatar_url ? (
                <img src={p.avatar_url} alt={nombreCompleto(p)} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <span style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: '#2B319C', color: '#fff', fontWeight: 700, fontSize: 15,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {iniciales(p)}
                </span>
              )}
              <span style={{ color: '#0F1387', fontSize: 16, fontWeight: 600 }}>{nombreCompleto(p)}</span>
            </button>
          ))
        )}
      </div>

      <button
        onClick={onSaltar}
        style={{
          marginTop: 20, background: 'none', border: 'none',
          color: '#767684', fontSize: 13, fontWeight: 600, textDecoration: 'underline',
          cursor: 'pointer', alignSelf: 'center',
        }}
      >
        Continuar sin asignar paciente
      </button>
    </div>
  )
}

export default function SeleccionJuego() {
  const navigate = useNavigate()
  const [pacientes, setPacientes] = useState([])
  const [pacienteId, setPacienteId] = useState('')
  const [juegoPendiente, setJuegoPendiente] = useState(null)
  const token = localStorage.getItem('kinetix_token')
  const [cargandoPacientes, setCargandoPacientes] = useState(!!token)

  // /juego es pública (la abre el botón "Juegos" de la app mobile, sin pasar
  // por /pacientes/:id primero) — sin esto no había forma de asignar
  // paciente acá y los juegos corrían sin pacienteId, sin guardar nada.
  useEffect(() => {
    if (!token) return
    api.get('/pacientes', { token })
      .then(setPacientes)
      .catch(() => {})
      .finally(() => setCargandoPacientes(false))
  }, [token])

  function irAJuego(ruta) {
    if (pacienteId) {
      navigate(`${ruta}?pacienteId=${pacienteId}`)
    } else {
      setJuegoPendiente(ruta)
    }
  }

  function elegirPaciente(id) {
    setPacienteId(id)
    const ruta = juegoPendiente
    setJuegoPendiente(null)
    if (ruta) navigate(`${ruta}?pacienteId=${id}`)
  }

  function saltarPaciente() {
    const ruta = juegoPendiente
    setJuegoPendiente(null)
    if (ruta) navigate(ruta)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FBF8FF',
      fontFamily: 'system-ui, sans-serif',
      padding: '20px 16px 48px',
    }}>
      {juegoPendiente && (
        <SelectorPaciente
          pacientes={pacientes}
          cargando={cargandoPacientes}
          onElegir={elegirPaciente}
          onSaltar={saltarPaciente}
        />
      )}

      <button
        onClick={() => navigate('/')}
        style={{
          background: 'rgba(43,49,156,0.08)',
          color: '#2B319C',
          border: 'none',
          borderRadius: 20,
          padding: '9px 16px',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 700,
          marginBottom: 20,
        }}
      >
        ← Inicio
      </button>

      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        <span style={{ width: 5, borderRadius: 3, background: '#E040A0', flexShrink: 0 }} />
        <div>
          <h1 style={{
            color: '#2B319C',
            fontSize: 'clamp(24px, 7vw, 30px)',
            fontWeight: 700,
            margin: 0,
            letterSpacing: -0.5,
          }}>
            Explorá los juegos
          </h1>
          <p style={{ color: '#767684', fontSize: 14, margin: '8px 0 0', lineHeight: 1.5 }}>
            Se juegan con la cámara del celular. Elegí uno para empezar.
          </p>
        </div>
      </div>

      {pacienteId && (
        <div style={{
          marginTop: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          background: '#EEEFFD', borderRadius: 14, padding: '10px 14px',
        }}>
          <span style={{ color: '#2B319C', fontSize: 13, fontWeight: 700 }}>
            Paciente: {nombreCompleto(pacientes.find((p) => p.id === pacienteId) ?? { nombre: '', apellido: '' })}
          </span>
          <button
            onClick={() => setPacienteId('')}
            style={{ background: 'none', border: 'none', color: '#2B319C', fontSize: 12, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Cambiar
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 24 }}>
        {JUEGOS.map(j => (
          <div
            key={j.id}
            style={{
              background: '#fff',
              border: '1px solid #E8E9F3',
              borderRadius: 22,
              boxShadow: '0px 8px 22px 0px rgba(31,31,64,0.1)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {j.imagen ? (
              <img src={j.imagen} alt={j.nombre} style={{ height: 160, width: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                height: 160, width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #ddd6fe, #c7d2fe 50%, #fbcfe8)',
              }}>
                <span style={{ fontSize: 64, filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.25))' }}>⭐</span>
              </div>
            )}

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
              <span style={{
                alignSelf: 'flex-start',
                background: '#EEEFFD',
                color: '#2B319C',
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.4,
                borderRadius: 999,
                padding: '6px 12px',
                marginBottom: 10,
              }}>
                {j.categoriaLabel}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                <h2 style={{ color: '#0F1387', fontSize: 20, fontWeight: 600, margin: 0 }}>{j.nombre}</h2>
                <span style={{
                  flexShrink: 0,
                  background: 'rgba(236,131,191,0.25)',
                  color: '#E040A0',
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 999,
                  padding: '6px 12px',
                }}>
                  {j.duracion}
                </span>
              </div>

              <p style={{ color: '#767684', fontSize: 14, lineHeight: 1.55, margin: 0 }}>
                {j.descripcion}
              </p>

              <button
                onClick={() => irAJuego(j.ruta)}
                style={{
                  marginTop: 18,
                  background: '#E040A0',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 15,
                  padding: '14px 0',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Seleccionar juego
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
