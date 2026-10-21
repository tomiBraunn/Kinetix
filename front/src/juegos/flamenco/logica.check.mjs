import assert from 'node:assert/strict'
import { OBJETIVO_MS, MIN_SOSTENIDO_MS, MAX_SOSTENIDO_MS, MAX_ULTIMA_MS, FASES, crearPasos, estadoInicial, reducir, segundosSostenidos, resumen } from './logica.js'

const OBJ = OBJETIVO_MS
const RUTINA = { repeticiones: 4, dificultad: 'progresiva' } // la de siempre, hasta que se elige otra

// Los estados que pasan por acá van congelados: si reducir mutara uno, tiraría TypeError
// (los módulos son estrictos) y el check se cae. Así la inmutabilidad se prueba en TODO el flujo.
const congelar = (e) => { Object.freeze(e.resultados); Object.freeze(e.pasos); return Object.freeze(e) }
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
camino.descanso = [...camino.levantar, ...rep(10000, OBJ)] // 1er paso cumplido: sostuvo los 10 s
const hastaElUltimo = [['seguir'], ...rep(30000, OBJ), ['seguir'], ...rep(50000, OBJ), ['seguir']] // 2º y 3º cumplidos, el último a punto de empezar
camino.completado = [...camino.descanso, ...hastaElUltimo, ...rep(70000, 7400)]
const en = (fase) => {
  const e = correr(camino[fase])
  assert.equal(e.fase, fase, `el atajo a ${fase} termina en otra fase`)
  return e
}
const ARRIBA = ['practica-equilibrio', 'equilibrio'] // fases con la pierna levantada
// Último paso (el 4º) a punto de empezar: 3 completados
const ultimoPaso = () => correr([...camino.descanso, ...hastaElUltimo])
// El último paso sostenido `ms`
const terminar = (ms) => correr(rep(100000, ms), ultimoPaso())
const res = (pierna, posicion, segundos, altura_max = null, saltado = false, objetivo_segundos = 10) => ({ pierna, posicion, objetivo_segundos, segundos, altura_max, saltado })

// ─ constantes y pasos de la rutina
assert.equal(OBJ, 10000)
assert.equal(MIN_SOSTENIDO_MS, 1000)
assert.equal(MAX_SOSTENIDO_MS, 30000)
assert.equal(MAX_ULTIMA_MS, 60000)
assert.deepEqual(crearPasos(RUTINA).map((p) => [p.pierna, p.posicion, p.objetivoMs]), [
  ['der', 'flamenco', OBJ], ['izq', 'flamenco', OBJ], ['der', 'alto', OBJ], ['izq', 'alto', null],
], 'la de siempre: se alternan las piernas, primero flamenco y después lo más alto; 10 s cada una menos la última')
for (const n of [2, 3, 4, 5, 6, 9, 10]) {
  for (const dificultad of ['progresiva', 'flamenco', 'alto']) {
    const pasos = crearPasos({ repeticiones: n, dificultad })
    const donde = `${n} repeticiones, ${dificultad}`
    assert.equal(pasos.length, n, `${donde}: la cantidad que se pidió`)
    assert.deepEqual(pasos.map((p) => p.pierna), Array.from({ length: n }, (_, i) => (i % 2 ? 'izq' : 'der')), `${donde}: las piernas se alternan empezando por la derecha`)
    assert.deepEqual(pasos.map((p) => p.objetivoMs), [...Array(n - 1).fill(OBJ), null], `${donde}: 10 s cada una y la última sin objetivo`)
    const flamencos = dificultad === 'flamenco' ? n : dificultad === 'alto' ? 0 : Math.ceil(n / 2)
    assert.deepEqual(pasos.map((p) => p.posicion), Array.from({ length: n }, (_, i) => (i < flamencos ? 'flamenco' : 'alto')), `${donde}: la posición según la dificultad`)
  }
}
assert.deepEqual(crearPasos({ repeticiones: 2, dificultad: 'progresiva' }).map((p) => p.posicion), ['flamenco', 'alto'], 'con 2, subiendo: una de cada')
assert.deepEqual(crearPasos({ repeticiones: 3, dificultad: 'progresiva' }).map((p) => p.posicion), ['flamenco', 'flamenco', 'alto'])
assert.deepEqual(FASES, ['instrucciones', 'calibracion', 'preparando', 'practica-levantar', 'practica-equilibrio', 'comenzar', 'levantar', 'equilibrio', 'descanso', 'completado'])
assert.deepEqual(estadoInicial(), { fase: 'instrucciones', rutina: RUTINA, pasos: crearPasos(RUTINA), paso: 0, completadas: 0, resultados: [], pico: null, desdeMs: null, pausadoMs: null, corto: null })
assert.notEqual(estadoInicial().resultados, estadoInicial().resultados, 'cada estado inicial trae su propio array')
assert.notEqual(estadoInicial().rutina, estadoInicial().rutina, 'y su propia rutina')
assert.throws(() => inicial().resultados.push(1), TypeError, 'el congelado funciona: sin esto la inmutabilidad no se estaría probando')

