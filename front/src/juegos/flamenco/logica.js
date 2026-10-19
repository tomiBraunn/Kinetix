// Flujo del Flamenco Challenge como máquina de estados pura: sin React y sin reloj
// propio (cada evento trae su `ahora`, en ms). Así se prueba con node
// (logica.check.mjs) y la página solo traduce lo que detecta MediaPipe a eventos.
export const REPETICIONES = 3
export const MIN_SOSTENIDO_MS = 1000 // bajar la pierna antes de esto no cuenta (falso positivo o rebote)

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
    rep: 1,            // repetición en curso (1..REPETICIONES)
    completadas: 0,
    tiempos: [],       // segundos sostenidos de cada repetición completada
    desdeMs: null,     // cuándo se levantó la pierna (null si no hay una arriba)
    pausadoMs: null,   // cuándo se pausó (null si no está en pausa)
  }
}

// Hasta dónde corre el reloj de la pierna: en pausa se congela
const hasta = (estado, ahora) => estado.pausadoMs ?? ahora

/**
 * @param evento { tipo, ahora }  tipo: listo | calibrado | escenaLista | piernaLevantada | piernaBajada |
 *                                comenzar | seguir | pausar | reanudar | reiniciar
 * @returns el estado nuevo, o el MISMO objeto si el evento no aplica a la fase actual
 */
export function reducir(estado, { tipo, ahora }) {
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
      if (fase === 'practica-levantar') return { ...estado, fase: 'practica-equilibrio', desdeMs }
      if (fase === 'levantar') return { ...estado, fase: 'equilibrio', desdeMs }
      return estado
    }

    case 'piernaBajada': {
      if (fase !== 'practica-equilibrio' && fase !== 'equilibrio') return estado
      const sostenidoMs = hasta(estado, ahora) - estado.desdeMs
      if (sostenidoMs < MIN_SOSTENIDO_MS) return { ...estado, fase: VUELVE_A[fase], desdeMs: null }
      if (fase === 'practica-equilibrio') return { ...estado, fase: 'comenzar', desdeMs: null }
      const completadas = estado.completadas + 1
      return {
        ...estado,
        fase: completadas >= REPETICIONES ? 'completado' : 'descanso',
        completadas,
        tiempos: [...estado.tiempos, Math.round(sostenidoMs / 100) / 10],
        desdeMs: null,
      }
    }

    case 'comenzar':
      return fase === 'comenzar' ? { ...estado, fase: 'levantar', rep: 1, completadas: 0, tiempos: [], desdeMs: null } : estado
    case 'seguir':
      return fase === 'descanso' ? { ...estado, fase: 'levantar', rep: estado.rep + 1, desdeMs: null } : estado

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
  return {
    mejor_tiempo_segundos: estado.tiempos.length ? Math.max(...estado.tiempos) : 0,
    intentos: estado.completadas,
    tiempos_segundos: [...estado.tiempos],
  }
}
