// Prueba de sonidos.js con node: node src/ia/sonidos.check.mjs
import assert from 'node:assert/strict'

// Sin navegador (node) no hay AudioContext: sonar no rompe y no hace nada
const { EFECTOS, sonar, silenciarEfectos, desbloquearSonidos } = await import('./sonidos.js')
sonar('punto')
desbloquearSonidos()

// Cada efecto son notas ordenadas en el tiempo, con duración y frecuencia razonables (audibles y no estridentes)
for (const [nombre, notas] of Object.entries(EFECTOS)) {
  assert.ok(notas.length > 0, `${nombre}: tiene notas`)
  notas.forEach(([hz, inicio, duracion], i) => {
    assert.ok(hz >= 200 && hz <= 1500, `${nombre}: ${hz} Hz se oye bien y no molesta`)
    assert.ok(inicio >= 0 && duracion > 0 && duracion <= 1, `${nombre}: la nota ${i + 1} dura menos de un segundo`)
    if (i) assert.ok(inicio >= notas[i - 1][1], `${nombre}: las notas van en orden`)
  })
  assert.ok(Math.max(...notas.map(([, inicio, duracion]) => inicio + duracion)) <= 1.2, `${nombre}: todo el efecto dura poco`)
}
assert.deepEqual(Object.keys(EFECTOS).sort(), ['animo', 'aviso', 'fin', 'punto', 'subida'])
assert.ok(EFECTOS.aviso[1][0] < EFECTOS.aviso[0][0], 'el aviso baja (no suena a premio)')
assert.ok(EFECTOS.punto[1][0] > EFECTOS.punto[0][0], 'el acierto sube')

// Con un AudioContext de mentira: una nota = un oscilador, y silenciado no suena
globalThis.window = { }
const osciladores = []
let estado = 'suspended'
let reanudado = 0
globalThis.window.AudioContext = class {
  constructor() { this.currentTime = 0; this.destination = {}; this.state = estado }
  resume() { reanudado++; this.state = 'running' }
  createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} } }
  createOscillator() { const o = { frequency: {}, connect() {}, start() {}, stop() {} }; osciladores.push(o); return o }
}
const otro = await import('./sonidos.js?con-audio') // otra copia del módulo: ahora sí hay con qué sonar
otro.sonar('subida')
assert.equal(osciladores.length, EFECTOS.subida.length, 'una nota, un oscilador')
assert.equal(reanudado, 1, 'si el audio estaba suspendido se reanuda')
assert.deepEqual(osciladores.map((o) => o.type), ['sine', 'sine', 'sine'])
otro.sonar('aviso')
assert.equal(osciladores.at(-1).type, 'triangle', 'el aviso es más suave')
const antes = osciladores.length
otro.sonar('inventado')
assert.equal(osciladores.length, antes, 'un efecto que no existe no suena ni rompe')
otro.silenciarEfectos(true)
otro.sonar('fin')
assert.equal(osciladores.length, antes, 'silenciado no suena')
otro.silenciarEfectos(false)
otro.sonar('fin')
assert.equal(osciladores.length, antes + EFECTOS.fin.length, 'al volver a activarlo suena')

console.log('sonidos.js OK')
