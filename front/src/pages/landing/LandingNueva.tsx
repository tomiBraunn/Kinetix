import { useEffect, useRef, type CSSProperties } from 'react'
import { WORDMARK_PATH } from '../../components/Logo'
import { track } from '../../lib/analytics'
import { iniciarLanding } from './landingAnimaciones'
import { OLA_ATRAS, OLA_DELANTE, SPRITE_HTML, evoSvg } from './landingDatos'
import './LandingNueva.css'

// Los estilos de cada variable CSS (--y, --w…) van por style: React acepta las propiedades personalizadas así
const vars = (o: Record<string, string>) => o as unknown as CSSProperties

const PARQUE = ['cielo', 'nube1', 'nube2', 'nube3', 'lejos', 'cesped', 'arbolesi', 'arbolesd', 'flores']

const NADADORES = [
  { rev: true, y: '34%', w: '92px', d: '30s', delay: '-6s', x0: '14%', wag: '3.4s', pez: 'fish-orange', oculto: false },
  { rev: false, y: '52%', w: '74px', d: '36s', delay: '-18s', x0: '62%', wag: '2.9s', pez: 'fish-yellow', oculto: false },
  { rev: true, y: '66%', w: '64px', d: '42s', delay: '-30s', x0: '40%', wag: '3.8s', pez: 'fish-green', oculto: false },
  { rev: false, y: '24%', w: '60px', d: '34s', delay: '-9s', x0: '80%', wag: '3.1s', pez: 'fish-purple', oculto: false },
  { rev: false, y: '44%', w: '54px', d: '46s', delay: '-24s', x0: '30%', wag: '3.6s', pez: 'fish-orange', oculto: false },
  { rev: true, y: '58%', w: '100px', d: '28s', delay: '-2s', x0: '72%', wag: '3.3s', pez: 'fish-yellow', oculto: false },
  { rev: false, y: '36%', w: '80px', d: '38s', delay: '-33s', x0: '8%', wag: '3.0s', pez: 'fish-green', oculto: true },
  { rev: true, y: '70%', w: '58px', d: '44s', delay: '-12s', x0: '54%', wag: '3.7s', pez: 'fish-purple', oculto: true },
  { rev: true, y: '20%', w: '50px', d: '52s', delay: '-40s', x0: '90%', wag: '2.8s', pez: 'fish-orange', oculto: true },
]

const BURBUJAS: [number, number, number, number][] = [
  [5, 8, 7, -1], [14, 5, 9, -4], [26, 9, 8, -6], [38, 6, 10, -2], [49, 7, 7.5, -5],
  [58, 10, 9, -8], [67, 5, 8.5, -3], [77, 8, 10, -7], [86, 6, 7, -2], [94, 9, 9, -5],
]

const DIFICULTADES = [
  { on: true, titulo: 'Ir subiendo de a poco', detalle: 'Empieza con la pierna despegada, como un flamenco, y termina con la rodilla lo más alta que pueda.' },
  { on: false, titulo: 'Pierna despegada (fácil)', detalle: 'Todas las repeticiones con el pie apenas despegado del piso.' },
  { on: false, titulo: 'Rodilla alta (difícil)', detalle: 'Todas las repeticiones con la rodilla lo más arriba posible.' },
]

// Mismo fondo de parque (capas) para el celular, las tarjetas y los videos
function Parque() {
  return (
    <div className="park">
      {PARQUE.map((c) => (
        <i key={c} className={`pk ${c}`} />
      ))}
    </div>
  )
}

function Sprite() {
  return <div aria-hidden="true" dangerouslySetInnerHTML={{ __html: SPRITE_HTML }} />
}

