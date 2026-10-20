// Análisis de la IA al terminar una ronda del Surf, comparado con la ronda anterior. Función pura: se
// prueba con node (analisis.check.mjs). Los números salen de kinetixAI.getMetricasResumen(); acá solo se
// ordenan, se formatean y se comparan. Un dato que la IA no pudo medir (pocas muestras) queda como "—":
// no se inventa ningún número.
//
// Cada métrica dice para qué lado es mejor y cuánto es "igual" (el ruido normal de una ronda a otra):
//   estabilidad     0–100, más alto es mejor (cuánto se movió el centro de la cadera)
//   rango           grados entre el brazo más flexionado y el más estirado, más es mejor
//   coordinación    0–100, más alto es mejor (qué tan directo fue el camino de la mano a cada pez)
//   reacción        segundos desde que aparece el pez hasta que se lo toca, menos es mejor
const METRICAS = [
  { clave: 'estabilidad_score', etiqueta: 'Estabilidad', sufijo: '/100', mejorSi: 'alto', igual: 2, decimales: 0 },
  { clave: 'rango_movimiento_max', etiqueta: 'Rango de movimiento', sufijo: '°', mejorSi: 'alto', igual: 3, decimales: 0 },
  { clave: 'coordinacion', etiqueta: 'Coordinación', sufijo: '/100', mejorSi: 'alto', igual: 2, decimales: 0 },
  { clave: 'tiempo_reaccion_s', etiqueta: 'Tiempo de reacción', sufijo: ' s', mejorSi: 'bajo', igual: 0.1, decimales: 1 },
]

const hay = (v) => typeof v === 'number' && Number.isFinite(v)
const numero = (v, decimales) => v.toFixed(decimales).replace('.', ',') // en español la coma es el decimal

/**
 * @param actual  getMetricasResumen() de la ronda que terminó
 * @param previa  el de la ronda anterior, o null si es la primera
 * @returns { filas, hayPrevia, frase }
 *   fila = { clave, etiqueta, texto: "82/100" o "—", estado: 'mejor' | 'peor' | 'igual' | null,
 *            delta: texto con signo y flecha ("▲ 6") o '' }
 *   estado es null cuando no hay con qué comparar (primera ronda o falta alguno de los dos números).
 */
export function compararRondas(actual, previa) {
  const filas = METRICAS.map((m) => {
    const v = actual?.[m.clave]
    const p = previa?.[m.clave]
    const fila = { clave: m.clave, etiqueta: m.etiqueta, texto: hay(v) ? `${numero(v, m.decimales)}${m.sufijo}` : '—', estado: null, delta: '' }
    if (!hay(v) || !hay(p)) return fila
    const d = v - p
    if (Math.abs(d) < m.igual) return { ...fila, estado: 'igual', delta: '= igual' }
    const mejora = m.mejorSi === 'alto' ? d > 0 : d < 0
    return { ...fila, estado: mejora ? 'mejor' : 'peor', delta: `${d > 0 ? '▲' : '▼'} ${numero(Math.abs(d), m.decimales)}${m.sufijo === '/100' ? '' : m.sufijo}` }
  })
  const hayPrevia = !!previa
  return { filas, hayPrevia, frase: fraseDe(filas, hayPrevia) }
}

// Una frase corta y amable (se muestra y se lee). Nunca reprocha: lo que bajó se dice como "un poco por debajo".
function fraseDe(filas, hayPrevia) {
  if (filas.every((f) => f.texto === '—')) return 'No hubo datos suficientes para analizar esta ronda.'
  if (!hayPrevia) return 'Primera ronda analizada. En la próxima la comparamos con esta.'
  const nombres = (estado) => filas.filter((f) => f.estado === estado).map((f) => f.etiqueta.toLowerCase())
  const lista = (a) => (a.length > 1 ? `${a.slice(0, -1).join(', ')} y ${a.at(-1)}` : a[0])
  const mejor = nombres('mejor'), peor = nombres('peor')
  if (mejor.length && !peor.length) return `Mejoraste en ${lista(mejor)} respecto de la ronda anterior.`
  const quedo = peor.length > 1 ? 'quedaron' : 'quedó'
  if (mejor.length) return `Mejoraste en ${lista(mejor)}; ${lista(peor)} ${quedo} un poco por debajo.`
  if (peor.length) return `En esta ronda ${lista(peor)} ${quedo} un poco por debajo de la anterior. ¡En la próxima tenés otra oportunidad!`
  if (filas.some((f) => f.estado === 'igual')) return 'Mantuviste el nivel de la ronda anterior.'
  return 'Todavía no hay datos suficientes para compararla con la anterior.'
}
