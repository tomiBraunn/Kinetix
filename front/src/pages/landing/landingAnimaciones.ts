// Animaciones de la landing nueva: port del <script> del prototipo de traspaso.
// Trabajan sobre el elemento raíz de la landing y devuelven las funciones que limpian todo al desmontarla.

type Limpieza = () => void

const reducirMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/* CTA: las waves del login (gradflow "stripe", MIT). Shader directo en WebGL con los mismos colores, velocidad y grano. */
function iniciarWaves(root: HTMLElement): Limpieza[] {
  const cv = root.querySelector<HTMLCanvasElement>('#ctaWaves')
  if (!cv) return []
  const gl = cv.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'high-performance' })
  if (!gl) return [] // sin WebGL queda el degradé pastel de fondo
  const g: WebGLRenderingContext = gl
  const VS = 'attribute vec2 position;varying vec2 vUv;void main(){vUv=position*0.5+0.5;gl_Position=vec4(position,0.0,1.0);}'
  const FS = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
    #else
      precision mediump float;
    #endif
    uniform float u_time;
    uniform vec3 u_color1;
    uniform vec3 u_color2;
    uniform vec3 u_color3;
    uniform float u_speed;
    uniform float u_scale;
    uniform float u_noise;
    uniform vec2 u_resolution;
    varying vec2 vUv;
    float noise(vec2 st) { return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453); }
    vec3 stripeGradient(vec2 uv, float time) {
      vec2 p = ((uv * u_resolution * 2.0 - u_resolution.xy) / (u_resolution.x + u_resolution.y) * 2.0) * u_scale;
      float t = time * 0.7, a = 4.0 * p.y - sin(-p.x * 3.0 + p.y - t);
      a = smoothstep(cos(a) * 0.7, sin(a) * 0.7 + 1.0, cos(a - 4.0 * p.y) - sin(a + 3.0 * p.x));
      vec2 warped = (cos(a) * p + sin(a) * vec2(-p.y, p.x)) * 0.5 + 0.5;
      vec3 color = mix(u_color1, u_color2, warped.x);
      color = mix(color, u_color3, warped.y);
      color *= color + 0.6 * sqrt(color);
      return clamp(color, 0.0, 1.0);
    }
    void main() {
      vec2 uv = vUv;
      float time = u_time * u_speed;
      vec3 color = stripeGradient(uv, time);
      if (u_noise > 0.001) {
        float grain = noise(uv * 200.0 + time * 0.1);
        color *= (1.0 - u_noise * 0.4 + u_noise * grain * 0.4);
      }
      gl_FragColor = vec4(color, 1.0);
    }`
  const compilar = (tipo: number, src: string) => {
    const s = g.createShader(tipo)
    if (!s) return null
    g.shaderSource(s, src)
    g.compileShader(s)
    return g.getShaderParameter(s, g.COMPILE_STATUS) ? s : null
  }
  const vs = compilar(g.VERTEX_SHADER, VS)
  const fs = compilar(g.FRAGMENT_SHADER, FS)
  if (!vs || !fs) return []
  const prog = g.createProgram()
  if (!prog) return []
  g.attachShader(prog, vs)
  g.attachShader(prog, fs)
  g.linkProgram(prog)
  if (!g.getProgramParameter(prog, g.LINK_STATUS)) return []
  g.useProgram(prog)
  g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer())
  g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW)
  const loc = g.getAttribLocation(prog, 'position')
  g.enableVertexAttribArray(loc)
  g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0)
  const U = (n: string) => g.getUniformLocation(prog, n)
  const hex = (h: string) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255]
  // los colores de GradientBackground.tsx (periwinkle → lavanda → rosa)
  g.uniform3fv(U('u_color1'), hex('#7FA8F5'))
  g.uniform3fv(U('u_color2'), hex('#B79BE8'))
  g.uniform3fv(U('u_color3'), hex('#F58CB8'))
  g.uniform1f(U('u_speed'), 0.4)
  g.uniform1f(U('u_scale'), 1)
  g.uniform1f(U('u_noise'), 0.06)
  const uTiempo = U('u_time')
  const uRes = U('u_resolution')
  const panel = cv.parentElement as HTMLElement
  const t0 = performance.now()
  const reducir = reducirMovimiento()
  let raf = 0
  let visible = false
  const dibujar = (ahora: number) => {
    g.uniform1f(uTiempo, reducir ? 8 : (ahora - t0) / 1000)
    g.drawArrays(g.TRIANGLE_STRIP, 0, 4)
  }
  const loop = (ahora: number) => {
    raf = 0
    dibujar(ahora)
    if (visible && !document.hidden && !reducir) raf = requestAnimationFrame(loop)
  }
  const retomar = () => {
    if (!raf && visible && !document.hidden && !reducir) raf = requestAnimationFrame(loop)
  }
  const ajustar = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const w = panel.clientWidth
    const h = panel.clientHeight
    cv.width = Math.max(1, Math.round(w * dpr))
    cv.height = Math.max(1, Math.round(h * dpr))
    g.viewport(0, 0, cv.width, cv.height)
    g.uniform2f(uRes, w, h)
    dibujar(performance.now())
  }
  const ro = new ResizeObserver(ajustar)
  ro.observe(panel)
  const io = new IntersectionObserver((es) => {
    visible = es[0].isIntersecting
    retomar()
  }, { threshold: 0 })
  io.observe(panel)
  document.addEventListener('visibilitychange', retomar)
  ajustar()
  return [
    () => cancelAnimationFrame(raf),
    () => ro.disconnect(),
    () => io.disconnect(),
    () => document.removeEventListener('visibilitychange', retomar),
  ]
}

/* Conexión celular → panel: la secuencia de 3 pasos, el panel que cambia de sesión y el celular con cuenta regresiva. */
function iniciarConexion(root: HTMLElement): Limpieza[] {
  const conexion = root.querySelector<HTMLElement>('#conexion')
  if (!conexion) return []
  const q = <T extends Element = HTMLElement>(s: string) => conexion.querySelector<T>(s) as T
  const steps = Array.from(conexion.querySelectorAll<HTMLButtonElement>('.step'))
  const pauseBtn = q<HTMLButtonElement>('#pauseBtn')
  const reducir = reducirMovimiento()

  type Datos = { best: number; tries: number; reps: number; dur: number; est: number; prec: number; rom: number; date: string; c: string }
  const A: Datos = {
    best: 14, tries: 4, reps: 4, dur: 71, est: 84, prec: 80, rom: 36, date: '21 oct 2026',
    c: 'Durante la sesión de Flamenco Challenge, el paciente mostró una estabilidad postural muy buena y una precisión de movimiento dentro de lo esperado, con un rango de movimiento promedio de 36°. El patrón de movimiento sugiere una buena evolución del control motor y el equilibrio.',
  }
  const B: Datos = {
    best: 18, tries: 3, reps: 4, dur: 68, est: 91, prec: 87, rom: 41, date: '28 oct 2026',
    c: 'Durante la sesión de Flamenco Challenge, el paciente mostró una estabilidad postural muy buena y una precisión de movimiento muy alta, con un rango de movimiento promedio de 41°. El patrón de movimiento sugiere una buena evolución del control motor y el equilibrio.',
  }
  type Campo = 'best' | 'tries' | 'reps' | 'dur' | 'est' | 'prec' | 'rom'
  const F: Record<Campo, [HTMLElement, (v: number) => string]> = {
    best: [q('#p-best'), (v) => v + ' s'],
    tries: [q('#p-tries'), (v) => String(v)],
    reps: [q('#p-reps'), (v) => String(v)],
    dur: [q('#p-dur'), (v) => v + ' s'],
    est: [q('#p-est'), (v) => v + '%'],
    prec: [q('#p-prec'), (v) => v + '%'],
    rom: [q('#p-rom'), (v) => v + '°'],
  }
  const campos = Object.keys(F) as Campo[]
  const cur: Datos = { ...A }
  const fechaEl = q('#p-date')
  const comEl = q('#p-comment')
  let tw = 0
  const limpiezas: Limpieza[] = []
  const timers: number[] = []

  function mostrar(d: Datos) {
    for (const k of campos) F[k][0].textContent = F[k][1](Math.round(d[k]))
    fechaEl.textContent = d.date
    comEl.textContent = d.c
  }
  function aplicar(to: Datos, animar: boolean) {
    cancelAnimationFrame(tw)
    const from: Datos = { ...cur }
    const cambia = comEl.textContent !== to.c
    if (cambia && animar) comEl.classList.add('swap')
    fechaEl.textContent = to.date
    if (!animar || reducir) {
      Object.assign(cur, to)
      mostrar(cur)
      comEl.classList.remove('swap')
      return
    }
    const inicio = performance.now()
    const D = 900
    timers.push(window.setTimeout(() => {
      comEl.textContent = to.c
      comEl.classList.remove('swap')
    }, 260))
    const paso = (ahora: number) => {
      const p = clamp((ahora - inicio) / D, 0, 1)
      const e = 1 - Math.pow(1 - p, 3)
      for (const k of campos) {
        cur[k] = from[k] + (to[k] - from[k]) * e
        F[k][0].textContent = F[k][1](Math.round(cur[k]))
      }
      if (p < 1) tw = requestAnimationFrame(paso)
      else Object.assign(cur, to)
    }
    tw = requestAnimationFrame(paso)
  }
  mostrar(A)

  let idx = 0
  let visible = false
  let pausado = false
  const sync = () => conexion.classList.toggle('is-paused', pausado || !visible || document.hidden)
  function irAPaso(i: number) {
    idx = i
    conexion.dataset.step = String(i + 1)
    steps.forEach((b, k) => {
      b.classList.remove('active')
      b.setAttribute('aria-current', k === i ? 'step' : 'false')
    })
    void conexion.offsetWidth // reinicia la animación de la barra
    steps[i].classList.add('active')
    aplicar(i === 2 ? B : A, true)
  }
  const alClicPaso = steps.map((b) => {
    const f = () => irAPaso(Number(b.dataset.i))
    b.addEventListener('click', f)
    return () => b.removeEventListener('click', f)
  })
  limpiezas.push(...alClicPaso)
  if (!reducir) {
    const alTerminarBarra = (e: AnimationEvent) => {
      if (e.animationName === 'fillbar') irAPaso((idx + 1) % steps.length)
    }
    conexion.addEventListener('animationend', alTerminarBarra)
    limpiezas.push(() => conexion.removeEventListener('animationend', alTerminarBarra))
  }
  if (pauseBtn) {
    const alPausar = () => {
      pausado = !pausado
      pauseBtn.setAttribute('aria-pressed', String(pausado))
      const span = pauseBtn.querySelector('span')
      if (span) span.textContent = pausado ? 'Reanudar animación' : 'Pausar animación'
      pauseBtn.querySelector('use')?.setAttribute('href', pausado ? '#i-play' : '#i-pause')
      sync()
    }
    pauseBtn.addEventListener('click', alPausar)
    limpiezas.push(() => pauseBtn.removeEventListener('click', alPausar))
  }
  const io = new IntersectionObserver((es) => {
    visible = es[0].isIntersecting
    sync()
  }, { threshold: 0.15 })
  io.observe(conexion)
  document.addEventListener('visibilitychange', sync)
  sync()
  limpiezas.push(() => io.disconnect(), () => document.removeEventListener('visibilitychange', sync))

  // celular: cuenta regresiva de 10 s y poses de la mascota
  const sec = q('#g-sec')
  const ring = q<SVGCircleElement>('#g-ring')
  const poses = {
    izq: q('.g-fla .fla-izq'),
    alto: q('.g-fla .fla-alto'),
    celebra: q('.g-fla .fla-celebra'),
  }
  let n = 10
  const pose = (nombre: keyof typeof poses) => {
    for (const k of Object.keys(poses) as (keyof typeof poses)[]) poses[k].classList.toggle('on', k === nombre)
  }
  const tickCelular = () => {
    sec.textContent = String(n)
    ring.style.strokeDashoffset = (119.4 * (1 - n / 10)).toFixed(1)
    pose(n >= 7 ? 'izq' : n >= 3 ? 'alto' : n > 0 ? 'izq' : 'celebra')
  }
  tickCelular()
  if (!reducir) {
    const id = window.setInterval(() => {
      if (!visible || pausado || document.hidden) return
      n = n <= 0 ? 10 : n - 1
      tickCelular()
    }, 1000)
    timers.push(id)
  }
  limpiezas.push(() => {
    cancelAnimationFrame(tw)
    timers.forEach((t) => window.clearTimeout(t))
    timers.forEach((t) => window.clearInterval(t))
  })
  return limpiezas
}

/* Mini demo de la rutina: contador de repeticiones y opciones de dificultad. */
function iniciarRutina(root: HTMLElement): Limpieza[] {
  const out = root.querySelector<HTMLOutputElement>('#rut-n')
  const minus = root.querySelector<HTMLButtonElement>('#rut-minus')
  const plus = root.querySelector<HTMLButtonElement>('#rut-plus')
  if (!out || !minus || !plus) return []
  let n = 4
  const MIN = 2
  const MAX = 10
  const actualizar = () => {
    out.textContent = String(n)
    minus.disabled = n <= MIN
    plus.disabled = n >= MAX
  }
  const alMenos = () => { n = Math.max(MIN, n - 1); actualizar() }
  const alMas = () => { n = Math.min(MAX, n + 1); actualizar() }
  minus.addEventListener('click', alMenos)
  plus.addEventListener('click', alMas)
  const opciones = Array.from(root.querySelectorAll<HTMLButtonElement>('.rut-opts .opt'))
  const limpiezas: Limpieza[] = [
    () => minus.removeEventListener('click', alMenos),
    () => plus.removeEventListener('click', alMas),
  ]
  opciones.forEach((o) => {
    const f = () => {
      opciones.forEach((x) => {
        x.classList.toggle('on', x === o)
        x.setAttribute('aria-checked', String(x === o))
      })
    }
    o.addEventListener('click', f)
    limpiezas.push(() => o.removeEventListener('click', f))
  })
  actualizar()
  return limpiezas
}

/* Mini demo de la guía con voz: pasos de la mascota que avanzan solos cuando la sección está a la vista. */
function iniciarGuia(root: HTMLElement): Limpieza[] {
  const txt = root.querySelector<HTMLElement>('#guia-txt')
  const nEl = root.querySelector<HTMLElement>('#guia-n')
  const dots = Array.from(root.querySelectorAll<HTMLElement>('#guia-dots i'))
  const next = root.querySelector<HTMLButtonElement>('#guia-sig')
  const voz = root.querySelector<HTMLButtonElement>('#guia-voz')
  if (!txt || !nEl || !next || !voz) return []
  const reducir = reducirMovimiento()
  const PASOS = [
    '¡Hola! Dejá lugar libre para moverte y poné la cámara frente a vos.',
    'Ubicate en la silueta: que se te vea de la cabeza a la cintura.',
    'Tocá los peces con las manos, sin mover los pies.',
    '¿Listo? Tocá el botón y prendemos la cámara.',
  ]
  let i = 2
  let timer = 0
  let visto = false
  const render = () => {
    txt.textContent = PASOS[i]
    nEl.textContent = String(i + 1)
    dots.forEach((d, k) => d.classList.toggle('on', k === i))
  }
  const avanzar = () => {
    i = (i + 1) % PASOS.length
    render()
  }
  const armar = () => {
    window.clearInterval(timer)
    if (!reducir && visto) timer = window.setInterval(avanzar, 5200)
  }
  const alSiguiente = () => {
    avanzar()
    armar()
  }
  next.addEventListener('click', alSiguiente)
  const limpiezas: Limpieza[] = [
    () => next.removeEventListener('click', alSiguiente),
    () => window.clearInterval(timer),
  ]
  // la voz se escucha solo cuando el visitante la pide
  if ('speechSynthesis' in window) {
    const alVoz = () => {
      try {
        speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(PASOS[i])
        u.lang = 'es-AR'
        speechSynthesis.speak(u)
      } catch {
        /* sin voz disponible */
      }
    }
    voz.addEventListener('click', alVoz)
    limpiezas.push(() => voz.removeEventListener('click', alVoz))
  } else {
    voz.hidden = true
  }
  const io = new IntersectionObserver((es) => {
    visto = es[0].isIntersecting
    armar()
  }, { threshold: 0.4 })
  io.observe(txt)
  limpiezas.push(() => io.disconnect())
  render()
  return limpiezas
}

/** Arranca todas las animaciones de la landing sobre su raíz. Devuelve la limpieza para cuando se desmonta. */
export function iniciarLanding(root: HTMLElement): () => void {
  const limpiezas = [
    ...iniciarWaves(root),
    ...iniciarConexion(root),
    ...iniciarRutina(root),
    ...iniciarGuia(root),
  ]
  return () => limpiezas.forEach((f) => f())
}
