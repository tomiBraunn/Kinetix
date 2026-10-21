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

// Cada nivel es más difícil que el anterior (o igual), nunca más fácil
for (let i = 1; i < NIVELES.length; i++) {
  const a = NIVELES[i - 1], b = NIVELES[i]
  assert.ok(b.pecesALaVez >= a.pecesALaVez, `nivel ${i + 1}: no hay menos peces`)
  assert.ok(b.tam <= a.tam, `nivel ${i + 1}: no son más grandes`)
  assert.ok(b.vel >= a.vel, `nivel ${i + 1}: no son más lentos`)
  assert.ok(b.pecesALaVez > a.pecesALaVez || b.tam < a.tam || b.vel > a.vel, `nivel ${i + 1}: cambia algo`)
}

// Para adultos mayores: pocos peces, mucho tiempo entre uno y otro, todo lento y con el brazo a su alcance
for (const [i, n] of NIVELES.entries()) {
  assert.ok(n.pecesALaVez <= 2, `nivel ${i + 1}: como mucho dos peces a la vez`)
  assert.ok(n.espera[0] >= 2000 && n.espera[1] >= n.espera[0], `nivel ${i + 1}: el pez nuevo tarda al menos 2 s`)
  assert.ok(n.entre[0] >= 3000 && n.entre[1] >= n.entre[0], `nivel ${i + 1}: entre dos peces pasan al menos 3 s`)
  assert.ok(n.vel <= 1, `nivel ${i + 1}: ni más rápido que lo normal`)
  assert.ok(n.deriva <= 20, `nivel ${i + 1}: se desplaza poco por la curva`)
  assert.ok(!('radio' in n) && !('angulo' in n), `nivel ${i + 1}: la zona la fija el kinesiólogo, no el nivel`)
}

// El primero es fácil de verdad: un solo pez, grande y lento
const f = NIVELES[0]
assert.deepEqual([f.pecesALaVez, f.tam > 1, f.vel < 1], [1, true, true])
assert.equal(parametrosDe(99), NIVELES.at(-1), 'un nivel fuera de rango se acota')
assert.equal(parametrosDe(-1), NIVELES[0])

console.log('dificultad.js OK')
