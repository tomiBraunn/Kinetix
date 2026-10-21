// Textos del Flamenco Challenge. La base son los frames de Figma (archivo y8NlmFOJusZ1nl1jvvZdBo,
// página JUEGOS: 829:67–116 y 858:69–415), que tienen 3 repeticiones con "una pierna" genérica. Con
// los pasos alternando piernas y posiciones (ver logica.js) los textos de cada paso se arman acá,
// con las mismas frases del diseño; Mia tiene que validarlos y dibujar los frames del 4º paso.
// La cantidad de repeticiones la elige el kinesiólogo (ver rutina.js): todo se arma según `pasos`.
import { OBJETIVO_MS } from './logica.js' // con extensión: así también lo carga node en el test

const LADO = { der: 'derecha', izq: 'izquierda' }
const CARDINAL = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'] // "¡Ya completaste dos desafíos!"
const ORDINAL = ['', 'Primer', 'Segundo', 'Tercer', 'Cuarto', 'Quinto', 'Sexto', 'Séptimo', 'Octavo', 'Noveno', 'Décimo']
const OBJETIVO_S = OBJETIVO_MS / 1000
const coma = (n) => String(n).replace('.', ',')

const FIJAS = {
  calibracion: 'Parate en el centro, frente a la cámara, dentro de la silueta.',
  // No está en el Figma: mientras entra el parque el paciente tiene que saber que ya está bien
  preparando: '¡Muy bien! Quedate ahí, ya empezamos.',
  'practica-levantar': 'Levantá una pierna para empezar.',
  'practica-equilibrio': 'Mantené la pierna arriba el mayor tiempo que puedas.',
}

/**
 * Consigna de la fase (la tarjeta de comenzar/descanso/completado no lleva consigna).
 * @param pasos  los pasos de la rutina (ver logica.js)
 * @param aviso  lo que ve la cámara y conviene decirle: 'otra' (levantó la otra pierna) | 'subir' (le falta altura) |
 *               'rodillas' (no se le ven las rodillas, así que no hay cómo detectar la pierna) | null
 * @param corto  segundos que aguantó el intento anterior si bajó la pierna antes del objetivo (ver logica.js) | null
 */
export function consigna(fase, paso, pasos, aviso = null, corto = null) {
  if (aviso === 'rodillas' && (fase === 'levantar' || fase === 'practica-levantar')) return 'No te veo las rodillas: alejate un poco o apuntá la cámara más abajo.'
  if (fase !== 'levantar' && fase !== 'equilibrio') return FIJAS[fase] ?? null
  const { pierna, posicion, objetivoMs } = pasos[paso]
  const lado = LADO[pierna]
  const ultima = objetivoMs == null
  if (fase === 'equilibrio') {
    const parte = posicion === 'alto' ? 'rodilla' : 'pierna'
    return ultima ? `Mantené la ${parte} arriba el mayor tiempo que puedas.` : `Mantené la ${parte} arriba durante ${OBJETIVO_S} segundos.`
  }
  if (aviso === 'otra') return `Esa es la otra pierna: levantá la ${lado}.`
  if (aviso === 'subir') return 'Subí la rodilla un poco más.'
  // Bajó antes de tiempo: se lo dice con ánimo y se vuelve a pedir
  if (corto != null) return `Casi: aguantaste ${coma(corto)} segundos. Probá de nuevo con la ${posicion === 'alto' ? 'rodilla' : 'pierna'} ${lado}.`
  if (ultima) return posicion === 'alto' ? `¡La última! Subí la rodilla ${lado} lo más alto que puedas y aguantá todo lo que puedas.` : `¡La última! Levantá la pierna ${lado} y aguantá todo lo que puedas.`
  return posicion === 'alto' ? `Ahora subí la rodilla ${lado} lo más alto que puedas.` : `Levantá la pierna ${lado} para empezar.`
}

const describir = ({ pierna, posicion, objetivoMs }) =>
  (posicion === 'alto' ? `la rodilla ${LADO[pierna]}, lo más alto que puedas` : `la pierna ${LADO[pierna]}, como un flamenco`) +
  (objetivoMs == null ? ', y esta vez aguantá todo lo que puedas' : '')

const SEGUIR = { texto: 'Seguir jugando', variante: 'principal' }
const VOLVER_MENU = { texto: 'Volver al menú de juegos', variante: 'secundario' }

