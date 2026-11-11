// Postura general mientras se juega: ¿el paciente está bien parado como para que lo que haga cuente?
// Si no, no se suma puntaje y se le dice por qué. Es la versión de la webapp de `checkGlobalPosition` de la
// app de Android de Micaela (micabod/pose-landmarker, MovementAnalyzer.kt, 26/10/2026), con una diferencia a propósito:
// la calibración de la webapp (calibracion.js) pide solo el tronco para el Surf, que se juega con las manos y a
// veces con las piernas fuera de cuadro, así que acá el Surf tampoco pide piernas. El Flamenco sí pide las rodillas.
//
// A diferencia de calibracion.js (que corre antes de empezar y guía con la silueta), esto corre en cada cuadro
// de la partida y solo avisa cuando algo se rompe en serio: los umbrales son flexibles.

const VISIBILIDAD_MIN = 0.3
const BORDE = 0.02                 // un punto a menos de esto del borde del cuadro se considera cortado
const TRONCO_MIN = 0.08            // largo hombros→caderas, como fracción del alto del cuadro: menos = muy lejos
const TRONCO_MAX = 0.55            // y más = muy cerca (la calibración deja llegar hasta ~0,46)
const ANCHO_HOMBROS_MIN = 0.06     // de costado, el ancho de hombros y caderas se achica mucho
const ANCHO_CADERAS_MIN = 0.05

const TRONCO = [11, 12, 23, 24]    // hombros y caderas
const CON_RODILLAS = [...TRONCO, 25, 26]

const enCuadro = (p) =>
  !!p && (p.visibility ?? 1) >= VISIBILIDAD_MIN && p.x >= BORDE && p.x <= 1 - BORDE && p.y >= BORDE && p.y <= 1 - BORDE

/**
 * @param lms       landmarks de MediaPipe (normalizados 0–1), o null si no se ve a nadie
 * @param requiere  qué tiene que estar en cuadro: 'torso' (Surf) | 'rodillas' (Flamenco: además las rodillas)
 * @returns { ok, pista }  pista: null | 'cuadro' | 'cerca' | 'lejos' | 'frente'
 */
export function evaluarPostura(lms, requiere = 'torso') {
  if (!lms) return { ok: false, pista: 'cuadro' }
  const puntos = requiere === 'rodillas' ? CON_RODILLAS : TRONCO
  if (!puntos.every((i) => enCuadro(lms[i]))) return { ok: false, pista: 'cuadro' }

  const [hi, hd, ci, cd] = [lms[11], lms[12], lms[23], lms[24]]
  const tronco = Math.abs((ci.y + cd.y) / 2 - (hi.y + hd.y) / 2)
  if (tronco < TRONCO_MIN) return { ok: false, pista: 'lejos' }
  if (tronco > TRONCO_MAX) return { ok: false, pista: 'cerca' }

  if (Math.abs(hi.x - hd.x) < ANCHO_HOMBROS_MIN || Math.abs(ci.x - cd.x) < ANCHO_CADERAS_MIN) return { ok: false, pista: 'frente' }
  return { ok: true, pista: null }
}

// Cuánto tiene que durar el problema para avisar (un cuadro dudoso no avisa) y cada cuánto se repite el aviso
const AVISO_TRAS_MS = 1000
const REPETIR_MS = 6000

export const ESTADO_POSTURA = { malDesde: null, ultimoAviso: -Infinity }

/**
 * Cuándo avisar de la postura. Se llama cada ~100 ms con la postura de ese momento.
 * @returns { est, pista }  pista = la que hay que decir ahora, o null si no toca avisar
 */
export function vigilarPostura(est, postura, ahora) {
  if (!postura || postura.ok) return { est: { ...est, malDesde: null }, pista: null }
  const malDesde = est.malDesde ?? ahora
  const toca = ahora - malDesde >= AVISO_TRAS_MS && ahora - est.ultimoAviso >= REPETIR_MS
  return { est: { malDesde, ultimoAviso: toca ? ahora : est.ultimoAviso }, pista: toca ? postura.pista : null }
}
