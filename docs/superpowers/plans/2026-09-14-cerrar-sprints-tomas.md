# Cerrar mi parte del proyecto (backend + webapp) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cerrar los últimos huecos reales de S4/S6 en la parte de Tomás (backend Express + webapp React), dejando cada sprint como un commit separado para pushear de a poco.

**Architecture:** El flujo real ya funciona (confirmado leyendo el código, no el AGENTS.md desactualizado): los 3 juegos corren en el navegador (Phaser + MediaPipe vía webcam, no en una app móvil separada), crean una sesión con `POST /api/sesiones`, y al terminar llaman `PUT /api/sesiones/:id/finalizar` con un JSON de métricas específico del juego guardado en `metricas_sesion.datos_ia_raw`. La única pieza real que falta es una pantalla de **resultado individual por sesión** — hoy `Analisis.tsx` y el historial de `DetallePaciente.tsx` listan sesiones pero no hay drill-down. No existe endpoint `GET /api/sesiones/:id` tampoco.

**Tech Stack:** Node/Express + Supabase (`back/`), React 19 + Vite + TS + Tailwind (`front/`). Sin framework de tests — verificación manual vía `curl` (backend) y navegador (frontend), igual que el resto del proyecto.

**Fuera de alcance (deliberado, YAGNI):** `POST /api/sesiones/:id/feedback`, `POST /api/sesiones/:id/videos`, tablas de video y `GET /api/estadisticas` del AGENTS.md original — esa arquitectura (app móvil subiendo 3 versiones de video + timeline de feedback) nunca se construyó y no es lo que el proyecto terminó siendo. `Analisis.tsx` ya calcula las estadísticas globales en el cliente a partir de `getSesiones()`, que alcanza para el volumen de datos actual; agregar un endpoint de agregación server-side ahora sería duplicar lógica sin necesidad real.

---

### Task 1 — Backend: `GET /api/sesiones/:id`

**Files:**
- Modify: `back/src/models/sesion.js`
- Modify: `back/src/controllers/sesionController.js`
- Modify: `back/src/routes/sesiones.js`

- [ ] **Step 1: Agregar `findByIdConDetalle` al modelo**

En `back/src/models/sesion.js`, después de la función `listar` (línea 65) y antes del `module.exports`, agregar:

```js
// Detalle de una sesión con paciente y métricas resumidas (para la pantalla de resultados)
async function findByIdConDetalle(id, kinesiologo_id) {
  const { data, error } = await supabase
    .from('sesiones')
    .select(`
      id, juego, estado, iniciada_en, finalizada_en, duracion_segundos, notas,
      pacientes ( id, nombre, apellido ),
      metricas_sesion ( repeticiones_correctas, repeticiones_totales, precision_porcentaje, rango_movimiento_max, rango_movimiento_avg, estabilidad_score, datos_ia_raw )
    `)
    .eq('id', id)
    .eq('kinesiologo_id', kinesiologo_id)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}
```

Y actualizar el `module.exports` de ese archivo para incluirla:

```js
module.exports = { create, finalizar, findById, findByIdConDetalle, listar }
```

- [ ] **Step 2: Agregar el controller**

En `back/src/controllers/sesionController.js`, después de `listar` (línea 46) y antes del `module.exports`:

```js
async function detalle(req, res) {
  try {
    const sesion = await sesionModel.findByIdConDetalle(req.params.id, req.userId)
    if (!sesion) {
      return res.status(404).json({ error: 'Sesión no encontrada' })
    }
    res.json(sesion)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
```

Y actualizar el export:

```js
module.exports = { create, finalizar, listar, detalle }
```

- [ ] **Step 3: Agregar la ruta**

En `back/src/routes/sesiones.js`, después de la línea `router.get('/', sesionController.listar)`:

```js
router.get('/:id', sesionController.detalle)
```

(Ojo con el orden: como Express matchea rutas en orden y `/:id` no colisiona con `/` ni con `/:id/finalizar`, no hace falta reordenar nada — `router.get('/', ...)` sigue matcheando solo la raíz exacta.)

