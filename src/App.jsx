import './App.css'

const STATS = [
  { label: 'IA PRECISION', value: '99.8%' },
  { label: 'IA PRECISION', value: '99.8%' },
  { label: 'IA PRECISION', value: '99.8%' },
  { label: 'IA PRECISION', value: '99.8%' },
]

const HOW_IT_WORKS = [
  {
    step: 1,
    side: 'left',
    title: 'El kinesiólogo configura',
    desc: 'El profesional ingresa a la plataforma, registra al paciente y asigna los ejercicios según el plan de rehabilitación.',
    dotImg: 'https://www.figma.com/api/mcp/asset/75b588e7-9b14-4628-8fb3-23a347ebda27',
  },
  {
    step: 2,
    side: 'right',
    title: 'El paciente juega',
    desc: 'Desde una pantalla o televisor, el adulto mayor realiza los movimientos guiado por juegos interactivos diseñados para ejercitar.',
    dotImg: 'https://www.figma.com/api/mcp/asset/1e443865-7251-4e32-8912-4eae28f68f5a',
  },
  {
    step: 3,
    side: 'left',
    title: 'La IA analiza en vivo',
    desc: 'La inteligencia artificial monitorea el equilibrio, detecta errores de postura y registra cada dato del movimiento en tiempo real.',
    dotImg: 'https://www.figma.com/api/mcp/asset/9f4f12f5-0c37-45c4-bea3-9406cbcac8ec',
  },
  {
    step: 4,
    side: 'right',
    title: 'El profesional evalúa',
    desc: 'El kinesiólogo accede a reportes detallados, ve la evolución del paciente y ajusta el tratamiento con datos precisos.',
    dotImg: 'https://www.figma.com/api/mcp/asset/5667dcd1-0f44-4710-ba45-af5bd8186167',
  },
]


const AI_METRICS = [
  { label: 'Equilibrio postural', value: 92 },
  { label: 'Coordinación del movimiento', value: 78 },
  { label: 'Progreso semanal', value: 85 },
]

