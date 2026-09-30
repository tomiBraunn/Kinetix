// La app mobile abre la web dentro de un WebView con este sufijo en el
// user agent (ver mobile/src/screens/WebAppScreen.tsx). Los juegos solo
// corren ahí: desde el navegador de la webapp no se pueden abrir.
export const esAppMovil =
  typeof navigator !== 'undefined' && navigator.userAgent.includes('KinetixApp')
