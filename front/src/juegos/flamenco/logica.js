// Flujo del Flamenco Challenge como máquina de estados pura: sin React y sin reloj
// propio (cada evento trae su `ahora`, en ms). Así se prueba con node
// (logica.check.mjs) y la página solo traduce lo que detecta MediaPipe a eventos.

// Los pasos alternan las piernas (mientras una trabaja la otra descansa) y suben de exigencia:
// primero "flamenco" (pie despegado) y después "alto" (la rodilla lo más arriba posible).
export const PASOS = [
  { pierna: 'der', posicion: 'flamenco' },
  { pierna: 'izq', posicion: 'flamenco' },
  { pierna: 'der', posicion: 'alto' },
  { pierna: 'izq', posicion: 'alto' },
]
export const REPETICIONES = PASOS.length
export const MIN_SOSTENIDO_MS = 1000  // bajar la pierna antes de esto no cuenta (falso positivo o rebote)
export const MAX_SOSTENIDO_MS = 30000 // tope: más no suma y el paso se da por cumplido (cansancio y riesgo de caída)

export const FASES = [
  'instrucciones', 'calibracion', 'preparando',
  'practica-levantar', 'practica-equilibrio', 'comenzar',
  'levantar', 'equilibrio', 'descanso', 'completado',
]

// Si la pierna se baja demasiado pronto se vuelve a pedir que la levante
const VUELVE_A = { 'practica-equilibrio': 'practica-levantar', equilibrio: 'levantar' }

export function estadoInicial() {
  return {
    fase: 'instrucciones',
    paso: 0,           // índice en PASOS del paso en curso
    completadas: 0,    // pasos terminados (también los saltados)
    resultados: [],    // de cada paso terminado: { pierna, posicion, segundos, altura_max, saltado }
    pico: null,        // altura más alta de la rodilla en el paso en curso (largos de torso, ver ia/piernas.js)
    desdeMs: null,     // cuándo se levantó la pierna (null si no hay una arriba)
    pausadoMs: null,   // cuándo se pausó (null si no está en pausa)
  }
}

// Hasta dónde corre el reloj de la pierna: en pausa se congela
const hasta = (estado, ahora) => estado.pausadoMs ?? ahora

const redondear = (n, decimales) => Math.round(n * 10 ** decimales) / 10 ** decimales

// Cierra el paso en curso con su resultado y pasa al descanso (o al final, si era el último)
function cerrar(estado, resultado) {
  const completadas = estado.completadas + 1
  return {
    ...estado,
    fase: completadas >= PASOS.length ? 'completado' : 'descanso',
    completadas,
    resultados: [...estado.resultados, resultado],
    pico: null,
    desdeMs: null,
  }
}

// Resultado de un paso sostenido `ms` (nunca más que el tope)
const resultadoDe = (estado, ms) => ({
  ...PASOS[estado.paso],
  segundos: Math.round(Math.min(ms, MAX_SOSTENIDO_MS) / 100) / 10, // a 0,1 s
  altura_max: estado.pico == null ? null : redondear(estado.pico, 2),
  saltado: false,
})

// La pierna dejó de estar arriba (o se llegó al tope): fin de la práctica o del paso
function terminarEquilibrio(estado, sostenidoMs) {
  if (sostenidoMs < MIN_SOSTENIDO_MS) return { ...estado, fase: VUELVE_A[estado.fase], pico: null, desdeMs: null }
  if (estado.fase === 'practica-equilibrio') return { ...estado, fase: 'comenzar', pico: null, desdeMs: null }
  return cerrar(estado, resultadoDe(estado, sostenidoMs))
}

/**
 * @param evento { tipo, ahora, valor? }  tipo: listo | calibrado | escenaLista | piernaLevantada | piernaBajada |
 *                                comenzar | seguir | saltar | tick | altura | pausar | reanudar | reiniciar
 *                                (`valor` solo en altura: la altura de la rodilla, en largos de torso)
 * @returns el estado nuevo, o el MISMO objeto si el evento no aplica a la fase actual
 */
