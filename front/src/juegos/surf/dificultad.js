// Dificultad del Surf: empieza fácil y sube sola. Cada PECES_POR_NIVEL peces atrapados se pasa al nivel
// siguiente (el que mejor le va, más rápido sube; el que le cuesta, se queda en uno cómodo). Funciones
// puras: se prueban con node (dificultad.check.mjs); la escena las aplica en EscenaPrincipal.js.
//
// Cada nivel cambia cuatro cosas, todas en la misma dirección (más difícil):
//   pecesALaVez  cuántos hay nadando a la vez
//   tam          multiplicador del tamaño (peces grandes al principio, más chicos después)
//   vel          multiplicador de la velocidad (lento al principio)
//   distMin      distancia mínima a los hombros, en largos de tronco: cerca al principio (casi sin estirar
//                el brazo) y cada vez más lejos
//   alcance      distancia máxima a los hombros, en largos de tronco: hasta dónde pueden aparecer
export const PECES_POR_NIVEL = 3

export const NIVELES = [
  { pecesALaVez: 1, tam: 1.35, vel: 0.55, distMin: 0.4, alcance: 1.0 },
  { pecesALaVez: 2, tam: 1.2, vel: 0.8, distMin: 0.6, alcance: 1.3 },
  { pecesALaVez: 2, tam: 1.05, vel: 1.0, distMin: 0.8, alcance: 1.6 },
  { pecesALaVez: 3, tam: 0.9, vel: 1.3, distMin: 1.0, alcance: 1.9 },
]

/** Nivel (0 = el más fácil) según los peces atrapados en la ronda. */
export const nivelPara = (puntos) => Math.min(NIVELES.length - 1, Math.max(0, Math.floor(puntos / PECES_POR_NIVEL)))

/** Parámetros del nivel (se acota por si llega uno fuera de rango). */
export const parametrosDe = (nivel) => NIVELES[Math.min(NIVELES.length - 1, Math.max(0, nivel))]