// ─ la rutina que se elige llega con "listo" y define los pasos; sin ella queda la de siempre
const elegida = paso(inicial(), 'listo', 0, { valor: { repeticiones: 6, dificultad: 'alto' } })
assert.deepEqual([elegida.fase, elegida.rutina, elegida.pasos.length, elegida.pasos.every((p) => p.posicion === 'alto')], ['calibracion', { repeticiones: 6, dificultad: 'alto' }, 6, true])
assert.deepEqual(paso(inicial(), 'listo').pasos, crearPasos(RUTINA), 'sin rutina, la de siempre')
const dosRepeticiones = correr([...camino.comenzar, ['comenzar'], ...rep(10000, OBJ), ['seguir'], ...rep(30000, 12000)], correr([['listo', 0, { valor: { repeticiones: 2, dificultad: 'flamenco' } }], ['calibrado'], ['escenaLista'], ...rep(1000, 2500)]))
assert.deepEqual([dosRepeticiones.fase, dosRepeticiones.completadas, tiempos(dosRepeticiones)], ['completado', 2, [10, 12]], 'con 2 repeticiones el desafío termina en la 2ª: 10 s y la última libre')
const seis = correr([...rep(10000, OBJ), ['seguir'], ...rep(30000, OBJ), ['seguir'], ...rep(50000, OBJ), ['seguir'], ...rep(70000, OBJ), ['seguir'], ...rep(90000, OBJ)],
  correr([['listo', 0, { valor: { repeticiones: 6, dificultad: 'progresiva' } }], ['calibrado'], ['escenaLista'], ...rep(1000, 2500), ['comenzar']]))
assert.deepEqual([seis.fase, seis.paso, seis.completadas], ['descanso', 4, 5], 'con 6 repeticiones, después de la 5ª todavía queda una')
assert.equal(correr([['seguir'], ...rep(110000, 40000)], seis).fase, 'completado')
const sinCambios = paso(en('levantar'), 'listo', 0, { valor: { repeticiones: 9, dificultad: 'alto' } })
assert.deepEqual([sinCambios.rutina, sinCambios.pasos.length], [RUTINA, 4], 'la rutina solo se elige en "Antes de empezar"')

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
dar('piernaBajada', 20000)
assert.deepEqual([e.fase, e.paso, e.completadas, e.pico, e.desdeMs], ['descanso', 0, 1, null, null])
assert.deepEqual(e.resultados, [res('der', 'flamenco', 10, -0.23)], 'altura máxima redondeada a 0,01 de torso')
dar('seguir');                 assert.deepEqual([e.fase, e.paso, e.completadas], ['levantar', 1, 1], 'seguir lleva al 2º paso (la otra pierna)')

dar('piernaLevantada', 30000); dar('piernaBajada', 40000)
assert.deepEqual([e.fase, e.paso, e.completadas, tiempos(e)], ['descanso', 1, 2, [10, 10]])
dar('seguir')
assert.deepEqual([e.fase, e.paso, e.completadas], ['levantar', 2, 2], 'el 3º es el primero en "alto"')

