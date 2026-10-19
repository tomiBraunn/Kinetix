// La mano como cursor: para elegir un botón (seguir, comenzar) sin tocar la pantalla, algo imposible con
// el celular apoyado lejos o con el juego en un televisor. Funciones puras: se prueban con node
// (manoCursor.check.mjs); el dibujo y los botones están en juegos/CursorMano.jsx.
//
// La mano no se mapea "donde se ve en la imagen": un botón abajo de la pantalla quedaría a la altura del
// muslo y uno arriba por encima de la cabeza. Se mapea una caja cómoda frente al cuerpo —de las caderas a
// un poco por encima de los hombros, y un tronco y medio a lo ancho— a toda la pantalla, medida en largos
// de tronco como el resto de la calibración (vale igual cerca o lejos de la cámara).

// Largos de tronco (hombros→caderas) a cada lado del centro que cubren todo el ancho de la pantalla
export const ALCANCE_X = 0.9
// Largos de tronco por encima de los hombros que llegan al borde de arriba de la pantalla
export const ALCANCE_ARRIBA = 0.4
// Cuánto hay que quedarse sobre un botón para elegirlo: lo bastante largo para no elegir sin querer
// al pasar la mano, lo bastante corto para no cansar el brazo
export const PERMANENCIA_MS = 1400

const visible = (p) => !!p && (p.visibility ?? 1) > 0.5

/**
 * @param lms      landmarks de MediaPipe (normalizados, imagen ya derecha)
 * @param aspecto  ancho/alto de esa imagen (los x e y normalizados no tienen la misma unidad)
 * @returns { x, y, lado } con x e y en 0–1 sobre la pantalla (x ya en espejo, como se ve el paciente), o
 *   null si no hay tronco a la vista o ninguna mano levantada. Con la mano más alta; las que cuelgan a
 *   los costados (por debajo de las caderas) no cuentan: así quien está parado no elige nada sin querer.
 */
export function cursorDeMano(lms, aspecto = 0.75) {
  if (!lms || ![lms[11], lms[12], lms[23], lms[24]].every(visible)) return null
  const hombrosY = (lms[11].y + lms[12].y) / 2
  const caderasY = (lms[23].y + lms[24].y) / 2
  const tronco = caderasY - hombrosY
  if (!(tronco > 0.05)) return null // medida absurda: mejor no usarla
  const centroX = (lms[11].x + lms[12].x) / 2

  let mano = null
  for (const [i, lado] of [[15, 'izq'], [16, 'der']]) {
    const m = lms[i]
    if (!visible(m) || m.y >= caderasY) continue
    if (!mano || m.y < mano.m.y) mano = { m, lado }
  }
  if (!mano) return null

  const arriba = hombrosY - ALCANCE_ARRIBA * tronco
  const limitar = (v) => Math.min(1, Math.max(0, v))
  return {
    x: limitar(0.5 - ((mano.m.x - centroX) * aspecto) / (2 * ALCANCE_X * tronco)),
    y: limitar((mano.m.y - arriba) / (caderasY - arriba)),
    lado: mano.lado,
  }
}

/**
 * Cuánto lleva la mano sobre el mismo botón. `est` es lo que devolvió la vez anterior (empezar con
 * ESTADO_INICIAL); `objetivo` es el botón bajo el cursor (cualquier valor comparable) o null.
 * @returns { est, progreso 0–1, dispara } — dispara es true una sola vez por botón: para volver a
 *   elegirlo hay que sacar la mano y volver a ponerla.
 */
export const ESTADO_INICIAL = { objetivo: null, desde: 0, hecho: false }
export function avanzarPermanencia(est, objetivo, ahora, durMs = PERMANENCIA_MS) {
  if (!objetivo) return { est: ESTADO_INICIAL, progreso: 0, dispara: false }
  if (objetivo !== est.objetivo) return { est: { objetivo, desde: ahora, hecho: false }, progreso: 0, dispara: false }
  if (est.hecho) return { est, progreso: 1, dispara: false }
  const progreso = Math.min(1, (ahora - est.desde) / durMs)
  if (progreso < 1) return { est, progreso, dispara: false }
  return { est: { ...est, hecho: true }, progreso: 1, dispara: true }
}
