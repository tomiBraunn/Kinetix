// Prueba de manoCursor.js con node: node src/ia/manoCursor.check.mjs
import assert from 'node:assert/strict'
import { cursorDeMano, avanzarPermanencia, ESTADO_INICIAL, PERMANENCIA_MS } from './manoCursor.js'

const lm = (x, y, visibility = 0.99) => ({ x, y, z: 0, visibility })
// Cuerpo parado de frente: hombros en y .30, caderas en y .50 (tronco = .20), centro x .50, imagen 4:3 vertical
const cuerpo = (izq, der) => {
  const L = Array.from({ length: 33 }, () => lm(0.5, 0.5, 0))
  L[11] = lm(0.55, 0.3); L[12] = lm(0.45, 0.3); L[23] = lm(0.53, 0.5); L[24] = lm(0.47, 0.5)
  L[15] = izq ?? lm(0.6, 0.6); L[16] = der ?? lm(0.4, 0.6) // por defecto, colgando a los costados
  return L
}
const A = 0.75
const cerca = (a, b) => Math.abs(a - b) < 1e-9

// Manos abajo: no hay cursor (nadie elige nada parado con los brazos caídos)
assert.equal(cursorDeMano(cuerpo(), A), null, 'con las manos por debajo de las caderas no hay cursor')
assert.equal(cursorDeMano(null, A), null, 'sin cuerpo no hay cursor')
assert.equal(cursorDeMano(cuerpo(lm(0.6, 0.4, 0.2)), A), null, 'una mano que no se ve no cuenta')
const sinTronco = cuerpo(lm(0.6, 0.3)); sinTronco[23] = lm(0.5, 0.5, 0.1)
assert.equal(cursorDeMano(sinTronco, A), null, 'sin caderas a la vista no se sabe dónde está la caja')

// Mano a la altura de la cadera, al centro: abajo del todo; sube con la mano
let c = cursorDeMano(cuerpo(lm(0.5, 0.49)), A)
assert.ok(c.y > 0.9 && c.y <= 1, 'en la cadera: abajo de la pantalla ' + c.y)
assert.ok(cerca(c.x, 0.5 - ((0.5 - 0.5) * A) / 0.36), 'al centro del cuerpo: al centro')
c = cursorDeMano(cuerpo(lm(0.5, 0.3)), A) // a la altura de los hombros
assert.ok(Math.abs(c.y - (0.3 - (0.3 - 0.4 * 0.2)) / (0.5 - (0.3 - 0.4 * 0.2))) < 1e-9 && c.y > 0.2 && c.y < 0.3, 'a la altura de los hombros ~ un cuarto de la pantalla')
c = cursorDeMano(cuerpo(lm(0.5, 0.1)), A)
assert.equal(c.y, 0, 'muy arriba: se queda en el borde de arriba')

// Espejo: la mano izquierda del paciente (x de imagen mayor) cae del lado izquierdo de la pantalla
const izq = cursorDeMano(cuerpo(lm(0.62, 0.4)), A)
assert.equal(izq.lado, 'izq')
assert.ok(izq.x < 0.5, 'la mano que en la imagen está a la derecha se ve a la izquierda: ' + izq.x)
const der = cursorDeMano(cuerpo(null, lm(0.38, 0.4)), A)
assert.equal(der.lado, 'der')
assert.ok(der.x > 0.5, 'y la otra, a la derecha')
assert.ok(cerca(izq.x + der.x, 1), 'simétricas respecto del centro')
assert.equal(cursorDeMano(cuerpo(lm(0.9, 0.4)), A).x, 0, 'estirada a un costado: llega al borde')

// Misma proporción cerca o lejos de la cámara: el mismo gesto da el mismo punto
const lejos = cuerpo(lm(0.5 + 0.06 / 2, 0.4)).map((p) => ({ ...p })) // tronco .20; gesto de referencia
const chico = (L) => L.map((p) => ({ ...p, x: 0.5 + (p.x - 0.5) / 2, y: 0.5 + (p.y - 0.5) / 2 })) // el paciente a la mitad de tamaño
const a = cursorDeMano(lejos, A), b = cursorDeMano(chico(lejos), A)
assert.ok(Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.y - b.y) < 1e-9, 'el tamaño del paciente en la imagen no cambia el cursor')

// Con las dos manos arriba gana la más alta
c = cursorDeMano(cuerpo(lm(0.6, 0.45), lm(0.4, 0.3)), A)
assert.equal(c.lado, 'der', 'gana la mano más alta')

// Permanencia: elegir un botón quedándose encima
const boton = {}, otro = {}
let r = avanzarPermanencia(ESTADO_INICIAL, boton, 1000)
assert.deepEqual([r.progreso, r.dispara], [0, false], 'llega al botón: empieza a contar')
r = avanzarPermanencia(r.est, boton, 1000 + PERMANENCIA_MS / 2)
assert.ok(cerca(r.progreso, 0.5) && !r.dispara, 'a la mitad: medio círculo')
r = avanzarPermanencia(r.est, boton, 1000 + PERMANENCIA_MS)
assert.ok(r.dispara && r.progreso === 1, 'cumplido el tiempo: lo elige')
r = avanzarPermanencia(r.est, boton, 1000 + PERMANENCIA_MS + 50)
assert.ok(!r.dispara, 'no lo elige dos veces seguidas')
r = avanzarPermanencia(r.est, null, 9000)
assert.deepEqual([r.est, r.dispara], [ESTADO_INICIAL, false], 'al sacar la mano se reinicia')
r = avanzarPermanencia(r.est, boton, 9100)
r = avanzarPermanencia(r.est, otro, 9200)
assert.equal(r.progreso, 0, 'pasar a otro botón empieza de cero')
r = avanzarPermanencia(r.est, otro, 9200 + PERMANENCIA_MS - 1)
assert.ok(!r.dispara, 'un instante antes de tiempo todavía no')

console.log('manoCursor.js OK')
