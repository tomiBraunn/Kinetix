// Prueba de analisis.js con node: node src/juegos/surf/analisis.check.mjs
import assert from 'node:assert/strict'
import { compararRondas } from './analisis.js'

const ronda = (cambios = {}) => ({ estabilidad_score: 80, rango_movimiento_max: 70, coordinacion: 60, tiempo_reaccion_s: 1.5, ...cambios })
const fila = (r, clave) => r.filas.find((f) => f.clave === clave)

// ─ primera ronda: se muestran los números y nada para comparar
let r = compararRondas(ronda(), null)
assert.equal(r.hayPrevia, false)
assert.deepEqual(r.filas.map((f) => f.etiqueta), ['Estabilidad', 'Rango de movimiento', 'Coordinación', 'Tiempo de reacción'])
assert.deepEqual(r.filas.map((f) => f.texto), ['80/100', '70°', '60/100', '1,5 s'], 'formato con coma decimal y unidades')
assert.ok(r.filas.every((f) => f.estado === null && f.delta === ''), 'sin ronda anterior no hay comparación')
assert.match(r.frase, /Primera ronda/)

// ─ mejora en lo que sube y en lo que baja (la reacción es mejor cuanto menor)
r = compararRondas(ronda({ estabilidad_score: 86, tiempo_reaccion_s: 1.2 }), ronda())
assert.deepEqual([fila(r, 'estabilidad_score').estado, fila(r, 'estabilidad_score').delta], ['mejor', '▲ 6'])
assert.deepEqual([fila(r, 'tiempo_reaccion_s').estado, fila(r, 'tiempo_reaccion_s').delta], ['mejor', '▼ 0,3 s'], 'reaccionar más rápido es mejorar, aunque el número baje')
assert.equal(fila(r, 'coordinacion').estado, 'igual')
assert.equal(r.frase, 'Mejoraste en estabilidad y tiempo de reacción respecto de la ronda anterior.')

// ─ empeora: nunca se reprocha
r = compararRondas(ronda({ coordinacion: 50, rango_movimiento_max: 60 }), ronda())
assert.deepEqual([fila(r, 'coordinacion').estado, fila(r, 'coordinacion').delta], ['peor', '▼ 10'])
assert.equal(fila(r, 'rango_movimiento_max').delta, '▼ 10°')
assert.equal(r.frase, 'En esta ronda rango de movimiento y coordinación quedaron un poco por debajo de la anterior. ¡En la próxima tenés otra oportunidad!')
assert.equal(compararRondas(ronda({ coordinacion: 50 }), ronda()).frase, 'En esta ronda coordinación quedó un poco por debajo de la anterior. ¡En la próxima tenés otra oportunidad!', 'singular concuerda')
r = compararRondas(ronda({ estabilidad_score: 90, coordinacion: 50 }), ronda())
assert.equal(r.frase, 'Mejoraste en estabilidad; coordinación quedó un poco por debajo.', 'mezcla: lo bueno primero')
const reaccionPeor = compararRondas(ronda({ tiempo_reaccion_s: 2.0 }), ronda())
assert.deepEqual([fila(reaccionPeor, 'tiempo_reaccion_s').estado, fila(reaccionPeor, 'tiempo_reaccion_s').delta], ['peor', '▲ 0,5 s'], 'tardar más es peor: sube el número y es peor')

// ─ ruido normal entre rondas: igual
r = compararRondas(ronda({ estabilidad_score: 81, rango_movimiento_max: 72, coordinacion: 59, tiempo_reaccion_s: 1.55 }), ronda())
assert.ok(r.filas.every((f) => f.estado === 'igual' && f.delta === '= igual'))
assert.equal(r.frase, 'Mantuviste el nivel de la ronda anterior.')

// ─ lo que la IA no pudo medir queda "—", sin inventar ni comparar
r = compararRondas(ronda({ coordinacion: null, tiempo_reaccion_s: null }), ronda())
assert.deepEqual([fila(r, 'coordinacion').texto, fila(r, 'coordinacion').estado], ['—', null])
assert.equal(fila(r, 'tiempo_reaccion_s').texto, '—')
r = compararRondas(ronda(), ronda({ estabilidad_score: null }))
assert.deepEqual([fila(r, 'estabilidad_score').texto, fila(r, 'estabilidad_score').estado], ['80/100', null], 'si la ronda anterior no tenía el dato, no hay con qué comparar')
r = compararRondas({}, ronda())
assert.ok(r.filas.every((f) => f.texto === '—'))
assert.equal(r.frase, 'No hubo datos suficientes para analizar esta ronda.')
r = compararRondas(null, null)
assert.equal(r.filas.length, 4, 'no se rompe sin nada')
assert.equal(compararRondas({ estabilidad_score: 80 }, { coordinacion: 50 }).frase, 'Todavía no hay datos suficientes para compararla con la anterior.')

// ─ tres mejoras: la lista lleva comas y "y"
r = compararRondas(ronda({ estabilidad_score: 90, rango_movimiento_max: 80, coordinacion: 70 }), ronda())
assert.equal(r.frase, 'Mejoraste en estabilidad, rango de movimiento y coordinación respecto de la ronda anterior.')

console.log('analisis.js OK')
