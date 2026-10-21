// Dificultad del Surf: empieza fácil y sube sola, pensada para adultos mayores (el kinesiólogo pidió pocos peces,
// mucho tiempo entre uno y otro y movimientos de tronco y brazos, sin mover los pies). Cada PECES_POR_NIVEL peces
// atrapados se pasa al nivel siguiente. Funciones puras: se prueban con node (dificultad.check.mjs); la escena las
// aplica en EscenaPrincipal.js.
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
export const PECES_POR_NIVEL = 2

export const NIVELES = [
  { pecesALaVez: 1, tam: 1.4, vel: 0.5, deriva: 8, espera: [2500, 3500], entre: [3500, 5000] },
  { pecesALaVez: 1, tam: 1.25, vel: 0.6, deriva: 12, espera: [2500, 3500], entre: [3500, 5000] },
  { pecesALaVez: 2, tam: 1.1, vel: 0.7, deriva: 16, espera: [3000, 4200], entre: [3500, 5000] },
  { pecesALaVez: 2, tam: 1.0, vel: 0.8, deriva: 16, espera: [3000, 4200], entre: [3500, 5000] },
]

/** Nivel (0 = el más fácil) según los peces atrapados en la ronda. */
export const nivelPara = (puntos) => Math.min(NIVELES.length - 1, Math.max(0, Math.floor(puntos / PECES_POR_NIVEL)))

/** Parámetros del nivel (se acota por si llega uno fuera de rango). */
export const parametrosDe = (nivel) => NIVELES[Math.min(NIVELES.length - 1, Math.max(0, nivel))]
