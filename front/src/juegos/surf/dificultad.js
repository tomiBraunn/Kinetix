// Dificultad del Surf, pensada para adultos mayores (el kinesiólogo pidió pocos peces, mucho tiempo entre uno y
// otro y movimientos de tronco y brazos, sin mover los pies). En "Antes de empezar" elige si la dificultad va
// subiendo de a poco a lo largo de la ronda (empieza fácil y sube sola) o se queda fija en un nivel (ver rutina.js).
// Funciones puras: se prueban con node (dificultad.check.mjs); la escena las aplica en EscenaPrincipal.js.
//
// Los peces aparecen sobre una curva por encima del paciente, centrada en sus hombros (ver aparicion.js), dentro de
// la zona que fija el kinesiólogo de antemano (alto y ancho, ver curva.js): eso NO cambia con el nivel. Cada nivel
// cambia, todo en la dirección de "más difícil":
//   pecesALaVez  cuántos hay nadando a la vez
//   tam          multiplicador del tamaño (grandes al principio)
//   vel          multiplicador de la velocidad con que se desplazan por la curva (muy lentos al principio)
//   deriva       cuántos grados se desplazan por la curva yendo y viniendo
//   espera       ms hasta que aparece el pez que reemplaza a uno atrapado: [mínimo, máximo]
//   entre        ms entre un pez y el siguiente cuando faltan varios: [mínimo, máximo]
export const NIVELES = [
  { pecesALaVez: 1, tam: 1.4, vel: 0.5, deriva: 8, espera: [2500, 3500], entre: [3500, 5000] },
  { pecesALaVez: 1, tam: 1.25, vel: 0.6, deriva: 12, espera: [2500, 3500], entre: [3500, 5000] },
  { pecesALaVez: 2, tam: 1.1, vel: 0.7, deriva: 16, espera: [3000, 4200], entre: [3500, 5000] },
  { pecesALaVez: 2, tam: 1.0, vel: 0.8, deriva: 16, espera: [3000, 4200], entre: [3500, 5000] },
]

// Los niveles de la dificultad fija
export const NIVEL_FIJO = { facil: 0, media: 2, dificil: 3 }

/**
 * Nivel (0 = el más fácil) según los peces atrapados y la rutina elegida ({ repeticiones, dificultad }).
 * Subiendo de a poco, los niveles se reparten parejo a lo largo de la ronda: el último es el del último cuarto
 * (con 8 peces, un nivel cada 2; con 20, uno cada 5).
 */
export function nivelPara(puntos, { repeticiones = 8, dificultad = 'progresiva' } = {}) {
  if (dificultad in NIVEL_FIJO) return NIVEL_FIJO[dificultad]
  return Math.min(NIVELES.length - 1, Math.max(0, Math.floor((puntos * NIVELES.length) / repeticiones)))
}

/** Parámetros del nivel (se acota por si llega uno fuera de rango). */
export const parametrosDe = (nivel) => NIVELES[Math.min(NIVELES.length - 1, Math.max(0, nivel))]
