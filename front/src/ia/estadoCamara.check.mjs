// Prueba de estadoCamara.js con node: node src/ia/estadoCamara.check.mjs
import assert from 'node:assert/strict'
import { describirFalla, problemaActual, camaraPidiendo, camaraLista, camaraFalla, imagenFalla, imagenOk, modeloFalla, modeloOk, pedirReintento } from './estadoCamara.js'

const falla = (nombre, mensaje = 'x') => Object.assign(new Error(mensaje), { name: nombre })

// ─ cada error del navegador tiene su explicación, y todas piden una acción concreta
const casos = {
  NotAllowedError: /permiso/i, SecurityError: /permiso/i, PermissionDeniedError: /permiso/i,
  NotFoundError: /No se encontró/, DevicesNotFoundError: /No se encontró/, OverconstrainedError: /No se encontró/,
  NotReadableError: /ocupada/, TrackStartError: /ocupada/, AbortError: /ocupada/,
  NotSupportedError: /no permite/, SinMediaDevices: /Acá no se puede/, Raro: /No se pudo abrir/,
}
for (const [nombre, patron] of Object.entries(casos)) {
  const d = describirFalla('camara', falla(nombre, 'Permission denied'))
  assert.match(d.titulo, patron, nombre)
  assert.ok(d.ayuda.length > 20, `${nombre}: dice qué hacer`)
  assert.ok(d.detalle.startsWith(nombre), `${nombre}: el detalle técnico lleva el nombre del error`)
}
assert.match(describirFalla('camara', undefined).titulo, /No se pudo abrir/, 'sin error, un mensaje genérico')

// El permiso se da en lugares distintos en la app y en un navegador
assert.match(describirFalla('camara', falla('NotAllowedError'), true).ayuda, /ajustes del celular/)
assert.match(describirFalla('camara', falla('NotAllowedError'), false).ayuda, /candado/)

// El detector y la imagen sin cuadros
const modelo = describirFalla('modelo', falla('TypeError', 'Failed to fetch'))
assert.match(modelo.titulo, /detector/)
assert.match(modelo.ayuda, /internet/)
assert.equal(modelo.detalle, 'TypeError: Failed to fetch')
assert.match(describirFalla('imagen', null).titulo, /no manda imagen/)
assert.equal(describirFalla('camara', falla('X', 'a'.repeat(500))).detalle.length, 160, 'el detalle no se hace infinito')

// ─ el estado: qué problema se muestra y en qué orden
assert.equal(problemaActual(), null, 'al principio, ninguno')
camaraPidiendo()
assert.equal(problemaActual(), null, 'pidiendo la cámara todavía no es un problema')
imagenFalla(); modeloFalla(falla('TypeError'))
assert.equal(problemaActual().etapa, 'imagen', 'sin imagen pasa por delante del detector')
camaraFalla(falla('NotAllowedError'))
assert.equal(problemaActual().etapa, 'camara', 'y la cámara por delante de todo')
assert.equal(problemaActual().error.name, 'NotAllowedError')
camaraLista(); imagenOk()
assert.equal(problemaActual().etapa, 'modelo')
modeloOk()
assert.equal(problemaActual(), null, 'al resolverse todo, no queda nada')
camaraFalla(falla('NotReadableError')); modeloFalla(falla('Error'))
pedirReintento()
assert.equal(problemaActual(), null, 'reintentar limpia los problemas')
console.log('estadoCamara.js OK')
