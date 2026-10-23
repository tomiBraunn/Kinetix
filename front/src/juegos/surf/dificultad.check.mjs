// Prueba de dificultad.js con node: node src/juegos/surf/dificultad.check.mjs
import assert from 'node:assert/strict'
import { NIVELES, NIVEL_FIJO, nivelPara, parametrosDe } from './dificultad.js'

// Subiendo de a poco (la de siempre: 8 peces) sube de a un nivel cada 2 peces y se queda en el último
assert.equal(nivelPara(0), 0, 'arranca en el más fácil')
assert.equal(nivelPara(1), 0)
assert.equal(nivelPara(2), 1, 'al completar el primer grupo sube')
assert.equal(nivelPara(6), NIVELES.length - 1)
assert.equal(nivelPara(999), NIVELES.length - 1, 'no se pasa del último')
assert.equal(nivelPara(-5), 0, 'un valor raro no rompe')

// Con otra cantidad de peces los niveles se reparten parejo a lo largo de toda la ronda
const progresiva = (repeticiones) => Array.from({ length: repeticiones + 1 }, (_, p) => nivelPara(p, { repeticiones, dificultad: 'progresiva' }))
assert.deepEqual(progresiva(4), [0, 1, 2, 3, 3], '4 peces: un nivel por pez')
assert.deepEqual(progresiva(8), [0, 0, 1, 1, 2, 2, 3, 3, 3], '8 peces: un nivel cada 2')
assert.deepEqual(progresiva(20).filter((n, i, a) => i === 0 || n !== a[i - 1]), [0, 1, 2, 3], '20 peces: pasa por los 4 niveles, en orden')
assert.deepEqual(progresiva(20).slice(0, 5), [0, 0, 0, 0, 0], '20 peces: tarda 5 peces en subir')
assert.equal(nivelPara(0, { repeticiones: 6, dificultad: 'progresiva' }), 0, 'siempre arranca fácil')
for (const n of [4, 5, 7, 8, 11, 20]) {
  const p = progresiva(n)
  assert.ok(p.every((v, i) => i === 0 || v >= p[i - 1]), `${n} peces: nunca baja de nivel`)
  assert.equal(p.at(-1), NIVELES.length - 1, `${n} peces: termina en el nivel máximo`)
}

// La dificultad fija no cambia en toda la ronda
for (const [clave, nivel] of Object.entries(NIVEL_FIJO)) {
  for (const repeticiones of [4, 8, 20]) {
    assert.ok([0, 1, repeticiones - 1, repeticiones, 999].every((p) => nivelPara(p, { repeticiones, dificultad: clave }) === nivel), `${clave} con ${repeticiones} peces: siempre el nivel ${nivel + 1}`)
  }
}
assert.ok(NIVEL_FIJO.facil < NIVEL_FIJO.media && NIVEL_FIJO.media < NIVEL_FIJO.dificil, 'fácil < media < difícil')
assert.ok(parametrosDe(NIVEL_FIJO.facil).pecesALaVez === 1, 'fácil es un pez a la vez')
assert.equal(nivelPara(3, { repeticiones: 8, dificultad: 'inventada' }), 1, 'una dificultad que no existe se trata como subiendo de a poco')

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

// Los peces a la vez que elige el kinesiólogo pisan a los del nivel, y solo eso
assert.equal(parametrosDe(0, null), NIVELES[0], 'sin elegir, los del nivel (el mismo objeto)')
assert.equal(parametrosDe(0, 3).pecesALaVez, 3)
assert.equal(parametrosDe(3, 1).pecesALaVez, 1, 'también en el nivel más difícil')
assert.deepEqual({ ...parametrosDe(0, 3), pecesALaVez: NIVELES[0].pecesALaVez }, NIVELES[0], 'tamaño, velocidad y cadencia siguen siendo los del nivel')

console.log('dificultad.js OK')
