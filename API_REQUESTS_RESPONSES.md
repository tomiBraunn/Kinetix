# Especificación de Requests y Responses (Contrato API)

Este documento define exactamente cómo deben ser los requests y responses para todos los endpoints. Incluye: encabezados obligatorios, estructura de respuesta, errores, ejemplos CRUD, paginación, autenticación y un cliente listo para conectar con el backend (Axios y fetch).

---

## Convenciones globales

- Base URL: configurar en la app con la variable de entorno `REACT_APP_API_BASE_URL` o `API_BASE_URL`. Ejemplo: `https://api.example.com`.
- Formato de fecha/hora: ISO 8601 (ej. `2026-05-16T19:41:11.618Z`).
- Estilo de keys: camelCase (ej. `createdAt`, `userId`).
- Encabezados obligatorios en todas las llamadas JSON:
  - `Content-Type: application/json`
  - `Accept: application/json`
  - `Authorization: Bearer <token>` cuando se requiera autenticación
- Todas las respuestas JSON deben respetar el mismo wrapper (ver abajo).

---

## Wrapper de respuesta (obligatorio)

Todas las respuestas exitosas o de error deben usar exactamente esta estructura JSON:

```json
{
  "success": true | false,
  "data": <object | array | null>,
  "meta": <object | null>,
  "error": <object | null>
}
```

- `success` (boolean): indica si la operación fue exitosa.
- `data`: payload cuando `success: true`. `null` si no hay payload.
- `meta`: información adicional (p. ej. paginación). `null` si no aplica.
- `error`: objeto con detalles cuando `success: false`.

Error object (ejemplo):

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Descripción legible del error",
  "details": [
    { "field": "email", "message": "Formato inválido" }
  ]
}
```

---

## Códigos HTTP y uso

- 200 OK — operación exitosa (GET, PUT, etc.).
- 201 Created — recurso creado (POST). Incluir `Location` opcional.
- 204 No Content — opcional para deletes; preferir 200 con wrapper si se desea consistencia.
- 400 Bad Request — errores de validación. `error.code = "VALIDATION_ERROR"`.
- 401 Unauthorized — token faltante o inválido. `error.code = "UNAUTHORIZED"`.
- 403 Forbidden — permiso insuficiente. `error.code = "FORBIDDEN"`.
- 404 Not Found — recurso inexistente. `error.code = "NOT_FOUND"`.
- 409 Conflict — conflicto (ej. duplicado). `error.code = "CONFLICT"`.
- 500 Internal Server Error — `error.code = "INTERNAL_ERROR"`.

---

## Ejemplos concretos

### Listar recursos (GET /items)

Request:
```
GET /items?page=1&perPage=20 HTTP/1.1
Host: api.example.com
Accept: application/json
Authorization: Bearer <token>
```

Response (200):

```json
{
  "success": true,
  "data": [
    { "id": "1", "name": "Item 1", "createdAt": "2026-05-16T..." }
  ],
  "meta": { "page": 1, "perPage": 20, "total": 123, "totalPages": 7 },
  "error": null
}
```


### Obtener recurso (GET /items/:id)

Request:
```
GET /items/123 HTTP/1.1
Accept: application/json
Authorization: Bearer <token>
```

Response (200):

```json
{
  "success": true,
  "data": { "id": "123", "name": "Item 123" },
  "meta": null,
  "error": null
}
```

Si no existe (404):

```json
HTTP/1.1 404 Not Found
{
  "success": false,
  "data": null,
  "meta": null,
  "error": { "code": "NOT_FOUND", "message": "Item no encontrado" }
}
```

### Crear recurso (POST /items)

Request:
```
POST /items HTTP/1.1
Content-Type: application/json
Accept: application/json
Authorization: Bearer <token>

