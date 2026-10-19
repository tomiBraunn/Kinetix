import assert from 'node:assert/strict'
import { cuerpoEnPantalla, elegirPunto, recorridoAlejandose, DISTANCIA_MIN_TRONCOS } from './aparicion.js'

// Un azar repetible (para que el test no dependa de la suerte)
function semilla(n) { return () => { n = (n * 1664525 + 1013904223) % 4294967296; return n / 4294967296 } }

// "Pantalla" de 400×800 donde un landmark normalizado (x, y) cae en (x*400, y*800)
const aPantalla = ({ x, y }) => ({ x: x * 400, y: y * 800 })
const lm = (x, y, v = 0.99) => ({ x, y, visibility: v })
const persona = (cambios = {}) => {
  const L = []
  L[11] = lm(0.58, 0.4); L[12] = lm(0.42, 0.4); L[23] = lm(0.55, 0.65); L[24] = lm(0.45, 0.65)
  for (const [i, p] of Object.entries(cambios)) L[i] = p
  return L
}

// ─ cuerpoEnPantalla: hombros en (200, 320), caderas en (200, 520): tronco de 200 px
const c = cuerpoEnPantalla(persona(), aPantalla)
assert.deepEqual([c.x, c.y], [200, 320])
assert.equal(c.distMin, 200 * DISTANCIA_MIN_TRONCOS, 'la distancia mínima es en largos de tronco')
assert.equal(cuerpoEnPantalla(null, aPantalla), null, 'sin landmarks')
assert.equal(cuerpoEnPantalla(persona({ 23: lm(0.55, 0.65, 0.2) }), aPantalla), null, 'una cadera que no se ve: no hay cómo medir el tronco')
assert.equal(cuerpoEnPantalla(persona({ 23: lm(0.55, 0.4), 24: lm(0.45, 0.4) }), aPantalla), null, 'tronco de largo cero')
assert.equal(cuerpoEnPantalla(persona(), aPantalla, 1).distMin, 200, 'se puede pedir más')

// ─ elegirPunto: nunca más cerca que distMin cuando hay lugar (zona de cámara de 50..350 × 190..530)
const zona = { xMin: 50, xMax: 350, yMin: 190, yMax: 530 }
const azar = semilla(7)
for (let i = 0; i < 500; i++) {
  const p = elegirPunto(zona, c, azar)
  const d = Math.hypot(p.x - c.x, p.y - c.y)
  assert.ok(d >= c.distMin, `pez a ${d.toFixed(0)} px del cuerpo (mínimo ${c.distMin})`)
  assert.ok(p.x >= zona.xMin && p.x <= zona.xMax && p.y >= zona.yMin && p.y <= zona.yMax, 'dentro de la zona de cámara')
}
// Sin la regla, una parte de los peces caía encima del paciente (lo que se corrige)
const sinRegla = Array.from({ length: 500 }, () => elegirPunto(zona, null, azar))
const cerca = sinRegla.filter((p) => Math.hypot(p.x - c.x, p.y - c.y) < c.distMin).length
assert.ok(cerca > 50, `sin la regla ${cerca}/500 peces caían a menos de ${c.distMin} px (el problema real)`)
// Los de abajo y los de los costados: se usa toda la zona que queda
const lados = Array.from({ length: 500 }, () => elegirPunto(zona, c, azar))
assert.ok(lados.some((p) => p.x < c.x - 100) && lados.some((p) => p.x > c.x + 100), 'aparecen a los dos lados')
assert.ok(lados.some((p) => p.y < c.y - 100), 'y también arriba (con el brazo levantado)')

// ─ zona tan chica que no hay lugar: igual aparece, en el punto más lejano que encontró
const chica = { xMin: 190, xMax: 210, yMin: 300, yMax: 340 }
const p = elegirPunto(chica, c, semilla(1))
assert.ok(p.x >= 190 && p.x <= 210 && p.y >= 300 && p.y <= 340, 'dentro de la zona aunque no cumpla')
assert.ok(Math.hypot(p.x - c.x, p.y - c.y) >= 0, 'no se rompe')
// sin cuerpo (la IA no ve el tronco): como siempre, un punto de la zona
assert.ok(elegirPunto(zona, null, semilla(3)).x >= 50)

// ─ recorridoAlejandose: va y vuelve sin acercarse
assert.deepEqual(recorridoAlejandose(300, c, 50, 350, 100), { dir: 1, recorrido: 50 }, 'a la derecha del cuerpo: se aleja hacia la derecha, con el lugar que hay')
assert.deepEqual(recorridoAlejandose(100, c, 50, 350, 40), { dir: -1, recorrido: 40 }, 'a la izquierda: hacia la izquierda')
assert.equal(recorridoAlejandose(349, c, 50, 350, 100).recorrido, 12, 'sin lugar: un mínimo, nunca 0 (clavaría el tween)')
assert.equal(recorridoAlejandose(200, c, 50, 350, 80).dir, 1, 'justo en el eje: a la derecha')
const llega = (x) => { const r = recorridoAlejandose(x, c, 50, 350, 90); return x + r.dir * r.recorrido }
for (const x of [60, 120, 190, 210, 280, 340]) {
  assert.ok(Math.abs(llega(x) - c.x) >= Math.abs(x - c.x), `desde ${x} no pasa más cerca del cuerpo`)
}

console.log('aparicion.js OK')
