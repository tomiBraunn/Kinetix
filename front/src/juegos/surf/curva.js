// La zona donde aparecen los peces del Surf, que fija el kinesiólogo de antemano en "Antes de empezar": qué tan
// arriba (alto) y qué tan abierta hacia los costados (ancho). Cada pez sale en un punto al azar de esa zona, o sea
// que si la zona es amplia aparecen a todas las alturas. Queda guardada en el equipo y también se puede dejar
// armada en la dirección, por ejemplo ?zona=0.8-1.3-60. Funciones puras (salvo guardar/leer): se prueban con
// node (curva.check.mjs).
//
// La zona es un sector de corona sobre el paciente, centrado en sus hombros (ver aparicion.js):
//   altoMin, altoMax  distancia a los hombros, en largos de tronco (más lejos = brazos más arriba)
//   ancho             grados hacia cada lado de la vertical (más grande = más inclinación del tronco)
// El tope de alto es 1,5 troncos: más lejos no llega el brazo sin dar un paso.
export const LIMITES = { alto: [0.5, 1.5], ancho: [20, 85] }
export const PASOS_ZONA = { alto: 0.05, ancho: 5 }
export const ZONA_INICIAL = { altoMin: 0.8, altoMax: 1.3, ancho: 60 }

const CLAVE = 'kinetix_surf_zona'

const limitar = (v, [min, max]) => Math.min(max, Math.max(min, v))
const ajustar = (v, paso) => Math.round(v / paso) * paso

/** Deja una zona válida: dentro de los límites, en pasos redondos y con el mínimo no mayor que el máximo. */
export function normalizarZona(z) {
  const num = (v, defecto) => (typeof v === 'number' && Number.isFinite(v) ? v : defecto)
  const a = limitar(ajustar(num(z?.altoMin, ZONA_INICIAL.altoMin), PASOS_ZONA.alto), LIMITES.alto)
  const b = limitar(ajustar(num(z?.altoMax, ZONA_INICIAL.altoMax), PASOS_ZONA.alto), LIMITES.alto)
  return {
    altoMin: +Math.min(a, b).toFixed(2),
    altoMax: +Math.max(a, b).toFixed(2),
    ancho: limitar(ajustar(num(z?.ancho, ZONA_INICIAL.ancho), PASOS_ZONA.ancho), LIMITES.ancho),
  }
}

/** A qué distancia de los hombros (en troncos) aparece un pez nuevo: al azar entre el mínimo y el máximo de la zona. */
export const radioAlAzar = (zona, azar = Math.random) => zona.altoMin + (zona.altoMax - zona.altoMin) * azar()

/** Texto corto de la zona (para el panel del kinesiólogo). */
export const describirZona = (z) => `alto ${String(z.altoMin).replace('.', ',')} a ${String(z.altoMax).replace('.', ',')} troncos · ancho ±${z.ancho}°`

/** La zona guardada; la URL (?zona=0.8-1.3-60) se aplica una vez por carga y pasa a lo guardado, como rotacion.js. */
let urlAplicada = false
export function leerZona() {
  try {
    if (!urlAplicada) {
      urlAplicada = true
      const m = /^(\d*\.?\d+)-(\d*\.?\d+)-(\d+)$/.exec(new URLSearchParams(window.location.search).get('zona') ?? '')
      if (m) guardarZona({ altoMin: +m[1], altoMax: +m[2], ancho: +m[3] })
    }
    return normalizarZona(JSON.parse(localStorage.getItem(CLAVE) ?? 'null'))
  } catch {
    return { ...ZONA_INICIAL }
  }
}

export function guardarZona(zona) {
  try { localStorage.setItem(CLAVE, JSON.stringify(normalizarZona(zona))) } catch { /* sin almacenamiento: vale por esta sesión */ }
}
