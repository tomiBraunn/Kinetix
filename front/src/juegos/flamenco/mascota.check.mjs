import assert from 'node:assert/strict'
import { crearPasos } from './logica.js'
import { poseMascota, HITOS_ANIMO_S, FRASES_ANIMO } from './mascota.js'

const pasos = crearPasos({ repeticiones: 4, dificultad: 'progresiva' })
const pose = (o) => poseMascota({ pasos, ...o })

// ─ cada paso muestra su pierna y su posición (derecha, izquierda, derecha alto, izquierda alto)
assert.deepEqual(pasos.map((_, paso) => pose({ fase: 'levantar', paso })), ['flamenco-der', 'flamenco-izq', 'alto-der', 'alto-izq'])
assert.deepEqual(pasos.map((_, paso) => pose({ fase: 'equilibrio', paso })), ['flamenco-der', 'flamenco-izq', 'alto-der', 'alto-izq'], 'mientras sostiene sigue en la pose')

// ─ avisos
assert.equal(pose({ fase: 'levantar', paso: 1, aviso: 'otra' }), 'senala', 'levantó la otra pierna: señala')
assert.equal(pose({ fase: 'levantar', paso: 0, aviso: 'rodillas' }), 'senala', 'no se ven las rodillas: señala')
assert.equal(pose({ fase: 'levantar', paso: 2, aviso: 'subir' }), 'alto-der', '"subí más": repite la pose alta')
assert.equal(pose({ fase: 'practica-levantar', aviso: 'rodillas' }), 'senala')

// ─ ánimo mientras sostiene, y nada más en otras fases
assert.equal(pose({ fase: 'equilibrio', paso: 0, animo: true }), 'anima')
assert.equal(pose({ fase: 'levantar', paso: 0, animo: true }), 'flamenco-der', 'el ánimo solo cuenta sosteniendo')

// ─ el resto del recorrido
assert.equal(pose({ fase: 'instrucciones' }), 'reposo')
assert.equal(pose({ fase: 'calibracion' }), 'reposo')
assert.equal(pose({ fase: 'preparando' }), 'celebra')
assert.equal(pose({ fase: 'practica-levantar' }), 'flamenco-der')
assert.equal(pose({ fase: 'practica-equilibrio' }), 'flamenco-der')
assert.equal(pose({ fase: 'comenzar' }), 'reposo')
assert.equal(pose({ fase: 'descanso', paso: 1 }), 'descansa')
assert.equal(pose({ fase: 'completado', paso: 3 }), 'celebra')

// ─ siempre una pose que existe como archivo (sin esto la mascota quedaría sin dibujo)
const POSES_QUE_EXISTEN = ['reposo', 'flamenco-der', 'flamenco-izq', 'alto-der', 'alto-izq', 'celebra', 'anima', 'senala', 'descansa']
const fases = ['instrucciones', 'calibracion', 'preparando', 'practica-levantar', 'practica-equilibrio', 'comenzar', 'levantar', 'equilibrio', 'descanso', 'completado']
for (const fase of fases) for (const paso of [0, 1, 2, 3]) for (const aviso of [null, 'otra', 'subir', 'rodillas']) for (const animo of [false, true]) {
  assert.ok(POSES_QUE_EXISTEN.includes(pose({ fase, paso, aviso, animo })), `${fase}/${paso}/${aviso}/${animo}`)
}

// ─ hitos de ánimo: una frase por cada uno
assert.equal(FRASES_ANIMO.length, HITOS_ANIMO_S.length)
assert.ok(HITOS_ANIMO_S.every((s, i) => s > 0 && (i === 0 || s > HITOS_ANIMO_S[i - 1])), 'crecientes')

console.log('mascota.js OK')
