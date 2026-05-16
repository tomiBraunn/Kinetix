# Backend Helpers (snippets listos para copiar/pegar)

Copiar y pegar cada bloque como archivo en `src/helpers/` o donde convenga. Ajustar imports y modelos según tu proyecto.

---

## 1) responseHelpers.js
```js
// responseHelpers.js
function sendSuccess(res, data = null, meta = null, status = 200) {
  return res.status(status).json({ success: true, data, meta, error: null });
}

function sendError(res, code = 'INTERNAL_ERROR', message = 'Internal server error', details = null, status = 500) {
  return res.status(status).json({ success: false, data: null, meta: null, error: { code, message, details } });
}

function sendValidationError(res, details = [], message = 'Validation failed') {
  return sendError(res, 'VALIDATION_ERROR', message, details, 400);
}

module.exports = { sendSuccess, sendError, sendValidationError };
```

---

## 2) asyncHandler.js (envoltorio para controladores async)
```js
// asyncHandler.js
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

---

## 3) ApiError (clase de error custom)
```js
// ApiError.js
class ApiError extends Error {
  constructor(code = 'INTERNAL_ERROR', message = 'Internal server error', status = 500, details = null) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

module.exports = ApiError;
```

---

## 4) authHelpers.js (JWT: sign y middleware requireAuth)
```js
// authHelpers.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, data: null, meta: null, error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
  }
  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, data: null, meta: null, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
}

module.exports = { signToken, verifyToken, requireAuth };
```

---

## 5) bcryptHelpers.js (hash/compare)
```js
// bcryptHelpers.js
const bcrypt = require('bcryptjs');
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS, 10) || 10;

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = { hashPassword, comparePassword };
```

---

## 6) validateBody.js (middleware simple de validación)
```js
// validateBody.js
module.exports = function validateBody(required = []) {
  return (req, res, next) => {
    const errors = [];
    required.forEach((f) => {
      if (req.body[f] === undefined || req.body[f] === null || req.body[f] === '') {
        errors.push({ field: f, message: 'Requerido' });
      }
    });
    if (errors.length) {
      return res.status(400).json({ success: false, data: null, meta: null, error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: errors } });
    }
    next();
  };
};
```

---

## 7) upload.js (multer memoria - subir a servicio o guardar disco)
```js
// upload.js
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB
module.exports = upload;
```

---

## 8) errorHandler.js (middleware global)
```js
// errorHandler.js
const { sendError } = require('./responseHelpers');

module.exports = function errorHandler(err, req, res, next) {
  console.error(err);
  if (err && err.code && err.status) {
    return sendError(res, err.code, err.message, err.details || null, err.status);
  }
  return sendError(res, err.code || 'INTERNAL_ERROR', err.message || 'Internal server error', err.details || null, err.status || 500);
};
```

---

## 9) Ejemplo de authController (register/login)
```js
// controllers/authController.js
const { sendSuccess, sendError } = require('../helpers/responseHelpers');
const { hashPassword, comparePassword } = require('../helpers/bcryptHelpers');
const { signToken } = require('../helpers/authHelpers');
// const User = require('../models/User'); // adapta a tu modelo/ORM

exports.register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return sendError(res, 'VALIDATION_ERROR', 'Email y password requeridos', [{ field: 'email', message: 'Requerido' }], 400);
    // validar existencia, crear usuario en tu DB
    const hashed = await hashPassword(password);
    // const user = await User.create({ email, password: hashed, name });
    const user = { id: 'generated-id', email, name }; // ejemplo
    const token = signToken({ id: user.id, email: user.email });
    return sendSuccess(res, { token, user }, null, 201);
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // const user = await User.findOne({ email });
    const user = null; // reemplazar
    if (!user) return sendError(res, 'NOT_FOUND', 'Usuario no encontrado', null, 404);
    const ok = await comparePassword(password, user.password);
    if (!ok) return sendError(res, 'UNAUTHORIZED', 'Credenciales inválidas', null, 401);
    const token = signToken({ id: user.id, email: user.email });
    return sendSuccess(res, { token, user }, null, 200);
  } catch (err) {
    next(err);
  }
};
```

---

## 10) Ejemplo de rutas (router)
```js
// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validateBody = require('../helpers/validateBody');

router.post('/register', validateBody(['email', 'password']), authController.register);
router.post('/login', validateBody(['email', 'password']), authController.login);

module.exports = router;
```

Y montar en `app.js`:
```js
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
```

---

## Instalación recomendada (dependencias)
```
npm install bcryptjs jsonwebtoken multer
```

---

## Notas
- Ajustar paths (`../helpers/...`) según dónde copies los archivos.
- Estas funciones devuelven el wrapper estándar: `{ success, data, meta, error }` para que el front los consuma sin sorpresas.
- Copiar y pegar, luego integrar con la capa de persistencia (User model, DB, etc.).

Si querés, puedo crear estos archivos directamente en `src/helpers/` y actualizar `app.js` para usarlos.
