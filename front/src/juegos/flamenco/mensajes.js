// Textos del Flamenco Challenge, tal cual los frames de Figma (archivo
// y8NlmFOJusZ1nl1jvvZdBo, página JUEGOS: 829:67–116 y 858:69–415).
import { REPETICIONES } from './logica'

// Consigna de cada fase (la tarjeta de comenzar/descanso/completado no lleva consigna)
export const CONSIGNAS = {
  calibracion: 'Parate en el centro, frente a la cámara, dentro de la silueta.',
  // No está en el Figma: mientras entra el parque el paciente tiene que saber que ya está bien
  preparando: '¡Muy bien! Quedate ahí, ya empezamos.',
  'practica-levantar': 'Levantá una pierna para empezar.',
  'practica-equilibrio': 'Mantené la pierna arriba el mayor tiempo que puedas.',
  levantar: 'Levantá una pierna para empezar.',
  equilibrio: 'Mantené la pierna arriba el mayor tiempo que puedas.',
}

const SEGUIR = { texto: 'Seguir jugando', variante: 'principal' }
const VOLVER_MENU = { texto: 'Volver al menú de juegos', variante: 'secundario' }

// Tarjetas: `botones` usa claves de acción que resuelve la página
export const TARJETA_COMENZAR = {
  titulo: '¡Ya sabés cómo hacerlo!',
  texto: `Vamos a repetir el ejercicio ${REPETICIONES} veces.\n\nLevantá una pierna y mantenela arriba el mayor tiempo que puedas. Después, apoyá el pie y descansá. Avanzá de a poquito, a tu ritmo.`,
  botones: [{ texto: `Comenzar las ${REPETICIONES} repeticiones`, variante: 'principal', accion: 'comenzar' }],
}

// Indexadas por repeticiones completadas (1 y 2): el descanso después de la 3ª es el cierre
export const TARJETAS_DESCANSO = {
  1: {
    titulo: '¡Primer desafío completado!',
    texto: '¡Muy bien, completaste el primer desafío!\n\nApoyá los dos pies y descansá. Cuando estés listo, seguí jugando. Avanzá a tu ritmo.',
    botones: [{ ...SEGUIR, accion: 'seguir' }, { ...VOLVER_MENU, accion: 'volver' }],
  },
  2: {
    titulo: '¡Segundo desafío completado!',
    texto: '¡Ya completaste dos desafíos!\n\nApoyá los dos pies y descansá. Cuando estés listo, vamos con el último. Seguí a tu ritmo.',
    botones: [{ ...SEGUIR, accion: 'seguir' }],
  },
}

export const TARJETA_COMPLETADO = {
  titulo: '¡Desafío completado!',
  texto: `Completaste los ${REPETICIONES} desafíos de Flamingo Challenge.\n\nAvanzaste paso a paso. Apoyá ambos pies y relajate. ¡Buen trabajo!`,
  botones: [{ texto: 'Volver a juegos', variante: 'principal', accion: 'volver' }],
}
