// Mascota de un juego (diseño: Figma "Kinetix · Marketing", nodo 294:16 el pez). Cada mascota es un
// SVG de composición completa (personaje + tabla/agua) con root width/height propios y
// preserveAspectRatio="none": se escala SOLO por ancho (`className` con un w-…) y el alto sale solo
// de la proporción del archivo; fijar los dos lados la deformaría.
import './mascota.css'

export default function Mascota({ src, className = '' }) {
  // Decorativa: no aporta nada que la pantalla no diga ya con texto
  return <img src={src} alt="" aria-hidden="true" draggable="false" className={`mascota block h-auto ${className}`} />
}
