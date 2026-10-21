// La guía de "cómo se juega": en vez de una lista de consejos, la mascota del juego explica el paso a paso sobre
// el paisaje (la escena ya está de fondo, entrando). Ella llega con una animación y cada globo de texto aparece
// con un "pop"; la voz lo lee y cada PASO_MS (5 s) pasa solo al paso siguiente, o se toca "Siguiente".
// En el último paso espera el "Estoy listo": recién ahí se enciende la cámara para la calibración (con los huesos
// que detecta la IA a la vista, ver KinetixAI._dibujarHuesos).
import { useEffect, useState } from 'react'
import Mascota from './Mascota'
import BotonVoz from './BotonVoz'
import { hablar, callar, useVoz } from '../ia/voz'
import './guia.css'

// Cada paso dura esto y pasa solo al siguiente (el último espera el "Estoy listo"). Los textos son cortos a propósito
// (ver GUIA_FLAMENCO y GUIA_SURF): la voz tiene que alcanzar a decirlos en ese tiempo, si no el paso siguiente la corta.
const PASO_MS = 5000
// El primer globo recién aparece cuando llegó la mascota (ver guia.css): se le suma ese tiempo para que también se lea 5 s
const ENTRADA_MS = 1200

/**
 * @param especie  'flamingo' | 'pez'
 * @param pasos    [{ texto, pose }]: lo que dice la mascota en cada paso y la pose que hace
 * @param onListo  se tocó "Estoy listo" en el último paso
 * @param onOmitir se tocó "Saltar guía" (para quien ya la conoce)
 */
export default function GuiaMascota({ especie, pasos, onListo, onOmitir }) {
  const [i, setI] = useState(0)
  const { hablando } = useVoz()
  const { texto, pose } = pasos[i]
  const ultimo = i === pasos.length - 1

  useEffect(() => { hablar(texto) }, [texto])
  useEffect(() => callar, []) // al salir no puede quedar hablando

  // Pasa solo cada PASO_MS; al tocar "Siguiente" cambia `i` y la cuenta arranca de nuevo
  useEffect(() => {
    if (ultimo) return
    const id = setTimeout(() => setI((n) => n + 1), PASO_MS + (i === 0 ? ENTRADA_MS : 0))
    return () => clearTimeout(id)
  }, [i, ultimo])

  return (
    <div role="region" aria-label="Cómo se juega" className="absolute inset-0 z-40 overflow-hidden">
      {/* Arriba, en la misma columna que el resto de los controles del juego */}
      <div className="pointer-events-none absolute inset-x-0 top-[14px] z-10 mx-auto max-w-[402px] px-[18px]">
        <button
          type="button"
          onClick={onOmitir}
          className="pointer-events-auto h-[38px] rounded-full bg-white/85 px-4 text-[14px] font-bold text-primary-dark shadow-[0_1.966px_1.966px_rgba(0,0,0,0.25)]"
        >
          Saltar guía
        </button>
      </div>
      <BotonVoz posicion="top-[14px]" />

      {/* En una pantalla baja (celular acostado) la mascota va al lado del globo, no debajo: si no, no entra */}
      <div className="absolute inset-0 flex flex-col justify-end px-[26px] pb-5 pt-16 [@media(max-height:520px)]:pb-3 [@media(max-height:520px)]:pt-[60px]">
        <div className="mx-auto flex w-full max-w-[350px] flex-col [@media(max-height:520px)]:max-w-[640px] [@media(max-height:520px)]:flex-row-reverse [@media(max-height:520px)]:items-end [@media(max-height:520px)]:gap-4">
          {/* Un globo por paso (key): cada uno vuelve a aparecer con su "pop". El primero espera a que llegue la mascota. */}
          <div
            key={i}
            role="status"
            className={`globo-pop relative [@media(max-height:520px)]:flex-1 rounded-[22px] border-[1.475px] border-primary bg-[#fffbfb] px-5 pb-4 pt-3.5 shadow-[0_1.966px_1.966px_rgba(0,0,0,0.25)] ${i === 0 ? 'primero' : ''}`}
          >
            <p className="text-[12px] font-bold tracking-[0.6px] text-[#b11c6c]">PASO {i + 1} DE {pasos.length}</p>
            <p className="mt-1 text-[19px] font-bold leading-[25px] text-primary-dark">{texto}</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div aria-hidden="true" className="flex gap-1.5">
                {pasos.map((_, n) => (
                  <span key={n} className={`size-2.5 rounded-full ${n === i ? 'bg-[#b11c6c]' : 'bg-[#d9dcf0]'}`} />
                ))}
              </div>
              <button
                type="button"
                data-mano
                onClick={ultimo ? onListo : () => setI(i + 1)}
                className="h-[46px] rounded-full bg-[#b11c6c] px-6 text-[17px] font-bold text-white"
              >
                {ultimo ? 'Estoy listo' : 'Siguiente'}
              </button>
            </div>
            {/* La cola del globo apunta a la mascota, que está justo debajo */}
            <span aria-hidden="true" className="absolute -bottom-[8px] left-[72px] size-[14px] rotate-45 [@media(max-height:520px)]:hidden border-b-[1.475px] border-r-[1.475px] border-primary bg-[#fffbfb]" />
          </div>

          <div className="guia-mascota mt-[10px] w-fit [@media(max-height:520px)]:mt-0" aria-hidden="true">
            <Mascota especie={especie} pose={pose} habla={hablando} className="w-[min(170px,26dvh)] [@media(max-height:520px)]:w-[min(160px,40dvh)]" />
          </div>
        </div>
      </div>
    </div>
  )
}
