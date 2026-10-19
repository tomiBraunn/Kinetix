// Textos del Flamenco Challenge. La base son los frames de Figma (archivo y8NlmFOJusZ1nl1jvvZdBo,
// página JUEGOS: 829:67–116 y 858:69–415), que tienen 3 repeticiones con "una pierna" genérica. Con
// los pasos alternando piernas y posiciones (ver logica.js) los textos de cada paso se arman acá,
// con las mismas frases del diseño; Mia tiene que validarlos y dibujar los frames del 4º paso.
import { PASOS, REPETICIONES } from './logica'

const LADO = { der: 'derecha', izq: 'izquierda' }
const CARDINAL = ['', 'un', 'dos', 'tres'] // "¡Ya completaste dos desafíos!"
const ORDINAL = ['', 'Primer', 'Segundo', 'Tercer']

const FIJAS = {
  calibracion: 'Parate en el centro, frente a la cámara, dentro de la silueta.',
  // No está en el Figma: mientras entra el parque el paciente tiene que saber que ya está bien
  preparando: '¡Muy bien! Quedate ahí, ya empezamos.',
  'practica-levantar': 'Levantá una pierna para empezar.',
  'practica-equilibrio': 'Mantené la pierna arriba el mayor tiempo que puedas.',
}

/**
 * Consigna de la fase (la tarjeta de comenzar/descanso/completado no lleva consigna).
 * @param aviso  lo que ve la cámara y conviene decirle: 'otra' (levantó la otra pierna) | 'subir' (le falta altura) | null
 */
export function consigna(fase, paso, aviso = null) {
  if (fase !== 'levantar' && fase !== 'equilibrio') return FIJAS[fase] ?? null
  const { pierna, posicion } = PASOS[paso]
  const lado = LADO[pierna]
  if (fase === 'equilibrio') return `Mantené la ${posicion === 'alto' ? 'rodilla' : 'pierna'} arriba el mayor tiempo que puedas.`
  if (aviso === 'otra') return `Esa es la otra pierna: levantá la ${lado}.`
  if (aviso === 'subir') return 'Subí la rodilla un poco más.'
  return posicion === 'alto' ? `Ahora subí la rodilla ${lado} lo más alto que puedas.` : `Levantá la pierna ${lado} para empezar.`
}

const describir = ({ pierna, posicion }) =>
  posicion === 'alto' ? `la rodilla ${LADO[pierna]}, lo más alto que puedas` : `la pierna ${LADO[pierna]}, como un flamenco`

const SEGUIR = { texto: 'Seguir jugando', variante: 'principal' }
const VOLVER_MENU = { texto: 'Volver al menú de juegos', variante: 'secundario' }

// Tarjetas: `botones` usa claves de acción que resuelve la página
export const TARJETA_COMENZAR = {
  titulo: '¡Ya sabés cómo hacerlo!',
  texto: `Vamos a hacer ${REPETICIONES} desafíos, alternando las piernas.\n\nPrimero levantá cada pierna como un flamenco y mantenela arriba. Después vas a subir la rodilla lo más alto que puedas. Apoyá el pie y descansá entre uno y otro. Avanzá de a poquito, a tu ritmo.`,
  botones: [{ texto: `Comenzar las ${REPETICIONES} repeticiones`, variante: 'principal', accion: 'comenzar' }],
}

/**
 * Tarjeta de descanso después de `completadas` pasos (1 a REPETICIONES - 1): dice qué sigue.
 * @param saltado  el paso que se acaba de cerrar fue uno que se saltó ("me cuesta")
 */
export function tarjetaDescanso(completadas, saltado = false) {
  const ultimo = completadas === REPETICIONES - 1
  const logro = saltado
    ? 'No pasa nada, a veces cuesta. Cada uno avanza a su ritmo.'
    : completadas === 1 ? '¡Muy bien, completaste el primer desafío!' : `¡Ya completaste ${CARDINAL[completadas]} desafíos!`
  return {
    titulo: saltado ? '¡Sin problema!' : `¡${ORDINAL[completadas]} desafío completado!`,
    texto: `${logro}\n\nApoyá los dos pies y descansá. Cuando estés listo, ${ultimo ? 'vamos con el último' : 'seguí jugando'}. A continuación: ${describir(PASOS[completadas])}.`,
    botones: completadas === 1 ? [{ ...SEGUIR, accion: 'seguir' }, { ...VOLVER_MENU, accion: 'volver' }] : [{ ...SEGUIR, accion: 'seguir' }],
  }
}

export const TARJETA_COMPLETADO = {
  titulo: '¡Desafío completado!',
  texto: `Completaste los ${REPETICIONES} desafíos de Flamingo Challenge.\n\nAvanzaste paso a paso. Apoyá ambos pies y relajate. ¡Buen trabajo!`,
  botones: [{ texto: 'Volver a juegos', variante: 'principal', accion: 'volver' }],
}
