// Mensajes de ánimo del Surf (Figma 833:442, 833:364, 833:292, 833:403).
// Cada uno es [antes, resaltado, después]; el resaltado va en cursiva rosa.
export const MENSAJES = {
  muybien:   ['¡Lo estás haciendo ', 'muy bien', '!'],
  excelente: ['¡', 'Excelente', '!'],
  mejor:     ['¡', 'Cada vez mejor', '!'],
  norindas:  ['¡', 'No te rindas', '!'],
  // Al subir la dificultad (ver dificultad.js): el número es el nivel al que llegó
  nivel2:    ['¡Pasaste al ', 'nivel 2', '!'],
  nivel3:    ['¡Pasaste al ', 'nivel 3', '!'],
  nivel4:    ['¡Pasaste al ', 'nivel 4', '!'],
}

// Los que se dicen al atrapar un pez, en orden y en ciclo. "norindas" es aparte:
// sale cuando pasa un rato sin atrapar nada.
export const FELICITACIONES = ['muybien', 'excelente', 'mejor']

export const textoMensaje = (clave) => MENSAJES[clave]?.join('') ?? ''