- [ ] **Step 4: Levantar el backend y probar manualmente**

Con el backend corriendo en `localhost:3000` y un token válido (`localStorage.getItem('kinetix_token')` desde el browser logueado), probar:

```bash
curl -s http://localhost:3000/api/sesiones/<ID_DE_UNA_SESION_REAL> \
  -H "Authorization: Bearer <TOKEN>" | head -c 500
```

Esperado: JSON con `id`, `juego`, `pacientes: {...}`, `metricas_sesion: [...]`. Probar también con un ID que no existe o que es de otro kinesiólogo → debe dar `404`.

- [ ] **Step 5: Commit**

```bash
git add back/src/models/sesion.js back/src/controllers/sesionController.js back/src/routes/sesiones.js
git commit -m "feat(back): endpoint GET /api/sesiones/:id con detalle y metricas (S4)"
```

---

### Task 2 — Webapp: página de resultado por sesión

**Files:**
- Create: `front/src/pages/ResultadoSesion.tsx`
- Modify: `front/src/lib/sesiones.ts`
- Modify: `front/src/App.jsx`

- [ ] **Step 1: Agregar el fetch de detalle a `lib/sesiones.ts`**

En `front/src/lib/sesiones.ts`, junto a `getSesiones` (después de la línea 49), agregar:

```ts
export type SesionDetalle = SesionRow & {
  notas: string | null
  metricas_sesion: Array<{
    repeticiones_correctas: number | null
    repeticiones_totales: number | null
    precision_porcentaje: number | null
    rango_movimiento_max: number | null
    rango_movimiento_avg: number | null
    estabilidad_score: number | null
    datos_ia_raw: Record<string, unknown> | null
  }>
}

export async function getSesion(sesionId: string): Promise<SesionDetalle> {
  return api.get<SesionDetalle>(`/sesiones/${sesionId}`, { token: token() })
}
```

- [ ] **Step 2: Crear la página de resultado**

