import assert from 'node:assert/strict'
import { PASOS, REPETICIONES, MIN_SOSTENIDO_MS, MAX_SOSTENIDO_MS, FASES, estadoInicial, reducir, segundosSostenidos, resumen } from './logica.js'

// Los estados que pasan por acá van congelados: si reducir mutara uno, tiraría TypeError
// (los módulos son estrictos) y el check se cae. Así la inmutabilidad se prueba en TODO el flujo.
const congelar = (e) => { Object.freeze(e.resultados); return Object.freeze(e) }
const inicial = () => congelar(estadoInicial())
const paso = (e, tipo, ahora = 0, extra = {}) => congelar(reducir(e, { tipo, ahora, ...extra }))
const correr = (eventos, desde = inicial()) => eventos.reduce((e, [tipo, ahora, extra]) => paso(e, tipo, ahora, extra), desde)
const tiempos = (e) => e.resultados.map((r) => r.segundos)

// Pierna levantada en t0 y bajada `ms` después
const rep = (t0, ms) => [['piernaLevantada', t0], ['piernaBajada', t0 + ms]]

// Eventos que llevan a cada fase desde el inicio (la pierna sube a 1 s en la práctica y a 10 s en el 1er paso)
const camino = { instrucciones: [] }
camino.calibracion = [['listo']]
camino.preparando = [...camino.calibracion, ['calibrado']]
camino['practica-levantar'] = [...camino.preparando, ['escenaLista']]
camino['practica-equilibrio'] = [...camino['practica-levantar'], ['piernaLevantada', 1000]]
camino.comenzar = [...camino['practica-levantar'], ...rep(1000, 2500)]
camino.levantar = [...camino.comenzar, ['comenzar']]
camino.equilibrio = [...camino.levantar, ['piernaLevantada', 10000]]
camino.descanso = [...camino.levantar, ...rep(10000, 3000)]
camino.completado = [...camino.descanso, ['seguir'], ...rep(20000, 7400), ['seguir'], ...rep(40000, 4260), ['seguir'], ...rep(60000, 5000)]
const en = (fase) => {
  const e = correr(camino[fase])
  assert.equal(e.fase, fase, `el atajo a ${fase} termina en otra fase`)
  return e
}
// Una sesión de tantos pasos como duraciones (en ms), todos desde el 1º
const sesion = (...duraciones) => correr(duraciones.flatMap((ms, i) => [...(i ? [['seguir']] : []), ...rep(100000 * (i + 1), ms)]), en('levantar'))
const ARRIBA = ['practica-equilibrio', 'equilibrio'] // fases con la pierna levantada
// Último paso (el 4º) a punto de empezar: 3 completados
const ultimoPaso = () => correr([...camino.descanso, ['seguir'], ...rep(20000, 7400), ['seguir'], ...rep(40000, 4260), ['seguir']])
const res = (pierna, posicion, segundos, altura_max = null, saltado = false) => ({ pierna, posicion, segundos, altura_max, saltado })

// ─ constantes, pasos y estado inicial
assert.equal(REPETICIONES, 4)
assert.equal(MIN_SOSTENIDO_MS, 1000)
assert.equal(MAX_SOSTENIDO_MS, 30000)
assert.deepEqual(PASOS.map((p) => p.pierna), ['der', 'izq', 'der', 'izq'], 'las piernas se alternan')
assert.deepEqual(PASOS.map((p) => p.posicion), ['flamenco', 'flamenco', 'alto', 'alto'], 'primero flamenco, después lo más alto')
assert.deepEqual(FASES, ['instrucciones', 'calibracion', 'preparando', 'practica-levantar', 'practica-equilibrio', 'comenzar', 'levantar', 'equilibrio', 'descanso', 'completado'])
assert.deepEqual(estadoInicial(), { fase: 'instrucciones', paso: 0, completadas: 0, resultados: [], pico: null, desdeMs: null, pausadoMs: null })
assert.notEqual(estadoInicial().resultados, estadoInicial().resultados, 'cada estado inicial trae su propio array')
assert.throws(() => inicial().resultados.push(1), TypeError, 'el congelado funciona: sin esto la inmutabilidad no se estaría probando')

