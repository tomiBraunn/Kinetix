// Los juegos solo se abren desde un celular: la app mobile (WebView con el
// sufijo KinetixApp en el user agent, ver mobile/src/screens/WebAppScreen.tsx)
// o cualquier navegador de celular. Desde una compu quedan bloqueados.
// TODO: volver a exigir solo KinetixApp cuando Expo Go/la app lo manden bien.
const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
export const esAppMovil = ua.includes('KinetixApp') || /Android|iPhone|iPad|iPod|Mobile/i.test(ua)
