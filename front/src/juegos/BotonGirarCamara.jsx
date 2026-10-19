// Gira la imagen de la cámara 90° por toque (ver ia/rotacion.js): para cuando la cámara está de costado,
// por ejemplo un celular acostado junto al televisor y el paciente se ve acostado. Va dentro de BotonVoz,
// a su izquierda, con el mismo estilo; el diseño de Figma no trae este botón.
import { useState } from 'react'
import { kinetixAI } from '../ia/KinetixAI'
import { leerRotacion, siguienteRotacion, guardarRotacion } from '../ia/rotacion'

export default function BotonGirarCamara() {
  const [rotacion, setRotacion] = useState(leerRotacion)
  const girar = () => {
    const siguiente = siguienteRotacion(rotacion)
    setRotacion(siguiente)
    guardarRotacion(siguiente)
    kinetixAI.fijarRotacion(siguiente)
  }
  const etiqueta = `Girar la cámara 90 grados (ahora ${rotacion} grados)`
  return (
    <button
      type="button"
      onClick={girar}
      aria-label={etiqueta}
      title={etiqueta}
      className="pointer-events-auto grid size-[38px] place-items-center rounded-[10px] border border-[#e3e3e3] bg-[rgba(228,226,235,0.75)] text-primary-dark shadow-[0_1.966px_1.966px_rgba(0,0,0,0.25)]"
    >
      <span className="material-symbols-rounded select-none text-[24px]" aria-hidden="true">screen_rotation</span>
    </button>
  )
}
