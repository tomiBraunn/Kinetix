import { eficienciaDeTrayecto as e, coordinacionScore as s } from './trayectoria.js'
import assert from 'node:assert/strict'

const recta = Array.from({ length: 21 }, (_, i) => ({ x: i * 0.03, y: 0.5 }))
assert.equal(e(recta), 1, 'recta = 1')

// ida y vuelta: va 0.6 y regresa 0.3 -> recto = 0.3, camino = 0.9 -> ~0.33
const ida = [...Array.from({ length: 21 }, (_, i) => ({ x: i * 0.03, y: 0.5 })),
             ...Array.from({ length: 11 }, (_, i) => ({ x: 0.6 - i * 0.03, y: 0.5 }))]
assert.ok(Math.abs(e(ida) - 1 / 3) < 0.02, 'ida y vuelta ~0.33, dio ' + e(ida))

// zigzag vertical amplio: camino bastante mas largo que la recta
const zig = Array.from({ length: 41 }, (_, i) => ({ x: i * 0.015, y: 0.5 + (i % 2 ? 0.05 : -0.05) }))
assert.ok(e(zig) < 0.3, 'zigzag bajo, dio ' + e(zig))

// temblor chico (< paso minimo) sobre una recta no debe penalizar
const temblor = recta.map((p, i) => ({ x: p.x, y: p.y + (i % 2 ? 0.001 : -0.001) }))
assert.ok(e(temblor) > 0.97, 'temblor ignorado, dio ' + e(temblor))

assert.equal(e([{ x: 0, y: 0 }, { x: 0.01, y: 0 }]), null, 'trayecto corto -> null')
assert.equal(e([]), null)
assert.equal(s([0.9, 0.8]), null, 'pocos trayectos -> null')
assert.equal(s([0.9, 0.8, 0.7]), 80)
console.log('trayectoria.js OK')