dar('piernaLevantada', 50000); dar('tick', 59999)
assert.equal(e.fase, 'equilibrio', 'a los 9,999 s todavía no se cumplió')
dar('tick', 60000)
assert.deepEqual([e.fase, e.completadas, tiempos(e)], ['descanso', 3, [10, 10, 10]], 'a los 10 s se cumple solo, sin tener que bajar la pierna')
dar('seguir');                 assert.deepEqual([e.fase, e.paso], ['levantar', 3], 'el último')
dar('piernaLevantada', 70000); dar('tick', 70000 + OBJ + 5000)
assert.equal(e.fase, 'equilibrio', 'el último no se cumple a los 10 s: se aguanta todo lo que se pueda')
dar('piernaBajada', 77400)
assert.deepEqual([e.fase, e.paso, e.completadas, tiempos(e), e.desdeMs], ['completado', 3, 4, [10, 10, 10, 7.4], null], 'tiempos redondeados a 0,1 s; el paso se queda en el último')
assert.deepEqual(e.resultados.map((r) => [r.pierna, r.posicion]), crearPasos(RUTINA).map((p) => [p.pierna, p.posicion]), 'cada resultado lleva su pierna y su posición')
assert.deepEqual([...visitadas].sort(), [...FASES].sort(), 'el recorrido pasa por las 10 fases')
assert.deepEqual(resumen(e), {
  mejor_tiempo_segundos: 10, intentos: 4, tiempos_segundos: [10, 10, 10, 7.4],
  pasos: [res('der', 'flamenco', 10, -0.23), res('izq', 'flamenco', 10), res('der', 'alto', 10), res('izq', 'alto', 7.4, null, false, null)],
  rutina: RUTINA,
})
assert.deepEqual(e.resultados.slice(1, 3), en('completado').resultados.slice(1, 3), 'el atajo de los otros tests da los mismos pasos')

// ─ rebote: bajar antes de MIN_SOSTENIDO_MS no cuenta, no se menciona y se vuelve a pedir la pierna
for (const [nombre, base, vuelve] of [
  ['práctica', en('practica-levantar'), 'practica-levantar'],
  ['1er paso', en('levantar'), 'levantar'],
  ['último paso', ultimoPaso(), 'levantar'],
]) {
  const rebote = correr(rep(5000, MIN_SOSTENIDO_MS - 1), base)
  assert.equal(rebote.fase, vuelve, `rebote en ${nombre}: vuelve a pedir la pierna`)
  assert.deepEqual([rebote.paso, rebote.completadas, tiempos(rebote), rebote.desdeMs, rebote.corto], [base.paso, base.completadas, tiempos(base), null, null], `rebote en ${nombre}: no cuenta nada ni se lo dice`)
  assert.equal(segundosSostenidos(rebote, 99999), 0, `rebote en ${nombre}: el reloj vuelve a 0`)
}
assert.equal(correr(rep(5000, MIN_SOSTENIDO_MS), en('practica-levantar')).fase, 'comenzar', `justo ${MIN_SOSTENIDO_MS} ms ya cuenta en la práctica`)
assert.equal(correr(rep(5000, MIN_SOSTENIDO_MS), ultimoPaso()).fase, 'completado', 'y en la última repetición, que no tiene objetivo')
const reintento = correr([...rep(5000, 200), ...rep(8000, OBJ)], en('levantar'))
assert.deepEqual([reintento.fase, reintento.paso, reintento.completadas, tiempos(reintento)], ['descanso', 0, 1, [10]], 'tras un rebote, el reintento cuenta solo su propio tiempo')

// ─ el objetivo: una repetición (menos la última) solo cuenta si se sostienen los 10 s
const eq = en('equilibrio') // desdeMs = 10000, 1er paso
assert.equal(reducir(eq, { tipo: 'tick', ahora: eq.desdeMs + OBJ - 1 }), eq, 'un instante antes del objetivo no pasa nada')
const cumplido = paso(eq, 'tick', eq.desdeMs + OBJ)
assert.deepEqual([cumplido.fase, cumplido.completadas, cumplido.desdeMs, cumplido.corto, cumplido.resultados], ['descanso', 1, null, null, [res('der', 'flamenco', 10)]])
assert.deepEqual(tiempos(paso(eq, 'piernaBajada', eq.desdeMs + 50000)), [10], 'si la bajada llega tarde, igual cuenta 10 s y no más')
const corto = paso(paso(eq, 'altura', 10500, { valor: 0.3 }), 'piernaBajada', eq.desdeMs + 7400)
assert.deepEqual([corto.fase, corto.paso, corto.completadas, corto.resultados, corto.corto, corto.desdeMs, corto.pico], ['levantar', 0, 0, [], 7.4, null, null], 'bajó a los 7,4 s: no cuenta, se anota cuánto aguantó y se vuelve a pedir')
assert.equal(paso(eq, 'piernaBajada', eq.desdeMs + 9990).corto, 9.9, 'se anota sin redondear para arriba: 9,99 s no es "10 segundos"')
assert.equal(paso(eq, 'piernaBajada', eq.desdeMs + OBJ).fase, 'descanso', 'justo 10 s cuenta')
const denuevo = paso(corto, 'piernaLevantada', 30000)
assert.deepEqual([denuevo.fase, denuevo.corto, denuevo.desdeMs], ['equilibrio', null, 30000], 'al levantar de nuevo se borra el aviso y arranca de cero')
assert.deepEqual([paso(denuevo, 'tick', 40000).fase, tiempos(paso(denuevo, 'tick', 40000))], ['descanso', [10]], 'el reintento cumplido cuenta')
assert.equal(paso(corto, 'saltar').corto, null, 'saltar borra el aviso')
assert.equal(paso(corto, 'reiniciar').corto, null)
assert.equal(resumen(corto).intentos, 0, 'una repetición que no llegó no es un intento')

