// Los juegos solo se abren desde un celular: la app mobile (WebView con el
// sufijo KinetixApp en el user agent, ver mobile/src/screens/WebAppScreen.tsx)
// o cualquier navegador de celular. Desde una compu quedan bloqueados.
// TODO: volver a exigir solo KinetixApp cuando Expo Go/la app lo manden bien.
//
// Para probar los juegos desde la compu: abrir cualquier ruta con ?movil=1
// (queda guardado en este navegador) y ?movil=0 para volver al comportamiento normal.
const CLAVE_FORZAR = 'kinetix_forzar_movil'

function forzadoDesdeUrl(): boolean {
  try {
    const param = new URLSearchParams(window.location.search).get('movil')
    if (param === '1') localStorage.setItem(CLAVE_FORZAR, '1')
    if (param === '0') localStorage.removeItem(CLAVE_FORZAR)
    return localStorage.getItem(CLAVE_FORZAR) === '1'
  } catch {
    return false
  }
}

const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
export const esAppMovil =
  ua.includes('KinetixApp') ||
  /Android|iPhone|iPad|iPod|Mobile/i.test(ua) ||
  (typeof window !== 'undefined' && forzadoDesdeUrl())
