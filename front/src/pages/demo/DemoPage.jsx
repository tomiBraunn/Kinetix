import { Link, useNavigate } from 'react-router-dom'
import GradientBackground from '../../components/GradientBackground'
import Logo from '../../components/Logo'

// Los juegos de la demo son los de la app, con la cámara y la detección, pero sin el análisis ni guardar la sesión
export const JUEGOS = [
  { to: '/demo/surf', nombre: 'Surf', detalle: 'Atrapá los peces que nadan por la pantalla, con tu cuerpo.' },
  { to: '/demo/flamenco', nombre: 'Flamenco', detalle: 'Levantá la pierna y aguantá el equilibrio.' },
]

// Estética de la webapp: el mismo degradé de login/registro y tarjetas blancas con borde rosa abajo, como en el panel
export const tarjetaJuego =
  'rounded-[18px] bg-white p-5 text-left shadow-[0_6px_24px_-12px_rgba(43,49,156,0.15)] border-b-4 transition'

export default function DemoPage() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen overflow-hidden">
      <GradientBackground />
      <div className="relative z-10 mx-auto max-w-[544px] px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          {/* Dentro del marco de escritorio, "Volver" sale de la página entera, no solo del marco */}
          <button
            className="text-text-muted text-sm font-bold hover:text-accent"
            onClick={() => (window.top === window ? navigate('/') : window.top.location.assign('/'))}
          >
            ← Volver
          </button>
        </div>
        <div className="rounded-[2.5rem] bg-white/60 px-6 py-8 shadow-[0_24px_60px_-20px_rgba(43,49,156,0.18)] ring-1 ring-primary/5 backdrop-blur-xl">
          <h1 className="text-[32px] font-black leading-tight text-primary-dark">
            Probalo <span className="text-accent">en vivo</span>
          </h1>
          <p className="mt-2 text-[15px] font-semibold text-text-label">Elegí un juego. Necesita la cámara para jugar.</p>
          <div className="mt-6 flex flex-col gap-4">
            {JUEGOS.map((j) => (
              <Link key={j.to} to={j.to} className={`${tarjetaJuego} border-accent hover:-translate-y-0.5`}>
                <span className="block text-xl font-black text-primary">{j.nombre}</span>
                <span className="mt-1 block text-sm font-semibold text-text-muted">{j.detalle}</span>
                <span className="mt-3 block text-sm font-black text-accent">Jugar →</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
