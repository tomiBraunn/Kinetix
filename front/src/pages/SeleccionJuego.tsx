import { Link, useSearchParams } from 'react-router-dom'

const JUEGOS = [
  {
    nombre: 'Surf',
    descripcion: 'Atrapá peces inclinándote sin perder el equilibrio.',
    icon: 'surfing',
    tint: 'bg-sky-100 text-sky-600',
  },
  {
    nombre: 'Flamenco Challenge',
    descripcion: 'Levantá una pierna y aguantá el equilibrio el mayor tiempo posible.',
    icon: 'directions_walk',
    tint: 'bg-pink-100 text-accent',
  },
  {
    nombre: 'Alcanzá la estrella',
    descripcion: 'Tocá las estrellas con la mano sin mover los pies.',
    icon: 'star',
    tint: 'bg-violet-100 text-primary',
  },
]

export default function SeleccionJuego() {
  const [params] = useSearchParams()
  const pacienteId = params.get('pacienteId')

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-black text-primary">Elegí un juego</h1>
        <p className="text-text-muted font-medium mt-1">
          {pacienteId
            ? 'Prepará la sesión del paciente eligiendo la actividad.'
            : 'Elegí la actividad para la sesión.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {JUEGOS.map((j, i) => (
          <div
            key={j.nombre}
            className="bg-white rounded-[18px] shadow-[0_6px_24px_-12px_rgba(43,49,156,0.15)] p-6 flex flex-col"
          >
            <span className={`w-12 h-12 rounded-[14px] flex items-center justify-center ${j.tint} mb-4`}>
              <span className="material-symbols-rounded text-[24px]">{j.icon}</span>
            </span>
            <h2 className="text-primary font-black text-lg mb-1">{j.nombre}</h2>
            <p className="text-text-muted text-sm font-medium mb-5 flex-1">{j.descripcion}</p>
            <button
              className="rounded-full bg-accent text-white text-sm font-bold text-center py-3 hover:bg-[#C83890] transition-colors cursor-pointer"
              title="Selección e inicio de sesión se habilitan en el Sprint 4"
              onClick={() => alert('El inicio de la sesión de juego llega en el Sprint 4.')}
            >
              Elegir juego
            </button>
            <p className="text-text-placeholder text-xs font-semibold text-center mt-2">
              Inicio de juego disponible en Sprint 4 · {pacienteId ? 'Paciente seleccionado' : 'Sin paciente'}
            </p>
          </div>
        ))}
      </div>

      <Link
        to={pacienteId ? `/pacientes/${pacienteId}` : '/pacientes'}
        className="inline-flex items-center gap-1 text-text-muted text-sm font-bold hover:text-accent mt-8"
      >
        <span className="material-symbols-rounded text-[18px]">arrow_back</span>
        Volver
      </Link>
    </div>
  )
}