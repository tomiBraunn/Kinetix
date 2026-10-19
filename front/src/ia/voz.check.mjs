import assert from 'node:assert/strict'

// Un "navegador" mínimo ANTES de importar voz.js: la síntesis se toma al cargar el módulo.
const dicho = []
let cancelaciones = 0
const voces = []
let autoInicio = true // el motor avisa "empecé" en el acto (false: queda pedido pero sin empezar)
globalThis.window = {
  speechSynthesis: {
    speak(u) { dicho.push(u); if (autoInicio) u.onstart?.() },
    cancel() { cancelaciones++ },
    getVoices: () => voces,
  },
}
globalThis.SpeechSynthesisUtterance = class { constructor(texto) { this.text = texto } }
const { elegirVoz, hablar, callar, alternarSilencio, desbloquear } = await import('./voz.js')

const v = (lang, localService = true, nombre = lang) => ({ lang, localService, name: nombre })

// ─ elegirVoz
assert.equal(elegirVoz([]), null, 'sin voces')
assert.equal(elegirVoz([v('en-US'), v('fr-FR')]), null, 'sin español no inventa una')
assert.equal(elegirVoz([v('es-ES'), v('es-AR')]).lang, 'es-AR', 'prefiere la de Argentina')
assert.equal(elegirVoz([v('es-ES'), v('es-MX'), v('es-419')]).lang, 'es-419', 'después latinoamérica')
assert.equal(elegirVoz([v('es_AR')]).lang, 'es_AR', 'Android usa guion bajo')
assert.equal(elegirVoz([v('es-AR', false, 'red'), v('es-AR', true, 'local')]).name, 'local', 'entre iguales, la que anda sin internet')
assert.equal(elegirVoz([v('es-PE', false), v('es-CU', true)]).lang, 'es-CU', 'fuera de la lista: cualquier español, mejor local')
assert.equal(elegirVoz([v('es')]).lang, 'es', 'idioma sin región')
assert.equal(elegirVoz([v('en-US'), v('es-ES')]).lang, 'es-ES')

// ─ hablar
hablar('Levantá la pierna derecha para empezar.')
assert.equal(dicho.length, 1)
assert.equal(dicho[0].text, 'Levantá la pierna derecha para empezar.')
assert.equal(dicho[0].lang, 'es-AR', 'sin voces cargadas todavía pide el idioma y que elija el motor')
assert.ok(dicho[0].rate < 1, 'más lento que lo normal')
assert.equal(cancelaciones, 1, 'corta lo anterior antes de hablar')
hablar('Levantá la pierna derecha para empezar.')
assert.equal(dicho.length, 1, 'el mismo texto pegado no se repite')
hablar('Mantené la pierna arriba.')
assert.equal(dicho.length, 2, 'otro texto sí')
hablar('')
hablar(null)
assert.equal(dicho.length, 2, 'texto vacío: nada')

// ─ sinInterrumpir: una pista no pisa lo que ya se está diciendo
hablar('Correte un poco hacia tu izquierda', { sinInterrumpir: true })
assert.equal(dicho.length, 2, 'hay algo hablando: se descarta')
dicho.at(-1).onend() // terminó de hablar
hablar('Correte un poco hacia tu izquierda', { sinInterrumpir: true })
assert.equal(dicho.length, 3, 'sin nada hablando: la dice')

// ─ sinInterrumpir también cuenta lo que fue pedido pero el motor todavía no empezó a decir
autoInicio = false
hablar('Una consigna que recién se pide')
const n0 = dicho.length
hablar('Una pista que llega justo después', { sinInterrumpir: true })
assert.equal(dicho.length, n0, 'pedido pero sin empezar: igual se respeta (dos efectos seguidos no se pisan)')
dicho.at(-1).onend()
autoInicio = true

// ─ voces con nombre de verdad
voces.push(v('es-ES'), v('es-AR'))
hablar('Seguimos con la otra pierna.')
assert.equal(dicho.at(-1).voice.lang, 'es-AR', 'usa la voz elegida')

// ─ callar y silencio
const antes = cancelaciones
callar()
assert.equal(cancelaciones, antes + 1)
alternarSilencio()
hablar('Esto no se dice')
assert.equal(dicho.at(-1).text, 'Seguimos con la otra pierna.', 'en silencio no habla')
alternarSilencio()
hablar('Esto sí se dice')
assert.equal(dicho.at(-1).text, 'Esto sí se dice', 'al reactivarla vuelve a hablar')

// ─ desbloquear: un utterance mudo para el primer toque
const n = dicho.length
desbloquear()
assert.equal(dicho.length, n + 1)
assert.equal(dicho.at(-1).volume, 0)

console.log('voz.js OK')
setTimeout(() => process.exit(0), 0) // los temporizadores de seguridad del módulo no tienen que mantener vivo el proceso
