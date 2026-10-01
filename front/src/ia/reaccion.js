// Tiempo de reacción: desde que aparece un objetivo (pez/estrella) hasta que
// el paciente lo toca. Las escenas de Phaser avisan acá; KinetixAI lo lee al
// terminar para mandarlo con el resto de las métricas.

const apariciones = new Map() // id -> performance.now() cuando apareció
let tiempos = []              // segundos de cada toque

export function reiniciarReaccion() {
  apariciones.clear()
  tiempos = []
  ultimoToque = null
}

export function objetivoAparece(id) {
  apariciones.set(id, performance.now())
}

// Hay varios objetivos a la vez, así que se mide desde el último toque (o
// desde que apareció este, si fue después): si no, el tiempo se inflaría
// mientras el paciente toca los otros.
let ultimoToque = null

export function objetivoTocado(id) {
  const aparecio = apariciones.get(id)
  if (aparecio == null) return
  apariciones.delete(id)
  const ahora = performance.now()
  const desde = ultimoToque == null ? aparecio : Math.max(aparecio, ultimoToque)
  tiempos.push((ahora - desde) / 1000)
  ultimoToque = ahora
}

// Mediana en segundos (más robusta que el promedio a un toque muy lento); null si hay pocos toques.
export function tiempoReaccionMediana() {
  if (tiempos.length < 3) return null
  const orden = [...tiempos].sort((a, b) => a - b)
  const medio = Math.floor(orden.length / 2)
  const v = orden.length % 2 ? orden[medio] : (orden[medio - 1] + orden[medio]) / 2
  return Math.round(v * 100) / 100
}
