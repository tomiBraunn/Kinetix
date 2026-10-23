// Qué pasa con la cámara y con el detector de movimientos, para poder decírselo al usuario. Antes, si la cámara no se
// abría (permiso denegado, otra app usándola, un WebView sin cámara) o el modelo no cargaba, el error iba solo a la
// consola y el paciente veía una pantalla sin cámara y sin explicación. Es un módulo único con un estado compartido
// (como voz.js): CameraStream.js, usePoseAI.js y KinetixAI lo cuentan, AvisoCamara.jsx lo muestra.
import { useSyncExternalStore } from 'react'

// camara: { error } si no se pudo abrir | pidiendoDesde: cuándo se pidió la cámara y todavía no contestó (el permiso
// puede estar esperando que se acepte un cartel) | sinImagen: se abrió pero no llegan cuadros | modelo: { error } si
// el detector no cargó | reintentos: cuántas veces se tocó "Reintentar" (usePoseAI vuelve a arrancar con cada uno)
let foto = { camara: null, pidiendoDesde: null, sinImagen: false, modelo: null, reintentos: 0 }
const oyentes = new Set()

function publicar(cambios) {
  const nueva = { ...foto, ...cambios }
  if (Object.keys(nueva).every((k) => nueva[k] === foto[k])) return
  foto = nueva
  oyentes.forEach((f) => f())
}

export const camaraPidiendo = () => publicar({ pidiendoDesde: Date.now(), camara: null })
export const camaraLista = () => publicar({ pidiendoDesde: null, camara: null })
export const camaraFalla = (error) => publicar({ pidiendoDesde: null, camara: { error } })
export const imagenFalla = () => publicar({ sinImagen: true })
export const imagenOk = () => publicar({ sinImagen: false })
export const modeloFalla = (error) => publicar({ modelo: { error } })
export const modeloOk = () => publicar({ modelo: null })
/** "Reintentar": borra los problemas y avisa a usePoseAI que arranque de nuevo. */
export const pedirReintento = () => publicar({ camara: null, pidiendoDesde: null, sinImagen: false, modelo: null, reintentos: foto.reintentos + 1 })

/** El problema que hay que mostrar (si hay varios, primero el de la cámara), o null. */
export function problemaActual(f = foto) {
  if (f.camara) return { etapa: 'camara', error: f.camara.error }
  if (f.sinImagen) return { etapa: 'imagen', error: null }
  if (f.modelo) return { etapa: 'modelo', error: f.modelo.error }
  return null
}

const suscribir = (f) => { oyentes.add(f); return () => oyentes.delete(f) }

/** El estado completo, y se vuelve a dibujar cuando cambia. */
export const useEstadoCamara = () => useSyncExternalStore(suscribir, () => foto)
/** Solo el contador de reintentos: usePoseAI lo usa para volver a arrancar sin dibujarse por todo lo demás. */
export const useReintentos = () => useSyncExternalStore(suscribir, () => foto.reintentos)

/**
 * Qué decirle al usuario según qué falló y por qué (el `name` de la excepción que da el navegador).
 * @param etapa  'camara' | 'imagen' | 'modelo'
 * @param esApp  dentro de la app Kinetix (WebView de Expo): los permisos se dan en los ajustes del celular
 * @returns { titulo, ayuda, detalle }: `detalle` es el nombre técnico del error, para que quien lo vea pueda avisar al equipo
 */
export function describirFalla(etapa, error, esApp = false) {
  const nombre = error?.name ?? ''
  const detalle = [nombre, error?.message].filter(Boolean).join(': ').slice(0, 160)
  if (etapa === 'modelo') {
    return {
      titulo: 'No se pudo cargar el detector de movimientos',
      ayuda: 'Hace falta conexión a internet y un celular o navegador actualizado. Revisá la conexión y tocá Reintentar.',
      detalle,
    }
  }
  if (etapa === 'imagen') {
    return {
      titulo: 'La cámara no manda imagen',
      ayuda: 'La cámara se abrió pero no llegan cuadros. Cerrá otras apps que la estén usando y tocá Reintentar.',
      detalle: '',
    }
  }
  switch (nombre) {
    case 'NotAllowedError':
    case 'SecurityError':
    case 'PermissionDeniedError':
      return {
        titulo: 'No tenemos permiso para usar la cámara',
        ayuda: esApp
          ? 'Permití la cámara para la app en los ajustes del celular (Aplicaciones, la app, Permisos, Cámara) y tocá Reintentar.'
          : 'Permití la cámara desde el candado de la barra de direcciones y tocá Reintentar.',
        detalle,
      }
    case 'NotFoundError':
    case 'DevicesNotFoundError':
    case 'OverconstrainedError':
      return { titulo: 'No se encontró una cámara', ayuda: 'Este aparato no tiene una cámara disponible, o está desconectada.', detalle }
    case 'NotReadableError':
    case 'TrackStartError':
    case 'AbortError':
      return { titulo: 'La cámara está ocupada', ayuda: 'Otra app la está usando. Cerrala y tocá Reintentar.', detalle }
    case 'TimeoutError':
      return {
        titulo: 'La cámara no responde',
        ayuda: 'El celular no contestó al pedido de la cámara. Revisá que el permiso esté en "Permitir", cerrá otras apps que la usen y tocá Reintentar.',
        detalle,
      }
    case 'NotSupportedError':
      return { titulo: 'Este aparato no permite usar la cámara', ayuda: 'El navegador no admite la cámara en esta pantalla. Probá con otro navegador o actualizalo.', detalle }
    case 'SinMediaDevices':
      return {
        titulo: 'Acá no se puede usar la cámara',
        ayuda: 'El navegador no deja usar la cámara en esta página. Hace falta abrirla desde una dirección segura (https) con un navegador actualizado.',
        detalle,
      }
    default:
      return { titulo: 'No se pudo abrir la cámara', ayuda: 'Tocá Reintentar. Si sigue igual, avisale al equipo con el detalle de abajo.', detalle }
  }
}