// ─ la última repetición: aguantar todo lo que se pueda, hasta el tope
const ultArriba = paso(ultimoPaso(), 'piernaLevantada', 100000)
assert.equal(reducir(ultArriba, { tipo: 'tick', ahora: 100000 + OBJ }), ultArriba, 'a los 10 s no termina')
assert.equal(reducir(ultArriba, { tipo: 'tick', ahora: 100000 + MAX_ULTIMA_MS - 1 }), ultArriba, 'ni un instante antes del tope')
const topeUltimo = paso(ultArriba, 'tick', 100000 + MAX_ULTIMA_MS)
assert.deepEqual([topeUltimo.fase, tiempos(topeUltimo).at(-1), topeUltimo.resultados.at(-1).objetivo_segundos], ['completado', 60, null], 'a los 60 s se da por cumplida')
assert.equal(tiempos(paso(ultArriba, 'piernaBajada', 100000 + 90000)).at(-1), 60, 'si la bajada llega tarde, cuenta 60 s y no más')
assert.equal(tiempos(terminar(25000)).at(-1), 25, 'bajar a los 25 s cuenta 25 s')
assert.equal(tiempos(terminar(12345)).at(-1), 12.3, 'a 0,1 s')
assert.equal(paso(ultimoPaso(), 'saltar').resultados.at(-1).objetivo_segundos, null)

// ─ tope de la práctica: a los 30 s se da por terminada
assert.equal(reducir(en('practica-equilibrio'), { tipo: 'tick', ahora: 1000 + MAX_SOSTENIDO_MS - 1 }).fase, 'practica-equilibrio')
assert.equal(paso(en('practica-equilibrio'), 'tick', 1000 + MAX_SOSTENIDO_MS).fase, 'comenzar', 'en la práctica el tope sigue siendo de 30 s')
const pausadoEnTope = paso(eq, 'pausar', eq.desdeMs + 5000)
assert.equal(reducir(pausadoEnTope, { tipo: 'tick', ahora: eq.desdeMs + 99999 }), pausadoEnTope, 'en pausa el objetivo no corta')

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
const bajoDos = correr([['piernaLevantada', 0], ['piernaBajada', OBJ], ['piernaBajada', OBJ + 100]], en('levantar'))
assert.deepEqual([bajoDos.fase, bajoDos.completadas, tiempos(bajoDos)], ['descanso', 1, [10]])
// piernaBajada sin haber levantado: ni en la práctica ni en el paso
for (const fase of ['practica-levantar', 'levantar']) {
  const base = en(fase)
  assert.equal(reducir(base, { tipo: 'piernaBajada', ahora: 5000 }), base, `bajada sin levantar en ${fase}`)
}

// ─ comenzar arranca de cero aunque el estado traiga restos
const sucio = congelar({ ...en('comenzar'), paso: 3, completadas: 2, resultados: [res('der', 'flamenco', 1), res('izq', 'flamenco', 2)], pico: 0.3, corto: 4 })
assert.deepEqual(paso(sucio, 'comenzar'), { ...inicial(), fase: 'levantar' }, 'paso=0, completadas=0, resultados=[], pico=null, corto=null')

// ─ reloj de equilibrio
assert.equal(segundosSostenidos(inicial(), 5000), 0, 'sin pierna arriba: 0')
assert.equal(segundosSostenidos(en('descanso'), 5000), 0, 'tras bajar la pierna: 0')
for (const fase of ARRIBA) {
  const arriba = en(fase)
  assert.equal(segundosSostenidos(arriba, arriba.desdeMs + 2500), 2.5, `cuenta hacia arriba en ${fase}`)
  assert.equal(segundosSostenidos(arriba, arriba.desdeMs - 500), 0, 'nunca negativo')
}

