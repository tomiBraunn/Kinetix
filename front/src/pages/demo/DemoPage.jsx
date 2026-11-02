import { Link, useNavigate } from 'react-router-dom'
import './DemoPage.css'

// Los juegos de la demo son los de la app, con la cámara y la detección, pero sin el análisis ni guardar la sesión
export const JUEGOS = [
  { to: '/demo/surf', nombre: 'Surf', detalle: 'Atrapá los peces que nadan por la pantalla, con tu cuerpo.' },
  { to: '/demo/flamenco', nombre: 'Flamenco', detalle: 'Levantá la pierna y aguantá el equilibrio.' },
]

export default function DemoPage() {
  const navigate = useNavigate()

  return (
    <div className="demo-page">
      <header className="demo-page-header">
        {/* Dentro del marco de escritorio, "Volver" sale de la página entera, no solo del marco */}
        <button className="demo-volver" onClick={() => (window.top === window ? navigate('/') : window.top.location.assign('/'))}>← Volver</button>
        <span className="demo-page-logo">Kinetix</span>
      </header>
      <main className="demo-page-main">
        <h1 className="demo-page-titulo">Probalo <span>en vivo</span></h1>
        <p className="demo-page-sub">Elegí un juego. Necesita la cámara para jugar.</p>
        <div className="demo-juegos">
          {JUEGOS.map((j) => (
            <Link key={j.to} to={j.to} className="demo-juego">
              <span className="demo-juego-nombre">{j.nombre}</span>
              <span className="demo-juego-detalle">{j.detalle}</span>
              <span className="demo-juego-jugar">Jugar →</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
