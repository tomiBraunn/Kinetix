// Prueba de curva.js con node: node src/juegos/surf/curva.check.mjs
import assert from 'node:assert/strict'

const almacen = new Map()
globalThis.localStorage = { getItem: (k) => almacen.get(k) ?? null, setItem: (k, v) => almacen.set(k, v) }
const conUrl = (search) => { globalThis.window = { location: { search } } }
let n = 0
const cargar = () => import(`./curva.js?caso=${n++}`) // el módulo recuerda si ya aplicó la URL: cada caso es una "carga de página"

conUrl('')
let m = await cargar()
const { LIMITES, ZONA_INICIAL, normalizarZona, radioAlAzar, describirZona } = m

// ─ normalizar: siempre queda una zona válida
assert.deepEqual(normalizarZona(null), ZONA_INICIAL, 'sin nada: la de siempre')
assert.deepEqual(normalizarZona({ altoMin: 0.9, altoMax: 1.1, ancho: 40 }), { altoMin: 0.9, altoMax: 1.1, ancho: 40 }, 'lo válido no se toca')
assert.deepEqual(normalizarZona({ altoMin: 1.3, altoMax: 0.7, ancho: 40 }), { altoMin: 0.7, altoMax: 1.3, ancho: 40 }, 'mínimo y máximo se ordenan')
assert.equal(normalizarZona({ altoMin: 0.1, altoMax: 9, ancho: 40 }).altoMin, LIMITES.alto[0], 'no baja del límite')
assert.equal(normalizarZona({ altoMin: 0.1, altoMax: 9, ancho: 40 }).altoMax, LIMITES.alto[1], 'no pasa de lo que alcanza el brazo (1,5 troncos)')
assert.equal(normalizarZona({ ancho: 3 }).ancho, LIMITES.ancho[0])
assert.equal(normalizarZona({ ancho: 200 }).ancho, LIMITES.ancho[1])
assert.equal(normalizarZona({ ancho: 47 }).ancho, 45, 'ancho en pasos de 5°')
assert.equal(normalizarZona({ altoMin: 0.87, altoMax: 1.12 }).altoMin, 0.85, 'alto en pasos de 0,05')
assert.deepEqual(normalizarZona({ altoMin: 'x', altoMax: NaN, ancho: null }), ZONA_INICIAL, 'valores raros: la de siempre')
const fija = normalizarZona({ altoMin: 1, altoMax: 1, ancho: 30 })
assert.equal(fija.altoMin, fija.altoMax, 'se puede fijar un alto único (mínimo = máximo)')

// ─ al azar dentro de la zona: cubre todas las alturas, nunca fuera
const zona = { altoMin: 0.6, altoMax: 1.4, ancho: 60 }
const vistos = Array.from({ length: 400 }, (_, i) => radioAlAzar(zona, () => (i + 0.5) / 400))
assert.ok(Math.min(...vistos) < 0.61 && Math.max(...vistos) > 1.39, 'aparecen a todas las alturas de la zona')
assert.ok(vistos.every((r) => r >= zona.altoMin && r <= zona.altoMax), 'ninguno fuera de la zona')
assert.equal(radioAlAzar({ altoMin: 1, altoMax: 1 }, () => 0.37), 1, 'alto fijo: siempre el mismo')

assert.equal(describirZona({ altoMin: 0.8, altoMax: 1.3, ancho: 60 }), 'alto 0,8 a 1,3 troncos · ancho ±60°')

// ─ guardado y URL
assert.deepEqual(m.leerZona(), ZONA_INICIAL, 'sin nada guardado: la de siempre')
m.guardarZona({ altoMin: 1, altoMax: 1.4, ancho: 30 })
assert.deepEqual(m.leerZona(), { altoMin: 1, altoMax: 1.4, ancho: 30 }, 'lee lo guardado')
conUrl('?zona=0.7-1.1-45')
m = await cargar()
assert.deepEqual(m.leerZona(), { altoMin: 0.7, altoMax: 1.1, ancho: 45 }, 'la URL se aplica y queda guardada')
m.guardarZona({ altoMin: 0.9, altoMax: 0.9, ancho: 25 })
assert.deepEqual(m.leerZona(), { altoMin: 0.9, altoMax: 0.9, ancho: 25 }, 'la URL no pisa lo que se elige después')
conUrl('?zona=basura')
m = await cargar()
assert.deepEqual(m.leerZona(), { altoMin: 0.9, altoMax: 0.9, ancho: 25 }, 'una URL inválida se ignora')
almacen.set('kinetix_surf_zona', '{no es json')
conUrl('')
m = await cargar()
assert.deepEqual(m.leerZona(), ZONA_INICIAL, 'un valor guardado roto se ignora')

console.log('curva.js OK')
