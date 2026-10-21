// Dónde aparece cada pez del Surf. El kinesiólogo pidió que aparezcan sobre una curva por la parte de arriba
// de la pantalla: el paciente tiene que levantar los brazos e inclinar el tronco hacia cada lado, sin mover los
// pies. La curva es un arco centrado en los hombros del paciente, de modo que vale igual para quien está cerca
// o lejos de la cámara y para cualquier forma de pantalla (todo se mide en largos de tronco, hombros→caderas,
// como el resto de la calibración). Funciones puras: se prueban con node (aparicion.check.mjs).

const visible = (p) => !!p && (p.visibility ?? 1) > 0.5
const medio = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
const aRadianes = (grados) => (grados * Math.PI) / 180

/**
 * El cuerpo del paciente en píxeles de pantalla.
 * @param lms        landmarks de MediaPipe (null si no hay)
 * @param aPantalla  convierte un landmark normalizado a píxeles de pantalla (kinetixAI.aPantalla)
 * @returns { x, y, tronco } con (x, y) en los hombros y el largo del tronco en px, o null si no se ve el tronco
 */
export function cuerpoEnPantalla(lms, aPantalla) {
  if (!lms || ![lms[11], lms[12], lms[23], lms[24]].every(visible)) return null
  const hombros = aPantalla(medio(lms[11], lms[12]))
  const caderas = aPantalla(medio(lms[23], lms[24]))
  const tronco = Math.hypot(caderas.x - hombros.x, caderas.y - hombros.y)
  if (!(tronco > 20)) return null // medida absurda: mejor no usarla
  return { x: hombros.x, y: hombros.y, tronco }
}

/** Posición de un punto de la curva: `a` es el ángulo desde la vertical (0 = justo arriba de la cabeza). */
export function posicionEnArco(arco, a) {
  return { x: arco.cx + arco.R * Math.sin(a), y: arco.cy - arco.R * Math.cos(a) }
}

// Hasta dónde puede estirarse el radio en esa dirección sin salir del rectángulo visible (solo se limita
// el borde de arriba y los dos costados: hacia abajo no hay problema, la curva queda sobre los hombros).
function radioMaximo(centro, a, { xMin, xMax, yMin }) {
  const dx = Math.sin(a)
  const dy = -Math.cos(a)
  let r = Infinity
  if (dy < -1e-6) r = Math.min(r, (centro.y - yMin) / -dy)
  if (dx > 1e-6) r = Math.min(r, (xMax - centro.x) / dx)
  if (dx < -1e-6) r = Math.min(r, (centro.x - xMin) / -dx)
  return Math.max(0, r)
}

/**
 * La curva por la que nada un pez.
 * @param centro   { x, y } los hombros del paciente en pantalla
 * @param tronco   largo del tronco en px
 * @param zona     { radio, ancho, deriva }: radio en troncos (ya sorteado dentro de la zona, ver curva.js), semiancho de la
 *                 zona en grados hacia cada lado de la vertical y cuántos grados se desplaza el pez por la curva
 * @param limites  { xMin, xMax, yMin }: rectángulo visible donde tiene que caber
 * @param lado     1 o -1: de qué lado del paciente aparece (se alterna para que no sea siempre el mismo)
 * @returns { cx, cy, R, a0, a1 }: centro, radio y ángulo de partida y de llegada de la deriva (a1 va hacia el centro)
 */
export function arcoDelPez(centro, tronco, zona, limites, lado = 1, azar = Math.random) {
  const a0 = lado * aRadianes(zona.ancho) * azar() // en todo el abanico de la zona, del centro hasta el borde
  const a1 = a0 - lado * aRadianes(zona.deriva)
  let R = tronco * zona.radio
  // Si la curva se saldría de la pantalla (por ejemplo apaisada, donde sobra poco alto) se achata: el radio
  // se reduce hasta que los dos extremos de la deriva entren. Pero nunca queda pegada al cuerpo.
  R = Math.min(R, radioMaximo(centro, a0, limites), radioMaximo(centro, a1, limites))
  return { cx: centro.x, cy: centro.y, R: Math.max(R, tronco * 0.5), a0, a1 }
}
