# Tarea para agente de IA: conectar los juegos al backend de Sprint 5

> Este archivo es una tarea autocontenida para que un agente de IA (Claude Code, Cursor,
> etc.) la implemente sin necesitar más contexto que este documento y el código del repo.
> Si sos una persona leyendo esto: es lo mismo que `SPRINT5-INTEGRACION.md`, pero en
> formato de instrucciones paso a paso en vez de referencia.

## Contexto del proyecto

Kinetix es una app de rehabilitación kinesiológica gamificada. Hay 3 juegos (Surf,
Flamenco, Alcanzá la estrella) que corren **en el navegador** de la webapp React
(`front/src/juegos/`), usando Phaser para el juego y MediaPipe (vía webcam) para
detectar la pose del paciente. Esto es distinto del plan original del proyecto (que
imaginaba una app móvil separada) — la arquitectura real quedó así, y es la que hay
que seguir.

El **backend ya tiene listos y cerrados** 3 endpoints para recibir datos de cada sesión
de juego (repo `back/`, no hay que tocar nada ahí). Lo que falta es la parte del
**frontend**: que los juegos efectivamente llamen a esos endpoints. Esa es esta tarea.

## Objetivo

Para cada uno de los 3 juegos, al finalizar una sesión:

1. Grabar y subir hasta 3 videos de la sesión (crudo, con esqueleto detectado, con el
   juego renderizado).
2. Mandar el timeline de eventos/feedback relevantes que ocurrieron durante la partida.
3. (Opcional, menor prioridad) Mandar métricas crudas en batch si el juego calcula datos
   frame a frame que valga la pena guardar para gráficos futuros.

## Los 3 endpoints (ya existen, no tocar backend)

Todos van bajo `/api/sesiones/:id/...`, requieren
`Authorization: Bearer <token>` (mismo patrón que ya usan `crearSesion`/`finalizarSesion`
en `front/src/lib/sesiones.ts`), y devuelven 404 si la sesión no existe o no es del
kinesiólogo logueado.

### 1. `POST /api/sesiones/:id/eventos` — timeline de feedback

```json
{
  "eventos": [
    { "tipo": "mensaje", "mensaje": "Subí más la pierna" },
    { "tipo": "acierto", "datos": { "pierna": "derecha" } },
    { "tipo": "repeticion", "datos": { "numero": 3 } },
    { "tipo": "fin_juego", "datos": { "puntaje": 120 } }
  ]
}
```

`tipo` acepta: `acierto`, `repeticion`, `fin_juego`, `mensaje`. `mensaje` y `datos` son
opcionales. Se puede llamar una sola vez al final con todo el array junto — no hace
falta ir mandando eventos en vivo.

### 2. `POST /api/sesiones/:id/videos` — multipart (no JSON)

Hasta 3 campos, todos opcionales, se pueden mandar juntos o por separado:

- `crudo` — video sin overlay, tal como lo capta la cámara.
- `landmarks` — video con el esqueleto de MediaPipe dibujado encima.
- `gameplay` — video con el juego (Phaser) renderizado encima.

```js
const formData = new FormData()
formData.append('crudo', blobCrudo, 'crudo.webm')
formData.append('landmarks', blobLandmarks, 'landmarks.webm')
formData.append('gameplay', blobGameplay, 'gameplay.webm')
await fetch(`/api/sesiones/${sesionId}/videos`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
})
```

Límite: 20MB por archivo, solo `video/webm` o `video/mp4`.

### 3. `POST /api/sesiones/:id/metricas` — batch de métricas crudas (opcional/menor prioridad)

```json
{ "metricas": [ { "tipo": "angulo_rodilla", "valor": 142.3, "unidad": "grados" } ] }
```

No hay UI que consuma esto todavía — es solo para tener el dato guardado a futuro. No
es necesario implementarlo si el tiempo apremia; los videos y eventos son lo prioritario.

## Cómo están armados los 3 juegos hoy (mismo patrón en los 3)

Los 3 archivos de página de juego son casi idénticos:

