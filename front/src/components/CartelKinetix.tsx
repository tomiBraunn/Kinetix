import { useEffect } from 'react'
import GradientBackground from './GradientBackground'
import logoKinetix from '../assets/cartel/logo-kinetix.svg'
import pantallaAnalisis from '../assets/cartel/pantalla-analisis.png'
import impactoSocial from '../assets/cartel/impacto-social.svg'
import decoracion from '../assets/cartel/decoracion.svg'
import ticX from '../assets/cartel/tic-x.svg'
import ort from '../assets/cartel/ort.svg'
import hit1 from '../assets/cartel/hit-1.svg'
import hit2 from '../assets/cartel/hit-2.svg'
import hit3 from '../assets/cartel/hit-3.svg'
import hit4 from '../assets/cartel/hit-4.svg'
import hit5 from '../assets/cartel/hit-5.svg'
import hit6 from '../assets/cartel/hit-6.svg'
import hit7 from '../assets/cartel/hit-7.svg'

// Cartel de la feria de tecnología (Figma "Cartel Kinetix", 1440×1920). El fondo es el mismo
// GradientBackground de login/registro, así los colores salen de un solo lugar.
// Se dibuja siempre a 1440×1920 px; `escala` lo achica o agranda sin cambiar el diseño.
export const CARTEL_ANCHO = 1440
export const CARTEL_ALTO = 1920

const FUENTES =
  'https://fonts.googleapis.com/css2?family=Raleway:wght@400;600&family=Space+Mono:wght@400;700&display=swap'

const raleway = "'Raleway', sans-serif"
const mono = "'Space Mono', monospace"

// Logo de HIT: cada letra es un SVG suelto, con su posición dentro del logo (en %)
const HIT: { src: string; inset: string }[] = [
  { src: hit1, inset: '23.07% 25.53% 20.36% 68.5%' },
  { src: hit2, inset: '23.07% 36.68% 20.36% 41.51%' },
  { src: hit3, inset: '23.07% 0.64% 20.36% 78.58%' },
  { src: hit4, inset: '1.56% 81.26% 55.34% 12.78%' },
  { src: hit5, inset: '55.34% 81.26% 1.56% 12.78%' },
  { src: hit6, inset: '9.42% 93.4% 11.48% 0.64%' },
  { src: hit7, inset: '9.42% 68.83% 11.48% 25.21%' },
]

const tarjeta: React.CSSProperties = {
  position: 'absolute',
  width: 613.333,
  height: 345,
  overflow: 'hidden',
  borderRadius: 30,
  background: '#fff',
  border: '4.392px solid rgba(141,141,141,0.4)',
  boxShadow: '0 0 30px rgba(255,255,255,0.25)',
}

