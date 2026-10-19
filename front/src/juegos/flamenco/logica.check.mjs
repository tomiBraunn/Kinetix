import assert from 'node:assert/strict'
import { REPETICIONES, MIN_SOSTENIDO_MS, FASES, estadoInicial, reducir, segundosSostenidos, resumen } from './logica.js'

// Los estados que pasan por acá van congelados: si reducir mutara uno, tiraría TypeError
// (los módulos son estrictos) y el check se cae. Así la inmutabilidad se prueba en TODO el flujo.
const congelar = (e) => { Object.freeze(e.tiempos); return Object.freeze(e) }
const inicial = () => congelar(estadoInicial())
const paso = (e, tipo, ahora = 0) => congelar(reducir(e, { tipo, ahora }))
const correr = (eventos, desde = inicial()) => eventos.reduce((e, [tipo, ahora]) => paso(e, tipo, ahora), desde)

// Pierna levantada en t0 y bajada `ms` después
const rep = (t0, ms) => [['piernaLevantada', t0], ['piernaBajada', t0 + ms]]

// Eventos que llevan a cada fase desde el inicio (la pierna sube a 1 s en la práctica y a 10 s en la 1ª repetición)
const camino = { instrucciones: [] }
camino.calibracion = [['listo']]
camino.preparando = [...camino.calibracion, ['calibrado']]
camino['practica-levantar'] = [...camino.preparando, ['escenaLista']]
camino['practica-equilibrio'] = [...camino['practica-levantar'], ['piernaLevantada', 1000]]
camino.comenzar = [...camino['practica-levantar'], ...rep(1000, 2500)]
camino.levantar = [...camino.comenzar, ['comenzar']]
camino.equilibrio = [...camino.levantar, ['piernaLevantada', 10000]]
camino.descanso = [...camino.levantar, ...rep(10000, 3000)]
camino.completado = [...camino.descanso, ['seguir'], ...rep(20000, 7400), ['seguir'], ...rep(40000, 4260)]
const en = (fase) => {
  const e = correr(camino[fase])
  assert.equal(e.fase, fase, `el atajo a ${fase} termina en otra fase`)
  return e
}
// Una sesión de tantas repeticiones como duraciones (en ms), todas desde la 1ª
const sesion = (...duraciones) => correr(duraciones.flatMap((ms, i) => [...(i ? [['seguir']] : []), ...rep(100000 * (i + 1), ms)]), en('levantar'))
const ARRIBA = ['practica-equilibrio', 'equilibrio'] // fases con la pierna levantada

// ─ constantes y estado inicial
assert.equal(REPETICIONES, 3)
assert.equal(MIN_SOSTENIDO_MS, 1000)
assert.deepEqual(FASES, ['instrucciones', 'calibracion', 'preparando', 'practica-levantar', 'practica-equilibrio', 'comenzar', 'levantar', 'equilibrio', 'descanso', 'completado'])
assert.deepEqual(estadoInicial(), { fase: 'instrucciones', rep: 1, completadas: 0, tiempos: [], desdeMs: null, pausadoMs: null })
assert.notEqual(estadoInicial().tiempos, estadoInicial().tiempos, 'cada estado inicial trae su propio array')
assert.throws(() => inicial().tiempos.push(1), TypeError, 'el congelado funciona: sin esto la inmutabilidad no se estaría probando')

// ─ flujo completo: instrucciones → calibración → parque → práctica → 3 repeticiones → completado
const visitadas = new Set(['instrucciones'])
let e = inicial()
const dar = (tipo, ahora) => { e = paso(e, tipo, ahora); visitadas.add(e.fase); return e }

dar('listo');       assert.equal(e.fase, 'calibracion')
dar('calibrado');   assert.equal(e.fase, 'preparando')
dar('escenaLista'); assert.equal(e.fase, 'practica-levantar')
dar('piernaLevantada', 1000); assert.deepEqual([e.fase, e.desdeMs], ['practica-equilibrio', 1000])
dar('piernaBajada', 3500);    assert.deepEqual([e.fase, e.completadas, e.tiempos, e.desdeMs], ['comenzar', 0, [], null], 'la práctica termina en la tarjeta y no cuenta')
dar('comenzar');              assert.deepEqual([e.fase, e.rep, e.completadas, e.tiempos], ['levantar', 1, 0, []])

dar('piernaLevantada', 10000); assert.deepEqual([e.fase, e.desdeMs], ['equilibrio', 10000])
dar('piernaBajada', 13000);    assert.deepEqual([e.fase, e.rep, e.completadas, e.tiempos, e.desdeMs], ['descanso', 1, 1, [3], null])
dar('seguir');                 assert.deepEqual([e.fase, e.rep, e.completadas], ['levantar', 2, 1], 'seguir lleva a la 2ª repetición')