export default function App() {
  return (
    <div className="landing">
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="logo">
            <div className="logo-k-wrap">
              <img src="https://www.figma.com/api/mcp/asset/dbf818bf-3002-4179-a8cd-467f6d93f96c" alt="" className="logo-k-img" />
            </div>
            <span className="logo-text">inetix</span>
          </div>
          <ul className="nav-links">
            <li><a href="#">Nosotros</a></li>
            <li><a href="#">Funcionalidades</a></li>
            <li><a href="#">Que incluye</a></li>
            <li><a href="#">Para quien</a></li>
            <li><a href="#">IA integrada</a></li>
          </ul>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Rehabilitación <em className="gradient-text">divertida.</em>
            <br />
            Resultados <em className="pink-text">reales.</em>
          </h1>
          <p className="hero-subtitle">
            Transformamos la rehabilitación física en una experiencia divertida y motivadora.
            <br />
            Ejercicios gamificados, análisis de equilibrio con IA y seguimiento
            <br />
            en tiempo real para profesionales.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary">Empezar</button>
            <button className="btn-secondary">Ver demo</button>
          </div>
        </div>
      </section>

      <section className="stats">
        <div className="stats-grid">
          {STATS.map((s, i) => (
            <div key={i} className="stat-card">
              <span className="stat-label">{s.label}</span>
              <span className="stat-value">{s.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="how-it-works">
        <h2 className="section-title">
          Cómo funciona <span className="pink-text" style={{ fontStyle: 'normal', color: '#ff5faa' }}>Kinetix</span>
        </h2>
        <div className="timeline">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className={`timeline-item timeline-${item.side}`}>
              <div className="timeline-content">
                <h3 className="step-title">{item.title}</h3>
                <p className="step-desc">{item.desc}</p>
              </div>
              <div className="timeline-dot">
                {item.dotImg && (
                  <div className="dot-img-wrap">
                    <img src={item.dotImg} alt="" className="dot-img" />
                  </div>
                )}
                <span className="dot-number">{item.step}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="features">
        <h2 className="section-title">Todo lo que incluye Kinetix</h2>
        <p className="section-subtitle">
          Nuestra arquitectura de visión artificial transforma el movimiento humano en flujos de
          datos biométricos de alta resolución.
        </p>
        <div className="features-grid">

          <div className="feature-card">
            <div className="feature-icon-wrap">
              <img
                src="https://www.figma.com/api/mcp/asset/d4ce3bd7-12e9-4e1c-8268-4b55e7a54d45"
                alt="Análisis con IA"
                className="feature-icon-img"
              />
            </div>
            <h3 className="feature-title">Análisis con IA</h3>
            <p className="feature-desc">
              Algoritmos de aprendizaje profundo que mapean la cinemática corporal con precisión quirúrgica en cada articulación.
            </p>
            <div className="feature-widget skeletal-widget">
              <span className="skeletal-label">SKELETAL MAP</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: '85%' }} /></div>
              <span className="skeletal-label">SKELETAL MAP</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: '85%' }} /></div>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrap">
              <img
                src="https://www.figma.com/api/mcp/asset/4cf0064c-2a0a-48c2-9c13-6824e9c88111"
                alt="Juegos Interactivos"
                className="feature-icon-img"
                style={{ width: 27, height: 19 }}
              />
            </div>
            <h3 className="feature-title">Juegos Interactivos</h3>
            <p className="feature-desc">
              Actividades interactivas diseñadas junto a kinesiólogos para que cada movimiento tenga propósito terapéutico. El paciente se divierte sin darse cuenta de que se está rehabilitando.
            </p>
            <div className="feature-widget games-widget">
              <span className="games-number">30</span>
              <span className="games-label">JUEGOS</span>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrap">
              <img
                src="https://www.figma.com/api/mcp/asset/12fda4eb-1fc1-4529-b60b-618bacf0a11c"
                alt="Seguimiento Profesional"
                className="feature-icon-img"
                style={{ width: 24, height: 24 }}
              />
            </div>
            <h3 className="feature-title">Seguimiento Profesional</h3>
            <p className="feature-desc">
              Dashboards analíticos avanzados para profesionales de la salud con telemetría clínica en tiempo real.
            </p>
            <div className="feature-widget telemetry-widget">
              <div className="telemetry-live">
                <span className="live-dot" />
                <span className="live-label">LIVE TELEMETRY LINK</span>
              </div>
              <div className="telemetry-ranges">
                <div className="range-item">
                  <span className="range-value">145°</span>
                  <span className="range-unit">RANGE</span>
                </div>
                <div className="range-item">
                  <span className="range-value">145°</span>
                  <span className="range-unit">RANGE</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      <section className="cta-kine">
        <div className="cta-card">
          <h2 className="cta-title">
            <span>¿Sos kinesiólogo? </span><em className="cta-gradient-text">Transforma tu</em>
            <br />
            <em className="cta-gradient-text">práctica profesional</em>
          </h2>
          <p className="cta-desc">
            Sumate a los profesionales que ya están transformando la experiencia de sus
            pacientes con tecnología pensada para el bienestar.
          </p>
          <div className="cta-buttons">
            <button className="btn-primary">Iniciar Sesión</button>
            <button className="btn-outline">Registrarse</button>
          </div>
        </div>
      </section>

      <section className="ai-section">
        <div className="ai-content">
          <h2 className="ai-title">
            La IA que <span className="gradient-text-upright">no</span>
            <br />
            <span className="gradient-text-upright">descansa</span>
          </h2>
          <p className="ai-desc">
            Mientras el paciente juega, nuestra IA analiza cada movimiento en tiempo real.
            Detecta desequilibrios, mide progreso y genera insights que el kinesiólogo no
            podría obtener a simple vista.
          </p>
          <div className="ai-metrics">
            {AI_METRICS.map((m, i) => (
              <div key={i} className="metric">
                <div className="metric-header">
                  <span className="metric-label">{m.label}</span>
                  <span className="metric-value">{m.value}%</span>
                </div>
                <div className="metric-bar">
                  <div className="metric-fill" style={{ width: `${m.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="ai-visual">
          <div className="ai-orb">
            <div className="orb-ring orb-ring-3" />
            <div className="orb-ring orb-ring-2" />
            <div className="orb-ring orb-ring-1" />
            <div className="orb-core">
              <img
                src="https://www.figma.com/api/mcp/asset/57555cce-91db-4d75-966d-d453661e7370"
                alt=""
                className="orb-icon-img"
              />
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-left">
            <div className="logo">
              <div className="logo-k-wrap">
                <img src="https://www.figma.com/api/mcp/asset/daf3e330-1c02-4443-8950-4a5fcdcd51b5" alt="" className="logo-k-img" />
              </div>
              <span className="logo-text">inetix</span>
            </div>
            <p className="footer-copy">
              © 2024 Kinetics Performance Science.
              <br />
              Precision in human movement through
              <br />
              pure software innovation.
            </p>
          </div>
          <div className="footer-right">
            <a href="#">Privacidad</a>
            <a href="#">Terminos</a>
            <a href="#">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
