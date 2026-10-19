// Qué pose hace la mascota (el flamingo) en cada momento del Flamenco. Función pura: se prueba con
// node (mascota.check.mjs) igual que las consignas. Los nombres son los de los archivos en
// assets/juegos/mascotas (poses/flamingo-<pose>.svg; "reposo" es el dibujo original del Figma).
import { PASOS } from './logica.js' // con extensión: así también lo carga node en el test

// Cuánto dura el ánimo ("¡Muy bien, seguí así!") y a los cuántos segundos sosteniendo aparece
export const HITOS_ANIMO_S = [5, 10, 20]
export const FRASES_ANIMO = ['¡Muy bien, seguí así!', '¡Qué buen equilibrio, no aflojes!', '¡Increíble, seguí un poquito más!']
export const ANIMO_MS = 3000

/**
 * @param aviso  lo que ve la cámara ('otra' | 'subir' | 'rodillas' | null, ver mensajes.js)
 * @param animo  si en este momento está animando
 * La pata levantada cae del mismo lado de la pantalla donde el paciente se ve levantar la suya: la cámara es un
 * espejo, así que "derecha" es el lado derecho de la pantalla y no hay que pensar cuál es cuál.
 */
export function poseMascota({ fase, paso = 0, aviso = null, animo = false }) {
  const p = PASOS[paso]
  const delPaso = p ? `${p.posicion === 'alto' ? 'alto' : 'flamenco'}-${p.pierna}` : 'flamenco-der'
  switch (fase) {
    case 'preparando':
    case 'completado':
      return 'celebra'
    case 'practica-levantar':
    case 'practica-equilibrio': // en la práctica sirve cualquier pierna: muestra una
      return aviso === 'rodillas' ? 'senala' : 'flamenco-der'
    case 'levantar': // con "subí más" ya está haciendo la pose alta: la demostración se repite sola
      return aviso === 'otra' || aviso === 'rodillas' ? 'senala' : delPaso
    case 'equilibrio':
      return animo ? 'anima' : delPaso
    case 'descanso':
      return 'descansa'
    default: // instrucciones, calibración, comenzar
      return 'reposo'
  }
}