dar('piernaLevantada', 20000); dar('piernaBajada', 27400)
assert.deepEqual([e.fase, e.rep, e.completadas, e.tiempos], ['descanso', 2, 2, [3, 7.4]])
dar('seguir')
assert.deepEqual([e.fase, e.rep, e.completadas, e.tiempos], ['levantar', 3, 2, [3, 7.4]], 'seguir desde descanso tras la 2ª lleva a la 3ª')

dar('piernaLevantada', 40000); dar('piernaBajada', 44260)
assert.deepEqual([e.fase, e.rep, e.completadas, e.tiempos, e.desdeMs], ['completado', 3, 3, [3, 7.4, 4.3], null], 'tiempos redondeados a 0,1 s; rep se queda en 3')
assert.deepEqual([...visitadas].sort(), [...FASES].sort(), 'el recorrido pasa por las 10 fases')
assert.deepEqual(resumen(e), { mejor_tiempo_segundos: 7.4, intentos: 3, tiempos_segundos: [3, 7.4, 4.3] })
assert.deepEqual(e, en('completado'), 'el atajo de los otros tests da el mismo estado final')

// ─ rebote: bajar antes de MIN_SOSTENIDO_MS no cuenta y se vuelve a pedir la pierna
const rep3 = correr([...camino.descanso, ['seguir'], ...rep(20000, 7400), ['seguir']]) // levantar, rep 3, 2 completadas
for (const [nombre, base, vuelve, cuenta] of [
  ['práctica', en('practica-levantar'), 'practica-levantar', 'comenzar'],
  ['1ª repetición', en('levantar'), 'levantar', 'descanso'],
  ['3ª repetición', rep3, 'levantar', 'completado'],
]) {
  const rebote = correr(rep(5000, MIN_SOSTENIDO_MS - 1), base)
  assert.equal(rebote.fase, vuelve, `rebote en ${nombre}: vuelve a pedir la pierna`)
  assert.deepEqual([rebote.rep, rebote.completadas, rebote.tiempos, rebote.desdeMs], [base.rep, base.completadas, base.tiempos, null], `rebote en ${nombre}: no cuenta nada`)
  assert.equal(segundosSostenidos(rebote, 99999), 0, `rebote en ${nombre}: el reloj vuelve a 0`)
  assert.equal(correr(rep(5000, MIN_SOSTENIDO_MS), base).fase, cuenta, `justo ${MIN_SOSTENIDO_MS} ms ya cuenta en ${nombre}`)
}
const reintento = correr([...rep(5000, 200), ...rep(8000, 4000)], en('levantar'))
assert.deepEqual([reintento.fase, reintento.rep, reintento.completadas, reintento.tiempos], ['descanso', 1, 1, [4]], 'tras un rebote, el reintento cuenta solo su propio tiempo')

