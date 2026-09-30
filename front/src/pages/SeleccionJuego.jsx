import { useNavigate } from 'react-router-dom'
import imgSurf from '../assets/juegos/surf-challenge.jpg'
import imgFlamenco from '../assets/juegos/flamenco-challenge.jpg'

const JUEGOS = [
  {
    id: 'surf',
    nombre: 'Surf Challenge',
    categoriaLabel: 'Coordinación y equilibrio',
    duracion: '1 min',
    descripcion: 'Poné a prueba tu equilibrio y coordinación atrapando peces antes de que se acabe el tiempo.',
    imagen: imgSurf,
    ruta: '/juego/surf',
  },
  {
    id: 'flamenco',
    nombre: 'Flamenco Challenge',
    categoriaLabel: 'Equilibrio y postura',
    duracion: '1 min',
    descripcion: 'Levantá una pierna, mantené el equilibrio y tratá de superar tu mejor marca.',
    imagen: imgFlamenco,
    ruta: '/juego/flamenco',
  },
  {
    id: 'estrellas',
    nombre: 'Alcanzá la Estrella',
    categoriaLabel: 'Equilibrio y coordinación',
    duracion: '1 min',
    descripcion: 'Estirá los brazos y tocá las estrellas sin mover los pies.',
    ruta: '/juego/estrellas',
  },
]

export default function SeleccionJuego() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FBF8FF',
      fontFamily: 'system-ui, sans-serif',
      padding: '20px 16px 48px',
    }}>
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
                onClick={() => navigate(j.ruta)}
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
