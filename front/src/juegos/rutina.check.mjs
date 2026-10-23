// Prueba de rutina.js con node: node src/juegos/rutina.check.mjs
import assert from 'node:assert/strict'
import { RUTINAS, normalizarRutina, leerRutina, guardarRutina } from './rutina.js'

// Lo que llegue (guardado viejo, a mano, roto) se deja en una rutina válida
assert.deepEqual(normalizarRutina('flamenco', null), { repeticiones: 4, dificultad: 'progresiva' }, 'sin nada: la de siempre (4 repeticiones)')
assert.deepEqual(normalizarRutina('surf', undefined), { repeticiones: 8, dificultad: 'progresiva', aLaVez: null }, 'en el Surf, sin elegir cuántos a la vez: según la dificultad')
assert.deepEqual(normalizarRutina('flamenco', { repeticiones: 6, dificultad: 'alto' }), { repeticiones: 6, dificultad: 'alto' })
assert.equal(normalizarRutina('flamenco', { repeticiones: 1 }).repeticiones, 2, 'mínimo 2 (una de 10 s y la última)')
assert.equal(normalizarRutina('flamenco', { repeticiones: 99 }).repeticiones, 10)
assert.equal(normalizarRutina('surf', { repeticiones: 2 }).repeticiones, 4)
assert.equal(normalizarRutina('surf', { repeticiones: 20.4 }).repeticiones, 20)
assert.equal(normalizarRutina('flamenco', { repeticiones: 5.6 }).repeticiones, 6, 'se redondea a un entero')
assert.equal(normalizarRutina('flamenco', { repeticiones: '5' }).repeticiones, 4, 'un texto no es un número')
assert.equal(normalizarRutina('flamenco', { repeticiones: NaN }).repeticiones, 4)
assert.equal(normalizarRutina('flamenco', { dificultad: 'media' }).dificultad, 'progresiva', 'una dificultad que el juego no tiene vuelve a la progresiva')
assert.equal(normalizarRutina('surf', { dificultad: 'media' }).dificultad, 'media')

// Cada juego arranca con una dificultad progresiva y las suyas no se repiten
for (const [juego, { repeticiones, dificultades }] of Object.entries(RUTINAS)) {
  assert.equal(dificultades[0].clave, 'progresiva', `${juego}: la primera opción es ir subiendo`)
  assert.equal(new Set(dificultades.map((d) => d.clave)).size, dificultades.length, `${juego}: sin opciones repetidas`)
  assert.ok(repeticiones.min <= repeticiones.inicial && repeticiones.inicial <= repeticiones.max, `${juego}: la inicial está dentro de los límites`)
}

// Sin almacenamiento (node) no se rompe: devuelve la inicial. Con él, guarda y lee lo normalizado.
assert.deepEqual(leerRutina('flamenco'), { repeticiones: 4, dificultad: 'progresiva' })
guardarRutina('flamenco', { repeticiones: 3, dificultad: 'flamenco' })
const memoria = new Map()
globalThis.localStorage = { getItem: (k) => memoria.get(k) ?? null, setItem: (k, v) => memoria.set(k, v) }
guardarRutina('flamenco', { repeticiones: 3, dificultad: 'flamenco' })
guardarRutina('surf', { repeticiones: 50, dificultad: 'dificil' })
assert.deepEqual(leerRutina('flamenco'), { repeticiones: 3, dificultad: 'flamenco' })
assert.deepEqual(leerRutina('surf'), { repeticiones: 20, dificultad: 'dificil', aLaVez: null }, 'lo guardado se normaliza y cada juego guarda lo suyo')
memoria.set('kinetix_rutina_surf', '{roto')
assert.deepEqual(leerRutina('surf'), { repeticiones: 8, dificultad: 'progresiva', aLaVez: null }, 'un guardado roto vuelve a la inicial')

// Cuántos peces a la vez (solo Surf): 1, 2 o 3; cualquier otra cosa vuelve a "según la dificultad"
for (const valido of [1, 2, 3]) assert.equal(normalizarRutina('surf', { aLaVez: valido }).aLaVez, valido)
for (const raro of [0, 4, 2.5, '2', NaN, undefined, null]) assert.equal(normalizarRutina('surf', { aLaVez: raro }).aLaVez, null, `aLaVez ${String(raro)}`)
assert.ok(!('aLaVez' in normalizarRutina('flamenco', { aLaVez: 2 })), 'el Flamenco no tiene peces')
guardarRutina('surf', { repeticiones: 6, dificultad: 'facil', aLaVez: 3 })
assert.deepEqual(leerRutina('surf'), { repeticiones: 6, dificultad: 'facil', aLaVez: 3 }, 'se guarda y se lee')

console.log('rutina.js OK')