Crear `front/src/pages/ResultadoSesion.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getSesion,
  type SesionDetalle,
  JUEGO_LABEL,
  JUEGO_ICON,
  formatFecha,
} from '../lib/sesiones'

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-[18px] p-5 shadow-[0_6px_24px_-12px_rgba(43,49,156,0.15)]">
      <p className="text-2xl font-black text-primary">{value}</p>
      <p className="text-text-muted text-xs font-semibold mt-0.5">{label}</p>
    </div>
  )
}

// Cada juego guarda su propio JSON en datos_ia_raw — mapeamos los campos
// relevantes por tipo de juego en vez de intentar generalizar una sola forma.
function statsPorJuego(s: SesionDetalle): { label: string; value: string | number }[] {
  const raw = (s.metricas_sesion?.[0]?.datos_ia_raw ?? {}) as Record<string, unknown>
  if (s.juego === 'surf') {
    return [
      { label: 'Peces atrapados', value: (raw.puntos as number) ?? '—' },
      { label: 'Duración', value: raw.duracion_segundos ? `${raw.duracion_segundos}s` : '—' },
    ]
  }
  if (s.juego === 'flamenco') {
    return [
      { label: 'Mejor tiempo en equilibrio', value: raw.mejor_tiempo_segundos ? `${raw.mejor_tiempo_segundos}s` : '—' },
      { label: 'Intentos', value: (raw.intentos as number) ?? '—' },
    ]
  }
  if (s.juego === 'estrellas') {
    return [
      { label: 'Estrellas alcanzadas', value: (raw.estrellas_alcanzadas as number) ?? '—' },
      { label: 'Movimientos de pies', value: (raw.movimientos_pies as number) ?? '—' },
    ]
  }
  return []
}

export default function ResultadoSesion() {
  const { sesionId } = useParams<{ sesionId: string }>()
  const [sesion, setSesion] = useState<SesionDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sesionId) return
    let active = true
    getSesion(sesionId)
      .then((data) => { if (active) setSesion(data) })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'No se pudo cargar la sesión') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [sesionId])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-48 rounded bg-white/70 animate-pulse" />
        <div className="h-40 rounded-[18px] bg-white/70 animate-pulse" />
      </div>
    )
  }

  if (error || !sesion) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <span className="material-symbols-rounded text-[48px] text-rose-400">error</span>
        <h1 className="text-xl font-black text-primary mt-4">Sesión no encontrada</h1>
        <p className="text-text-muted font-medium mt-1">{error ?? 'Esa sesión no existe o no te pertenece.'}</p>
        <Link to="/analisis" className="inline-flex items-center gap-2 rounded-full bg-accent text-white text-sm font-bold px-6 py-3 mt-6 hover:bg-[#C83890]">
          <span className="material-symbols-rounded text-[18px]">arrow_back</span>
          Volver a análisis
        </Link>
      </div>
    )
  }

  const volverA = sesion.pacientes ? `/pacientes/${sesion.pacientes.id}` : '/analisis'

  return (
    <div className="max-w-3xl mx-auto">
      <Link to={volverA} className="inline-flex items-center gap-1 text-text-muted text-sm font-bold hover:text-accent mb-6">
        <span className="material-symbols-rounded text-[18px]">arrow_back</span>
        Volver
      </Link>

      <div className="bg-white rounded-[18px] shadow-[0_6px_24px_-12px_rgba(43,49,156,0.15)] p-6 lg:p-8 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="w-10 h-10 rounded-[12px] bg-violet-50 text-primary flex items-center justify-center">
            <span className="material-symbols-rounded text-[20px]">{JUEGO_ICON[sesion.juego] ?? 'sports_esports'}</span>
          </span>
          <h1 className="text-2xl font-black text-primary">{JUEGO_LABEL[sesion.juego] ?? sesion.juego}</h1>
        </div>
        <p className="text-text-muted font-medium">
          {sesion.pacientes ? `${sesion.pacientes.nombre} ${sesion.pacientes.apellido} — ` : ''}
          {formatFecha(sesion.iniciada_en)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {statsPorJuego(sesion).map((s) => (
          <Stat key={s.label} label={s.label} value={s.value} />
        ))}
        <Stat label="Duración total" value={sesion.duracion_segundos != null ? `${sesion.duracion_segundos}s` : '—'} />
        <Stat label="Estado" value={sesion.estado === 'finalizada' ? 'Finalizada' : sesion.estado} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Cablear la ruta**

En `front/src/App.jsx`, agregar el import junto a `Analisis` (línea 21):

```jsx
import ResultadoSesion from './pages/ResultadoSesion.tsx'
```

Y la ruta dentro del bloque `<AuthRoute><AppLayout /></AuthRoute>` (después de la línea `<Route path="/analisis" element={<Analisis />} />`):

```jsx
<Route path="/sesiones/:sesionId" element={<ResultadoSesion />} />
```

- [ ] **Step 4: Verificar en el navegador**

Con front y back corriendo, logueado, navegar manualmente a `/sesiones/<ID_DE_UNA_SESION_REAL>` y confirmar que carga sin error de consola, muestra el juego correcto y las métricas de `datos_ia_raw`. Probar también con un ID inventado → debe mostrar el estado de error, no romper la página.

- [ ] **Step 5: Commit**

```bash
git add front/src/pages/ResultadoSesion.tsx front/src/lib/sesiones.ts front/src/App.jsx
git commit -m "feat(webapp): pantalla de resultado individual por sesion (S6)"
```

---

### Task 3 — Webapp: enlazar el historial a la pantalla de resultado

**Files:**
- Modify: `front/src/pages/Analisis.tsx:139-165`
- Modify: `front/src/pages/DetallePaciente.tsx:331-347`

- [ ] **Step 1: Hacer clickeable cada fila en `Analisis.tsx`**

En `front/src/pages/Analisis.tsx`, la fila de la tabla (línea 140) hoy es un `<tr>` sin acción. Envolver el contenido de resultado/duración en un link, o más simple: envolver toda la fila con `onClick` + cursor pointer usando `useNavigate`. Import a agregar arriba (junto a `Link`, línea 2):

```tsx
import { Link, useNavigate } from 'react-router-dom'
```

Dentro del componente, después de `const [filtro, ...]` (línea 37):

```tsx
const navigate = useNavigate()
```

Y cambiar la apertura del `<tr>` (línea 140) de:

```tsx
<tr key={s.id} className="hover:bg-bg-header/40 transition-colors">
```

a:

```tsx
<tr
  key={s.id}
  onClick={() => navigate(`/sesiones/${s.id}`)}
  className="hover:bg-bg-header/40 transition-colors cursor-pointer"