export default function LandingNueva() {
  const raiz = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!raiz.current) return
    return iniciarLanding(raiz.current)
  }, [])

  return (
    <div className="landing-nueva" ref={raiz}>
      <Sprite />

      <header className="nav-shell">
        <nav className="nav" aria-label="Principal">
          <a className="brand" href="#top" aria-label="Kinetix, volver al inicio">
            <i className="mark" aria-hidden="true" />
            <svg viewBox="44 13 112 34" aria-hidden="true" focusable="false">
              <defs>
                <linearGradient id="wm" x1="100%" y1="0%" x2="0%" y2="0%">
                  <stop stopColor="#3A41B4" />
                  <stop offset="1" stopColor="#0F1387" />
                </linearGradient>
              </defs>
              <path d={WORDMARK_PATH} fill="url(#wm)" />
            </svg>
          </a>
          <ul className="nav-links">
            <li><a href="#conexion">Cómo se conecta</a></li>
            <li><a href="#juegos">Juegos</a></li>
            <li><a href="#consultorio">Para kinesiólogos</a></li>
          </ul>
          <div className="nav-cta">
            <a className="btn btn-text" href="/webapp/login" onClick={() => track('cta_click', { cta: 'nav_login' })}>Iniciar sesión</a>
            <a className="btn btn-primary btn-sm" href="/webapp/register" onClick={() => track('cta_click', { cta: 'nav_registro' })}>Crear cuenta</a>
          </div>
        </nav>
      </header>

      <main id="top">
        {/* ───────────── HERO ───────────── */}
        <section className="hero" aria-labelledby="h1">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <h1 className="h1" id="h1">
                <span className="ln">Rehabilitación</span>
                <span className="ln">
                  <span className="em1">divertida.
                    <svg className="squig" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true">
                      <path pathLength={1} d="M3 9C22 1 40 15 60 7S100 1 120 8s45 7 77-3" />
                    </svg>
                  </span>
                </span>
                <span className="ln">Resultados</span>
                <span className="ln"><span className="em2">reales.</span></span>
              </h1>
              <p className="lead">Convertimos los ejercicios de kinesiología en juegos. Mientras el paciente juega, la IA mide su equilibrio y su movimiento, y vos ves cómo evoluciona desde tu panel.</p>
              <div className="cta-row">
                <a className="btn btn-primary" href="/webapp/register" onClick={() => track('cta_click', { cta: 'hero_crear' })}>Crear cuenta</a>
                <a className="btn btn-ghost" href="/demo" onClick={() => track('cta_click', { cta: 'hero_demo' })}>Probar demo</a>
                <a className="btn btn-ghost" href="#conexion">Ver cómo funciona <svg className="ic"><use href="#i-down" /></svg></a>
              </div>
              <ul className="facts">
                <li><svg className="ic"><use href="#i-check" /></svg>Solo necesita una cámara</li>
                <li><svg className="ic"><use href="#i-check" /></svg>Pensado con kinesiólogos</li>
              </ul>
            </div>

            <div className="hero-play">
              <i className="shape s-sun" aria-hidden="true" />
              <i className="shape s-blob" aria-hidden="true" />
              <i className="shape s-dots" aria-hidden="true" />
              <div className="stage" role="img" aria-label="Ilustración de las mascotas de Kinetix: el flamenco haciendo su ejercicio de equilibrio sobre una tabla de surf y el pez, en el mar.">
                <i className="sea-sky" />
                <i className="cl cl1" /><i className="cl cl2" /><i className="cl cl3" />
                <i className="sea-wave" />
                <i className="fx fish-orange sf sf1" /><i className="fx fish-green sf sf2" /><i className="fx fish-purple sf sf3" />
                <i className="board-img" />
                <div className="st-fla" aria-hidden="true"><i className="mas fla-izq fla-a" /><i className="mas fla-der fla-b" /></div>
                <div className="st-pez" aria-hidden="true"><i className="mas pez-base on" /></div>
                <i className="sea-wave foam" />
              </div>
            </div>
          </div>
        </section>

        {/* ───────────── MAR CON PECES ───────────── */}
        <div className="sea-band" aria-hidden="true">
          <svg className="sb-surface s2" viewBox="0 0 2880 46" preserveAspectRatio="none"><path d={OLA_ATRAS} /></svg>
          <svg className="sb-surface" viewBox="0 0 2880 46" preserveAspectRatio="none"><path d={OLA_DELANTE} /></svg>
          <i className="ray r1" /><i className="ray r2" /><i className="ray r3" />
          {NADADORES.map((n, i) => (
            <i
              key={i}
              className={['swim', n.rev && 'rev', n.oculto && 'hide-m'].filter(Boolean).join(' ')}
              style={vars({ '--y': n.y, '--w': n.w, '--d': n.d, '--delay': n.delay, '--x0': n.x0, '--wag': n.wag })}
            >
              <b className={n.pez} />
            </i>
          ))}
          {BURBUJAS.map(([x, s, t, dl], i) => (
            <i key={i} className="bub" style={vars({ '--x': `${x}%`, '--s': `${s}px`, '--t': `${t}s`, '--dl': `${dl}s` })} />
          ))}
        </div>

        {/* ───────────── CONEXIÓN CELULAR ↔ PANEL ───────────── */}
        <section className="connect" id="conexion" aria-labelledby="h-conexion" data-step="1">
          <svg className="wave-top" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0H1440V38C1290 92 1130 4 960 40S600 96 420 50 120 6 0 44Z" /></svg>
          <div className="wrap">
            <div className="sec-head light">
              <h2 className="h2" id="h-conexion">Una sesión, <span className="y">dos pantallas</span></h2>
              <p className="sub">El paciente juega en su celular o tablet y la IA mide cada movimiento. Cuando termina, los resultados ya están en tu panel.</p>
            </div>

            <div className="devices">
              {/* Celular del paciente */}
              <figure className="dev">
                <div className="phone" role="img" aria-label="Celular del paciente jugando Flamenco Challenge: la mascota pide mantener la pierna arriba durante 10 segundos y la cámara muestra los puntos detectados.">
                  <div className="phone-screen">
                    <div className="g-top">
                      <svg className="ic g-menu"><use href="#i-menu" /></svg>
                      <span className="g-logo"><i className="mark" /><svg viewBox="44 13 112 34"><path d={WORDMARK_PATH} fill="#0F1387" /></svg></span>
                      <span className="pausar"><svg className="ic"><use href="#i-pause" /></svg>Pausar</span>
                    </div>
                    <div className="g-scene">
                      <Parque />
                      <p className="g-msg">Mantené la <em>pierna arriba</em> durante 10 segundos.</p>
                      <div className="g-timer">
                        <svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="19" className="t-bg" /><circle cx="22" cy="22" r="19" className="t-fg" id="g-ring" /></svg>
                        <b id="g-sec">10</b>
                      </div>
                      <div className="g-fla">
                        <i className="mas fla-izq on" /><i className="mas fla-alto" /><i className="mas fla-celebra" />
                      </div>
                      <div className="g-pip">
                        <svg viewBox="0 0 100 170" aria-hidden="true"><use href="#fig-flam" /></svg>
                        <span className="pip-tag"><i />IA</span>
                      </div>
                    </div>
                  </div>
                </div>
                <figcaption><svg className="ic"><use href="#i-cam" /></svg>App del paciente</figcaption>
              </figure>

              {/* Enlace */}
              <div className="link" aria-hidden="true">
                <div className="link-line"><i className="pkt" /><i className="pkt" /><i className="pkt" /></div>
                <div className="link-node">
                  <svg className="ic n-sync"><use href="#i-sync" /></svg>
                  <svg className="ic n-check"><use href="#i-check" /></svg>
                </div>
                <div className="link-chips"><span>Equilibrio 91%</span><span>Mejor tiempo 18 s</span></div>
              </div>

              {/* Panel del kinesiólogo */}
              <figure className="dev dev-laptop">
                <div className="laptop" role="img" aria-label="Panel web del kinesiólogo con los resultados de la sesión: tiempo en equilibrio, métricas de la IA, comentario y videos.">
                  <div className="laptop-lid">
                    <div className="panel">
                      <div className="bar"><i /><i /><i /><span className="url">kinetixproject.com/sesiones</span></div>
                      <div className="app">
                        <aside className="side">
                          <div className="side-logo"><i className="mark" /><svg viewBox="44 13 112 34"><path d={WORDMARK_PATH} fill="#0F1387" /></svg></div>
                          <ul className="side-nav">
                            <li><svg className="ic"><use href="#i-home" /></svg>Home</li>
                            <li className="on"><svg className="ic"><use href="#i-group" /></svg>Pacientes</li>
                            <li><svg className="ic"><use href="#i-pad" /></svg>Juegos</li>
                            <li><svg className="ic"><use href="#i-bars" /></svg>Análisis</li>
                          </ul>
                          <div className="side-user"><span className="av">LC</span><span><b>Lucía C.</b><small>Kinesiólogo</small></span></div>
                        </aside>
                        <div className="main">
                          <p className="back"><svg className="ic"><use href="#i-back" /></svg>Volver</p>
                          <div className="cols">
                            <div className="col">
                              <div className="card head">
                                <span className="gi"><svg className="ic"><use href="#i-walk" /></svg></span>
                                <div><b>Flamenco Challenge</b><small>Marta G. — <span id="p-date">21 oct 2026</span></small></div>
                                <span className="new" id="p-new">Nueva sesión</span>
                              </div>
                              <div className="stats">
                                <div className="stat"><b id="p-best">14 s</b><small>Mejor tiempo en equilibrio</small></div>
                                <div className="stat"><b id="p-tries">4</b><small>Intentos</small></div>
                                <div className="stat"><b id="p-reps">4</b><small>Repeticiones</small></div>
                                <div className="stat"><b id="p-dur">71 s</b><small>Duración total</small></div>
                              </div>
                              <div className="ai">
                                <p className="ai-t"><svg className="ic"><use href="#i-spark" /></svg>Análisis de IA — MediaPipe</p>
                                <div className="ai-g">
                                  <div><small>Estabilidad</small><b id="p-est">84%</b></div>
                                  <div><small>Precisión de movimiento</small><b id="p-prec">80%</b></div>
                                  <div><small>Rango de mov. (prom.)</small><b id="p-rom">36°</b></div>
                                </div>
                                <p className="ai-c" id="p-comment" />
                              </div>
                            </div>
                            <div className="col vids">
                              <figure className="vid">
                                <figcaption>Video con detección de IA</figcaption>
                                <div className="vid-box v-ia"><svg viewBox="0 0 100 170" aria-hidden="true"><use href="#fig-flam" /></svg></div>
                              </figure>
                              <figure className="vid">
                                <figcaption>Video del juego</figcaption>
                                <div className="vid-box v-game"><Parque /><i className="mas fla-izq on" /></div>
                              </figure>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="laptop-base" />
                </div>
                <figcaption><svg className="ic"><use href="#i-pad" /></svg>Panel del kinesiólogo</figcaption>
              </figure>
            </div>

            <div className="steps-row">
              <ol className="steps" aria-label="Pasos de una sesión">
                <li><button className="step active" type="button" data-i="0" aria-current="step"><b>El paciente juega</b><span>Una mascota le explica el juego y lo guía con voz. Después juega con el cuerpo frente a la cámara.</span></button></li>
                <li><button className="step" type="button" data-i="1" aria-current="false"><b>La IA mide</b><span>Sigue los puntos del cuerpo y calcula ángulos, estabilidad y rango de movimiento mientras se mueve.</span></button></li>
                <li><button className="step" type="button" data-i="2" aria-current="false"><b>Vos lo ves en tu panel</b><span>La sesión queda guardada con sus métricas, un análisis y los videos.</span></button></li>
              </ol>
              <div className="steps-foot">
                <button className="pause" id="pauseBtn" type="button" aria-pressed="false"><svg className="ic p-ic"><use href="#i-pause" /></svg><span>Pausar animación</span></button>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────── JUEGOS ───────────── */}
        <section className="games" id="juegos" aria-labelledby="h-juegos">
          <div className="wrap">
            <div className="sec-head">
              <p className="eyebrow">Los juegos</p>
              <h2 className="h2" id="h-juegos">Jugar es <span className="m">el ejercicio</span></h2>
              <p className="sub">Dos juegos, cada uno para una capacidad. La IA sigue los puntos del cuerpo que importan en cada movimiento.</p>
            </div>

            <div className="game-row">
              <article className="game">
                <div className="art art-surf">
                  <i className="sea-sky" /><i className="cl cl1" /><i className="cl cl2" /><i className="sea-wave" />
                  <i className="fx fish-green" /><i className="fx fish-orange" /><i className="fx fish-purple" />
                  <i className="mas pez-atrapa on" />
                </div>
                <div className="g-info">
                  <p className="g-tag" style={vars({ '--c': 'var(--f-blue)' })}>Coordinación y equilibrio</p>
                  <h3>Surf Challenge</h3>
                  <p>Arriba de la tabla, el paciente atrapa peces con las manos sin mover los pies. A medida que sube de nivel, los peces se vuelven más chicos y más rápidos.</p>
                  <p className="g-k">Qué registra</p>
                  <ul className="tags"><li className="tag">Peces atrapados</li><li className="tag">Nivel alcanzado</li><li className="tag">Alertas de movimiento</li></ul>
                  <p className="g-k">Puntos que sigue la IA</p>
                  <ul className="tags">
                    <li className="tag lm">muñecas</li>
                    <li className="tag lm">caderas</li>
                    <li className="tag lm">tobillos</li>
                  </ul>
                </div>
              </article>

              <article className="game">
                <div className="art art-flam">
                  <Parque />
                  <i className="mas fla-izq on" />
                </div>
                <div className="g-info">
                  <p className="g-tag" style={vars({ '--c': 'var(--f-pink)' })}>Equilibrio y postura</p>
                  <h3>Flamenco Challenge</h3>
                  <p>Levantar una pierna como un flamenco y aguantar. Vos elegís cuántas repeticiones y si la rodilla sube de a poco o va siempre alta.</p>
                  <p className="g-k">Qué registra</p>
                  <ul className="tags"><li className="tag">Mejor tiempo en equilibrio</li><li className="tag">Intentos</li><li className="tag">Repeticiones</li></ul>
                  <p className="g-k">Puntos que sigue la IA</p>
                  <ul className="tags">
                    <li className="tag lm">rodillas</li>
                    <li className="tag lm">tobillos</li>
                  </ul>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ───────────── PARA KINESIÓLOGOS ───────────── */}
        <section className="kine" id="consultorio" aria-labelledby="h-kine">
          <div className="wrap">
            <div className="sec-head">
              <h2 className="h2" id="h-kine">Hecho para <span className="m">tu consultorio</span></h2>
              <p className="sub">Armás la rutina, el paciente juega y vos revisás los resultados con calma.</p>
            </div>

            <div className="bento">
              {/* Rutina */}
              <article className="tile t-rutina tint-violet">
                <div className="t-text">
                  <h3>Armás la rutina antes de jugar</h3>
                  <p>Elegís cuántas repeticiones y qué dificultad. Cada paciente juega lo que necesita.</p>
                </div>
                <div className="rut" role="group" aria-label="Ejemplo de rutina del Flamenco Challenge">
                  <p className="rut-t">Repeticiones</p>
                  <div className="rut-step">
                    <button type="button" className="rut-b" id="rut-minus" aria-label="Menos repeticiones">−</button>
                    <output className="rut-n" id="rut-n" aria-live="polite">4</output>
                    <button type="button" className="rut-b" id="rut-plus" aria-label="Más repeticiones">+</button>
                  </div>
                  <p className="rut-h">Cada repetición dura 10 segundos. En la última, el paciente aguanta todo lo que pueda.</p>
                  <p className="rut-t">Dificultad</p>
                  <div className="rut-opts" role="radiogroup" aria-label="Dificultad">
                    {DIFICULTADES.map((d) => (
                      <button key={d.titulo} type="button" className={`opt${d.on ? ' on' : ''}`} role="radio" aria-checked={d.on}>
                        <b>{d.titulo}</b><span>{d.detalle}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <i className="mas fla-senala on rut-fla" aria-hidden="true" />
              </article>

              {/* Evolución */}
              <article className="tile t-evo tint-green">
                <div className="t-text">
                  <h3>Ves cómo evoluciona cada paciente</h3>
                  <p>Cada sesión suma un punto al gráfico. Se nota enseguida si el equilibrio mejora.</p>
                </div>
                <div className="evo">
                  <div className="evo-head"><span className="av">MG</span><div><b>Marta G.</b><small>Flamenco Challenge · mejor tiempo en equilibrio</small></div><span className="delta">+10 s</span></div>
                  <div dangerouslySetInnerHTML={{ __html: evoSvg() }} />
                </div>
              </article>

              {/* Tres videos */}
              <article className="tile t-video tint-blue">
                <div className="t-text">
                  <h3>Tres videos de cada sesión</h3>
                  <p>El de la cámara, el que muestra lo que detectó la IA y el del juego. Para revisar un movimiento con calma.</p>
                </div>
                <div className="fan" aria-hidden="true">
                  <div className="fc fc-cam"><i className="blur-person" /></div>
                  <div className="fc fc-ia"><svg viewBox="0 0 100 170"><use href="#fig-flam" /></svg></div>
                  <div className="fc fc-game"><Parque /><i className="mas fla-izq on" /></div>
                </div>
                <ul className="fan-leg"><li><i className="d d-cam" />Video de la cámara</li><li><i className="d d-ia" />Video con detección de IA</li><li><i className="d d-game" />Video del juego</li></ul>
              </article>

              {/* Alertas */}
              <article className="tile t-alert tint-orange">
                <div className="t-text">
                  <h3>La IA avisa si el paciente compensa</h3>
                  <p>Si mueve de más los pies o la cadera, aparece el aviso en pantalla y queda contado en la sesión.</p>
                </div>
                <div className="alert-demo">
                  <p className="msg-alert" role="img" aria-label="Aviso en pantalla: ¡Cuidado! No muevas los pies. Alcanzá con el tronco y los brazos."><span>¡Cuidado! <em>No muevas los pies</em>. Alcanzá con el tronco y los brazos.</span></p>
                  <div className="mini-stat"><b>2</b><small>Alertas de movimiento</small></div>
                </div>
              </article>

              {/* Guía con voz */}
              <article className="tile t-guia tint-pink">
                <div className="t-text">
                  <h3>Una mascota explica el juego, con voz</h3>
                  <p>Paso a paso y en voz alta, para que el paciente sepa qué hacer sin ayuda. Se puede saltar o silenciar.</p>
                </div>
                <div className="guia">
                  <i className="mas pez-celebra on guia-mas" aria-hidden="true" />
                  <div className="globo" role="group" aria-label="Ejemplo de la guía del Surf Challenge">
                    <p className="globo-k">PASO <span id="guia-n">3</span> DE 4</p>
                    <p className="globo-t" id="guia-txt" aria-live="polite">Tocá los peces con las manos, sin mover los pies.</p>
                    <div className="globo-foot">
                      <div className="dots" id="guia-dots" aria-hidden="true"><i /><i /><i className="on" /><i /></div>
                      <div className="globo-btns">
                        <button type="button" className="vz" id="guia-voz" aria-label="Escuchar este paso en voz alta"><svg className="ic v-on"><use href="#i-vol" /></svg><svg className="ic v-off"><use href="#i-mute" /></svg></button>
                        <button type="button" className="sig" id="guia-sig">Siguiente</button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ───────────── CTA ───────────── */}
        <section className="cta" aria-labelledby="h-cta">
          <div className="wrap">
            <div className="cta-panel">
              <canvas className="cta-waves" id="ctaWaves" aria-hidden="true" />
              <div className="cta-card">
                <i className="mas fla-celebra on cta-fla" aria-hidden="true" />
                <i className="mas pez-celebra on cta-pez" aria-hidden="true" />
                <p className="cta-kicker">¿Sos kinesiólogo?</p>
                <h2 className="h2" id="h-cta">Que la próxima sesión sea <span className="m">un juego.</span></h2>
                <p className="sub">Creá tu cuenta, cargá a tu primer paciente y empezá una sesión.</p>
                <div className="cta-row center">
                  <a className="btn btn-primary" href="/webapp/register" onClick={() => track('cta_click', { cta: 'final_registro' })}>Crear cuenta</a>
                  <a className="btn btn-ghost" href="/webapp/login" onClick={() => track('cta_click', { cta: 'final_login' })}>Ya tengo cuenta</a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap foot-grid">
          <div className="foot-brand">
            <a className="brand" href="#top" aria-label="Kinetix, volver al inicio"><i className="mark" aria-hidden="true" /><svg viewBox="44 13 112 34" aria-hidden="true" focusable="false"><path d={WORDMARK_PATH} fill="#0F1387" /></svg></a>
          </div>
          <nav className="foot-links" aria-label="Secciones">
            <a href="#conexion">Cómo se conecta</a><a href="#juegos">Juegos</a><a href="#consultorio">Para kinesiólogos</a>
          </nav>
          <p className="copy">© 2026 Kinetix</p>
        </div>
      </footer>
    </div>
  )
}