- `front/src/juegos/flamenco/FlamencoPage.jsx`
- `front/src/juegos/surf/GamePage.jsx`
- `front/src/juegos/estrellas/EstrellasPage.jsx`

Cada uno tiene:

```js
const camaraCanvasRef = usePoseAI('<juego>', !pausado, HEADER_H)

useEffect(() => {
  if (!pacienteId) return
  crearSesion(pacienteId, '<juego>').then(s => { sesionIdRef.current = s.id })
}, [pacienteId])

useEffect(() => {
  const handler = (e) => {
    if (!sesionIdRef.current) return
    finalizarSesion(sesionIdRef.current, { juego: '<juego>', ...e.detail }).catch(console.warn)
  }
  window.addEventListener('kinetix:<juego>:fin', handler)
  return () => window.removeEventListener('kinetix:<juego>:fin', handler)
}, [])
```

El evento `kinetix:<juego>:fin` (ya disparado por cada juego cuando termina) es el
momento correcto para además:
1. Detener las grabaciones y armar los 3 Blobs de video.
2. Subirlos con `POST /:id/videos`.
3. Mandar el array de eventos acumulado con `POST /:id/eventos`.

`sesionIdRef.current` ya tiene el id de la sesión en ese punto — es lo mismo que ya usa
`finalizarSesion`.

## De dónde sale cada video (las 3 fuentes ya existen, solo falta grabarlas)

Mirar `front/src/juegos/flamenco/PhaserGameFlamenco.jsx` (los otros 2 juegos son iguales
en estructura):

```jsx
<video ref={videoRef} autoPlay playsInline muted style={{ transform: 'scaleX(-1)', ... }} />
<div ref={contenedorRef} ... />   {/* Phaser inserta su <canvas> acá adentro */}
```

- **`crudo`**: el stream de `videoRef.current.srcObject` (la cámara sin tocar). Se puede
  grabar directo con `new MediaRecorder(videoRef.current.srcObject)`.
- **`landmarks`**: el `<canvas>` que devuelve el hook `usePoseAI` (ver
  `front/src/ia/usePoseAI.js` y `front/src/ia/KinetixAI.js`) — ahí `KinetixAI.js` ya
  dibuja la cámara en espejo + el esqueleto de MediaPipe encima, frame a frame. Ese
  canvas se puede grabar con `canvasRef.current.captureStream(30).getVideoTracks()` +
  `MediaRecorder`.
- **`gameplay`**: es el único que requiere componer manualmente, porque hoy la cámara
  (`<video>`) y el juego (`<canvas>` de Phaser, dentro de `contenedorRef`) están
  superpuestos con CSS (position absolute + z-index), no dibujados en un mismo canvas.
  Hay que crear un `<canvas>` offscreen (no visible en pantalla) del mismo tamaño, y en
  cada frame (`requestAnimationFrame`) hacer:
  ```js
  ctx.drawImage(videoRef.current, 0, 0, w, h)          // cámara de fondo
  ctx.drawImage(gameRef.current.canvas, 0, 0, w, h)    // el juego (Phaser) encima
  ```
  `gameRef.current.canvas` es el canvas real que expone la instancia de `Phaser.Game`
  (ver `PhaserGameFlamenco.jsx`, línea donde se crea `new Phaser.Game({...})` — la
  instancia queda en `gameRef.current`). Grabar ESE canvas offscreen con
  `captureStream(30)` + `MediaRecorder`.

Patrón sugerido para las 3 grabaciones (arrancan cuando arranca el juego, paran en
`kinetix:<juego>:fin`):

```js
const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
const chunks = []
recorder.ondataavailable = (e) => chunks.push(e.data)
recorder.start()
// ... más tarde, al terminar:
recorder.stop()
// esperar el evento 'stop' del recorder, después:
const blob = new Blob(chunks, { type: 'video/webm' })
```

## Eventos de feedback: qué acumular

