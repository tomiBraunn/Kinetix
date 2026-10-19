// Prueba de columnaTV.js con node: node src/juegos/columnaTV.check.mjs
import assert from 'node:assert/strict'
import { columnaTV, ANCHO_COLUMNA } from './columnaTV.js'

const H = 48
assert.equal(columnaTV(402, 874, H), null, 'celular en vertical: sin columna')
assert.equal(columnaTV(768, 1024, H), null, 'tablet en vertical: sin columna')
assert.equal(columnaTV(1000, 900, H), null, 'ventana casi cuadrada: sin columna')

const tv = columnaTV(1920, 1080, H)
assert.equal(tv.k, 1032 / 690, 'TV 1080p: se agranda lo que falta para ver 690 px del diseño')
assert.ok(Math.abs(tv.alto * tv.k - 1032) < 1e-9, 'la columna escalada ocupa justo el alto del área')
assert.ok(tv.k * ANCHO_COLUMNA < 1920, 'y entra a lo ancho')

assert.equal(columnaTV(1280, 720, H).k, 1, 'TV 720p: no se achica (la columna queda como un celular bajo)')
assert.equal(columnaTV(1280, 720, H).alto, 672, 'y toma todo el alto del área')
assert.equal(columnaTV(874, 402, H).k, 1, 'celular acostado: columna centrada sin agrandar')
assert.equal(columnaTV(3840, 2160, H).k, 2.2, 'TV 4K: tope de escala')

console.log('columnaTV.js OK')
