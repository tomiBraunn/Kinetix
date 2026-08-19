import { useNavigate } from 'react-router-dom'

const JUEGOS = [
  {
    id: 'surf',
    titulo: 'Surf',
    subtitulo: 'Juego 1',
    descripcion: 'Subite a la tabla de surf y atrapá peces moviéndote sin perder el equilibrio.',
    metricas: ['Equilibrio sobre la tabla', 'Velocidad de reacción', 'Peces atrapados'],
    ruta: '/juego/surf',
    icono: '🏄',
    color: '#3b9eff',
  },
  {
    id: 'flamenco',
    titulo: 'Flamenco Challenge',
    subtitulo: 'Juego 2',
    descripcion: 'Levantá la pierna y mantené el equilibrio el mayor tiempo posible sin bajarla.',
    metricas: ['Tiempo en equilibrio', 'Estabilidad postural', 'Cantidad de intentos'],
    ruta: '/juego/flamenco',
    icono: '🦩',
    color: '#ff5faa',
  },
  {
    id: 'estrellas',
    titulo: 'Alcanzá la Estrella',
    subtitulo: 'Juego 3',
    descripcion: 'Tocá las estrellas que aparecen en pantalla con la mano sin mover los pies.',
    metricas: ['Equilibrio postural', 'Estrellas alcanzadas', 'Movimientos de pies'],
    ruta: '/juego/estrellas',
    icono: '⭐',
    color: '#f0c040',
  },
]

export default function SeleccionJuego() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'fixed',
          top: 20,
          left: 20,
          background: 'rgba(255,255,255,0.07)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8,
          padding: '8px 16px',
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        ← Inicio
      </button>

      <h1 style={{
        color: '#ffffff',
        fontSize: 'clamp(26px, 4vw, 46px)',
        fontWeight: 700,
        margin: '0 0 8px',
        textAlign: 'center',
      }}>
        Elegí tu <span style={{ color: '#ff5faa' }}>juego</span>
      </h1>
      <p style={{
        color: '#666',
        fontSize: 15,
        margin: '0 0 52px',
        textAlign: 'center',
      }}>
        Cada actividad trabaja equilibrio y coordinación con análisis de IA en tiempo real
      </p>

      <div style={{
        display: 'flex',
        gap: 28,
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: 1200,
      }}>
        {JUEGOS.map(j => (
          <div
            key={j.id}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 20,
              padding: '36px 32px',
              width: 340,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-6px)'
              e.currentTarget.style.borderColor = j.color
              e.currentTarget.style.boxShadow = `0 12px 40px ${j.color}22`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <span style={{ fontSize: 44 }}>{j.icono}</span>

            <div>
              <p style={{
                color: j.color,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2,
                margin: 0,
                textTransform: 'uppercase',
              }}>
                {j.subtitulo}
              </p>
              <h2 style={{
                color: '#fff',
                fontSize: 26,
                fontWeight: 700,
                margin: '4px 0 0',
              }}>
                {j.titulo}
              </h2>
            </div>

            <p style={{ color: '#999', fontSize: 14, lineHeight: 1.65, margin: 0 }}>
              {j.descripcion}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {j.metricas.map(m => (
                <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: j.color,
                    flexShrink: 0,
                  }} />
                  <span style={{ color: '#777', fontSize: 13 }}>{m}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate(j.ruta)}
              style={{
                marginTop: 10,
                background: j.color,
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '13px 0',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Jugar
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
