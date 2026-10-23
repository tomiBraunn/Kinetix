// Singleton — un solo stream de cámara compartido entre Phaser y MediaPipe
import { camaraPidiendo, camaraLista, camaraFalla } from './estadoCamara'

let _stream = null
let _promise = null

// Se pide 4:3 (480×640 con el celular en vertical, 640×480 si no) y no 16:9: el sensor de los celulares
// es 4:3 y un pedido 16:9 lo recorta, o sea que la cámara ve menos escena. En un espacio chico cada
// grado de campo de visión es distancia que el paciente no tiene que retroceder, y de paso son menos
// píxeles para MediaPipe. Es `ideal`, no `exact`: si el aparato no lo tiene usa lo más cercano.
function restricciones() {
  const vertical = window.innerHeight > window.innerWidth
  return { facingMode: 'user', width: { ideal: vertical ? 480 : 640 }, height: { ideal: vertical ? 640 : 480 } }
}

// Si el aparato no acepta lo que se pidió (algunos WebView y celulares viejos rechazan las medidas o la cámara
// frontal) se prueba con menos exigencias, hasta pedir "cualquier cámara". Un permiso denegado o una cámara
// inexistente no se arreglan pidiendo menos: ahí se corta.
const SE_REINTENTA_CON_MENOS = ['OverconstrainedError', 'ConstraintNotSatisfiedError', 'TypeError', 'NotReadableError']

async function pedirCamara() {
  if (!navigator.mediaDevices?.getUserMedia) {
    // Pasa en páginas sin https y en WebView sin soporte: se lo cuenta con un nombre propio (ver estadoCamara.js)
    throw Object.assign(new Error('navigator.mediaDevices no está disponible'), { name: 'SinMediaDevices' })
  }
  let ultimo
  for (const video of [restricciones(), { facingMode: 'user' }, true]) {
    try {
      return await navigator.mediaDevices.getUserMedia({ video, audio: false })
    } catch (e) {
      ultimo = e
      if (!SE_REINTENTA_CON_MENOS.includes(e?.name)) throw e
    }
  }
  throw ultimo
}

export async function openCamera() {
  if (_stream) return _stream
  if (_promise) return _promise
  camaraPidiendo()
  const pedido = pedirCamara()
    .then(s => {
      // Si se cerró (closeCamera) mientras se esperaba el permiso, esta cámara ya nadie la va a
      // cerrar: se apaga acá, si no la luz quedaría prendida fuera del juego.
      if (_promise !== pedido) s.getTracks().forEach(t => t.stop())
      else { _stream = s; camaraLista() }
      return s
    })
    // Si falla (permiso denegado, cámara ocupada) no dejar la promesa rechazada
    // cacheada: sino los reintentos devuelven siempre el mismo error. Y se cuenta para que se vea en pantalla.
    .catch(e => {
      if (_promise === pedido) { _promise = null; camaraFalla(e) }
      throw e
    })
  _promise = pedido
  return pedido
}

export function getStream() { return _stream }

export function closeCamera() {
  _stream?.getTracks().forEach(t => t.stop())
  _stream = null
  _promise = null
  camaraLista() // sin cámara abierta no hay nada que esperar ni que mostrar como error
}
