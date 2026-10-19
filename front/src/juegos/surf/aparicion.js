// Dónde aparece cada pez del Surf. Antes caía en cualquier punto de la zona de cámara, o sea muchas veces
// pegado al pecho del paciente, que lo tocaba sin estirar el brazo. Ahora se pide una distancia mínima al
// cuerpo, medida en largos de tronco (hombros→caderas) como el resto de la calibración, así vale igual para
// quien está cerca o lejos de la cámara. Funciones puras: se prueban con node (aparicion.check.mjs).

// Mínimo entre los hombros y el pez, en largos de tronco. Con los brazos colgando las manos quedan a ~0,8 de
// los hombros y con el brazo estirado llegan a ~1,2: en 0,75 hay que levantar o abrir el brazo, sin forzar.
export const DISTANCIA_MIN_TRONCOS = 0.75

const visible = (p) => !!p && (p.visibility ?? 1) > 0.5
const medio = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

/**
 * El cuerpo del paciente en píxeles de pantalla.
 * @param lms        landmarks de MediaPipe (null si no hay)
 * @param aPantalla  convierte un landmark normalizado a píxeles de pantalla (kinetixAI.aPantalla)
 * @returns { x, y, distMin } con (x, y) en los hombros, o null si no se ve el tronco
 */
export function cuerpoEnPantalla(lms, aPantalla, minTroncos = DISTANCIA_MIN_TRONCOS) {
  if (!lms || ![lms[11], lms[12], lms[23], lms[24]].every(visible)) return null
  const hombros = aPantalla(medio(lms[11], lms[12]))
  const caderas = aPantalla(medio(lms[23], lms[24]))
  const tronco = Math.hypot(caderas.x - hombros.x, caderas.y - hombros.y)
  if (!(tronco > 20)) return null // medida absurda: mejor no usarla
  return { x: hombros.x, y: hombros.y, distMin: tronco * minTroncos }
}

/**
 * Punto al azar dentro de la zona que cumpla la distancia mínima al cuerpo. Si la zona es tan chica que no
 * hay lugar, se queda con el más lejano de los intentos (nunca deja de aparecer el pez).
 */
export function elegirPunto({ xMin, xMax, yMin, yMax }, cuerpo, azar = Math.random, intentos = 40) {
  let mejor = null
  for (let i = 0; i < intentos; i++) {
    const p = { x: xMin + azar() * (xMax - xMin), y: yMin + azar() * (yMax - yMin) }
    if (!cuerpo) return p
    const d = Math.hypot(p.x - cuerpo.x, p.y - cuerpo.y)
    if (d >= cuerpo.distMin) return p
    if (!mejor || d > mejor.d) mejor = { ...p, d }
  }
  return { x: mejor.x, y: mejor.y }
}

/**
 * Hacia dónde nada el pez (1 = derecha, -1 = izquierda) y cuánto recorre. Se aleja del cuerpo: así va y
 * vuelve sin pasar nunca más cerca de lo que apareció. Con poco lugar para alejarse recorre menos.
 */
export function recorridoAlejandose(x, cuerpo, xMin, xMax, recorrido) {
  const dir = x >= cuerpo.x ? 1 : -1
  const sala = dir > 0 ? xMax - x : x - xMin
  return { dir, recorrido: Math.max(12, Math.min(recorrido, sala)) } // 12 px como mínimo: un recorrido de 0 clavaría el tween
}
