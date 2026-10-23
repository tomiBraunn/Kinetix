// Selector de la rutina para "Antes de empezar": cuántas repeticiones y qué dificultad (ver rutina.js). Lo usan
// el Flamenco y el Surf; cada uno lee lo elegido con leerRutina() al arrancar. Botones grandes: se toca con el
// dedo o el mouse. Cada cambio queda guardado en el equipo.
import { useState } from 'react'
import { RUTINAS, leerRutina, guardarRutina, normalizarRutina } from './rutina'

const PASO = 'grid size-12 shrink-0 place-items-center rounded-full bg-[#b11c6c] text-[28px] font-bold leading-none text-white disabled:opacity-30'

export default function SelectorRutina({ juego }) {
  const { repeticiones: reps, dificultades, aLaVez } = RUTINAS[juego]
  const [rutina, setRutina] = useState(() => leerRutina(juego))
  const cambiar = (cambios) => {
    const nueva = normalizarRutina(juego, { ...rutina, ...cambios })
    setRutina(nueva)
    guardarRutina(juego, nueva)
  }
  return (
    <div role="group" aria-label="Rutina" className="rounded-[18px] bg-white p-4">
      <p className="text-[18px] font-bold leading-[23px]">{reps.titulo}</p>
      <div className="mt-3 flex items-center justify-between px-2">
        <button type="button" aria-label="Menos" disabled={rutina.repeticiones <= reps.min} onClick={() => cambiar({ repeticiones: rutina.repeticiones - 1 })} className={PASO}>−</button>
        <output aria-label={reps.titulo} className="text-[44px] font-black leading-none text-[#b11c6c]">{rutina.repeticiones}</output>
        <button type="button" aria-label="Más" disabled={rutina.repeticiones >= reps.max} onClick={() => cambiar({ repeticiones: rutina.repeticiones + 1 })} className={PASO}>+</button>
      </div>
      <p className="mt-2 text-[15px] leading-5">{reps.ayuda}</p>

      <p className="mt-4 text-[18px] font-bold leading-[23px]">Dificultad</p>
      <div role="radiogroup" aria-label="Dificultad" className="mt-2 flex flex-col gap-2">
        {dificultades.map(({ clave, etiqueta, detalle }) => {
          const elegida = rutina.dificultad === clave
          return (
            <button
              key={clave}
              type="button"
              role="radio"
              aria-checked={elegida}
              onClick={() => cambiar({ dificultad: clave })}
              className={`rounded-[14px] border-2 px-3 py-2 text-left ${elegida ? 'border-[#b11c6c] bg-[#fdeaf4]' : 'border-[#d9dcf0] bg-white'}`}
            >
              <span className="block text-[16px] font-bold leading-[21px]">{etiqueta}</span>
              <span className="block text-[14px] leading-[19px]">{detalle}</span>
            </button>
          )
        })}
      </div>

      {/* Solo el Surf: cuántos peces nadan a la vez */}
      {aLaVez && (
        <>
          <p className="mt-4 text-[18px] font-bold leading-[23px]">{aLaVez.titulo}</p>
          <div role="radiogroup" aria-label={aLaVez.titulo} className="mt-2 flex flex-wrap gap-2">
            {[null, ...aLaVez.opciones].map((opcion) => {
              const elegida = rutina.aLaVez === opcion
              return (
                <button
                  key={opcion ?? 'auto'}
                  type="button"
                  role="radio"
                  aria-checked={elegida}
                  onClick={() => cambiar({ aLaVez: opcion })}
                  className={`h-12 rounded-full border-2 px-4 text-[16px] font-bold ${opcion == null ? '' : 'min-w-12'} ${elegida ? 'border-[#b11c6c] bg-[#fdeaf4] text-[#b11c6c]' : 'border-[#d9dcf0] bg-white'}`}
                >
                  {opcion ?? aLaVez.etiquetaAuto}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-[15px] leading-5">{aLaVez.ayuda}</p>
        </>
      )}
    </div>
  )
}