// ─ altura de la rodilla: solo cuenta el máximo y solo mientras se sostiene
let alto = paso(eq, 'altura', 10100, { valor: -0.5 })
assert.equal(alto.pico, -0.5)
alto = paso(alto, 'altura', 10200, { valor: 0.1 }); assert.equal(alto.pico, 0.1)
assert.equal(reducir(alto, { tipo: 'altura', ahora: 10300, valor: -0.4 }), alto, 'una altura menor no cambia nada (ni re-renderiza)')
assert.equal(reducir(alto, { tipo: 'altura', ahora: 10300, valor: 0.1 }), alto, 'igual tampoco')
const levantando = en('levantar')
assert.equal(reducir(levantando, { tipo: 'altura', ahora: 0, valor: 0.5 }), levantando, 'fuera del equilibrio se ignora')
assert.equal(paso(alto, 'tick', 10000 + OBJ).resultados[0].altura_max, 0.1)
assert.equal(paso(alto, 'tick', 10000 + OBJ).pico, null, 'el pico no pasa al paso siguiente')
assert.deepEqual([paso(alto, 'piernaBajada', 10300).fase, paso(alto, 'piernaBajada', 10300).pico], ['levantar', null], 'un rebote descarta el pico')
assert.equal(paso(paso(alto, 'tick', 10000 + OBJ), 'seguir').pico, null)

// ─ saltar ("me cuesta"): el paso termina sin puntaje y no cuenta como intento
const salto = paso(en('levantar'), 'saltar')
assert.deepEqual([salto.fase, salto.completadas, salto.resultados, salto.desdeMs], ['descanso', 1, [res('der', 'flamenco', 0, null, true)], null])
const saltoArriba = paso(eq, 'saltar')
assert.deepEqual([saltoArriba.fase, saltoArriba.desdeMs, segundosSostenidos(saltoArriba, 99999)], ['descanso', null, 0], 'con la pierna arriba también: el reloj se corta')
assert.deepEqual(resumen(salto), { mejor_tiempo_segundos: 0, intentos: 0, tiempos_segundos: [0], pasos: [res('der', 'flamenco', 0, null, true)], rutina: RUTINA })
const mezcla = correr([['seguir'], ...rep(20000, OBJ)], salto)
assert.deepEqual([mezcla.paso, resumen(mezcla).intentos, resumen(mezcla).mejor_tiempo_segundos, tiempos(mezcla)], [1, 1, 10, [0, 10]], 'saltar uno no impide el siguiente')
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
  if (fase === 'equilibrio') assert.deepEqual([baja.fase, baja.corto], ['levantar', 4], 'sostuvo 4 s reales, no 14')
  else assert.equal(baja.fase, 'comenzar')
}
// el objetivo también cuenta sin la pausa: 10 s de equilibrio + 4 s pausado
const conPausa = correr([['pausar', 15000], ['reanudar', 19000]], en('equilibrio')) // 5 s sostenidos antes de pausar
assert.equal(reducir(conPausa, { tipo: 'tick', ahora: 23999 }), conPausa, 'a los 9,999 s sostenidos (sin contar la pausa) todavía no')
assert.equal(paso(conPausa, 'tick', 24000).fase, 'descanso', 'a los 10 s sostenidos, ya')
// varias pausas seguidas se acumulan
const dosPausas = correr([['pausar', 11000], ['reanudar', 14000], ['pausar', 15000], ['reanudar', 16000]], en('equilibrio'))
assert.equal(segundosSostenidos(dosPausas, 16500), 2.5)
assert.equal(paso(dosPausas, 'piernaBajada', 17000).corto, 3, '1 s + 1 s + 1 s, sin los 4 s pausados')
// bajar la pierna estando en pausa usa el instante de la pausa, y la pausa sigue después
const bajaEnPausa = correr([['pausar', 13000], ['piernaBajada', 60000]], en('equilibrio'))
assert.deepEqual([bajaEnPausa.fase, bajaEnPausa.corto, bajaEnPausa.pausadoMs], ['levantar', 3, 13000])
assert.deepEqual([paso(bajaEnPausa, 'reanudar', 70000).desdeMs, paso(bajaEnPausa, 'reanudar', 70000).pausadoMs], [null, null], 'sin pierna arriba reanudar no inventa un inicio')
// la pausa tampoco hace que un rebote cuente
assert.deepEqual([correr([['pausar', 10400], ['piernaBajada', 50000]], en('equilibrio')).fase, correr([['pausar', 10400], ['piernaBajada', 50000]], en('equilibrio')).corto], ['levantar', null], '0,4 s sostenidos antes de pausar: rebote')
assert.equal(correr([['pausar', 10500], ['reanudar', 50000], ['piernaBajada', 50300]], en('equilibrio')).corto, null, '0,8 s en total: rebote')
// pierna que sube durante la pausa: cuenta desde que se reanuda
const sube = correr([['pausar', 30000], ['piernaLevantada', 31000]], en('levantar'))
assert.deepEqual([sube.fase, sube.desdeMs, segundosSostenidos(sube, 99999)], ['equilibrio', 30000, 0])
const subeYSigue = correr([['reanudar', 35000], ['piernaBajada', 37000]], sube)
assert.deepEqual([subeYSigue.fase, subeYSigue.corto], ['levantar', 2])

