# Kinetix — Memoria del proyecto

## Qué es Kinetix
App interactiva que convierte los ejercicios de kinesiología en juegos, principalmente para **adultos mayores** (tercera edad) que necesitan rehabilitación física. Mientras el paciente juega, una **IA analiza en tiempo real equilibrio, postura y movimiento** con MediaPipe. El kinesiólogo usa una computadora con un panel donde ve métricas, historial y evolución de cada paciente.

**Problema:** los ejercicios de rehabilitación son repetitivos y aburridos; la constancia y correcta ejecución son clave para la recuperación. Además, el kinesiólogo suele carecer de herramientas precisas para medir el rendimiento en tiempo real.

**Solución:** juegos divertidos que validan el movimiento + IA que mide precisión, rango de movimiento, estabilidad y progreso + panel para el kinesiólogo.

## Equipo
- **Micaela Bodner** — IA (MediaPipe, datasets, modelo de análisis de movimiento que corre server-side en el backend).
- **Mia German** — UX/UI + Project Manager (Figma: identidad visual, pantallas, marketing).
- **Tomás Braun** — **Fullstack: webapp + backend** (React del panel del kinesiólogo + Supabase, Node, auth, API REST). Soy yo, el usuario que da las indicaciones. Webapp y Backend del sprint plan son míos.
- **Rafael Shayo** — Full stack enfocado en **backend** (Node, API REST, Supabase).
- **App móvil (paciente)** — donde corren los juegos. La hace otro equipo/proyecto, NO la hace Tomás.

## Cliente / referente
**Fabián Moscovich** — kinesiólogo. Prioriza accesibilidad desde celular. Enfatiza equilibrio en adultos mayores y ejercicios descalzo.

## Arquitectura (importante)
La app está dividida en **3 capas separadas**:
1. **Webapp React (`front/`)** — panel del kinesiólogo. Dashboard, gestión de pacientes, sesiones, estadísticas, resultados. **NO** tiene cámara, ni juegos, ni MediaPipe. Todo es gestión y visualización.
2. **Backend Node (`back/`)** — API REST para la webapp (auth, pacientes, sesiones, métricas, dashboard, estadísticas). **NO** procesa video ni corre MediaPipe. Solo recibe las métricas ya calculadas desde la app móvil y las persiste en Supabase.
3. **App móvil (separada)** — corre los juegos del paciente, captura la cámara, corre **MediaPipe client-side** (landmarks + feedback en vivo en el dispositivo) y manda las métricas ya calculadas al backend para persistirlas. **No la hace Tomás**.

> **Modelo híbrido:** la detección de movimiento y el feedback en tiempo real corren en la app móvil (baja latencia, no hay que enviar video por la red). El backend solo recibe y guarda métricas/eventos. MediaPipe NO se integra en el frontend React ni en el backend.

## Stack técnico
- **Frontend webapp:** React + Vite + TypeScript (carpeta `front/`). Panel del kinesiólogo. Estilos con la paleta de la marca. Sin cámara/MediaPipe.
- **Backend:** Node.js + Express (`back/server.js`, carpeta `back/src/`) — API REST para la webapp. No procesa video.
- **IA / MediaPipe:** corre **client-side en la app móvil** del paciente (NO en el navegador ni en el backend). Landmarks 25/26 rodillas, 27/28 tobillos, 15/16 muñecas, 23/24 caderas. Calcula ángulos, estabilidad, rango de movimiento. El área de IA (Micaela) integra su módulo en la app móvil.
- **Base de datos:** Supabase (project_ref: `ihnvurzeuenwymqqyejz`). Schema en `back/schema.sql`.
- **App móvil:** proyecto separado (no en este repo). Captura cámara, corre MediaPipe + juegos, manda métricas al backend para persistir.
- **MCPs configurados:** figma (token en `.secrets/figma-token`) y supabase.

## Estructura del repo
```
Kinetix/
├── front/      # app React (Vite + TS)
├── back/       # API Node + Supabase
├── src/        # (legacy/otros)
├── .secrets/   # figma-token (no commitear)
├── opencode.json  # MCPs figma + supabase
└── AGENTS.md   # este archivo
```

## Paleta de colores (de Figma)
- `#A78BFA` (violeta), `#F472B6` (rosa), `#60A5FA` (azul), `#34D399` (verde), `#F1F5F9` (fondo claro)
- Estilo: divertido, moderno, amigable. Movimiento + tecnología.

