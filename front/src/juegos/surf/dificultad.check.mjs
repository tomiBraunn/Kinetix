// Prueba de dificultad.js con node: node src/juegos/surf/dificultad.check.mjs
import assert from 'node:assert/strict'
import { NIVELES, PECES_POR_NIVEL, nivelPara, parametrosDe } from './dificultad.js'

// Sube de a un nivel cada PECES_POR_NIVEL peces y se queda en el último
assert.equal(nivelPara(0), 0, 'arranca en el más fácil')
assert.equal(nivelPara(PECES_POR_NIVEL - 1), 0)
assert.equal(nivelPara(PECES_POR_NIVEL), 1, 'al completar el primer grupo sube')
assert.equal(nivelPara(PECES_POR_NIVEL * 3), NIVELES.length - 1)
assert.equal(nivelPara(999), NIVELES.length - 1, 'no se pasa del último')
assert.equal(nivelPara(-5), 0, 'un valor raro no rompe')

// Cada nivel es más difícil que el anterior en las cuatro cosas, o igual (nunca más fácil)
for (let i = 1; i < NIVELES.length; i++) {
  const a = NIVELES[i - 1], b = NIVELES[i]
  assert.ok(b.pecesALaVez >= a.pecesALaVez, `nivel ${i + 1}: no hay menos peces`)
  assert.ok(b.tam <= a.tam, `nivel ${i + 1}: no son más grandes`)
  assert.ok(b.vel >= a.vel, `nivel ${i + 1}: no son más lentos`)
  assert.ok(b.distMin >= a.distMin && b.alcance >= a.alcance, `nivel ${i + 1}: no están más cerca`)
  assert.ok(b.pecesALaVez > a.pecesALaVez || b.tam < a.tam || b.vel > a.vel || b.distMin > a.distMin, `nivel ${i + 1}: cambia algo`)
}
for (const n of NIVELES) assert.ok(n.alcance > n.distMin, 'el rango de aparición no puede quedar vacío')

// El primero es fácil de verdad: un solo pez, grande y lento, cerca
const f = NIVELES[0]
assert.deepEqual([f.pecesALaVez, f.tam > 1, f.vel < 1, f.distMin < 0.75], [1, true, true, true])
assert.equal(parametrosDe(99), NIVELES.at(-1), 'un nivel fuera de rango se acota')
assert.equal(parametrosDe(-1), NIVELES[0])

console.log('dificultad.js OK')
