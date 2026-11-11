import { evaluarPostura as ev, vigilarPostura as vig, ESTADO_POSTURA } from './postura.js'
import assert from 'node:assert/strict'

// Paciente de frente, centrado: hombros y caderas, y opcionalmente rodillas.
function persona({ sy = 0.3, hy = 0.55, rodillas = true, vis = 1 } = {}) {
  const p = (x, y, visibility = vis) => ({ x, y, visibility })
  const lms = []
  lms[11] = p(0.62, sy); lms[12] = p(0.38, sy)
  lms[23] = p(0.57, hy); lms[24] = p(0.43, hy)
  if (rodillas) { lms[25] = p(0.57, 0.78); lms[26] = p(0.43, 0.78) }
  return lms
}

// ─ evaluarPostura
assert.deepEqual(ev(persona()), { ok: true, pista: null }, 'de frente, a buena distancia')
assert.deepEqual(ev(persona({ rodillas: false })), { ok: true, pista: null }, 'el Surf no pide rodillas')
assert.deepEqual(ev(persona({ rodillas: false }), 'rodillas'), { ok: false, pista: 'cuadro' }, 'el Flamenco sí las pide')
assert.deepEqual(ev(null), { ok: false, pista: 'cuadro' }, 'sin nadie')

const cortada = persona(); cortada[12].x = 0.01
assert.equal(ev(cortada).pista, 'cuadro', 'un hombro pegado al borde')
const borrosa = persona(); borrosa[24].visibility = 0.1
assert.equal(ev(borrosa).pista, 'cuadro', 'cadera poco visible')

assert.equal(ev(persona({ sy: 0.4, hy: 0.45 })).pista, 'lejos', 'tronco chiquito')
assert.equal(ev(persona({ sy: 0.05, hy: 0.7 })).pista, 'cerca', 'tronco enorme')
assert.equal(ev(persona({ sy: 0.15, hy: 0.6 })).ok, true, 'cerca pero dentro de lo que acepta la calibración (0,45)')

const perfil = persona(); perfil[11].x = 0.52; perfil[12].x = 0.48
assert.equal(ev(perfil).pista, 'frente', 'de costado los hombros se juntan')
const caderasJuntas = persona(); caderasJuntas[23].x = 0.51; caderasJuntas[24].x = 0.49
assert.equal(ev(caderasJuntas).pista, 'frente', 'de costado las caderas se juntan')

// ─ vigilarPostura: avisa recién al segundo, y no más de una vez cada 6 s
const mal = { ok: false, pista: 'cerca' }
let r = vig(ESTADO_POSTURA, mal, 0)
assert.equal(r.pista, null, 'recién empieza el problema')
r = vig(r.est, mal, 900)
assert.equal(r.pista, null, 'todavía no pasó un segundo')
r = vig(r.est, mal, 1000)
assert.equal(r.pista, 'cerca', 'al segundo avisa')
r = vig(r.est, mal, 3000)
assert.equal(r.pista, null, 'no repite enseguida')
r = vig(r.est, mal, 7000)
assert.equal(r.pista, 'cerca', 'a los 6 s repite si sigue mal')
r = vig(r.est, { ok: true, pista: null }, 7100)
assert.equal(r.est.malDesde, null, 'al arreglarse se reinicia')
r = vig(r.est, mal, 7200)
assert.equal(r.pista, null, 'un problema nuevo vuelve a esperar')
assert.equal(vig(ESTADO_POSTURA, null, 0).pista, null, 'sin dato no avisa')

console.log('postura: ok')
