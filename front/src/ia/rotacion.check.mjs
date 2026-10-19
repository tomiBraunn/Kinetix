// Prueba de rotacion.js con node: node src/ia/rotacion.check.mjs
import assert from 'node:assert/strict'

const almacen = new Map()
globalThis.localStorage = { getItem: (k) => almacen.get(k) ?? null, setItem: (k, v) => almacen.set(k, v) }
const conUrl = (search) => { globalThis.window = { location: { search } } }
// El módulo recuerda si ya aplicó la URL: cada caso lo importa de nuevo (otra "carga de página")
let n = 0
const cargar = () => import(`./rotacion.js?caso=${n++}`)

const { siguienteRotacion } = await cargar()
assert.deepEqual([0, 90, 180, 270].map(siguienteRotacion), [90, 180, 270, 0], 'da la vuelta completa')

conUrl('')
let m = await cargar()
assert.equal(m.leerRotacion(), 0, 'sin nada guardado: derecha')
m.guardarRotacion(270)
assert.equal(m.leerRotacion(), 270, 'lee lo guardado')

conUrl('?rotacion=90')
m = await cargar()
assert.equal(m.leerRotacion(), 90, 'la URL se aplica y queda guardada')
m.guardarRotacion(180) // el botón de girar cambia el valor con la URL todavía en la barra
assert.equal(m.leerRotacion(), 180, 'la URL no pisa lo que se elige después')

conUrl('?rotacion=0')
m = await cargar()
assert.equal(m.leerRotacion(), 0, 'la URL puede pedir 0 aunque haya algo guardado')

conUrl('?rotacion=45')
m.guardarRotacion(270)
m = await cargar()
assert.equal(m.leerRotacion(), 270, 'un valor inválido en la URL se ignora')

almacen.set('kinetix_camara_rotacion', '7')
conUrl('')
m = await cargar()
assert.equal(m.leerRotacion(), 0, 'un valor guardado inválido se ignora')

console.log('rotacion.js OK')