Cada juego ya tiene su propia lógica de feedback (por ejemplo, en Flamenco:
`kinetix:flamenco:pierna` con `{ levantada: boolean }`, mostrado como "¡Mantené el
equilibrio!" en el HUD). La tarea es, en vez de solo actualizar el HUD, ir empujando a
un array en memoria (un `useRef([])` alcanza) un evento por cada ocurrencia relevante
(pierna levantada = evento `acierto` o `mensaje` con texto tipo "Muy bien", según lo que
tenga sentido para cada juego), y mandar ese array completo con `POST /:id/eventos`
cuando llega `kinetix:<juego>:fin`.

No hace falta inventar mensajes nuevos — usar los textos que cada juego ya muestra en
pantalla (p.ej. "¡Mantené el equilibrio!" en Flamenco).

## Pasos concretos

1. En `front/src/lib/sesiones.ts`, agregar 2 funciones nuevas (junto a `crearSesion`/
   `finalizarSesion`):
   ```ts
   export async function subirVideosSesion(sesionId: string, videos: { crudo?: Blob; landmarks?: Blob; gameplay?: Blob }) {
     const formData = new FormData()
     if (videos.crudo) formData.append('crudo', videos.crudo, 'crudo.webm')
     if (videos.landmarks) formData.append('landmarks', videos.landmarks, 'landmarks.webm')
     if (videos.gameplay) formData.append('gameplay', videos.gameplay, 'gameplay.webm')
     return api.post(`/sesiones/${sesionId}/videos`, formData, { token: token() })
   }

   export async function mandarEventosSesion(sesionId: string, eventos: Array<{ tipo: string; mensaje?: string; datos?: unknown }>) {
     return api.post(`/sesiones/${sesionId}/eventos`, { eventos }, { token: token() })
   }
   ```
   (revisar cómo `api.post` maneja `FormData` vs JSON en `front/src/lib/api.ts` — si
   hoy siempre setea `Content-Type: application/json`, para el de videos hay que pegarle
   con `fetch` nativo en vez de pasar por `api.post`, para que el browser setee el
   `Content-Type: multipart/form-data` con el boundary correcto.)

2. En cada uno de los 3 juegos (`PhaserGameFlamenco.jsx`, `PhaserGame.jsx` en surf,
   `PhaserGameEstrellas.jsx` en estrellas): exponer `gameRef.current` al componente
   padre (la *Page.jsx), o mover la lógica de grabación adentro de estos wrappers de
   Phaser, ya que son los que tienen acceso directo a `videoRef` y a la instancia del
   juego.

3. Armar el canvas offscreen para "gameplay" y arrancar los 3 `MediaRecorder` cuando
   arranca la sesión (mismo momento que hoy se llama `crearSesion`).

4. En el handler de `kinetix:<juego>:fin` de cada `*Page.jsx`, antes o junto con el
   `finalizarSesion` existente: parar los recorders, armar los Blobs, llamar
   `subirVideosSesion` y `mandarEventosSesion` con el array acumulado.

5. Repetir en los 3 juegos — la lógica es idéntica, solo cambia el nombre del juego y
   los mensajes de feedback específicos de cada uno.

## Cómo probar

No hay entorno de tests automatizados en este proyecto — se prueba a mano en el
navegador:

1. Levantar front (`npm run dev` en `front/`) y back (`npm run dev` en `back/`).
2. Loguearse, ir a un paciente, iniciar una sesión de cualquier juego.
3. Jugar unos segundos y salir/terminar el juego.
4. Confirmar en la consola del navegador que no hay errores de red al llamar
   `/videos` y `/eventos`.
5. Confirmar en el resultado de la sesión (`/sesiones/:id` en la webapp) que ahora sí
   aparece el video real en vez del estado "no disponible".

## Qué NO tocar

- Nada en `back/` — los 3 endpoints ya están hechos, probados y deployados.
- El endpoint de métricas en batch (`/metricas`) es opcional — no bloquea nada si se
  deja para después.

## Dudas / decisiones que quedan a criterio de quien implemente

- Formato exacto de los mensajes de feedback por juego (no hay un texto "correcto"
  único, usar los que ya se muestran en el HUD de cada uno).
- Calidad/bitrate de grabación de `MediaRecorder` — no hay un requisito específico,
  cualquier valor razonable que se mantenga bajo el límite de 20MB por archivo alcanza.