export default function CartelKinetix({ escala = 1 }: { escala?: number }) {
  useEffect(() => {
    if (document.getElementById('fuentes-cartel')) return
    const link = document.createElement('link')
    link.id = 'fuentes-cartel'
    link.rel = 'stylesheet'
    link.href = FUENTES
    document.head.appendChild(link)
  }, [])

  return (
    <div style={{ width: CARTEL_ANCHO * escala, height: CARTEL_ALTO * escala }}>
      <div
        style={{
          position: 'relative',
          width: CARTEL_ANCHO,
          height: CARTEL_ALTO,
          overflow: 'hidden',
          transform: `scale(${escala})`,
          transformOrigin: 'top left',
          color: '#fff',
          lineHeight: 'normal',
        }}
      >
        <GradientBackground />
        {/* Velo violeta suave: da contraste al texto blanco sin apagar el degradé rosa/violeta */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(130,60,200,0.32) 0%, rgba(130,60,200,0.2) 55%, rgba(130,60,200,0.12) 100%)',
          }}
        />

        {/* Íconos decorativos */}
        <div style={{ position: 'absolute', left: 873.78, top: 1094, width: 308.361, height: 292.551 }}>
          <img alt="" src={impactoSocial} style={{ position: 'absolute', inset: '19.42% 17.38%', width: '65.24%', height: '61.16%', maxWidth: 'none' }} />
        </div>
        <div style={{ position: 'absolute', left: 256.77, top: 1560, width: 241.475, height: 169.301 }}>
          <img alt="" src={decoracion} style={{ position: 'absolute', inset: '-2.29% 0 -2.29% -1.61%', width: '101.61%', height: '104.58%', maxWidth: 'none' }} />
        </div>

        <div style={{ position: 'absolute', left: 107, top: 101.33, width: 1226.667, height: 1717.333 }}>
          {/* Encabezado: categoría + logos institucionales */}
          <div style={{ position: 'absolute', left: 0, top: 0, width: 1226.074, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontFamily: mono, fontWeight: 700, fontSize: 35, whiteSpace: 'nowrap', margin: 0 }}>&lt;/Impacto Social&gt;</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 22.74 }}>
              <img alt="TIC" src={ticX} style={{ width: 62.016, height: 60.64 }} />
              <div style={{ position: 'relative', width: 124.667, height: 68 }}>
                <img alt="ORT Argentina" src={ort} style={{ position: 'absolute', left: 0.33, top: 1.01, width: 123.757, height: 71.254, maxWidth: 'none' }} />
              </div>
              <div style={{ position: 'relative', height: 68, aspectRatio: '155 / 58' }}>
                {HIT.map(({ src, inset }, i) => (
                  <img key={i} alt="" src={src} style={{ position: 'absolute', inset, width: 'auto', maxWidth: 'none' }} />
                ))}
              </div>
            </div>
          </div>

          {/* Título y descripción */}
          <div style={{ position: 'absolute', left: 0, top: 126.22, width: '100%', display: 'flex', flexDirection: 'column', gap: 30.222 }}>
            <p style={{ fontFamily: raleway, fontWeight: 600, fontSize: 96, margin: 0, whiteSpace: 'nowrap', fontFeatureSettings: '"lnum" 1, "pnum" 1' }}>Kinetix</p>
            <p style={{ fontFamily: raleway, fontWeight: 400, fontSize: 36, margin: 0, textAlign: 'justify' }}>
              Kinetix es una plataforma de rehabilitación tecnológica que convierte los ejercicios terapéuticos de rehabilitación en juegos
              interactivos, para que el proceso sea más estimulante, motivador y divertido. Mientras el paciente juega frente a la cámara,
              una inteligencia artificial analiza en tiempo real su equilibrio, postura y movimiento. Con esos datos, el kinesiólogo accede a
              un panel donde puede seguir la evolución de cada paciente, medir su progreso de forma objetiva y ajustar los ejercicios en cada
              sesión.
            </p>
          </div>

          {/* Integrantes */}
          <div style={{ position: 'absolute', left: 0, top: 664.89, width: '100%', display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div>
              <p style={{ fontFamily: mono, fontWeight: 700, fontSize: 32, margin: 0 }}>Estudiantes</p>
              <div style={{ display: 'flex', gap: 20.148, fontFamily: mono, fontSize: 28, whiteSpace: 'nowrap' }}>
                <span>Tomás B.</span>
                <span>Micaela B.</span>
                <span>Mia G.</span>
                <span>Rafael S.</span>
              </div>
            </div>
            <div>
              <p style={{ fontFamily: mono, fontWeight: 700, fontSize: 32, margin: 0 }}>Tutores</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 20.148px', fontFamily: mono, fontSize: 28, whiteSpace: 'nowrap' }}>
                <span>Maximiliano Torreblanca</span>
                <span>Jerónimo Sanchez Peruga</span>
                <span style={{ fontWeight: 700 }}>Ivo Degange</span>
              </div>
            </div>
          </div>

          {/* Imágenes: logo y pantalla de análisis */}
          <div style={{ position: 'absolute', left: 0, top: 959.67, width: 1227, height: 756 }}>
            <div style={{ ...tarjeta, left: 0, top: 0 }}>
              <div style={{ position: 'absolute', left: 144.93, top: 10.98, width: 314.012, height: 314.012 }}>
                <img alt="Kinetix" src={logoKinetix} style={{ position: 'absolute', inset: '9.97% 16.65% 9.95% 17.08%', width: '66.27%', height: '80.08%', maxWidth: 'none' }} />
              </div>
            </div>
            <div style={{ ...tarjeta, right: 0, bottom: 0 }}>
              <img alt="Pantalla de análisis de Kinetix" src={pantallaAnalisis} style={{ position: 'absolute', left: 1.1, top: -1.1, width: 618.143, height: 386.477, maxWidth: 'none' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
