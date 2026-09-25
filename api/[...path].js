// Vercel detecta cualquier archivo bajo api/ como función serverless.
// El catch-all [...path] hace que TODO /api/* llegue acá con el path
// original intacto (req.url = /api/sesiones/123/eventos, etc.), así que
// el propio Express de back/server.js sigue ruteando igual que en local.
module.exports = require('../back/server.js');