// ─ pausar y reanudar con la pierna abajo (en cualquier fase): solo mueven pausadoMs
for (const fase of FASES.filter((f) => !ARRIBA.includes(f))) {
  const base = en(fase)
  const pausado = paso(base, 'pausar', 700)
  assert.deepEqual(pausado, { ...base, pausadoMs: 700 }, `pausar en ${fase}`)
  assert.equal(reducir(pausado, { tipo: 'pausar', ahora: 800 }), pausado)
  assert.deepEqual(paso(pausado, 'reanudar', 5000), base, `reanudar en ${fase} deja todo como estaba (desdeMs sigue en null)`)
  assert.equal(reducir(base, { tipo: 'reanudar', ahora: 5000 }), base, `reanudar sin pausa en ${fase}`)
}

// ─ redondeo a 0,1 s y reloj con fracciones (performance.now() trae decimales), en la última repetición
for (const [ms, esperado] of [[1000, 1], [1049, 1], [1050, 1.1], [2960, 3], [12345, 12.3], [12350, 12.4]]) {
  assert.equal(tiempos(correr(rep(0, ms), ultimoPaso())).at(-1), esperado, `${ms} ms → ${esperado} s`)
}
assert.equal(tiempos(correr(rep(1234.5678, 3210.4321), ultimoPaso())).at(-1), 3.2)

// ─ resumen y mejor tiempo
assert.deepEqual(resumen(inicial()), { mejor_tiempo_segundos: 0, intentos: 0, tiempos_segundos: [], pasos: [], rutina: RUTINA })
assert.deepEqual(resumen(en('comenzar')), { mejor_tiempo_segundos: 0, intentos: 0, tiempos_segundos: [], pasos: [], rutina: RUTINA }, 'la práctica no suma intentos')
assert.deepEqual(resumen(en('descanso')), { mejor_tiempo_segundos: 10, intentos: 1, tiempos_segundos: [10], pasos: [res('der', 'flamenco', 10)], rutina: RUTINA }, 'resumen parcial al salir a mitad del desafío')
assert.equal(resumen(terminar(42000)).mejor_tiempo_segundos, 42, 'el mejor es el de la última repetición, la que no tiene tope de 10 s')
assert.equal(resumen(terminar(4000)).mejor_tiempo_segundos, 10, 'o uno de los de 10 s')
assert.equal(resumen(terminar(10000)).mejor_tiempo_segundos, 10, 'todos iguales')
assert.equal(resumen(correr([...rep(100000, 300), ...rep(110000, 4000)], ultimoPaso())).intentos, 4, 'el rebote no suma intento')
assert.deepEqual(resumen(elegida).rutina, { repeticiones: 6, dificultad: 'alto' }, 'el resumen lleva la rutina elegida')
const conResultados = congelar({ ...inicial(), resultados: [res('der', 'flamenco', 1.5)] })
const copia = resumen(conResultados)
copia.tiempos_segundos.push(99)
copia.pasos[0].segundos = 99
copia.rutina.repeticiones = 99
assert.deepEqual([conResultados.resultados, conResultados.rutina], [[res('der', 'flamenco', 1.5)], RUTINA], 'resumen devuelve copias')

// ─ reiniciar: desde cualquier fase (incluso en pausa) vuelve al principio y se puede jugar de nuevo
for (const fase of FASES) assert.deepEqual(paso(en(fase), 'reiniciar'), estadoInicial(), `reiniciar desde ${fase}`)
assert.deepEqual(paso(correr([['pausar', 5]], en('equilibrio')), 'reiniciar'), estadoInicial(), 'reiniciar en pausa')
assert.equal(paso(paso(en('completado'), 'reiniciar'), 'listo').fase, 'calibracion')
assert.deepEqual(paso(elegida, 'reiniciar').rutina, RUTINA, 'reiniciar vuelve a la rutina de siempre (se elige de nuevo al empezar)')

console.log('logica.js OK')