export function reducir(estado, { tipo, ahora, valor }) {
  const { fase } = estado
  switch (tipo) {
    case 'listo':
      return fase === 'instrucciones' ? { ...estado, fase: 'calibracion' } : estado
    case 'calibrado':
      return fase === 'calibracion' ? { ...estado, fase: 'preparando' } : estado
    case 'escenaLista':
      return fase === 'preparando' ? { ...estado, fase: 'practica-levantar' } : estado

    case 'piernaLevantada': {
      // En pausa el reloj está congelado: si la pierna sube ahí, cuenta desde el
      // instante de la pausa (al reanudar arranca en 0 en vez de quedar en el futuro)
      const desdeMs = hasta(estado, ahora)
      if (fase === 'practica-levantar') return { ...estado, fase: 'practica-equilibrio', pico: null, desdeMs }
      if (fase === 'levantar') return { ...estado, fase: 'equilibrio', pico: null, desdeMs }
      return estado
    }

    case 'piernaBajada':
      if (fase !== 'practica-equilibrio' && fase !== 'equilibrio') return estado
      return terminarEquilibrio(estado, hasta(estado, ahora) - estado.desdeMs)

    // Pulso de la página: si la pierna llegó al tope de tiempo, el paso termina solo
    case 'tick':
      if ((fase !== 'practica-equilibrio' && fase !== 'equilibrio') || estado.pausadoMs != null) return estado
      return ahora - estado.desdeMs >= MAX_SOSTENIDO_MS ? terminarEquilibrio(estado, MAX_SOSTENIDO_MS) : estado

    // Hasta dónde sube la rodilla mientras se sostiene (solo cuenta el máximo)
    case 'altura':
      return fase === 'equilibrio' && valor > (estado.pico ?? -Infinity) ? { ...estado, pico: valor } : estado

    case 'comenzar':
      return fase === 'comenzar' ? { ...estado, fase: 'levantar', paso: 0, completadas: 0, resultados: [], pico: null, desdeMs: null } : estado
    case 'seguir':
      return fase === 'descanso' ? { ...estado, fase: 'levantar', paso: estado.paso + 1, pico: null, desdeMs: null } : estado

    // "Me cuesta": el paso se da por terminado sin puntaje (nunca hay que forzar a nadie a una posición que no puede)
    case 'saltar':
      return fase === 'levantar' || fase === 'equilibrio'
        ? cerrar(estado, { ...PASOS[estado.paso], segundos: 0, altura_max: null, saltado: true })
        : estado

    case 'pausar':
      return estado.pausadoMs == null ? { ...estado, pausadoMs: ahora } : estado
    case 'reanudar': {
      if (estado.pausadoMs == null) return estado
      // La pausa no cuenta como equilibrio: se corre el inicio por el tiempo que duró
      const desdeMs = estado.desdeMs == null ? null : estado.desdeMs + (ahora - estado.pausadoMs)
      return { ...estado, desdeMs, pausadoMs: null }
    }

    case 'reiniciar':
      return estadoInicial()
    default:
      return estado
  }
}

/** Segundos (con decimales) que lleva la pierna arriba; 0 si no hay una arriba. */
export function segundosSostenidos(estado, ahora) {
  if (estado.desdeMs == null) return 0
  return Math.max(0, (hasta(estado, ahora) - estado.desdeMs) / 1000)
}

/** Lo que se manda al backend al cerrar la sesión (ver MetricasFlamenco en lib/sesiones.ts). */
export function resumen(estado) {
  const hechos = estado.resultados.filter((r) => !r.saltado)
  return {
    mejor_tiempo_segundos: hechos.length ? Math.max(...hechos.map((r) => r.segundos)) : 0,
    intentos: hechos.length, // los pasos saltados no son intentos
    tiempos_segundos: estado.resultados.map((r) => r.segundos),
    pasos: estado.resultados.map((r) => ({ ...r })), // detalle por pierna y posición, para comparar derecha e izquierda
  }
}
