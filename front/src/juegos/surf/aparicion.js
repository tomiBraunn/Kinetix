// Dónde aparece cada pez del Surf. Antes caía en cualquier punto de la zona de cámara, o sea muchas veces
// pegado al pecho del paciente, que lo tocaba sin estirar el brazo, o (en pantalla apaisada) en un rango
// enorme que no se alcanzaba. Ahora se pide una distancia mínima y una máxima al cuerpo, medidas en largos
// de tronco (hombros→caderas) como el resto de la calibración, así vale igual para quien está cerca o lejos
// de la cámara y para cualquier forma de pantalla. Funciones puras: se prueban con node (aparicion.check.mjs).

// Mínimo entre los hombros y el pez, en largos de tronco. Con los brazos colgando las manos quedan a ~0,8 de
// los hombros y con el brazo estirado llegan a ~1,2: en 0,75 hay que levantar o abrir el brazo, sin forzar.
export const DISTANCIA_MIN_TRONCOS = 0.75

const visible = (p) => !!p && (p.visibility ?? 1) > 0.5
const medio = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

/**
 * El cuerpo del paciente en píxeles de pantalla.
 * @param lms         landmarks de MediaPipe (null si no hay)
 * @param aPantalla   convierte un landmark normalizado a píxeles de pantalla (kinetixAI.aPantalla)
 * @param minTroncos  distancia mínima de un pez a los hombros, en largos de tronco
 * @param maxTroncos  distancia máxima (hasta dónde llega el brazo); null = sin tope
 * @returns { x, y, tronco, distMin, distMax } con (x, y) en los hombros, o null si no se ve el tronco
 */
export function cuerpoEnPantalla(lms, aPantalla, minTroncos = DISTANCIA_MIN_TRONCOS, maxTroncos = null) {
  if (!lms || ![lms[11], lms[12], lms[23], lms[24]].every(visible)) return null
  const hombros = aPantalla(medio(lms[11], lms[12]))
  const caderas = aPantalla(medio(lms[23], lms[24]))
  const tronco = Math.hypot(caderas.x - hombros.x, caderas.y - hombros.y)
  if (!(tronco > 20)) return null // medida absurda: mejor no usarla
  return { x: hombros.x, y: hombros.y, tronco, distMin: tronco * minTroncos, distMax: maxTroncos == null ? null : tronco * maxTroncos }
}

/**
 * Punto al azar dentro de la zona que esté entre la distancia mínima y la máxima al cuerpo y fuera de los
 * rectángulos `evitar` (carteles: un pez detrás de un cartel no se ve). Si no hay lugar, se queda con el
 * intento que menos se pasa (nunca deja de aparecer el pez).
 */
export function elegirPunto({ xMin, xMax, yMin, yMax }, cuerpo, azar = Math.random, intentos = 40, evitar = []) {
  let mejor = null
  for (let i = 0; i < intentos; i++) {
    const p = { x: xMin + azar() * (xMax - xMin), y: yMin + azar() * (yMax - yMin) }
    let falta = evitar.some((r) => p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1) ? 1000 : 0
    if (cuerpo) {
      const d = Math.hypot(p.x - cuerpo.x, p.y - cuerpo.y)
      if (d < cuerpo.distMin) falta += cuerpo.distMin - d
      else if (cuerpo.distMax != null && d > cuerpo.distMax) falta += d - cuerpo.distMax
    }
    if (falta === 0) return p
    if (!mejor || falta < mejor.falta) mejor = { ...p, falta }
  }
  return { x: mejor.x, y: mejor.y }
}

/**
 * Recorta la zona a lo que alcanza el brazo (distMax alrededor de los hombros). Si queda demasiado chica
 * (cuerpo pegado a un borde) se deja la zona entera.
 */
export function zonaAlcance(zona, cuerpo) {
  if (!cuerpo || cuerpo.distMax == null) return zona
  const z = {
    xMin: Math.max(zona.xMin, cuerpo.x - cuerpo.distMax), xMax: Math.min(zona.xMax, cuerpo.x + cuerpo.distMax),
    yMin: Math.max(zona.yMin, cuerpo.y - cuerpo.distMax), yMax: Math.min(zona.yMax, cuerpo.y + cuerpo.distMax),
  }
  return z.xMax - z.xMin >= 100 && z.yMax - z.yMin >= 60 ? z : zona
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