// ─ flujo completo: instrucciones → calibración → parque → práctica → 4 pasos → completado
const visitadas = new Set(['instrucciones'])
let e = inicial()
const dar = (tipo, ahora, extra) => { e = paso(e, tipo, ahora, extra); visitadas.add(e.fase); return e }

dar('listo');       assert.equal(e.fase, 'calibracion')
dar('calibrado');   assert.equal(e.fase, 'preparando')
dar('escenaLista'); assert.equal(e.fase, 'practica-levantar')
dar('piernaLevantada', 1000); assert.deepEqual([e.fase, e.desdeMs], ['practica-equilibrio', 1000])
dar('piernaBajada', 3500);    assert.deepEqual([e.fase, e.completadas, e.resultados, e.desdeMs], ['comenzar', 0, [], null], 'la práctica termina en la tarjeta y no cuenta')
dar('comenzar');              assert.deepEqual([e.fase, e.paso, e.completadas, e.resultados], ['levantar', 0, 0, []])

dar('piernaLevantada', 10000); assert.deepEqual([e.fase, e.desdeMs], ['equilibrio', 10000])
dar('altura', 10500, { valor: -0.5 }); dar('altura', 11000, { valor: -0.2345 }); dar('altura', 11500, { valor: -0.4 })
dar('piernaBajada', 13000)
assert.deepEqual([e.fase, e.paso, e.completadas, e.pico, e.desdeMs], ['descanso', 0, 1, null, null])
assert.deepEqual(e.resultados, [res('der', 'flamenco', 3, -0.23)], 'altura máxima redondeada a 0,01 de torso')
dar('seguir');                 assert.deepEqual([e.fase, e.paso, e.completadas], ['levantar', 1, 1], 'seguir lleva al 2º paso (la otra pierna)')

dar('piernaLevantada', 20000); dar('piernaBajada', 27400)
assert.deepEqual([e.fase, e.paso, e.completadas, tiempos(e)], ['descanso', 1, 2, [3, 7.4]])
dar('seguir')
assert.deepEqual([e.fase, e.paso, e.completadas], ['levantar', 2, 2], 'el 3º es el primero en "alto"')

dar('piernaLevantada', 40000); dar('piernaBajada', 44260)
dar('seguir'); dar('piernaLevantada', 60000); dar('piernaBajada', 65000)
assert.deepEqual([e.fase, e.paso, e.completadas, tiempos(e), e.desdeMs], ['completado', 3, 4, [3, 7.4, 4.3, 5], null], 'tiempos redondeados a 0,1 s; el paso se queda en el último')
assert.deepEqual(e.resultados.map((r) => [r.pierna, r.posicion]), PASOS.map((p) => [p.pierna, p.posicion]), 'cada resultado lleva su pierna y su posición')
assert.deepEqual([...visitadas].sort(), [...FASES].sort(), 'el recorrido pasa por las 10 fases')
assert.deepEqual(resumen(e), {
  mejor_tiempo_segundos: 7.4, intentos: 4, tiempos_segundos: [3, 7.4, 4.3, 5],
  pasos: [res('der', 'flamenco', 3, -0.23), res('izq', 'flamenco', 7.4), res('der', 'alto', 4.3), res('izq', 'alto', 5)],
})
assert.deepEqual(e.resultados.slice(1), en('completado').resultados.slice(1), 'el atajo de los otros tests da los mismos pasos')