## Juegos (concepto)
1. **Surf** — paciente descalzo sobre (simulado) tabla de surf, atrapa peces con las manos inclinándose sin perder equilibrio. Mide estabilidad, balance, tiempo de equilibrio, postura, coordinación, tiempo de reacción, evolución.
2. **Flamenco Challenge** — detecta cuando una pierna se levanta (tobillo derecho sube por encima de un umbral respecto al otro). Cronómetro arranca al levantar el pie, se detiene si baja. Mide equilibrio + tiempo. Landmarks: 27, 28 (tobillos), 25, 26 (rodillas).
3. **Alcanzá la estrella** — estrellas en distintas posiciones; el paciente las toca con la mano **sin mover los pies**. Mide equilibrio + tiempo + límites de estabilidad. Landmarks: 15, 16 (muñecas) + 27, 28 (tobillos).

Ideas adicionales descritas: semáforo (verde = sentadilla, rojo = quieto), contador de repeticiones "pro", modo desafío por tiempo, progresión de niveles, feedback en vivo (✔ bien / ❌ "bajá más la rodilla" / ⚠ "te estás inclinando"), equilibrio en plataforma, no te caigas (cuerda floja), seguir el punto, zonas de estabilidad.

**MVP:** un muy buen juego donde la IA pueda analizar un valor + toda la app manejable y entendible para el kinesiólogo y utilizable para el paciente.

## Sprint plan (6 sprints)
> S1 y S2 ya están hechos. Lo de abajo es el plan re-armado para S3–S6, alineado al estado real del repo (auditado julio 2026).

### ✅ S1 — Hecho
- **IA:** investigación MediaPipe, ángulos básicos, métricas definidas (equilibrio, estabilidad, rango).
- **UX/UI:** identidad Kinetix, logo, paleta, tipografías, componentes base.
- **Front:** proyecto base React 19 + Vite + TS + Tailwind v4, router, estilos, componentes auth.
- **Back:** setup Express + Supabase, registro/login kinesiólogo (email/pass + bcrypt + JWT), rutas protegidas, estructura en capas (routes→controllers→models).

### ✅ S2 — Hecho
- **IA:** detección en tiempo real con cámara (ajuste de cálculos en vivo).
- **UX/UI:** login y registro con estados error/éxito, landing.
- **Front:** Login + Register fully funcionales (validación, framer-motion, Google OAuth redirect), AuthContext + localStorage + AuthRoute/PublicRoute, Home como mockup estático, conexión con backend vía proxy `/api`.
- **Back:** OAuth Google (popup + redirect con Passport) y GitHub, CRUD de pacientes completo (crear/listar/get/update/delete con aislamiento por kinesiólogo), upload de imágenes a Supabase Storage (avatars + fotos paciente), avatares SVG automáticos, tests `test.js` + `api.rest`.

---

### 🚧 S3 — Dashboard + Gestión de pacientes
> Convierte el Home mockup en un dashboard real y conecta la UI de pacientes al CRUD que ya existe en backend.

**Webapp (Tomás):**
- Reemplazar `Home.tsx` mockup por dashboard real con datos del backend.
- Layout de dashboard: **navbar lateral** (Pacientes, Sesiones, Estadísticas, Configuración) con estado activo + header con avatar/nombre del kinesiólogo (usar `AuthContext`).
- **Pantalla Lista de pacientes** (`/pacientes`): tabla/cards con nombre, apellido, lesión, progreso; botón "+ Agregar paciente"; click → detalle. Conectar a `GET /api/pacientes`.
- **Pantalla Crear paciente** (`/pacientes/nuevo`): formulario (nombre, apellido, fecha_nacimiento, tipo_lesion, observaciones, contacto) → `POST /api/pacientes`.
- **Pantalla Detalle de paciente** (`/pacientes/:id`): datos + editar + botón "Iniciar juego" → `GET/PUT /api/pacientes/:id`.

