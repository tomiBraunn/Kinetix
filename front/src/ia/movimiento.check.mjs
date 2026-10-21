// Prueba de movimiento.js con node: node src/ia/movimiento.check.mjs
import assert from 'node:assert/strict'
import { medirCuerpo, promediarBase, desplazamiento, vigilar, ESTADO_INICIAL, UMBRAL_TRONCOS, SOSTENER_MS, ENFRIAR_MS, REFUERZO_MS } from './movimiento.js'

const lm = (x, y, v = 0.99) => ({ x, y, z: 0, visibility: v })
// Parado de frente: hombros y .30, caderas y .50 (tronco = .20 en alto), tobillos y .90; imagen 3:4 (aspecto .75)
const cuerpo = (c = {}) => {
  const L = Array.from({ length: 33 }, () => lm(0.5, 0.5, 0))
  L[11] = lm(0.55, 0.3); L[12] = lm(0.45, 0.3); L[23] = lm(0.53 + (c.dx ?? 0), 0.5 + (c.dy ?? 0)); L[24] = lm(0.47 + (c.dx ?? 0), 0.5 + (c.dy ?? 0))
  if (!c.sinPies) { L[27] = lm(0.53 + (c.pdx ?? 0), 0.9); L[28] = lm(0.47 + (c.pdx ?? 0), 0.9) }
  return L
}
const A = 0.75

// ─ medirCuerpo
const m = medirCuerpo(cuerpo(), A)
assert.ok(Math.abs(m.tronco - 0.2) < 1e-9, 'el tronco es el largo hombros→caderas (0,20 de alto)')
assert.ok(m.pies && Math.abs(m.pies.y - 0.9) < 1e-9, 'con los tobillos a la vista hay pies')
assert.equal(medirCuerpo(cuerpo({ sinPies: true }), A).pies, null, 'sin tobillos no hay pies (el Surf pide hasta la cintura)')
assert.equal(medirCuerpo(null, A), null, 'sin cuerpo')
const sinCadera = cuerpo(); sinCadera[23] = lm(0.5, 0.5, 0.1)
assert.equal(medirCuerpo(sinCadera, A), null, 'sin una cadera no se puede medir')
assert.equal(medirCuerpo(cuerpo({ dy: -0.2 }), A), null, 'tronco de largo cero')
const fuera = cuerpo(); fuera[27] = lm(0.5, 0.99)
assert.equal(medirCuerpo(fuera, A).pies, null, 'un tobillo en el borde del cuadro no cuenta')

// ─ base y desplazamiento
const base = promediarBase([medirCuerpo(cuerpo(), A), medirCuerpo(cuerpo({ dx: 0.002 }), A), null])
assert.ok(base && base.tronco > 0.19 && base.tronco < 0.21, 'promedia los cuadros que sirven y salta los que no')
assert.equal(promediarBase([null, null]), null, 'sin ningún cuadro bueno no hay base')
const quieto = desplazamiento(base, medirCuerpo(cuerpo(), A))
assert.ok(quieto.cadera < 0.02 && quieto.pies < 0.02, 'sin moverse, desplazamiento ~0')
// un paso al costado: la cadera y los pies se corren 0,08 del ancho = 0,06 de alto = 0,3 troncos
const base1 = promediarBase([medirCuerpo(cuerpo(), A)])
const paso = desplazamiento(base1, medirCuerpo(cuerpo({ dx: 0.08, pdx: 0.08 }), A))
assert.ok(paso.cadera > 0.29 && paso.cadera < 0.31 && paso.pies > 0.29, `un paso: ${JSON.stringify(paso)}`)
// el mismo paso con el paciente al doble de lejos (todo a la mitad): mismo desplazamiento en troncos
const lejos = (L) => L.map((p) => ({ ...p, x: 0.5 + (p.x - 0.5) / 2, y: 0.5 + (p.y - 0.5) / 2 }))
const baseLejos = promediarBase([medirCuerpo(lejos(cuerpo()), A)])
const pasoLejos = desplazamiento(baseLejos, medirCuerpo(lejos(cuerpo({ dx: 0.08, pdx: 0.08 })), A))
assert.ok(Math.abs(pasoLejos.cadera - paso.cadera) < 1e-9, 'el tamaño del paciente en la imagen no cambia la medida')
// agacharse: la cadera baja
assert.ok(desplazamiento(base, medirCuerpo(cuerpo({ dy: 0.08 }), A)).cadera > UMBRAL_TRONCOS, 'agacharse también es moverse de más')
// inclinar el tronco: se corren los hombros y casi nada las caderas
const inclinado = cuerpo(); inclinado[11] = lm(0.65, 0.32); inclinado[12] = lm(0.55, 0.32)
assert.ok(desplazamiento(base, medirCuerpo(inclinado, A)).cadera < 0.05, 'inclinar el tronco NO cuenta como moverse')
// con tobillos solo en uno de los dos (base o actual) no se compara
assert.equal(desplazamiento(base, medirCuerpo(cuerpo({ sinPies: true }), A)).pies, null)
assert.equal(desplazamiento(null, m), null)

