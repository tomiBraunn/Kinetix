// Silencia o reactiva la voz de las indicaciones (ver ia/voz.js). Abajo a la derecha, con el mismo
// estilo de pastilla que el control de música del Surf (el diseño de Figma no trae este botón);
// `posicion` mueve el botón cuando ese rincón está ocupado (en el Surf va arriba del volumen).
// `children`: otros botones del mismo rincón, a su izquierda (ej. "Girar cámara" en la calibración).
import { useVoz, alternarSilencio } from '../ia/voz'
import { estiloSobreBotonApp } from '../lib/appMovil'

export default function BotonVoz({ posicion = 'bottom-[15px]', children = null }) {
  const { silenciada, soportada } = useVoz()
  if (!soportada && !children) return null // sin síntesis de voz en el aparato no hay nada que silenciar
  return (
    <div style={posicion.includes('bottom') ? estiloSobreBotonApp : undefined} className={`pointer-events-none absolute inset-x-0 z-20 mx-auto flex max-w-[402px] justify-end gap-2 px-[15px] ${posicion}`}>
      {children}
      {soportada && (
        <button
          type="button"
          onClick={alternarSilencio}
          aria-pressed={silenciada}
          aria-label={silenciada ? 'Activar la voz' : 'Silenciar la voz'}
          className="pointer-events-auto grid size-[38px] place-items-center rounded-[10px] border border-[#e3e3e3] bg-[rgba(228,226,235,0.75)] text-primary-dark shadow-[0_1.966px_1.966px_rgba(0,0,0,0.25)]"
        >
          <span className="material-symbols-rounded select-none text-[24px]" aria-hidden="true">
            {silenciada ? 'voice_over_off' : 'record_voice_over'}
          </span>
        </button>
      )}
    </div>
  )
}