**Backend (Tomás):**
- **Endpoints de dashboard**: `GET /api/dashboard` (resumen: #pacientes activos, #sesiones hoy, total pacientes, evolución).
- Alinear `schema.sql` con la BD real (tablas en plural `kinesiologos`/`pacientes`; campos reales `fecha_nacimiento`, `tipo_lesion`, `observaciones`, `activo`).
- Crear `.env.example` documentando las vars requeridas.

**UX/UI (Mia):**
- Diseño del dashboard real (menú lateral, header, cards de stats, tabla de pacientes).
- Pantallas: lista de pacientes, crear, detalle/Editar. Alineadas al Figma.

#### S3 — Diseños en Figma (página "Proyecto final", archivo "Presentacion Kinetix")
Archivo Figma: `y8NlmFOJusZ1nl1jvvZdBo`, página "Proyecto final".

**Diseños ya existentes:**
| Pantalla | ID frame | Estado |
|---|---|---|
| Home / Dashboard | `275:157` (1440×1024) | ✅ Diseñado. Sidebar (Home, Pacientes, Juegos, Análisis) + header (Dr. Chen / Kinesiologo / Support / Logout) + saludo "Hola, Dr. Simon" + botón "Iniciar Nueva Sesión" + cards (consejo del día, frases decorativas). |
| Pacientes (lista) | `324:47` (1440×1024) | ✅ Diseñado. Título "Todos tus pacientes" + tabla (Paciente, EDAD, MEJORAR [lesión], Última sesión, PROGRESO [%]) + "Ordenar por" + paginación + botón "Agendar nuevo paciente". |
| Pacientes (lista) - error | `407:1255` | ✅ Diseñado (estado de error). |
| Registro Pacientes (crear) | `407:1047` (1440×1406) | ✅ Diseñado. Formulario con secciones: Información Personal (Nombre y Apellido, contacto de emergencia [nombre + teléfono], DNI, Mail, Género, Edad, Teléfono) y Detalles (Observaciones médicas, Fecha de inicio de rehabilitación). Botones "Agendar nuevo paciente" + "Cancelar". |
| Registro Pacientes (crear) - error | `407:959` | ✅ Diseñado (estado de error). |
| Registro Pacientes (mobile) | `402:39` (402×970) | ✅ Diseñado (versión mobile del formulario). |
| Login, Register, Landing | varios | ✅ Diseñados (ya implementados en S2). |

**Diseños que FALTAN para S3:**
| Pantalla | Estado | Nota |
|---|---|---|
| Detalle / Editar paciente | ❌ No diseñado | Pantalla con datos del paciente + edición + botón "Iniciar juego". No existe en Figma. Mia la tiene que diseñar. |

**Discrepancias detectadas entre el diseño y el backend (a resolver en S3):**
1. **Sidebar:** el diseño tiene `Home, Pacientes, Juegos, Análisis`. El plan dice `Pacientes, Sesiones, Estadísticas, Configuración`. Alinear con el diseño de Figma.
2. **Campos del formulario de paciente:** el diseño de Figma pide `Nombre y Apellido, contacto de emergencia (nombre + teléfono), DNI, Mail, Género, Edad, Teléfono, Observaciones médicas, Fecha de inicio de rehabilitación`. El backend actual tiene `nombre, apellido, fecha_nacimiento, tipo_lesion, observaciones, activo`. Hay que decidir: ampliar el backend para soportar los campos del diseño (DNI, mail, género, teléfono, contacto de emergencia, fecha de inicio) o simplificar el formulario. Recomendación: alinear el backend al diseño de Figma.
3. **"Edad" vs "fecha_nacimiento":** el diseño pide "Edad" pero el backend guarda `fecha_nacimiento`. Se puede guardar fecha de nacimiento y calcular la edad, o pedir edad directa.
4. **"MEJORAR" en la tabla:** el diseño llama "MEJORAR" a la columna de lesión (ej: "Lesión de rodilla"). En backend es `tipo_lesion`.

---

### 🚧 S4 — Sesiones + Recepción de métricas
> La detección de movimiento con MediaPipe y el feedback en vivo corren en la **app móvil** del paciente. El backend no procesa video: solo recibe las métricas ya calculadas y las guarda en Supabase.

**Backend (Tomás):**
- **Model/controller/routes de sesiones** (tabla `sesiones`). Endpoints:
  - `POST /api/sesiones` — iniciar sesión (paciente_id, kinesiologo_id, juego, fecha_inicio).
  - `PUT /api/sesiones/:id/finalizar` — cerrar sesión (duración, notas, puntaje).
  - `GET /api/sesiones?paciente_id=` — listar sesiones por paciente.
  - `GET /api/sesiones/:id` — detalle de una sesión.
- **Model/controller/routes de métricas** (tabla `metricas`). Endpoints:
  - `POST /api/sesiones/:id/metricas` — recibir métricas ya calculadas desde la app móvil (tipo, valor, unidad, timestamp). Soporte batch (array por ventana de frames).
  - `GET /api/sesiones/:id/metricas` — métricas crudas de una sesión (para S6).
- Definir **contrato de métricas** con Micaela: tipos (`angulo_rodilla`, `estabilidad`, `rango_movimiento`, `precision`, `repeticion`, `tiempo_equilibrio`), unidades, formato JSON y frecuencia de envío. La app móvil manda las métricas ya calculadas; el backend solo las persiste.

**IA (Micaela):**
- Módulo de análisis **client-side en la app móvil**: calcular ángulos (rodilla, tobillo, cadera), estabilidad (varianza del centro de masa), rango de movimiento.
- Feedback en vivo en el dispositivo usando los landmarks detectados por MediaPipe.
- Definir y documentar el contrato de métricas (tipos, unidades, frecuencia de envío).

**Frontend (Tomás):**
- **Pantalla Selección de juego** (`/juego`): cards de los 3 juegos (Surf, Flamenco, Alcanzá la estrella) seleccionables.
- Inicio de sesión desde la webapp: al elegir paciente + juego, llamar `POST /api/sesiones` para registrar el inicio y disparar la sesión en la app móvil del paciente.

**UX/UI (Mia):**
- Pantalla de selección de juego (grilla de 3 juegos como cards).

---

### 🚧 S5 — Juegos funcionales + Feedback en vivo (app móvil)
> La lógica de los juegos y el feedback inteligente corren en la **app móvil** del paciente sobre los landmarks detectados por MediaPipe. El backend solo recibe y guarda lo que el móvil le manda.

**App móvil (otro equipo) + IA (Micaela):**
- **Juego Flamenco Challenge** (S3 de IA original):
  - Detectar pierna levantada (tobillo 27 vs 28, umbral de altura relativa).
  - Cronómetro: arranca al levantar el pie, se detiene al bajar.
  - Puntaje por segundos de equilibrio por pierna.
  - Feedback visual (✔/❌/⚠) en vivo en el dispositivo.
- **Juego Alcanzá la estrella** (S4 de IA original):
  - Estrellas en posiciones aleatorias; colisión muñeca (15/16) ↔ estrella.
  - Verificar que tobillos (27/28) no se desplacen > umbral.
  - Puntaje por precisión + estabilidad.
- **Juego Surf** (opcional si hay tiempo):
  - Paciente descalzo, atrapa peces con las manos inclinándose.
  - Mide estabilidad, balance, tiempo de equilibrio, coordinación, tiempo de reacción.
- Feedback inteligente en tiempo real en el dispositivo: "Muy bien" / "Subí más la pierna" / "No muevas los pies" / "Te estás inclinando".
- La app móvil manda al backend los eventos de juego (aciertos, repeticiones, fin de juego) y el timeline de feedback.
- **Grabación de la sesión**: la app móvil guarda 3 versiones del video del ejercicio:
  1. Video crudo (raw, tal como lo capta la cámara).
  2. Video con la detección de partes del cuerpo (landmarks de MediaPipe dibujados sobre el video).
  3. Video con el juego renderizado por encima (gameplay + overlay).
  - Al finalizar, la app móvil sube las 3 versiones al backend.

**Backend (Tomás):**
- **Endpoint de feedback**: `POST /api/sesiones/:id/feedback` para recibir y guardar el timeline de feedback que manda la app móvil.
- **Endpoint de videos**: `POST /api/sesiones/:id/videos` para recibir y guardar en Supabase Storage las 3 versiones del video (crudo, con detección de partes, con juego renderizado).
- Asegurar que el guardado de métricas funcione bajo carga (30fps → batch cada 1s).

**IA (Micaela):**
- Validación de movimientos específicos por juego (umbral de pierna levantada, colisión muñeca-estrella, desplazamiento de tobillos).
- Reglas de puntuación y detección de repeticiones correctas/incorrectas.

**UX/UI (Mia):**
- Diseño del gameplay (para la app móvil, no para la webapp): cámara + overlay + HUD (puntaje, tiempo, repeticiones, feedback).
- Animaciones de acierto/error (peces agarrados, estrellas tocadas, flamenco).

---

### 🚧 S6 — Resultados, métricas y panel del kinesiólogo
> Cierra el flujo: el kinesiólogo ve la evolución de cada paciente.

**Frontend (Tomás):**
- **Pantalla Resultados / análisis** (`/pacientes/:id/sesiones/:sesionId/resultados`):
  - Repeticiones correctas, rango de movimiento, precisión, tiempo total, puntaje.
  - Visualización con barras / indicadores.
  - Reproducción de las 3 versiones del video de la sesión (crudo, con detección de partes, con juego renderizado).
  - Botón "Guardar sesión" (si no se guardó automáticamente) + "Volver a pacientes".
- **Historial de sesiones** por paciente: lista con fecha, juego, duración, puntaje.
- **Pantalla Estadísticas** (`/estadisticas`): evolución del paciente (gráfico de progreso entre sesiones), promedios globales.

**Backend (Tomás):**
- `GET /api/pacientes/:id/sesiones` — historial con métricas resumidas.
- `GET /api/sesiones/:id/metricas` — métricas crudas de una sesión (para gráficos detallados).
- `GET /api/sesiones/:id/videos` — devolver las 3 versiones del video de la sesión (crudo, con detección de partes, con juego renderizado) para que la webapp las reproduzca.
- `GET /api/estadisticas` — promedios globales del kinesiólogo (precisión promedio, rango promedio, sesiones totales).

**IA (Micaela):**
- Integración final: persistir todas las métricas en cada sesión.
- Métricas resumidas por sesión (promedios, máximos, mínimos) para el panel.

**UX/UI (Mia):**
- Pantalla de resultados con gráficos simples (barras de precisión/rango, línea de progreso entre sesiones).
- Resumen de desempeño + opciones de navegación final.

---

## Estado actual del repo (julio 2026)
- Últimos commits: `f6b3666` (chore: AGENTS.md + .gitignore), `b459b87` (fix test .env), `3b72332` (dashboard endpoint), `2a02a1e` (campos Figma pacientes), `48ad077` (schema.sql + .env.example).
- **S1 + S2 completos.** Auth (email/pass + Google + GitHub), CRUD pacientes, upload imágenes, login/register UI, router, AuthContext.
- **S3 backend completado** (commit `48ad077` → `3b72332`): schema.sql alineado con BD real, `.env.example`, CRUD pacientes con campos de Figma (dni, email_paciente, telefono, genero, contacto_emergencia_nombre/telefono, fecha_inicio_rehabilitacion), `GET /api/dashboard` (total_pacientes, pacientes_activos, sesiones_hoy). Migración `pacientes_campos_figma` aplicada.
- **S3 webapp (pendiente):** reemplazar `Home.tsx` mockup por dashboard real + pantallas de pacientes.
- **Pendiente:** sesiones (S4), métricas (S4), integración IA, juegos, resultados, dashboard real / gestión de pacientes UI (S3 webapp).
- `schema.sql` ya alineado con la BD real (campos con campos reales).
- Tablas `sesiones` y `metricas` definidas en SQL pero sin código (se implementan en S4).
- Hay código legacy en `src/` (landing + prototipo Phaser Surf) NO conectado al `front/src/` actual.
- `Home.tsx` es mockup estático con números hardcodeados (se reemplaza en S3).
- **RLS:** habilitado en todas las tablas (`kinesiologos`, `metricas` incluidos) — quedan sin políticas (info), ok porque todo el acceso va por backend con service_role key.

## Funcionamiento general / flujo
1. El kinesiólogo entra desde la webapp, crea o selecciona un paciente e inicia una sesión de juego.
2. La app móvil del paciente captura la cámara y corre MediaPipe client-side: detecta landmarks, calcula ángulos/estabilidad/rango, evalúa la regla del juego y muestra feedback en vivo en el dispositivo.
3. La app móvil manda las métricas y eventos ya calculados al backend, que los persiste en Supabase.
4. La webapp del kinesiólogo consume la API REST para ver dashboard, historial, resultados y evolución.
Todo conectado por pedidos entre webapp, backend (API REST) y app móvil (MediaPipe + juegos).

## Links clave
- Figma prototipo: https://www.figma.com/design/6lxl14iq4Ur2PfRT2GUjh8/Proyecto-2026?node-id=0-1
- Figma presentación: https://www.figma.com/design/y8NlmFOJusZ1nl1jvvZdBo/Presentacion-Kinetix?node-id=0-1
- Figma marketing: https://www.figma.com/design/uZgIvrU8W2ODJKw3Zggmq3/Kinetix---Marketing?node-id=0-1
- Trello: https://trello.com/b/6a02078bea14e403ad074b0b/kinetix-tareas

## Notas de contexto
- El usuario que da las indicaciones es **Tomás Braun** (backend). Cuando habla de "yo" en el contexto del proyecto, se refiere a su rol de backend/full stack.
- Antes de crear archivos o hacer cambios grandes, confirmar con Tomás.
- Para diseño visual, consultar los Figma de arriba (hay MCP de figma configurado con token en `.secrets/figma-token`).
- Para base de datos, hay MCP de Supabase configurado.
- No commitear `.secrets/`, `.env`, ni `server.log` / `*.log`.