// ─ rebote: bajar antes de MIN_SOSTENIDO_MS no cuenta y se vuelve a pedir la pierna
for (const [nombre, base, vuelve, cuenta] of [
  ['práctica', en('practica-levantar'), 'practica-levantar', 'comenzar'],
  ['1er paso', en('levantar'), 'levantar', 'descanso'],
  ['último paso', ultimoPaso(), 'levantar', 'completado'],
]) {
  const rebote = correr(rep(5000, MIN_SOSTENIDO_MS - 1), base)
  assert.equal(rebote.fase, vuelve, `rebote en ${nombre}: vuelve a pedir la pierna`)
  assert.deepEqual([rebote.paso, rebote.completadas, tiempos(rebote), rebote.desdeMs], [base.paso, base.completadas, tiempos(base), null], `rebote en ${nombre}: no cuenta nada`)
  assert.equal(segundosSostenidos(rebote, 99999), 0, `rebote en ${nombre}: el reloj vuelve a 0`)
  assert.equal(correr(rep(5000, MIN_SOSTENIDO_MS), base).fase, cuenta, `justo ${MIN_SOSTENIDO_MS} ms ya cuenta en ${nombre}`)
}
const reintento = correr([...rep(5000, 200), ...rep(8000, 4000)], en('levantar'))
assert.deepEqual([reintento.fase, reintento.paso, reintento.completadas, tiempos(reintento)], ['descanso', 0, 1, [4]], 'tras un rebote, el reintento cuenta solo su propio tiempo')

// ─ eventos fuera de fase: devuelven el MISMO objeto (React no re-renderiza); los que aplican, uno nuevo
const EVENTOS = ['listo', 'calibrado', 'escenaLista', 'piernaLevantada', 'piernaBajada', 'comenzar', 'seguir', 'saltar', 'tick', 'altura']
const aplica = {
  instrucciones: ['listo'], calibracion: ['calibrado'], preparando: ['escenaLista'],
  'practica-levantar': ['piernaLevantada'], 'practica-equilibrio': ['piernaBajada', 'tick'], comenzar: ['comenzar'],
  levantar: ['piernaLevantada', 'saltar'], equilibrio: ['piernaBajada', 'saltar', 'tick', 'altura'], descanso: ['seguir'], completado: [],
}
for (const fase of FASES) {
  const base = en(fase)
  for (const tipo of EVENTOS) {
    const sale = reducir(base, { tipo, ahora: 123456, valor: 1 })
    if (aplica[fase].includes(tipo)) assert.notEqual(sale, base, `${tipo} en ${fase} sí aplica`)
    else assert.equal(sale, base, `${tipo} en ${fase} se ignora`)
  }
}
const sinEfecto = en('equilibrio')
assert.equal(reducir(sinEfecto, { tipo: 'inventado', ahora: 0 }), sinEfecto, 'evento desconocido')

// piernaLevantada dos veces seguidas: la segunda no reinicia el reloj
for (const fase of ARRIBA) {
  const arriba = en(fase)
  assert.equal(reducir(arriba, { tipo: 'piernaLevantada', ahora: arriba.desdeMs + 1500 }), arriba)
  assert.equal(arriba.desdeMs, fase === 'equilibrio' ? 10000 : 1000)
}
// piernaBajada dos veces seguidas: la 2ª no suma otro paso
const bajoDos = correr([['piernaLevantada', 0], ['piernaBajada', 2000], ['piernaBajada', 2100]], en('levantar'))
assert.deepEqual([bajoDos.fase, bajoDos.completadas, tiempos(bajoDos)], ['descanso', 1, [2]])
// piernaBajada sin haber levantado: ni en la práctica ni en el paso
for (const fase of ['practica-levantar', 'levantar']) {
  const base = en(fase)
  assert.equal(reducir(base, { tipo: 'piernaBajada', ahora: 5000 }), base, `bajada sin levantar en ${fase}`)
}

// ─ comenzar arranca de cero aunque el estado traiga restos
const sucio = congelar({ ...en('comenzar'), paso: 3, completadas: 2, resultados: [res('der', 'flamenco', 1), res('izq', 'flamenco', 2)], pico: 0.3 })
assert.deepEqual(paso(sucio, 'comenzar'), { ...inicial(), fase: 'levantar' }, 'paso=0, completadas=0, resultados=[], pico=null')

