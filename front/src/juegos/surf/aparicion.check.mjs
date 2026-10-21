// Prueba de aparicion.js con node: node src/juegos/surf/aparicion.check.mjs
import assert from 'node:assert/strict'
import { cuerpoEnPantalla, arcoDelPez, posicionEnArco } from './aparicion.js'
import { radioAlAzar } from './curva.js'

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
assert.deepEqual([c.x, c.y, c.tronco], [200, 320, 200])
assert.equal(cuerpoEnPantalla(null, aPantalla), null, 'sin landmarks')
assert.equal(cuerpoEnPantalla(persona({ 23: lm(0.55, 0.65, 0.2) }), aPantalla), null, 'una cadera que no se ve: no hay cómo medir el tronco')
assert.equal(cuerpoEnPantalla(persona({ 23: lm(0.55, 0.4), 24: lm(0.45, 0.4) }), aPantalla), null, 'tronco de largo cero')

// ─ la curva sale de la zona que se eligió: dentro de la pantalla, sobre los hombros, en su alto y su ancho
const limites = { xMin: 40, xMax: 360, yMin: 150 }
const azar = semilla(7)
const centro = { x: c.x, y: c.y }
const zonas = [
  { altoMin: 0.8, altoMax: 1.3, ancho: 60 }, // la de siempre
  { altoMin: 0.5, altoMax: 0.7, ancho: 25 }, // chica y baja
  { altoMin: 1.2, altoMax: 1.5, ancho: 85 }, // alta y muy abierta
  { altoMin: 1, altoMax: 1, ancho: 40 },     // alto fijo
]
for (const z of zonas) {
  const maxAng = (z.ancho * Math.PI) / 180
  for (let k = 0; k < 400; k++) {
    const lado = k % 2 ? 1 : -1
    const radio = radioAlAzar(z, azar)
    const arco = arcoDelPez(centro, c.tronco, { radio, ancho: z.ancho, deriva: 12 }, limites, lado, azar)
    for (const a of [arco.a0, arco.a1]) {
      const p = posicionEnArco(arco, a)
      assert.ok(p.y < c.y + 1e-6, `el pez queda por encima de los hombros (y ${p.y.toFixed(0)} vs ${c.y})`)
      assert.ok(p.x >= limites.xMin - 1e-6 && p.x <= limites.xMax + 1e-6 && p.y >= limites.yMin - 1e-6, `dentro de la pantalla (${p.x.toFixed(0)}, ${p.y.toFixed(0)})`)
      assert.ok(Math.abs(Math.hypot(p.x - c.x, p.y - c.y) - arco.R) < 1e-6, 'está sobre la curva (a distancia R de los hombros)')
    }
    assert.ok(arco.R >= c.tronco * 0.5 - 1e-6, 'nunca pegado al cuerpo')
    assert.ok(arco.R <= c.tronco * radio + 1e-6, 'nunca más lejos de lo sorteado (solo se achata si no entra)')
    assert.ok(Math.abs(arco.a0) <= maxAng + 1e-9, 'no pasa del ancho de la zona')
    assert.equal(Math.sign(arco.a0) || lado, lado, 'aparece del lado pedido')
  }
}

// ─ con lugar de sobra, el alto es exactamente el sorteado dentro de la zona (todas las alturas de la zona, ninguna fuera)
const holgado = { xMin: -1000, xMax: 1400, yMin: -1000 }
const z = { altoMin: 0.6, altoMax: 1.4, ancho: 60 }
const radios = Array.from({ length: 600 }, () => arcoDelPez(centro, c.tronco, { radio: radioAlAzar(z, azar), ancho: z.ancho, deriva: 10 }, holgado, 1, azar).R / c.tronco)
assert.ok(radios.every((r) => r >= z.altoMin - 1e-9 && r <= z.altoMax + 1e-9), 'ninguno fuera del alto de la zona')
assert.ok(Math.min(...radios) < 0.65 && Math.max(...radios) > 1.35, 'y aparecen a todas las alturas de la zona')

// ─ el ancho de la zona se aprovecha completo, a los dos lados, y también casi sobre la cabeza
const angulos = Array.from({ length: 800 }, (_, k) => arcoDelPez(centro, c.tronco, { radio: 1, ancho: 70, deriva: 10 }, holgado, k % 2 ? 1 : -1, azar).a0)
assert.ok(angulos.some((a) => a > 1.1) && angulos.some((a) => a < -1.1), 'se abren casi hasta el borde (70° ≈ 1,22 rad) a los dos lados')
assert.ok(angulos.some((a) => Math.abs(a) < 0.15), 'y también casi sobre la cabeza')
const angosta = Array.from({ length: 400 }, (_, k) => arcoDelPez(centro, c.tronco, { radio: 1, ancho: 20, deriva: 5 }, holgado, k % 2 ? 1 : -1, azar).a0)
assert.ok(angosta.every((a) => Math.abs(a) <= (20 * Math.PI) / 180 + 1e-9), 'una zona angosta de verdad queda angosta')

// ─ si no entra en la pantalla se achata (apaisada: poco alto), sin pegarse al cuerpo
const bajo = { xMin: 40, xMax: 360, yMin: 300 } // apenas 20 px sobre los hombros: no entra una curva alta
const achatada = arcoDelPez(centro, c.tronco, { radio: 1.35, ancho: 20, deriva: 5 }, bajo, 1, semilla(3))
assert.ok(achatada.R < c.tronco * 1.35 && achatada.R >= c.tronco * 0.5, 'si no entra se achata, sin pegarse al cuerpo')
// y a mayor radio, más arriba queda (a igual ángulo)
const fijo = () => 0.5
const r = (radio) => arcoDelPez(centro, c.tronco, { radio, ancho: 30, deriva: 8 }, holgado, 1, fijo).R
assert.ok(r(0.75) < r(1) && r(1) < r(1.25), 'más radio, más alto')

console.log('aparicion.js OK')