// ─ eventos fuera de fase: devuelven el MISMO objeto (React no re-renderiza); los que aplican, uno nuevo
const EVENTOS = ['listo', 'calibrado', 'escenaLista', 'piernaLevantada', 'piernaBajada', 'comenzar', 'seguir']
const aplica = {
  instrucciones: ['listo'], calibracion: ['calibrado'], preparando: ['escenaLista'],
  'practica-levantar': ['piernaLevantada'], 'practica-equilibrio': ['piernaBajada'], comenzar: ['comenzar'],
  levantar: ['piernaLevantada'], equilibrio: ['piernaBajada'], descanso: ['seguir'], completado: [],
}
for (const fase of FASES) {
  const base = en(fase)
  for (const tipo of EVENTOS) {
    const sale = reducir(base, { tipo, ahora: 123456 })
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
// piernaBajada dos veces seguidas: la 2ª no suma otra repetición
const bajoDos = correr([['piernaLevantada', 0], ['piernaBajada', 2000], ['piernaBajada', 2100]], en('levantar'))
assert.deepEqual([bajoDos.fase, bajoDos.completadas, bajoDos.tiempos], ['descanso', 1, [2]])
// piernaBajada sin haber levantado: ni en la práctica ni en la repetición
for (const fase of ['practica-levantar', 'levantar']) {
  const base = en(fase)
  assert.equal(reducir(base, { tipo: 'piernaBajada', ahora: 5000 }), base, `bajada sin levantar en ${fase}`)
}

// ─ comenzar arranca de cero aunque el estado traiga restos
const sucio = congelar({ ...en('comenzar'), rep: 3, completadas: 2, tiempos: [1, 2] })
assert.deepEqual(paso(sucio, 'comenzar'), { ...inicial(), fase: 'levantar' }, 'rep=1, completadas=0, tiempos=[]')

// ─ reloj de equilibrio
assert.equal(segundosSostenidos(inicial(), 5000), 0, 'sin pierna arriba: 0')
assert.equal(segundosSostenidos(en('descanso'), 5000), 0, 'tras bajar la pierna: 0')
for (const fase of ARRIBA) {
  const arriba = en(fase)
  assert.equal(segundosSostenidos(arriba, arriba.desdeMs + 2500), 2.5, `cuenta hacia arriba en ${fase}`)
  assert.equal(segundosSostenidos(arriba, arriba.desdeMs - 500), 0, 'nunca negativo')
}

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
  if (fase === 'equilibrio') assert.deepEqual([baja.fase, baja.tiempos], ['descanso', [4]], 'sostuvo 4 s reales, no 14')
  else assert.equal(baja.fase, 'comenzar')
}
// varias pausas seguidas se acumulan
const dosPausas = correr([['pausar', 11000], ['reanudar', 14000], ['pausar', 15000], ['reanudar', 16000]], en('equilibrio'))
assert.equal(segundosSostenidos(dosPausas, 16500), 2.5)
assert.deepEqual(paso(dosPausas, 'piernaBajada', 17000).tiempos, [3], '1 s + 1 s + 1 s, sin los 4 s pausados')
// bajar la pierna estando en pausa usa el instante de la pausa, y la pausa sigue después
const bajaEnPausa = correr([['pausar', 13000], ['piernaBajada', 60000]], en('equilibrio'))
assert.deepEqual([bajaEnPausa.fase, bajaEnPausa.tiempos, bajaEnPausa.pausadoMs], ['descanso', [3], 13000])
assert.deepEqual([paso(bajaEnPausa, 'reanudar', 70000).desdeMs, paso(bajaEnPausa, 'reanudar', 70000).pausadoMs], [null, null], 'sin pierna arriba reanudar no inventa un inicio')
// la pausa tampoco hace que un rebote cuente
assert.equal(correr([['pausar', 10400], ['piernaBajada', 50000]], en('equilibrio')).fase, 'levantar', '0,4 s sostenidos antes de pausar: rebote')
assert.equal(correr([['pausar', 10500], ['reanudar', 50000], ['piernaBajada', 50300]], en('equilibrio')).fase, 'levantar', '0,8 s en total: rebote')
// pierna que sube durante la pausa: cuenta desde que se reanuda
const sube = correr([['pausar', 30000], ['piernaLevantada', 31000]], en('levantar'))
assert.deepEqual([sube.fase, sube.desdeMs, segundosSostenidos(sube, 99999)], ['equilibrio', 30000, 0])
const subeYSigue = correr([['reanudar', 35000], ['piernaBajada', 37000]], sube)
assert.deepEqual([subeYSigue.fase, subeYSigue.tiempos], ['descanso', [2]])

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
  assert.deepEqual(correr(rep(0, ms), en('levantar')).tiempos, [esperado], `${ms} ms → ${esperado} s`)
}
assert.deepEqual(correr(rep(1234.5678, 3210.4321), en('levantar')).tiempos, [3.2])

// ─ resumen y mejor tiempo
assert.deepEqual(resumen(inicial()), { mejor_tiempo_segundos: 0, intentos: 0, tiempos_segundos: [] })
assert.deepEqual(resumen(en('comenzar')), { mejor_tiempo_segundos: 0, intentos: 0, tiempos_segundos: [] }, 'la práctica no suma intentos')
assert.deepEqual(resumen(en('descanso')), { mejor_tiempo_segundos: 3, intentos: 1, tiempos_segundos: [3] }, 'resumen parcial al salir a mitad del desafío')
assert.equal(resumen(sesion(9000, 2000, 3000)).mejor_tiempo_segundos, 9, 'el mejor es la 1ª')
assert.equal(resumen(sesion(2000, 5500, 3000)).mejor_tiempo_segundos, 5.5, 'el mejor es la del medio')
assert.equal(resumen(sesion(2000, 3000, 6100)).mejor_tiempo_segundos, 6.1, 'el mejor es la última')
assert.equal(resumen(sesion(4000, 4000, 4000)).mejor_tiempo_segundos, 4, 'todas iguales')
assert.equal(resumen(sesion(4000, 300, 4000)).intentos, 2, 'el rebote no suma intento')
const conTiempos = congelar({ ...inicial(), tiempos: [1.5] })
const copia = resumen(conTiempos).tiempos_segundos
copia.push(99)
assert.deepEqual(conTiempos.tiempos, [1.5], 'resumen devuelve una copia')

// ─ reiniciar: desde cualquier fase (incluso en pausa) vuelve al principio y se puede jugar de nuevo
for (const fase of FASES) assert.deepEqual(paso(en(fase), 'reiniciar'), estadoInicial(), `reiniciar desde ${fase}`)
assert.deepEqual(paso(correr([['pausar', 5]], en('equilibrio')), 'reiniciar'), estadoInicial(), 'reiniciar en pausa')
assert.equal(paso(paso(en('completado'), 'reiniciar'), 'listo').fase, 'calibracion')

console.log('logica.js OK')
