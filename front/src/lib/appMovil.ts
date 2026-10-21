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

// Dentro de la app Expo (WebView con el sufijo KinetixApp en el user agent). La app dibuja encima del
// WebView, abajo a la derecha, el botón nativo "🎮 Juegos" (mobile/src/screens/WebAppScreen.tsx: unos
// 110×46 px a 24 px del borde): tapa los controles que los juegos ponen en esa esquina (volumen, voz,
// girar la cámara). `estiloSobreBotonApp` sube un contenedor de esa esquina por encima del botón; fuera
// de la app es undefined y no cambia nada.
export const esAppExpo = ua.includes('KinetixApp')
export const estiloSobreBotonApp: { transform: string } | undefined = esAppExpo ? { transform: 'translateY(-56px)' } : undefined
