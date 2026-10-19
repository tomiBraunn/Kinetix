import { useEffect, useRef, useState } from 'react'

/**
 * Cuenta regresiva de `segundos` que llama a `onFin` al llegar a 0 (una sola vez por `clave`).
 * - Se reinicia sola cuando cambia `clave` (otra pantalla de descanso).
 * - Se congela mientras `activa` sea false (la pausa, o la voz todavía hablando) y sigue desde ahí.
 * @returns los segundos que faltan
 */
export function useCuentaRegresiva(activa, segundos, clave, onFin) {
  const [est, setEst] = useState({ clave, resta: segundos })
  // Al cambiar de clave arranca de cero en el mismo render: si esperara a un efecto, el 0 de la
  // cuenta anterior dispararía onFin en la pantalla nueva.
  const resta = est.clave === clave ? est.resta : segundos
  const fin = useRef(onFin)
  useEffect(() => { fin.current = onFin })

  useEffect(() => {
    if (!activa) return
    const id = setInterval(() => {
      setEst((e) => ({ clave, resta: Math.max(0, (e.clave === clave ? e.resta : segundos) - 1) }))
    }, 1000)
    return () => clearInterval(id)
  }, [activa, clave, segundos])

  useEffect(() => {
    if (activa && resta <= 0) fin.current?.()
  }, [activa, resta])

  return resta
}
