# Tarea para agente de IA: análisis de IA generativa sobre las métricas de la sesión

> Autocontenida — no debería hacer falta más contexto que este archivo y el
> código del repo para implementarla.

## Contexto

Kinetix ya tiene un "comentario de IA" en la pantalla de resultado
(`front/src/pages/ResultadoSesion.tsx`, función `comentarioIA()`), pero es
texto armado con reglas fijas (`if estabilidad >= 80 → "muy buena"`, etc.),
**no una llamada a un modelo generativo**. La idea de esta tarea es
reemplazar (o complementar) eso con un análisis de verdad, generado por un
modelo tipo chat (Claude, GPT, el que se elija) corriendo en el backend.

El frontend **ya manda datos reales** de equilibrio — antes de esta tarea
`estabilidad_score` y `rango_movimiento_*` quedaban siempre `NULL` porque
nada los calculaba. Ahora `front/src/ia/KinetixAI.js` los computa cuadro a
cuadro durante la sesión (varianza del centro de cadera para estabilidad,
ángulo real de rodilla/codo para rango de movimiento) y los manda con
`finalizarSesion()`. Ver el commit `feat(webapp): calcular estabilidad y
rango de movimiento reales` para el detalle de cómo se calculan.

**Lo que sigue sin mandarse:** `precision_porcentaje` y
`repeticiones_totales` quedan `NULL` — no hay una definición obvia y
honesta de "precisión" para estos 3 juegos sin inventar un número, así que
se dejó afuera del alcance de esta vuelta. Si hace falta para el análisis,
es una decisión de diseño a tomar aparte (no asumir un valor).

## Qué datos hay disponibles hoy (tabla `metricas_sesion`, ver `back/schema.sql`)

Por cada sesión finalizada:

```
repeticiones_correctas   int              -- siempre presente (puntos/intentos según el juego)
repeticiones_totales     int | null       -- NULL hoy
precision_porcentaje     float | null     -- NULL hoy
rango_movimiento_max     float | null     -- grados, excursión angular máxima observada
rango_movimiento_avg     float | null     -- grados, desvío angular promedio respecto a la postura inicial
estabilidad_score        float | null     -- 0-100, 100 = torso perfectamente quieto
datos_ia_raw             jsonb            -- payload crudo del juego, forma distinta por juego (ver abajo)
```

`datos_ia_raw` según el juego (esto es lo que ya manda cada `*Page.jsx` en
`front/src/juegos/`):

```ts
// surf
{ juego: 'surf', puntos: number, duracion_segundos: number }
// flamenco
{ juego: 'flamenco', mejor_tiempo_segundos: number, intentos: number, duracion_segundos: number }
// estrellas
{ juego: 'estrellas', estrellas_alcanzadas: number, movimientos_pies: number, duracion_segundos: number }
```

También existe la tabla `eventos_sesion` (timeline de aciertos/repeticiones/
mensajes de feedback que mostró el juego en vivo — ver
`POST /api/sesiones/:id/eventos` en `sesionController.js`) y
`videos_sesion` (3 videos por sesión). Ninguna de las dos es necesaria para
el análisis de texto, pero están ahí si el modelo se banca mandarle más
contexto.

## Qué falta construir

1. **Elegir proveedor de modelo y conseguir API key** — no hay ninguna
   configurada hoy (ni `OPENAI_API_KEY`, ni `ANTHROPIC_API_KEY`, ni
   ningún SDK de IA generativa en `back/package.json`). Esto es una
   decisión de infraestructura, no del agente — pedirle la key a Tomás
   antes de escribir código que dependa de ella. Documentarla en
   `.env.example` igual que las demás (`GOOGLE_CLIENT_ID`, etc.), nunca
   commitear la key real.

2. **Endpoint que genere el análisis.** Sugerencia (no obligatoria, decidir
   lo que tenga más sentido):
   ```
   GET /api/sesiones/:id/analisis-ia
   ```
   - Lee la sesión + `metricas_sesion` (ya lo hace `sesionModel.findByIdConDetalle`,
     ver `back/src/models/sesion.js`).
   - Arma un prompt con las métricas reales (estabilidad, rango de
     movimiento, resultado del juego, tipo de juego) + contexto del
     paciente si aporta (edad, tipo de lesión — tabla `pacientes`).
   - Llama al modelo, devuelve el texto generado.
   - Cachear el resultado (columna nueva en `metricas_sesion`, p.ej.
     `analisis_ia text`) para no volver a llamar al modelo cada vez que se
     abre la pantalla de resultado — la sesión ya terminó, las métricas no
     cambian.

3. **Manejar el caso sin API key / sin créditos / error del modelo** — el
   endpoint no debería romper la pantalla de resultado si el modelo falla.
   Devolver algo como `{ analisis: null, error: '...' }` y que el frontend
   caiga al comentario por reglas que ya existe como fallback (no hace
   falta borrar `comentarioIA()`, dejarla de respaldo).

4. **Frontend (fuera del alcance de esta tarea de backend, pero para que
   quede claro el enganche):** `ResultadoSesion.tsx` tendría que pedir este
   endpoint nuevo y mostrar el texto ahí en vez de (o además de)
   `comentarioIA()`. No tocar el frontend en esta tarea — es un paso
   aparte una vez que el endpoint esté listo y probado.

## Qué NO tocar

- No inventar valores para `precision_porcentaje` / `repeticiones_totales`
  — si el análisis los necesita, avisar en vez de rellenar con un cálculo
  inventado.
- No tocar `front/src/ia/KinetixAI.js` ni el cálculo de estabilidad/rango
  de movimiento — ya está hecho y probado.
- No sacar `comentarioIA()` de `ResultadoSesion.tsx` — queda de fallback.

## Cómo probar

No hay tests automatizados en el proyecto. A mano:
1. Levantar back (`npm run dev` en `back/`) con la API key en `.env`.
2. Jugar una sesión completa desde el front (necesita paciente asignado
   para que se cree la sesión — ver `/pacientes/:id` → "Iniciar juego").
3. Pegarle al endpoint nuevo con el id de esa sesión y confirmar que el
   texto que devuelve menciona datos reales de esa sesión puntual (no un
   texto genérico que serviría para cualquiera).
