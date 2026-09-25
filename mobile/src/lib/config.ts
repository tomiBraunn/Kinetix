// URL pública del frontend web (front/), servido a través de un túnel de
// cloudflared que apunta a `npm run dev` en localhost:5173.
//
// Los túneles rápidos de cloudflared son efímeros: cada vez que se reinicia
// el túnel cambia la URL. Actualizar esta constante cuando eso pase.
export const GAME_SERVER_URL = 'https://hollywood-drew-implemented-accidents.trycloudflare.com'
