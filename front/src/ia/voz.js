// Voz de las indicaciones: la síntesis del propio navegador (Web Speech API). No hay archivos ni
// servicios de por medio, anda sin internet y dentro del WebView de la app; la calidad depende de las
// voces en español que tenga el aparato. Es un módulo único (no un hook por pantalla) porque la voz es
// una sola: si hablaran dos pantallas a la vez se pisarían.
import { useSyncExternalStore } from 'react'

const sintesis = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null
const CLAVE = 'kinetix_voz_silenciada'
const RITMO = 0.92        // un poco más lento que lo normal: se entiende mejor
const REPETIR_MS = 15000  // el mismo texto no se repite enseguida (avisos que titilan)

// Orden de preferencia: la de Argentina si la hay, después las latinoamericanas y España.
const IDIOMAS = ['es-AR', 'es-419', 'es-US', 'es-MX', 'es-CL', 'es-CO', 'es-ES']

/** Elige la mejor voz en español entre las disponibles (null si no hay ninguna). Prefiere las locales (andan sin internet). */
export function elegirVoz(voces, preferidos = IDIOMAS) {
  const espanol = voces.filter((v) => /^es([-_]|$)/i.test(v.lang))
  for (const idioma of preferidos) {
    const candidatas = espanol.filter((v) => v.lang.replace('_', '-').toLowerCase() === idioma.toLowerCase())
    if (candidatas.length) return candidatas.find((v) => v.localService) ?? candidatas[0]
  }
  return espanol.find((v) => v.localService) ?? espanol[0] ?? null
}

// Mientras se desarrolla la voz arranca apagada en cada carga: con el servidor de desarrollo abierto
// todo el día se escuchaba cada vez que recargaba la página. Se prende con el botón de voz (solo esa
// carga) o con ?voz=1 en la URL, para probarla. La versión publicada (vite build) arranca con la voz
// prendida, salvo que alguien la haya silenciado con el botón.
const EN_DESARROLLO = !!import.meta.env?.DEV

function leerSilencio() {
  if (EN_DESARROLLO) return !/[?&]voz=1(&|$)/.test(window.location.search)
  try { return localStorage.getItem(CLAVE) === '1' } catch { return false }
}

let silenciada = leerSilencio()
let actual = null                 // lo que se está diciendo ahora
let ultimo = { texto: '', t: 0 }
let foto = { hablando: false, silenciada, soportada: !!sintesis } // lo que ven los componentes (useVoz)
const oyentes = new Set()

function publicar(cambios) {
  foto = { ...foto, ...cambios }
  oyentes.forEach((f) => f())
}

/**
 * Dice el texto. Corta lo que se esté diciendo, salvo con sinInterrumpir (se descarta si ya hay algo
 * hablando: sirve para pistas que cambian seguido y no tienen que pisar una consigna).
 */
export function hablar(texto, { sinInterrumpir = false } = {}) {
  if (!sintesis || silenciada || !texto) return
  // `actual` se marca al pedir hablar (no cuando el motor avisa que empezó): si no, dos pedidos
  // seguidos —el StrictMode de desarrollo los hace— se pisarían antes de que se note.
  if (sinInterrumpir && actual) return
  const ahora = Date.now()
  if (texto === ultimo.texto && ahora - ultimo.t < REPETIR_MS) return
  ultimo = { texto, t: ahora }

  sintesis.cancel()
  const u = new SpeechSynthesisUtterance(texto)
  const voz = elegirVoz(sintesis.getVoices())
  if (voz) u.voice = voz
  u.lang = voz?.lang ?? 'es-AR'
  u.rate = RITMO
  const fin = () => { if (actual === u) { actual = null; publicar({ hablando: false }) } }
  u.onstart = () => { if (actual === u) publicar({ hablando: true }) }
  u.onend = fin
  u.onerror = fin
  actual = u
  sintesis.speak(u)
  // Red de seguridad: si el motor nunca avisa que terminó (pasa con pestañas ocultas y textos largos)
  // se da por terminada, si no "hablando" quedaría trabado y la página esperaría para siempre.
  setTimeout(fin, texto.length * 100 + 4000)
}

export function callar() {
  if (!sintesis) return
  sintesis.cancel()
  actual = null
  ultimo = { texto: '', t: 0 } // si se calló a propósito (pausa, cambio de pantalla), lo mismo se puede volver a decir
  publicar({ hablando: false })
}

export function alternarSilencio() {
  silenciada = !silenciada
  try { localStorage.setItem(CLAVE, silenciada ? '1' : '0') } catch { /* sin almacenamiento: queda en memoria */ }
  if (silenciada) callar()
  publicar({ silenciada })
}

/** Hay que llamarla dentro de un toque (por ejemplo "Estoy listo"): navegadores como Safari no dejan hablar hasta que el usuario toca algo. */
export function desbloquear() {
  if (!sintesis) return
  const u = new SpeechSynthesisUtterance(' ')
  u.volume = 0
  sintesis.speak(u)
}

const suscribir = (f) => { oyentes.add(f); return () => oyentes.delete(f) }
const instantanea = () => foto

/** { hablando, silenciada, soportada } y se vuelve a dibujar cuando cambia. */
export function useVoz() {
  return useSyncExternalStore(suscribir, instantanea)
}
