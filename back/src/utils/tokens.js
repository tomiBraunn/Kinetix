// Tokens aleatorios para verificación de email y reset de contraseña.
// Almacenados en la tabla kinesiologos (verification_token / reset_token).

const crypto = require('crypto');

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

const EXPIRATION = {
  verificationMs: 24 * 60 * 60 * 1000, // 24 horas
  resetMs: 60 * 60 * 1000,             // 1 hora
};

module.exports = { generateToken, EXPIRATION };
