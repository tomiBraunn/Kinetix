// Coordinación mano–vista: qué tan directo es el movimiento de la mano hacia
// el objetivo. Para cada toque se toma el camino que hizo la muñeca desde el
// toque anterior y se compara la línea recta (inicio → toque) con el largo
// real recorrido. 1 = camino perfectamente directo; cerca de 0 = muchas
// vueltas. Módulo puro (sin MediaPipe ni DOM) para poder probarlo solo.

// Coordenadas normalizadas 0–1 (las de MediaPipe).
const PASO_MINIMO = 0.004  // ignora el temblor del tracking entre frames
const LARGO_MINIMO = 0.05  // trayectos más cortos no dicen nada (la mano ya estaba ahí)

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

// puntos: [{x, y}] de una mano, en orden. Devuelve 0–1, o null si no alcanza.
export function eficienciaDeTrayecto(puntos) {
  if (!puntos || puntos.length < 2) return null

  let largo = 0
  let previo = puntos[0]
  for (let i = 1; i < puntos.length; i++) {
    const d = dist(previo, puntos[i])
    if (d >= PASO_MINIMO) {
      largo += d
      previo = puntos[i]
    }
  }
  if (largo < LARGO_MINIMO) return null

  return Math.min(1, dist(puntos[0], previo) / largo)
}

// Promedio de varios trayectos como score 0–100; null si hay pocos.
export function coordinacionScore(eficiencias, minimo = 3) {
  if (eficiencias.length < minimo) return null
  const prom = eficiencias.reduce((a, b) => a + b, 0) / eficiencias.length
  return Math.round(prom * 100)
}
