// Medición de las piernas del Flamenco a partir de los landmarks de MediaPipe. Son funciones puras
// (sin cámara ni React) para poder probarlas con node: piernas.check.mjs.
//
// Todo se mide en "largos de torso" (hombros → caderas, en vertical): así no depende de qué tan
// lejos está el paciente de la cámara.

export const DESPEGUE_MIN = 0.15      // "flamenco": el tobillo de la pierna levantada queda al menos esto más arriba que el otro
export const RODILLA_MIN = -0.55      // …y si no se ven los tobillos: la rodilla al menos a esta altura (0 = cadera; de pie ronda -0,8)
export const ALTURA_ALTA_MIN = -0.35  // "alto": rodilla a esta altura o más (la cadera flexionada unos 60°). Es un piso cómodo, no la meta: se mide hasta dónde llega
const HISTERESIS = 0.07               // ya cumplido, se tolera bajar esto antes de darlo por terminado (sin rebotes justo en el límite)
const VIS = 0.4                       // visibilidad mínima de un landmark para confiar en él

const LADOS = { der: { cadera: 24, rodilla: 26, tobillo: 28 }, izq: { cadera: 23, rodilla: 25, tobillo: 27 } }
const OTRO = { der: 'izq', izq: 'der' }
const visible = (p) => !!p && (p.visibility ?? 1) > VIS

/**
 * @param lms landmarks crudos de MediaPipe (normalizados 0–1; la y crece hacia abajo)
 * @returns null si no se ve el torso (no hay con qué medir); si no, por pierna:
 *   despegue: cuánto más arriba está su tobillo que el otro (null si no se ven los dos tobillos)
 *   altura:   cuánto más arriba que la cadera está su rodilla (0 = a la altura de la cadera, negativo = más abajo)
 */
export function medirPiernas(lms) {
  const [hI, hD, cI, cD] = [lms[11], lms[12], lms[23], lms[24]]
  if (![hI, hD, cI, cD].every(visible)) return null
  const torso = (cI.y + cD.y) / 2 - (hI.y + hD.y) / 2
  if (torso < 0.05) return null
  const med = {}
  for (const lado of ['der', 'izq']) {
    const m = LADOS[lado]
    const tobillo = lms[m.tobillo], otro = lms[LADOS[OTRO[lado]].tobillo], rodilla = lms[m.rodilla], cadera = lms[m.cadera]
    med[lado] = {
      despegue: visible(tobillo) && visible(otro) ? (otro.y - tobillo.y) / torso : null,
      altura: visible(rodilla) ? (cadera.y - rodilla.y) / torso : null,
    }
  }
  return med
}

const despegada = (m, h) => (m.despegue != null ? m.despegue >= DESPEGUE_MIN - h : m.altura != null && m.altura >= RODILLA_MIN - h)
const alta = (m, h) => m.altura != null && m.altura >= ALTURA_ALTA_MIN - h

/**
 * @param med     lo que devuelve medirPiernas
 * @param pedido  { lado: 'der' | 'izq' | null (null = cualquiera), posicion: 'flamenco' | 'alto' }
 * @param activa  ¿ya se estaba cumpliendo? Aplica la histéresis
 * @returns { cumple, arriba, otra, altura }
 *   cumple: la pierna pedida está en la posición pedida
 *   arriba: la pierna pedida tiene el pie despegado, aunque no llegue a "alto" (sirve para decir "subí un poco más")
 *   otra:   levantó la otra pierna en vez de la pedida
 *   altura: de la rodilla pedida, null si no se ve
 */
export function evaluarPierna(med, { lado, posicion }, activa) {
  const h = activa ? HISTERESIS : 0
  const candidatas = lado ? [lado] : ['der', 'izq']
  const cumpleLa = posicion === 'alto' ? alta : despegada
  const alturas = candidatas.map((l) => med[l].altura).filter((a) => a != null)
  return {
    cumple: candidatas.some((l) => cumpleLa(med[l], h)),
    arriba: candidatas.some((l) => despegada(med[l], 0)),
    otra: lado != null && !despegada(med[lado], 0) && despegada(med[OTRO[lado]], 0),
    altura: alturas.length ? Math.max(...alturas) : null,
  }
}
