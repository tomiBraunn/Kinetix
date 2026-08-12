// Singleton — un solo stream de cámara compartido entre Phaser y MediaPipe
let _stream = null
let _promise = null

export async function openCamera() {
  if (_stream) return _stream
  if (_promise) return _promise
  _promise = navigator.mediaDevices
    .getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
    .then(s => { _stream = s; return s })
  return _promise
}

export function getStream() { return _stream }

export function closeCamera() {
  _stream?.getTracks().forEach(t => t.stop())
  _stream = null
  _promise = null
}
