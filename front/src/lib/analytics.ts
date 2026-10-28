// Eventos de Google Analytics (GA4). gtag se carga en index.html; si no está
// (bloqueador de anuncios, desarrollo sin red) simplemente no se manda nada.
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

type Params = Record<string, string | number | boolean>

export function track(evento: string, params: Params = {}) {
  window.gtag?.('event', evento, params)
}
