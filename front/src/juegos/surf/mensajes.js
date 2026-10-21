// Mensajes de ánimo del Surf (Figma 833:442, 833:364, 833:292, 833:403).
// Cada uno es [antes, resaltado, después]; el resaltado va en cursiva rosa.
export const MENSAJES = {
  bienhecho: ['¡', 'Bien hecho', '!'],
  seguiasi:  ['¡', 'Seguí así', '!'],
  muybien:   ['¡Lo estás haciendo ', 'muy bien', '!'],
  excelente: ['¡', 'Excelente', '!'],
  mejor:     ['¡', 'Cada vez mejor', '!'],
  asi:       ['¡Así se ', 'hace', '!'],
  norindas:  ['¡', 'No te rindas', '!'],
  // Los pone la IA (movimiento.js), no la escena: cuando lleva un rato haciéndolo bien, y cuando mueve de más
  // los pies o la cadera (el juego se juega solo con el tronco y los brazos)
  postura:   ['¡Muy bien! ', 'Seguí así', ', con los pies quietos'],
  alerta:    ['¡Cuidado! ', 'No muevas los pies', '. Alcanzá con el tronco y los brazos.'],
  // Al subir la dificultad (ver dificultad.js): el número es el nivel al que llegó
  nivel2:    ['¡Pasaste al ', 'nivel 2', '!'],
  nivel3:    ['¡Pasaste al ', 'nivel 3', '!'],
  nivel4:    ['¡Pasaste al ', 'nivel 4', '!'],
}

// Los que se dicen al atrapar un pez, en orden y en ciclo. "norindas" es aparte:
// sale cuando pasa un rato sin atrapar nada.
export const FELICITACIONES = ['bienhecho', 'seguiasi', 'muybien', 'excelente', 'asi', 'mejor']

export const textoMensaje = (clave) => MENSAJES[clave]?.join('') ?? ''

// Lo que dice el pez en la guía de "cómo se juega", paso a paso, sobre el mar (ver GuiaMascota.jsx). Cortos: cada paso dura
// 5 s y la voz tiene que alcanzar a decirlo (unas 65 letras). Mia tiene que validar los textos y la pose de cada uno.
export const GUIA_SURF = [
  { pose: 'celebra', texto: '¡Hola! Dejá lugar libre para moverte y poné la cámara frente a vos.' },
  { pose: 'reposo', texto: 'Ubicate en la silueta: que se te vea de la cabeza a la cintura.' },
  { pose: 'atrapa', texto: 'Tocá los peces con las manos, sin mover los pies.' },
  { pose: 'celebra', texto: '¿Listo? Tocá el botón y prendemos la cámara.' },
]