{
  "name": "Nuevo item",
  "description": "..."
}
```

Response (201):

```json
{
  "success": true,
  "data": { "id": "124", "name": "Nuevo item", "createdAt": "2026-05-16T..." },
  "meta": null,
  "error": null
}
```

### Actualizar recurso (PUT /items/:id)

Request body y headers iguales a POST. Response 200 con el recurso actualizado en `data`.

### Eliminar recurso (DELETE /items/:id)

Preferir responder con wrapper consistente:

```json
{
  "success": true,
  "data": null,
  "meta": null,
  "error": null
}
```

(Estado HTTP recomendado: 200 OK). Si se prefiere 204 No Content, documentarlo explícitamente y no enviar body.

---

## Errores de validación (400)

Ejemplo standard:

```json
HTTP/1.1 400 Bad Request
{
  "success": false,
  "data": null,
  "meta": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Formato inválido" },
      { "field": "password", "message": "Requerido" }
    ]
  }
}
```

---

## Autenticación

- Endpoint de login: `POST /auth/login` con body `{ "email": "...", "password": "..." }`.
- Respuesta exitosa debe devolver token y user en `data`:

```json
{
  "success": true,
  "data": { "token": "JWT_TOKEN", "user": { "id": "1", "email": "user@example.com" } },
  "meta": null,
  "error": null
}
```

- Usar header `Authorization: Bearer <token>` en llamadas protegidas.

---

## Subida de archivos

- Content-Type: `multipart/form-data` (no JSON para el body).
- Respuesta debe mantener el mismo wrapper JSON.

---

## Cliente listo para conectar al backend (Axios)

Archivo sugerido: `src/api/client.js`

```js
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
  timeout: 10000
});

// Attach token automatically
api.interceptors.request.use(config => {
  try {
    const token = (typeof window !== 'undefined') ? localStorage.getItem('token') : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) { /* safe fallback */ }
  return config;
});

// Normalize responses and errors to the wrapper shape
api.interceptors.response.use(
  res => {
    // res.data is expected to be the wrapper { success, data, meta, error }
    if (res.data && typeof res.data.success !== 'undefined') return res.data;
    return res;
  },
  err => {
    if (err.response && err.response.data && err.response.data.error) return Promise.reject(err.response.data.error);
    return Promise.reject({ code: 'NETWORK_ERROR', message: err.message });
  }
);

export default api;
```

Uso:

```js
// obtener lista
const resp = await api.get('/items', { params: { page: 1, perPage: 20 } });
if (resp.success) console.log(resp.data, resp.meta);

// crear
const createResp = await api.post('/items', { name: 'Nuevo' });
// createResp.data -> objeto creado
```

---

## Alternativa con fetch (wrapper mínimo)

```js
export async function apiFetch(path, opts = {}) {
  const base = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
  const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json', ...(opts.headers||{}) };
  const token = (typeof window !== 'undefined') ? localStorage.getItem('token') : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${base}${path}`, { ...opts, headers });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw (json && json.error) ? json.error : { code: 'NETWORK_ERROR', message: res.statusText };
  if (json && json.success === false) throw json.error || { code: 'API_ERROR', message: 'Error desde API' };
  return json; // wrapper
}
```

---

## Ejemplo de implementación en backend (Express) — helpers de respuesta

```js
// server.js (fragmento)
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }));
app.use(express.json());

function sendSuccess(res, data = null, meta = null, status = 200) {
  return res.status(status).json({ success: true, data, meta, error: null });
}

function sendError(res, code = 'INTERNAL_ERROR', message = 'Internal server error', details = null, status = 500) {
  return res.status(status).json({ success: false, data: null, meta: null, error: { code, message, details } });
}

app.get('/health', (req, res) => sendSuccess(res, { status: 'ok' }));

app.post('/items', (req, res) => {
  // validar y crear
  const created = { id: '123', ...req.body };
  return sendSuccess(res, created, null, 201);
});

// middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err);
  return sendError(res, err.code || 'INTERNAL_ERROR', err.message || 'Internal server error', err.details || null, err.status || 500);
});

app.listen(process.env.PORT || 3000);
```

---

## Checklist obligatoria para cada endpoint nuevo

1. Documentar URL, método HTTP y parámetros (path/query/body).
2. Mostrar ejemplo de request (headers + body si aplica).
3. Mostrar ejemplo de response exitoso (status, body usando el wrapper).
4. Mostrar ejemplo de responses de error relevantes (400, 401, 404, 500).
5. Indicar si requiere autenticación.

---

Si se desea, se pueden añadir aquí los endpoints concretos del proyecto (copiar ruta, método y payload). Mantener este archivo actualizado es obligatorio para clientes y tests automáticos.
