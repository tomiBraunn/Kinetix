import { WORDMARK_PATH } from '../../components/Logo'
import seaCielo from '../landing/assets/sea_cielo.webp'
import seaOlas from '../landing/assets/sea_olas.webp'
import logoMark from '../landing/assets/logo_mark.webp'
import imgPez from '../landing/assets/pez_celebra.svg'
import imgFlamenco from '../landing/assets/fla_celebra.svg'
import './Atraccion.css'

const ROSA = '#F472B6'

// Pantalla de bienvenida del stand: pantalla vertical, con el fondo del juego y las mascotas. Se sale moviendo el mouse.
export default function Atraccion() {
  return (
    <div className="atraccion">
      <div className="columna">
        <div className="cielo" style={{ backgroundImage: `url(${seaCielo})` }} />
        <div className="olas" style={{ backgroundImage: `url(${seaOlas})` }} />
        <img className="pez" src={imgPez} alt="" />
        <img className="flamenco" src={imgFlamenco} alt="" />
        <div className="contenido">
          <div className="marca">
            <div className="mark" style={{ WebkitMaskImage: `url(${logoMark})`, maskImage: `url(${logoMark})` }} />
            <svg viewBox="44 13 112 34" className="wordmark" aria-label="Kinetix">
              <path d={WORDMARK_PATH} fill={ROSA} />
            </svg>
          </div>
          <p className="texto">Mové el mouse para empezar</p>
        </div>
      </div>
    </div>
  )
}
