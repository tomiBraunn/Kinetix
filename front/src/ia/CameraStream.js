// Singleton — un solo stream de cámara compartido entre Phaser y MediaPipe
let _stream = null
let _promise = null

export async function openCamera() {
  if (_stream) return _stream
  if (_promise) return _promise
  const pedido = navigator.mediaDevices
    .getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
    .then(s => {
      // Si se cerró (closeCamera) mientras se esperaba el permiso, esta cámara ya nadie la va a
      // cerrar: se apaga acá, si no la luz quedaría prendida fuera del juego.
      if (_promise !== pedido) s.getTracks().forEach(t => t.stop())
      else _stream = s
      return s
    })
    // Si falla (permiso denegado, cámara ocupada) no dejar la promesa rechazada
    // cacheada: sino los reintentos devuelven siempre el mismo error.
    .catch(e => { if (_promise === pedido) _promise = null; throw e })
  _promise = pedido
  return pedido
}

export function getStream() { return _stream }

export function closeCamera() {
  _stream?.getTracks().forEach(t => t.stop())
  _stream = null
  _promise = null
}