// ─ reloj de equilibrio
assert.equal(segundosSostenidos(inicial(), 5000), 0, 'sin pierna arriba: 0')
assert.equal(segundosSostenidos(en('descanso'), 5000), 0, 'tras bajar la pierna: 0')
for (const fase of ARRIBA) {
  const arriba = en(fase)
  assert.equal(segundosSostenidos(arriba, arriba.desdeMs + 2500), 2.5, `cuenta hacia arriba en ${fase}`)
  assert.equal(segundosSostenidos(arriba, arriba.desdeMs - 500), 0, 'nunca negativo')
}

// ─ tope de tiempo: a los 30 s el paso se da por cumplido, sostenga o no la pierna
const eq = en('equilibrio') // desdeMs = 10000
assert.equal(reducir(eq, { tipo: 'tick', ahora: eq.desdeMs + MAX_SOSTENIDO_MS - 1 }), eq, 'un instante antes del tope no pasa nada')
const topado = paso(eq, 'tick', eq.desdeMs + MAX_SOSTENIDO_MS)
assert.deepEqual([topado.fase, topado.completadas, tiempos(topado), topado.desdeMs], ['descanso', 1, [30], null])
assert.deepEqual(tiempos(paso(eq, 'piernaBajada', eq.desdeMs + 50000)), [30], 'si la bajada llega tarde, igual cuenta 30 s y no más')
assert.equal(paso(en('practica-equilibrio'), 'tick', 1000 + MAX_SOSTENIDO_MS).fase, 'comenzar', 'también en la práctica')
assert.equal(paso(correr([['seguir'], ...rep(20000, 5000), ['seguir'], ...rep(30000, 5000), ['seguir'], ['piernaLevantada', 40000]], en('descanso')), 'tick', 40000 + MAX_SOSTENIDO_MS).fase, 'completado', 'el último paso topado cierra la sesión')
const pausadoEnTope = paso(eq, 'pausar', eq.desdeMs + 5000)
assert.equal(reducir(pausadoEnTope, { tipo: 'tick', ahora: eq.desdeMs + 99999 }), pausadoEnTope, 'en pausa el tope no corta')

// ─ altura de la rodilla: solo cuenta el máximo y solo mientras se sostiene
let alto = paso(eq, 'altura', 10100, { valor: -0.5 })
assert.equal(alto.pico, -0.5)
alto = paso(alto, 'altura', 10200, { valor: 0.1 }); assert.equal(alto.pico, 0.1)
assert.equal(reducir(alto, { tipo: 'altura', ahora: 10300, valor: -0.4 }), alto, 'una altura menor no cambia nada (ni re-renderiza)')
assert.equal(reducir(alto, { tipo: 'altura', ahora: 10300, valor: 0.1 }), alto, 'igual tampoco')
const levantando = en('levantar')
assert.equal(reducir(levantando, { tipo: 'altura', ahora: 0, valor: 0.5 }), levantando, 'fuera del equilibrio se ignora')
assert.equal(paso(alto, 'piernaBajada', 13000).resultados[0].altura_max, 0.1)
assert.equal(paso(alto, 'piernaBajada', 13000).pico, null, 'el pico no pasa al paso siguiente')
assert.deepEqual([paso(alto, 'piernaBajada', 10300).fase, paso(alto, 'piernaBajada', 10300).pico], ['levantar', null], 'un rebote descarta el pico')
assert.equal(paso(paso(alto, 'piernaBajada', 13000), 'seguir').pico, null)

