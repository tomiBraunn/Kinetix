import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import imgSurf from '../assets/juegos/surf-challenge.jpg'
import imgFlamenco from '../assets/juegos/flamenco-challenge.jpg'

type Categoria = 'equilibrio' | 'coordinacion'

type Juego = {
  id: string
  nombre: string
  categoriaLabel: string
  categorias: Categoria[]
  duracion: string
  descripcion: string
  imagen?: string
  ruta: string
}

const JUEGOS: Juego[] = [
  {
    id: 'surf',
    nombre: 'Surf Challenge',
    categoriaLabel: 'Coordinación y equilibrio',
    categorias: ['coordinacion', 'equilibrio'],
    duracion: '1 min',
    descripcion: 'Poné a prueba tu equilibrio y coordinación atrapando peces antes de que se acabe el tiempo. ¡Sumá puntos y superá tu récord!',
    imagen: imgSurf,
    ruta: '/juego/surf',
  },
  {
    id: 'flamenco',
    nombre: 'Flamenco Challenge',
    categoriaLabel: 'Equilibrio y postura',
    categorias: ['equilibrio'],
    duracion: '1 min',
    descripcion: 'Convertite en flamenco por unos segundos: levantá una pierna, mantené el equilibrio y tratá de superar tu mejor marca.',
    imagen: imgFlamenco,
    ruta: '/juego/flamenco',
  },
  {
    id: 'estrellas',
    nombre: 'Alcanzá la Estrella',
    categoriaLabel: 'Equilibrio y coordinación',
    categorias: ['equilibrio', 'coordinacion'],
    duracion: '1 min',
    descripcion: 'Estirá los brazos y tocá las estrellas que van apareciendo, sin mover los pies. Trabaja equilibrio y precisión.',
    ruta: '/juego/estrellas',
  },
]

const FILTROS: { id: 'todos' | Categoria; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'equilibrio', label: 'Equilibrio' },
  { id: 'coordinacion', label: 'Coordinación' },
]

export default function SeleccionJuego() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const pacienteId = params.get('pacienteId')
  const [filtro, setFiltro] = useState<'todos' | Categoria>('todos')

  const juegosFiltrados = JUEGOS.filter((j) => filtro === 'todos' || j.categorias.includes(filtro))

  function irAJuego(ruta: string) {
    const destino = pacienteId ? `${ruta}?pacienteId=${pacienteId}` : ruta
    navigate(destino)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-stretch gap-4 mb-2">
        <span className="w-1.5 rounded-full bg-accent shrink-0" />
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-primary tracking-tight">Explorá los juegos disponibles</h1>
          <p className="text-text-muted mt-2 max-w-2xl">
            {pacienteId
              ? 'Elegí la actividad para la sesión del paciente — se juega con la cámara, desde la compu o el celular.'
              : 'Acá podés ver todos nuestros juegos. Se juegan con cámara: directo desde la compu o desde el celular del paciente.'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-6 mb-8">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={
              'rounded-full text-sm font-semibold px-4 py-2 transition-colors cursor-pointer border ' +
              (filtro === f.id
                ? 'bg-primary border-primary text-white'
                : 'bg-white border-[#D9DCEA] text-text-label hover:border-primary/40')
            }
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto rounded-full border border-[#D9DCEA] bg-white text-text-muted text-sm font-semibold px-4 py-2">
          {juegosFiltrados.length} juego{juegosFiltrados.length === 1 ? '' : 's'} disponible{juegosFiltrados.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {juegosFiltrados.map((j) => (
          <div
            key={j.id}
            className="bg-white border border-[#E8E9F3] rounded-[22px] shadow-[0px_8px_22px_0px_rgba(31,31,64,0.1)] overflow-hidden flex flex-col"
          >
            {j.imagen ? (
              <img src={j.imagen} alt={j.nombre} className="h-[190px] w-full object-cover" />
            ) : (
              <div className="h-[190px] w-full flex items-center justify-center bg-gradient-to-br from-violet-200 via-primary/20 to-accent-light/40">
                <span className="material-symbols-rounded text-white text-[72px] drop-shadow-[0_4px_10px_rgba(0,0,0,0.25)]">star</span>
              </div>
            )}

            <div className="p-6 flex flex-col flex-1">
              <span className="self-start bg-bg-input text-primary text-[10px] font-bold uppercase tracking-wide rounded-full px-3 py-1.5 mb-3">
                {j.categoriaLabel}
              </span>

              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="text-primary-dark font-semibold text-xl">{j.nombre}</h2>
                <span className="shrink-0 bg-accent-light/25 text-accent text-[11px] font-semibold rounded-full px-3 py-1.5">
                  {j.duracion}
                </span>
              </div>

              <p className="text-text-muted text-sm leading-relaxed flex-1">{j.descripcion}</p>

              <button
                onClick={() => irAJuego(j.ruta)}
                className="mt-6 rounded-[15px] bg-accent text-white text-sm font-bold text-center py-3.5 hover:bg-[#C83890] transition-colors cursor-pointer"
              >
                Seleccionar juego
              </button>
              {!pacienteId && (
                <p className="text-text-placeholder text-xs font-semibold text-center mt-2">
                  Sin paciente seleccionado — la sesión no se guardará
                </p>
              )}
            </div>
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