>
```

(El link al paciente dentro de la fila, línea 143-148, sigue funcionando igual — los `<Link>` anidados hacen `stopPropagation` del click nativamente en react-router, así que no navegan también a la sesión por accidente... en realidad SÍ hay que frenar la propagación a mano, porque un click en un `<a>` dentro de un `<tr onClick>` sigue burbujeando. Agregar `onClick={(e) => e.stopPropagation()}` al `<Link>` de paciente, línea 143.)

- [ ] **Step 2: Hacer clickeable cada fila del historial en `DetallePaciente.tsx`**

En `front/src/pages/DetallePaciente.tsx`, el `<li>` del historial (línea 332) hoy no navega a ningún lado. Cambiar:

```tsx
<li key={s.id} className="flex items-center gap-4 px-6 py-4">
```

a:

```tsx
<li key={s.id}>
  <Link
    to={`/sesiones/${s.id}`}
    className="flex items-center gap-4 px-6 py-4 hover:bg-bg-header/60 transition-colors"
  >
```

Y cerrar con `</Link></li>` en vez de `</li>` al final del bloque (después de la línea 346, que hoy cierra con `</li>`).

`Link` ya está importado en ese archivo (se usa en la línea 2), no hace falta agregar nada.

- [ ] **Step 3: Verificar en el navegador**

Ir a `/analisis`, click en una fila de la tabla → debe navegar a `/sesiones/<id>`. Click en el nombre del paciente dentro de la fila → debe ir al paciente, NO a la sesión. Ir al detalle de un paciente con sesiones, click en una fila del historial → debe navegar a `/sesiones/<id>` también.

- [ ] **Step 4: Commit**

```bash
git add front/src/pages/Analisis.tsx front/src/pages/DetallePaciente.tsx
git commit -m "feat(webapp): enlazar historial de sesiones a la pantalla de resultado (S6)"
```

---

### Task 4 — Docs: actualizar AGENTS.md al estado real

**Files:**
- Modify: `AGENTS.md:253-263` (sección "Estado actual del repo")

- [ ] **Step 1: Reemplazar la sección desactualizada**

El bloque actual (líneas 253-263, fechado "julio 2026") dice que S4/S5/S6 están pendientes. Reemplazarlo por un resumen que refleje lo verificado en este plan: S4 completo, S5 muy avanzado (juegos reales corriendo en el navegador con MediaPipe, no en una app móvil separada como decía el plan original), S6 cerrado con este plan, y la aparición de la carpeta `mobile/` (React Native) que no estaba contemplada.

No hay código nuevo que escribir acá — es prosa. Redactarla con la info reunida en la sección "Architecture" de este plan más los 3 commits anteriores.

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: actualizar estado del repo (S4-S6 cerrados de mi parte, mobile/ nueva)"
```

---

## Self-Review

**Spec coverage:** cubre el único gap real identificado (resultado por sesión + endpoint de detalle) y deja registrado por qué el resto del S5/S6 original (video, feedback timeline, `/estadisticas`) se descarta a propósito. Los otros ítems del sprint plan original ya estaban hechos antes de este plan (confirmado leyendo el código: CRUD sesiones, juegos con MediaPipe, dashboard, `Analisis.tsx`).

**Placeholders:** ninguno — cada paso tiene el código completo a pegar, con archivo y línea exacta.

**Consistencia de tipos:** `SesionDetalle` (Task 2) extiende `SesionRow` (ya definido en `lib/sesiones.ts`) agregando `notas` y ampliando `metricas_sesion` — coincide con lo que devuelve el `select` del Task 1. `getSesion(sesionId)` es el nombre usado consistentemente en Task 2 y Task 3.
