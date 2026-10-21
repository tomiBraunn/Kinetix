// La rutina que arma el kinesiólogo en "Antes de empezar", después de elegir paciente y juego: cuántas repeticiones
// hacer y si la dificultad va subiendo de a poco o se queda fija. Queda guardada por juego en el equipo (como la
// zona del Surf, ver surf/curva.js). Funciones puras (salvo guardar/leer): se prueban con node (rutina.check.mjs).
//
// `repeticiones` es lo que el juego llama así: en el Flamenco, cada pierna que se levanta; en el Surf, los peces
// que hay que atrapar para terminar la ronda. Cada juego decide qué hace con `dificultad` (ver flamenco/logica.js
// y surf/dificultad.js); acá solo están las opciones, con los textos del selector.
export const RUTINAS = {
  flamenco: {
    repeticiones: {
      min: 2, max: 10, inicial: 4,
      titulo: 'Repeticiones',
      ayuda: 'Cada repetición dura 10 segundos. En la última, el paciente aguanta todo lo que pueda.',
    },
    dificultades: [
      { clave: 'progresiva', etiqueta: 'Ir subiendo de a poco', detalle: 'Empieza con la pierna despegada, como un flamenco, y termina con la rodilla lo más alta que pueda.' },
      { clave: 'flamenco', etiqueta: 'Pierna despegada (fácil)', detalle: 'Todas las repeticiones con el pie apenas despegado del piso.' },
      { clave: 'alto', etiqueta: 'Rodilla alta (difícil)', detalle: 'Todas las repeticiones con la rodilla lo más arriba posible.' },
    ],
  },
  surf: {
    repeticiones: {
      min: 4, max: 20, inicial: 8,
      titulo: 'Peces a atrapar',
      ayuda: 'La ronda termina cuando el paciente atrapa esa cantidad de peces.',
    },
    dificultades: [
      { clave: 'progresiva', etiqueta: 'Ir subiendo de a poco', detalle: 'Empieza con un pez grande y lento, y sube de nivel a lo largo de la ronda.' },
      { clave: 'facil', etiqueta: 'Fácil', detalle: 'Un pez a la vez, grande y lento, todo el tiempo.' },
      { clave: 'media', etiqueta: 'Media', detalle: 'De a dos peces, de tamaño y velocidad medios.' },
      { clave: 'dificil', etiqueta: 'Difícil', detalle: 'De a dos peces, más chicos y más rápidos.' },
    ],
  },
}

const clave = (juego) => `kinetix_rutina_${juego}`

/** Deja una rutina válida para el juego: repeticiones enteras dentro de los límites y una dificultad que exista. */
export function normalizarRutina(juego, r) {
  const { repeticiones: { min, max, inicial }, dificultades } = RUTINAS[juego]
  const n = Number.isFinite(r?.repeticiones) ? Math.round(r.repeticiones) : inicial
  return {
    repeticiones: Math.min(max, Math.max(min, n)),
    dificultad: dificultades.some((d) => d.clave === r?.dificultad) ? r.dificultad : 'progresiva',
  }
}

export function leerRutina(juego) {
  try {
    return normalizarRutina(juego, JSON.parse(localStorage.getItem(clave(juego)) ?? 'null'))
  } catch {
    return normalizarRutina(juego, null)
  }
}

export function guardarRutina(juego, rutina) {
  try { localStorage.setItem(clave(juego), JSON.stringify(normalizarRutina(juego, rutina))) } catch { /* sin almacenamiento: vale por esta sesión */ }
}