// ─ vigilar: la alerta sale si se sostiene y no insiste
let est = { ...ESTADO_INICIAL, ultimoMensaje: 0 } // empezó la ronda en t=0
const mal = { cadera: 0.5, pies: 0.5 }, bien = { cadera: 0.05, pies: 0.05 }
let r = vigilar(est, mal, 1000)
assert.equal(r.alerta, false, 'apenas se movió: todavía no (puede ser un temblor)')
est = r.est
r = vigilar(est, mal, 1000 + SOSTENER_MS - 1)
assert.equal(r.alerta, false, 'un instante antes de sostenerlo, no')
r = vigilar(r.est, mal, 1000 + SOSTENER_MS)
assert.equal(r.alerta, true, 'sostenido: avisa')
est = r.est
r = vigilar(est, mal, 1000 + SOSTENER_MS + 500)
assert.equal(r.alerta, false, 'no insiste enseguida')
r = vigilar(r.est, bien, 1000 + SOSTENER_MS + 800)
r = vigilar(r.est, mal, 1000 + SOSTENER_MS + 1000); r = vigilar(r.est, mal, 1000 + SOSTENER_MS + 1000 + SOSTENER_MS)
assert.equal(r.alerta, false, 'sigue sin insistir dentro del enfriamiento')
r = vigilar(r.est, mal, 1000 + SOSTENER_MS + ENFRIAR_MS + 1000)
assert.equal(r.alerta, true, 'pasado el enfriamiento y si sigue moviéndose, avisa de nuevo')
assert.equal(vigilar(r.est, mal, 1000 + SOSTENER_MS + ENFRIAR_MS + 1500).alerta, false, 'y otra vez espera el enfriamiento')
// un temblor corto que vuelve antes de SOSTENER_MS no avisa
est = { ...ESTADO_INICIAL, ultimoMensaje: 0 }
r = vigilar(est, mal, 5000); r = vigilar(r.est, bien, 5300); r = vigilar(r.est, mal, 5600)
assert.equal(r.alerta, false, 'cortado a tiempo: reinicia la cuenta')
// solo los pies o solo la cadera alcanzan
assert.equal(vigilar({ ...ESTADO_INICIAL, ultimoMensaje: 0, desde: 0 }, { cadera: 0.05, pies: 0.6 }, SOSTENER_MS).alerta, true, 'solo los pies')
assert.equal(vigilar({ ...ESTADO_INICIAL, ultimoMensaje: 0, desde: 0 }, { cadera: 0.6, pies: null }, SOSTENER_MS).alerta, true, 'solo la cadera (sin tobillos a la vista)')
assert.equal(vigilar({ ...ESTADO_INICIAL, ultimoMensaje: 0 }, null, 1000).alerta, false, 'sin cuerpo no hay alerta')

// ─ refuerzo: felicita después de un rato bien, una sola vez, sin pisar otros mensajes
est = { ...ESTADO_INICIAL, ultimoMensaje: 0 }
r = vigilar(est, bien, REFUERZO_MS - 1)
assert.equal(r.refuerzo, false, 'todavía no pasó el tiempo')
r = vigilar(r.est, bien, REFUERZO_MS)
assert.equal(r.refuerzo, true, 'un rato bien: lo felicita')
r = vigilar(r.est, bien, REFUERZO_MS + 1000)
assert.equal(r.refuerzo, false, 'una vez por rato, no seguido')
r = vigilar(r.est, bien, REFUERZO_MS * 2)
assert.equal(r.refuerzo, true, 'y de nuevo después de otro rato')
// si hubo un mensaje de la escena (felicitación por un pez), el reloj arranca de ahí
est = { ...ESTADO_INICIAL, ultimoMensaje: 0 }
r = vigilar(est, bien, REFUERZO_MS - 2000, true)
r = vigilar(r.est, bien, REFUERZO_MS + 100)
assert.equal(r.refuerzo, false, 'con un mensaje reciente de la escena no se felicita encima')
// moverse de más corta la racha
est = { ...ESTADO_INICIAL, ultimoMensaje: 0 }
r = vigilar(est, mal, REFUERZO_MS - 1000)
r = vigilar(r.est, bien, REFUERZO_MS + 1000)
assert.equal(r.refuerzo, false, 'recién se movió: no lo felicita')
assert.equal(vigilar({ ...ESTADO_INICIAL, ultimoMensaje: 0 }, null, REFUERZO_MS * 3).refuerzo, false, 'sin cuerpo a la vista no se felicita')

console.log('movimiento.js OK')