// ─ saltar ("me cuesta"): el paso termina sin puntaje y no cuenta como intento
const salto = paso(en('levantar'), 'saltar')
assert.deepEqual([salto.fase, salto.completadas, salto.resultados, salto.desdeMs], ['descanso', 1, [res('der', 'flamenco', 0, null, true)], null])
const saltoArriba = paso(eq, 'saltar')
assert.deepEqual([saltoArriba.fase, saltoArriba.desdeMs, segundosSostenidos(saltoArriba, 99999)], ['descanso', null, 0], 'con la pierna arriba también: el reloj se corta')
assert.deepEqual(resumen(salto), { mejor_tiempo_segundos: 0, intentos: 0, tiempos_segundos: [0], pasos: [res('der', 'flamenco', 0, null, true)] })
const mezcla = correr([['seguir'], ...rep(20000, 5000)], salto)
assert.deepEqual([mezcla.paso, resumen(mezcla).intentos, resumen(mezcla).mejor_tiempo_segundos, tiempos(mezcla)], [1, 1, 5, [0, 5]], 'saltar uno no impide el siguiente')
assert.equal(paso(ultimoPaso(), 'saltar').fase, 'completado', 'saltar el último paso cierra la sesión')
assert.equal(paso(paso(en('levantar'), 'pausar', 500), 'saltar').pausadoMs, 500, 'la pausa sigue después de saltar')

// ─ pausa en medio de un equilibrio: no cuenta como tiempo sostenido
for (const fase of ARRIBA) {
  const arriba = en(fase)
  const d = arriba.desdeMs
  let p = paso(arriba, 'pausar', d + 2000)
  assert.equal(p.pausadoMs, d + 2000)
  assert.equal(segundosSostenidos(p, d + 99999), 2, `en pausa el reloj se congela (${fase})`)
  assert.equal(reducir(p, { tipo: 'pausar', ahora: d + 3000 }), p, 'pausar con la pausa ya puesta no cambia nada')
  p = paso(p, 'reanudar', d + 12000) // 10 s de pausa
  assert.deepEqual([p.pausadoMs, p.desdeMs], [null, d + 10000], 'el inicio se corre por lo que duró la pausa')
  assert.equal(segundosSostenidos(p, d + 12500), 2.5)
  assert.equal(reducir(p, { tipo: 'reanudar', ahora: d + 13000 }), p, 'reanudar sin pausa no cambia nada')
  const baja = paso(p, 'piernaBajada', d + 14000)  // 2 s antes de la pausa + 2 s después
  if (fase === 'equilibrio') assert.deepEqual([baja.fase, tiempos(baja)], ['descanso', [4]], 'sostuvo 4 s reales, no 14')
  else assert.equal(baja.fase, 'comenzar')
}
// varias pausas seguidas se acumulan
const dosPausas = correr([['pausar', 11000], ['reanudar', 14000], ['pausar', 15000], ['reanudar', 16000]], en('equilibrio'))
assert.equal(segundosSostenidos(dosPausas, 16500), 2.5)
assert.deepEqual(tiempos(paso(dosPausas, 'piernaBajada', 17000)), [3], '1 s + 1 s + 1 s, sin los 4 s pausados')
// bajar la pierna estando en pausa usa el instante de la pausa, y la pausa sigue después
const bajaEnPausa = correr([['pausar', 13000], ['piernaBajada', 60000]], en('equilibrio'))
assert.deepEqual([bajaEnPausa.fase, tiempos(bajaEnPausa), bajaEnPausa.pausadoMs], ['descanso', [3], 13000])
assert.deepEqual([paso(bajaEnPausa, 'reanudar', 70000).desdeMs, paso(bajaEnPausa, 'reanudar', 70000).pausadoMs], [null, null], 'sin pierna arriba reanudar no inventa un inicio')
// la pausa tampoco hace que un rebote cuente
assert.equal(correr([['pausar', 10400], ['piernaBajada', 50000]], en('equilibrio')).fase, 'levantar', '0,4 s sostenidos antes de pausar: rebote')
assert.equal(correr([['pausar', 10500], ['reanudar', 50000], ['piernaBajada', 50300]], en('equilibrio')).fase, 'levantar', '0,8 s en total: rebote')
// pierna que sube durante la pausa: cuenta desde que se reanuda
const sube = correr([['pausar', 30000], ['piernaLevantada', 31000]], en('levantar'))
assert.deepEqual([sube.fase, sube.desdeMs, segundosSostenidos(sube, 99999)], ['equilibrio', 30000, 0])
const subeYSigue = correr([['reanudar', 35000], ['piernaBajada', 37000]], sube)
assert.deepEqual([subeYSigue.fase, tiempos(subeYSigue)], ['descanso', [2]])

