import assert from 'node:assert/strict'
import { medirPiernas, evaluarPierna, DESPEGUE_MIN, ALTURA_ALTA_MIN } from './piernas.js'

// Paciente de frente, de pie: hombros en y=0,3 y caderas en y=0,5 (un torso mide 0,2), rodillas en 0,7 y tobillos en 0,9.
// `cambios` pisa landmarks puntuales: { 28: { y: 0.7 } } levanta el tobillo derecho.
const lm = (x, y, visibility = 0.99) => ({ x, y, z: 0, visibility })
function cuerpo(cambios = {}) {
  const L = Array.from({ length: 33 }, () => lm(0.5, 0.5))
  L[11] = lm(.55, .3); L[12] = lm(.45, .3); L[23] = lm(.53, .5); L[24] = lm(.47, .5)
  L[25] = lm(.53, .7); L[26] = lm(.47, .7); L[27] = lm(.53, .9); L[28] = lm(.47, .9)
  for (const [i, c] of Object.entries(cambios)) L[i] = { ...L[i], ...c }
  return L
}
const FLAMENCO_DER = { lado: 'der', posicion: 'flamenco' }
const ALTO_DER = { lado: 'der', posicion: 'alto' }
const ev = (cambios, pedido, activa = false) => evaluarPierna(medirPiernas(cuerpo(cambios)), pedido, activa)
const cerca = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`)

// ─ de pie: nada cumple, la altura de la rodilla ronda -1 torso
const dePie = ev({}, FLAMENCO_DER)
assert.deepEqual([dePie.cumple, dePie.arriba, dePie.otra], [false, false, false])
cerca(dePie.altura, -1)
assert.equal(ev({}, ALTO_DER).cumple, false)

// ─ flamenco: el tobillo derecho sube 0,04 (= 0,2 torsos, por encima del mínimo de 0,15)
const flamenco = { 28: { y: 0.86 }, 26: { y: 0.62 } }
const f = ev(flamenco, FLAMENCO_DER)
assert.deepEqual([f.cumple, f.arriba, f.otra], [true, true, false])
cerca(f.altura, -0.6)
assert.equal(ev(flamenco, ALTO_DER).cumple, false, 'pie despegado pero la rodilla sigue baja: no es "alto"')
assert.equal(ev(flamenco, ALTO_DER).arriba, true, 'y se sabe que el pie está despegado (para pedirle que suba más)')
// la pierna equivocada
const izqPedida = ev(flamenco, { lado: 'izq', posicion: 'flamenco' })
assert.deepEqual([izqPedida.cumple, izqPedida.otra], [false, true], 'levantó la derecha cuando se pidió la izquierda')
// sin lado pedido vale cualquiera
assert.equal(ev(flamenco, { lado: null, posicion: 'flamenco' }).cumple, true)
assert.equal(ev({ 27: { y: 0.86 } }, { lado: null, posicion: 'flamenco' }).cumple, true, 'cualquiera, también la izquierda')

// ─ el límite y la histéresis: 0,1 torsos de despegue no alcanza… salvo que ya estuviera cumpliéndose
const casiDespegada = { 28: { y: 0.88 } } // 0,02 / 0,2 = 0,1
assert.equal(ev(casiDespegada, FLAMENCO_DER, false).cumple, false)
assert.equal(ev(casiDespegada, FLAMENCO_DER, true).cumple, true, 'ya arriba: tolera bajar un poco (sin rebotes)')
assert.equal(ev({ 28: { y: 0.9 - (DESPEGUE_MIN + 0.01) * 0.2 } }, FLAMENCO_DER).cumple, true, 'apenas sobre el mínimo')

// ─ alto: la rodilla derecha por encima de ALTURA_ALTA_MIN
const rodillaEn = (altura) => ({ 28: { y: 0.7 }, 26: { y: 0.5 - altura * 0.2 } }) // altura en torsos sobre la cadera
assert.equal(ev(rodillaEn(0), ALTO_DER).cumple, true, 'rodilla a la altura de la cadera')
assert.equal(ev(rodillaEn(0.3), ALTO_DER).cumple, true, 'rodilla por encima de la cadera')
assert.equal(ev(rodillaEn(ALTURA_ALTA_MIN - 0.05), ALTO_DER).cumple, false, 'por debajo del piso')
assert.equal(ev(rodillaEn(ALTURA_ALTA_MIN - 0.05), ALTO_DER, true).cumple, true, 'ya arriba: tolera 0,07')
assert.equal(ev(rodillaEn(ALTURA_ALTA_MIN - 0.2), ALTO_DER, true).cumple, false, 'pero no cualquier caída')
cerca(ev(rodillaEn(0.25), ALTO_DER).altura, 0.25)
// la altura que se informa es la de las pierna(s) pedida(s): sin lado, la más alta
cerca(ev({ 26: { y: 0.5 }, 25: { y: 0.6 } }, { lado: null, posicion: 'alto' }).altura, 0)
cerca(ev({ 26: { y: 0.5 }, 25: { y: 0.6 } }, { lado: 'izq', posicion: 'alto' }).altura, -0.5)

// ─ sin tobillos a la vista, la rodilla decide el "flamenco"
const sinTobillos = (y) => ({ 27: { visibility: 0.1 }, 28: { visibility: 0.1 }, 26: { y } })
assert.equal(ev(sinTobillos(0.58), FLAMENCO_DER).cumple, true, 'rodilla a -0,4: arriba')
assert.equal(ev(sinTobillos(0.7), FLAMENCO_DER).cumple, false, 'rodilla a -1: de pie')

// ─ lo que no se ve no se mide
assert.equal(medirPiernas(cuerpo({ 11: { visibility: 0.1 } })), null, 'sin un hombro no hay torso')
assert.equal(medirPiernas(cuerpo({ 23: { y: 0.3 }, 24: { y: 0.3 } })), null, 'torso de largo cero')
const sinRodilla = ev({ 26: { visibility: 0.1 } }, ALTO_DER)
assert.deepEqual([sinRodilla.cumple, sinRodilla.altura], [false, null], 'rodilla invisible: no cumple y no inventa una altura')

console.log('piernas.js OK')
