// Cuánto hay que girar la imagen de la cámara para que el paciente quede parado. Es 0 casi siempre; con
// la cámara apoyada de costado (un celular o webcam acostados junto a un televisor) la imagen llega con
// el paciente acostado y MediaPipe no lo reconoce. El navegador no avisa que la cámara está girada, así
// que lo elige quien arma el consultorio (botón "Girar cámara" en la calibración) y queda guardado.
const CLAVE = 'kinetix_camara_rotacion'
const VALIDAS = [0, 90, 180, 270]

let urlAplicada = false

// Grados en sentido horario. La URL (?rotacion=90: sirve para dejarlo armado en un acceso directo o en
// la app móvil) se aplica una sola vez por carga y pasa a lo guardado: si valiera siempre, el botón de
// girar no podría cambiarlo.
export function leerRotacion() {
  try {
    if (!urlAplicada) {
      urlAplicada = true
      const params = new URLSearchParams(window.location.search)
      if (params.has('rotacion') && VALIDAS.includes(Number(params.get('rotacion')))) guardarRotacion(Number(params.get('rotacion')))
    }
    const guardada = Number(localStorage.getItem(CLAVE))
    return VALIDAS.includes(guardada) ? guardada : 0
  } catch {
    return 0
  }
}

export const siguienteRotacion = (grados) => (grados + 90) % 360

export function guardarRotacion(grados) {
  try { localStorage.setItem(CLAVE, String(grados)) } catch { /* sin almacenamiento: no queda guardado */ }
}
