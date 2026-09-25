# Sprint 5 — cómo conectar los juegos a estos endpoints

Backend listo. Lo que falta es que los juegos (`front/src/juegos/`) llamen a esto.
Todos los endpoints van bajo `/api/sesiones/:id/...`, requieren el mismo header
`Authorization: Bearer <token>` que ya usan `crearSesion`/`finalizarSesion`
(`front/src/lib/sesiones.ts`), y devuelven 404 si la sesión no es del kinesiólogo
logueado o no existe.

## 1. Timeline de eventos/feedback — `POST /api/sesiones/:id/eventos`

Para mandar eventos de juego (aciertos, repeticiones, fin de juego) o mensajes de
feedback ("Muy bien", "Subí más la pierna"). Se puede llamar varias veces durante
la sesión, o una sola vez al final con todo el timeline junto.

```
POST /api/sesiones/<id>/eventos
Content-Type: application/json

{
  "eventos": [
    { "tipo": "mensaje", "mensaje": "Subí más la pierna" },
    { "tipo": "acierto", "datos": { "pierna": "derecha" } },
    { "tipo": "repeticion", "datos": { "numero": 3 } },
    { "tipo": "fin_juego", "datos": { "puntaje": 120 } }
  ]
}
```

`tipo` acepta: `acierto`, `repeticion`, `fin_juego`, `mensaje`. `mensaje` y `datos`
son opcionales (`datos` es jsonb libre, para lo que necesite cada juego).

Ejemplo de dónde engancharlo en `FlamencoPage.jsx`: hoy el listener de
`kinetix:flamenco:pierna` solo actualiza el HUD local — ahí mismo se podría
acumular un array y mandarlo con este endpoint en `kinetix:flamenco:fin`.

## 2. Métricas crudas en batch — `POST /api/sesiones/:id/metricas`

Para mandar lecturas de métricas por frame/ventana (no el resumen final, eso
sigue siendo `PUT /:id/finalizar`). Pensado para lotes, no una request por frame:
juntar ~1 segundo de lecturas (30 frames) y mandarlas juntas.

```
POST /api/sesiones/<id>/metricas
Content-Type: application/json

{
  "metricas": [
    { "tipo": "angulo_rodilla", "valor": 142.3, "unidad": "grados" },
    { "tipo": "estabilidad", "valor": 0.87 }
  ]
}
```

`unidad` es opcional. Esto llega a la tabla `metricas` (ya existía en el schema,
sin usar hasta ahora) — son datos crudos para gráficos detallados en S6, no se
muestran solos hoy.

## 3. Videos de la sesión — `POST /api/sesiones/:id/videos`

Multipart, no JSON. Hasta 3 campos, todos opcionales, se pueden mandar juntos o
por separado (por ejemplo subir `crudo` apenas termina el juego y `gameplay`
unos segundos después si tarda más en generarse):

- `crudo` — video sin overlay, tal como lo capta la cámara.
- `landmarks` — video con el esqueleto de MediaPipe dibujado encima.
- `gameplay` — video con el juego (Phaser) renderizado encima.

```bash
curl -X POST http://localhost:3000/api/sesiones/<id>/videos \
  -H "Authorization: Bearer <token>" \
  -F "crudo=@crudo.webm;type=video/webm" \
  -F "landmarks=@landmarks.webm;type=video/webm"
```

Límite: 20MB por archivo, solo `video/webm` o `video/mp4`. Devuelve las URLs
firmadas que quedaron guardadas:

```json
{ "url_crudo": "https://...", "url_landmarks": "https://..." }
```

### De dónde salen los 3 videos en el navegador

Ya existen las piezas para grabarlos con `MediaRecorder` + `canvas.captureStream()`:

- **`crudo`**: el `<video>` oculto que crea `usePoseAI.js` (línea ~40) tiene el
  stream de cámara sin tocar — se puede grabar directo con
  `stream.getVideoTracks()` o dibujando ese video a un canvas propio.
- **`landmarks`**: el `<canvas>` que devuelve `usePoseAI` (donde `KinetixAI.js`
  dibuja cámara + esqueleto) ya es un canvas — `canvasRef.current.captureStream()`
  da un `MediaStream` grabable directo con `MediaRecorder`.
- **`gameplay`**: es el más laborioso — hay que componer el canvas de Phaser
  (`PhaserGameFlamenco.jsx` etc.) con el canvas de cámara/esqueleto (hoy están
  superpuestos con CSS, no en un mismo canvas). Lo más simple: un canvas
  offscreen que en cada frame haga `drawImage` del canvas de Phaser y encima el
  de la cámara, y grabar ESE con `captureStream()`.

No se tocó nada de esto en `front/` — es la parte que queda pendiente si se
decide conectar los juegos.

## Antes de usar esto en producción

Correr manualmente en el proyecto Supabase real (`ihnvurzeuenwymqqyejz`, **no**
el que esté conectado por MCP en un momento dado) el SQL que está al final de
`back/schema.sql`: crea `eventos_sesion`, `videos_sesion` y el bucket
`sesion-videos`.