// Tarjetas: `botones` usa claves de acción que resuelve la página

/** Tarjeta de "comenzar": explica la rutina elegida (cuántos desafíos, con qué posiciones y cuánto dura cada uno). */
export function tarjetaComenzar(pasos) {
  const hayFlamenco = pasos.some((p) => p.posicion === 'flamenco')
  const hayAlto = pasos.some((p) => p.posicion === 'alto')
  const posiciones =
    hayFlamenco && hayAlto ? 'Primero levantá cada pierna como un flamenco y mantenela arriba. Después vas a subir la rodilla lo más alto que puedas.'
    : hayAlto ? 'Subí cada rodilla lo más alto que puedas y mantenela arriba.'
    : 'Levantá cada pierna como un flamenco y mantenela arriba.'
  return {
    titulo: '¡Ya sabés cómo hacerlo!',
    texto: `Vamos a hacer ${pasos.length} desafíos, alternando las piernas.\n\n${posiciones} Cada uno dura ${OBJETIVO_S} segundos, menos el último: ahí aguantá todo lo que puedas. Apoyá el pie y descansá entre uno y otro. Avanzá de a poquito, a tu ritmo.`,
    botones: [{ texto: `Comenzar las ${pasos.length} repeticiones`, variante: 'principal', accion: 'comenzar' }],
  }
}

/**
 * Tarjeta de descanso después de `completadas` pasos (1 a pasos.length - 1): dice qué sigue.
 * @param saltado  el paso que se acaba de cerrar fue uno que se saltó ("me cuesta")
 */
export function tarjetaDescanso(completadas, saltado, pasos) {
  const ultimo = completadas === pasos.length - 1
  const logro = saltado
    ? 'No pasa nada, a veces cuesta. Cada uno avanza a su ritmo.'
    : completadas === 1 ? '¡Muy bien, completaste el primer desafío!' : `¡Ya completaste ${CARDINAL[completadas]} desafíos!`
  return {
    titulo: saltado ? '¡Sin problema!' : `¡${ORDINAL[completadas]} desafío completado!`,
    // El paso siguiente arranca solo (ver ESPERA_SIGUIENTE_S en FlamencoPage): el texto avisa en vez de pedir que se toque
    texto: `${logro}\n\nApoyá los dos pies y descansá. En unos segundos ${ultimo ? 'vamos con el último' : 'seguimos'}. A continuación: ${describir(pasos[completadas])}.`,
    botones: completadas === 1 ? [{ ...SEGUIR, accion: 'seguir' }, { ...VOLVER_MENU, accion: 'volver' }] : [{ ...SEGUIR, accion: 'seguir' }],
  }
}

/** Tarjeta final; si hubo un último desafío cumplido cuenta cuánto aguantó (sin inventar nada si se saltó). */
export function tarjetaCompletado(resultados) {
  const ultimo = resultados.at(-1)
  const aguanto = ultimo && !ultimo.saltado ? `\n\nEn el último aguantaste ${coma(ultimo.segundos)} segundos.` : ''
  return {
    titulo: '¡Desafío completado!',
    texto: `Completaste los ${resultados.length} desafíos de Flamingo Challenge.${aguanto}\n\nAvanzaste paso a paso. Apoyá ambos pies y relajate. ¡Buen trabajo!`,
    botones: [{ texto: 'Volver a juegos', variante: 'principal', accion: 'volver' }],
  }
}

// Lo que dice el flamenco en la guía de "cómo se juega", paso a paso, sobre el parque (ver GuiaMascota.jsx). Cortos: cada paso
// dura 5 s y la voz tiene que alcanzar a decirlo (unas 65 letras). Mia tiene que validar los textos y la pose de cada uno.
export const GUIA_FLAMENCO = [
  { pose: 'celebra', texto: '¡Hola! Dejá lugar libre para moverte y poné la cámara frente a vos.' },
  { pose: 'senala', texto: 'Ubicate en la silueta: que se te vea de la cabeza a las rodillas.' },
  { pose: 'flamenco-der', texto: 'Levantá la pierna que te pida y mantené el equilibrio.' },
  { pose: 'reposo', texto: '¿Listo? Tocá el botón y prendemos la cámara.' },
]
