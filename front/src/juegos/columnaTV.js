// Pantalla apaisada (un televisor, o un celular acostado): las pantallas del juego se diseñaron para un
// celular en vertical (402 px de ancho). En vez de estirarlas, el área de juego se arma como una columna
// de ese ancho, centrada y agrandada con `transform: scale`, y el fondo sigue ocupando toda la pantalla.
// Dentro de la columna nada cambia (los textos, la silueta, la cámara y los peces se miden con el tamaño
// de la columna), así que la cámara se ve sin recortes como en el celular. Si la columna no entra en
// el alto de la pantalla, se acorta: las tarjetas ya se adaptan a pantallas bajas.
import { useEffect, useState } from 'react'

export const ANCHO_COLUMNA = 402
const APAISADA = 1.2 // desde esta proporción ancho/alto se arma la columna
// Alto del área, en px del diseño, que se quiere ver entera: de ahí sale cuánto se agranda (en un
// televisor 1080p, ×1,5, con textos de ~27 px). Más chico = más grande todo; probar con la TV real.
const ALTO_VISTO = 690
const ESCALA_MAX = 2.2

/**
 * @returns null si la pantalla es vertical; si no, { k, alto }: escala y alto de la columna en px del diseño
 */
export function columnaTV(ventanaW, ventanaH, headerH) {
  if (ventanaW / ventanaH < APAISADA) return null
  const areaH = ventanaH - headerH
  const k = Math.min(ESCALA_MAX, Math.max(1, areaH / ALTO_VISTO))
  return { k, alto: areaH / k }
}

/** Estilo para el área de juego (undefined si la pantalla es vertical). */
export function useColumnaTV(headerH) {
  const [ventana, setVentana] = useState(() => [window.innerWidth, window.innerHeight])
  useEffect(() => {
    const alCambiar = () => setVentana([window.innerWidth, window.innerHeight])
    window.addEventListener('resize', alCambiar)
    return () => window.removeEventListener('resize', alCambiar)
  }, [])
  const col = columnaTV(ventana[0], ventana[1], headerH)
  if (!col) return undefined
  return { flex: 'none', alignSelf: 'center', width: ANCHO_COLUMNA, height: col.alto, transform: `scale(${col.k})`, transformOrigin: 'top center' }
}