// ─ pausar y reanudar con la pierna abajo (en cualquier fase): solo mueven pausadoMs
for (const fase of FASES.filter((f) => !ARRIBA.includes(f))) {
  const base = en(fase)
  const pausado = paso(base, 'pausar', 700)
  assert.deepEqual(pausado, { ...base, pausadoMs: 700 }, `pausar en ${fase}`)
  assert.equal(reducir(pausado, { tipo: 'pausar', ahora: 800 }), pausado)
  assert.deepEqual(paso(pausado, 'reanudar', 5000), base, `reanudar en ${fase} deja todo como estaba (desdeMs sigue en null)`)
  assert.equal(reducir(base, { tipo: 'reanudar', ahora: 5000 }), base, `reanudar sin pausa en ${fase}`)
}

// ─ redondeo a 0,1 s y reloj con fracciones (performance.now() trae decimales)
for (const [ms, esperado] of [[1000, 1], [1049, 1], [1050, 1.1], [2960, 3], [12345, 12.3], [12350, 12.4]]) {
  assert.deepEqual(tiempos(correr(rep(0, ms), en('levantar'))), [esperado], `${ms} ms → ${esperado} s`)
}
assert.deepEqual(tiempos(correr(rep(1234.5678, 3210.4321), en('levantar'))), [3.2])

// ─ resumen y mejor tiempo
assert.deepEqual(resumen(inicial()), { mejor_tiempo_segundos: 0, intentos: 0, tiempos_segundos: [], pasos: [] })
assert.deepEqual(resumen(en('comenzar')), { mejor_tiempo_segundos: 0, intentos: 0, tiempos_segundos: [], pasos: [] }, 'la práctica no suma intentos')
assert.deepEqual(resumen(en('descanso')), { mejor_tiempo_segundos: 3, intentos: 1, tiempos_segundos: [3], pasos: [res('der', 'flamenco', 3)] }, 'resumen parcial al salir a mitad del desafío')
assert.equal(resumen(sesion(9000, 2000, 3000, 1500)).mejor_tiempo_segundos, 9, 'el mejor es el 1º')
assert.equal(resumen(sesion(2000, 5500, 3000, 1500)).mejor_tiempo_segundos, 5.5, 'el mejor es uno del medio')
assert.equal(resumen(sesion(2000, 3000, 1500, 6100)).mejor_tiempo_segundos, 6.1, 'el mejor es el último')
assert.equal(resumen(sesion(4000, 4000, 4000, 4000)).mejor_tiempo_segundos, 4, 'todos iguales')
assert.equal(resumen(sesion(4000, 300, 4000)).intentos, 2, 'el rebote no suma intento')
const conResultados = congelar({ ...inicial(), resultados: [res('der', 'flamenco', 1.5)] })
const copia = resumen(conResultados)
copia.tiempos_segundos.push(99)
copia.pasos[0].segundos = 99
assert.deepEqual(conResultados.resultados, [res('der', 'flamenco', 1.5)], 'resumen devuelve copias')

// ─ reiniciar: desde cualquier fase (incluso en pausa) vuelve al principio y se puede jugar de nuevo
for (const fase of FASES) assert.deepEqual(paso(en(fase), 'reiniciar'), estadoInicial(), `reiniciar desde ${fase}`)
assert.deepEqual(paso(correr([['pausar', 5]], en('equilibrio')), 'reiniciar'), estadoInicial(), 'reiniciar en pausa')
assert.equal(paso(paso(en('completado'), 'reiniciar'), 'listo').fase, 'calibracion')

console.log('logica.js OK')
