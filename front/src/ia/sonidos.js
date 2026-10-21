// Efectos de sonido cuando el paciente hace algo bien (pez atrapado, repetición cumplida, ronda terminada) y un
// aviso suave cuando hay algo que corregir. Se sintetizan con Web Audio (osciladores): no hay archivos que
// cargar, andan sin internet y dentro del WebView de la app. Siguen a la voz: si está silenciada (el botón de
// voz, o en desarrollo hasta que se pide con ?voz=1) tampoco suenan, así no molestan mientras se programa.
import { vozSilenciada } from './voz.js' // con extensión: así también lo carga node en el test

// Cada efecto es una lista de notas [frecuencia en Hz, inicio en s, duración en s]
export const EFECTOS = {
  punto: [[784, 0, 0.12], [1175, 0.09, 0.22]],                                 // pez atrapado / pierna detectada: "ping" corto que sube
  subida: [[523, 0, 0.14], [659, 0.12, 0.14], [784, 0.24, 0.3]],              // nivel nuevo / repetición cumplida: tres notas que suben
  fin: [[523, 0, 0.16], [659, 0.15, 0.16], [784, 0.3, 0.16], [1047, 0.45, 0.6]], // ronda o desafío terminado: fanfarria corta
  animo: [[988, 0, 0.4]],                                                      // "¡Muy bien, seguí así!": campanita
  aviso: [[330, 0, 0.22], [262, 0.2, 0.32]],                                   // algo para corregir: dos notas graves que bajan, sin alarma
}
const FORMA = { aviso: 'triangle' } // el resto, ondas puras
const VOLUMEN = 0.12                // bajito: acompaña a la voz y a la música, no las tapa

let contexto = null
let silenciados = false // el juego puede silenciarlos aparte (el Surf lo hace con el botón de la música)

function audio() {
  if (contexto || typeof window === 'undefined') return contexto
  const Contexto = window.AudioContext ?? window.webkitAudioContext
  contexto = Contexto ? new Contexto() : null
  return contexto
}

/** Hay que llamarla dentro de un toque (por ejemplo "Estoy listo"): los navegadores no dejan sonar hasta que el usuario toca algo. */
export function desbloquearSonidos() {
  audio()?.resume?.()
}

export function silenciarEfectos(silenciar) {
  silenciados = silenciar
}

export function sonar(nombre) {
  if (silenciados || vozSilenciada()) return
  const c = audio()
  if (!c) return
  if (c.state === 'suspended') c.resume?.()
  const t0 = c.currentTime + 0.02
  for (const [hz, inicio, duracion] of EFECTOS[nombre] ?? []) {
    const oscilador = c.createOscillator()
    const ganancia = c.createGain()
    oscilador.type = FORMA[nombre] ?? 'sine'
    oscilador.frequency.value = hz
    // Sube rápido y se apaga suave: sin el fundido se escucha un "clic" al empezar y al cortar
    ganancia.gain.setValueAtTime(0.0001, t0 + inicio)
    ganancia.gain.exponentialRampToValueAtTime(VOLUMEN, t0 + inicio + 0.02)
    ganancia.gain.exponentialRampToValueAtTime(0.0001, t0 + inicio + duracion)
    oscilador.connect(ganancia)
    ganancia.connect(c.destination)
    oscilador.start(t0 + inicio)
    oscilador.stop(t0 + inicio + duracion + 0.05)
  }
}
