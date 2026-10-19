import { detectados as det, evaluar as ev, vistaPara as vp, PUNTOS_SILUETA as T, ESCALA_MIN, ESCALA_MAX } from './calibracion.js'
import assert from 'node:assert/strict'

const base = { dw: 1000, dh: 800 }               // encuadre base del video en el área (px)
const area = { w: 1000, h: 800 }
const guia = { left: 300, top: 100, width: 400, height: 700 }
const torsoGuia = guia.height * (T[6][1] - T[0][1]) // largo del tronco de la silueta, en px

// Paciente de frente: nariz, hombros, codos, muñecas, caderas (y opcionalmente piernas).
// `largo` = largo del tronco en px del área; `cx` = centro horizontal (0–1, video crudo).
function persona({ largo = torsoGuia, cx = 0.5, piernas = false, vis = 1 } = {}) {
  const sy = 0.3, hy = sy + largo / base.dh, ancho = 0.12
  const p = (x, y, visibility = vis) => ({ x, y, visibility })
  const lms = []
  lms[0] = p(cx, sy - 0.12)
  lms[11] = p(cx + ancho, sy); lms[12] = p(cx - ancho, sy)
  lms[13] = p(cx + ancho + 0.03, sy + 0.12); lms[14] = p(cx - ancho - 0.03, sy + 0.12)
  lms[15] = p(cx + ancho + 0.04, hy); lms[16] = p(cx - ancho - 0.04, hy)
  lms[23] = p(cx + 0.07, hy); lms[24] = p(cx - 0.07, hy)
  if (piernas) { lms[25] = p(cx + 0.07, 0.8); lms[26] = p(cx - 0.07, 0.8); lms[27] = p(cx + 0.07, 0.95); lms[28] = p(cx - 0.07, 0.95) }
  return lms
}

// ─ detectados: sin piernas, las 8 de arriba sí y las 4 de abajo no
const sinPiernas = det(persona())
assert.equal(sinPiernas.length, 12)
assert.deepEqual(sinPiernas, [true, true, true, true, true, true, true, true, false, false, false, false])
assert.deepEqual(det(persona({ piernas: true })), Array(12).fill(true), 'cuerpo entero')
assert.deepEqual(det([]), Array(12).fill(false), 'sin landmarks')
const tobilloAfuera = persona({ piernas: true }); tobilloAfuera[27].y = 1.2
assert.equal(det(tobilloAfuera).filter(Boolean).length, 11, 'un tobillo fuera del cuadro no cuenta')

// ─ evaluar
assert.equal(ev(persona(), base, guia, area).pista, 'ok', 'del tamaño de la silueta, sin piernas: alcanza')
assert.equal(ev(persona({ cx: 0.5 + 0.3 }), base, guia, area).pista, 'derecha', 'x crudo alto = hacia la derecha')
assert.equal(ev(persona({ cx: 0.5 - 0.3 }), base, guia, area).pista, 'izquierda')
assert.equal(ev(persona({ largo: torsoGuia * 2.4 }), base, guia, area).pista, 'cerca', 'torso 2.4 veces más grande: más cerca de lo que se puede compensar')
assert.equal(ev(persona({ largo: torsoGuia * 3.5 }), base, guia, area).pista, 'nucleo', 'tan cerca que las caderas salen del cuadro')
assert.equal(ev(persona({ largo: torsoGuia * 1.9 }), base, guia, area).pista, 'ok', 'casi al doble de tamaño: se compensa alejando la vista')
assert.equal(ev(persona({ largo: torsoGuia / 1.2 }), base, guia, area).pista, 'ok', 'algo más chico: se compensa acercando la vista')
assert.equal(ev(persona({ largo: torsoGuia / (ESCALA_MAX + 0.2) }), base, guia, area).pista, 'lejos')
assert.equal(ev(persona({ vis: 0.2 }), base, guia, area).pista, 'nucleo', 'poca visibilidad')
const sinCadera = persona(); delete sinCadera[23]
assert.equal(ev(sinCadera, base, guia, area).pista, 'nucleo', 'sin caderas no se puede medir el tronco')
assert.equal(ev([], base, guia, area).pista, 'nucleo')

// ─ requiere: el Surf se juega con las manos (solo tronco); el Flamenco necesita las rodillas
assert.equal(ev(persona(), base, guia, area, 'torso').pista, 'ok', 'torso es lo de siempre')
assert.equal(ev(persona(), base, guia, area, 'rodillas').pista, 'rodillas', 'sin rodillas a la vista el Flamenco no calibra')
assert.equal(ev(persona({ piernas: true }), base, guia, area, 'rodillas').pista, 'ok', 'con las rodillas a la vista sí')
const unaRodilla = persona({ piernas: true }); unaRodilla[26].y = 1.1
assert.equal(ev(unaRodilla, base, guia, area, 'rodillas').pista, 'rodillas', 'una rodilla fuera del cuadro cuenta como faltante')
const rodillaBorrosa = persona({ piernas: true }); rodillaBorrosa[25].visibility = 0.3
assert.equal(ev(rodillaBorrosa, base, guia, area, 'rodillas').pista, 'rodillas', 'rodilla con poca visibilidad: no se puede confiar')
const sinTobillos = persona({ piernas: true }); sinTobillos[27].y = 1.2; sinTobillos[28].y = 1.2
assert.equal(ev(sinTobillos, base, guia, area, 'rodillas').pista, 'ok', 'los tobillos no hacen falta: el Flamenco se arregla con la rodilla')
// el orden de las pistas: primero lo que se arregla acomodándose, al final las rodillas
assert.equal(ev(persona({ cx: 0.8 }), base, guia, area, 'rodillas').pista, 'derecha', 'descentrado y sin rodillas: primero que se corra')
assert.equal(ev(persona({ largo: torsoGuia * 2.4 }), base, guia, area, 'rodillas').pista, 'cerca', 'muy cerca y sin rodillas: primero que se aleje')
assert.equal(ev(persona({ largo: torsoGuia / (ESCALA_MAX + 0.2) }), base, guia, area, 'rodillas').pista, 'lejos')
assert.equal(ev(persona({ piernas: true }), base, guia, area, 'rodillas').medida.sx, 0.5, 'la medida del tronco sigue saliendo igual')

// ─ vistaPara: el centro de los hombros va al de la silueta, y el tronco queda del largo de la guía
const grande = persona({ largo: torsoGuia * 1.6 })
const medida = { sx: 0.5, sy: grande[11].y, hx: 0.5, hy: grande[23].y }
const { escala, vista } = vp(medida, base, guia, area)
assert.ok(Math.abs(escala - 1 / 1.6) < 1e-9, 'achica en 1/1.6, dio ' + escala)
assert.ok(Math.abs(vista.s - escala) < 1e-9, 'dentro de los límites: sin acotar')
assert.equal(vista.qx, (guia.left + guia.width / 2) / area.w)
assert.equal(vista.qy, (guia.top + T[0][1] * guia.height) / area.h)
assert.ok(Math.abs(Math.hypot(0, (medida.hy - medida.sy) * base.dh) * vista.s - torsoGuia) < 1e-6, 'tronco final = tronco de la guía')
assert.equal(vp({ ...medida, hy: medida.sy + 0.9 }, base, guia, area).vista.s, ESCALA_MIN, 'se acota por abajo')
console.log('calibracion.js OK')
