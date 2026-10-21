// Prueba de mensajes.js con node: node src/juegos/flamenco/mensajes.check.mjs
import assert from 'node:assert/strict'
import { crearPasos } from './logica.js'
import { consigna, tarjetaComenzar, tarjetaDescanso, tarjetaCompletado } from './mensajes.js'

const pasos4 = crearPasos({ repeticiones: 4, dificultad: 'progresiva' })

// ─ consignas: cada una dice qué hacer y, en el equilibrio, cuánto
assert.equal(consigna('levantar', 0, pasos4), 'Levantá la pierna derecha para empezar.')
assert.equal(consigna('levantar', 1, pasos4), 'Levantá la pierna izquierda para empezar.')
assert.equal(consigna('levantar', 2, pasos4), 'Ahora subí la rodilla derecha lo más alto que puedas.')
assert.equal(consigna('equilibrio', 0, pasos4), 'Mantené la pierna arriba durante 10 segundos.')
assert.equal(consigna('equilibrio', 2, pasos4), 'Mantené la rodilla arriba durante 10 segundos.')
assert.match(consigna('levantar', 3, pasos4), /^¡La última! Subí la rodilla izquierda lo más alto que puedas y aguantá todo lo que puedas\.$/)
assert.equal(consigna('equilibrio', 3, pasos4), 'Mantené la rodilla arriba el mayor tiempo que puedas.', 'la última no tiene objetivo')
const soloFlamenco = crearPasos({ repeticiones: 3, dificultad: 'flamenco' })
assert.equal(consigna('levantar', 2, soloFlamenco), '¡La última! Levantá la pierna derecha y aguantá todo lo que puedas.')
assert.equal(consigna('levantar', 0, pasos4, null, 7.4), 'Casi: aguantaste 7,4 segundos. Probá de nuevo con la pierna derecha.', 'bajó antes de los 10 s: se lo dice y se vuelve a pedir')
assert.equal(consigna('levantar', 2, pasos4, null, 3), 'Casi: aguantaste 3 segundos. Probá de nuevo con la rodilla derecha.')
assert.equal(consigna('levantar', 1, pasos4, 'otra', 7.4), 'Esa es la otra pierna: levantá la izquierda.', 'un aviso de la cámara pasa por delante')
assert.equal(consigna('equilibrio', 0, pasos4, 'otra', 7.4), 'Mantené la pierna arriba durante 10 segundos.', 'sosteniendo no se muestra el intento anterior')
assert.match(consigna('levantar', 0, pasos4, 'rodillas'), /No te veo las rodillas/)
assert.equal(consigna('practica-equilibrio', 0, pasos4), 'Mantené la pierna arriba el mayor tiempo que puedas.')
assert.equal(consigna('comenzar', 0, pasos4), null)

// ─ tarjeta de comenzar: la cantidad y las posiciones de la rutina elegida
const comenzar = tarjetaComenzar(pasos4)
assert.match(comenzar.texto, /^Vamos a hacer 4 desafíos, alternando las piernas\./)
assert.match(comenzar.texto, /Primero levantá cada pierna como un flamenco.*Después vas a subir la rodilla/s, 'subiendo de a poco: las dos posiciones')
assert.match(comenzar.texto, /Cada uno dura 10 segundos, menos el último: ahí aguantá todo lo que puedas\./)
assert.equal(comenzar.botones[0].texto, 'Comenzar las 4 repeticiones')
assert.equal(comenzar.botones[0].accion, 'comenzar')
assert.match(tarjetaComenzar(crearPasos({ repeticiones: 7, dificultad: 'alto' })).texto, /^Vamos a hacer 7 desafíos.*Subí cada rodilla lo más alto que puedas/s)
assert.match(tarjetaComenzar(soloFlamenco).texto, /Levantá cada pierna como un flamenco y mantenela arriba\. Cada uno dura/)
assert.doesNotMatch(tarjetaComenzar(soloFlamenco).texto, /rodilla/)

// ─ descanso: para cualquier cantidad, sin "undefined" y con lo que sigue (la última avisa que se aguanta todo lo que se pueda)
for (const n of [2, 3, 4, 5, 6, 7, 8, 9, 10]) {
  const pasos = crearPasos({ repeticiones: n, dificultad: 'progresiva' })
  for (let completadas = 1; completadas < n; completadas++) {
    for (const saltado of [false, true]) {
      const t = tarjetaDescanso(completadas, saltado, pasos)
      const donde = `${n} repeticiones, tras la ${completadas}ª${saltado ? ' (saltada)' : ''}`
      assert.doesNotMatch(`${t.titulo} ${t.texto}`, /undefined|NaN/, donde)
      assert.match(t.texto, /A continuación: la (pierna|rodilla) (derecha|izquierda)/, donde)
      assert.equal(/y esta vez aguantá todo lo que puedas/.test(t.texto), completadas === n - 1, `${donde}: solo antes de la última se avisa que se aguanta lo que se pueda`)
      assert.equal(/vamos con el último/.test(t.texto), completadas === n - 1, donde)
      assert.equal(t.botones.length, completadas === 1 ? 2 : 1, `${donde}: "Volver al menú" solo tras la 1ª`)
    }
  }
}
assert.equal(tarjetaDescanso(1, false, pasos4).titulo, '¡Primer desafío completado!')
assert.match(tarjetaDescanso(1, false, pasos4).texto, /completaste el primer desafío/)
assert.equal(tarjetaDescanso(2, false, pasos4).titulo, '¡Segundo desafío completado!')
assert.match(tarjetaDescanso(2, false, pasos4).texto, /Ya completaste dos desafíos/)
assert.equal(tarjetaDescanso(9, false, crearPasos({ repeticiones: 10, dificultad: 'alto' })).titulo, '¡Noveno desafío completado!')
assert.match(tarjetaDescanso(9, false, crearPasos({ repeticiones: 10, dificultad: 'alto' })).texto, /Ya completaste nueve desafíos/)
assert.equal(tarjetaDescanso(2, true, pasos4).titulo, '¡Sin problema!')

// ─ completado: la cantidad real y, si hubo último, cuánto aguantó
const hechos = [{ saltado: false, segundos: 10 }, { saltado: false, segundos: 10 }, { saltado: false, segundos: 10 }, { saltado: false, segundos: 23.4 }]
const final = tarjetaCompletado(hechos)
assert.match(final.texto, /Completaste los 4 desafíos de Flamingo Challenge\./)
assert.match(final.texto, /En el último aguantaste 23,4 segundos\./)
assert.doesNotMatch(tarjetaCompletado([...hechos.slice(0, 3), { saltado: true, segundos: 0 }]).texto, /En el último/, 'si saltó el último no se inventa un tiempo')
assert.match(tarjetaCompletado(hechos.slice(0, 2)).texto, /Completaste los 2 desafíos/)
assert.equal(final.botones[0].accion, 'volver')

console.log('mensajes.js OK')
