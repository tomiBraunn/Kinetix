// Calibración del Surf: ¿hay un cuerpo bien detectado y en el medio? Y si el
// paciente está más cerca (o más lejos) de lo que pide la silueta, cuánto
// "alejar" (o acercar) su imagen para que quede del tamaño de la guía, sin
// pedirle que se mueva (ver KinetixAI.fijarVista).
//
// PUNTOS_SILUETA son los 12 círculos rosas de la guía (Figma 837:728, archivo
// assets/juegos/surf/silueta-puntos.svg), como fracción [x, y] del ancho/alto
// de la guía. Van de a pares (izquierda, derecha EN PANTALLA): hombros, codos,
// muñecas, caderas, rodillas y tobillos.
export const PUNTOS_SILUETA = [
  [0.348, 0.2417], [0.652, 0.2417],
  [0.26, 0.3834], [0.74, 0.3834],
  [0.188, 0.5229], [0.808, 0.5229],
  [0.376, 0.5271], [0.624, 0.5271],
  [0.352, 0.7063], [0.652, 0.7063],
  [0.34, 0.8979], [0.66, 0.8979],
]

// Landmarks de MediaPipe de cada par, en el mismo orden de arriba.
const PARES = [[11, 12], [13, 14], [15, 16], [23, 24], [25, 26], [27, 28]]

const VISIBILIDAD_MIN = 0.5
const CENTRO_TOL = 0.2          // el centro de los hombros puede apartarse hasta el 20% del ancho del cuadro
export const ESCALA_MIN = 0.5   // se puede achicar hasta la mitad (paciente a la mitad de distancia)
export const ESCALA_MAX = 1.35  // y agrandar un 35% (paciente algo lejos)

const HOMBRO_Y = PUNTOS_SILUETA[0][1]
const CADERA_Y = PUNTOS_SILUETA[6][1]
const CENTRO_X = (PUNTOS_SILUETA[0][0] + PUNTOS_SILUETA[1][0]) / 2

const enCuadro = (p) => !!p && (p.visibility ?? 1) >= VISIBILIDAD_MIN && p.x >= 0.02 && p.x <= 0.98 && p.y >= 0.02 && p.y <= 0.98

/**
 * Qué puntos de la silueta tienen su parte del cuerpo detectada y dentro del cuadro.
 * @param lms landmarks crudos de MediaPipe (normalizados 0–1 en el video)
 * @returns array de 12 booleans
 */
export function detectados(lms) {
  return PUNTOS_SILUETA.map((_, i) => {
    const [a, b] = PARES[i >> 1].map((k) => lms[k])
    if (!a || !b) return false
    // Izquierda/derecha por posición en pantalla (el video se ve en espejo: la
    // izquierda de pantalla es la x cruda mayor), no por el lado anatómico.
    const [izq, der] = a.x >= b.x ? [a, b] : [b, a]
    return enCuadro(i % 2 ? der : izq)
  })
}

/**
 * Vista que pone el tronco del paciente (hombros → caderas) sobre el de la silueta.
 * @param m     medida del tronco { sx, sy, hx, hy }: centro de hombros y de caderas, en coordenadas del video (0–1)
 * @param base  encuadre base del video { dw, dh } en píxeles del área de juego (KinetixAI.encuadreBase)
 * @param guia  { left, top, width, height } de la silueta en píxeles del área de juego
 * @param area  { w, h } del área de juego en píxeles
 * @returns { escala, vista }  escala = cuánto hay que achicar (<1) o agrandar (>1) sin límites;
 *          vista = lo mismo ya acotado a [ESCALA_MIN, ESCALA_MAX], listo para KinetixAI.fijarVista()
 */
export function vistaPara(m, base, guia, area) {
  const largo = Math.hypot((m.hx - m.sx) * base.dw, (m.hy - m.sy) * base.dh)
  const escala = (guia.height * (CADERA_Y - HOMBRO_Y)) / Math.max(largo, 1)
  return {
    escala,
    vista: {
      s: Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, escala)),
      px: m.sx,
      py: m.sy,
      qx: (guia.left + CENTRO_X * guia.width) / area.w,
      qy: (guia.top + HOMBRO_Y * guia.height) / area.h,
    },
  }
}

/**
 * ¿Está el paciente listo para empezar? Pide cabeza, hombros y caderas detectados
 * dentro del cuadro (no hace falta el cuerpo entero), en el medio y a una distancia
 * que la vista pueda compensar.
 * @param requiere  lo que el juego necesita ver además del tronco: 'torso' (nada más: el Surf se
 *                  juega con las manos) | 'rodillas' (el Flamenco mide la altura de la rodilla).
 *                  Sin esto el paciente calibra bien con las rodillas fuera de cuadro y después
 *                  el juego no lo detecta, sin explicación. Se pide al final: si está muy cerca,
 *                  primero conviene decirle que se aleje.
 * @returns { detectados, pista, medida? }  pista: 'nucleo' | 'izquierda' | 'derecha' | 'cerca' | 'lejos' | 'rodillas' | 'ok'
 *          ('izquierda'/'derecha' = hacia dónde tiene que correrse el paciente)
 */
export function evaluar(lms, base, guia, area, requiere = 'torso') {
  const det = detectados(lms)
  const [hi, hd, ci, cd] = [lms[11], lms[12], lms[23], lms[24]]
  if (![lms[0], hi, hd, ci, cd].every(enCuadro)) return { detectados: det, pista: 'nucleo' }

  const medida = { sx: (hi.x + hd.x) / 2, sy: (hi.y + hd.y) / 2, hx: (ci.x + cd.x) / 2, hy: (ci.y + cd.y) / 2 }
  // x < 0.5 en el video crudo = se ve en el lado derecho de la pantalla (espejo): tiene que ir a su izquierda
  if (Math.abs(medida.sx - 0.5) > CENTRO_TOL) return { detectados: det, pista: medida.sx < 0.5 ? 'izquierda' : 'derecha', medida }

  const { escala } = vistaPara(medida, base, guia, area)
  if (escala < ESCALA_MIN) return { detectados: det, pista: 'cerca', medida }
  if (escala > ESCALA_MAX) return { detectados: det, pista: 'lejos', medida }
  if (requiere === 'rodillas' && ![lms[25], lms[26]].every(enCuadro)) return { detectados: det, pista: 'rodillas', medida }
  return { detectados: det, pista: 'ok', medida }
}
