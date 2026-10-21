// Movimientos de más. El Surf se juega con el tronco y los brazos (así lo pidió el kinesiólogo): los pies y las
// caderas se quedan en su lugar. Si el paciente da un paso, arrastra los pies o se agacha, la IA lo avisa.
// Funciones puras: se prueban con node (movimiento.check.mjs); KinetixAI guarda la línea de base y GamePage
// muestra y dice los avisos.
//
// Todo se mide en "largos de tronco" (hombros→caderas), como el resto de la calibración, así vale igual cerca
// o lejos de la cámara. Como x e y de MediaPipe son fracciones de ancho y de alto, x se multiplica por el
// aspecto de la imagen para que las dos tengan la misma unidad.

export const UMBRAL_TRONCOS = 0.3     // cuánto se puede apartar la cadera o los pies de donde empezó la ronda
export const SOSTENER_MS = 700        // el apartamiento tiene que durar esto: un temblor no es un paso
export const ENFRIAR_MS = 9000        // entre una alerta y la siguiente (para ancianos: no insistir)
export const REFUERZO_MS = 12000      // tanto tiempo bien (y sin otro mensaje) y la IA lo felicita

const visible = (p) => !!p && (p.visibility ?? 1) > 0.5
const enCuadro = (p) => visible(p) && p.y > 0.02 && p.y < 0.98
const medio = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

/**
 * Posición del cuerpo en un cuadro: { cadera, pies, tronco } (pies es null si los tobillos no se ven: el Surf
 * pide solo desde la cabeza hasta la cintura), o null si no hay tronco a la vista.
 */
export function medirCuerpo(lms, aspecto = 0.75) {
  if (!lms || ![lms[11], lms[12], lms[23], lms[24]].every(visible)) return null
  const u = (p) => ({ x: p.x * aspecto, y: p.y })
  const hombros = u(medio(lms[11], lms[12]))
  const cadera = u(medio(lms[23], lms[24]))
  const tronco = dist(hombros, cadera)
  if (!(tronco > 0.03)) return null // medida absurda: mejor no usarla
  const pies = enCuadro(lms[27]) && enCuadro(lms[28]) ? u(medio(lms[27], lms[28])) : null
  return { cadera, pies, tronco }
}

/** Promedio de varios cuadros iniciales: de ahí se mide cuánto se movió. */
export function promediarBase(muestras) {
  const ok = muestras.filter(Boolean)
  if (ok.length === 0) return null
  const prom = (f) => ok.reduce((a, m) => a + f(m), 0) / ok.length
  const conPies = ok.filter((m) => m.pies)
  return {
    cadera: { x: prom((m) => m.cadera.x), y: prom((m) => m.cadera.y) },
    pies: conPies.length >= ok.length / 2 ? { x: conPies.reduce((a, m) => a + m.pies.x, 0) / conPies.length, y: conPies.reduce((a, m) => a + m.pies.y, 0) / conPies.length } : null,
    tronco: prom((m) => m.tronco),
  }
}

/** Cuánto se apartó del lugar de la base, en troncos: { cadera, pies } (pies null si falta alguno de los dos datos). */
export function desplazamiento(base, actual) {
  if (!base || !actual) return null
  return {
    cadera: dist(base.cadera, actual.cadera) / base.tronco,
    pies: base.pies && actual.pies ? dist(base.pies, actual.pies) / base.tronco : null,
  }
}

export const ESTADO_INICIAL = { desde: null, ultimaAlerta: -Infinity, ultimoMensaje: -Infinity, ultimoMovimiento: -Infinity }

/**
 * Un paso del vigilante (se llama cada ~150 ms con la medida actual).
 * @param est         lo que devolvió la vez anterior (empezar con ESTADO_INICIAL; poner `ultimoMensaje: ahora` al empezar la ronda)
 * @param d           desplazamiento() o null si no hay cuerpo a la vista
 * @param hayMensaje  ya se está mostrando otro mensaje (de la escena): no se le pisa ni se felicita encima
 * @returns { est, alerta, refuerzo } — alerta: avisar que se movió; refuerzo: felicitar por estar bien
 */
export function vigilar(est, d, ahora, hayMensaje = false) {
  const excede = !!d && (d.cadera > UMBRAL_TRONCOS || (d.pies != null && d.pies > UMBRAL_TRONCOS))
  let { desde, ultimaAlerta, ultimoMensaje, ultimoMovimiento } = est
  let alerta = false
  let refuerzo = false
  if (excede) {
    ultimoMovimiento = ahora
    desde ??= ahora
    if (ahora - desde >= SOSTENER_MS && ahora - ultimaAlerta >= ENFRIAR_MS) { alerta = true; ultimaAlerta = ahora; ultimoMensaje = ahora }
  } else {
    desde = null
    if (hayMensaje) ultimoMensaje = ahora
    else if (d && ahora - Math.max(ultimoMensaje, ultimoMovimiento) >= REFUERZO_MS) { refuerzo = true; ultimoMensaje = ahora }
  }
  return { est: { desde, ultimaAlerta, ultimoMensaje, ultimoMovimiento }, alerta, refuerzo }
}
